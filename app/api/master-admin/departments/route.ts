import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const departments = await prisma.department.findMany({
    include: {
      hod: {
        select: { id: true, name: true, email: true, userCode: true },
      },
      _count: {
        select: { users: true, subjects: true },
      },
    },
    orderBy: { shortName: 'asc' },
  });

  return NextResponse.json({ departments });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const { id, programmeType, programmeName, shortName, departmentCode, semesters, hodId } = await req.json();

  if (!programmeType || !programmeName || !shortName || !departmentCode) {
    return NextResponse.json({ error: 'Programme Type, Name, Short Name, and Code are required.' }, { status: 400 });
  }

  // Default semesters logic: M.E./M.Tech -> 4, B.E./B.Tech -> 8 unless specified
  let semCount = Number(semesters);
  if (!semCount || semCount < 1) {
    semCount = (programmeType.includes('M.') || programmeType.includes('Post')) ? 4 : 8;
  }

  if (id) {
    // Edit Department
    const updated = await prisma.department.update({
      where: { id },
      data: {
        programmeType,
        programmeName,
        shortName,
        departmentCode,
        semesters: semCount,
        hodId: hodId || null,
      },
    });

    if (hodId) {
      await prisma.user.update({
        where: { id: hodId },
        data: { departmentId: updated.id, role: 'HOD' },
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'UPDATE_DEPARTMENT',
      entity: 'Department',
      entityId: updated.id,
    });

    return NextResponse.json({ success: true, department: updated });
  } else {
    // Create Department
    const existing = await prisma.department.findUnique({
      where: { departmentCode },
    });
    if (existing) {
      return NextResponse.json({ error: 'Department code already exists.' }, { status: 400 });
    }

    const created = await prisma.department.create({
      data: {
        programmeType,
        programmeName,
        shortName,
        departmentCode,
        semesters: semCount,
        hodId: hodId || null,
        active: true,
      },
    });

    if (hodId) {
      await prisma.user.update({
        where: { id: hodId },
        data: { departmentId: created.id, role: 'HOD' },
      });
    }

    // Default PO (12) and PSO (3) configuration for Active Regulation
    const activeReg = await prisma.regulation.findFirst({ where: { active: true } }) || await prisma.regulation.findFirst();
    if (activeReg) {
      await prisma.pOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId: created.id, regulationId: activeReg.id } },
        update: { poCount: 12 },
        create: { departmentId: created.id, regulationId: activeReg.id, poCount: 12 },
      });
      await prisma.pSOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId: created.id, regulationId: activeReg.id } },
        update: { psoCount: 3 },
        create: { departmentId: created.id, regulationId: activeReg.id, psoCount: 3 },
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'CREATE_DEPARTMENT',
      entity: 'Department',
      entityId: created.id,
    });

    return NextResponse.json({ success: true, department: created });
  }
}

export async function DELETE(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Department ID is required.' }, { status: 400 });
  }

  const department = await prisma.department.findUnique({
    where: { id },
  });

  if (!department) {
    return NextResponse.json({ error: 'Department not found.' }, { status: 404 });
  }

  // Cleanup related records safely before deleting department
  await prisma.pOConfiguration.deleteMany({ where: { departmentId: id } });
  await prisma.pSOConfiguration.deleteMany({ where: { departmentId: id } });
  await prisma.programOutcomeStatement.deleteMany({ where: { departmentId: id } });
  await prisma.programSpecificOutcomeStatement.deleteMany({ where: { departmentId: id } });
  await prisma.extensionRequest.deleteMany({ where: { departmentId: id } });
  await prisma.subject.deleteMany({ where: { departmentId: id } });

  // Reset users linked to this department
  await prisma.user.updateMany({
    where: { departmentId: id },
    data: { departmentId: null },
  });

  await prisma.department.delete({
    where: { id },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'DELETE_DEPARTMENT',
    entity: 'Department',
    entityId: id,
    details: { code: department.departmentCode, name: department.programmeName },
  });

  return NextResponse.json({ success: true, message: `Department ${department.shortName} deleted successfully.` });
}
