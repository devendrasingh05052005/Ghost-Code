import React, { useRef, useState } from 'react';
import { FileArchive, UploadCloud, FolderOpen, X, AlertCircle } from 'lucide-react';
import { PageHeader, Tip } from '../components/common/ui';
import { ActionBar } from '../components/common/ActionBar';
import { ghostApi, ApiProject } from '../services/api';

interface UploadPageProps {
  onProjectIngested: (project: ApiProject) => void;
  onNavigate: (page: string) => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onProjectIngested, onNavigate }) => {
  const [mode, setMode] = useState<'zip' | 'folder'>('zip');
  const [file, setFile] = useState<File | null>(null);
  const [folderPath, setFolderPath] = useState('');
  const [projectName, setProjectName] = useState('');
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File | null) => {
    if (f) {
      if (f.name.endsWith('.zip')) {
        setFile(f);
        setError(null);
      } else {
        setError('Please drop or select a valid .zip archive.');
      }
    }
  };

  const handleStartScan = async () => {
    if (mode === 'zip') {
      if (!file) return;
      setProgress(15);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        setProgress(45);

        const res = await ghostApi.uploadZip(formData);
        setProgress(90);

        if (res.data.success && res.data.data) {
          setProgress(100);
          onProjectIngested(res.data.data);
          setTimeout(() => {
            onNavigate('scanner');
          }, 450);
        } else {
          setError(res.data.error || 'Failed to extract archive.');
          setProgress(null);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message);
        setProgress(null);
      }
    } else {
      if (!folderPath.trim()) {
        setError('Please enter a valid local directory path.');
        return;
      }
      setProgress(25);
      setError(null);
      try {
        const res = await ghostApi.createProject(
          projectName || 'Local Project',
          folderPath.trim(),
          'Local ingested directory'
        );
        setProgress(90);
        if (res.data.success && res.data.data) {
          setProgress(100);
          onProjectIngested(res.data.data);
          setTimeout(() => {
            onNavigate('scanner');
          }, 450);
        } else {
          setError(res.data.error || 'Failed to index folder.');
          setProgress(null);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message);
        setProgress(null);
      }
    }
  };

  const stage =
    progress == null
      ? ''
      : progress < 40
      ? 'Uploading archive…'
      : progress < 100
      ? 'Scanning your code…'
      : 'Done!';

  return (
    <div>
      <PageHeader
        title="Upload your project"
        subtitle="Drop a ZIP of your code. We'll scan every file and find bugs automatically."
      >
        <div className="flex p-1 rounded-xl bg-raised border border-line" role="tablist">
          {[
            ['zip', 'ZIP file', FileArchive],
            ['folder', 'Local folder', FolderOpen]
          ].map(([id, label, Icon]: any) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              onClick={() => {
                setMode(id);
                setError(null);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                mode === id ? 'bg-surface text-ink shadow-sm' : 'text-sub hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </PageHeader>

      {error && (
        <div className="card p-4 mb-5 border-critical/30 bg-critical/10 text-critical flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mode === 'zip' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]);
          }}
          className={`card border-2 border-dashed p-14 text-center transition-all ${
            drag ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-line hover:border-primary/50'
          }`}
        >
          {!file ? (
            <>
              <div className="mx-auto w-16 h-16 grid place-items-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-lg shadow-primary/10">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-ink">Drag & drop your ZIP here</h2>
              <p className="text-sub text-[15px] mt-1.5">
                Works with Python, TypeScript, Java, C++ and more · up to 50 MB
              </p>
              <button
                type="button"
                className="btn-secondary mt-5"
                onClick={() => fileInputRef.current?.click()}
              >
                Browse files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip"
                hidden
                onChange={(e) => pickFile(e.target.files?.[0] || null)}
              />
            </>
          ) : (
            <div className="max-w-md mx-auto text-left">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-raised border border-line">
                <FileArchive className="w-6 h-6 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink truncate">{file.name}</div>
                  <div className="text-[13px] text-sub">{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                {progress == null && (
                  <button
                    className="btn-ghost !p-1.5 hover:text-critical"
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {progress != null && (
                <div className="mt-5 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink font-medium">{stage}</span>
                    <span className="text-sub font-mono">{Math.min(progress, 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-line overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-8 space-y-5 max-w-xl mx-auto">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. My Project"
              className="w-full bg-raised border border-line rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-sub focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Local Directory Path *</label>
            <input
              type="text"
              value={folderPath}
              onChange={(e) => setFolderPath(e.target.value)}
              placeholder="e.g. C:\Users\temp3\Desktop\GHOST-CODE\clean_shop"
              required
              className="w-full bg-raised border border-line rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-sub focus:outline-none focus:border-primary font-mono text-[13px]"
            />
          </div>
        </div>
      )}

      <ActionBar left={file || folderPath ? 'Ready to scan.' : 'Add a ZIP file or directory to continue.'}>
        <Tip text={file || folderPath ? 'Start scanning (Enter)' : 'Choose a ZIP file first'}>
          <button
            className="btn-primary"
            disabled={(!file && !folderPath.trim()) || progress != null}
            onClick={handleStartScan}
          >
            <span>Scan my code</span>
          </button>
        </Tip>
      </ActionBar>
    </div>
  );
};
