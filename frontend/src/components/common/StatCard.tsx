import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  note: string;
  icon: React.FC<any>;
  tone?: 'primary' | 'critical' | 'success' | 'high';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  note,
  icon: Icon,
  tone = 'primary'
}) => {
  const tones = {
    primary: 'text-primary bg-primary/10',
    critical: 'text-critical bg-critical/10',
    success: 'text-success bg-success/10',
    high: 'text-high bg-high/10',
  };

  return (
    <div className="card p-5 transition-all hover:border-primary/40">
      <div className="flex items-start justify-between">
        <span className="label">{label}</span>
        <span className={`grid place-items-center w-9 h-9 rounded-xl ${tones[tone]}`}>
          <Icon className="w-4.5 h-4.5" aria-hidden />
        </span>
      </div>
      <div className="mt-2 text-[32px] font-bold leading-none tracking-tight text-ink">{value}</div>
      <p className="mt-2 text-[13px] text-sub leading-normal">{note}</p>
    </div>
  );
};
