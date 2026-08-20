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
      await prisma.user.delete({ where: { id: userId } });
      await logAudit({
        userId: session.userId,
        userRole: session.role,
        action: 'DELETE_USER',
        entity: 'User',
        entityId: userId,
      });
      return NextResponse.json({ success: true });
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
