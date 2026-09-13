import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const deptId = searchParams.get('departmentId');
  const catCode = searchParams.get('categoryCode');

  const whereClause: any = {};
  if (deptId && deptId !== 'ALL') {
    whereClause.departmentId = deptId;
  }
  if (catCode && catCode !== 'ALL') {
    whereClause.subjectCategory = { code: catCode };
  }

  const catalogue = await prisma.subject.findMany({
    where: whereClause,
    include: {
      department: true,
      subjectType: true,
      subjectCategory: true,
      assignedFaculty: { select: { name: true, email: true, userCode: true } },
      createdBy: { select: { name: true, role: true } },
      submission: {
        include: {
          objectives: { orderBy: { order: 'asc' } },
          syllabusUnits: { orderBy: { unitNumber: 'asc' } },
          experiments: { orderBy: { experimentNumber: 'asc' } },
          courseOutcomes: { orderBy: { coNumber: 'asc' } },
          textbooks: { orderBy: { order: 'asc' } },
          references: { orderBy: { order: 'asc' } },
          coPoMappings: true,
          coPoJustifications: true,
          sdgMappings: true,
        },
      },
    },
    orderBy: [
      { department: { shortName: 'asc' } },
      { semester: 'asc' },
      { subjectCode: 'asc' },
    ],
  });

  const departments = await prisma.department.findMany({
    where: { active: true },
    select: { id: true, shortName: true, programmeName: true, departmentCode: true },
    orderBy: { shortName: 'asc' },
  });

  return NextResponse.json({ catalogue, departments });
}
