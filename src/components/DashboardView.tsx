import React from 'react';
import { SchoolTest, UpcomingEvaluation } from '../types';
import {
  calculateSubjectStats,
  getClassificationBadgeStyle,
  getEffectiveWeight,
  detectEvaluationType,
  EVALUATION_TYPE_CONFIGS,
  formatWeight,
} from '../utils/gradeUtils';
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
} from 'lucide-react';

interface DashboardViewProps {
  tests: SchoolTest[];
  evaluations?: UpcomingEvaluation[];
  onSelectTest: (test: SchoolTest) => void;
  onNewTestClick: () => void;
  onOpenSimulator: () => void;
  onSelectSubject: (subjectName: string) => void;
  onOpenReport?: () => void;
  onOpenAgenda?: () => void;
  onQuickAddEvaluation?: () => void;
  onOpenSecondary?: () => void;
  onOpenExams?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tests,
  evaluations = [],
  onSelectTest,
  onNewTestClick,
  onOpenSimulator,
  onSelectSubject,
  onOpenReport,
  onOpenAgenda,
  onQuickAddEvaluation,
  onOpenSecondary,
  onOpenExams,
}) => {
  const subjectStats = calculateSubjectStats(tests);
  const subjectsList = Object.values(subjectStats);

  // Overall calculations
  const totalTests = tests.length;
  let overallSum = 0;
  let overallWeight = 0;
  let positiveTestsCount = 0;
  let highest = 0;
  let lowest = 20;

  tests.forEach((t) => {
    const w = getEffectiveWeight(t);
    overallSum += t.grade20 * w;
    overallWeight += w;
    if (t.grade20 >= 9.5) positiveTestsCount++;
    if (t.grade20 > highest) highest = t.grade20;
    if (t.grade20 < lowest) lowest = t.grade20;
  });

  const overallAverage =
    overallWeight > 0 ? Number((overallSum / overallWeight).toFixed(2)) : 0;

  const successRate = totalTests > 0 ? (positiveTestsCount / totalTests) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-6 space-y-6 animate-fade-in">
      {/* Hero Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 border border-white/10 shadow-ios-card">
        <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-blue-600/20 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Média Geral Ponderada
            </span>
          </div>
          <span className="text-[11px] text-zinc-400 font-medium px-2 py-0.5 rounded-full bg-zinc-800/80 border border-white/5">
            {totalTests} {totalTests === 1 ? 'teste' : 'testes'}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-white">
              {totalTests > 0 ? overallAverage.toFixed(1) : '--'}
            </span>
            <span className="text-lg font-semibold text-zinc-500">/ 20</span>
          </div>

          <div className="text-right">
            <div className="text-xs font-semibold text-emerald-400">
              {totalTests > 0 ? `${successRate.toFixed(0)}% Positivas` : 'Sem dados'}
            </div>
            <div className="text-[11px] text-zinc-500">
              {positiveTestsCount} de {totalTests} aprovados
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
          <div className="p-2 rounded-2xl bg-zinc-950/60 border border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
              Disciplinas
            </span>
            <span className="text-sm font-bold text-zinc-200">
              {subjectsList.length}
            </span>
          </div>
          <div className="p-2 rounded-2xl bg-zinc-950/60 border border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
              Melhor Nota
            </span>
            <span className="text-sm font-bold text-emerald-400">
              {totalTests > 0 ? highest.toFixed(1) : '--'}
            </span>
          </div>
          <div className="p-2 rounded-2xl bg-zinc-950/60 border border-white/5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
              Menor Nota
            </span>
            <span className="text-sm font-bold text-amber-400">
              {totalTests > 0 ? lowest.toFixed(1) : '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Evolution Chart (when >= 2 tests exist) */}
      {totalTests >= 2 && <EvolutionChart tests={tests} />}

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

        {/* Quick Tools Row (PDF Report & Agenda sync) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
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
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
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
            className="cursor-pointer p-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/20 flex items-center gap-2.5 ios-pressable transition-all col-span-2 sm:col-span-1"
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
                      <h4 className="text-sm font-semibold text-white">{stat.name}</h4>
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

              return (
                <div
                  key={test.id}
                  onClick={() => onSelectTest(test)}
                  className="p-3.5 rounded-2xl bg-zinc-900/80 backdrop-blur-md border border-white/5 hover:border-white/10 cursor-pointer flex items-center justify-between ios-pressable transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl ${badge.bg} ${badge.text} flex flex-col items-center justify-center border ${badge.border}`}
                    >
                      <span className="font-bold text-sm leading-none">
                        {test.grade20.toFixed(1)}
                      </span>
                      <span className="text-[9px] uppercase font-semibold text-zinc-400 mt-0.5">
                        / 20
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
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
                      <h4 className="text-xs font-medium text-white truncate max-w-[200px]">
                        {test.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1.5">
                        <span>{test.obtainedPoints} / {test.totalScale} pts ({test.percentage.toFixed(0)}%)</span>
                        <span>•</span>
                        <span className="text-blue-400 font-semibold">Peso: {formatWeight(test.weight)}</span>
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
