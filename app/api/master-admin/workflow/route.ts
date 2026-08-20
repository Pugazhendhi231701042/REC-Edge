import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'MASTERADMIN' && session.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const activeReg = await prisma.regulation.findFirst({
    where: { active: true },
  });

  const regId = activeReg ? activeReg.id : undefined;

  const [subjects, departments, users, extensionRequests, subjectTypes, subjectCategories, poConfigs] = await Promise.all([
    prisma.subject.findMany({
      where: regId ? { regulationId: regId } : {},
      include: {
        department: true,
        subjectType: true,
        subjectCategory: true,
        assignedFaculty: { select: { id: true, name: true, userCode: true, email: true } },
        submission: {
          include: {
            objectives: true,
            syllabusUnits: true,
            experiments: true,
            courseOutcomes: true,
            textbooks: true,
            references: true,
            coPoMappings: true,
            coPoJustifications: true,
            sdgMappings: true,
          },
        },
      },
      orderBy: [{ departmentId: 'asc' }, { semester: 'asc' }, { subjectCode: 'asc' }],
    }),
    prisma.department.findMany({
      where: { active: true },
      include: { hod: { select: { id: true, name: true, userCode: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, userCode: true, email: true, role: true, departmentId: true },
    }),
    prisma.extensionRequest.findMany({
      include: {
        department: true,
        stage: true,
        requestedBy: { select: { id: true, name: true, userCode: true } },
        decidedBy: { select: { id: true, name: true, userCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.subjectType.findMany({ where: { active: true } }),
    prisma.subjectCategory.findMany({ where: { active: true } }),
    prisma.pOConfiguration.findMany(),
  ]);

  const metrics = {
    departmentsCount: departments.length,
    usersCount: users.length,
    subjectsCount: subjects.length,
    activeRegCode: activeReg ? `R${activeReg.code}` : 'R2026',
    inProgressCount: subjects.filter((s) => s.syllabusStatus === 'IN_PROGRESS' || s.syllabusStatus === 'NOT_STARTED').length,
    awaitingHodCount: subjects.filter((s) => s.syllabusStatus === 'SUBMITTED' || s.syllabusStatus === 'RESUBMITTED').length,
    awaitingDeanCount: subjects.filter((s) => s.syllabusStatus === 'HOD_APPROVED').length,
    approvedCount: subjects.filter((s) => s.syllabusStatus === 'APPROVED').length,

    // Progression Percentages
    curriculumFormationPct: subjects.length > 0 ? 100 : 0,
    facultyAssignmentPct: subjects.length > 0 ? Math.round((subjects.filter((s) => s.assignedFacultyId).length / subjects.length) * 100) : 0,
    facultySyllabusPct: subjects.length > 0 ? Math.round((subjects.filter((s) => s.syllabusStatus !== 'NOT_STARTED').length / subjects.length) * 100) : 0,
    hodApprovalPct: subjects.length > 0 ? Math.round((subjects.filter((s) => s.syllabusStatus === 'HOD_APPROVED' || s.syllabusStatus === 'APPROVED').length / subjects.length) * 100) : 0,
    deanApprovalPct: subjects.length > 0 ? Math.round((subjects.filter((s) => s.syllabusStatus === 'APPROVED').length / subjects.length) * 100) : 0,

    // Health Config Status
    configStatus: {
      departments: departments.length > 0,
      users: users.length > 0,
      regulations: !!activeReg,
      subjectTypes: subjectTypes.length > 0,
      subjectCategories: subjectCategories.length > 0,
      creditWeights: true,
      poPso: poConfigs.length >= departments.length,
    },
  };

  return NextResponse.json({
    metrics,
    subjects,
    departments,
    users,
    extensionRequests,
    subjectTypes,
    subjectCategories,
    activeReg,
  });
}
