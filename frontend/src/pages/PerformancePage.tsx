import React, { useEffect, useState } from 'react';
import { ghostApi, ApiProject } from '../services/api';
import { Gauge, AlertTriangle, TrendingUp, Cpu, Clock, CheckCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

interface PerformancePageProps {
  selectedProject: ApiProject | null;
}

export const PerformancePage: React.FC<PerformancePageProps> = ({ selectedProject }) => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedProject) {
      loadMetrics();
    }
  }, [selectedProject]);

  const loadMetrics = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const res = await ghostApi.getPerformance(selectedProject.id);
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedProject) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Gauge className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Project Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an active project to view performance metrics.</p>
      </div>
    );
  }

  const chartData = metrics.map((m) => ({
    name: m.functionName || m.filePath.split('/').pop(),
    duration: m.totalDurationMs,
    invocations: m.invocationCount
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>Memory & Performance Inspector</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Actual measured execution duration, CPU invocation metrics, loop bottlenecks, and memory consumption.
        </p>
      </div>

      {/* Chart Section */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-1">Function Execution Duration Profile</h3>
        <p className="text-xs text-slate-400 mb-6 font-mono">Total execution time in milliseconds</p>

        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Bar dataKey="duration" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs font-mono text-slate-500">
              No performance data measured yet. Execute code in Module 4 to populate benchmarks.
            </div>
          )}
        </div>
      </div>

      {/* Bottlenecks List */}
      <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-white">Identified Performance Bottlenecks</h3>

        <div className="space-y-3">
          {metrics.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-lg bg-charcoal-850 border border-charcoal-700/60 flex items-center justify-between font-mono text-xs"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-sm">{m.functionName}</span>
                  <span className="text-slate-400 text-xs">({m.filePath})</span>
                  {m.isBottleneck && (
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold uppercase">
                      Bottleneck
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-2 text-slate-400 text-xs">
                  <span>Total Duration: <strong className="text-cyan-400">{m.totalDurationMs.toFixed(2)} ms</strong></span>
                  <span>Invocations: <strong className="text-white">{m.invocationCount}</strong></span>
                  <span>Avg Duration: <strong className="text-slate-200">{m.avgDurationMs.toFixed(2)} ms</strong></span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 uppercase">Bottleneck Score</span>
                <p className="text-lg font-extrabold text-amber-400 mt-0.5">{m.bottleneckScore.toFixed(0)} / 100</p>
              </div>
            </div>
          ))}

          {metrics.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-6 font-mono">
              No bottlenecks recorded. Traced routines will automatically profile here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
