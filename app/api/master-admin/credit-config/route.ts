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
    minTotalCredits,
    maxTotalCredits,
    minSemCredits,
    maxSemCredits,
    maxLabPerSem,
    maxLabTotal,
    maxLabOrientedPerSem,
    categoryComposition,
  } = await req.json();
  const method = calculationMethod === 'WEIGHTED' ? 'WEIGHTED' : 'SUM';

  const updateData: any = {
    calculationMethod: method,
    lWeight: lWeight !== undefined ? Number(lWeight) : 1.0,
    tWeight: tWeight !== undefined ? Number(tWeight) : 1.0,
    pWeight: pWeight !== undefined ? Number(pWeight) : 0.5,
    hoursPerCredit: Number(hoursPerCredit) || 15,
  };

  if (customPrefixes !== undefined) updateData.customPrefixes = String(customPrefixes);
  if (minTotalCredits !== undefined) updateData.minTotalCredits = Number(minTotalCredits);
  if (maxTotalCredits !== undefined) updateData.maxTotalCredits = Number(maxTotalCredits);
  if (minSemCredits !== undefined) updateData.minSemCredits = Number(minSemCredits);
  if (maxSemCredits !== undefined) updateData.maxSemCredits = Number(maxSemCredits);
  if (maxLabPerSem !== undefined) updateData.maxLabPerSem = Number(maxLabPerSem);
  if (maxLabTotal !== undefined) updateData.maxLabTotal = Number(maxLabTotal);
  if (maxLabOrientedPerSem !== undefined) updateData.maxLabOrientedPerSem = Number(maxLabOrientedPerSem);
  if (categoryComposition !== undefined) {
    updateData.categoryComposition = typeof categoryComposition === 'string' ? categoryComposition : JSON.stringify(categoryComposition);
  }

  const config = await prisma.creditConfig.upsert({
    where: { id: 'default-credit-config' },
    update: updateData,
    create: {
      id: 'default-credit-config',
      calculationMethod: method,
      lWeight: lWeight !== undefined ? Number(lWeight) : 1.0,
      tWeight: tWeight !== undefined ? Number(tWeight) : 1.0,
      pWeight: pWeight !== undefined ? Number(pWeight) : 0.5,
      hoursPerCredit: Number(hoursPerCredit) || 15,
      customPrefixes: customPrefixes !== undefined ? String(customPrefixes) : "GE, PH, HS, MC, CS, EC, EE, ME, CE, AI, CB, IT",
      minTotalCredits: minTotalCredits !== undefined ? Number(minTotalCredits) : 160.0,
      maxTotalCredits: maxTotalCredits !== undefined ? Number(maxTotalCredits) : 165.0,
      minSemCredits: minSemCredits !== undefined ? Number(minSemCredits) : 20.0,
      maxSemCredits: maxSemCredits !== undefined ? Number(maxSemCredits) : 24.0,
      maxLabPerSem: maxLabPerSem !== undefined ? Number(maxLabPerSem) : 2,
      maxLabTotal: maxLabTotal !== undefined ? Number(maxLabTotal) : 8,
      maxLabOrientedPerSem: maxLabOrientedPerSem !== undefined ? Number(maxLabOrientedPerSem) : 2,
      categoryComposition: categoryComposition !== undefined
        ? (typeof categoryComposition === 'string' ? categoryComposition : JSON.stringify(categoryComposition))
        : "{\"PC\":45,\"PE\":15,\"OE\":6,\"HS\":7,\"BS\":15,\"ES\":9,\"EEC\":3}",
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'UPDATE_CREDIT_CONFIG',
    entity: 'CreditConfig',
    entityId: config.id,
    details: { ...updateData },
  });

  return NextResponse.json({ success: true, config });
}
