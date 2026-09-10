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

  const activeReg = await prisma.regulation.findFirst({ where: { active: true } });
  const activeAY = await prisma.academicYear.findFirst({ where: { active: true } });

  if (!activeReg || !activeAY) {
    return NextResponse.json({ bundle: null, canSubmit: false });
  }

  const [bundle, subjects] = await Promise.all([
    prisma.departmentCurriculumBundle.findUnique({
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
    }),
    prisma.subject.findMany({
      where: { departmentId, regulationId: activeReg.id, academicYearId: activeAY.id },
      select: { id: true, syllabusStatus: true },
    }),
  ]);

  const totalSubjects = subjects.length;
  const hodApprovedSubjects = subjects.filter(
    (s) => s.syllabusStatus === 'HOD_APPROVED' || s.syllabusStatus === 'APPROVED'
  ).length;
  const canSubmit = totalSubjects > 0 && totalSubjects === hodApprovedSubjects;

  return NextResponse.json({
    bundle,
    totalSubjects,
    hodApprovedSubjects,
    canSubmit,
  });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'HOD') {
    return NextResponse.json({ error: 'Unauthorized. HoD role required.' }, { status: 403 });
  }

  const departmentId = session.departmentId;
  if (!departmentId) {
    return NextResponse.json({ error: 'Department ID missing.' }, { status: 400 });
  }

  const activeReg = await prisma.regulation.findFirst({ where: { active: true } });
  const activeAY = await prisma.academicYear.findFirst({ where: { active: true } });

  if (!activeReg || !activeAY) {
    return NextResponse.json({ error: 'Active Regulation or Academic Year not found.' }, { status: 404 });
  }

  // Verify all subjects created for department are HOD_APPROVED
  const subjects = await prisma.subject.findMany({
    where: { departmentId, regulationId: activeReg.id, academicYearId: activeAY.id },
  });

  if (subjects.length === 0) {
    return NextResponse.json({ error: 'No subjects created in department to submit.' }, { status: 400 });
  }

  const pendingSubjects = subjects.filter(
    (s) => s.syllabusStatus !== 'HOD_APPROVED' && s.syllabusStatus !== 'APPROVED'
  );

  if (pendingSubjects.length > 0) {
    return NextResponse.json(
      { error: `Cannot submit bundle. ${pendingSubjects.length} subject(s) are not yet approved by HoD.` },
      { status: 400 }
    );
  }

  const bundle = await prisma.departmentCurriculumBundle.upsert({
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
  const deans = await prisma.user.findMany({ where: { role: 'SUPERADMIN', active: true } });
  for (const dean of deans) {
    await prisma.notification.create({
      data: {
        recipientId: dean.id,
        title: `Department Curriculum Bundle Submitted`,
        message: `HoD has submitted the merged Department Curriculum Bundle containing all ${subjects.length} approved subjects for Dean review.`,
        type: 'BUNDLE_SUBMITTED',
        relatedEntity: bundle.id,
      },
    });
  }

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'SUBMIT_DEPARTMENT_CURRICULUM_BUNDLE',
    entity: 'DepartmentCurriculumBundle',
    entityId: bundle.id,
    details: { departmentId, totalSubjects: subjects.length },
  });

  return NextResponse.json({ success: true, bundle });
}
