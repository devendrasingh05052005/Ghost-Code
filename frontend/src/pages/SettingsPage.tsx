import React from 'react';
import { PageHeader } from '../components/common/ui';
import { Server, ShieldCheck, Terminal, HardDrive } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Engines"
        subtitle="Configuration, local runtime sandboxes, and polyglot compiler engines."
      />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-ink font-semibold">
            <Server className="w-5 h-5 text-primary" />
            <span>Active Compiler Engines</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'GnuCOBOL Compiler', version: 'cobc (GnuCOBOL) 3.2.0', path: 'C:\\Users\\temp3\\tools\\bin\\cobc.exe' },
              { name: 'GNU Fortran Compiler', version: 'GNU Fortran (GCC) 13.2.0', path: 'C:\\Strawberry\\c\\bin\\gfortran.exe' },
              { name: 'TypeScript / Node Runner', version: 'Node.js v26.13 (V8 runtime)', path: 'In-process sandboxed worker' },
              { name: 'Python AST Runtime', version: 'Python 3.12 (sandboxed process)', path: 'In-process syntax & rule analyzer' }
            ].map((e, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-raised border border-line">
                <div className="flex justify-between items-center text-sm font-medium text-ink">
                  <span>{e.name}</span>
                  <span className="text-xs text-success font-mono">Ready</span>
                </div>
                <div className="text-xs text-sub mt-0.5">{e.version}</div>
                <div className="text-[11px] font-mono text-sub mt-1 truncate">{e.path}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2.5 text-ink font-semibold">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>Security & Sandbox Policies</span>
          </div>
          <div className="space-y-3 text-sm text-sub">
            <div className="p-3 rounded-xl bg-raised border border-line">
              <span className="font-medium text-ink block">Zero Telemetry Leak</span>
              <span className="text-xs">No code, AST tokens, or files are ever transmitted to external servers.</span>
            </div>
            <div className="p-3 rounded-xl bg-raised border border-line">
              <span className="font-medium text-ink block">In-Place Disk Patching</span>
              <span className="text-xs">Safe, non-destructive file atomic replacement with verification backup.</span>
            </div>
            <div className="p-3 rounded-xl bg-raised border border-line">
              <span className="font-medium text-ink block">Deterministic Audit Trail</span>
              <span className="text-xs">Cryptographic SHA-256 evidence logged for every applied defect patch.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
