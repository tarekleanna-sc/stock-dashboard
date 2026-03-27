import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
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
        {/* Desktop sidebar — hidden on mobile via its own className */}
        <Sidebar userEmail={user.email ?? ''} />

        {/* Main content: full-width on mobile with bottom-nav clearance; ml-16 on md+ */}
        <main className="min-h-screen flex-1 overflow-y-auto p-4 pb-24 md:ml-16 md:p-8 md:pb-8">
          {children}
        </main>

        {/* Mobile bottom navigation bar */}
        <MobileNav />
      </div>
    </ClientProvider>
  );
}
