import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const session = await getCurrentUser();
  if (!session) {
    redirect('/login');
  }

  if (session.role === 'SUPERADMIN') redirect('/dashboard/dean');
  if (session.role === 'MASTERADMIN') redirect('/dashboard/master-admin');
  if (session.role === 'HOD') redirect('/dashboard/hod');
  redirect('/dashboard/faculty');
}
