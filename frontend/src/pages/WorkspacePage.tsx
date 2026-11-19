import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { ghostApi, ApiProject } from '../services/api';
import {
  FileCode,
  FolderTree,
  AlertTriangle,
  Play,
  Bug,
  CheckCircle,
  FileText
} from 'lucide-react';

interface WorkspacePageProps {
  selectedProject: ApiProject | null;
  onNavigate: (page: any) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({ selectedProject, onNavigate }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fileIssues, setFileIssues] = useState<any[]>([]);

  useEffect(() => {
    if (selectedProject) {
      loadFiles();
    }
  }, [selectedProject]);

  const loadFiles = async () => {
    if (!selectedProject) return;
    try {
      const res = await ghostApi.getProjectFiles(selectedProject.id);
      if (res.data.success) {
        setFiles(res.data.data);
        if (res.data.data.length > 0 && !selectedFile) {
          loadFileContent(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading project files:', err);
    }
  };

  const loadFileContent = async (file: any) => {
    if (!selectedProject) return;
    setSelectedFile(file);
    setLoading(true);
    try {
      const res = await ghostApi.getFileContent(selectedProject.id, file.relativePath);
      if (res.data.success) {
        setFileContent(res.data.data.content);
      }

      // Load issues for this file
      const scanRes = await ghostApi.getLatestScan(selectedProject.id);
      if (scanRes.data.success && scanRes.data.data) {
        const issues = scanRes.data.data.issues.filter(
          (i: any) => i.relativePath === file.relativePath
        );
        setFileIssues(issues);
      }
    } catch (err) {
      console.error('Error fetching file content:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMonacoLanguage = (langId: string): string => {
    switch (langId?.toLowerCase()) {
      case 'typescript':
        return 'typescript';
      case 'javascript':
        return 'javascript';
      case 'python':
        return 'python';
      case 'c':
      case 'cpp':
        return 'cpp';
      case 'java':
        return 'java';
      case 'csharp':
        return 'csharp';
      case 'go':
        return 'go';
      case 'rust':
        return 'rust';
      case 'php':
        return 'php';
      case 'ruby':
        return 'ruby';
      case 'swift':
        return 'swift';
      case 'kotlin':
        return 'kotlin';
      case 'cobol':
        return 'cobol';
      case 'fortran':
        return 'fortran';
      default:
        return 'plaintext';
    }
  };

  if (!selectedProject) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center text-slate-400">
        <FolderTree className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-white">No Project Selected</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
          Select or ingest a project to open the Monaco Code Workspace.
        </p>
        <button
          onClick={() => onNavigate('upload')}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-semibold cursor-pointer"
        >
          Ingest Codebase
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-charcoal-950 overflow-hidden">
      {/* Workspace Top Toolbar */}
      <div className="h-10 bg-charcoal-900 border-b border-charcoal-800 px-4 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-300">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">{selectedFile?.relativePath || 'No file opened'}</span>
          {selectedFile && (
            <span className="text-xs px-2 py-0.5 rounded bg-charcoal-800 text-slate-400 uppercase">
              {selectedFile.languageId}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {fileIssues.length > 0 && (
            <span className="flex items-center space-x-1 text-xs px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{fileIssues.length} Findings in File</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Split Body: Explorer + Monaco + Diagnostics Drawer */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left File Tree Explorer */}
        <div className="w-64 bg-charcoal-900/90 border-r border-charcoal-800 flex flex-col select-none shrink-0">
          <div className="p-3 border-b border-charcoal-800 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Explorer</span>
            <span className="text-xs text-cyan-400">{files.length} Files</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {files.map((f) => {
              const isSelected = selectedFile?.id === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => loadFileContent(f)}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded text-left text-xs font-mono transition-colors truncate ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-charcoal-800 hover:text-white'
                  }`}
                >
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className="truncate">{f.relativePath}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center / Right: Monaco Editor + Bottom Drawer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
                Loading source buffer...
              </div>
            ) : (
              <Editor
                height="100%"
                theme="vs-dark"
                language={getMonacoLanguage(selectedFile?.languageId)}
                value={fileContent}
                options={{
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  renderWhitespace: 'selection'
                }}
              />
            )}
          </div>

          {/* Bottom Diagnostic Drawer */}
          {fileIssues.length > 0 && (
            <div className="h-44 bg-charcoal-900 border-t border-charcoal-800 flex flex-col">
              <div className="px-4 py-2 border-b border-charcoal-800 text-xs font-mono font-semibold text-rose-400 flex items-center justify-between">
                <span>Active File Diagnostics & Autopsy Markers</span>
                <span className="text-xs text-slate-400">{fileIssues.length} issues</span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                {fileIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-2.5 rounded bg-charcoal-850 border border-charcoal-700 flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded font-bold ${
                          issue.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          issue.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {issue.severity}
                        </span>
                        <span className="font-mono text-slate-400 text-xs">Line {issue.lineNumber}</span>
                        <span className="font-semibold text-white">{issue.title}</span>
                      </div>
                      <p className="text-slate-300 mt-1">{issue.description}</p>
                    </div>

                    <button
                      onClick={() => onNavigate('fixlab')}
                      className="px-2.5 py-1 rounded bg-charcoal-700 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors shrink-0 ml-4"
                    >
                      Inspect Fix
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
