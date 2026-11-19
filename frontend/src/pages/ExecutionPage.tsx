import React, { useEffect, useState } from 'react';
import { ghostApi, ApiProject } from '../services/api';
import {
  Play,
  FlaskConical,
  AlertOctagon,
  CheckCircle2,
  Wand2,
  ChevronDown,
  FileCode2,
  ArrowRight
} from 'lucide-react';
import { Terminal } from '../components/common/Terminal';
import { ActionBar } from '../components/common/ActionBar';
import { PageHeader } from '../components/common/ui';

interface ExecutionPageProps {
  selectedProject: ApiProject | null;
  onNavigate: (page: string) => void;
}

export const ExecutionPage: React.FC<ExecutionPageProps> = ({ selectedProject, onNavigate }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [activeFile, setActiveFile] = useState<string>('main.py');
  const [running, setRunning] = useState<boolean>(false);
  const [status, setStatus] = useState<'ok' | 'error' | null>(null);
  const [output, setOutput] = useState<string>('');
  const [terminalTitle, setTerminalTitle] = useState<string>('python main.py');
  const [kind, setKind] = useState<'app' | 'test' | null>('app');
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [friendlyError, setFriendlyError] = useState<string | null>(null);
  const [rawTraceback, setRawTraceback] = useState<string>('');

  useEffect(() => {
    if (selectedProject) {
      loadFiles();
      // Auto-run app on initial open
      runProcess('app');
    }
  }, [selectedProject]);

  const loadFiles = async () => {
    if (!selectedProject) return;
    try {
      const res = await ghostApi.getProjectFiles(selectedProject.id);
      if (res.data.success && res.data.data) {
        setFiles(res.data.data);
        const main = res.data.data.find(
          (f: any) => f.relativePath.endsWith('main.py') || f.relativePath.endsWith('index.ts')
        );
        if (main) setActiveFile(main.relativePath);
        else if (res.data.data.length > 0) setActiveFile(res.data.data[0].relativePath);
      }
    } catch (err) {
      console.error('Error fetching project files:', err);
    }
  };

  const sanitizeTraceback = (text: string) => {
    // Strip Windows absolute paths (e.g. C:\Users\... or /home/...) to relative project paths
    return text.replace(/([A-Za-z]:\\[^"'\n]+[\\\/])(?=[a-zA-Z0-9_\-\.]+)/g, '');
  };

  const runProcess = async (mode: 'app' | 'test') => {
    if (!selectedProject) return;
    setRunning(true);
    setStatus(null);
    setOutput('');
    setFriendlyError(null);
    setRawTraceback('');
    setKind(mode);
    setTerminalTitle(mode === 'app' ? 'python main.py' : 'python -m unittest');

    try {
      const res = await ghostApi.runLive(selectedProject.id, mode);
      if (res.data.success && res.data.data) {
        const d = res.data.data;
        const isOk = d.exitCode === 0;
        setStatus(isOk ? 'ok' : 'error');

        const combinedOutput = d.stdout || d.stderr || d.output || '';
        setOutput(sanitizeTraceback(combinedOutput));

        if (!isOk) {
          const errText = d.stderr || d.output || '';
          setRawTraceback(sanitizeTraceback(errText));

          if (errText.includes('TypeError') || errText.includes('NoneType')) {
            setFriendlyError(
              'Your app crashed: tried to read a property from None (empty item). An item was accessed before checking if it exists.'
            );
          } else if (errText.includes('ZeroDivisionError')) {
            setFriendlyError(
              'Your app crashed with ZeroDivisionError: calculation tried to divide by zero when cart/list was empty.'
            );
          } else if (errText.includes('AssertionError') || mode === 'test') {
            setFriendlyError('Automated test suite failed: assertions did not match expected mathematical output.');
          } else {
            setFriendlyError('Runtime exception crashed the execution process. Review the defect diffs to apply the fix.');
          }
        }
      }
    } catch (err: any) {
      setStatus('error');
      const errMsg = err.response?.data?.error || err.message;
      setOutput(sanitizeTraceback(errMsg));
      setRawTraceback(sanitizeTraceback(errMsg));
      setFriendlyError('The execution sandbox encountered an unhandled crash.');
    } finally {
      setRunning(false);
    }
  };

  const isErr = status === 'error';
  const isOk = status === 'ok';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test your app"
        subtitle="Run your code right here to check that everything works before you download it."
      >
        <button
          className="btn-secondary"
          onClick={() => runProcess('test')}
          disabled={running}
        >
          <FlaskConical className="w-4 h-4 text-primary" />
          <span>Run tests</span>
        </button>
        <button
          className="btn-secondary"
          onClick={() => runProcess('app')}
          disabled={running}
        >
          <Play className="w-4 h-4 text-success" />
          <span>Run app</span>
        </button>
      </PageHeader>

      {/* Friendly Error Banner */}
      {isErr && (
        <div className="card border-critical/40 bg-critical/5 p-5 pop" role="alert">
          <div className="flex flex-wrap items-start gap-4">
            <AlertOctagon className="w-6 h-6 text-critical shrink-0 mt-0.5" />
            <div className="flex-1 min-w-[240px]">
              <h2 className="text-lg font-semibold text-ink">Something went wrong</h2>
              <p className="mt-1 text-ink text-[14px] leading-relaxed">
                {friendlyError || 'A runtime exception crashed your application.'}
              </p>
              <button
                className="mt-3 text-sm text-sub hover:text-ink inline-flex items-center gap-1 cursor-pointer"
                onClick={() => setShowDetails(!showDetails)}
                aria-expanded={showDetails}
              >
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showDetails ? '' : '-rotate-90'}`}
                />
                <span>{showDetails ? 'Hide' : 'Show'} technical details</span>
              </button>
              {showDetails && (
                <pre className="mt-2.5 p-3.5 rounded-xl bg-bg font-mono text-[13px] text-critical overflow-x-auto whitespace-pre-wrap leading-relaxed border border-critical/20">
                  {rawTraceback || output}
                </pre>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={() => onNavigate('scanner')}
            >
              <Wand2 className="w-4.5 h-4.5" />
              <span>Fix this automatically</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {isOk && (
        <div
          className="card border-success/40 bg-success/5 p-5 flex items-center gap-3.5 pop"
          role="status"
        >
          <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {kind === 'test' ? 'All tests passed cleanly' : 'Your app ran without errors'}
            </h2>
            <p className="text-sub text-sm mt-0.5">
              Zero unhandled exceptions or zero-division errors. You can download your clean code now.
            </p>
          </div>
        </div>
      )}

      {/* File List & Live Terminal */}
      <div className="grid lg:grid-cols-[240px_1fr] gap-4">
        <aside className="card p-3">
          <div className="label px-2 pb-2">Project Files</div>
          <div className="space-y-1">
            {files.length === 0 ? (
              <div className="px-2.5 py-2 text-sub text-xs">No files indexed</div>
            ) : (
              files.map((f: any) => (
                <button
                  key={f.id || f.relativePath}
                  onClick={() => setActiveFile(f.relativePath)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left font-mono transition cursor-pointer ${
                    activeFile === f.relativePath
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-sub hover:bg-raised hover:text-ink'
                  }`}
                >
                  <FileCode2 className="w-4 h-4 shrink-0" />
                  <span className="truncate">{f.relativePath}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        <Terminal
          title={terminalTitle}
          output={output}
          running={running}
          status={status}
        />
      </div>

      {/* Sticky Bottom Action Bar */}
      <ActionBar left={isOk ? 'Everything passed verified.' : 'Run your app or tests to verify fixes.'}>
        <button
          className="btn-primary"
          disabled={!isOk}
          onClick={() => onNavigate('download')}
        >
          <span>Continue to download</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </button>
      </ActionBar>
    </div>
  );
};
