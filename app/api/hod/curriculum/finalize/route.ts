import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST() {
  const session = await getCurrentUser();
  if (!session || session.role !== 'HOD') {
    return NextResponse.json({ error: 'Unauthorized. HoD role required.' }, { status: 403 });
  }

  const deptId = session.departmentId;
  if (!deptId) {
    return NextResponse.json({ error: 'Department ID missing.' }, { status: 400 });
  }

  // Update all DRAFT subjects in department to FINALIZED
  const result = await prisma.subject.updateMany({
    where: { departmentId: deptId, status: 'DRAFT' },
    data: { status: 'FINALIZED', finalizedAt: new Date() },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'FINALIZE_CURRICULUM',
    entity: 'Department',
    entityId: deptId,
    details: { finalizedSubjectsCount: result.count },
  });

  return NextResponse.json({
    success: true,
    message: `Curriculum finalized successfully (${result.count} subjects finalized). Faculty assignment is now unlocked.`,
  });
}
