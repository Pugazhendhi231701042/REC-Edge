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

  const { action, userId, newPassword, email, name, role, departmentId } = await req.json();

  if (action === 'RESET_PASSWORD') {
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password required.' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(newPassword);
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

    return NextResponse.json({ success: true, message: 'Password reset successfully.' });
  }

  // Create User
  if (!email || !name || !role) {
    return NextResponse.json({ error: 'Email, Name, and Role are required.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'User with this email already exists.' }, { status: 400 });
  }

  // Determine prefix for unique User Code
  let prefix = 'ADM';
  if (role === 'SUPERADMIN') prefix = 'DEAN';

  if (departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: departmentId } });
    if (dept) prefix = dept.departmentCode;
  }

  // Count existing users with prefix to assign sequence
  const count = await prisma.user.count({
    where: { userCode: { startsWith: prefix } },
  });
  const generatedCode = `${prefix}${101 + count}`;

  const hashedPassword = await hashPassword(newPassword || 'Changeme@123');

  const createdUser = await prisma.user.create({
    data: {
      userCode: generatedCode,
      email,
      name,
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
    details: { email, role, userCode: generatedCode },
  });

  return NextResponse.json({ success: true, user: createdUser });
}
