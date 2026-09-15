import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      userCode: true,
      email: true,
      name: true,
      role: true,
      departmentId: true,
      active: true,
      createdAt: true,
      department: { select: { id: true, shortName: true, programmeName: true, departmentCode: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'MASTERADMIN' && session.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  try {
    const { action, userId, userCode, email, name, role, departmentId, newPassword } = await req.json();

    // RESET_PASSWORD Action
    if (action === 'RESET_PASSWORD') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
      }
      const resetPass = newPassword && newPassword.trim() ? newPassword.trim() : 'Changeme@123';
      const hashedPassword = await hashPassword(resetPass);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      await logAudit({
        userId: session.userId,
        userRole: session.role,
        action: 'RESET_USER_PASSWORD',
        entity: 'User',
        entityId: userId,
      });
      return NextResponse.json({ success: true, message: `Password reset successfully to '${resetPass}'.` });
    }

    // DELETE_USER Action
    if (action === 'DELETE_USER') {
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
      }
      if (userId === session.userId) {
        return NextResponse.json({ error: 'Cannot delete your own active MasterAdmin account.' }, { status: 400 });
      }

      const targetUser = await prisma.user.findUnique({ where: { id: userId } });
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      }

      // Check minimum 1 MasterAdmin constraint
      if (targetUser.role === 'MASTERADMIN') {
        const masterAdminCount = await prisma.user.count({ where: { role: 'MASTERADMIN' } });
        if (masterAdminCount <= 1) {
          return NextResponse.json(
            { error: 'Cannot delete this account. At least one MasterAdmin account must remain in the system.' },
            { status: 400 }
          );
        }
      }

      // Perform safe foreign key cleanup and deletion in a single transaction
      await prisma.$transaction(async (tx) => {
        // 1. Unassign HoD if this user heads any department
        await tx.department.updateMany({
          where: { hodId: userId },
          data: { hodId: null },
        });

        // 2. Unassign from assigned faculty on subjects
        await tx.subject.updateMany({
          where: { assignedFacultyId: userId },
          data: { assignedFacultyId: null },
        });

        // 3. Reassign subject creator to current master admin to preserve subjects
        await tx.subject.updateMany({
          where: { createdById: userId },
          data: { createdById: session.userId },
        });

        // 4. Nullify stage initiator
        await tx.academicStage.updateMany({
          where: { initiatedById: userId },
          data: { initiatedById: null },
        });

        // 5. Clean up extension requests
        await tx.extensionRequest.updateMany({
          where: { decidedById: userId },
          data: { decidedById: null },
        });
        await tx.extensionRequest.deleteMany({
          where: { requestedById: userId },
        });

        // 6. Clean up syllabus submissions
        await tx.syllabusSubmission.updateMany({
          where: { approvedById: userId },
          data: { approvedById: null },
        });
        await tx.syllabusSubmission.updateMany({
          where: { facultyId: userId },
          data: { facultyId: session.userId },
        });

        // 7. Clean up curriculum bundles
        await tx.departmentCurriculumBundle.updateMany({
          where: { approvedById: userId },
          data: { approvedById: null },
        });
        await tx.departmentCurriculumBundle.updateMany({
          where: { submittedById: userId },
          data: { submittedById: null },
        });

        // 8. Clean up programme curriculum submissions
        await tx.programmeCurriculumSubmission.updateMany({
          where: { approvedById: userId },
          data: { approvedById: null },
        });
        await tx.programmeCurriculumSubmission.updateMany({
          where: { submittedById: userId },
          data: { submittedById: null },
        });

        // 9. Delete personal notifications
        await tx.notification.deleteMany({
          where: { recipientId: userId },
        });

        // 10. Delete audit logs associated with this user
        await tx.auditLog.deleteMany({
          where: { userId },
        });

        // 11. Finally delete the user account
        await tx.user.delete({ where: { id: userId } });
      });

      await logAudit({
        userId: session.userId,
        userRole: session.role,
        action: 'DELETE_USER',
        entity: 'User',
        entityId: userId,
        details: { deletedEmail: targetUser.email, deletedRole: targetUser.role },
      });
      return NextResponse.json({ success: true, message: `User ${targetUser.name} deleted successfully.` });
    }

    // EDIT_USER Action: MasterAdmin can edit all attributes of a user
    if (action === 'EDIT_USER') {
      if (!userId || !email || !name || !role) {
        return NextResponse.json({ error: 'User ID, Email, Name, and Role are required.' }, { status: 400 });
      }

      const emailClean = email.trim().toLowerCase();
      const codeClean = userCode ? userCode.trim() : null;

      // Check for email collision with other users
      const emailDuplicate = await prisma.user.findFirst({
        where: {
          email: emailClean,
          NOT: { id: userId },
        },
      });
      if (emailDuplicate) {
        return NextResponse.json({ error: 'Another account with this email already exists.' }, { status: 400 });
      }

      // Check for userCode collision with other users
      if (codeClean) {
        const codeDuplicate = await prisma.user.findFirst({
          where: {
            userCode: codeClean,
            NOT: { id: userId },
          },
        });
        if (codeDuplicate) {
          return NextResponse.json({ error: 'Another account with this User ID (userCode) already exists.' }, { status: 400 });
        }
      }

      const dataToUpdate: any = {
        name: name.trim(),
        email: emailClean,
        role,
        departmentId: departmentId || null,
      };

      if (codeClean) {
        dataToUpdate.userCode = codeClean;
      }

      if (newPassword && newPassword.trim()) {
        dataToUpdate.password = await hashPassword(newPassword.trim());
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          userCode: true,
          email: true,
          name: true,
          role: true,
          departmentId: true,
        },
      });

      await logAudit({
        userId: session.userId,
        userRole: session.role,
        action: 'EDIT_USER_ATTRIBUTES',
        entity: 'User',
        entityId: userId,
        details: { email: updatedUser.email, role: updatedUser.role, userCode: updatedUser.userCode },
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    // CREATE USER Action
    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Email, Name, and Role are required.' }, { status: 400 });
    }

    const emailClean = email.trim().toLowerCase();
    const existingEmail = await prisma.user.findUnique({ where: { email: emailClean } });
    if (existingEmail) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
    }

    let finalUserCode = userCode ? userCode.trim() : '';

    if (!finalUserCode) {
      let prefix = 'ADM';
      if (role === 'SUPERADMIN') prefix = 'DEAN';

      if (departmentId) {
        const dept = await prisma.department.findUnique({ where: { id: departmentId } });
        if (dept) prefix = dept.departmentCode;
      }

      const count = await prisma.user.count({
        where: { userCode: { startsWith: prefix } },
      });
      finalUserCode = `${prefix}${101 + count}`;
    } else {
      const existingCode = await prisma.user.findUnique({ where: { userCode: finalUserCode } });
      if (existingCode) {
        return NextResponse.json({ error: `User ID '${finalUserCode}' is already taken.` }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(newPassword || 'Changeme@123');

    const createdUser = await prisma.user.create({
      data: {
        userCode: finalUserCode,
        email: emailClean,
        name: name.trim(),
        role,
        departmentId: departmentId || null,
        password: hashedPassword,
      },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: createdUser.id,
      details: { email: createdUser.email, role: createdUser.role, userCode: finalUserCode },
    });

    return NextResponse.json({ success: true, user: createdUser });
  } catch (err: any) {
    console.error('Save user error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save user account.' }, { status: 500 });
  }
}
