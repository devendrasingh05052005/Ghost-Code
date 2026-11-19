import React, { useState, useEffect } from 'react';
import { ghostApi } from '../services/api';
import {
  Scale,
  Play,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Binary,
  Layers,
  Sparkles,
  TrendingUp,
  Cpu,
  ShieldCheck,
  AlertOctagon
} from 'lucide-react';

export const CrossLangPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'LOAN_AMORTIZATION' | 'POLYNOMIAL_STABILITY' | 'CURRENCY_ROUNDING'>('LOAN_AMORTIZATION');
  const [principal, setPrincipal] = useState<number>(250000);
  const [rate, setRate] = useState<number>(5.25);
  const [months, setMonths] = useState<number>(360);
  const [comparing, setComparing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);

  useEffect(() => {
    runScenario(selectedScenario);
  }, [selectedScenario]);

  const runScenario = async (scenario: string) => {
    setComparing(true);
    try {
      const res = await ghostApi.runCrossLangScenario(scenario, {
        principal,
        ratePercent: rate,
        termMonths: months
      });
      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      console.error('Error running scenario:', err);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
          <span>Cross-Language Logic Parity & Precision Lab</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Execute identical business algorithms concurrently across native COBOL (IBM BCD Decimal COMP-3), native FORTRAN (IEEE 754 REAL*8), and TypeScript (V8 Binary64) to detect precision drift, ULP distance, and rounding deviations.
        </p>
      </div>

      {/* Scenario Selector */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setSelectedScenario('LOAN_AMORTIZATION')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${selectedScenario === 'LOAN_AMORTIZATION' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-950/40' : 'bg-charcoal-900 border-charcoal-800 text-slate-400 hover:text-white'}`}
        >
          <div className="flex items-center space-x-2 font-mono text-xs font-bold uppercase mb-1">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span>1. Loan Amortization</span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Compound interest & mortgage amortization comparing decimal fixed-point vs IEEE double.
          </p>
        </button>

        <button
          onClick={() => setSelectedScenario('POLYNOMIAL_STABILITY')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${selectedScenario === 'POLYNOMIAL_STABILITY' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-950/40' : 'bg-charcoal-900 border-charcoal-800 text-slate-400 hover:text-white'}`}
        >
          <div className="flex items-center space-x-2 font-mono text-xs font-bold uppercase mb-1">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>2. Catastrophic Cancellation</span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Wilkinson-style high-order polynomial expansion demonstrating floating-point subtraction collapse.
          </p>
        </button>

        <button
          onClick={() => setSelectedScenario('CURRENCY_ROUNDING')}
          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${selectedScenario === 'CURRENCY_ROUNDING' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-950/40' : 'bg-charcoal-900 border-charcoal-800 text-slate-400 hover:text-white'}`}
        >
          <div className="flex items-center space-x-2 font-mono text-xs font-bold uppercase mb-1">
            <Scale className="w-4 h-4 text-rose-400" />
            <span>3. Banker's Rounding Modes</span>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Tri-party FX conversion comparing Round-Half-Up vs Round-Half-To-Even (EBA regulatory compliance).
          </p>
        </button>
      </div>

      {/* Results Matrix */}
      {result && (
        <div className="space-y-6">
          {/* Executive Parity Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${result.withinTolerance ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
            <div className="flex items-center space-x-3">
              {result.withinTolerance ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <h4 className="text-sm font-bold text-white font-mono">{result.scenarioTitle}</h4>
                <p className="text-xs text-slate-300 font-sans mt-0.5">{result.description}</p>
              </div>
            </div>

            <div className="text-right font-mono text-xs">
              <span className="text-slate-400 block text-xs uppercase">MAX ABS DIFFERENCE</span>
              <span className={`text-base font-extrabold ${result.maxAbsoluteDifference === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {result.maxAbsoluteDifference === 0 ? '0.0000 (Exact Parity)' : result.maxAbsoluteDifference}
              </span>
            </div>
          </div>

          {/* 3-Engine Side-by-Side Comparison Grid */}
          <div className="grid grid-cols-3 gap-4 font-mono text-xs">
            {/* COBOL Engine */}
            <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-3">
              <div className="flex items-center justify-between border-b border-charcoal-800 pb-2">
                <span className="font-bold text-cyan-400">1. NATIVE COBOL (IBM BCD)</span>
                <span className="text-xs text-slate-500">GnuCOBOL 3.2.0</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase">EVALUATED OUTPUT</span>
                <p className="text-2xl font-extrabold text-white mt-1">{result.cobol.formatted}</p>
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-xs text-slate-500 block uppercase">INTERNAL REPRESENTATION:</span>
                <p className="text-cyan-300 font-semibold">{result.cobol.precision}</p>
                <p className="text-xs text-slate-400 font-sans mt-1">{result.cobol.representationNotes}</p>
              </div>
            </div>

            {/* FORTRAN Engine */}
            <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-3">
              <div className="flex items-center justify-between border-b border-charcoal-800 pb-2">
                <span className="font-bold text-emerald-400">2. NATIVE FORTRAN (REAL*8)</span>
                <span className="text-xs text-slate-500">GNU Fortran 13.2</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase">EVALUATED OUTPUT</span>
                <p className="text-2xl font-extrabold text-white mt-1">{result.fortran.formatted}</p>
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-xs text-slate-500 block uppercase">INTERNAL REPRESENTATION:</span>
                <p className="text-emerald-300 font-semibold">{result.fortran.precision}</p>
                {result.fortran.bitLevel && (
                  <p className="text-xs text-slate-400 font-mono mt-1">Hex: {result.fortran.bitLevel.rawHex}</p>
                )}
              </div>
            </div>

            {/* TypeScript V8 Engine */}
            <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-3">
              <div className="flex items-center justify-between border-b border-charcoal-800 pb-2">
                <span className="font-bold text-amber-400">3. TYPESCRIPT (V8 BINARY64)</span>
                <span className="text-xs text-slate-500">Node.js V8 Engine</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase">EVALUATED OUTPUT</span>
                <p className="text-2xl font-extrabold text-white mt-1">{result.typescript.formatted}</p>
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-xs text-slate-500 block uppercase">INTERNAL REPRESENTATION:</span>
                <p className="text-amber-300 font-semibold">{result.typescript.precision}</p>
                {result.typescript.bitLevel && (
                  <p className="text-xs text-slate-400 font-mono mt-1">Hex: {result.typescript.bitLevel.rawHex}</p>
                )}
              </div>
            </div>
          </div>

          {/* Bit-Level IEEE 754 Floating-Point Inspector */}
          {result.typescript.bitLevel && (
            <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <Binary className="w-4 h-4 text-cyan-400" />
                  <span>Bit-Level IEEE 754 Binary64 Float Inspection</span>
                </h4>
                {result.ulpDistance !== undefined && (
                  <span className="text-xs text-slate-400">
                    ULP Distance: <strong className="text-cyan-400">{result.ulpDistance.toLocaleString()} ULPs</strong>
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-charcoal-950 border border-charcoal-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                    Sign [1 bit]: {result.typescript.bitLevel.signBit}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold">
                    Exponent [11 bits]: {result.typescript.bitLevel.exponentBits}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold truncate">
                    Mantissa [52 bits]: {result.typescript.bitLevel.mantissaBits}
                  </span>
                </div>
                <div className="text-xs text-slate-500 flex justify-between pt-1 border-t border-charcoal-800">
                  <span>Full Precision Decimal: {result.typescript.bitLevel.decimalSignificantDigits}</span>
                  <span>Raw Hex: {result.typescript.bitLevel.rawHex}</span>
                </div>
              </div>
            </div>
          )}

          {/* Semantic Analysis & Regulatory Risk */}
          <div className="p-5 rounded-xl bg-charcoal-900 border border-charcoal-800 space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Semantic Parity Analysis & Regulatory Risk Assessment</span>
            </h4>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              {result.semanticAnalysis}
            </p>

            {result.discrepancies && result.discrepancies.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-charcoal-800">
                <span className="text-xs font-bold text-amber-400 uppercase font-mono">Divergence Notices:</span>
                {result.discrepancies.map((disc: string, idx: number) => (
                  <div key={idx} className="p-2 rounded bg-charcoal-950 border border-amber-500/20 text-amber-300 text-xs font-mono">
                    {disc}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
