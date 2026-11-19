import React from 'react';

export interface DiffLine {
  n: number | string;
  t: string;
}

interface PaneProps {
  title: string;
  lines: DiffLine[];
  kind: 'del' | 'add';
}

const Pane: React.FC<PaneProps> = ({ title, lines, kind }) => {
  const isDel = kind === 'del';
  return (
    <div className={`rounded-xl border overflow-hidden ${isDel ? 'border-critical/30' : 'border-success/30'}`}>
      <div className={`px-3 py-1.5 text-[13px] font-semibold flex items-center justify-between ${isDel ? 'bg-critical/10 text-critical' : 'bg-success/10 text-success'}`}>
        <span>{title}</span>
        <span className="text-[11px] uppercase font-mono opacity-80">{isDel ? 'Defective' : 'Remediated'}</span>
      </div>
      <pre className="font-mono text-[13px] leading-6 overflow-x-auto py-2 bg-bg/80">
        {lines.length === 0 ? (
          <div className="px-3 text-sub italic">// No lines</div>
        ) : (
          lines.map((l, idx) => (
            <div key={`${l.n}-${idx}`} className={`flex px-3 ${isDel ? 'bg-critical/10' : 'bg-success/10'}`}>
              <span className="w-8 shrink-0 select-none text-sub">{l.n}</span>
              <span aria-hidden className={`w-4 shrink-0 select-none ${isDel ? 'text-critical' : 'text-success'}`}>
                {isDel ? '−' : '+'}
              </span>
              <code className="whitespace-pre text-ink">{l.t}</code>
            </div>
          ))
        )}
      </pre>
    </div>
  );
};

export const DiffViewer: React.FC<{
  before: DiffLine[];
  after: DiffLine[];
}> = ({ before, after }) => {
  return (
    <div className="grid md:grid-cols-2 gap-3.5">
      <Pane title="Before (problem)" lines={before} kind="del" />
      <Pane title="After (fixed)" lines={after} kind="add" />
    </div>
  );
};
