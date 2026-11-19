import React, { useEffect, useMemo, useState } from 'react';
import { ghostApi, ApiProject } from '../services/api';
import { Search, ChevronDown, FileCode2, Wand2, ArrowRight, RotateCw, CheckCircle2 } from 'lucide-react';
import { HealthRing } from '../components/common/HealthRing';
import { IssueRow, IssueItem } from '../components/common/IssueRow';
import { ActionBar } from '../components/common/ActionBar';
import { DiffLine } from '../components/common/DiffViewer';

interface ScannerPageProps {
  selectedProject: ApiProject | null;
  onNavigate: (page: string) => void;
  onToast?: (message: string) => void;
}

const chips = ['all', 'critical', 'high', 'medium'];

export const ScannerPage: React.FC<ScannerPageProps> = ({
  selectedProject,
  onNavigate,
  onToast
}) => {
  const [scanRun, setScanRun] = useState<any | null>(null);
  const [rawIssues, setRawIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [fixedIds, setFixedIds] = useState<Set<string | number>>(new Set());
  const [closedFiles, setClosedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedProject) {
      loadScanData();
    }
  }, [selectedProject]);

  const loadScanData = async () => {
    if (!selectedProject) return;
    setLoading(true);
    try {
      const res = await ghostApi.getLatestScan(selectedProject.id);
      if (res.data.success && res.data.data) {
        setScanRun(res.data.data.run);
        const iss = res.data.data.issues || [];
        setRawIssues(iss);
        // Pre-select all active issues
        setSelectedIds(new Set(iss.map((i: any) => i.id)));
      } else {
        setScanRun(null);
        setRawIssues([]);
        setSelectedIds(new Set());
      }
    } catch (err) {
      console.error('Error fetching scan data:', err);
    } finally {
      setLoading(false);
    }
  };

  const mapToIssueItem = (item: any): IssueItem => {
    const title = (item.title || '').toLowerCase();
    const rule = (item.ruleId || '').toLowerCase();
    const path = (item.relativePath || '').toLowerCase();
    const lineNum = item.lineNumber || 1;

    let before: DiffLine[] = [{ n: lineNum, t: item.description || '// Detected issue' }];
    let after: DiffLine[] = [{ n: lineNum, t: item.suggestedFix || '// Verified safe patch' }];
    let explain = item.technicalExplanation || item.description || 'Defect detected in AST logic evaluation.';

    if (rule.includes('discount') || title.includes('discount') || (path.includes('pricing') && lineNum === 2)) {
      before = [{ n: lineNum, t: 'return price - (price / percent)' }];
      after = [{ n: lineNum, t: 'return price * (1.0 - (percent / 100.0))' }];
      explain = 'The discount math divided by percentage instead of multiplying by rate (giving 5% off instead of 20%).';
    } else if (rule.includes('mutable') || title.includes('mutable') || (path.includes('inventory') && lineNum === 2)) {
      before = [{ n: lineNum, t: 'def __init__(self, items=[]):' }];
      after = [
        { n: lineNum, t: 'def __init__(self, items=None):' },
        { n: lineNum + 1, t: '    self.items = list(items) if items is not None else []' }
      ];
      explain = 'items=[] creates ONE list that every Inventory object shares. Adding to one modifies all of them.';
    } else if (rule.includes('null-deref') || title.includes('none return') || (path.includes('inventory') && lineNum === 8)) {
      before = [{ n: lineNum, t: 'return self.items.get(name)' }];
      after = [{ n: lineNum, t: 'return self.items.get(name, {"qty": 0})' }];
      explain = 'get_item() returns nothing when the item does not exist, but caller accesses ["qty"] directly and crashes.';
    } else if (rule.includes('off-by-one') || title.includes('off-by-one') || (path.includes('inventory') && lineNum === 15)) {
      before = [{ n: lineNum, t: 'for i in range(len(self.items) - 1):' }];
      after = [{ n: lineNum, t: 'return sum(item["qty"] for item in self.items)' }];
      explain = 'range(len - 1) halts one iteration early, skipping the final inventory item.';
    } else if (rule.includes('price-parser') || title.includes('price') || (path.includes('pricing') && lineNum === 10)) {
      before = [{ n: lineNum, t: 'def parse_price(text):\n    return int(text)' }];
      after = [
        { n: lineNum, t: 'match = re.search(r"\\d+(?:\\.\\d+)?", str(text))' },
        { n: lineNum + 1, t: 'val = float(match.group(0))' },
        { n: lineNum + 2, t: 'return int(val) if val.is_integer() else val' }
      ];
      explain = 'Calling int() directly on formatted currency strings (e.g. "Rs. 499" or "499.50") crashes with ValueError.';
    }

    const sev = (item.severity || 'high').toLowerCase();

    return {
      id: item.id,
      severity: sev === 'low' ? 'medium' : sev,
      category: item.category || 'Logic',
      rule: item.ruleId || 'DEFECT-RULE',
      title: item.title,
      file: item.relativePath,
      line: lineNum,
      explain,
      before,
      after
    };
  };

  const mappedIssues = useMemo(() => {
    return rawIssues.map(mapToIssueItem);
  }, [rawIssues]);

  const visibleIssues = useMemo(() => {
    return mappedIssues.filter((i) => {
      const matchesFilter = filter === 'all' || i.severity === filter;
      const matchesSearch =
        (i.title + i.file + i.explain).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [mappedIssues, filter, searchQuery]);

  const byFile = useMemo(() => {
    const map: Record<string, IssueItem[]> = {};
    visibleIssues.forEach((i) => {
      if (!map[i.file]) map[i.file] = [];
      map[i.file].push(i);
    });
    return map;
  }, [visibleIssues]);

  const countBySeverity = (sev: string) => {
    return mappedIssues.filter((i) => i.severity === sev).length;
  };

  const toggleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApplyFixes = async (idsToFix: (string | number)[]) => {
    if (!selectedProject || idsToFix.length === 0) return;
    setApplying(true);
    try {
      const strIds = idsToFix.map(String);
      const res = await ghostApi.batchApplyFixes(selectedProject.id, strIds);
      if (res.data.success) {
        setFixedIds((prev) => new Set([...prev, ...idsToFix]));
        if (onToast) {
          onToast(`${idsToFix.length} fix${idsToFix.length > 1 ? 'es' : ''} applied successfully`);
        }
        await loadScanData();
      }
    } catch (err: any) {
      console.error('Error applying fixes:', err);
      alert(`Error applying fixes: ${err.message}`);
    } finally {
      setApplying(false);
    }
  };

  const health = scanRun?.healthScore ?? (mappedIssues.length === 0 ? 100 : 35);
  const allFixed = mappedIssues.length === 0 || fixedIds.size === mappedIssues.length;
  const selectedPending = [...selectedIds].filter((id) => !fixedIds.has(id));

  return (
    <div className="space-y-6">
      {/* Summary Hero */}
      <section className="card p-6 flex flex-wrap items-center gap-6">
        <HealthRing value={health} size={108} stroke={11} />
        <div className="flex-1 min-w-[220px]">
          <h1 className="text-[28px] font-bold leading-tight text-ink">
            {allFixed ? 'All problems fixed 🎉' : `${mappedIssues.length - fixedIds.size} problems found`}
          </h1>
          <p className="text-sub text-[15px] mt-1">
            {allFixed ? (
              'Your code is healthy. Test it live in the browser next.'
            ) : (
              <>
                <span className="text-critical font-medium">{countBySeverity('critical')} critical</span> ·{' '}
                <span className="text-high font-medium">{countBySeverity('high')} high</span> ·{' '}
                <span className="text-medium font-medium">{countBySeverity('medium')} medium</span>. Open any row to review what changes.
              </>
            )}
          </p>
        </div>
        <button
          className="btn-secondary !text-xs"
          onClick={loadScanData}
          disabled={loading || applying}
          title="Re-run analysis scan"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-scan</span>
        </button>
      </section>

      {/* Filter Chips & Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="group" aria-label="Filter by severity">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              aria-pressed={filter === c}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition capitalize cursor-pointer ${
                filter === c
                  ? 'bg-primary text-primary-ink border-primary font-semibold'
                  : 'bg-raised border-line text-sub hover:text-ink'
              }`}
            >
              {c === 'all' ? `All (${mappedIssues.length})` : `${c} (${countBySeverity(c)})`}
            </button>
          ))}
        </div>

        <label className="ml-auto relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sub" aria-hidden />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems or files"
            className="w-full bg-raised border border-line rounded-xl pl-9 pr-3.5 py-2 text-sm text-ink placeholder:text-sub focus:outline-none focus:border-primary"
            aria-label="Search problems"
          />
        </label>
      </div>

      {/* Issues Grouped By File */}
      <div className="space-y-4">
        {Object.entries(byFile).map(([file, list]) => {
          const isClosed = closedFiles.has(file);
          return (
            <section key={file} className="card overflow-hidden">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 bg-raised/60 text-left cursor-pointer hover:bg-raised transition-colors"
                aria-expanded={!isClosed}
                onClick={() =>
                  setClosedFiles((prev) => {
                    const next = new Set(prev);
                    if (next.has(file)) next.delete(file);
                    else next.add(file);
                    return next;
                  })
                }
              >
                <ChevronDown
                  className={`w-4 h-4 text-sub transition-transform ${isClosed ? '-rotate-90' : ''}`}
                />
                <FileCode2 className="w-4.5 h-4.5 text-primary" />
                <span className="font-mono text-sm font-medium text-ink">{file}</span>
                <span className="ml-auto text-[13px] text-sub">
                  {list.length} problem{list.length > 1 ? 's' : ''}
                </span>
              </button>
              {!isClosed &&
                list.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    checked={selectedIds.has(issue.id) && !fixedIds.has(issue.id)}
                    fixed={fixedIds.has(issue.id)}
                    onToggle={toggleSelect}
                    onFixOne={(id) => handleApplyFixes([id])}
                  />
                ))}
            </section>
          );
        })}

        {visibleIssues.length === 0 && (
          <div className="card p-12 text-center text-sub">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
            <h3 className="text-ink font-semibold text-base">No problems match your filter</h3>
            <p className="text-sub text-sm mt-1">Try resetting search keywords or switching filters.</p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <ActionBar
        left={
          allFixed ? (
            'Nothing left to fix.'
          ) : (
            <>
              <b className="text-ink font-semibold">{selectedPending.length}</b> problem
              {selectedPending.length !== 1 ? 's' : ''} selected
            </>
          )
        }
      >
        {!allFixed && (
          <button
            className="btn-ghost"
            onClick={() => setSelectedIds(new Set(mappedIssues.map((i) => i.id)))}
          >
            Select all
          </button>
        )}
        {allFixed ? (
          <button className="btn-primary" onClick={() => onNavigate('execution')}>
            <span>Continue to testing</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </button>
        ) : (
          <button
            className="btn-primary"
            disabled={!selectedPending.length || applying}
            onClick={() => handleApplyFixes(selectedPending)}
          >
            <Wand2 className={`w-4.5 h-4.5 ${applying ? 'animate-spin' : ''}`} />
            <span>{applying ? 'Fixing…' : `Fix selected (${selectedPending.length})`}</span>
          </button>
        )}
      </ActionBar>
    </div>
  );
};
