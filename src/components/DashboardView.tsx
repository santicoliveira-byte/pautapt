import React, { useState } from 'react';
import { SchoolTest, SubjectCriteriaMap, UpcomingEvaluation } from '../types';
import { triggerHaptic } from '../utils/haptics';
import {
  calculateSubjectStats,
  getClassificationBadgeStyle,
  detectEvaluationType,
  EVALUATION_TYPE_CONFIGS,
  formatWeight,
  getSubjectDurationWeight,
  getSubjectCriteriaEntry,
  getTestCriterionIds,
} from '../utils/gradeUtils';
import { computeLiveSecondarySummary } from '../utils/secondaryUtils';
import { EvolutionChart } from './EvolutionChart';
import { UpcomingCountdownHero } from './UpcomingCountdownHero';
import {
  Award,
  BookOpen,
  Calendar,
  Sparkles,
  ChevronRight,
  PlusCircle,
  Clock,
  ArrowUpRight,
  Printer,
  GraduationCap,
  Target,
  Sliders,
} from 'lucide-react';

interface DashboardViewProps {
  tests: SchoolTest[];
  evaluations?: UpcomingEvaluation[];
  subjectCriteria?: SubjectCriteriaMap;
  onSelectTest: (test: SchoolTest) => void;
  onNewTestClick: () => void;
  onOpenSimulator: () => void;
  onSelectSubject: (subjectName: string) => void;
  onOpenSubjects?: () => void;
  onOpenReport?: () => void;
  onOpenAgenda?: () => void;
  onQuickAddEvaluation?: () => void;
  onOpenSecondary?: () => void;
  onOpenExams?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tests,
  evaluations = [],
  subjectCriteria = {},
  onSelectTest,
  onNewTestClick,
  onOpenSimulator,
  onSelectSubject,
  onOpenSubjects,
  onOpenReport,
  onOpenAgenda,
  onQuickAddEvaluation,
  onOpenSecondary,
  onOpenExams,
}) => {
  const subjectStats = calculateSubjectStats(tests, subjectCriteria);
  const subjectsList = Object.values(subjectStats);

  // Overall calculations (respecting each subject's criteria & duration weights)
  const totalTests = tests.length;
  let positiveTestsCount = 0;
  let highest = 0;
  let lowest = 20;

  tests.forEach((t) => {
    if (t.grade20 >= 9.5) positiveTestsCount++;
    if (t.grade20 > highest) highest = t.grade20;
    if (t.grade20 < lowest) lowest = t.grade20;
  });

  const totalSubjectWeight = subjectsList.reduce(
    (acc, curr) => acc + getSubjectDurationWeight(curr.name),
    0
  );
  const weightedSubjectSum = subjectsList.reduce(
    (acc, curr) => acc + curr.weightedAverage * getSubjectDurationWeight(curr.name),
    0
  );
  const overallAverage =
    totalSubjectWeight > 0 ? Number((weightedSubjectSum / totalSubjectWeight).toFixed(2)) : 0;

  const successRate = totalTests > 0 ? (positiveTestsCount / totalTests) * 100 : 0;
  const liveSecondary = computeLiveSecondarySummary(tests, subjectCriteria);
  const [activeChartMode, setActiveChartMode] = useState<'year' | 'secondary'>('year');

  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-6 space-y-6 animate-fade-in">
      {/* Side-by-side Live Overview Cards: Média do Ano + Média do Secundário (Ao Vivo) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 items-stretch">
        {/* Square 1: Média do Ano */}
        <div
          onClick={() => {
            triggerHaptic('light');
            setActiveChartMode('year');
          }}
          className={`cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-3.5 sm:p-5 border shadow-ios-card flex flex-col justify-between ios-pressable transition-all ${
            activeChartMode === 'year'
              ? 'border-blue-500/50 ring-2 ring-blue-500/30'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-1 mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400 truncate">
                  Média do Ano
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-zinc-400 font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-zinc-800/80 border border-white/5 shrink-0">
                {totalTests} {totalTests === 1 ? 'teste' : 'testes'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-3 sm:mb-4">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  {totalTests > 0 ? overallAverage.toFixed(1) : '--'}
                </span>
                <span className="text-xs sm:text-lg font-semibold text-zinc-500">/ 20</span>
              </div>

              <div className="sm:text-right">
                <div className="text-[11px] sm:text-xs font-semibold text-emerald-400">
                  {totalTests > 0 ? `${successRate.toFixed(0)}% Positivas` : 'Sem dados'}
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500">
                  {positiveTestsCount} de {totalTests} aprov.
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2 pt-2.5 sm:pt-3 border-t border-white/10 text-center">
            <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-zinc-950/60 border border-white/5">
              <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider block truncate">
                Disc.
              </span>
              <span className="text-xs sm:text-sm font-bold text-zinc-200">
                {subjectsList.length}
              </span>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-zinc-950/60 border border-white/5">
              <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider block truncate">
                Máx
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-400">
                {totalTests > 0 ? highest.toFixed(1) : '--'}
              </span>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-zinc-950/60 border border-white/5">
              <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider block truncate">
                Mín
              </span>
              <span className="text-xs sm:text-sm font-bold text-amber-400">
                {totalTests > 0 ? lowest.toFixed(1) : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Square 2: Média do Secundário (Ao Vivo) */}
        <div
          onClick={() => {
            triggerHaptic('light');
            setActiveChartMode('secondary');
          }}
          className={`cursor-pointer group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/35 via-zinc-900/95 to-zinc-950 p-3.5 sm:p-5 border shadow-ios-card flex flex-col justify-between ios-pressable transition-all ${
            activeChartMode === 'secondary'
              ? 'border-emerald-500/60 ring-2 ring-emerald-500/35'
              : 'border-emerald-500/25 hover:border-emerald-500/50'
          }`}
        >
          <div className="absolute -top-14 -right-14 w-36 h-36 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between gap-1 mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-300 truncate">
                  Secundário
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                {liveSecondary.cfcWeightMode === 'duration' ? '3:2:1' : 'Simples'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-3 sm:mb-4">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                  {liveSecondary.evaluatedCount > 0 ? liveSecondary.finalCFC.toFixed(2) : '--'}
                </span>
                <span className="text-xs sm:text-lg font-semibold text-zinc-500">/ 20</span>
              </div>

              <div className="sm:text-right">
                <div className="text-[11px] sm:text-xs font-bold text-blue-400">
                  {liveSecondary.evaluatedCount > 0
                    ? `${liveSecondary.finalCFCPoints200.toFixed(1)} pts`
                    : 'Sem dados'}
                </div>
                <div className="text-[10px] sm:text-[11px] text-zinc-500">
                  Ao vivo • 10º+11º+12º
                </div>
              </div>
            </div>
          </div>

          {/* Live Sync Info & Link */}
          <div className="pt-2.5 sm:pt-3 border-t border-white/10 space-y-1.5">
            {liveSecondary.hasAnyMelhoria && liveSecondary.cfcMelhoriaGain > 0 ? (
              <div className="px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-semibold truncate text-center">
                ✨ +{liveSecondary.cfcMelhoriaGain.toFixed(2)} melhoria exame
              </div>
            ) : (
              <div className="px-2 py-1 rounded-xl bg-zinc-950/60 border border-white/5 text-[10px] text-zinc-400 truncate text-center">
                {liveSecondary.synced12thCount > 0
                  ? `${liveSecondary.synced12thCount} disc. 12º ligadas`
                  : 'Atualiza com novos testes'}
              </div>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                triggerHaptic('light');
                (onOpenSecondary || onOpenSimulator)();
              }}
              className="w-full flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-0.5 py-0.5 rounded-lg ios-pressable transition-colors"
            >
              <span className="truncate">Editar 10º / 11º / Exames</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Evolution Chart (when >= 2 tests exist) */}
      {totalTests >= 2 && (
        <EvolutionChart
          tests={tests}
          mode={activeChartMode}
          subjectCriteria={subjectCriteria}
        />
      )}

      {/* Upcoming Evaluations Agenda Hero Widget */}
      {onOpenAgenda && (
        <UpcomingCountdownHero
          evaluations={evaluations}
          onOpenAgendaModal={onOpenAgenda}
          onQuickAdd={onQuickAddEvaluation || onOpenAgenda}
        />
      )}

      {/* Feature Discovery Bento Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Ferramentas Oficiais e Simuladores
          </h3>
          <span className="text-[11px] text-zinc-500">Secundário & DGES</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card 1: Média Secundário 3:2:1 e Melhoria */}
          <div
            onClick={onOpenSecondary || onOpenSimulator}
            className="group cursor-pointer p-4 rounded-3xl bg-gradient-to-br from-blue-950/40 via-zinc-900 to-zinc-950 border border-blue-500/25 hover:border-blue-500/50 flex flex-col justify-between ios-pressable transition-all shadow-md hover:shadow-blue-500/10"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Ponderação 3:2:1
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Melhoria Exame
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Média do Secundário (CFC Oficial)
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Pondera trienais (x3), bienais (x2) e anuais (x1). Se a tua nota de exame for superior à CFD, substitui automaticamente a média da disciplina.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-blue-400 font-semibold">
              <span>Abrir tabela do 10º, 11º e 12º</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Card 2: Que nota preciso no Exame? (Simulador Inverso) */}
          <div
            onClick={onOpenExams || onOpenSimulator}
            className="group cursor-pointer p-4 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 border border-indigo-500/25 hover:border-indigo-500/50 flex flex-col justify-between ios-pressable transition-all shadow-md hover:shadow-indigo-500/10"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105 transition-transform">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Cálculo Inverso
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Corte DGES
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Que Nota Preciso no Exame?
                  <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Pesquisa o teu curso universitário de sonho. O simulador calcula exatamente a nota mínima que precisas tirar no exame para ultrapassar a nota do último colocado.
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
              <span>Simular nota de exame necessária</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Quick Tools Row (Critérios, PDF Report, Agenda sync) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {onOpenSubjects && (
            <div
              onClick={onOpenSubjects}
              className="cursor-pointer p-3 rounded-2xl bg-zinc-900/90 border border-blue-500/20 hover:border-blue-500/40 flex items-center gap-2.5 ios-pressable transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h5 className="text-xs font-semibold text-white truncate">Critérios %</h5>
                <p className="text-[10px] text-zinc-400">Domínios / Disciplina</p>
              </div>
            </div>
          )}

          {onOpenAgenda && (
            <div
              onClick={onOpenAgenda}
              className="cursor-pointer p-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 flex items-center gap-2.5 ios-pressable transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h5 className="text-xs font-semibold text-white truncate">Agenda & .ICS</h5>
                <p className="text-[10px] text-zinc-400">Google Calendar</p>
              </div>
            </div>
          )}

          {onOpenReport && totalTests > 0 && (
            <div
              onClick={onOpenReport}
              className="cursor-pointer p-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 flex items-center gap-2.5 ios-pressable transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Printer className="w-4 h-4" />
              </div>
              <div className="truncate">
                <h5 className="text-xs font-semibold text-white truncate">Pauta PDF</h5>
                <p className="text-[10px] text-zinc-400">Boletim oficial</p>
              </div>
            </div>
          )}

          <div
            onClick={onOpenSimulator}
            className="cursor-pointer p-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 flex items-center gap-2.5 ios-pressable transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h5 className="text-xs font-semibold text-white truncate">Simulador de Teste</h5>
              <p className="text-[10px] text-zinc-400">Meta por disciplina</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disciplinas em Destaque */}
      {subjectsList.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              Médias por Disciplina
            </h3>
            <span className="text-[11px] text-zinc-500">Ponderada</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {subjectsList.map((stat) => {
              const badge = getClassificationBadgeStyle(
                stat.weightedAverage >= 17.5
                  ? 'excelente'
                  : stat.weightedAverage >= 13.5
                  ? 'bom'
                  : stat.weightedAverage >= 9.5
                  ? 'suficiente'
                  : 'insuficiente'
              );

              return (
                <div
                  key={stat.name}
                  onClick={() => onSelectSubject(stat.name)}
                  className="p-3.5 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-white/5 hover:border-white/10 cursor-pointer flex items-center justify-between ios-pressable transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl ${badge.bg} ${badge.text} flex items-center justify-center font-bold text-base border ${badge.border}`}
                    >
                      {stat.weightedAverage.toFixed(1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-semibold text-white">{stat.name}</h4>
                        {stat.usedCriteria && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">
                            Critérios %
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {stat.count} {stat.count === 1 ? 'teste registado' : 'testes'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Tests Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            Histórico de Testes Recentes
          </h3>
          <span className="text-[11px] text-zinc-500">Últimos registos</span>
        </div>

        {tests.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-3xl bg-zinc-900/50 border border-white/5 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-400 mx-auto flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">Nenhum teste registado</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Clica no botão abaixo para calcular o teu primeiro teste com cotações e escala de 0 a 20.
              </p>
            </div>
            <button
              onClick={onNewTestClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-ios-glow-blue ios-pressable"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Calcular Primeiro Teste</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {tests.map((test) => {
              const badge = getClassificationBadgeStyle(test.classification);
              const formattedDate = new Date(test.date).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: 'short',
              });
              const evalType = test.type || detectEvaluationType(test.title);
              const typeCfg = EVALUATION_TYPE_CONFIGS[evalType];
              const { criteria: subjCriteria } = getSubjectCriteriaEntry(
                subjectCriteria,
                test.subject
              );
              const presentCriterionIds =
                subjCriteria.length > 0 ? getTestCriterionIds(test, subjCriteria) : [];

              return (
                <div
                  key={test.id}
                  onClick={() => onSelectTest(test)}
                  className="p-3.5 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-white/5 hover:border-white/10 cursor-pointer flex items-center justify-between ios-pressable transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl shrink-0 ${badge.bg} ${badge.text} flex flex-col items-center justify-center border ${badge.border}`}
                    >
                      <span className="font-bold text-sm leading-none">
                        {test.grade20.toFixed(1)}
                      </span>
                      <span className="text-[9px] uppercase font-semibold text-zinc-400 mt-0.5">
                        / 20
                      </span>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-200">
                          {test.subject}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${typeCfg.badgeClass.bg} ${typeCfg.badgeClass.text} ${typeCfg.badgeClass.border}`}>
                          {typeCfg.shortLabel}
                        </span>
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {formattedDate}
                        </span>
                      </div>
                      <h4 className="text-xs font-medium text-white truncate max-w-[220px]">
                        {test.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 flex-wrap">
                        <span>{test.obtainedPoints} / {test.totalScale} pts ({test.percentage.toFixed(0)}%)</span>
                        <span>•</span>
                        <span className="text-blue-400 font-semibold">Peso: {formatWeight(test.weight)}</span>
                      </p>
                      {presentCriterionIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {presentCriterionIds.map((cid) => {
                            const crit = subjCriteria.find((c) => c.id === cid);
                            if (!crit) return null;
                            return (
                              <span
                                key={cid}
                                className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20"
                              >
                                {crit.name} ({crit.percentage}%)
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
