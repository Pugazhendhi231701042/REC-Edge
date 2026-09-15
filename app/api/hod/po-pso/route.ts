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

  const activeReg = await prisma.regulation.findFirst({ where: { active: true } }) || await prisma.regulation.findFirst();
  if (!activeReg) {
    return NextResponse.json({ poStatements: [], psoStatements: [], poCount: 12, psoCount: 3, isConfirmed: false });
  }

  const [poStatements, psoStatements, peoStatements, poConfig, psoConfig] = await Promise.all([
    prisma.programOutcomeStatement.findMany({
      where: { departmentId, regulationId: activeReg.id },
      orderBy: { poKey: 'asc' },
    }),
    prisma.programSpecificOutcomeStatement.findMany({
      where: { departmentId, regulationId: activeReg.id },
      orderBy: { psoKey: 'asc' },
    }),
    prisma.programEducationalObjectiveStatement.findMany({
      where: { departmentId, regulationId: activeReg.id },
      orderBy: { peoKey: 'asc' },
    }),
    prisma.pOConfiguration.findUnique({
      where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
    }),
    prisma.pSOConfiguration.findUnique({
      where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
    }),
  ]);

  const poCount = poConfig ? poConfig.poCount : (poStatements.length > 0 ? poStatements.length : 12);
  const psoCount = psoConfig ? psoConfig.psoCount : (psoStatements.length > 0 ? psoStatements.length : 3);
  const isConfirmed = !!(poConfig || psoConfig || poStatements.length > 0 || psoStatements.length > 0 || peoStatements.length > 0);
  const isLocked = Boolean(poConfig?.isLocked || psoConfig?.isLocked);
  const lockedAt = poConfig?.lockedAt || psoConfig?.lockedAt || null;

  return NextResponse.json({
    poStatements,
    psoStatements,
    peoStatements,
    poCount,
    psoCount,
    isConfirmed,
    isLocked,
    lockedAt,
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

  const activeReg = await prisma.regulation.findFirst({ where: { active: true } }) || await prisma.regulation.findFirst();
  if (!activeReg) {
    return NextResponse.json({ error: 'No active regulation configured.' }, { status: 404 });
  }

  const [existingPoConfig, existingPsoConfig] = await Promise.all([
    prisma.pOConfiguration.findUnique({
      where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
    }),
    prisma.pSOConfiguration.findUnique({
      where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
    }),
  ]);

  const isAlreadyLocked = Boolean(existingPoConfig?.isLocked || existingPsoConfig?.isLocked);

  // Handle explicit LOCK_PO_PSO action
  if (body.action === 'LOCK_PO_PSO') {
    const [poStmtCount, psoStmtCount] = await Promise.all([
      prisma.programOutcomeStatement.count({ where: { departmentId, regulationId: activeReg.id } }),
      prisma.programSpecificOutcomeStatement.count({ where: { departmentId, regulationId: activeReg.id } }),
    ]);

    if (poStmtCount === 0 || psoStmtCount === 0) {
      return NextResponse.json(
        { error: 'Cannot lock: Both PO and PSO statements must be created and saved first.' },
        { status: 400 }
      );
    }

    const now = new Date();
    await Promise.all([
      prisma.pOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
        update: { isLocked: true, lockedAt: now },
        create: { departmentId, regulationId: activeReg.id, poCount: 12, isLocked: true, lockedAt: now },
      }),
      prisma.pSOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
        update: { isLocked: true, lockedAt: now },
        create: { departmentId, regulationId: activeReg.id, psoCount: 3, isLocked: true, lockedAt: now },
      }),
    ]);

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'LOCK_PO_PSO_STATEMENTS',
      entity: 'POConfiguration',
      entityId: departmentId,
      details: { lockedAt: now },
    });

    return NextResponse.json({ success: true, isLocked: true, message: 'POs and PSOs locked successfully.' });
  }

  // Prevent modifications if already locked
  if (isAlreadyLocked) {
    return NextResponse.json(
      { error: 'Program Outcomes (POs) and Program Specific Outcomes (PSOs) are locked and cannot be edited.' },
      { status: 400 }
    );
  }

  // Handle Structure Confirmation (Setting PO/PSO counts)
  if (body.action === 'CONFIRM_STRUCTURE') {
    const poCount = Number(body.poCount) || 12;
    const psoCount = Number(body.psoCount) || 3;

    await Promise.all([
      prisma.pOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
        update: { poCount },
        create: { departmentId, regulationId: activeReg.id, poCount },
      }),
      prisma.pSOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
        update: { psoCount },
        create: { departmentId, regulationId: activeReg.id, psoCount },
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
    const { poStatements = {}, psoStatements = {}, peoStatements = {}, poCount = 12, psoCount = 3 } = body;

    // Ensure PO and PSO Configurations exist & set counts
    await Promise.all([
      prisma.pOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
        update: { poCount: Number(poCount) },
        create: { departmentId, regulationId: activeReg.id, poCount: Number(poCount) },
      }),
      prisma.pSOConfiguration.upsert({
        where: { departmentId_regulationId: { departmentId, regulationId: activeReg.id } },
        update: { psoCount: Number(psoCount) },
        create: { departmentId, regulationId: activeReg.id, psoCount: Number(psoCount) },
      }),
    ]);

    // Upsert PO Statements
    const poOps = Object.entries(poStatements).map(([key, stmtText]) =>
      prisma.programOutcomeStatement.upsert({
        where: {
          departmentId_regulationId_poKey: {
            departmentId,
            regulationId: activeReg.id,
            poKey: key,
          },
        },
        update: { statement: String(stmtText) },
        create: {
          departmentId,
          regulationId: activeReg.id,
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
            regulationId: activeReg.id,
            psoKey: key,
          },
        },
        update: { statement: String(stmtText) },
        create: {
          departmentId,
          regulationId: activeReg.id,
          psoKey: key,
          statement: String(stmtText),
        },
      })
    );

    // Upsert PEO Statements
    const peoOps = Object.entries(peoStatements).map(([key, stmtText]) =>
      prisma.programEducationalObjectiveStatement.upsert({
        where: {
          departmentId_regulationId_peoKey: {
            departmentId,
            regulationId: activeReg.id,
            peoKey: key,
          },
        },
        update: { statement: String(stmtText) },
        create: {
          departmentId,
          regulationId: activeReg.id,
          peoKey: key,
          statement: String(stmtText),
        },
      })
    );

    await Promise.all([...poOps, ...psoOps, ...peoOps]);

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'BATCH_SAVE_PO_PSO_PEO_STATEMENTS',
      entity: 'Department',
      entityId: departmentId,
      details: { poCount, psoCount, peoSaved: Object.keys(peoStatements).length },
    });

    return NextResponse.json({ success: true, message: 'All PO, PSO & PEO statements saved successfully.' });
  }

  // Fallback single statement save
  const { type, key, statement } = body;
  if (!key || !statement) {
    return NextResponse.json({ error: 'Key and Statement text are required.' }, { status: 400 });
  }

  if (type === 'PEO') {
    const updated = await prisma.programEducationalObjectiveStatement.upsert({
      where: {
        departmentId_regulationId_peoKey: {
          departmentId,
          regulationId: activeReg.id,
          peoKey: key,
        },
      },
      update: { statement },
      create: {
        departmentId,
        regulationId: activeReg.id,
        peoKey: key,
        statement,
      },
    });

    return NextResponse.json({ success: true, statement: updated });
  } else if (type === 'PSO') {
    const updated = await prisma.programSpecificOutcomeStatement.upsert({
      where: {
        departmentId_regulationId_psoKey: {
          departmentId,
          regulationId: activeReg.id,
          psoKey: key,
        },
      },
      update: { statement },
      create: {
        departmentId,
        regulationId: activeReg.id,
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
          regulationId: activeReg.id,
          poKey: key,
        },
      },
      update: { statement },
      create: {
        departmentId,
        regulationId: activeReg.id,
        poKey: key,
        statement,
      },
    });

    return NextResponse.json({ success: true, statement: updated });
  }
}
