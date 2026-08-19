import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session || session.role !== 'FACULTY') {
    return NextResponse.json({ error: 'Unauthorized. Faculty role required.' }, { status: 403 });
  }

  const subjects = await prisma.subject.findMany({
    where: { assignedFacultyId: session.userId },
    include: {
      department: true,
      subjectType: true,
      subjectCategory: true,
      submission: {
        select: {
          id: true,
          updatedAt: true,
          approvedAt: true,
          correctionReason: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const activeStage = await prisma.academicStage.findFirst({ where: { status: 'ACTIVE' } });

  return NextResponse.json({ subjects, activeStage });
}
