import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateCredits, formatSubjectCode } from '@/lib/calculations';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'HOD' && session.role !== 'MASTERADMIN' && session.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  let departmentId = session.departmentId;
  if (!departmentId) {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    departmentId = user?.departmentId || null;
  }

  if (!departmentId) {
    return NextResponse.json({ error: 'Department not assigned to user.' }, { status: 400 });
  }

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    include: {
      users: { select: { id: true, name: true, email: true, role: true, userCode: true } },
    },
  });

  const activeReg = await prisma.regulation.findFirst({ where: { active: true } });
  const regId = activeReg ? activeReg.id : '';

  const subjects = await prisma.subject.findMany({
    where: { departmentId, regulationId: regId },
    include: {
      subjectType: true,
      subjectCategory: true,
      assignedFaculty: { select: { id: true, name: true, email: true, userCode: true } },
      submission: { select: { id: true, totalContactHours: true } },
    },
    orderBy: [{ semester: 'asc' }, { subjectCode: 'asc' }],
  });

  return NextResponse.json({ department, subjects });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'HOD') {
    return NextResponse.json({ error: 'Unauthorized. HoD role required.' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  const departmentId = user?.departmentId;
  if (!departmentId) {
    return NextResponse.json({ error: 'HoD does not belong to a department.' }, { status: 400 });
  }

  const dept = await prisma.department.findUnique({ where: { id: departmentId } });
  const activeReg = await prisma.regulation.findFirst({ where: { active: true } });
  const activeYear = await prisma.academicYear.findFirst({ where: { active: true } });

  if (!dept || !activeReg || !activeYear) {
    return NextResponse.json({ error: 'Active regulation or academic year not configured.' }, { status: 400 });
  }

  const { id, semester, subjectTypeId, subjectCategoryId, subjectName, lecture, tutorial, practical } = await req.json();

  if (!subjectName || !subjectTypeId || !subjectCategoryId || !semester) {
    return NextResponse.json({ error: 'All subject fields are required.' }, { status: 400 });
  }

  // Non-Theory Practical Hours Validation (P >= 1)
  const subjectType = await prisma.subjectType.findUnique({ where: { id: subjectTypeId } });
  if (!subjectType) {
    return NextResponse.json({ error: 'Invalid Subject Type.' }, { status: 400 });
  }

  const isNonTheory = subjectType.templateType !== 'THEORY' || subjectType.name.toLowerCase() !== 'theory';
  const pVal = Number(practical) || 0;

  if (isNonTheory && pVal < 1) {
    return NextResponse.json({ error: 'Practical hours (P) must be at least 1 for non-Theory courses.' }, { status: 400 });
  }

  // Fetch dynamic credit calculation weights
  const creditConfig = await prisma.creditConfig.findUnique({ where: { id: 'default-credit-config' } });
  const lWeight = creditConfig ? creditConfig.lWeight : 1.0;
  const tWeight = creditConfig ? creditConfig.tWeight : 1.0;
  const pWeight = creditConfig ? creditConfig.pWeight : 0.5;

  const creditResult = calculateCredits(lecture, tutorial, practical, lWeight, tWeight, pWeight);
  if (!creditResult.valid) {
    return NextResponse.json({ error: creditResult.warning }, { status: 400 });
  }

  // Unique Subject Name Check
  const duplicateSubject = await prisma.subject.findFirst({
    where: {
      departmentId: dept.id,
      regulationId: activeReg.id,
      subjectName: subjectName.trim(),
      id: id ? { not: id } : undefined,
    },
  });

  if (duplicateSubject) {
    return NextResponse.json(
      { error: `A subject with the name '${subjectName.trim()}' already exists in this department (${duplicateSubject.subjectCode}).` },
      { status: 400 }
    );
  }

  // Subject code generation logic
  let subjectCode = '';
  if (id) {
    const existing = await prisma.subject.findUnique({ where: { id } });
    subjectCode = existing ? existing.subjectCode : '';
  }

  if (!subjectCode) {
    const existingTypeCount = await prisma.subject.count({
      where: {
        departmentId: dept.id,
        regulationId: activeReg.id,
        semester: Number(semester),
        subjectTypeId,
      },
    });

    const sequenceNumber = existingTypeCount + 1;
    subjectCode = formatSubjectCode(dept.departmentCode, activeReg.code, Number(semester), subjectType.code, sequenceNumber);
  }

  if (id) {
    const updated = await prisma.subject.update({
      where: { id },
      data: {
        subjectName: subjectName.trim(),
        subjectTypeId,
        subjectCategoryId,
        lecture: Number(lecture),
        tutorial: Number(tutorial),
        practical: Number(practical),
        credits: creditResult.credits,
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'UPDATE_SUBJECT',
      entity: 'Subject',
      entityId: updated.id,
      details: { subjectCode: updated.subjectCode, subjectName: subjectName.trim() },
    });

    return NextResponse.json({ success: true, subject: updated });
  }

  const created = await prisma.subject.create({
    data: {
      departmentId: dept.id,
      regulationId: activeReg.id,
      academicYearId: activeYear.id,
      semester: Number(semester),
      subjectTypeId,
      subjectCategoryId,
      subjectName: subjectName.trim(),
      subjectCode,
      lecture: Number(lecture),
      tutorial: Number(tutorial),
      practical: Number(practical),
      credits: creditResult.credits,
      createdById: session.userId,
      status: 'DRAFT',
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'CREATE_SUBJECT',
    entity: 'Subject',
    entityId: created.id,
    details: { subjectCode: created.subjectCode, subjectName: subjectName.trim() },
  });

  return NextResponse.json({ success: true, subject: created });
}

// DELETE Endpoint for HoD to delete unassigned subject(s)
export async function DELETE(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'HOD') {
    return NextResponse.json({ error: 'Unauthorized. Only HoD can delete unassigned subjects.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const singleId = searchParams.get('id');

  let targetIds: string[] = [];

  if (singleId) {
    targetIds = [singleId];
  } else {
    try {
      const body = await req.json();
      if (Array.isArray(body.subjectIds)) {
        targetIds = body.subjectIds;
      }
    } catch (e) {}
  }

  if (targetIds.length === 0) {
    return NextResponse.json({ error: 'Subject ID(s) required.' }, { status: 400 });
  }

  // Delete subjects belonging to HoD's department that are unassigned
  const deleted = await prisma.subject.deleteMany({
    where: {
      id: { in: targetIds },
      departmentId: session.departmentId || undefined,
      assignedFacultyId: null,
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'DELETE_UNASSIGNED_SUBJECTS',
    entity: 'Subject',
    entityId: targetIds.join(','),
    details: { count: deleted.count },
  });

  return NextResponse.json({ success: true, count: deleted.count, message: `${deleted.count} subject(s) deleted successfully.` });
}
