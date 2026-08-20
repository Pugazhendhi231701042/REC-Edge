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
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. MasterAdmin role required.' }, { status: 403 });
  }

  const { action, userId, userCode, email, name, role, departmentId, newPassword } = await req.json();

  // EDIT_USER Action: MasterAdmin can edit all attributes of a user
  if (action === 'EDIT_USER') {
    if (!userId || !email || !name || !role) {
      return NextResponse.json({ error: 'User ID, Email, Name, and Role are required.' }, { status: 400 });
    }

    const dataToUpdate: any = {
      name: name.trim(),
      email: email.trim(),
      role,
      departmentId: departmentId || null,
    };

    if (userCode && userCode.trim()) {
      dataToUpdate.userCode = userCode.trim();
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

  // Create User
  if (!email || !name || !role) {
    return NextResponse.json({ error: 'Email, Name, and Role are required.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
  }

  // Use provided userCode or auto-generate code based on department prefix
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
  }

  const hashedPassword = await hashPassword(newPassword || 'Changeme@123');

  const createdUser = await prisma.user.create({
    data: {
      userCode: finalUserCode,
      email: email.trim(),
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
}
