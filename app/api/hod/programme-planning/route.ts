import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'HOD' && session.role !== 'MASTERADMIN' && session.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId') || session.departmentId;

  if (!departmentId) {
    return NextResponse.json({ error: 'Department ID required.' }, { status: 400 });
  }

  const [department, activeReg, activeAY, stages, creditConfig] = await Promise.all([
    prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        hod: { select: { name: true, email: true, userCode: true } },
      },
    }),
    prisma.regulation.findFirst({ where: { active: true } }),
    prisma.academicYear.findFirst({ where: { active: true } }),
    prisma.academicStage.findMany({ orderBy: { order: 'asc' } }),
    prisma.creditConfig.findUnique({ where: { id: 'default-credit-config' } }),
  ]);

  if (!department) {
    return NextResponse.json({ error: 'Department not found.' }, { status: 404 });
  }

  if (!activeReg || !activeAY) {
    return NextResponse.json({ error: 'Active Regulation or Academic Year not configured.' }, { status: 400 });
  }

  // Evaluate Step 2 unlock status
  const stage1 = stages.find((s) => s.order === 1);
  const stage2 = stages.find((s) => s.order === 2);
  const now = new Date();
  const isStage1Completed = stage1?.status === 'COMPLETED';
  const isStage2TimeStarted = stage2?.startDate ? now >= new Date(stage2.startDate) : false;
  const isStep2Unlocked = Boolean(isStage1Completed && isStage2TimeStarted);

  // Fetch all planned subjects for this department's programme
  const plannedItems = await prisma.programmeSubjectPlan.findMany({
    where: {
      departmentId,
      regulationId: activeReg.id,
      academicYearId: activeAY.id,
    },
    include: {
      subject: {
        include: {
          department: {
            select: { id: true, shortName: true, programmeName: true, departmentCode: true },
          },
          subjectType: true,
          subjectCategory: true,
          assignedFaculty: { select: { name: true, email: true, userCode: true } },
          submission: {
            include: {
              objectives: { orderBy: { order: 'asc' } },
              syllabusUnits: { orderBy: { unitNumber: 'asc' } },
              experiments: { orderBy: { experimentNumber: 'asc' } },
              courseOutcomes: { orderBy: { coNumber: 'asc' } },
              textbooks: { orderBy: { order: 'asc' } },
              references: { orderBy: { order: 'asc' } },
              coPoMappings: true,
              coPoJustifications: true,
              sdgMappings: true,
            },
          },
        },
      },
    },
    orderBy: [
      { semester: 'asc' },
      { order: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  // Fetch or inspect ProgrammeCurriculumSubmission
  const submission = await prisma.programmeCurriculumSubmission.findUnique({
    where: {
      departmentId_regulationId_academicYearId: {
        departmentId,
        regulationId: activeReg.id,
        academicYearId: activeAY.id,
      },
    },
    include: {
      submittedBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
    },
  });

  // Parse MasterAdmin Governance Rules
  const minTotalCredits = creditConfig?.minTotalCredits ?? 160.0;
  const maxTotalCredits = creditConfig?.maxTotalCredits ?? 165.0;
  const minSemCredits = creditConfig?.minSemCredits ?? 20.0;
  const maxSemCredits = creditConfig?.maxSemCredits ?? 24.0;
  const maxLabPerSem = creditConfig?.maxLabPerSem ?? 2;
  const maxLabTotal = creditConfig?.maxLabTotal ?? 8;
  const maxLabOrientedPerSem = creditConfig?.maxLabOrientedPerSem ?? 2;

  let targetComposition: Record<string, number> = {
    PC: 45,
    PE: 15,
    OE: 6,
    HS: 7,
    BS: 15,
    ES: 9,
    EEC: 3,
  };

  try {
    if (creditConfig?.categoryComposition) {
      const parsed = JSON.parse(creditConfig.categoryComposition);
      if (typeof parsed === 'object') {
        targetComposition = { ...targetComposition, ...parsed };
      }
    }
  } catch (e) {
    // Keep defaults
  }

  // Calculate real-time constraints
  let totalCredits = 0;
  const semCreditsMap: Record<number, number> = {};
  const semLabsMap: Record<number, number> = {};
  const semLabOrientedMap: Record<number, number> = {};
  const categoryCreditsMap: Record<string, number> = {};
  let totalLabsCount = 0;

  // Initialize semester maps
  for (let s = 1; s <= (department.semesters || 8); s++) {
    semCreditsMap[s] = 0;
    semLabsMap[s] = 0;
    semLabOrientedMap[s] = 0;
  }

  for (const item of plannedItems) {
    const subj = item.subject;
    if (!subj) continue;

    const cred = subj.credits || 0;
    const sem = item.semester;
    totalCredits += cred;

    semCreditsMap[sem] = (semCreditsMap[sem] || 0) + cred;

    const typeName = (subj.subjectType?.name || '').toLowerCase();
    const isLab = typeName.includes('lab') && !typeName.includes('oriented');
    const isLabOriented = typeName.includes('lab-oriented') || typeName.includes('lab oriented');

    if (isLab) {
      semLabsMap[sem] = (semLabsMap[sem] || 0) + 1;
      totalLabsCount += 1;
    }
    if (isLabOriented) {
      semLabOrientedMap[sem] = (semLabOrientedMap[sem] || 0) + 1;
    }

    const catCode = subj.subjectCategory?.code || 'OTHER';
    categoryCreditsMap[catCode] = (categoryCreditsMap[catCode] || 0) + cred;
  }

  // Violations collection
  const violations: string[] = [];

  // Overall credits constraint
  if (totalCredits < minTotalCredits || totalCredits > maxTotalCredits) {
    violations.push(
      `Overall Programme Credits (${totalCredits} C) must be between ${minTotalCredits} and ${maxTotalCredits} C.`
    );
  }

  // Total labs across programme
  if (totalLabsCount > maxLabTotal) {
    violations.push(`Total Laboratory courses (${totalLabsCount}) exceeds maximum allowed (${maxLabTotal}).`);
  }

  // Semester level constraints
  for (let s = 1; s <= (department.semesters || 8); s++) {
    const semCred = semCreditsMap[s] || 0;
    const semLabs = semLabsMap[s] || 0;
    const semLabOriented = semLabOrientedMap[s] || 0;

    if (semCred > 0 && (semCred < minSemCredits || semCred > maxSemCredits)) {
      violations.push(
        `Semester ${s} has ${semCred} C (Allowed: ${minSemCredits} – ${maxSemCredits} Credits/Semester).`
      );
    }
    if (semLabs > maxLabPerSem) {
      violations.push(`Semester ${s} has ${semLabs} Labs (Max allowed: ${maxLabPerSem} Labs/Semester).`);
    }
    if (semLabOriented > maxLabOrientedPerSem) {
      violations.push(
        `Semester ${s} has ${semLabOriented} Lab-Oriented Theory courses (Max allowed: ${maxLabOrientedPerSem}/Semester).`
      );
    }
  }

  // Category composition calculations & exact credit requirements
  const categoryBreakdown: Record<
    string,
    { credits: number; targetPct: number; expectedCredits: number; isValid: boolean }
  > = {};

  for (const [catCode, targetPct] of Object.entries(targetComposition)) {
    const actualCred = categoryCreditsMap[catCode] || 0;
    const expectedCredits = totalCredits > 0 ? Math.round(totalCredits * (targetPct / 100)) : 0;
    const isValid = totalCredits > 0 ? actualCred === expectedCredits : false;

    categoryBreakdown[catCode] = {
      credits: actualCred,
      targetPct,
      expectedCredits,
      isValid,
    };

    if (totalCredits > 0 && actualCred !== expectedCredits) {
      violations.push(
        `Category ${catCode} requires ${expectedCredits} C (${targetPct}% of ${totalCredits} C), but currently has ${actualCred} C.`
      );
    }
  }

  const isValidProgramme = violations.length === 0 && totalCredits >= minTotalCredits && plannedItems.length > 0;

  return NextResponse.json({
    isStep2Unlocked,
    isStage1Completed,
    isStage2TimeStarted,
    stage1,
    stage2,
    department,
    plannedItems,
    submission,
    creditConfig: {
      minTotalCredits,
      maxTotalCredits,
      minSemCredits,
      maxSemCredits,
      maxLabPerSem,
      maxLabTotal,
      maxLabOrientedPerSem,
      targetComposition,
    },
    constraints: {
      totalCredits,
      semCreditsMap,
      semLabsMap,
      semLabOrientedMap,
      categoryCreditsMap,
      categoryBreakdown,
      totalLabsCount,
      violations,
      isValidProgramme,
    },
  });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'HOD' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. HoD role required.' }, { status: 403 });
  }

  const body = await req.json();
  const { action } = body;

  const departmentId = body.departmentId || session.departmentId;
  if (!departmentId) {
    return NextResponse.json({ error: 'Department ID required.' }, { status: 400 });
  }

  const [activeReg, activeAY] = await Promise.all([
    prisma.regulation.findFirst({ where: { active: true } }),
    prisma.academicYear.findFirst({ where: { active: true } }),
  ]);

  if (!activeReg || !activeAY) {
    return NextResponse.json({ error: 'Active Regulation or Academic Year not configured.' }, { status: 400 });
  }

  // 1. ADD SUBJECT TO SEMESTER PLAN
  if (action === 'ADD_SUBJECT') {
    const { semester, subjectId } = body;
    if (!semester || !subjectId) {
      return NextResponse.json({ error: 'Semester and subjectId are required.' }, { status: 400 });
    }

    // Verify subject is approved
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, syllabusStatus: true, subjectCode: true },
    });

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
    }

    if (subject.syllabusStatus !== 'APPROVED') {
      return NextResponse.json(
        { error: `Subject ${subject.subjectCode} is not approved by Dean yet.` },
        { status: 400 }
      );
    }

    // Check if subject is already in this department's plan
    const existing = await prisma.programmeSubjectPlan.findFirst({
      where: {
        departmentId,
        regulationId: activeReg.id,
        academicYearId: activeAY.id,
        subjectId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Subject is already added to Semester ${existing.semester} of this programme.` },
        { status: 400 }
      );
    }

    const maxOrder = await prisma.programmeSubjectPlan.findFirst({
      where: {
        departmentId,
        regulationId: activeReg.id,
        academicYearId: activeAY.id,
        semester: Number(semester),
      },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const planned = await prisma.programmeSubjectPlan.create({
      data: {
        departmentId,
        regulationId: activeReg.id,
        academicYearId: activeAY.id,
        semester: Number(semester),
        subjectId,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'ADD_PROGRAMME_SUBJECT',
      entity: 'ProgrammeSubjectPlan',
      entityId: planned.id,
      details: { departmentId, semester, subjectId },
    });

    return NextResponse.json({ success: true, planned });
  }

  // 2. REMOVE SUBJECT FROM SEMESTER PLAN
  if (action === 'REMOVE_SUBJECT') {
    const { id, subjectId, semester } = body;

    let targetId = id;
    if (!targetId && subjectId && semester) {
      const match = await prisma.programmeSubjectPlan.findFirst({
        where: {
          departmentId,
          regulationId: activeReg.id,
          academicYearId: activeAY.id,
          semester: Number(semester),
          subjectId,
        },
        select: { id: true },
      });
      targetId = match?.id;
    }

    if (!targetId) {
      return NextResponse.json({ error: 'Plan item not found.' }, { status: 404 });
    }

    await prisma.programmeSubjectPlan.delete({
      where: { id: targetId },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'REMOVE_PROGRAMME_SUBJECT',
      entity: 'ProgrammeSubjectPlan',
      entityId: targetId,
      details: { departmentId },
    });

    return NextResponse.json({ success: true });
  }

  // 3. SUBMIT PROGRAMME CURRICULUM BOOK TO DEAN
  if (action === 'SUBMIT_CURRICULUM') {
    // Check if Step 2 is unlocked
    const stages = await prisma.academicStage.findMany({ orderBy: { order: 'asc' } });
    const stage1 = stages.find((s) => s.order === 1);
    const stage2 = stages.find((s) => s.order === 2);
    const now = new Date();
    const isStage1Completed = stage1?.status === 'COMPLETED';
    const isStage2TimeStarted = stage2?.startDate ? now >= new Date(stage2.startDate) : false;

    if (!isStage1Completed || !isStage2TimeStarted) {
      return NextResponse.json(
        { error: 'Programme Planning (Step 2) is locked. Cannot submit at this time.' },
        { status: 400 }
      );
    }

    // Upsert submission
    const submission = await prisma.programmeCurriculumSubmission.upsert({
      where: {
        departmentId_regulationId_academicYearId: {
          departmentId,
          regulationId: activeReg.id,
          academicYearId: activeAY.id,
        },
      },
      update: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedById: session.userId,
        correctionReason: null,
      },
      create: {
        departmentId,
        regulationId: activeReg.id,
        academicYearId: activeAY.id,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submittedById: session.userId,
      },
    });

    // Notify Dean
    const dean = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN', active: true },
    });

    const dept = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { shortName: true, programmeName: true },
    });

    if (dean) {
      await prisma.notification.create({
        data: {
          recipientId: dean.id,
          title: `Programme Curriculum Book Submitted: ${dept?.shortName || 'Department'}`,
          message: `HoD has submitted the complete Programme Curriculum Book for ${dept?.programmeName} (Step 2) for your review and approval.`,
          type: 'BUNDLE_SUBMITTED',
          relatedEntity: submission.id,
        },
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'SUBMIT_PROGRAMME_CURRICULUM_BOOK',
      entity: 'ProgrammeCurriculumSubmission',
      entityId: submission.id,
      details: { departmentId, status: 'SUBMITTED' },
    });

    return NextResponse.json({ success: true, submission });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}
