import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendEmail, buildCorrectionRequestEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'HOD') {
    return NextResponse.json({ error: 'Unauthorized. HoD role required.' }, { status: 403 });
  }

  const { subjectId, action, reason } = await req.json();

  if (!subjectId || !action) {
    return NextResponse.json({ error: 'Subject ID and action (APPROVE/RETURN) are required.' }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      assignedFaculty: true,
      submission: true,
    },
  });

  if (!subject || subject.departmentId !== session.departmentId) {
    return NextResponse.json({ error: 'Subject not found or access denied.' }, { status: 403 });
  }

  if (action === 'RETURN') {
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'A correction reason is mandatory when returning a syllabus.' }, { status: 400 });
    }

    await prisma.subject.update({
      where: { id: subjectId },
      data: { syllabusStatus: 'RETURNED_FOR_CORRECTION' },
    });

    if (subject.submission) {
      await prisma.syllabusSubmission.update({
        where: { id: subject.submission.id },
        data: {
          correctionReason: reason.trim(),
          returnedAt: new Date(),
        },
      });
    }

    if (subject.assignedFaculty) {
      // In-app Notification
      await prisma.notification.create({
        data: {
          recipientId: subject.assignedFaculty.id,
          title: `Syllabus Returned for Correction: ${subject.subjectCode}`,
          message: `Reason: ${reason.trim()}`,
          type: 'CORRECTION_REQUESTED',
          relatedEntity: subject.id,
        },
      });

      // Email Notification
      const emailHtml = buildCorrectionRequestEmail(subject.subjectName, subject.subjectCode, reason.trim());
      await sendEmail({
        to: subject.assignedFaculty.email,
        subject: `[REC Edge] Action Required: Syllabus Returned for Correction (${subject.subjectCode})`,
        html: emailHtml,
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'HOD_RETURNED_SYLLABUS',
      entity: 'Subject',
      entityId: subject.id,
      details: { reason: reason.trim() },
    });

    return NextResponse.json({ success: true, status: 'RETURNED_FOR_CORRECTION' });
  } else if (action === 'APPROVE') {
    await prisma.subject.update({
      where: { id: subjectId },
      data: { syllabusStatus: 'APPROVED' },
    });

    if (subject.submission) {
      await prisma.syllabusSubmission.update({
        where: { id: subject.submission.id },
        data: {
          approvedAt: new Date(),
          approvedById: session.userId,
        },
      });
    }

    if (subject.assignedFaculty) {
      await prisma.notification.create({
        data: {
          recipientId: subject.assignedFaculty.id,
          title: `Syllabus Approved: ${subject.subjectCode}`,
          message: `Your syllabus for ${subject.subjectCode} - ${subject.subjectName} has been approved by the Head of Department.`,
          type: 'SYLLABUS_APPROVED',
          relatedEntity: subject.id,
        },
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'HOD_APPROVED_SYLLABUS',
      entity: 'Subject',
      entityId: subject.id,
    });

    return NextResponse.json({ success: true, status: 'APPROVED' });
  }

  return NextResponse.json({ error: 'Invalid review action.' }, { status: 400 });
}
