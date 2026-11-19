import React, { useEffect, useState } from 'react';
import { ghostApi, ApiProject } from '../services/api';
import {
  Bug,
  RotateCcw,
  Play,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Target,
  Clock,
  Layers,
  Sparkles,
  AlertOctagon
} from 'lucide-react';

interface MutationLabPageProps {
  selectedProject: ApiProject | null;
  onNavigate: (page: any) => void;
}

export const MutationLabPage: React.FC<MutationLabPageProps> = ({ selectedProject, onNavigate }) => {
  const [mutations, setMutations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [mutationCount, setMutationCount] = useState<number>(20);
  const [evaluation, setEvaluation] = useState<any | null>(null);

  useEffect(() => {
    if (selectedProject) {
      handleEvaluate();
    }
  }, [selectedProject]);

  const handleEvaluate = async () => {
    if (!selectedProject) return;
    setEvaluating(true);
    try {
      const res = await ghostApi.evaluateMutationLab(selectedProject.id, mutationCount);
      if (res.data.success) {
        setEvaluation(res.data.data);
        const mutRes = await ghostApi.getMutations(res.data.data.mutationRunId);
        if (mutRes.data.success) {
          setMutations(mutRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error running mutation evaluation:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleRollback = async (mutationId: string) => {
    try {
      await ghostApi.rollbackMutation(mutationId);
      setMutations((prev) =>
        prev.map((m) => (m.id === mutationId ? { ...m, status: 'ROLLED_BACK' } : m))
      );
    } catch (err) {
      console.error('Error rolling back mutation:', err);
    }
  };

  if (!selectedProject) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Bug className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Project Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Please select an active project to access the Mutation Lab.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Scientific Mutation Testing Laboratory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Systematically injects controlled defects into isolated AST nodes to scientifically measure test suite quality & identify assertion blindspots.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-charcoal-900 border border-charcoal-700 px-3 py-1.5 rounded-lg text-xs font-mono">
            <span className="text-slate-400">Mutants:</span>
            <select
              value={mutationCount}
              onChange={(e) => setMutationCount(parseInt(e.target.value, 10))}
              className="bg-charcoal-950 text-white rounded px-2 py-0.5 border border-charcoal-700 outline-none"
            >
              <option value="10">10 Mutants</option>
              <option value="20">20 Mutants</option>
              <option value="35">35 Mutants</option>
              <option value="50">50 Mutants</option>
            </select>
          </div>

          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${evaluating ? 'animate-spin' : ''}`} />
            <span>{evaluating ? 'Evaluating Test Resilience...' : 'Run Mutation Evaluation'}</span>
          </button>
        </div>
      </div>

      {/* Scientific Mutation Scorecard */}
      {evaluation && (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>MUTATION SCORE</span>
              <Target className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className={`text-3xl font-extrabold font-mono ${evaluation.mutationScore >= 80 ? 'text-emerald-400' : evaluation.mutationScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                {evaluation.mutationScore}%
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold uppercase">
                {evaluation.testQualityRating}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">Killed / (Total - Errors)</p>
          </div>

          <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>KILLED MUTANTS</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
              {evaluation.killedCount}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-1">Caught by test assertions</p>
          </div>

          <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>SURVIVED (BLINDSPOTS)</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-3xl font-extrabold font-mono text-rose-400 mt-1">
              {evaluation.survivedCount}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-1">Passed despite logic changes</p>
          </div>

          <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
              <span>TIMED OUT / INFINITE</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-extrabold font-mono text-amber-400 mt-1">
              {evaluation.timedOutCount}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-1">Trapped by 8s sandbox cap</p>
          </div>
        </div>
      )}

      {/* Operator Effectiveness & Scientific Verdict */}
      {evaluation && (
        <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Mutation Operator Effectiveness Breakdown</span>
            </h3>
            <span className="text-xs font-mono text-slate-400 font-semibold">
              {evaluation.operators.length} Operator Families Evaluated
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {evaluation.operators.map((op: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-lg bg-charcoal-950 border border-charcoal-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-200 truncate">{op.operatorName}</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{op.effectivenessRate}%</span>
                </div>
                <div className="w-full bg-charcoal-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${op.effectivenessRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-slate-500">
                  <span>Killed: {op.killed}</span>
                  <span>Survived: {op.survived}</span>
                  <span>Total: {op.totalInjected}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-lg bg-charcoal-950 border border-cyan-500/20 text-xs font-mono text-slate-300 flex items-start space-x-2.5">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{evaluation.verdict}</p>
          </div>
        </div>
      )}

      {/* Test Suite Blindspots (Survived Mutants) */}
      {evaluation && evaluation.blindspots && evaluation.blindspots.length > 0 && (
        <div className="p-5 rounded-xl bg-charcoal-900 border border-rose-500/30 space-y-3">
          <h3 className="text-sm font-bold font-mono text-rose-400 flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4" />
            <span>High-Priority Test Suite Blindspots ({evaluation.blindspots.length})</span>
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            The following logic mutations passed your existing test suite without triggering failures. These represent critical assertion gaps:
          </p>

          <div className="space-y-2">
            {evaluation.blindspots.map((bs: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-lg bg-charcoal-950 border border-charcoal-800 space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold">{bs.filePath}:{bs.lineNumber}</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                    {bs.operatorName}
                  </span>
                </div>
                <div className="p-2 rounded bg-charcoal-900 text-rose-300 text-xs overflow-x-auto">
                  <code>{bs.mutatedSnippet}</code>
                </div>
                <p className="text-xs text-slate-400 font-sans">{bs.whySurvived}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Injected Mutants Ledger */}
      <div className="rounded-xl border border-charcoal-800 bg-charcoal-900 overflow-hidden">
        <div className="p-4 border-b border-charcoal-800 flex items-center justify-between">
          <h3 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
            <Bug className="w-4 h-4 text-cyan-400" />
            <span>Injected Mutants Audit Log ({mutations.length})</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">Atomic Rollback Enabled</span>
        </div>

        {mutations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            No active mutants recorded. Click "Run Mutation Evaluation" above to initiate scientific testing.
          </div>
        ) : (
          <div className="divide-y divide-charcoal-800">
            {mutations.map((mut: any) => (
              <div key={mut.id} className="p-4 hover:bg-charcoal-800/40 transition-colors space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${mut.status === 'KILLED' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : mut.status === 'SURVIVED' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : mut.status === 'ROLLED_BACK' ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'}`}>
                      {mut.status}
                    </span>
                    <span className="text-slate-300 font-bold">{mut.operatorName}</span>
                    <span className="text-slate-500">in</span>
                    <span className="text-cyan-400 font-semibold">{mut.filePath}:{mut.lineNumber}</span>
                  </div>

                  {mut.status !== 'ROLLED_BACK' && (
                    <button
                      onClick={() => handleRollback(mut.id)}
                      className="px-2.5 py-1 rounded bg-charcoal-800 hover:bg-charcoal-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-cyan-400" />
                      <span>Rollback</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-charcoal-950 border border-charcoal-800">
                    <span className="text-xs text-slate-500 block mb-1">ORIGINAL AST NODE:</span>
                    <code className="text-emerald-400">{mut.originalSnippet}</code>
                  </div>
                  <div className="p-2 rounded bg-charcoal-950 border border-charcoal-800">
                    <span className="text-xs text-slate-500 block mb-1">MUTATED AST NODE:</span>
                    <code className="text-rose-400">{mut.mutatedSnippet}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
