import React from 'react';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'fixed';

const sevConfig: Record<SeverityLevel, { cls: string; Icon: React.FC<any>; label: string }> = {
  critical: { cls: 'text-critical bg-critical/10 border-critical/30', Icon: AlertOctagon, label: 'Critical' },
  high: { cls: 'text-high bg-high/10 border-high/30', Icon: AlertTriangle, label: 'High' },
  medium: { cls: 'text-medium bg-medium/10 border-medium/30', Icon: Info, label: 'Medium' },
  fixed: { cls: 'text-success bg-success/10 border-success/30', Icon: CheckCircle2, label: 'Fixed' },
};

export const SeverityBadge: React.FC<{ level: SeverityLevel | string }> = ({ level }) => {
  const norm = (level || 'medium').toLowerCase() as SeverityLevel;
  const item = sevConfig[norm] || sevConfig.medium;
  const Icon = item.Icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium px-2.5 py-0.5 rounded-full border ${item.cls}`}>
      <Icon className="w-3.5 h-3.5" aria-hidden />
      <span>{item.label}</span>
    </span>
  );
};

export const Tip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  return (
    <span className="relative group inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute z-30 -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[13px] text-ink opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition shadow-lg"
      >
        {text}
      </span>
    </span>
  );
};

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="text-sub text-[15px] mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2.5">{children}</div>
    </div>
  );
};
