import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { department: true },
    });

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Invalid credentials or inactive account.' }, { status: 401 });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    };

    const token = await createSessionToken(sessionPayload);
    await setSessionCookie(token);

    await logAudit({
      userId: user.id,
      userRole: user.role,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      details: { email: user.email },
    });

    let redirectPath = '/dashboard/faculty';
    if (user.role === 'SUPERADMIN') redirectPath = '/dashboard/dean';
    else if (user.role === 'MASTERADMIN') redirectPath = '/dashboard/master-admin';
    else if (user.role === 'HOD') redirectPath = '/dashboard/hod';

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department ? user.department.shortName : null,
      },
      redirectPath,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed. Please try again.' }, { status: 500 });
  }
}
