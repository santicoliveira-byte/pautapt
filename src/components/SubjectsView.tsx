import React, { useState } from 'react';
import {
  SchoolTest,
  SubjectCriteriaMap,
  SubjectCriterionDomain,
  SubjectStats,
} from '../types';
import {
  calculateSubjectStats,
  getClassificationBadgeStyle,
  detectEvaluationType,
  EVALUATION_TYPE_CONFIGS,
  formatWeight,
  getSubjectCriteriaEntry,
  getTestCriterionIds,
  normalizeSubjectKey,
} from '../utils/gradeUtils';
import { SubjectCriteriaModal } from './SubjectCriteriaModal';
import {
  BookOpen,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Sliders,
  AlertCircle,
} from 'lucide-react';

interface SubjectsViewProps {
  tests: SchoolTest[];
  subjectCriteria?: SubjectCriteriaMap;
  onSaveSubjectCriteria?: (subjectName: string, criteria: SubjectCriterionDomain[]) => void;
  onSelectTest: (test: SchoolTest) => void;
  onNewTestForSubject: (subjectName: string) => void;
  onSimulateForSubject: (subjectName: string) => void;
  onDeleteTest: (testId: string) => void;
  onScheduleForSubject?: (subjectName: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  tests,
  subjectCriteria = {},
  onSaveSubjectCriteria,
  onSelectTest,
  onNewTestForSubject,
  onSimulateForSubject,
  onDeleteTest,
  onScheduleForSubject,
}) => {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [criteriaModal, setCriteriaModal] = useState<{
    isOpen: boolean;
    subjectName: string;
    allowSubjectSelection: boolean;
  }>({
    isOpen: false,
    subjectName: '',
    allowSubjectSelection: false,
  });

  const subjectStats = calculateSubjectStats(tests, subjectCriteria);

  // Merge subjects with tests AND subjects that already have criteria configured (even with 0 tests)
  const displaySubjects: SubjectStats[] = [...Object.values(subjectStats)];
  const existingNormalized = new Set(displaySubjects.map((s) => normalizeSubjectKey(s.name)));

  Object.entries(subjectCriteria).forEach(([subjName, criteria]) => {
    if (criteria.length > 0 && !existingNormalized.has(normalizeSubjectKey(subjName))) {
      displaySubjects.push({
        name: subjName,
        count: 0,
        simpleAverage: 0,
        weightedAverage: 0,
        highestGrade: 0,
        lowestGrade: 0,
        totalWeight: 0,
        tests: [],
        usedCriteria: false,
        criteriaStats: criteria.map((c) => ({
          criterionId: c.id,
          name: c.name,
          percentage: c.percentage,
          average: null,
          testCount: 0,
        })),
        evaluatedCriteriaPct: 0,
        totalCriteriaPct: criteria.reduce((sum, c) => sum + (Number(c.percentage) || 0), 0),
        untaggedTestCount: 0,
      });
    }
  });

  const toggleExpand = (name: string) => {
    setExpandedSubject(expandedSubject === name ? null : name);
  };

  const openCriteriaModal = (subjectName: string, allowSubjectSelection = false) => {
    setCriteriaModal({
      isOpen: true,
      subjectName,
      allowSubjectSelection,
    });
  };

  const handleSaveCriteria = (subj: string, criteria: SubjectCriterionDomain[]) => {
    if (onSaveSubjectCriteria) {
      onSaveSubjectCriteria(subj, criteria);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-28 pt-2 px-3 sm:px-6 space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Disciplinas & Critérios</h2>
          <p className="text-xs text-zinc-400">
            Define a % de cada domínio (critérios de avaliação) e acompanha as médias
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 text-zinc-300">
            {displaySubjects.length} {displaySubjects.length === 1 ? 'ativa' : 'ativas'}
          </span>
          {onSaveSubjectCriteria && (
            <button
              type="button"
              onClick={() => openCriteriaModal('Matemática A', true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-ios-glow-blue ios-pressable transition-all"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configurar Critérios</span>
            </button>
          )}
        </div>
      </div>

      {displaySubjects.length === 0 ? (
        <div className="py-12 px-5 rounded-3xl bg-zinc-900/60 border border-white/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto text-blue-400">
            <BookOpen className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Nenhuma disciplina registada</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Podes configurar já as percentagens dos critérios de avaliação de cada disciplina, ou lançar um teste no botão "+ Novo Teste".
            </p>
          </div>
          {onSaveSubjectCriteria && (
            <button
              type="button"
              onClick={() => openCriteriaModal('Matemática A', true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-ios-glow-blue ios-pressable"
            >
              <Sliders className="w-4 h-4" />
              <span>Definir Critérios por Domínio (%)</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displaySubjects.map((stat) => {
            const isExpanded = expandedSubject === stat.name;
            const hasTests = stat.count > 0;
            const badge = getClassificationBadgeStyle(
              !hasTests
                ? 'bom'
                : stat.weightedAverage >= 17.5
                ? 'excelente'
                : stat.weightedAverage >= 13.5
                ? 'bom'
                : stat.weightedAverage >= 9.5
                ? 'suficiente'
                : 'insuficiente'
            );

            const { criteria: subjCriteria } = getSubjectCriteriaEntry(subjectCriteria, stat.name);
            const hasCriteria = subjCriteria.length > 0;

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
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-2xl shrink-0 ${
                        hasTests
                          ? `${badge.bg} ${badge.text} border ${badge.border}`
                          : 'bg-zinc-800/70 text-zinc-400 border border-white/10'
                      } flex flex-col items-center justify-center font-bold`}
                    >
                      <span className="text-base leading-none">
                        {hasTests ? stat.weightedAverage.toFixed(1) : '--'}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-400 mt-0.5">
                        / 20
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-white truncate">{stat.name}</h3>
                        {hasCriteria && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">
                            {subjCriteria.length} domínios
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400 flex-wrap">
                        <span>
                          {stat.count} {stat.count === 1 ? 'teste' : 'testes'}
                        </span>
                        {stat.usedCriteria && (
                          <span className="text-emerald-400/90 font-medium">
                            • Média por critérios
                          </span>
                        )}
                        {(stat.untaggedTestCount || 0) > 0 && (
                          <span className="text-amber-400 font-medium">
                            • {stat.untaggedTestCount} sem domínios
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onSaveSubjectCriteria && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCriteriaModal(stat.name, false);
                        }}
                        title="Configurar percentagens dos domínios (Critérios de Avaliação)"
                        className="p-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 ios-pressable transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {hasTests && (
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
                    )}

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
                        !hasTests
                          ? 'bg-zinc-700'
                          : stat.weightedAverage >= 17.5
                          ? 'bg-emerald-400'
                          : stat.weightedAverage >= 13.5
                          ? 'bg-blue-500'
                          : stat.weightedAverage >= 9.5
                          ? 'bg-amber-400'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${hasTests ? (stat.weightedAverage / 20) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="p-4 pt-3 bg-zinc-950/60 border-t border-white/5 space-y-4 animate-fade-in">
                    {/* Summary stats when tests exist */}
                    {hasTests && (
                      <div className="flex items-center justify-between text-xs text-zinc-400 pb-1">
                        <span>
                          Melhor: <strong className="text-emerald-400">{stat.highestGrade.toFixed(1)}</strong>
                        </span>
                        <span>
                          Mínima: <strong className="text-amber-400">{stat.lowestGrade.toFixed(1)}</strong>
                        </span>
                        <span>
                          Média Simples: <strong className="text-zinc-200">{stat.simpleAverage.toFixed(1)}</strong>
                        </span>
                      </div>
                    )}

                    {/* Critérios de Avaliação Section */}
                    <div className="p-3 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-blue-400" />
                          Critérios de Avaliação (Domínios)
                        </span>
                        {onSaveSubjectCriteria && (
                          <button
                            type="button"
                            onClick={() => openCriteriaModal(stat.name, false)}
                            className="text-[11px] font-semibold text-blue-400 hover:underline"
                          >
                            {hasCriteria ? 'Editar %' : '+ Configurar %'}
                          </button>
                        )}
                      </div>

                      {hasCriteria && stat.criteriaStats ? (
                        <div className="space-y-2">
                          {stat.criteriaStats.map((cs) => (
                            <div
                              key={cs.criterionId}
                              className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                                    {cs.percentage}%
                                  </span>
                                  <span className="font-semibold text-white truncate">{cs.name}</span>
                                </div>
                                <div className="shrink-0 text-right">
                                  {cs.average !== null ? (
                                    <span className="font-bold text-emerald-400">
                                      {cs.average.toFixed(1)}{' '}
                                      <span className="text-[10px] font-normal text-zinc-500">val</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-zinc-500 italic">
                                      Por avaliar
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{
                                      width: `${cs.average !== null ? (cs.average / 20) * 100 : 0}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[10px] text-zinc-500 shrink-0">
                                  {cs.testCount} {cs.testCount === 1 ? 'aval.' : 'avals.'}
                                </span>
                              </div>
                            </div>
                          ))}

                          {stat.evaluatedCriteriaPct !== undefined &&
                            stat.totalCriteriaPct !== undefined &&
                            stat.evaluatedCriteriaPct > 0 &&
                            stat.evaluatedCriteriaPct < stat.totalCriteriaPct && (
                              <p className="text-[10px] text-zinc-400 px-1">
                                A média atual considera {stat.evaluatedCriteriaPct}% dos critérios já avaliados (de {stat.totalCriteriaPct}% totais).
                              </p>
                            )}

                          {(stat.untaggedTestCount || 0) > 0 && (
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-start gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>
                                Tens {stat.untaggedTestCount}{' '}
                                {stat.untaggedTestCount === 1 ? 'teste' : 'testes'} sem domínios selecionados. Toca num teste abaixo para indicar que domínios estiveram presentes.
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openCriteriaModal(stat.name, false)}
                          className="w-full py-2.5 px-3 rounded-xl bg-zinc-950/60 hover:bg-zinc-950 border border-dashed border-white/15 text-xs text-zinc-400 hover:text-blue-400 transition-colors"
                        >
                          + Definir percentagens por domínio para {stat.name}
                        </button>
                      )}
                    </div>

                    {/* List of tests for this subject */}
                    {hasTests && (
                      <div className="space-y-2">
                        {stat.tests.map((test) => {
                          const detectedType = test.type || detectEvaluationType(test.title);
                          const typeCfg = EVALUATION_TYPE_CONFIGS[detectedType];
                          const impactPct =
                            stat.totalWeight > 0
                              ? ((test.weight / stat.totalWeight) * 100).toFixed(0)
                              : '0';
                          const presentCriterionIds = hasCriteria
                            ? getTestCriterionIds(test, subjCriteria)
                            : [];

                          return (
                            <div
                              key={test.id}
                              onClick={() => onSelectTest(test)}
                              className="p-2.5 rounded-2xl bg-zinc-900 border border-white/5 hover:border-white/10 flex items-center justify-between cursor-pointer ios-pressable"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-8 text-center text-xs font-bold text-blue-400 shrink-0">
                                  {test.grade20.toFixed(1)}
                                </span>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="text-xs font-medium text-white truncate max-w-[190px]">
                                      {test.title}
                                    </p>
                                    <span
                                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${typeCfg.badgeClass.bg} ${typeCfg.badgeClass.text} ${typeCfg.badgeClass.border}`}
                                    >
                                      {typeCfg.shortLabel}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-2.5 h-2.5" />
                                      {new Date(test.date).toLocaleDateString('pt-PT')}
                                    </span>
                                    <span>•</span>
                                    <span className="text-zinc-400 font-medium">
                                      Peso: {formatWeight(test.weight)}
                                      {!stat.usedCriteria ? ` (${impactPct}% da média)` : ''}
                                    </span>
                                  </p>
                                  {hasCriteria && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {presentCriterionIds.length > 0 ? (
                                        presentCriterionIds.map((cid) => {
                                          const crit = subjCriteria.find((c) => c.id === cid);
                                          if (!crit) return null;
                                          return (
                                            <span
                                              key={cid}
                                              className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                            >
                                              {crit.name} ({crit.percentage}%)
                                            </span>
                                          );
                                        })
                                      ) : (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                          Sem domínios indicados
                                        </span>
                                      )}
                                    </div>
                                  )}
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
                                className="p-1.5 text-zinc-500 hover:text-red-400 ios-pressable transition-colors shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Action: Add new test for this subject */}
                    <div className="pt-1 flex gap-2">
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
      )}

      {/* Subject Criteria Configuration Modal */}
      <SubjectCriteriaModal
        isOpen={criteriaModal.isOpen}
        onClose={() => setCriteriaModal((prev) => ({ ...prev, isOpen: false }))}
        subjectName={criteriaModal.subjectName}
        allowSubjectSelection={criteriaModal.allowSubjectSelection}
        criteriaMap={subjectCriteria}
        onSave={handleSaveCriteria}
      />
    </div>
  );
};
