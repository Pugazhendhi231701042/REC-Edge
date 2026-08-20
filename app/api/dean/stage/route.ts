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
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ stages });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Only Dean can initiate academic stages.' }, { status: 403 });
  }

  const { stageId, deadline, venue, status } = await req.json();

  if (!stageId) {
    return NextResponse.json({ error: 'Stage ID is required.' }, { status: 400 });
  }

  const stageToUpdate = await prisma.academicStage.findUnique({ where: { id: stageId } });
  if (!stageToUpdate) {
    return NextResponse.json({ error: 'Academic stage not found.' }, { status: 404 });
  }

  const isMeetingStage = stageToUpdate.name.includes('DAC') || stageToUpdate.name.includes('BoS');

  let deadlineDate: Date | null = null;
  if (deadline) {
    deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json({ error: 'Invalid deadline date format.' }, { status: 400 });
    }
  }

  if (!isMeetingStage && !deadlineDate) {
    return NextResponse.json({ error: 'Deadline date is required for this stage.' }, { status: 400 });
  }

  const updateData: any = {
    status: status || 'ACTIVE',
    startDate: new Date(),
    initiatedById: session.userId,
    initiatedAt: new Date(),
  };

  if (deadlineDate) {
    updateData.deadline = deadlineDate;
  }
  if (venue !== undefined) {
    updateData.venue = venue ? venue.trim() : null;
  }

  const stage = await prisma.academicStage.update({
    where: { id: stageId },
    data: updateData,
  });

  const activeReg = await prisma.regulation.findFirst({ where: { active: true } });
  const activeAY = await prisma.academicYear.findFirst({ where: { active: true } });

  // Fetch all active HoDs to notify them
  const hodUsers = await prisma.user.findMany({
    where: { role: 'HOD', active: true },
    include: { department: true },
  });

  const emailHtml = buildStageInitiatedEmail(
    stage.name,
    deadlineDate ? deadlineDate.toLocaleString() : 'As Scheduled',
    activeReg ? activeReg.displayName : 'Regulation 26',
    activeAY ? activeAY.year : '2026–2027'
  );

  for (const hod of hodUsers) {
    // In-app notification
    await prisma.notification.create({
      data: {
        recipientId: hod.id,
        title: `Academic Stage Update: ${stage.name}`,
        message: isMeetingStage
          ? `Dean has scheduled stage "${stage.name}". Date: ${deadlineDate ? deadlineDate.toLocaleDateString() : 'TBD'}, Venue: ${venue || 'TBD'}.`
          : `Dean has initiated stage "${stage.name}". Deadline: ${deadlineDate ? deadlineDate.toLocaleDateString() : 'N/A'}.`,
        type: 'STAGE_INITIATED',
        relatedEntity: stage.id,
      },
    });

    // Send Email
    await sendEmail({
      to: hod.email,
      subject: `[REC Edge] Academic Stage Update: ${stage.name}`,
      html: emailHtml,
    });
  }

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'INITIATE_ACADEMIC_STAGE',
    entity: 'AcademicStage',
    entityId: stage.id,
    details: { deadline: deadlineDate ? deadlineDate.toISOString() : null, venue, hodsNotifiedCount: hodUsers.length },
  });

  return NextResponse.json({ success: true, stage });
}
