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

  // Fetch all active departments
  const departments = await prisma.department.findMany({
    where: { active: true },
    select: {
      id: true,
      programmeName: true,
      programmeType: true,
      shortName: true,
      departmentCode: true,
      semesters: true,
      _count: {
        select: {
          subjects: {
            where: { syllabusStatus: 'APPROVED' },
          },
        },
      },
    },
    orderBy: { shortName: 'asc' },
  });

  // Where condition for approved subjects
  const whereClause: any = {
    syllabusStatus: 'APPROVED',
  };

  if (deptId && deptId !== 'ALL') {
    whereClause.departmentId = deptId;
  }

  const subjects = await prisma.subject.findMany({
    where: whereClause,
    include: {
      department: {
        select: {
          id: true,
          shortName: true,
          programmeName: true,
          departmentCode: true,
        },
      },
      subjectType: true,
      subjectCategory: true,
      assignedFaculty: {
        select: { name: true, email: true, userCode: true },
      },
      submission: {
        select: {
          id: true,
          version: true,
          theoryContactHours: true,
          labContactHours: true,
          totalContactHours: true,
        },
      },
    },
    orderBy: [
      { department: { shortName: 'asc' } },
      { semester: 'asc' },
      { subjectCode: 'asc' },
    ],
  });

  return NextResponse.json({ departments, subjects });
}
