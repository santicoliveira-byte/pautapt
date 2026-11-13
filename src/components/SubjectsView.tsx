import React, { useState } from 'react';
import { SchoolTest } from '../types';
import {
  calculateSubjectStats,
  getClassificationBadgeStyle,
  detectEvaluationType,
  EVALUATION_TYPE_CONFIGS,
  formatWeight,
} from '../utils/gradeUtils';
import {
  BookOpen,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from 'lucide-react';

interface SubjectsViewProps {
  tests: SchoolTest[];
  onSelectTest: (test: SchoolTest) => void;
  onNewTestForSubject: (subjectName: string) => void;
  onSimulateForSubject: (subjectName: string) => void;
  onDeleteTest: (testId: string) => void;
  onScheduleForSubject?: (subjectName: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  tests,
  onSelectTest,
  onNewTestForSubject,
  onSimulateForSubject,
  onDeleteTest,
  onScheduleForSubject,
}) => {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const subjectStats = calculateSubjectStats(tests);
  const subjects = Object.values(subjectStats);

  const toggleExpand = (name: string) => {
    setExpandedSubject(expandedSubject === name ? null : name);
  };

  if (subjects.length === 0) {
    return (
      <div className="max-w-md mx-auto pb-28 pt-10 px-4 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto text-zinc-500">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-white">Nenhuma disciplina registada</h3>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          Ao adicionares testes no separador "Novo Teste", as disciplinas aparecerão aqui automaticamente com as respetivas médias ponderadas.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-28 pt-2 px-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Disciplinas</h2>
          <p className="text-xs text-zinc-400">
            Acompanha o desempenho e as médias ponderadas por matéria
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300">
          {subjects.length} ativas
        </span>
      </div>

      <div className="space-y-3">
        {subjects.map((stat) => {
          const isExpanded = expandedSubject === stat.name;
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
              className="rounded-3xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 overflow-hidden shadow-ios-card transition-all"
            >
              {/* Header / Clickable Card */}
              <div
                onClick={() => toggleExpand(stat.name)}
                className="p-4 cursor-pointer flex items-center justify-between ios-pressable"
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl ${badge.bg} ${badge.text} border ${badge.border} flex flex-col items-center justify-center font-bold`}
                  >
                    <span className="text-base leading-none">
                      {stat.weightedAverage.toFixed(1)}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 mt-0.5">
                      / 20
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{stat.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                      <span>{stat.count} {stat.count === 1 ? 'teste' : 'testes'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSimulateForSubject(stat.name);
                    }}
                    title="Simular nota necessária no próximo teste"
                    className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 ios-pressable transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <div className="text-zinc-500">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Progress bar to 20 */}
              <div className="px-4 pb-1">
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      stat.weightedAverage >= 17.5
                        ? 'bg-emerald-400'
                        : stat.weightedAverage >= 13.5
                        ? 'bg-blue-500'
                        : stat.weightedAverage >= 9.5
                        ? 'bg-amber-400'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${(stat.weightedAverage / 20) * 100}%` }}
                  />
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="p-4 pt-3 bg-zinc-950/60 border-t border-white/5 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                    <span>Melhor: <strong className="text-emerald-400">{stat.highestGrade.toFixed(1)}</strong></span>
                    <span>Mínima: <strong className="text-amber-400">{stat.lowestGrade.toFixed(1)}</strong></span>
                    <span>Média Simples: <strong className="text-zinc-200">{stat.simpleAverage.toFixed(1)}</strong></span>
                  </div>

                  {/* List of tests for this subject */}
                  <div className="space-y-2">
                    {stat.tests.map((test) => {
                      const detectedType = test.type || detectEvaluationType(test.title);
                      const typeCfg = EVALUATION_TYPE_CONFIGS[detectedType];
                      const impactPct = stat.totalWeight > 0 ? ((test.weight / stat.totalWeight) * 100).toFixed(0) : '0';

                      return (
                        <div
                          key={test.id}
                          onClick={() => onSelectTest(test)}
                          className="p-2.5 rounded-2xl bg-zinc-900 border border-white/5 hover:border-white/10 flex items-center justify-between cursor-pointer ios-pressable"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 text-center text-xs font-bold text-blue-400">
                              {test.grade20.toFixed(1)}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-medium text-white truncate max-w-[170px]">
                                  {test.title}
                                </p>
                                <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${typeCfg.badgeClass.bg} ${typeCfg.badgeClass.text} ${typeCfg.badgeClass.border}`}>
                                  {typeCfg.shortLabel}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {new Date(test.date).toLocaleDateString('pt-PT')}
                                </span>
                                <span>•</span>
                                <span className="text-zinc-400 font-medium">
                                  Peso: {formatWeight(test.weight)} ({impactPct}% da média)
                                </span>
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Eliminar este teste da caderneta?')) {
                                onDeleteTest(test.id);
                              }
                            }}
                            className="p-1.5 text-zinc-500 hover:text-red-400 ios-pressable transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Action: Add new test for this subject */}
                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onNewTestForSubject(stat.name)}
                      className="flex-1 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium flex items-center justify-center gap-1.5 ios-pressable"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Novo Teste</span>
                    </button>

                    {onScheduleForSubject && (
                      <button
                        type="button"
                        onClick={() => onScheduleForSubject(stat.name)}
                        className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 text-xs font-medium flex items-center justify-center gap-1.5 ios-pressable"
                      >
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>Agendar</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
