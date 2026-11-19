import React, { useState } from 'react';
import { ApiProject, ghostApi } from '../services/api';
import { FolderGit2, Code2, Plus, Calendar, HardDrive, Trash2, Download, FolderOpen, ArrowRight } from 'lucide-react';
import { PageHeader } from '../components/common/ui';

interface ProjectsPageProps {
  projects: ApiProject[];
  selectedProject: ApiProject | null;
  onSelectProject: (p: ApiProject) => void;
  onNavigate: (page: string) => void;
  onRefreshProjects?: () => void;
  onDeleteProject?: (projectId: string) => Promise<void> | void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  projects,
  selectedProject,
  onSelectProject,
  onNavigate,
  onRefreshProjects,
  onDeleteProject
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (p: ApiProject, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete project "${p.name}"?`)) return;
    setDeletingId(p.id);
    try {
      if (onDeleteProject) {
        await onDeleteProject(p.id);
      } else {
        await ghostApi.deleteProject(p.id);
        if (onRefreshProjects) await onRefreshProjects();
      }
    } catch (err: any) {
      alert(`Failed to delete project: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects Repository"
        subtitle="Manage codebases indexed in your local GhostCode environment."
      >
        <button
          onClick={() => onNavigate('upload')}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest New Codebase</span>
        </button>
      </PageHeader>

      {projects.length === 0 ? (
        <div className="card p-12 text-center max-w-xl mx-auto space-y-4">
          <FolderOpen className="w-12 h-12 text-sub mx-auto" />
          <h3 className="text-lg font-bold text-ink">No Projects Found</h3>
          <p className="text-sub text-[15px]">
            You currently have no projects registered. Drop a ZIP file to start the code doctor.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('upload')}
              className="btn-primary"
            >
              <span>Upload clean_shop.zip</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const isSelected = selectedProject?.id === p.id;
            return (
              <div
                key={p.id}
                className={`card p-5 flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/40'
                    : 'hover:border-primary/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FolderGit2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-ink truncate">{p.name}</h3>
                        <p className="text-xs text-sub font-mono truncate max-w-[200px]" title={p.rootPath}>
                          {p.rootPath}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-semibold uppercase shrink-0">
                        Active
                      </span>
                    )}
                  </div>

                  {p.description && (
                    <p className="text-sm text-sub mt-3 line-clamp-2">{p.description}</p>
                  )}

                  <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-line text-xs font-mono text-sub">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <HardDrive className="w-4 h-4" />
                      <span>Local FS</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-5">
                  <button
                    onClick={() => {
                      onSelectProject(p);
                      onNavigate('scanner');
                    }}
                    className="btn-primary !py-2 flex-1 !text-xs"
                  >
                    <span>Review & Fix</span>
                  </button>
                  <button
                    onClick={() => {
                      onSelectProject(p);
                      onNavigate('execution');
                    }}
                    className="btn-secondary !py-2 !text-xs"
                  >
                    <span>Live Test</span>
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = ghostApi.downloadProjectZipUrl(p.id);
                    }}
                    title="Download Remediated Codebase ZIP"
                    className="btn-ghost !p-2"
                  >
                    <Download className="w-4 h-4 text-success" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(p, e)}
                    disabled={deletingId === p.id}
                    title="Delete Project"
                    className="btn-ghost !p-2 text-sub hover:text-critical"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
