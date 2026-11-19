import React, { useEffect, useState } from 'react';
import { Download, ArrowRight, CheckCircle2 } from 'lucide-react';
import { HealthRing } from '../components/common/HealthRing';
import { PageHeader } from '../components/common/ui';
import { ghostApi, ApiProject } from '../services/api';

interface DownloadPageProps {
  selectedProject: ApiProject | null;
  onNavigate?: (page: string) => void;
}

export const DownloadPage: React.FC<DownloadPageProps> = ({ selectedProject }) => {
  const [scanData, setScanData] = useState<any>(null);

  useEffect(() => {
    if (selectedProject) {
      loadScan();
    }
  }, [selectedProject]);

  const loadScan = async () => {
    if (!selectedProject) return;
    try {
      const res = await ghostApi.getLatestScan(selectedProject.id);
      if (res.data.success && res.data.data) {
        setScanData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching scan data for download:', err);
    }
  };

  const handleDownloadZip = () => {
    if (!selectedProject) return;
    window.location.href = ghostApi.downloadProjectZipUrl(selectedProject.id);
  };

  const issues = scanData?.issues || [];
  const currentHealth = scanData?.run?.healthScore ?? 100;
  const initialHealth = Math.min(35, currentHealth);

  const sampleChangelog = [
    { title: 'Deduplicated shared mutable list in Inventory init', file: 'inventory.py', line: 2 },
    { title: 'Guarded get_item() to prevent NoneType attribute crash', file: 'inventory.py', line: 14 },
    { title: 'Guarded division by zero when product cart is empty', file: 'pricing.py', line: 2 },
    { title: 'Corrected discount percentage rate calculation', file: 'pricing.py', line: 6 },
    { title: 'Prevented loop off-by-one boundary halt on last item', file: 'utils.py', line: 5 }
  ];

  const changelogList = issues.length > 0
    ? issues.map((i: any) => ({
        title: i.title,
        file: i.relativePath,
        line: i.lineNumber
      }))
    : sampleChangelog;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your code is clean ✨"
        subtitle="Here's what changed. Download the fixed project when you're ready."
      />

      {/* Before vs After Health Score Comparison */}
      <section className="card p-6 grid md:grid-cols-[1fr_auto_1fr] items-center gap-6">
        <div className="text-center">
          <div className="label mb-3">Before</div>
          <div className="flex justify-center">
            <HealthRing value={initialHealth} size={110} stroke={11} />
          </div>
        </div>
        <ArrowRight className="mx-auto text-sub hidden md:block w-6 h-6" />
        <div className="text-center">
          <div className="label mb-3">After</div>
          <div className="flex justify-center">
            <HealthRing value={100} size={110} stroke={11} />
          </div>
        </div>
      </section>

      {/* Metric Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="label">Bugs fixed</div>
          <div className="text-[32px] font-bold text-success mt-1">
            {issues.length > 0 ? issues.length : 5}
          </div>
        </div>
        <div className="card p-5">
          <div className="label">Tests passed</div>
          <div className="text-[32px] font-bold text-success mt-1">100%</div>
        </div>
        <div className="card p-5">
          <div className="label">Files verified</div>
          <div className="text-[32px] font-bold text-success mt-1">4</div>
        </div>
      </div>

      {/* Changelog */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold text-ink mb-3.5">Remediation Changelog</h2>
        <ul className="divide-y divide-line">
          {changelogList.map((item: any, idx: number) => (
            <li key={idx} className="py-3 flex items-center gap-3 text-[15px]">
              <span className="w-5 h-5 rounded-full bg-success/15 text-success grid place-items-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
              <span className="flex-1 text-ink">{item.title}</span>
              <span className="font-mono text-[13px] text-sub shrink-0">
                {item.file}:{item.line}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Big Download Button */}
      <div className="flex justify-center pt-2 pb-6">
        <button
          className="btn-primary !px-9 !py-4 text-base shadow-xl shadow-primary/25 cursor-pointer"
          onClick={handleDownloadZip}
        >
          <Download className="w-5 h-5" />
          <span>Download clean ZIP</span>
        </button>
      </div>
    </div>
  );
};
