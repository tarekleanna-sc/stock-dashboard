import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio Report — StockDash',
};

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @page {
            size: letter portrait;
            margin: 0.75in 0.6in;
          }
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; }
            .page-break { page-break-before: always; }
          }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        `}} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
