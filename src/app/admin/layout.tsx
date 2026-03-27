export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin has no sidebar — standalone layout
  return <>{children}</>;
}
