import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import { ClientProvider } from '@/providers/ClientProvider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  return (
    <ClientProvider>
      <div className="flex min-h-screen">
        <Sidebar userEmail={user.email ?? ''} />
        <main className="ml-16 min-h-screen flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </ClientProvider>
  );
}
