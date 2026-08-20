import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const sdgs = await prisma.sDGGoal.findMany({
    orderBy: { sdgNumber: 'asc' },
  });

  return NextResponse.json({ sdgs });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const { id, name, active } = await req.json();

  if (!id || !name) {
    return NextResponse.json({ error: 'SDG ID and Name are required.' }, { status: 400 });
  }

  const updatedSDG = await prisma.sDGGoal.update({
    where: { id },
    data: {
      name: name.trim(),
      active: active ?? true,
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'UPDATE_SDG_GOAL',
    entity: 'SDGGoal',
    entityId: id,
    details: { sdgNumber: updatedSDG.sdgNumber, name: updatedSDG.name },
  });

  return NextResponse.json({ success: true, sdg: updatedSDG });
}
