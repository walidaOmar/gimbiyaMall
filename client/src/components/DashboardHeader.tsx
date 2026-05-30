import React from 'react';

interface Props {
  title?: string;
  subtitle?: string;
  role?: string;
}

export default function DashboardHeader({ title, subtitle }: Props) {
  return (
    <div className="mb-6">
      {title && <h1 className="text-2xl font-bold">{title}</h1>}
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}
