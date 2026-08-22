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
        include: {
          objectives: { orderBy: { id: 'asc' } },
          syllabusUnits: { orderBy: { unitNumber: 'asc' } },
          experiments: { orderBy: { experimentNumber: 'asc' } },
          courseOutcomes: { orderBy: { coNumber: 'asc' } },
          textbooks: { orderBy: { id: 'asc' } },
          references: { orderBy: { id: 'asc' } },
          coPoMappings: true,
          coPoJustifications: true,
          sdgMappings: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const activeStage = await prisma.academicStage.findFirst({ where: { status: 'ACTIVE' } });

  return NextResponse.json({ subjects, activeStage });
}
