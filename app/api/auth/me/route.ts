import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      userCode: true,
      email: true,
      name: true,
      role: true,
      departmentId: true,
      createdAt: true,
      department: { select: { id: true, shortName: true, programmeName: true, departmentCode: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      userCode: user.userCode || 'N/A',
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      department: user.department?.shortName,
      programmeName: user.department?.programmeName,
      createdAt: user.createdAt,
    },
  });
}
