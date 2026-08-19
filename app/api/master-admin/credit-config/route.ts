import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const config = await prisma.creditConfig.upsert({
    where: { id: 'default-credit-config' },
    update: {},
    create: { id: 'default-credit-config', lWeight: 1.0, tWeight: 1.0, pWeight: 0.5 },
  });

  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const { lWeight, tWeight, pWeight } = await req.json();

  const config = await prisma.creditConfig.upsert({
    where: { id: 'default-credit-config' },
    update: {
      lWeight: Number(lWeight) || 1.0,
      tWeight: Number(tWeight) || 1.0,
      pWeight: Number(pWeight) || 0.5,
    },
    create: {
      id: 'default-credit-config',
      lWeight: Number(lWeight) || 1.0,
      tWeight: Number(tWeight) || 1.0,
      pWeight: Number(pWeight) || 0.5,
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'UPDATE_CREDIT_CONFIG',
    entity: 'CreditConfig',
    entityId: config.id,
    details: { lWeight: config.lWeight, tWeight: config.tWeight, pWeight: config.pWeight },
  });

  return NextResponse.json({ success: true, config });
}
