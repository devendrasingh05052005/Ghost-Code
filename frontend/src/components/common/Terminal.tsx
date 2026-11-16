import React from 'react';

interface TerminalProps {
  title?: string;
  output?: string | null;
  running?: boolean;
  status?: 'ok' | 'error' | null;
}

export const Terminal: React.FC<TerminalProps> = ({
  title = 'Output',
  output,
  running,
  status
}) => {
  const badge =
    status === 'ok'
      ? 'text-success bg-success/10 border-success/30'
      : status === 'error'
      ? 'text-critical bg-critical/10 border-critical/30'
      : 'text-sub bg-raised border-line';

  return (
    <div className="rounded-2xl border border-line overflow-hidden bg-[#070b14] h-full flex flex-col shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface">
        <div className="flex items-center gap-2">
          <span className="flex gap-1.5" aria-hidden>
            <i className="w-3 h-3 rounded-full bg-critical/80 inline-block" />
            <i className="w-3 h-3 rounded-full bg-medium/80 inline-block" />
            <i className="w-3 h-3 rounded-full bg-success/80 inline-block" />
          </span>
          <span className="text-[13px] font-mono text-sub ml-2 truncate max-w-[300px]">{title}</span>
        </div>
        <span className={`text-[12px] font-mono font-medium px-2.5 py-0.5 rounded-md border ${badge}`}>
          {running ? 'Running…' : status === 'ok' ? 'Finished (0)' : status === 'error' ? 'Crashed (1)' : 'Ready'}
        </span>
      </div>
      <pre className="flex-1 p-5 font-mono text-[13px] leading-6 text-[#cbd5e1] overflow-auto min-h-[300px] whitespace-pre-wrap select-text">
        {running ? (
          <span className="text-primary animate-pulse">Running process in sandbox…</span>
        ) : output ? (
          output
        ) : (
          <span className="text-sub italic">Press “Run app” or “Run tests” to see the real-time execution result here.</span>
        )}
      </pre>
    </div>
  );
};
