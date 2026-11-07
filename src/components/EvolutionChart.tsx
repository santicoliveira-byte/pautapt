import React, { useState } from 'react';
import { SchoolTest } from '../types';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface EvolutionChartProps {
  tests: SchoolTest[];
  subjectFilter?: string;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({ tests, subjectFilter }) => {
  const [selectedPoint, setSelectedPoint] = useState<SchoolTest | null>(null);

  // Filter and sort tests chronologically (oldest to newest)
  const sortedTests = [...tests]
    .filter((t) => !subjectFilter || t.subject === subjectFilter)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sortedTests.length < 2) {
    return (
      <div className="p-4 rounded-3xl bg-zinc-900/60 border border-white/5 text-center">
        <p className="text-xs text-zinc-400">
          Precisas de pelo menos 2 testes registados para gerar o gráfico de evolução temporal.
        </p>
      </div>
    );
  }

  // Trend calculation
  const first = sortedTests[0].grade20;
  const last = sortedTests[sortedTests.length - 1].grade20;
  const diff = Number((last - first).toFixed(1));

  // Chart dimensions
  const width = 340;
  const height = 150;
  const paddingX = 25;
  const paddingY = 20;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Map points to SVG coordinates (Y: 0 is 20 val, height is 0 val)
  const points = sortedTests.map((t, idx) => {
    const x = paddingX + (idx / (sortedTests.length - 1)) * chartW;
    const y = paddingY + (1 - t.grade20 / 20) * chartH;
    return { x, y, test: t };
  });

  // Build SVG path
  const pathD = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
    // smooth curve
    const prev = points[idx - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  // Fill area path (closed down to bottom)
  const bottomY = height - paddingY;
  const fillD = `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

  // 9.5 and 17.5 reference lines Y
  const y95 = paddingY + (1 - 9.5 / 20) * chartH;
  const y175 = paddingY + (1 - 17.5 / 20) * chartH;

  return (
    <div className="p-4 rounded-3xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-ios-card space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
            Evolução das Notas (0 a 20)
          </span>
          <span className="text-[11px] text-zinc-500">
            {subjectFilter || 'Todas as disciplinas'} • {sortedTests.length} avaliações
          </span>
        </div>

        <div
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
            diff > 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : diff < 0
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-zinc-800 text-zinc-300 border-white/5'
          }`}
        >
          {diff > 0 ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : diff < 0 ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : (
            <Minus className="w-3.5 h-3.5" />
          )}
          <span>{diff > 0 ? `+${diff}` : diff} val</span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden flex justify-center py-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0A84FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Dotted guideline for 17.5 (Excelente) */}
          <line
            x1={paddingX}
            y1={y175}
            x2={width - paddingX}
            y2={y175}
            stroke="rgba(48, 209, 88, 0.25)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={paddingX}
            y={y175 - 4}
            fill="rgba(48, 209, 88, 0.6)"
            fontSize="8"
            fontFamily="sans-serif"
          >
            17.5 (Excelente)
          </text>

          {/* Dotted guideline for 9.5 (Pass) */}
          <line
            x1={paddingX}
            y1={y95}
            x2={width - paddingX}
            y2={y95}
            stroke="rgba(255, 69, 58, 0.25)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={paddingX}
            y={y95 - 4}
            fill="rgba(255, 69, 58, 0.6)"
            fontSize="8"
            fontFamily="sans-serif"
          >
            9.5 (Positiva)
          </text>

          {/* Area Fill */}
          <path d={fillD} fill="url(#chartGradient)" />

          {/* Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#0A84FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive Dots */}
          {points.map((p, idx) => {
            const isSelected = selectedPoint?.id === p.test.id;
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedPoint(p.test);
                }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 4}
                  fill={p.test.grade20 >= 9.5 ? '#30D158' : '#FF453A'}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  className="transition-all"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Point Callout on Tap */}
      {selectedPoint && (
        <div className="p-2.5 rounded-2xl bg-zinc-950/90 border border-blue-500/30 flex items-center justify-between text-xs animate-fade-in">
          <div>
            <div className="font-bold text-white truncate max-w-[200px]">
              {selectedPoint.title}
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(selectedPoint.date).toLocaleDateString('pt-PT')} • {selectedPoint.subject}
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-blue-400">
              {selectedPoint.grade20.toFixed(1)}
            </span>
            <span className="text-[10px] text-zinc-500 block">/ 20 val</span>
          </div>
        </div>
      )}
    </div>
  );
};
