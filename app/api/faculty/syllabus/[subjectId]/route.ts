import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(
  req: Request,
  { params }: { params: { subjectId: string } }
) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { subjectId } = params;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      department: true,
      subjectType: true,
      subjectCategory: true,
      regulation: true,
      academicYear: true,
      assignedFaculty: { select: { id: true, name: true, email: true } },
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
  });

  if (!subject) {
    return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
  }

  // Security check: Faculty can only access their assigned subject
  if (session.role === 'FACULTY' && subject.assignedFacultyId !== session.userId) {
    return NextResponse.json({ error: 'Access denied: You are not assigned to this subject.' }, { status: 403 });
  }

  // Fetch PO and PSO configuration
  const poConfig = await prisma.pOConfiguration.findUnique({
    where: { departmentId_regulationId: { departmentId: subject.departmentId, regulationId: subject.regulationId } },
  });
  const psoConfig = await prisma.pSOConfiguration.findUnique({
    where: { departmentId_regulationId: { departmentId: subject.departmentId, regulationId: subject.regulationId } },
  });

  // Fetch Master SDG Goals (17 UN SDGs)
  const sdgGoals = await prisma.sDGGoal.findMany({
    where: { active: true },
    orderBy: { sdgNumber: 'asc' },
  });

  const poCount = poConfig ? poConfig.poCount : 12;
  const psoCount = psoConfig ? psoConfig.psoCount : 3;

  return NextResponse.json({
    subject,
    poCount,
    psoCount,
    sdgGoals,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { subjectId: string } }
) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'FACULTY') {
    return NextResponse.json({ error: 'Unauthorized. Faculty role required.' }, { status: 403 });
  }

  const { subjectId } = params;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { subjectType: true },
  });

  if (!subject) {
    return NextResponse.json({ error: 'Subject not found.' }, { status: 404 });
  }

  if (subject.assignedFacultyId !== session.userId) {
    return NextResponse.json({ error: 'Access denied. You are not assigned to this subject.' }, { status: 403 });
  }

  const {
    isSubmit,
    unitContactHours,
    theoryContactHours,
    labContactHours,
    totalContactHours,
    objectives,
    units,
    experiments,
    courseOutcomes,
    textbooks,
    references,
    coPoMappings,
    coPoJustifications,
    sdgMappings, // { coNumber, sdgNumber, topic }[]
  } = await req.json();

  const templateType = subject.subjectType.templateType;

  // Validate if attempting Final Submission
  if (isSubmit) {
    const missing: string[] = [];

    // Objectives check
    if (!objectives || objectives.length === 0 || objectives.some((o: string) => !o.trim())) {
      missing.push('⚠ Objectives are incomplete or missing.');
    }

    // Template specific checks
    if (templateType === 'THEORY') {
      if (!unitContactHours || Number(unitContactHours) <= 0) {
        missing.push('⚠ Contact Hours for each unit must be specified (> 0).');
      }
      if (!units || units.length < 5 || units.some((u: any) => !u.unitName?.trim() || !u.content?.trim())) {
        missing.push('⚠ Theory syllabus requires all 5 units to be fully completed.');
      }
    } else if (templateType === 'LAB') {
      if (!totalContactHours || Number(totalContactHours) <= 0) {
        missing.push('⚠ Total Contact Hours must be specified (> 0).');
      }
      if (!experiments || experiments.length < 10 || experiments.some((e: any) => !e.title?.trim())) {
        missing.push('⚠ Lab syllabus requires at least 10 experiments to be listed.');
      }
    } else if (templateType === 'LAB_ORIENTED_THEORY') {
      if (!unitContactHours || Number(unitContactHours) <= 0) {
        missing.push('⚠ Theory Unit Contact Hours must be specified.');
      }
      if (!units || units.length < 5 || units.some((u: any) => !u.unitName?.trim() || !u.content?.trim())) {
        missing.push('⚠ Theory component requires all 5 units to be completed.');
      }
      if (!experiments || experiments.length < 7 || experiments.some((e: any) => !e.title?.trim())) {
        missing.push('⚠ Lab component requires at least 7 experiments to be listed.');
      }
      if (!labContactHours || Number(labContactHours) <= 0) {
        missing.push('⚠ Lab Contact Hours must be specified.');
      }
    }

    // Course Outcomes check (Mandatory 5 COs)
    if (!courseOutcomes || courseOutcomes.length !== 5 || courseOutcomes.some((c: any) => !c.description?.trim())) {
      missing.push('⚠ Exactly 5 Course Outcomes (CO1..CO5) are mandatory.');
    }

    // Textbooks check
    if (!textbooks || textbooks.length === 0 || textbooks.some((t: any) => !t.title?.trim() || !t.authors?.trim())) {
      missing.push('⚠ At least 1 complete Textbook entry (Title, Author) is required.');
    }

    // References check
    if (!references || references.length === 0 || references.some((r: any) => !r.title?.trim())) {
      missing.push('⚠ At least 1 Reference entry is required.');
    }

    // CO/PO Mapping check
    if (!coPoMappings || coPoMappings.length === 0) {
      missing.push('⚠ PO/PSO Mapping grid is incomplete.');
    } else {
      const mappedNonZero = coPoMappings.filter((m: any) => Number(m.correlation) > 0);
      const justificationMap = new Map();
      if (coPoJustifications) {
        coPoJustifications.forEach((j: any) => {
          justificationMap.set(`${j.coNumber}_${j.poKey}`, j.justification?.trim());
        });
      }

      const missingJustifications = mappedNonZero.filter((m: any) => {
        const val = justificationMap.get(`${m.coNumber}_${m.poKey}`);
        return !val;
      });

      if (missingJustifications.length > 0) {
        missing.push(`⚠ Justification missing for ${missingJustifications.length} correlated CO-PO mapping cell(s).`);
      }
    }

    // SDG Mapping Validation: Every CO (CO1..CO5) MUST have at least 1 SDG and at least 1 topic mapped! (User Requirement)
    for (let coNum = 1; coNum <= 5; coNum++) {
      const coSDGs = sdgMappings ? sdgMappings.filter((m: any) => Number(m.coNumber) === coNum) : [];
      if (coSDGs.length === 0) {
        missing.push(`⚠ CO${coNum} — Please select at least one SDG and topic.`);
      }
    }

    if (missing.length > 0) {
      return NextResponse.json({
        error: 'Cannot submit syllabus yet. Please fix missing items:',
        missing,
      }, { status: 400 });
    }
  }

  // Transaction to update/upsert entire syllabus submission structure
  const submission = await prisma.$transaction(async (tx) => {
    let sub = await tx.syllabusSubmission.findUnique({
      where: { subjectId },
    });

    if (sub) {
      sub = await tx.syllabusSubmission.update({
        where: { id: sub.id },
        data: {
          unitContactHours: unitContactHours ? Number(unitContactHours) : null,
          theoryContactHours: theoryContactHours ? Number(theoryContactHours) : null,
          labContactHours: labContactHours ? Number(labContactHours) : null,
          totalContactHours: totalContactHours ? Number(totalContactHours) : null,
          correctionReason: isSubmit ? null : sub.correctionReason,
        },
      });
    } else {
      sub = await tx.syllabusSubmission.create({
        data: {
          subjectId,
          facultyId: session.userId,
          unitContactHours: unitContactHours ? Number(unitContactHours) : null,
          theoryContactHours: theoryContactHours ? Number(theoryContactHours) : null,
          labContactHours: labContactHours ? Number(labContactHours) : null,
          totalContactHours: totalContactHours ? Number(totalContactHours) : null,
        },
      });
    }

    // Clear and replace child records for atomic consistency
    await tx.objective.deleteMany({ where: { syllabusId: sub.id } });
    if (objectives && Array.isArray(objectives)) {
      await tx.objective.createMany({
        data: objectives.map((desc: string, idx: number) => ({
          syllabusId: sub.id,
          order: idx + 1,
          description: desc,
        })),
      });
    }

    await tx.syllabusUnit.deleteMany({ where: { syllabusId: sub.id } });
    if (units && Array.isArray(units)) {
      await tx.syllabusUnit.createMany({
        data: units.map((u: any) => ({
          syllabusId: sub.id,
          unitNumber: Number(u.unitNumber),
          unitName: u.unitName || '',
          content: u.content || '',
        })),
      });
    }

    await tx.experiment.deleteMany({ where: { syllabusId: sub.id } });
    if (experiments && Array.isArray(experiments)) {
      await tx.experiment.createMany({
        data: experiments.map((e: any, idx: number) => ({
          syllabusId: sub.id,
          experimentNumber: idx + 1,
          title: e.title || '',
        })),
      });
    }

    await tx.courseOutcome.deleteMany({ where: { syllabusId: sub.id } });
    if (courseOutcomes && Array.isArray(courseOutcomes)) {
      await tx.courseOutcome.createMany({
        data: courseOutcomes.map((co: any, idx: number) => ({
          syllabusId: sub.id,
          coNumber: idx + 1,
          description: co.description || '',
        })),
      });
    }

    await tx.textbook.deleteMany({ where: { syllabusId: sub.id } });
    if (textbooks && Array.isArray(textbooks)) {
      await tx.textbook.createMany({
        data: textbooks.map((tb: any, idx: number) => ({
          syllabusId: sub.id,
          order: idx + 1,
          title: tb.title || '',
          authors: tb.authors || '',
          edition: tb.edition || null,
          publisher: tb.publisher || null,
          year: tb.year || null,
        })),
      });
    }

    await tx.reference.deleteMany({ where: { syllabusId: sub.id } });
    if (references && Array.isArray(references)) {
      await tx.reference.createMany({
        data: references.map((ref: any, idx: number) => ({
          syllabusId: sub.id,
          order: idx + 1,
          title: ref.title || '',
          authors: ref.authors || null,
          edition: ref.edition || null,
          publisher: ref.publisher || null,
          year: ref.year || null,
          url: ref.url || null,
          description: ref.description || null,
        })),
      });
    }

    await tx.cOPOMapping.deleteMany({ where: { syllabusId: sub.id } });
    if (coPoMappings && Array.isArray(coPoMappings)) {
      await tx.cOPOMapping.createMany({
        data: coPoMappings.map((m: any) => ({
          syllabusId: sub.id,
          coNumber: Number(m.coNumber),
          poKey: m.poKey,
          correlation: Number(m.correlation) || 0,
        })),
      });
    }

    await tx.cOPOJustification.deleteMany({ where: { syllabusId: sub.id } });
    if (coPoJustifications && Array.isArray(coPoJustifications)) {
      await tx.cOPOJustification.createMany({
        data: coPoJustifications.filter((j: any) => j.justification && j.justification.trim()).map((j: any) => ({
          syllabusId: sub.id,
          coNumber: Number(j.coNumber),
          poKey: j.poKey,
          justification: j.justification.trim(),
        })),
      });
    }

    await tx.syllabusSDGMapping.deleteMany({ where: { syllabusId: sub.id } });
    if (sdgMappings && Array.isArray(sdgMappings)) {
      await tx.syllabusSDGMapping.createMany({
        data: sdgMappings.map((m: any) => ({
          syllabusId: sub.id,
          coNumber: Number(m.coNumber),
          sdgNumber: Number(m.sdgNumber),
          topic: m.topic,
        })),
      });
    }

    // Update Subject Status
    const newStatus = isSubmit ? 'SUBMITTED' : 'IN_PROGRESS';
    await tx.subject.update({
      where: { id: subjectId },
      data: { syllabusStatus: newStatus },
    });

    // Notify HoD if Submitted
    if (isSubmit) {
      const deptHoD = await tx.user.findFirst({
        where: { departmentId: subject.departmentId, role: 'HOD' },
      });
      if (deptHoD) {
        await tx.notification.create({
          data: {
            recipientId: deptHoD.id,
            title: `Syllabus Submitted: ${subject.subjectCode}`,
            message: `Faculty has submitted syllabus for ${subject.subjectCode} - ${subject.subjectName} for your review.`,
            type: 'SYLLABUS_SUBMITTED',
            relatedEntity: subject.id,
          },
        });
      }
    }

    return sub;
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: isSubmit ? 'FACULTY_SUBMIT_SYLLABUS' : 'FACULTY_SAVE_DRAFT_SYLLABUS',
    entity: 'SyllabusSubmission',
    entityId: submission.id,
    details: { isSubmit, subjectCode: subject.subjectCode },
  });

  return NextResponse.json({
    success: true,
    message: isSubmit ? 'Syllabus submitted successfully to HoD for review.' : 'Syllabus draft saved successfully.',
    submissionId: submission.id,
  });
}
