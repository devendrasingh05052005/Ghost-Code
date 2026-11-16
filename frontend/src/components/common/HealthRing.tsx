import React, { useEffect, useState } from 'react';

interface HealthRingProps {
  value: number;
  size?: number;
  stroke?: number;
  label?: boolean;
}

export const HealthRing: React.FC<HealthRingProps> = ({
  value,
  size = 120,
  stroke = 12,
  label = true
}) => {
  const [shown, setShown] = useState(value);

  useEffect(() => {
    let raf: number;
    const from = shown;
    const start = performance.now();
    const dur = 850;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color =
    shown >= 80
      ? 'rgb(var(--success))'
      : shown >= 50
      ? 'rgb(var(--medium))'
      : 'rgb(var(--critical))';
  const word = shown >= 80 ? 'Healthy' : shown >= 50 ? 'Needs work' : 'Unhealthy';

  return (
    <div
      className="relative shrink-0 select-none"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Health score ${Math.round(shown)} out of 100, ${word}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--line))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(100, shown)) / 100)}
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div
            className="font-bold leading-none"
            style={{ fontSize: size * 0.28, color }}
          >
            {Math.round(shown)}
          </div>
          {label && <div className="text-[13px] text-sub mt-1">{word}</div>}
        </div>
      </div>
    </div>
  );
};
