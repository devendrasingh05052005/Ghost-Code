import React from 'react';
import { LayoutDashboard, FolderOpen, Settings, Ghost, ShieldAlert, Sparkles, Terminal } from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'projects'
  | 'workspace'
  | 'upload'
  | 'review'
  | 'scanner'
  | 'fix'
  | 'test'
  | 'execution'
  | 'download'
  | 'settings';

interface SidebarProps {
  currentPage: string;
  onSelectPage: (page: any) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, key: 'G D' },
  { id: 'projects', label: 'Projects', icon: FolderOpen, key: 'G P' },
  { id: 'settings', label: 'Settings', icon: Settings, key: 'G S' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage }) => {
  return (
    <aside className="w-[72px] lg:w-[232px] shrink-0 border-r border-line bg-surface flex flex-col h-screen select-none font-sans z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-line shrink-0">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary text-primary-ink shadow-md shadow-primary/20">
          <Ghost className="w-5 h-5" />
        </span>
        <div className="hidden lg:block leading-tight">
          <div className="font-bold text-[16px] text-ink tracking-tight">GhostCode</div>
          <div className="text-[13px] text-sub">Code Doctor</div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto" aria-label="Main Navigation">
        {navItems.map(({ id, label, icon: Icon, key }) => {
          const active =
            currentPage === id ||
            (id === 'projects' &&
              ['workspace', 'upload', 'review', 'scanner', 'fix', 'test', 'execution', 'download'].includes(
                currentPage
              ));
          return (
            <button
              key={id}
              onClick={() => onSelectPage(id)}
              title={`${label} (${key})`}
              aria-current={active ? 'page' : undefined}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition cursor-pointer ${
                active
                  ? 'bg-primary/12 text-primary font-semibold'
                  : 'text-sub hover:text-ink hover:bg-raised'
              }`}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" aria-hidden />
              <span className="hidden lg:block">{label}</span>
              <span className="hidden lg:block ml-auto kbd">{key}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Status / Quick Link */}
      <div className="p-3 border-t border-line hidden lg:block">
        <div className="p-3 rounded-xl bg-raised/70 border border-line text-xs space-y-1">
          <div className="flex items-center space-x-1.5 text-primary font-semibold">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>Local Engine Active</span>
          </div>
          <p className="text-sub text-[11px] leading-tight">Zero cloud telemetry leaks. In-browser sandbox verification.</p>
        </div>
      </div>
    </aside>
  );
};
