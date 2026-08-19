import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const activeStage = await prisma.academicStage.findFirst({
    where: { status: 'ACTIVE' },
  });

  const departments = await prisma.department.findMany({
    include: {
      hod: { select: { name: true, email: true } },
      subjects: {
        select: {
          id: true,
          status: true,
          syllabusStatus: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  // Calculate department metrics
  const deptSummaries = departments.map((d) => {
    const totalSubjects = d.subjects.length;
    const assignedCount = d.subjects.filter((s) => s.status === 'ASSIGNED').length;
    const submittedCount = d.subjects.filter((s) => s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED' || s.syllabusStatus === 'APPROVED').length;
    const approvedCount = d.subjects.filter((s) => s.syllabusStatus === 'APPROVED').length;
    const pendingCount = totalSubjects - approvedCount;
    const completionPercentage = totalSubjects > 0 ? Math.round((approvedCount / totalSubjects) * 100) : 0;

    return {
      id: d.id,
      programmeType: d.programmeType,
      programmeName: d.programmeName,
      shortName: d.shortName,
      departmentCode: d.departmentCode,
      semesters: d.semesters,
      hodName: d.hod ? d.hod.name : 'Unassigned',
      facultyCount: d._count.users,
      totalSubjects,
      assignedCount,
      submittedCount,
      approvedCount,
      pendingCount,
      completionPercentage,
    };
  });

  const overallTotalSubjects = deptSummaries.reduce((sum, d) => sum + d.totalSubjects, 0);
  const overallApproved = deptSummaries.reduce((sum, d) => sum + d.approvedCount, 0);
  const overallCompletionPercentage = overallTotalSubjects > 0 ? Math.round((overallApproved / overallTotalSubjects) * 100) : 0;

  // Fetch HoD-APPROVED Syllabi for Dean drill-down (Strictly enforcement of Rule 58)
  const approvedSyllabi = await prisma.subject.findMany({
    where: { syllabusStatus: 'APPROVED' },
    include: {
      department: true,
      subjectType: true,
      subjectCategory: true,
      assignedFaculty: { select: { name: true, email: true } },
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
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({
    activeStage,
    overallTotalSubjects,
    overallApproved,
    overallCompletionPercentage,
    deptSummaries,
    approvedSyllabi,
  });
}
