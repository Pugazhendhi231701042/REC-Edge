import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const regulations = await prisma.regulation.findMany({
    orderBy: { code: 'desc' },
  });

  const subjectTypes = await prisma.subjectType.findMany({
    orderBy: { code: 'asc' },
  });

  const subjectCategories = await prisma.subjectCategory.findMany({
    orderBy: { code: 'asc' },
  });

  return NextResponse.json({ regulations, subjectTypes, subjectCategories });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const { action, code, name, displayName, active, regId } = await req.json();

  if (action === 'SET_ACTIVE') {
    if (!regId) return NextResponse.json({ error: 'Regulation ID required.' }, { status: 400 });

    // Set all to false, then target to true
    await prisma.regulation.updateMany({ data: { active: false } });
    const updated = await prisma.regulation.update({
      where: { id: regId },
      data: { active: true },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'ACTIVATE_REGULATION',
      entity: 'Regulation',
      entityId: regId,
    });

    return NextResponse.json({ success: true, regulation: updated });
  }

  if (!code || !name) {
    return NextResponse.json({ error: 'Regulation code and name are required.' }, { status: 400 });
  }

  const created = await prisma.regulation.create({
    data: {
      code,
      name,
      displayName: displayName || name,
      active: active || false,
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'CREATE_REGULATION',
    entity: 'Regulation',
    entityId: created.id,
  });

  return NextResponse.json({ success: true, regulation: created });
}
