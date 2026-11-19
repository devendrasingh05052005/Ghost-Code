import React, { useState } from 'react';
import { ChevronRight, Wand2, Check } from 'lucide-react';
import { SeverityBadge } from './ui';
import { DiffViewer, DiffLine } from './DiffViewer';

export interface IssueItem {
  id: string | number;
  severity: 'critical' | 'high' | 'medium' | string;
  category: string;
  rule: string;
  title: string;
  file: string;
  line: number;
  explain: string;
  before: DiffLine[];
  after: DiffLine[];
}

interface IssueRowProps {
  issue: IssueItem;
  checked: boolean;
  fixed: boolean;
  onToggle: (id: string | number) => void;
  onFixOne: (id: string | number) => void;
}

export const IssueRow: React.FC<IssueRowProps> = ({
  issue,
  checked,
  fixed,
  onToggle,
  onFixOne
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-line first:border-t-0">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-raised/50 transition-colors">
        <input
          type="checkbox"
          checked={checked}
          disabled={fixed}
          onChange={() => onToggle(issue.id)}
          aria-label={`Select: ${issue.title}`}
          className="w-4 h-4 rounded border-line accent-[rgb(var(--primary))] cursor-pointer disabled:cursor-not-allowed"
        />
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer"
        >
          <ChevronRight
            className={`w-4 h-4 shrink-0 text-sub transition-transform ${open ? 'rotate-90' : ''}`}
          />
          {fixed ? <SeverityBadge level="fixed" /> : <SeverityBadge level={issue.severity} />}
          <span className={`font-medium truncate text-[15px] ${fixed ? 'text-sub line-through' : 'text-ink'}`}>
            {issue.title}
          </span>
          <span className="ml-auto hidden sm:block font-mono text-[13px] text-sub shrink-0">
            line {issue.line}
          </span>
        </button>
      </div>

      {open && (
        <div className="px-4 pb-5 pl-[52px] pop space-y-4">
          <div className="rounded-xl bg-raised border border-line p-4">
            <div className="label mb-1">What's wrong, in plain English</div>
            <p className="text-ink text-[14px] leading-relaxed">{issue.explain}</p>
          </div>
          <DiffViewer before={issue.before} after={issue.after} />
          <div className="flex justify-end">
            <button
              className="btn-secondary"
              disabled={fixed}
              onClick={() => onFixOne(issue.id)}
            >
              {fixed ? (
                <>
                  <Check className="w-4 h-4 text-success" />
                  <span>Already fixed</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-primary" />
                  <span>Fix this only</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
