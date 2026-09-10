import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const bundles = await prisma.departmentCurriculumBundle.findMany({
    include: {
      department: {
        include: {
          hod: { select: { name: true, email: true } },
          subjects: {
            include: {
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
                  sdgMappings: true,
                },
              },
            },
            orderBy: [{ semester: 'asc' }, { subjectCode: 'asc' }],
          },
          programOutcomeStatements: { orderBy: { poKey: 'asc' } },
          programSpecificOutcomeStatements: { orderBy: { psoKey: 'asc' } },
          programEducationalObjectiveStatements: { orderBy: { peoKey: 'asc' } },
        },
      },
      regulation: true,
      academicYear: true,
      submittedBy: { select: { name: true, email: true } },
      approvedBy: { select: { name: true, email: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ bundles });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'SUPERADMIN' && session.role !== 'MASTERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. Dean role required.' }, { status: 403 });
  }

  const { bundleId, action, correctionReason } = await req.json();

  if (!bundleId || !action) {
    return NextResponse.json({ error: 'Bundle ID and action (APPROVE/RETURN) are required.' }, { status: 400 });
  }

  const bundle = await prisma.departmentCurriculumBundle.findUnique({
    where: { id: bundleId },
    include: { department: { include: { hod: true } } },
  });

  if (!bundle) {
    return NextResponse.json({ error: 'Department Bundle not found.' }, { status: 404 });
  }

  if (action === 'APPROVE') {
    // Update Bundle Status
    const updatedBundle = await prisma.departmentCurriculumBundle.update({
      where: { id: bundleId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedById: session.userId,
        correctionReason: null,
      },
    });

    // Bulk update all HOD_APPROVED subject syllabi under this department to APPROVED!
    await prisma.subject.updateMany({
      where: {
        departmentId: bundle.departmentId,
        regulationId: bundle.regulationId,
        academicYearId: bundle.academicYearId,
        syllabusStatus: 'HOD_APPROVED',
      },
      data: {
        syllabusStatus: 'APPROVED',
      },
    });

    // Mark Stage 1 as COMPLETED if all active department bundles are approved
    const stage1 = await prisma.academicStage.findFirst({ where: { order: 1 } });
    if (stage1) {
      await prisma.academicStage.update({
        where: { id: stage1.id },
        data: { status: 'COMPLETED' },
      });
    }

    // Notify HoD
    if (bundle.department.hodId) {
      await prisma.notification.create({
        data: {
          recipientId: bundle.department.hodId,
          title: `Department Curriculum Bundle APPROVED! 🎉`,
          message: `Dean has approved the complete Department Curriculum Bundle for ${bundle.department.programmeName}. All subject syllabi are now officially approved!`,
          type: 'BUNDLE_APPROVED',
          relatedEntity: bundle.id,
        },
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'APPROVE_DEPARTMENT_CURRICULUM_BUNDLE',
      entity: 'DepartmentCurriculumBundle',
      entityId: bundle.id,
      details: { departmentId: bundle.departmentId },
    });

    return NextResponse.json({ success: true, bundle: updatedBundle });
  } else if (action === 'RETURN') {
    if (!correctionReason || !correctionReason.trim()) {
      return NextResponse.json({ error: 'Correction reason is required when returning bundle.' }, { status: 400 });
    }

    const updatedBundle = await prisma.departmentCurriculumBundle.update({
      where: { id: bundleId },
      data: {
        status: 'RETURNED_FOR_CORRECTION',
        correctionReason: correctionReason.trim(),
      },
    });

    // Notify HoD
    if (bundle.department.hodId) {
      await prisma.notification.create({
        data: {
          recipientId: bundle.department.hodId,
          title: `Department Curriculum Bundle Returned for Correction`,
          message: `Dean has returned the Department Curriculum Bundle for ${bundle.department.programmeName}. Notes: ${correctionReason.trim()}`,
          type: 'BUNDLE_RETURNED',
          relatedEntity: bundle.id,
        },
      });
    }

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'RETURN_DEPARTMENT_CURRICULUM_BUNDLE',
      entity: 'DepartmentCurriculumBundle',
      entityId: bundle.id,
      details: { departmentId: bundle.departmentId, correctionReason: correctionReason.trim() },
    });

    return NextResponse.json({ success: true, bundle: updatedBundle });
  }

  return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
}
