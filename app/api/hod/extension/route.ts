import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'HOD') {
    return NextResponse.json({ error: 'Unauthorized. HoD role required.' }, { status: 403 });
  }

  const { requestedDeadline, reason } = await req.json();

  if (!requestedDeadline || !reason || !reason.trim()) {
    return NextResponse.json({ error: 'Requested deadline date and reason are required.' }, { status: 400 });
  }

  const activeStage = await prisma.academicStage.findFirst({ where: { status: 'ACTIVE' } });
  if (!activeStage) {
    return NextResponse.json({ error: 'No active academic stage found.' }, { status: 400 });
  }

  const newDeadlineDate = new Date(requestedDeadline);
  if (isNaN(newDeadlineDate.getTime())) {
    return NextResponse.json({ error: 'Invalid requested deadline date.' }, { status: 400 });
  }

  const deptId = session.departmentId;
  if (!deptId) {
    return NextResponse.json({ error: 'Department ID missing.' }, { status: 400 });
  }

  const reqExt = await prisma.extensionRequest.create({
    data: {
      stageId: activeStage.id,
      departmentId: deptId,
      requestedById: session.userId,
      currentDeadline: activeStage.deadline || new Date(),
      requestedDeadline: newDeadlineDate,
      reason: reason.trim(),
      status: 'PENDING',
    },
  });

  // Notify Dean
  const dean = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
  if (dean) {
    await prisma.notification.create({
      data: {
        recipientId: dean.id,
        title: `Deadline Extension Requested`,
        message: `HoD has requested a deadline extension until ${newDeadlineDate.toLocaleDateString()} for stage "${activeStage.name}". Reason: ${reason.trim()}`,
        type: 'EXTENSION_REQUESTED',
        relatedEntity: reqExt.id,
      },
    });
  }

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'REQUEST_DEADLINE_EXTENSION',
    entity: 'ExtensionRequest',
    entityId: reqExt.id,
    details: { requestedDeadline: newDeadlineDate.toISOString(), reason: reason.trim() },
  });

  return NextResponse.json({ success: true, extensionRequest: reqExt });
}
