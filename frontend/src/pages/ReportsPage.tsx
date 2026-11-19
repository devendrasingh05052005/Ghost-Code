import React, { useEffect, useState } from 'react';
import { ghostApi, ApiProject } from '../services/api';
import {
  FileText,
  Download,
  CheckCircle2,
  ShieldAlert,
  Award,
  Fingerprint,
  Layers,
  History,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Bug,
  Activity,
  Calendar
} from 'lucide-react';

interface ReportsPageProps {
  selectedProject: ApiProject | null;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ selectedProject }) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'audit_trail'>('audit_trail');
  const [reports, setReports] = useState<any[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Pillar 5: Evidence-Based Audit Trail State
  const [auditLedger, setAuditLedger] = useState<any | null>(null);
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED' | 'MUTATIONS'>('ALL');
  const [auditLoading, setAuditLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedProject) {
      loadReports();
      loadAuditTrail();
    }
  }, [selectedProject]);

  const loadReports = async () => {
    if (!selectedProject) return;
    try {
      const res = await ghostApi.getReports(selectedProject.id);
      if (res.data.success) {
        setReports(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedReport(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    }
  };

  const loadAuditTrail = async () => {
    if (!selectedProject) return;
    setAuditLoading(true);
    try {
      const res = await ghostApi.getAuditTrail(selectedProject.id);
      if (res.data.success) {
        setAuditLedger(res.data.data);
      }
    } catch (err) {
      console.error('Error loading audit trail:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedProject) return;
    setGenerating(true);
    try {
      const res = await ghostApi.generateReport(selectedProject.id);
      if (res.data.success) {
        await loadReports();
        await loadAuditTrail();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadJson = (report: any) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${selectedProject?.name || 'report'}-autopsy.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadAuditMarkdown = () => {
    if (!selectedProject || !auditLedger) return;
    const downloadUrl = ghostApi.exportAuditTrailUrl(selectedProject.id);
    window.open(downloadUrl, '_blank');
  };

  if (!selectedProject) {
    return (
      <div className="p-12 text-center text-slate-400">
        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">No Project Selected</h3>
        <p className="text-xs text-slate-500 mt-1">Select an active project to view or generate Code Health Reports & Audit Trails.</p>
      </div>
    );
  }

  const filteredEvents = (auditLedger?.events || []).filter((evt: any) => {
    if (auditFilter === 'UNRESOLVED') return evt.eventType === 'DEFECT_DETECTED' && evt.metadata?.verificationStatus !== 'VERIFIED';
    if (auditFilter === 'RESOLVED') return evt.eventType === 'PATCH_VERIFIED' || evt.eventType === 'ISSUE_RESOLVED';
    if (auditFilter === 'MUTATIONS') return evt.eventType === 'MUTATION_TEST_EVALUATED';
    return true;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
            <span>Forensic Audit Trail & Health Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete immutable forensics ledger: what was detected, which tests caught it, what was patched, which regressions were verified, and what remains unresolved.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex bg-charcoal-900 border border-charcoal-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('audit_trail')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase transition-colors ${activeTab === 'audit_trail' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              Forensic Audit Trail
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold uppercase transition-colors ${activeTab === 'reports' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
            >
              Health Reports
            </button>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
          >
            <Award className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Compiling Report...' : 'Generate New Report'}</span>
          </button>
        </div>
      </div>

      {/* PILLAR 5: FORENSIC AUDIT TRAIL TAB */}
      {activeTab === 'audit_trail' && (
        <div className="space-y-6">
          {/* Executive Forensic Summary Cards */}
          {auditLedger && (
            <div className="grid grid-cols-5 gap-3">
              <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
                <span className="text-xs font-mono text-slate-500 uppercase">AUDIT SEAL (SHA-256)</span>
                <p className="text-xs font-mono font-bold text-cyan-400 truncate mt-1">
                  {auditLedger.ledgerIntegrityHash.slice(0, 16)}...
                </p>
                <p className="text-xs text-slate-500 font-mono">Immutable Cryptographic Seal</p>
              </div>

              <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
                <span className="text-xs font-mono text-slate-500 uppercase">TOTAL DEFECTS</span>
                <p className="text-2xl font-extrabold font-mono text-white mt-0.5">
                  {auditLedger.totalDefectsCataloged}
                </p>
                <p className="text-xs text-slate-500 font-mono">Cataloged by Static Engine</p>
              </div>

              <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
                <span className="text-xs font-mono text-slate-500 uppercase">VERIFIED RESOLVED</span>
                <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-0.5">
                  {auditLedger.totalResolvedCount}
                </p>
                <p className="text-xs text-slate-500 font-mono">5-Stage Continuous Verification</p>
              </div>

              <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
                <span className="text-xs font-mono text-slate-500 uppercase">UNRESOLVED ISSUES</span>
                <p className="text-2xl font-extrabold font-mono text-amber-400 mt-0.5">
                  {auditLedger.totalUnresolvedCount}
                </p>
                <p className="text-xs text-slate-500 font-mono">Pending Remediation</p>
              </div>

              <div className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-1">
                <span className="text-xs font-mono text-slate-500 uppercase">COMPLIANCE SCORE</span>
                <p className="text-2xl font-extrabold font-mono text-cyan-400 mt-0.5">
                  {auditLedger.overallComplianceScore}%
                </p>
                <p className="text-xs text-slate-500 font-mono">Clean vs Open Ratio</p>
              </div>
            </div>
          )}

          {/* Forensic Filter & Export Bar */}
          <div className="flex items-center justify-between p-3.5 bg-charcoal-900 border border-charcoal-800 rounded-xl">
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-slate-400 uppercase text-xs font-bold">Filter Timeline:</span>
              <button
                onClick={() => setAuditFilter('ALL')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${auditFilter === 'ALL' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                All Events ({auditLedger?.totalEventsCount || 0})
              </button>
              <button
                onClick={() => setAuditFilter('UNRESOLVED')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${auditFilter === 'UNRESOLVED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                Unresolved Defects ({auditLedger?.totalUnresolvedCount || 0})
              </button>
              <button
                onClick={() => setAuditFilter('RESOLVED')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${auditFilter === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                Verified Clean ({auditLedger?.totalResolvedCount || 0})
              </button>
              <button
                onClick={() => setAuditFilter('MUTATIONS')}
                className={`px-2.5 py-1 rounded text-xs font-bold ${auditFilter === 'MUTATIONS' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                Mutations & Blindspots
              </button>
            </div>

            <button
              onClick={downloadAuditMarkdown}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Audit Certificate (.md)</span>
            </button>
          </div>

          {/* Chronological Event Timeline */}
          <div className="space-y-3 font-mono text-xs">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-slate-500 rounded-xl bg-charcoal-900 border border-charcoal-800">
                No events match the selected audit filter.
              </div>
            ) : (
              filteredEvents.map((evt: any) => {
                const isDetect = evt.eventType === 'DEFECT_DETECTED';
                const isMut = evt.eventType === 'MUTATION_TEST_EVALUATED';
                const isVerify = evt.eventType === 'PATCH_VERIFIED' || evt.eventType === 'ISSUE_RESOLVED';

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-xl bg-charcoal-900 border border-charcoal-800 hover:border-charcoal-700 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${isVerify ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : isMut ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
                          {evt.eventType}
                        </span>
                        <span className="text-white font-bold">{evt.title}</span>
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Fingerprint className="w-3 h-3 text-cyan-400" />
                          <span>{evt.evidenceHash.slice(0, 10)}...</span>
                        </span>
                        <span className="text-slate-400">{evt.timestamp.slice(0, 19).replace('T', ' ')}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {evt.details}
                    </p>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-charcoal-800">
                      <span>Actor: <strong className="text-cyan-400">{evt.actor}</strong></span>
                      {evt.severity && (
                        <span>Severity: <strong className={evt.severity === 'CRITICAL' ? 'text-rose-400' : evt.severity === 'HIGH' ? 'text-amber-400' : 'text-slate-300'}>{evt.severity}</strong></span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* HEALTH REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-charcoal-900 border border-charcoal-800 rounded-xl p-5 flex flex-col space-y-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Generated Health Reports ({reports.length})
            </h3>

            <div className="space-y-2 flex-1 overflow-y-auto max-h-[500px]">
              {reports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReport(r)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-colors ${selectedReport?.id === r.id ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300' : 'bg-charcoal-950 border-charcoal-800 hover:border-charcoal-700 text-slate-400'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">Score: {r.health_score}/100</span>
                    <span className="text-xs text-slate-500">{r.created_at?.slice(0, 10)}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{r.summary_text || 'Standard health audit run.'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-charcoal-900 border border-charcoal-800 rounded-xl p-6 font-mono text-xs space-y-4">
            {selectedReport ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-charcoal-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Health Score: {selectedReport.health_score}/100</h3>
                    <span className="text-xs text-slate-500">Report ID: {selectedReport.id}</span>
                  </div>

                  <button
                    onClick={() => downloadJson(selectedReport)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 text-xs font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Download JSON</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-lg bg-charcoal-950 border border-charcoal-800">
                  <span className="text-xs text-slate-500 block uppercase mb-1">EXECUTIVE SUMMARY:</span>
                  <p className="text-slate-300 font-sans leading-relaxed">{selectedReport.summary_text || 'Comprehensive code autopsy completed.'}</p>
                </div>

                {selectedReport.report_data && (
                  <div className="p-3.5 rounded-lg bg-charcoal-950 border border-charcoal-800 max-h-96 overflow-y-auto">
                    <span className="text-xs text-slate-500 block uppercase mb-1">RAW REPORT PAYLOAD:</span>
                    <pre className="text-cyan-300 text-xs leading-relaxed">{JSON.stringify(JSON.parse(selectedReport.report_data), null, 2)}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">Select a report to view details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
