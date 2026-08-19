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

  const { stageId, deadline } = await req.json();

  if (!stageId || !deadline) {
    return NextResponse.json({ error: 'Stage ID and deadline date are required.' }, { status: 400 });
  }

  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return NextResponse.json({ error: 'Invalid deadline date format.' }, { status: 400 });
  }

  const stage = await prisma.academicStage.update({
    where: { id: stageId },
    data: {
      status: 'ACTIVE',
      startDate: new Date(),
      deadline: deadlineDate,
      initiatedById: session.userId,
      initiatedAt: new Date(),
    },
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
    deadlineDate.toLocaleString(),
    activeReg ? activeReg.displayName : 'Regulation 26',
    activeAY ? activeAY.year : '2026–2027'
  );

  for (const hod of hodUsers) {
    // In-app notification
    await prisma.notification.create({
      data: {
        recipientId: hod.id,
        title: `Academic Stage Initiated: ${stage.name}`,
        message: `Dean has initiated stage "${stage.name}". Required deadline: ${deadlineDate.toLocaleDateString()}. Please begin curriculum formation.`,
        type: 'STAGE_INITIATED',
        relatedEntity: stage.id,
      },
    });

    // Send Email
    await sendEmail({
      to: hod.email,
      subject: `[REC Edge] Academic Stage Initiated: ${stage.name}`,
      html: emailHtml,
    });
  }

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'INITIATE_ACADEMIC_STAGE',
    entity: 'AcademicStage',
    entityId: stage.id,
    details: { deadline: deadlineDate.toISOString(), hodsNotifiedCount: hodUsers.length },
  });

  return NextResponse.json({ success: true, stage });
}
