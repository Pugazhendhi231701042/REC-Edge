import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const deptId = url.searchParams.get('departmentId');
  const reg26 = await prisma.regulation.findFirst({ where: { active: true } });

  if (!reg26) {
    return NextResponse.json({ poCount: 12, psoCount: 3 });
  }

  let poConfig = null;
  let psoConfig = null;

  if (deptId) {
    poConfig = await prisma.pOConfiguration.findUnique({
      where: { departmentId_regulationId: { departmentId: deptId, regulationId: reg26.id } },
    });
    psoConfig = await prisma.pSOConfiguration.findUnique({
      where: { departmentId_regulationId: { departmentId: deptId, regulationId: reg26.id } },
    });
  }

  return NextResponse.json({
    poCount: poConfig ? poConfig.poCount : 12,
    psoCount: psoConfig ? psoConfig.psoCount : 3,
  });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const { departmentId, poCount, psoCount } = await req.json();

  if (!departmentId) {
    return NextResponse.json({ error: 'Department ID required.' }, { status: 400 });
  }

  const activeReg = await prisma.regulation.findFirst({ where: { active: true } });
  if (!activeReg) {
    return NextResponse.json({ error: 'No active regulation found.' }, { status: 400 });
  }

  const po = await prisma.pOConfiguration.upsert({
    where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
    update: { poCount: Number(poCount) || 12 },
    create: { departmentId, regulationId: activeReg.id, poCount: Number(poCount) || 12 },
  });

  const pso = await prisma.pSOConfiguration.upsert({
    where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
    update: { psoCount: Number(psoCount) || 3 },
    create: { departmentId, regulationId: activeReg.id, psoCount: Number(psoCount) || 3 },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'CONFIGURE_PO_PSO',
    entity: 'PO_PSO_Config',
    entityId: departmentId,
    details: { poCount: po.poCount, psoCount: pso.psoCount },
  });

  return NextResponse.json({ success: true, poCount: po.poCount, psoCount: pso.psoCount });
}
