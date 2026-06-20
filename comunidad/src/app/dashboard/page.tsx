import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardAdmin from '@/components/DashboardAdmin';
import DashboardUser from '@/components/DashboardUser';
import DashboardSuperAdmin from '@/components/DashboardSuperAdmin';
import LogoutButton from '@/components/LogoutButton';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  
  if (!sessionCookie) {
    redirect('/login');
  }

  const session = JSON.parse(sessionCookie.value);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6">
      <header className="flex justify-between items-center mb-8 glass-panel p-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-primary)]">WePower</h1>
          <p className="text-sm text-gray-400">Usuario: {session.username} ({session.role})</p>
        </div>
        <LogoutButton />
      </header>
      
      <main className="max-w-7xl mx-auto animate-fade-in">
        {session.role === 'SUPERADMIN' && <DashboardSuperAdmin />}
        {session.role === 'ADMIN' && <DashboardAdmin communityId={session.communityId} />}
        {(session.role === 'CONSUMER' || session.role === 'PROSUMER') && <DashboardUser />}
      </main>
    </div>
  );
}
