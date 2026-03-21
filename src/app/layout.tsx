import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/QueryProvider';
import { SupabaseProvider } from '@/providers/SupabaseProvider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Portfolio Dashboard',
  description: 'Track and manage your investment portfolio with real-time insights',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <QueryProvider>
          <SupabaseProvider>{children}</SupabaseProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
