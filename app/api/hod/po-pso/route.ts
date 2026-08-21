import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId') || session.departmentId;

  if (!departmentId) {
    return NextResponse.json({ poStatements: [], psoStatements: [], poCount: 12, psoCount: 3, isConfirmed: false });
  }

  const reg26 = await prisma.regulation.findUnique({ where: { code: '26' } });
  if (!reg26) {
    return NextResponse.json({ poStatements: [], psoStatements: [], poCount: 12, psoCount: 3, isConfirmed: false });
  }

  const [poStatements, psoStatements, poConfig, psoConfig] = await Promise.all([
    prisma.programOutcomeStatement.findMany({
      where: { departmentId, regulationId: reg26.id },
      orderBy: { poKey: 'asc' },
    }),
    prisma.programSpecificOutcomeStatement.findMany({
      where: { departmentId, regulationId: reg26.id },
      orderBy: { psoKey: 'asc' },
    }),
    prisma.pOConfiguration.findUnique({
      where: { departmentId_regulationId: { departmentId, regulationId: reg26.id } },
    }),
    prisma.pSOConfiguration.findUnique({
      where: { departmentId_regulationId: { departmentId, regulationId: reg26.id } },
    }),
  ]);

  const poCount = poConfig ? poConfig.poCount : (poStatements.length > 0 ? poStatements.length : 12);
  const psoCount = psoConfig ? psoConfig.psoCount : (psoStatements.length > 0 ? psoStatements.length : 3);
  const isConfirmed = !!(poConfig || psoConfig || poStatements.length > 0 || psoStatements.length > 0);

  return NextResponse.json({
    poStatements,
    psoStatements,
    poCount,
    psoCount,
    isConfirmed,
  });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'HOD' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. HoD or MasterAdmin role required.' }, { status: 403 });
  }

  const body = await req.json();
  const departmentId = body.departmentId || session.departmentId;

  if (!departmentId) {
    return NextResponse.json({ error: 'Department ID is required.' }, { status: 400 });
  }

  const reg26 = await prisma.regulation.findUnique({ where: { code: '26' } });
  if (!reg26) {
    return NextResponse.json({ error: 'Regulation 26 not found.' }, { status: 404 });
  }

  // Handle Structure Confirmation (Setting PO/PSO counts)
  if (body.action === 'CONFIRM_STRUCTURE') {
    const poCount = Number(body.poCount) || 12;
    const psoCount = Number(body.psoCount) || 3;

    await Promise.all([
      prisma.pOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: reg26.id } },
        update: { poCount },
        create: { departmentId, regulationId: reg26.id, poCount },
      }),
      prisma.pSOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: reg26.id } },
        update: { psoCount },
        create: { departmentId, regulationId: reg26.id, psoCount },
      }),
    ]);

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'CONFIRM_PO_PSO_STRUCTURE',
      entity: 'POConfiguration',
      entityId: departmentId,
      details: { poCount, psoCount },
    });

    return NextResponse.json({ success: true, poCount, psoCount, isConfirmed: true });
  }

  // Handle Batch Save All Statements (Requirement: One single Save All button)
  if (body.batchSave) {
    const { poStatements = {}, psoStatements = {}, poCount = 12, psoCount = 3 } = body;

    // Ensure PO and PSO Configurations exist & set counts
    await Promise.all([
      prisma.pOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: reg26.id } },
        update: { poCount: Number(poCount) },
        create: { departmentId, regulationId: reg26.id, poCount: Number(poCount) },
      }),
      prisma.pSOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: reg26.id } },
        update: { psoCount: Number(psoCount) },
        create: { departmentId, regulationId: reg26.id, psoCount: Number(psoCount) },
      }),
    ]);

    // Upsert PO Statements
    const poOps = Object.entries(poStatements).map(([key, stmtText]) =>
      prisma.programOutcomeStatement.upsert({
        where: {
          departmentId_regulationId_poKey: {
            departmentId,
            regulationId: reg26.id,
            poKey: key,
          },
        },
        update: { statement: String(stmtText) },
        create: {
          departmentId,
          regulationId: reg26.id,
          poKey: key,
          statement: String(stmtText),
        },
      })
    );

    // Upsert PSO Statements
    const psoOps = Object.entries(psoStatements).map(([key, stmtText]) =>
      prisma.programSpecificOutcomeStatement.upsert({
        where: {
          departmentId_regulationId_psoKey: {
            departmentId,
            regulationId: reg26.id,
            psoKey: key,
          },
        },
        update: { statement: String(stmtText) },
        create: {
          departmentId,
          regulationId: reg26.id,
          psoKey: key,
          statement: String(stmtText),
        },
      })
    );

    await Promise.all([...poOps, ...psoOps]);

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'BATCH_SAVE_PO_PSO_STATEMENTS',
      entity: 'Department',
      entityId: departmentId,
      details: { poCount, psoCount, poSaved: Object.keys(poStatements).length, psoSaved: Object.keys(psoStatements).length },
    });

    return NextResponse.json({ success: true, message: 'All PO & PSO statements saved successfully.' });
  }

  // Fallback single statement save
  const { type, key, statement } = body;
  if (!key || !statement) {
    return NextResponse.json({ error: 'Key and Statement text are required.' }, { status: 400 });
  }

  if (type === 'PSO') {
    const updated = await prisma.programSpecificOutcomeStatement.upsert({
      where: {
        departmentId_regulationId_psoKey: {
          departmentId,
          regulationId: reg26.id,
          psoKey: key,
        },
      },
      update: { statement },
      create: {
        departmentId,
        regulationId: reg26.id,
        psoKey: key,
        statement,
      },
    });

    return NextResponse.json({ success: true, statement: updated });
  } else {
    const updated = await prisma.programOutcomeStatement.upsert({
      where: {
        departmentId_regulationId_poKey: {
          departmentId,
          regulationId: reg26.id,
          poKey: key,
        },
      },
      update: { statement },
      create: {
        departmentId,
        regulationId: reg26.id,
        poKey: key,
        statement,
      },
    });

    return NextResponse.json({ success: true, statement: updated });
  }
}
