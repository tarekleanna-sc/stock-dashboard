'use client';

interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-8 border-b border-white/[0.06] pb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 text-sm text-white/50">{description}</p>
      )}
    </header>
  );
}
