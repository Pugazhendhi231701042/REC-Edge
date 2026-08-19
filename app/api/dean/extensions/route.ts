import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session || session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const requests = await prisma.extensionRequest.findMany({
    include: {
      stage: true,
      department: true,
      requestedBy: { select: { name: true, email: true } },
      decidedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Dean role required.' }, { status: 403 });
  }

  const { requestId, action, newDeadline } = await req.json();

  if (!requestId || !action) {
    return NextResponse.json({ error: 'Request ID and action (APPROVE/REJECT) are required.' }, { status: 400 });
  }

  const ext = await prisma.extensionRequest.findUnique({
    where: { id: requestId },
    include: { stage: true },
  });

  if (!ext) {
    return NextResponse.json({ error: 'Extension request not found.' }, { status: 404 });
  }

  const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  const updated = await prisma.extensionRequest.update({
    where: { id: requestId },
    data: {
      status,
      decidedById: session.userId,
      decidedAt: new Date(),
    },
  });

  if (action === 'APPROVE') {
    // Update AcademicStage deadline
    await prisma.academicStage.update({
      where: { id: ext.stageId },
      data: { deadline: ext.requestedDeadline },
    });
  }

  // Notify HoD
  await prisma.notification.create({
    data: {
      recipientId: ext.requestedById,
      title: `Extension Request ${status}`,
      message: action === 'APPROVE' 
        ? `Your deadline extension request for ${ext.stage.name} was approved until ${new Date(ext.requestedDeadline).toLocaleDateString()}.`
        : `Your deadline extension request for ${ext.stage.name} was rejected. Original deadline remains.`,
      type: 'EXTENSION_DECIDED',
      relatedEntity: ext.id,
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: `EXTENSION_REQUEST_${status}`,
    entity: 'ExtensionRequest',
    entityId: ext.id,
    details: { status, requestedDeadline: ext.requestedDeadline },
  });

  return NextResponse.json({ success: true, extensionRequest: updated });
}
