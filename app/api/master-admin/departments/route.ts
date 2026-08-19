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
        select: { id: true, name: true, email: true },
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

    // Default PO (12) and PSO (3) configuration for Regulation 26
    const reg26 = await prisma.regulation.findUnique({ where: { code: '26' } });
    if (reg26) {
      await prisma.pOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId: created.id, regulationId: reg26.id } },
        update: { poCount: 12 },
        create: { departmentId: created.id, regulationId: reg26.id, poCount: 12 },
      });
      await prisma.pSOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId: created.id, regulationId: reg26.id } },
        update: { psoCount: 3 },
        create: { departmentId: created.id, regulationId: reg26.id, psoCount: 3 },
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
