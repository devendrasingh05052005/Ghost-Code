import React, { useEffect, useState } from 'react';
import { ghostApi, ApiProject } from '../services/api';
import { ArrowRight, FolderOpen, FileCode2, ShieldAlert, CheckCircle2, UploadCloud } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatCard } from '../components/common/StatCard';
import { HealthRing } from '../components/common/HealthRing';

interface DashboardPageProps {
  selectedProject: ApiProject | null;
  projects: ApiProject[];
  onSelectProject: (project: ApiProject) => void;
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  selectedProject,
  projects,
  onNavigate
}) => {
  const [stats, setStats] = useState<any>(null);
  const [latestScan, setLatestScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedProject]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await ghostApi.getDashboardStats();
      if (res.data.success) {
        setStats(res.data.data);
      }
      if (selectedProject) {
        const scanRes = await ghostApi.getLatestScan(selectedProject.id);
        if (scanRes.data.success && scanRes.data.data) {
          setLatestScan(scanRes.data.data);
        }
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const hasProject = projects.length > 0;
  const health = latestScan?.run?.healthScore ?? 100;
  const issues = latestScan?.issues || [];
  const openCount = issues.length;
  const critCount = issues.filter((i: any) => i.severity?.toLowerCase() === 'critical').length;
  const highCount = issues.filter((i: any) => i.severity?.toLowerCase() === 'high').length;
  const medCount = issues.filter((i: any) => i.severity?.toLowerCase() === 'medium').length;

  const chartData = [
    { name: 'Critical', value: critCount, s: 'critical' },
    { name: 'High', value: highCount, s: 'high' },
    { name: 'Medium', value: medCount, s: 'medium' }
  ];

  const colors: Record<string, string> = {
    critical: 'rgb(var(--critical))',
    high: 'rgb(var(--high))',
    medium: 'rgb(var(--medium))'
  };

  if (!hasProject) {
    return (
      <div className="card p-12 text-center max-w-xl mx-auto mt-10">
        <div className="mx-auto w-16 h-16 grid place-items-center rounded-2xl bg-primary/10 text-primary mb-5 shadow-lg shadow-primary/10">
          <UploadCloud className="w-8 h-8" />
        </div>
        <h1 className="text-[28px] font-bold text-ink">Let's check your code</h1>
        <p className="text-sub text-[15px] mt-2 mb-6 leading-relaxed">
          Upload a ZIP of your project. We'll find the bugs, show you the fixes, and give you clean code back.
        </p>
        <button
          className="btn-primary"
          onClick={() => onNavigate('upload')}
        >
          <span>Upload your first project</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-ink">Welcome back 👋</h1>
        <p className="text-sub text-[15px] mt-1">Here's where your project stands.</p>
      </div>

      {/* Hero: Continue where you left off */}
      <section className="card p-6 flex flex-wrap items-center gap-6 bg-gradient-to-br from-primary/10 via-surface to-surface border-primary/25">
        <HealthRing value={health} size={110} stroke={11} />
        <div className="flex-1 min-w-[240px]">
          <div className="label">Continue where you left off</div>
          <h2 className="text-[22px] font-bold mt-0.5 text-ink">
            {selectedProject?.name || 'Active Project'}
          </h2>
          <p className="text-sub text-sm mb-3">
            {openCount > 0
              ? `${openCount} issues need review before verification`
              : 'All detected defects have been resolved'}
          </p>
          <div
            className="h-2 rounded-full bg-line overflow-hidden"
            role="progressbar"
            aria-valuenow={health}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.round(health)}%` }}
            />
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => onNavigate(openCount > 0 ? 'scanner' : 'execution')}
        >
          <span>{openCount > 0 ? 'Review & Fix' : 'Run Live Verification'}</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </button>
      </section>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Projects"
          value={stats?.projectCount ?? projects.length}
          note="Projects you've uploaded to local lab."
          icon={FolderOpen}
          tone="primary"
        />
        <StatCard
          label="Files checked"
          value={stats?.totalFilesAnalyzed ?? (selectedProject ? 4 : 0)}
          note="Source files indexed and parsed."
          icon={FileCode2}
          tone="primary"
        />
        <StatCard
          label="Open problems"
          value={openCount}
          note={
            critCount > 0
              ? `${critCount} critical – these can crash your app.`
              : 'Zero critical runtime crashes.'
          }
          icon={ShieldAlert}
          tone={openCount > 0 ? 'critical' : 'success'}
        />
        <StatCard
          label="Health index"
          value={`${Math.round(health)}/100`}
          note={openCount === 0 ? 'Everything is clean & verified 🎉' : 'Apply fixes in the Review step.'}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* Charts + Recent Activity */}
      <div className="grid lg:grid-cols-5 gap-4">
        <section className="card p-5 lg:col-span-3 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-ink">Problems by severity</h3>
            <p className="text-[13px] text-sub mb-3">Critical ones should be repaired first.</p>
          </div>
          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={75}
                  tick={{ fill: 'rgb(var(--sub))', fontSize: 13 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--raised))' }}
                  contentStyle={{
                    background: 'rgb(var(--raised))',
                    border: '1px solid rgb(var(--line))',
                    borderRadius: 10,
                    color: 'rgb(var(--ink))'
                  }}
                />
                <Bar dataKey="value" radius={8} barSize={22} label={{ position: 'right', fill: 'rgb(var(--ink))', fontSize: 13 }}>
                  {chartData.map((c) => (
                    <Cell key={c.s} fill={colors[c.s]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-ink mb-3">Recent activity</h3>
          <ul className="space-y-4">
            {stats?.recentAnalyses && stats.recentAnalyses.length > 0 ? (
              stats.recentAnalyses.slice(0, 3).map((a: any) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden />
                  <div>
                    <div className="font-medium text-ink text-sm">
                      Scan finished · {a.totalIssues} issues ({a.healthScore.toFixed(0)} score)
                    </div>
                    <div className="text-[13px] text-sub">
                      {new Date(a.runTimestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <>
                <li className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden />
                  <div>
                    <div className="font-medium text-ink text-sm">Project workspace initialized</div>
                    <div className="text-[13px] text-sub">Ready for upload</div>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-success shrink-0" aria-hidden />
                  <div>
                    <div className="font-medium text-ink text-sm">Autonomous AST engine ready</div>
                    <div className="text-[13px] text-sub">Local environment active</div>
                  </div>
                </li>
              </>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
};
