import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendEmail, buildStageInitiatedEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const stages = await prisma.academicStage.findMany({
    include: {
      initiatedBy: { select: { name: true, email: true } },
    },
    orderBy: { order: 'asc' },
  });

  const stage1 = stages.find((s) => s.order === 1);
  const stage2 = stages.find((s) => s.order === 2);
  const now = new Date();
  const isStage1Completed = stage1?.status === 'COMPLETED';
  const isStage2TimeStarted = stage2?.startDate ? now >= new Date(stage2.startDate) : false;
  const isStep2Unlocked = Boolean(isStage1Completed && isStage2TimeStarted);

  return NextResponse.json({ stages, isStep2Unlocked, isStage1Completed, isStage2TimeStarted });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. Only Dean can set academic stage deadlines.' }, { status: 403 });
  }

  const body = await req.json();

  // Support bulk configuration of all stages
  if (body.action === 'BULK_UPDATE_STAGES' && Array.isArray(body.stages)) {
    // Sort stages by order
    const sorted = [...body.stages].sort((a, b) => (a.order || 0) - (b.order || 0));

    // Validate dates: end > start, and next start >= prev end
    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      if (!current.startDate || !current.deadline) {
        return NextResponse.json({ error: `Start date and End date/time are required for Stage ${current.order}: ${current.name}.` }, { status: 400 });
      }
      const start = new Date(current.startDate).getTime();
      const end = new Date(current.deadline).getTime();
      if (end <= start) {
        return NextResponse.json({ error: `End date must be after Start date for Stage ${current.order}: ${current.name}.` }, { status: 400 });
      }
      if (i > 0) {
        const prevEnd = new Date(sorted[i - 1].deadline).getTime();
        if (start < prevEnd) {
          return NextResponse.json({ error: `Stage ${current.order} (${current.name}) start date must be on or after Stage ${sorted[i - 1].order} (${sorted[i - 1].name}) end date.` }, { status: 400 });
        }
      }
    }

    const updatedStages = [];
    for (const item of body.stages) {
      if (!item.id) continue;
      const updateData: any = {};
      if (item.startDate) updateData.startDate = new Date(item.startDate);
      if (item.deadline) updateData.deadline = new Date(item.deadline);
      if (item.status) updateData.status = item.status;
      updateData.initiatedById = session.userId;
      updateData.initiatedAt = new Date();

      const stage = await prisma.academicStage.update({
        where: { id: item.id },
        data: updateData,
      });
      updatedStages.push(stage);
    }

    // Notify all active HoDs
    const hodUsers = await prisma.user.findMany({
      where: { role: 'HOD', active: true },
    });

    for (const hod of hodUsers) {
      await prisma.notification.create({
        data: {
          recipientId: hod.id,
          title: `Academic Stage Deadlines Updated`,
          message: `Dean has configured deadlines for all 4 academic stages. Please check your dashboard timeline.`,
          type: 'STAGE_INITIATED',
        },
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'BULK_UPDATE_STAGE_DEADLINES',
      entity: 'AcademicStage',
      details: { count: updatedStages.length },
    });

    return NextResponse.json({ success: true, stages: updatedStages });
  }

  // Single stage update
  const { stageId, deadline, startDate, venue, status } = body;
  if (!stageId) {
    return NextResponse.json({ error: 'Stage ID is required.' }, { status: 400 });
  }

  const stageToUpdate = await prisma.academicStage.findUnique({ where: { id: stageId } });
  if (!stageToUpdate) {
    return NextResponse.json({ error: 'Academic stage not found.' }, { status: 404 });
  }

  const updateData: any = {
    status: status || 'ACTIVE',
    initiatedById: session.userId,
    initiatedAt: new Date(),
  };

  if (startDate) updateData.startDate = new Date(startDate);
  if (deadline) updateData.deadline = new Date(deadline);
  if (venue !== undefined) updateData.venue = venue ? venue.trim() : null;

  const stage = await prisma.academicStage.update({
    where: { id: stageId },
    data: updateData,
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'UPDATE_STAGE_DEADLINE',
    entity: 'AcademicStage',
    entityId: stage.id,
    details: { name: stage.name, deadline: stage.deadline },
  });

  return NextResponse.json({ success: true, stage });
}
