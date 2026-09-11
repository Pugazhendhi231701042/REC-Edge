import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'MASTERADMIN' && session.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. Master-Admin role required.' }, { status: 403 });
  }

  const { departmentIds } = await req.json();

  if (!Array.isArray(departmentIds) || departmentIds.length === 0) {
    return NextResponse.json({ error: 'At least one department ID must be selected.' }, { status: 400 });
  }

  try {
    // Delete all subjects for the selected department IDs
    const deleteResult = await prisma.subject.deleteMany({
      where: {
        departmentId: { in: departmentIds },
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'TRUNCATE_DEPARTMENT_SUBJECTS',
      entity: 'Subject',
      details: { departmentIds, deletedCount: deleteResult.count },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully truncated ${deleteResult.count} subject(s) across ${departmentIds.length} department(s).`,
      count: deleteResult.count,
    });
  } catch (err: any) {
    console.error('Truncate subjects error:', err);
    return NextResponse.json({ error: err.message || 'Failed to truncate subjects.' }, { status: 500 });
  }
}
