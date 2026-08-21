import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  // Get department ID from query or session
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId') || session.departmentId;

  if (!departmentId) {
    return NextResponse.json({ poStatements: [], psoStatements: [] });
  }

  const reg26 = await prisma.regulation.findUnique({ where: { code: '26' } });
  if (!reg26) {
    return NextResponse.json({ poStatements: [], psoStatements: [] });
  }

  const [poStatements, psoStatements] = await Promise.all([
    prisma.programOutcomeStatement.findMany({
      where: { departmentId, regulationId: reg26.id },
      orderBy: { poKey: 'asc' },
    }),
    prisma.programSpecificOutcomeStatement.findMany({
      where: { departmentId, regulationId: reg26.id },
      orderBy: { psoKey: 'asc' },
    }),
  ]);

  return NextResponse.json({ poStatements, psoStatements });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'HOD' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. HoD or MasterAdmin role required.' }, { status: 403 });
  }

  const { departmentId: targetDeptId, type, key, statement } = await req.json();
  const departmentId = targetDeptId || session.departmentId;

  if (!departmentId || !key || !statement) {
    return NextResponse.json({ error: 'Department ID, Key, and Statement text are required.' }, { status: 400 });
  }

  const reg26 = await prisma.regulation.findUnique({ where: { code: '26' } });
  if (!reg26) {
    return NextResponse.json({ error: 'Regulation 26 not found.' }, { status: 404 });
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

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'UPDATE_PSO_STATEMENT',
      entity: 'ProgramSpecificOutcomeStatement',
      entityId: updated.id,
      details: { psoKey: key, statement },
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

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'UPDATE_PO_STATEMENT',
      entity: 'ProgramOutcomeStatement',
      entityId: updated.id,
      details: { poKey: key, statement },
    });

    return NextResponse.json({ success: true, statement: updated });
  }
}
