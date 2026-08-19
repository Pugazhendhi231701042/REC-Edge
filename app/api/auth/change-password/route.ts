import { NextResponse } from 'next/server';
import { getCurrentUser, comparePassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new password are required.' }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 });
  }

  const valid = await comparePassword(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect current password.' }, { status: 400 });
  }

  const hashedNew = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedNew },
  });

  await logAudit({
    userId: user.id,
    userRole: user.role,
    action: 'PASSWORD_CHANGE',
    entity: 'User',
    entityId: user.id,
  });

  return NextResponse.json({ success: true, message: 'Password updated successfully.' });
}
