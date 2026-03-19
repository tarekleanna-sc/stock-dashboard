import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-16 min-h-screen flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
