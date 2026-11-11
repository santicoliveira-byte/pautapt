import React from 'react';
import { UniversityCourse } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  Target,
  MapPin,
  FileCheck,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

interface TargetCourseCardProps {
  course: UniversityCourse | null;
  userScore200: number;
  onOpenSearch: () => void;
  onApplyCourseFormula?: (secWeight: number) => void;
  onClearTarget?: () => void;
}

export const TargetCourseCard: React.FC<TargetCourseCardProps> = ({
  course,
  userScore200,
  onOpenSearch,
  onApplyCourseFormula,
  onClearTarget,
}) => {
  if (!course) {
    return (
      <div
        onClick={onOpenSearch}
        className="cursor-pointer p-4 rounded-3xl bg-zinc-900/60 border border-purple-500/20 hover:border-purple-500/40 flex items-center justify-between ios-pressable transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              Escolher Curso Alvo (DGES)
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Oficial
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Compara a tua média com as notas dos últimos colocados (FMUP, IST, Nova...)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenSearch();
          }}
          className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-1 text-xs font-semibold ios-pressable"
        >
          <span>Explorar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const diff = Number((userScore200 - course.lastCutoff200).toFixed(1));
  const isPassing = diff >= 0;
  const isClose = diff < 0 && diff >= -5.0;

  // Percentage of progress towards cutoff
  const progressPct = Math.min(Math.max((userScore200 / course.lastCutoff200) * 100, 0), 100);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 border border-purple-500/35 shadow-ios-card space-y-3">
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <Target className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
            Curso Alvo Definido
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenSearch}
            className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 px-2 py-0.5 rounded-lg bg-purple-500/10 border border-purple-500/20 ios-pressable"
          >
            Trocar
          </button>
          {onClearTarget && (
            <button
              type="button"
              onClick={onClearTarget}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 px-1.5 py-0.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Course Info */}
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
            {course.shortInstitution}
          </span>
          <span className="text-[10px] text-zinc-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-zinc-500" />
            {course.city}
          </span>
          <span className="text-[10px] text-zinc-500">
            {course.area}
          </span>
        </div>

        <h3 className="text-sm font-bold text-white mt-1 leading-snug">
          {course.name}
        </h3>
        <p className="text-[11px] text-zinc-400 mt-0.5">
          {course.institution}
        </p>
      </div>

      {/* Comparison Metrics */}
      <div className="p-3 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-2.5">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
              Tua Nota Prevista
            </span>
            <span className="text-2xl font-black text-white">
              {userScore200.toFixed(1)}
              <span className="text-xs text-zinc-500 font-semibold ml-0.5">pts</span>
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
              Último Colocado (1ª Fase)
            </span>
            <span className="text-2xl font-black text-purple-400">
              {course.lastCutoff200.toFixed(1)}
              <span className="text-xs text-zinc-500 font-semibold ml-0.5">pts</span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isPassing
                  ? 'bg-emerald-500'
                  : isClose
                  ? 'bg-amber-500'
                  : 'bg-purple-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500">
              {progressPct.toFixed(0)}% da nota necessária
            </span>
            <span
              className={`font-bold ${
                isPassing
                  ? 'text-emerald-400'
                  : isClose
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {isPassing
                ? `🟢 Entrada Provável (+${diff.toFixed(1)} pts de margem)`
                : isClose
                ? `🟡 Competitivo (${diff.toFixed(1)} pts)`
                : `🔴 Faltam ${Math.abs(diff).toFixed(1)} pts`}
            </span>
          </div>
        </div>
      </div>

      {/* Provas & Fast Formula Button */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex items-center gap-1.5 text-zinc-300 text-[11px] truncate mr-2">
          <FileCheck className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span className="truncate" title={course.requiredExams}>
            {course.requiredExams}
          </span>
        </div>

        {onApplyCourseFormula && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onApplyCourseFormula(course.secondaryWeightPct);
            }}
            className="flex-shrink-0 px-2 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px] font-semibold flex items-center gap-1 ios-pressable"
            title="Ajusta o simulador para a ponderação desta universidade"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Aplicar {course.secondaryWeightPct}%/{course.examsWeightPct}%</span>
          </button>
        )}
      </div>
    </div>
  );
};
