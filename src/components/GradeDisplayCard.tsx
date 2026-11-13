import React from 'react';
import { getClassification, getClassificationBadgeStyle, getClassificationLabel, formatWeight } from '../utils/gradeUtils';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface GradeDisplayCardProps {
  obtainedPoints: number;
  totalScale: number;
  grade20: number;
  weight?: number;
  subject?: string;
  isCompact?: boolean;
}

export const GradeDisplayCard: React.FC<GradeDisplayCardProps> = ({
  obtainedPoints,
  totalScale,
  grade20,
  weight,
  subject,
  isCompact = false,
}) => {
  const classification = getClassification(grade20);
  const badgeStyle = getClassificationBadgeStyle(classification);
  const percentage = totalScale > 0 ? Math.min(100, Math.max(0, (obtainedPoints / totalScale) * 100)) : 0;

  const getStatusIcon = () => {
    switch (classification) {
      case 'excelente':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'bom':
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      case 'suficiente':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'insuficiente':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  if (isCompact) {
    return (
      <div className={`p-3.5 rounded-2xl bg-zinc-900/90 border ${badgeStyle.border} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${badgeStyle.bg} flex items-center justify-center font-bold text-lg ${badgeStyle.text}`}>
            {grade20.toFixed(1)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">{subject || 'Nota Calculada'}</span>
            </div>
            <span className="text-xs text-zinc-400">
              {obtainedPoints} de {totalScale} pts ({percentage.toFixed(0)}%)
            </span>
          </div>
        </div>
        <div className={`text-xs px-2.5 py-1 rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border} font-medium`}>
          {grade20 >= 9.5 ? 'Positiva' : 'Negativa'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/95 to-zinc-950 p-5 border ${badgeStyle.border} ${badgeStyle.glow} transition-all duration-300`}
    >
      {/* Background ambient gradient glow */}
      <div
        className={`absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none ${badgeStyle.dot}`}
      />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Escala Oficial Portugal (0 a 20)
          </span>
        </div>
        {weight !== undefined && weight > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-white/5">
            Peso: {formatWeight(weight)}
          </span>
        )}
      </div>

      {/* Main Score Display */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-black tracking-tight ${badgeStyle.text}`}>
            {grade20.toFixed(1)}
          </span>
          <span className="text-xl font-semibold text-zinc-500">/ 20 valores</span>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-white tracking-tight">
            {percentage.toFixed(1)}%
          </div>
          <div className="text-xs text-zinc-400">
            {obtainedPoints} / {totalScale} pts
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 mb-3">
        <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              classification === 'insuficiente'
                ? 'bg-red-500'
                : classification === 'suficiente'
                ? 'bg-amber-400'
                : classification === 'bom'
                ? 'bg-blue-500'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1.5 px-0.5">
          <span>0 (Mínimo)</span>
          <span className="text-zinc-400 font-medium">9.5 (Aprovação)</span>
          <span>20 (Máximo)</span>
        </div>
      </div>

      {/* Qualitative Classification Badge */}
      <div className="pt-2 flex items-center justify-between border-t border-white/5">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
          <span className={`text-xs font-medium ${badgeStyle.text}`}>
            {getClassificationLabel(classification)}
          </span>
        </div>
        <span className="text-[11px] text-zinc-500 font-mono">
          {grade20 >= 9.5 ? '✓ Aprovado no teste' : '⚠ Requer recuperação'}
        </span>
      </div>
    </div>
  );
};
