import React, { useState, useMemo } from 'react';
import { SchoolTest, SubjectCriteriaMap } from '../types';
import { calculateSubjectStats, getSubjectDurationWeight } from '../utils/gradeUtils';
import { computeLiveSecondarySummary } from '../utils/secondaryUtils';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

export type EvolutionChartMode = 'grades' | 'year' | 'secondary';

interface EvolutionChartProps {
  tests: SchoolTest[];
  subjectFilter?: string;
  mode?: EvolutionChartMode;
  subjectCriteria?: SubjectCriteriaMap;
}

interface ChartPointData {
  test: SchoolTest;
  value: number; // 0 to 20
  secondaryPoints200?: number;
}

export const EvolutionChart: React.FC<EvolutionChartProps> = ({
  tests,
  subjectFilter,
  mode = 'grades',
  subjectCriteria,
}) => {
  const [selectedPoint, setSelectedPoint] = useState<ChartPointData | null>(null);

  // Filter and sort tests chronologically (oldest to newest)
  const sortedTests = useMemo(
    () =>
      [...tests]
        .filter((t) => !subjectFilter || t.subject === subjectFilter)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [tests, subjectFilter]
  );

  // Compute series values according to mode
  const seriesData: ChartPointData[] = useMemo(() => {
    if (sortedTests.length < 2) return [];

    if (mode === 'grades') {
      return sortedTests.map((t) => ({
        test: t,
        value: t.grade20,
      }));
    }

    return sortedTests.map((t, idx) => {
      const prefix = sortedTests.slice(0, idx + 1);

      if (mode === 'secondary') {
        const summary = computeLiveSecondarySummary(prefix, subjectCriteria);
        return {
          test: t,
          value: summary.finalCFC,
          secondaryPoints200: summary.finalCFCPoints200,
        };
      }

      // mode === 'year': cumulative Média do Ano
      const stats = calculateSubjectStats(prefix, subjectCriteria);
      const list = Object.values(stats);
      const totalWeight = list.reduce((acc, c) => acc + getSubjectDurationWeight(c.name), 0);
      const weightedSum = list.reduce(
        (acc, c) => acc + c.weightedAverage * getSubjectDurationWeight(c.name),
        0
      );
      const avg = totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : 0;
      return {
        test: t,
        value: avg,
      };
    });
  }, [sortedTests, mode, subjectCriteria]);

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
  const first = seriesData[0].value;
  const last = seriesData[seriesData.length - 1].value;
  const diff = Number((last - first).toFixed(mode === 'grades' ? 1 : 2));

  // Chart dimensions
  const width = 340;
  const height = 150;
  const paddingX = 25;
  const paddingY = 20;

  const chartW = width - paddingX * 2;
  const chartH = height - paddingY * 2;

  // Map points to SVG coordinates (Y: 0 is 20 val, height is 0 val)
  const points = seriesData.map((d, idx) => {
    const x = paddingX + (idx / (seriesData.length - 1)) * chartW;
    const y = paddingY + (1 - Math.min(Math.max(d.value, 0), 20) / 20) * chartH;
    return { x, y, data: d };
  });

  // Build SVG path
  const pathD = points.reduce((acc, p, idx) => {
    if (idx === 0) return `M ${p.x} ${p.y}`;
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

  const isSecondary = mode === 'secondary';
  const strokeColor = isSecondary ? '#10B981' : 'var(--accent-hex, #0A84FF)';
  const gradientId = isSecondary ? 'chartGradientSecondary' : 'chartGradientYear';

  const chartTitle =
    mode === 'secondary'
      ? 'Evolução da Média do Secundário (CFC)'
      : mode === 'year'
      ? 'Evolução da Média do Ano (0 a 20)'
      : 'Evolução das Notas (0 a 20)';

  const chartSubtitle =
    mode === 'secondary'
      ? `10º + 11º + 12º ao longo de ${sortedTests.length} testes`
      : mode === 'year'
      ? `Média geral ponderada • ${sortedTests.length} testes`
      : `${subjectFilter || 'Todas as disciplinas'} • ${sortedTests.length} avaliações`;

  return (
    <div
      className={`p-4 rounded-3xl bg-zinc-900/80 backdrop-blur-xl border shadow-ios-card space-y-3 transition-colors ${
        isSecondary ? 'border-emerald-500/25' : 'border-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span
            className={`text-xs font-semibold uppercase tracking-wider block truncate ${
              isSecondary ? 'text-emerald-300' : 'text-zinc-400'
            }`}
          >
            {chartTitle}
          </span>
          <span className="text-[11px] text-zinc-500 block truncate">{chartSubtitle}</span>
        </div>

        <div
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${
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
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Dotted guideline for 17.5 (Excelente) */}
          <line
            x1={paddingX}
            y1={y175}
            x2={width - paddingX}
            y2={y175}
            stroke="#10b981"
            strokeOpacity="0.25"
            strokeDasharray="3,3"
            strokeWidth="1"
          />
          <text
            x={paddingX - 4}
            y={y175 + 3}
            textAnchor="end"
            fill="#10b981"
            fillOpacity="0.5"
            fontSize="8"
            fontWeight="bold"
          >
            18
          </text>

          {/* Dotted guideline for 9.5 (Positive) */}
          <line
            x1={paddingX}
            y1={y95}
            x2={width - paddingX}
            y2={y95}
            stroke="#f59e0b"
            strokeOpacity="0.25"
            strokeDasharray="3,3"
            strokeWidth="1"
          />
          <text
            x={paddingX - 4}
            y={y95 + 3}
            textAnchor="end"
            fill="#f59e0b"
            fillOpacity="0.5"
            fontSize="8"
            fontWeight="bold"
          >
            9.5
          </text>

          {/* Fill Gradient */}
          <path d={fillD} fill={`url(#${gradientId})`} />

          {/* Line Path */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Interactive Dots */}
          {points.map((p, idx) => {
            const isSelected = selectedPoint?.test.id === p.data.test.id;
            return (
              <g
                key={p.data.test.id || idx}
                className="cursor-pointer"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedPoint(p.data);
                }}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 6 : 4}
                  fill={p.data.value >= 9.5 ? '#30D158' : '#FF453A'}
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
        <div
          className={`p-2.5 rounded-2xl bg-zinc-950/90 border flex items-center justify-between text-xs animate-fade-in ${
            isSecondary ? 'border-emerald-500/30' : 'border-blue-500/30'
          }`}
        >
          <div className="min-w-0 pr-2">
            <div className="font-bold text-white truncate max-w-[200px]">
              {selectedPoint.test.title}
            </div>
            <div className="text-[10px] text-zinc-400 flex items-center gap-1 truncate">
              <Calendar className="w-2.5 h-2.5 shrink-0" />
              {new Date(selectedPoint.test.date).toLocaleDateString('pt-PT')} •{' '}
              {selectedPoint.test.subject} ({selectedPoint.test.grade20.toFixed(1)})
            </div>
          </div>
          <div className="text-right shrink-0">
            <span
              className={`text-base font-black ${
                isSecondary ? 'text-emerald-400' : 'text-blue-400'
              }`}
            >
              {selectedPoint.value.toFixed(mode === 'grades' ? 1 : 2)}
            </span>
            <span className="text-[10px] text-zinc-500 block">
              {mode === 'secondary' && selectedPoint.secondaryPoints200 !== undefined
                ? `${selectedPoint.secondaryPoints200.toFixed(1)} pts`
                : '/ 20 val'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
