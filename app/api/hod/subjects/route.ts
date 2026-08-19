import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateCredits, formatSubjectCode } from '@/lib/calculations';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let deptId = session.departmentId;
  const url = new URL(req.url);
  const targetDeptId = url.searchParams.get('departmentId');

  if (session.role === 'SUPERADMIN' || session.role === 'MASTERADMIN') {
    if (targetDeptId) deptId = targetDeptId;
  } else if (session.role === 'HOD') {
    // HoD MUST be restricted strictly to their own department (Requirement 12, 14, 95)
    deptId = session.departmentId;
  }

  if (!deptId) {
    return NextResponse.json({ subjects: [], department: null });
  }

  const department = await prisma.department.findUnique({
    where: { id: deptId },
    include: {
      users: {
        where: { role: 'FACULTY', active: true },
        select: { id: true, name: true, email: true },
      },
    },
  });

  const subjects = await prisma.subject.findMany({
    where: { departmentId: deptId },
    include: {
      subjectType: true,
      subjectCategory: true,
      assignedFaculty: { select: { id: true, name: true, email: true } },
      submission: {
        select: { id: true, updatedAt: true, approvedAt: true, correctionReason: true },
      },
    },
    orderBy: [{ semester: 'asc' }, { subjectCode: 'asc' }],
  });

  return NextResponse.json({ subjects, department });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'HOD' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. HoD role required.' }, { status: 403 });
  }

  const {
    id,
    semester,
    subjectTypeId,
    subjectCategoryId,
    subjectName,
    lecture,
    tutorial,
    practical,
  } = await req.json();

  const deptId = session.departmentId;
  if (!deptId) {
    return NextResponse.json({ error: 'User is not associated with a department.' }, { status: 400 });
  }

  const department = await prisma.department.findUnique({ where: { id: deptId } });
  if (!department) {
    return NextResponse.json({ error: 'Department not found.' }, { status: 404 });
  }

  if (!semester || !subjectTypeId || !subjectCategoryId || !subjectName) {
    return NextResponse.json({ error: 'Semester, Subject Type, Category, and Name are required.' }, { status: 400 });
  }

  // 1. Credit Calculation Rule (Requirement 21, 22, 23)
  const creditResult = calculateCredits(lecture, tutorial, practical);
  if (!creditResult.valid) {
    return NextResponse.json({ error: creditResult.warning }, { status: 400 });
  }

  const activeReg = await prisma.regulation.findFirst({ where: { active: true } });
  const activeAY = await prisma.academicYear.findFirst({ where: { active: true } });

  if (!activeReg || !activeAY) {
    return NextResponse.json({ error: 'No active regulation or academic year configured.' }, { status: 400 });
  }

  const subjectType = await prisma.subjectType.findUnique({ where: { id: subjectTypeId } });
  if (!subjectType) {
    return NextResponse.json({ error: 'Invalid subject type.' }, { status: 400 });
  }

  if (id) {
    // Edit existing subject
    const existing = await prisma.subject.findUnique({ where: { id } });
    if (!existing || existing.departmentId !== deptId) {
      return NextResponse.json({ error: 'Subject not found or access denied.' }, { status: 403 });
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: {
        semester: Number(semester),
        subjectTypeId,
        subjectCategoryId,
        subjectName,
        lecture: Number(lecture) || 0,
        tutorial: Number(tutorial) || 0,
        practical: Number(practical) || 0,
        credits: creditResult.credits,
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'UPDATE_SUBJECT',
      entity: 'Subject',
      entityId: updated.id,
    });

    return NextResponse.json({ success: true, subject: updated });
  } else {
    // Server-side Automatic Subject Code Generation (Requirement 24, 25, 26)
    // DeptCode + RegulationCode + Semester + SubjectTypeCode + SequenceNumber
    const existingCount = await prisma.subject.count({
      where: {
        departmentId: deptId,
        regulationId: activeReg.id,
        semester: Number(semester),
        subjectTypeId,
      },
    });

    const sequenceNumber = existingCount + 1;
    const generatedCode = formatSubjectCode(
      department.departmentCode,
      activeReg.code,
      Number(semester),
      subjectType.code,
      sequenceNumber
    );

    const created = await prisma.subject.create({
      data: {
        departmentId: deptId,
        regulationId: activeReg.id,
        academicYearId: activeAY.id,
        semester: Number(semester),
        subjectTypeId,
        subjectCategoryId,
        subjectName,
        subjectCode: generatedCode,
        lecture: Number(lecture) || 0,
        tutorial: Number(tutorial) || 0,
        practical: Number(practical) || 0,
        credits: creditResult.credits,
        status: 'DRAFT',
        createdById: session.userId,
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'CREATE_SUBJECT',
      entity: 'Subject',
      entityId: created.id,
      details: { subjectCode: created.subjectCode, credits: created.credits },
    });

    return NextResponse.json({ success: true, subject: created });
  }
}
