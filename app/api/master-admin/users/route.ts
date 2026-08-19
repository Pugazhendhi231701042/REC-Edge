import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

// List Users or Create/Reset User
export async function GET() {
  const session = await getCurrentUser();
  if (!session || (session.role !== 'MASTERADMIN' && session.role !== 'SUPERADMIN')) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      departmentId: true,
      active: true,
      createdAt: true,
      department: {
        select: {
          id: true,
          shortName: true,
          programmeName: true,
          departmentCode: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session || session.role !== 'MASTERADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Only MasterAdmin can manage users.' }, { status: 403 });
  }

  const { action, userId, email, name, role, departmentId, newPassword } = await req.json();

  if (action === 'RESET_PASSWORD') {
    if (!userId || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password are required.' }, { status: 400 });
    }
    const hashed = await hashPassword(newPassword);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    await logAudit({
      userId: session.userId,
      userRole: session.role,
      action: 'MASTERADMIN_RESET_USER_PASSWORD',
      entity: 'User',
      entityId: userId,
    });

    return NextResponse.json({ success: true, message: `Password reset successfully for ${updated.email}` });
  }

  // Create User
  if (!email || !name || !role || !newPassword) {
    return NextResponse.json({ error: 'Email, name, role, and password are required.' }, { status: 400 });
  }

  if (!email.toLowerCase().endsWith('@rajalakshmi.edu.in')) {
    return NextResponse.json({ error: 'User email must end with @rajalakshmi.edu.in' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: 'A user with this email address already exists.' }, { status: 400 });
  }

  const hashed = await hashPassword(newPassword);

  const newUser = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      role,
      departmentId: departmentId || null,
      password: hashed,
      active: true,
    },
  });

  await logAudit({
    userId: session.userId,
    userRole: session.role,
    action: 'CREATE_USER',
    entity: 'User',
    entityId: newUser.id,
    details: { email: newUser.email, role: newUser.role },
  });

  return NextResponse.json({ success: true, user: newUser });
}
