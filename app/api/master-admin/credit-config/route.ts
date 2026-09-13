import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  let config = await prisma.creditConfig.upsert({
    where: { id: 'default-credit-config' },
    update: {},
    create: { 
      id: 'default-credit-config', 
      calculationMethod: 'SUM', 
      lWeight: 1.0, 
      tWeight: 1.0, 
      pWeight: 0.5, 
      hoursPerCredit: 15,
      customPrefixes: "GE, PH, HS, MC, CS, EC, EE, ME, CE, AI, CB, IT",
    },
  });

  if (!config.customPrefixes) {
    config = await prisma.creditConfig.update({
      where: { id: 'default-credit-config' },
      data: { customPrefixes: "GE, PH, HS, MC, CS, EC, EE, ME, CE, AI, CB, IT" },
    });
  }

  return NextResponse.json({ config });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const {
    calculationMethod,
    lWeight,
    tWeight,
    pWeight,
    hoursPerCredit,
    customPrefixes,
    minSemCredits,
    maxSemCredits,
    maxLabPerSem,
    maxLabTotal,
    categoryComposition,
  } = await req.json();

  const method = calculationMethod === 'WEIGHTED' ? 'WEIGHTED' : 'SUM';

  const config = await prisma.creditConfig.upsert({
    where: { id: 'default-credit-config' },
    update: {
      calculationMethod: method,
      lWeight: Number(lWeight) ?? 1.0,
      tWeight: Number(tWeight) ?? 1.0,
      pWeight: Number(pWeight) ?? 0.5,
      hoursPerCredit: Number(hoursPerCredit) || 15,
      customPrefixes: customPrefixes !== undefined ? String(customPrefixes) : undefined,
      minSemCredits: minSemCredits !== undefined ? Number(minSemCredits) : 20.0,
      maxSemCredits: maxSemCredits !== undefined ? Number(maxSemCredits) : 24.0,
      maxLabPerSem: maxLabPerSem !== undefined ? Number(maxLabPerSem) : 2,
      maxLabTotal: maxLabTotal !== undefined ? Number(maxLabTotal) : 8,
      categoryComposition: categoryComposition !== undefined ? (typeof categoryComposition === 'string' ? categoryComposition : JSON.stringify(categoryComposition)) : undefined,
    },
    create: {
      id: 'default-credit-config',
      calculationMethod: method,
      lWeight: Number(lWeight) ?? 1.0,
      tWeight: Number(tWeight) ?? 1.0,
      pWeight: Number(pWeight) ?? 0.5,
      hoursPerCredit: Number(hoursPerCredit) || 15,
      customPrefixes: customPrefixes !== undefined ? String(customPrefixes) : "GE, PH, HS, MC, CS, EC, EE, ME, CE, AI, CB, IT",
      minSemCredits: minSemCredits !== undefined ? Number(minSemCredits) : 20.0,
      maxSemCredits: maxSemCredits !== undefined ? Number(maxSemCredits) : 24.0,
      maxLabPerSem: maxLabPerSem !== undefined ? Number(maxLabPerSem) : 2,
      maxLabTotal: maxLabTotal !== undefined ? Number(maxLabTotal) : 8,
      categoryComposition: categoryComposition !== undefined ? (typeof categoryComposition === 'string' ? categoryComposition : JSON.stringify(categoryComposition)) : "{\"PC\":{\"min\":40,\"max\":50},\"PE\":{\"min\":10,\"max\":20},\"OE\":{\"min\":5,\"max\":15},\"HS\":{\"min\":5,\"max\":12},\"BS\":{\"min\":10,\"max\":18},\"ES\":{\"min\":8,\"max\":15},\"EEC\":{\"min\":3,\"max\":10}}",
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'UPDATE_CREDIT_CONFIG',
    entity: 'CreditConfig',
    entityId: config.id,
    details: {
      calculationMethod: config.calculationMethod,
      lWeight: config.lWeight,
      tWeight: config.tWeight,
      pWeight: config.pWeight,
      hoursPerCredit: config.hoursPerCredit,
      customPrefixes: config.customPrefixes,
      minSemCredits: config.minSemCredits,
      maxSemCredits: config.maxSemCredits,
      maxLabPerSem: config.maxLabPerSem,
      maxLabTotal: config.maxLabTotal,
    },
  });

  return NextResponse.json({ success: true, config });
}
