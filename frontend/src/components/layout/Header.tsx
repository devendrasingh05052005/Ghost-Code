import React, { useState } from 'react';
import { ApiProject } from '../../services/api';
import {
  FolderOpen,
  ChevronDown,
  Sun,
  Moon,
  LogOut,
  Server,
  X,
  Play
} from 'lucide-react';

interface HeaderProps {
  projects: ApiProject[];
  selectedProject: ApiProject | null;
  onSelectProject: (project: ApiProject) => void;
  onRefreshProject?: () => void;
  scanning?: boolean;
  onTriggerScan?: () => void;
  adminUser?: any;
  onLogout?: () => void;
  theme?: string;
  onToggleTheme?: () => void;
  onOpenProjects?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  adminUser,
  onLogout,
  theme = 'dark',
  onToggleTheme,
  onOpenProjects
}) => {
  const [menu, setMenu] = useState(false);
  const [status, setStatus] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const initial = adminUser?.name
    ? adminUser.name.slice(0, 2).toUpperCase()
    : 'LA';

  return (
    <header className="h-16 border-b border-line bg-surface/80 backdrop-blur flex items-center justify-between px-6 lg:px-10 relative z-30 shrink-0">
      {/* Project Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowProjectDropdown(!showProjectDropdown)}
          className="btn-secondary"
          aria-label="Switch project"
        >
          <FolderOpen className="w-4 h-4 text-primary" aria-hidden />
          <span className="text-sub font-normal">Project</span>
          <span className="font-semibold text-ink truncate max-w-[180px]">
            {selectedProject ? selectedProject.name : 'Select Project'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-sub" aria-hidden />
        </button>

        {showProjectDropdown && (
          <div className="absolute left-0 top-12 w-64 card p-2 pop z-40">
            <div className="px-3 py-1.5 label">Switch Active Project</div>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-sub text-xs">No projects loaded</div>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProject(p);
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                      selectedProject?.id === p.id
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-ink hover:bg-raised'
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    {selectedProject?.id === p.id && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
            {onOpenProjects && (
              <div className="pt-2 mt-1 border-t border-line">
                <button
                  onClick={() => {
                    setShowProjectDropdown(false);
                    onOpenProjects();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-primary font-medium hover:underline"
                >
                  Manage all projects →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 relative">
        {/* System Status Popover */}
        <div className="relative">
          <button
            className="btn-ghost"
            onClick={() => setStatus(!status)}
            aria-label="System status"
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden />
            <span className="hidden md:inline text-ink text-sm font-medium">All systems ready</span>
          </button>

          {status && (
            <div className="absolute right-0 top-12 w-72 card p-4 pop z-40">
              <div className="flex items-center justify-between mb-3 border-b border-line pb-2">
                <div className="font-semibold flex items-center gap-2 text-ink text-sm">
                  <Server className="w-4 h-4 text-primary" /> Engine status
                </div>
                <button
                  className="btn-ghost !p-1"
                  onClick={() => setStatus(false)}
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {[
                ['COBOL engine', 'cobc 3.2'],
                ['FORTRAN engine', 'gfortran 13.2'],
                ['TypeScript runner', 'v26.13'],
                ['Python runtime', '3.12 (sandboxed)']
              ].map(([n, v]) => (
                <div key={n} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="flex items-center gap-2 text-ink">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    {n}
                  </span>
                  <span className="font-mono text-[13px] text-sub">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        {onToggleTheme && (
          <button
            className="btn-ghost"
            onClick={onToggleTheme}
            aria-label="Toggle light or dark theme"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5 text-sub hover:text-ink" /> : <Moon className="w-4.5 h-4.5 text-sub hover:text-ink" />}
          </button>
        )}

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setMenu(!menu)}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-raised transition cursor-pointer"
            aria-label="User menu"
          >
            <span className="grid place-items-center w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold ring-1 ring-primary/30">
              {initial}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-sub" />
          </button>

          {menu && (
            <div className="absolute right-0 top-12 w-56 card p-2 pop z-40">
              <div className="px-3 py-2 border-b border-line mb-1">
                <div className="font-semibold text-ink text-sm">{adminUser?.name || 'Administrator'}</div>
                <div className="text-[13px] text-sub truncate">{adminUser?.username || 'admin@ghostcode'}</div>
              </div>
              {onLogout && (
                <button
                  className="btn-ghost w-full !justify-start text-critical hover:text-critical hover:bg-critical/10"
                  onClick={() => {
                    setMenu(false);
                    onLogout();
                  }}
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
