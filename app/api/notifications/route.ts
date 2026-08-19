import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { recipientId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(req: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const { notificationId, markAll } = await req.json();

  if (markAll) {
    await prisma.notification.updateMany({
      where: { recipientId: session.userId, read: false },
      data: { read: true },
    });
  } else if (notificationId) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  return NextResponse.json({ success: true });
}
