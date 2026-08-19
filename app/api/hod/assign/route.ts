import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendEmail, buildSubjectAssignmentEmail } from '@/lib/email';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'HOD') {
    return NextResponse.json({ error: 'Unauthorized. HoD role required.' }, { status: 403 });
  }

  const { subjectId, facultyId } = await req.json();

  if (!subjectId || !facultyId) {
    return NextResponse.json({ error: 'Subject ID and Faculty ID are required.' }, { status: 400 });
  }

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { department: true, subjectCategory: true },
  });

  if (!subject || subject.departmentId !== session.departmentId) {
    return NextResponse.json({ error: 'Subject not found or access denied.' }, { status: 403 });
  }

  const facultyUser = await prisma.user.findUnique({
    where: { id: facultyId },
  });

  if (!facultyUser || facultyUser.role !== 'FACULTY' || facultyUser.departmentId !== session.departmentId) {
    return NextResponse.json({ error: 'Faculty member must belong to your department.' }, { status: 400 });
  }

  const updated = await prisma.subject.update({
    where: { id: subjectId },
    data: {
      assignedFacultyId: facultyId,
      status: 'ASSIGNED',
      syllabusStatus: 'IN_PROGRESS',
      assignedAt: new Date(),
    },
  });

  const activeStage = await prisma.academicStage.findFirst({ where: { status: 'ACTIVE' } });
  const deadlineStr = activeStage?.deadline ? new Date(activeStage.deadline).toLocaleDateString() : 'As specified';

  // In-app Notification
  await prisma.notification.create({
    data: {
      recipientId: facultyId,
      title: `Syllabus Task Assigned: ${subject.subjectCode}`,
      message: `You have been assigned syllabus preparation for ${subject.subjectCode} - ${subject.subjectName}. Deadline: ${deadlineStr}.`,
      type: 'SUBJECT_ASSIGNED',
      relatedEntity: subject.id,
    },
  });

  // Email Notification
  const ltpcStr = `${subject.lecture}-${subject.tutorial}-${subject.practical}-${subject.credits}`;
  const emailHtml = buildSubjectAssignmentEmail(
    subject.subjectName,
    subject.subjectCode,
    subject.subjectCategory.code,
    ltpcStr,
    deadlineStr
  );

  await sendEmail({
    to: facultyUser.email,
    subject: `[REC Edge] Syllabus Task Assigned: ${subject.subjectCode}`,
    html: emailHtml,
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'ASSIGN_SUBJECT_FACULTY',
    entity: 'Subject',
    entityId: subject.id,
    details: { assignedFacultyId: facultyId, facultyEmail: facultyUser.email },
  });

  return NextResponse.json({ success: true, subject: updated });
}
