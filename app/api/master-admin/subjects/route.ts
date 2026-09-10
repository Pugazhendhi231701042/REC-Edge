import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');

  const whereClause: any = {};
  if (departmentId) {
    whereClause.departmentId = departmentId;
  }

  const subjects = await prisma.subject.findMany({
    where: whereClause,
    include: {
      department: true,
      subjectType: true,
      subjectCategory: true,
      assignedFaculty: { select: { id: true, name: true, email: true, userCode: true } },
      submission: { select: { id: true, version: true, updatedAt: true } },
    },
    orderBy: [{ departmentId: 'asc' }, { semester: 'asc' }, { subjectCode: 'asc' }],
  });

  return NextResponse.json({ subjects });
}

export async function DELETE(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
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

  const deleted = await prisma.subject.deleteMany({
    where: {
      id: { in: targetIds },
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'DELETE_SUBJECTS_MASTERADMIN',
    entity: 'Subject',
    entityId: targetIds.join(','),
    details: { count: deleted.count },
  });

  return NextResponse.json({
    success: true,
    count: deleted.count,
    message: `${deleted.count} subject(s) deleted successfully by Master Admin.`,
  });
}
