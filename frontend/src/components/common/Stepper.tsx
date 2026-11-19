import React from 'react';
import { Check, Lock } from 'lucide-react';

export interface StepItem {
  id: string;
  label: string;
  hint: string;
}

export const WORKFLOW_STEPS: StepItem[] = [
  { id: 'upload', label: 'Upload', hint: 'Add your code' },
  { id: 'review', label: 'Review', hint: 'See the problems' },
  { id: 'fix', label: 'Fix', hint: 'Apply the fixes' },
  { id: 'test', label: 'Test', hint: 'Run your app' },
  { id: 'download', label: 'Download', hint: 'Get clean code' },
];

interface StepperProps {
  current: string;
  maxReached: string;
  onGo: (stepId: string) => void;
}

export const Stepper: React.FC<StepperProps> = ({ current, maxReached, onGo }) => {
  const currentStep = current === 'scanner' ? 'review' : current === 'execution' ? 'test' : current;
  const idx = WORKFLOW_STEPS.findIndex((s) => s.id === currentStep);
  const reach = WORKFLOW_STEPS.findIndex((s) => s.id === maxReached);

  return (
    <nav aria-label="Workflow progress" className="card px-4 py-3 mb-6 overflow-x-auto">
      <ol className="flex items-center min-w-[640px]">
        {WORKFLOW_STEPS.map((s, i) => {
          const state = i < idx ? 'done' : i === idx ? 'current' : 'locked';
          const clickable = i <= Math.max(reach, idx);
          return (
            <li key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                disabled={!clickable}
                onClick={() => onGo(s.id)}
                aria-current={state === 'current' ? 'step' : undefined}
                className="flex items-center gap-3 rounded-xl px-2.5 py-1.5 text-left disabled:cursor-not-allowed group cursor-pointer transition-all"
              >
                <span
                  className={`grid place-items-center w-8 h-8 rounded-full text-sm font-semibold border transition shadow-sm
                  ${state === 'done' ? 'bg-success text-bg border-success' : ''}
                  ${state === 'current' ? 'bg-primary text-primary-ink border-primary ring-4 ring-primary/20' : ''}
                  ${state === 'locked' ? 'bg-raised text-sub border-line group-hover:border-primary/40' : ''}`}
                >
                  {state === 'done' ? (
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  ) : state === 'locked' && !clickable ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="hidden md:block">
                  <span
                    className={`block text-sm font-semibold ${
                      state === 'locked' ? 'text-sub group-hover:text-ink' : 'text-ink'
                    }`}
                  >
                    {s.label}
                  </span>
                  <span className="block text-[13px] text-sub leading-tight">{s.hint}</span>
                </span>
              </button>
              {i < WORKFLOW_STEPS.length - 1 && (
                <span
                  className={`flex-1 h-0.5 mx-2 rounded ${i < idx ? 'bg-success' : 'bg-line'}`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
