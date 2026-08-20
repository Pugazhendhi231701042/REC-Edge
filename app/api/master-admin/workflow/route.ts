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

  const [subjects, departments, users, extensionRequests] = await Promise.all([
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
  ]);

  return NextResponse.json({
    subjects,
    departments,
    users,
    extensionRequests,
  });
}
