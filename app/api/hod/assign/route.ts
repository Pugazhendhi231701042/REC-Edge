import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'HOD') {
    return NextResponse.json({ error: 'Unauthorized. HoD role required.' }, { status: 403 });
  }

  const { subjectId, subjectIds, facultyId, deadline } = await req.json();

  const targetIds: string[] = Array.isArray(subjectIds)
    ? subjectIds
    : subjectId
    ? [subjectId]
    : [];

  if (targetIds.length === 0 || !facultyId) {
    return NextResponse.json({ error: 'At least one Subject ID and Faculty ID are required.' }, { status: 400 });
  }

  const facultyUser = await prisma.user.findUnique({
    where: { id: facultyId },
  });

  if (!facultyUser || facultyUser.role !== 'FACULTY' || facultyUser.departmentId !== session.departmentId) {
    return NextResponse.json({ error: 'Faculty member must belong to your department.' }, { status: 400 });
  }

  const deadlineDate = deadline ? new Date(deadline) : null;
  if (deadlineDate && deadlineDate.getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Faculty assignment deadline date must be in the future.' }, { status: 400 });
  }

  const updatedBatch = await prisma.subject.updateMany({
    where: {
      id: { in: targetIds },
      departmentId: session.departmentId || undefined,
    },
    data: {
      assignedFacultyId: facultyId,
      facultyDeadline: deadlineDate,
      status: 'ASSIGNED',
      syllabusStatus: 'IN_PROGRESS',
      assignedAt: new Date(),
    },
  });

  // Notification for Faculty Member
  await prisma.notification.create({
    data: {
      recipientId: facultyId,
      title: 'New Subject(s) Assigned',
      message: `You have been assigned ${updatedBatch.count} subject(s) by your Head of Department.`,
      type: 'ASSIGNMENT',
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'BULK_ASSIGN_FACULTY',
    entity: 'Subject',
    entityId: targetIds.join(','),
    details: { assignedFacultyId: facultyId, count: updatedBatch.count, facultyDeadline: deadlineDate },
  });

  return NextResponse.json({ success: true, count: updatedBatch.count });
}
