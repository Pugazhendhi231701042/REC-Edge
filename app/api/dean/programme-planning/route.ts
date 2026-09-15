import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. Dean role required.' }, { status: 401 });
  }

  const [departments, activeReg, activeAY, creditConfig, stages] = await Promise.all([
    prisma.department.findMany({
      where: { active: true },
      include: {
        hod: { select: { id: true, name: true, email: true, userCode: true } },
      },
      orderBy: { shortName: 'asc' },
    }),
    prisma.regulation.findFirst({ where: { active: true } }),
    prisma.academicYear.findFirst({ where: { active: true } }),
    prisma.creditConfig.findUnique({ where: { id: 'default-credit-config' } }),
    prisma.academicStage.findMany({ orderBy: { order: 'asc' } }),
  ]);

  if (!activeReg || !activeAY) {
    return NextResponse.json({ error: 'Active Regulation or Academic Year not configured.' }, { status: 400 });
  }

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

  // Step 2 unlock status
  const stage1 = stages.find((s) => s.order === 1);
  const stage2 = stages.find((s) => s.order === 2);
  const now = new Date();
  const isStage1Completed = stage1?.status === 'COMPLETED';
  const isStage2TimeStarted = stage2?.startDate ? now >= new Date(stage2.startDate) : false;
  const isStep2Unlocked = Boolean(isStage1Completed && isStage2TimeStarted);

  // Fetch plans and submissions for all departments
  const departmentPlans = await Promise.all(
    departments.map(async (dept) => {
      const [plannedItems, submission, poStatements, psoStatements, peoStatements] = await Promise.all([
        prisma.programmeSubjectPlan.findMany({
          where: {
            departmentId: dept.id,
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
          orderBy: [{ semester: 'asc' }, { order: 'asc' }],
        }),
        prisma.programmeCurriculumSubmission.findUnique({
          where: {
            departmentId_regulationId_academicYearId: {
              departmentId: dept.id,
              regulationId: activeReg.id,
              academicYearId: activeAY.id,
            },
          },
          include: {
            submittedBy: { select: { name: true, email: true } },
            approvedBy: { select: { name: true, email: true } },
          },
        }),
        prisma.programOutcomeStatement.findMany({
          where: { departmentId: dept.id, regulationId: activeReg.id },
          orderBy: { poKey: 'asc' },
        }),
        prisma.programSpecificOutcomeStatement.findMany({
          where: { departmentId: dept.id, regulationId: activeReg.id },
          orderBy: { psoKey: 'asc' },
        }),
        prisma.programEducationalObjectiveStatement.findMany({
          where: { departmentId: dept.id, regulationId: activeReg.id },
          orderBy: { peoKey: 'asc' },
        }),
      ]);

      // Calculate totals and metrics
      let totalCredits = 0;
      const semCreditsMap: Record<number, number> = {};
      const semLabsMap: Record<number, number> = {};
      const categoryCreditsMap: Record<string, number> = {};
      let totalLabs = 0;

      for (let s = 1; s <= (dept.semesters || 8); s++) {
        semCreditsMap[s] = 0;
        semLabsMap[s] = 0;
      }

      for (const item of plannedItems) {
        const subj = item.subject;
        if (!subj) continue;

        const cred = subj.credits || 0;
        totalCredits += cred;
        semCreditsMap[item.semester] = (semCreditsMap[item.semester] || 0) + cred;

        const typeName = (subj.subjectType?.name || '').toLowerCase();
        if (typeName.includes('lab') && !typeName.includes('oriented')) {
          semLabsMap[item.semester] = (semLabsMap[item.semester] || 0) + 1;
          totalLabs += 1;
        }

        const catCode = subj.subjectCategory?.code || 'OTHER';
        categoryCreditsMap[catCode] = (categoryCreditsMap[catCode] || 0) + cred;
      }

      const violations: string[] = [];
      if (totalCredits < minTotalCredits || totalCredits > maxTotalCredits) {
        violations.push(`Total credits: ${totalCredits} C (Target: ${minTotalCredits}–${maxTotalCredits} C)`);
      }
      if (totalLabs > maxLabTotal) {
        violations.push(`Total labs: ${totalLabs} (Max: ${maxLabTotal})`);
      }

      for (let s = 1; s <= (dept.semesters || 8); s++) {
        const sc = semCreditsMap[s] || 0;
        if (sc > 0 && (sc < minSemCredits || sc > maxSemCredits)) {
          violations.push(`Sem ${s}: ${sc} C`);
        }
      }

      const categoryBreakdown: Record<string, any> = {};
      const creditBase = minTotalCredits > 0 ? minTotalCredits : 160.0;
      for (const [catCode, targetPct] of Object.entries(targetComposition)) {
        const actual = categoryCreditsMap[catCode] || 0;
        const expected = Math.round(creditBase * (targetPct / 100));
        const valid = actual === expected;
        categoryBreakdown[catCode] = { actual, targetPct, expected, valid };
        if (totalCredits >= minTotalCredits && actual !== expected) {
          violations.push(`${catCode}: ${actual} C vs ${expected} C expected (${targetPct}% of ${creditBase} C)`);
        }
      }

      const isValid = violations.length === 0 && totalCredits >= minTotalCredits && plannedItems.length > 0;

      return {
        department: dept,
        plannedSubjectsCount: plannedItems.length,
        totalCredits,
        semCreditsMap,
        semLabsMap,
        categoryCreditsMap,
        categoryBreakdown,
        totalLabs,
        violations,
        isValid,
        submission,
        plannedItems,
        poStatements,
        psoStatements,
        peoStatements,
      };
    })
  );

  return NextResponse.json({
    isStep2Unlocked,
    isStage1Completed,
    isStage2TimeStarted,
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
    departmentPlans,
  });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. Dean role required.' }, { status: 403 });
  }

  const body = await req.json();
  const { action, departmentId, correctionReason } = body;

  if (!departmentId) {
    return NextResponse.json({ error: 'Department ID is required.' }, { status: 400 });
  }

  const [activeReg, activeAY] = await Promise.all([
    prisma.regulation.findFirst({ where: { active: true } }),
    prisma.academicYear.findFirst({ where: { active: true } }),
  ]);

  if (!activeReg || !activeAY) {
    return NextResponse.json({ error: 'Active Regulation or Academic Year not configured.' }, { status: 400 });
  }

  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    include: { hod: true },
  });

  if (!dept) {
    return NextResponse.json({ error: 'Department not found.' }, { status: 404 });
  }

  // 1. APPROVE PROGRAMME CURRICULUM BOOK
  if (action === 'APPROVE') {
    const updated = await prisma.programmeCurriculumSubmission.update({
      where: {
        departmentId_regulationId_academicYearId: {
          departmentId,
          regulationId: activeReg.id,
          academicYearId: activeAY.id,
        },
      },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: session.userId,
        correctionReason: null,
      },
    });

    if (dept.hodId) {
      await prisma.notification.create({
        data: {
          recipientId: dept.hodId,
          title: `Programme Curriculum Book Approved!`,
          message: `Dean has approved the Programme Curriculum Book for ${dept.programmeName}. It is now officially approved for BoS / DAC meetings.`,
          type: 'BUNDLE_APPROVED',
          relatedEntity: updated.id,
        },
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'APPROVE_PROGRAMME_CURRICULUM_BOOK',
      entity: 'ProgrammeCurriculumSubmission',
      entityId: updated.id,
      details: { departmentId, status: 'APPROVED' },
    });

    return NextResponse.json({ success: true, submission: updated });
  }

  // 2. RETURN PROGRAMME CURRICULUM BOOK FOR CORRECTION
  if (action === 'RETURN') {
    if (!correctionReason || !correctionReason.trim()) {
      return NextResponse.json({ error: 'Feedback / Correction remarks are required when returning.' }, { status: 400 });
    }

    const updated = await prisma.programmeCurriculumSubmission.update({
      where: {
        departmentId_regulationId_academicYearId: {
          departmentId,
          regulationId: activeReg.id,
          academicYearId: activeAY.id,
        },
      },
      data: {
        status: 'RETURNED_FOR_CORRECTION',
        correctionReason: correctionReason.trim(),
      },
    });

    if (dept.hodId) {
      await prisma.notification.create({
        data: {
          recipientId: dept.hodId,
          title: `Programme Curriculum Book Returned for Revision`,
          message: `Dean has returned the Programme Curriculum Book for ${dept.programmeName} with notes: "${correctionReason.trim()}". Please revise the programme planning.`,
          type: 'BUNDLE_RETURNED',
          relatedEntity: updated.id,
        },
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'RETURN_PROGRAMME_CURRICULUM_BOOK',
      entity: 'ProgrammeCurriculumSubmission',
      entityId: updated.id,
      details: { departmentId, correctionReason },
    });

    return NextResponse.json({ success: true, submission: updated });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}
