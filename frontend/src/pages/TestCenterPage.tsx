import React, { useEffect, useState } from 'react';
import { ghostApi, ApiProject } from '../services/api';
import { CheckCircle2, Play, Plus, Clock, AlertCircle, FileCode } from 'lucide-react';

interface TestCenterPageProps {
  selectedProject: ApiProject | null;
}

export const TestCenterPage: React.FC<TestCenterPageProps> = ({ selectedProject }) => {
  const [suites, setSuites] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (selectedProject) {
      loadSuites();
      loadFiles();
    }
  }, [selectedProject]);

  const loadSuites = async () => {
    if (!selectedProject) return;
    try {
      const res = await ghostApi.getTestSuites(selectedProject.id);
      if (res.data.success) {
        setSuites(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching test suites:', err);
    }
  };

  const loadFiles = async () => {
    if (!selectedProject) return;
    try {
      const res = await ghostApi.getProjectFiles(selectedProject.id);
      if (res.data.success) {
        setFiles(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedFilePath(res.data.data[0].relativePath);
        }
      }
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  const handleGenerateTests = async () => {
    if (!selectedProject || !selectedFilePath) return;
    setGenerating(true);
    try {
      const res = await ghostApi.generateTests(selectedProject.id, selectedFilePath);
      if (res.data.success) {
        await loadSuites();
      }
    } catch (err) {
      console.error('Error generating tests:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRunSuite = async (suiteId: string) => {
    setRunningSuiteId(suiteId);
    try {
      const res = await ghostApi.runTestSuite(suiteId);
      if (res.data.success) {
        setTestResults((prev) => ({ ...prev, [suiteId]: res.data.data }));
      }
    } catch (err) {
      console.error('Error running test suite:', err);
    } finally {
      setRunningSuiteId(null);
    }
  };

  if (!selectedProject) {
    return (
      <div className="p-12 text-center text-slate-400">
        <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Project Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an active project to access the Test Center.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header and Generator Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Automatic Test Generator & Runner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Synthesize boundary condition tests, edge-case regressions, and arithmetic verification suites from code semantics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedFilePath}
            onChange={(e) => setSelectedFilePath(e.target.value)}
            className="bg-charcoal-900 border border-charcoal-700 text-xs text-white px-3 py-2 rounded-lg font-mono focus:outline-none cursor-pointer"
          >
            {files.map((f) => (
              <option key={f.id} value={f.relativePath} className="bg-charcoal-900">
                {f.relativePath} ({f.languageId.toUpperCase()})
              </option>
            ))}
          </select>

          <button
            onClick={handleGenerateTests}
            disabled={generating || !selectedFilePath}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{generating ? 'Synthesizing...' : 'Generate Test Suite'}</span>
          </button>
        </div>
      </div>

      {/* Test Suites List */}
      <div className="space-y-5">
        {suites.map((s) => {
          const results = testResults[s.id];
          return (
            <div
              key={s.id}
              className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-charcoal-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-base font-bold text-white">{s.name}</h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                      {s.languageId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">Target: {s.targetFile}</p>
                </div>

                <button
                  onClick={() => handleRunSuite(s.id)}
                  disabled={runningSuiteId === s.id}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Play className={`w-3.5 h-3.5 ${runningSuiteId === s.id ? 'animate-spin' : ''}`} />
                  <span>{runningSuiteId === s.id ? 'Running Suite...' : 'Execute Suite'}</span>
                </button>
              </div>

              {/* Test Cases Table */}
              <div className="space-y-2">
                {s.testCases?.map((tc: any, idx: number) => {
                  const testRes = results?.find((r) => r.testCaseId === tc.id);
                  return (
                    <div
                      key={tc.id || idx}
                      className="p-3 rounded-lg bg-charcoal-850 border border-charcoal-700/60 flex items-center justify-between font-mono text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-500 text-xs">#{idx + 1}</span>
                        <span className="px-2 py-0.5 rounded text-xs bg-charcoal-800 text-slate-300 font-bold uppercase">
                          {tc.category}
                        </span>
                        <span className="font-semibold text-white">{tc.name}</span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="text-slate-400 text-xs">Inputs: {tc.inputParameters}</span>

                        {testRes && (
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                testRes.passed
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {testRes.passed ? 'PASSED' : 'FAILED'}
                            </span>
                            <span className="text-slate-500 text-xs">{testRes.durationMs.toFixed(1)}ms</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {suites.length === 0 && (
          <div className="p-12 text-center text-slate-500 bg-charcoal-900 border border-charcoal-800 rounded-xl">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-white">No Test Suites Synthesized</h4>
            <p className="text-xs mt-1">Select a target file and click "Generate Test Suite" to create automated tests.</p>
          </div>
        )}
      </div>
    </div>
  );
};
