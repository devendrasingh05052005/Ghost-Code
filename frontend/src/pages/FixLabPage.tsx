import React, { useEffect, useState } from 'react';
import { ghostApi, ApiProject } from '../services/api';
import {
  Wrench,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Play,
  FileCode,
  ShieldAlert,
  ArrowRight,
  Fingerprint,
  Layers,
  Sparkles,
  Award,
  Download,
  SearchCode
} from 'lucide-react';

interface FixLabPageProps {
  selectedProject: ApiProject | null;
  onNavigate?: (page: any) => void;
}

export const FixLabPage: React.FC<FixLabPageProps> = ({ selectedProject, onNavigate }) => {
  const [fixes, setFixes] = useState<any[]>([]);
  const [unresolvedIssues, setUnresolvedIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pipelineProgress, setPipelineProgress] = useState<{ [fixId: string]: any }>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [batchApplying, setBatchApplying] = useState<boolean>(false);

  useEffect(() => {
    if (selectedProject) {
      loadFixesAndIssues();
    }
  }, [selectedProject]);

  const loadFixesAndIssues = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const [fixRes, scanRes] = await Promise.all([
        ghostApi.getFixes(selectedProject.id),
        ghostApi.getLatestScan(selectedProject.id)
      ]);

      if (fixRes.data.success) {
        setFixes(fixRes.data.data);
      }
      if (scanRes.data.success && scanRes.data.data?.issues) {
        setUnresolvedIssues(scanRes.data.data.issues);
      }
    } catch (err) {
      console.error('Error fetching fixes or issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPipeline = async (fixId: string) => {
    setVerifyingId(fixId);
    try {
      const res = await ghostApi.verifyContinuousFixPipeline(fixId);
      if (res.data.success) {
        setPipelineProgress((prev) => ({
          ...prev,
          [fixId]: res.data.data
        }));
        await loadFixesAndIssues();
      }
    } catch (err: any) {
      console.error('Error in verification pipeline:', err);
      alert(`Pipeline error: ${err.response?.data?.error || err.message}`);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRollbackFix = async (fixId: string) => {
    setVerifyingId(fixId);
    try {
      const res = await ghostApi.rollbackFix(fixId);
      if (res.data.success) {
        setPipelineProgress((prev) => {
          const next = { ...prev };
          delete next[fixId];
          return next;
        });
        await loadFixesAndIssues();
      }
    } catch (err) {
      console.error('Error rolling back fix:', err);
    } finally {
      setVerifyingId(null);
    }
  };

  const handleBatchFixAndVerify = async () => {
    if (!selectedProject || unresolvedIssues.length === 0) return;
    setBatchApplying(true);
    try {
      const issueIds = unresolvedIssues.map((i) => i.id);
      await ghostApi.batchApplyFixes(selectedProject.id, issueIds);
      await loadFixesAndIssues();
    } catch (err) {
      console.error('Error auto-applying fixes:', err);
    } finally {
      setBatchApplying(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Project Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an active project to view the Continuous Fix Verification Lab.</p>
      </div>
    );
  }

  const STAGES = [
    { key: 'STAGE_1_DEFECT_CONFIRMED', label: '1. Defect Confirmed', desc: 'Failing test / rule trigger' },
    { key: 'STAGE_2_PATCH_SYNTHESIZED', label: '2. Patch Synthesized', desc: 'Pre/post SHA-256 diff' },
    { key: 'STAGE_3_UNIT_TEST_PASSED', label: '3. Unit Test Pass', desc: 'Target test clean' },
    { key: 'STAGE_4_REGRESSION_SUITE_PASSED', label: '4. Zero Regressions', desc: 'Project suite passes' },
    { key: 'STAGE_5_EVIDENCE_CERTIFIED', label: '5. Evidence Certified', desc: 'Cryptographic seal' }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Continuous Fix Verification Lab</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated 5-stage verification methodology: Bug Identified → Clean Patch → Targeted Unit Test → Full Regression Suite → Cryptographic Verification Evidence.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigate && (
            <button
              onClick={() => onNavigate('scanner')}
              className="flex items-center space-x-2 px-3.5 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 rounded-lg text-xs font-semibold border border-charcoal-700 transition-all cursor-pointer"
            >
              <SearchCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect Red vs Green Diffs</span>
            </button>
          )}

          <button
            onClick={() => {
              window.location.href = ghostApi.downloadProjectZipUrl(selectedProject.id);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Clean ZIP</span>
          </button>
        </div>
      </div>

      {/* When no fixes are recorded yet, but scan found issues */}
      {fixes.length === 0 && unresolvedIssues.length > 0 && (
        <div className="bg-gradient-to-r from-charcoal-900 via-charcoal-850 to-charcoal-900 border border-cyan-500/30 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {unresolvedIssues.length} Defects Ready for Automated Repair & Verification
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  The Autopsy Scanner has cataloged all syntax, precision, and logical defects. You can apply verified patches and certify each repair across all 5 verification stages.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleBatchFixAndVerify}
                disabled={batchApplying}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className={`w-3.5 h-3.5 ${batchApplying ? 'animate-spin' : ''}`} />
                <span>{batchApplying ? 'Applying & Certifying...' : 'Apply and Certify All Fixes'}</span>
              </button>
            </div>
          </div>

          {/* Quick Issue Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {unresolvedIssues.slice(0, 6).map((issue) => (
              <div
                key={issue.id}
                className="p-3 bg-charcoal-950/70 border border-charcoal-800 rounded-lg font-mono text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                    {issue.severity}
                  </span>
                  <span className="text-slate-500 text-xs truncate max-w-[150px]">
                    {issue.filePath?.split(/[\\/]/).pop()}:{issue.lineNumber}
                  </span>
                </div>
                <div className="font-semibold text-slate-200 truncate">{issue.title}</div>
                <div className="text-xs text-slate-500 line-clamp-1">{issue.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* When codebase is 100% clean and no issues remain */}
      {fixes.length === 0 && unresolvedIssues.length === 0 && (
        <div className="p-12 text-center text-slate-400 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-3 font-sans">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Codebase 100% Clean & Verified!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Zero defects detected. All mathematical and algorithmic safety checks have passed without any pending verification items.
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                window.location.href = ghostApi.downloadProjectZipUrl(selectedProject.id);
              }}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Clean ZIP</span>
            </button>
          </div>
        </div>
      )}

      {/* List of Verified Fixes */}
      {fixes.length > 0 && (
        <div className="space-y-6">
          {fixes.map((f) => {
            const isAccepted = f.status === 'ACCEPTED';
            const isRolledBack = f.status === 'ROLLED_BACK';
            const evidence = pipelineProgress[f.id];

            return (
              <div
                key={f.id}
                className="rounded-xl border border-charcoal-800 bg-charcoal-900 overflow-hidden shadow-xl space-y-4 p-5 font-mono text-xs"
              >
                {/* Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-charcoal-800 pb-3 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold border ${
                        isAccepted
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isRolledBack
                          ? 'bg-slate-700 text-slate-400 border-slate-600'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      }`}
                    >
                      {f.status}
                    </span>
                    <span className="text-slate-200 font-bold">{f.filePath}</span>
                    <span className="text-slate-500 text-xs">| ID: {f.issueId.slice(0, 10)}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!isAccepted && (
                      <button
                        onClick={() => handleVerifyPipeline(f.id)}
                        disabled={verifyingId === f.id}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Play className={`w-3.5 h-3.5 ${verifyingId === f.id ? 'animate-spin' : ''}`} />
                        <span>
                          {verifyingId === f.id ? 'Running 5-Stage Verification...' : 'Run Continuous Verification'}
                        </span>
                      </button>
                    )}

                    {isAccepted && (
                      <button
                        onClick={() => handleRollbackFix(f.id)}
                        disabled={verifyingId === f.id}
                        className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Rollback Fix</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 5-Stage Visual Stepper */}
                <div className="p-4 rounded-lg bg-charcoal-950 border border-charcoal-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>5-Stage Continuous Verification Stepper</span>
                    </span>
                    {isAccepted && (
                      <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>ALL 5 STAGES CERTIFIED PASSED</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {STAGES.map((stg, sIdx) => {
                      const completed =
                        isAccepted || (evidence && evidence.currentStage === 'STAGE_5_EVIDENCE_CERTIFIED');
                      return (
                        <div
                          key={sIdx}
                          className={`p-2.5 rounded-md border text-center transition-all ${
                            completed
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-charcoal-900 border-charcoal-800 text-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-center mb-1">
                            {completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <span className="w-4 h-4 rounded-full border border-slate-600 text-xs flex items-center justify-center font-bold">
                                {sIdx + 1}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-xs leading-tight">{stg.label}</div>
                          <div className="text-xs opacity-75 mt-0.5 leading-tight">{stg.desc}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Diff Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                    <div className="flex items-center space-x-1.5 text-rose-400 font-bold text-xs mb-2">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Original Defective Code</span>
                    </div>
                    <pre className="text-slate-300 overflow-x-auto text-xs whitespace-pre-wrap">
                      {f.originalCode}
                    </pre>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center space-x-1.5 text-emerald-400 font-bold text-xs mb-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Synthesized Remediated Patch</span>
                    </div>
                    <pre className="text-emerald-300 overflow-x-auto text-xs whitespace-pre-wrap">
                      {f.proposedCode}
                    </pre>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
