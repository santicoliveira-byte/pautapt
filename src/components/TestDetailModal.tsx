import React, { useState } from 'react';
import { EvaluationType, SchoolTest } from '../types';
import { GradeDisplayCard } from './GradeDisplayCard';
import {
  detectEvaluationType,
  EVALUATION_TYPE_CONFIGS,
  COMMON_WEIGHT_PRESETS,
} from '../utils/gradeUtils';
import { triggerHaptic } from '../utils/haptics';
import {
  X,
  Calendar,
  Layers,
  FileText,
  Trash2,
  Edit3,
  Sliders,
  Check,
} from 'lucide-react';

interface TestDetailModalProps {
  test: SchoolTest | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (test: SchoolTest) => void;
  onUpdateWeight?: (testId: string, newWeight: number, newType?: EvaluationType) => void;
}

export const TestDetailModal: React.FC<TestDetailModalProps> = ({
  test,
  onClose,
  onDelete,
  onEdit,
  onUpdateWeight,
}) => {
  if (!test) return null;

  const initialType = test.type || detectEvaluationType(test.title);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState<number>(test.weight || 70);
  const [selectedType, setSelectedType] = useState<EvaluationType>(initialType);
  const [justSavedWeight, setJustSavedWeight] = useState(false);

  const formattedDate = new Date(test.date).toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const typeConfig = EVALUATION_TYPE_CONFIGS[test.type || detectEvaluationType(test.title)];

  const handleSaveWeight = () => {
    if (onUpdateWeight) {
      onUpdateWeight(test.id, selectedWeight, selectedType);
      triggerHaptic('success');
      setJustSavedWeight(true);
      setTimeout(() => {
        setJustSavedWeight(false);
        setIsEditingWeight(false);
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md max-h-[90vh] bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-y-auto no-scrollbar shadow-2xl animate-slide-up flex flex-col">
        {/* iOS Drag handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Modal Top Bar */}
        <div className="p-4 pb-2 flex items-center justify-between border-b border-white/5">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                {test.subject}
              </span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${typeConfig.badgeClass.bg} ${typeConfig.badgeClass.text} ${typeConfig.badgeClass.border}`}>
                {typeConfig.shortLabel}
              </span>
            </div>
            <h3 className="text-base font-bold text-white truncate max-w-[280px]">
              {test.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white ios-pressable transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1">
          {/* Main Grade Card */}
          <GradeDisplayCard
            obtainedPoints={test.obtainedPoints}
            totalScale={test.totalScale}
            grade20={test.grade20}
            weight={test.weight}
            subject={test.subject}
          />

          {/* Quick Weight & Type Editor Card */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">Ponderação na Média</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white bg-zinc-800 px-2.5 py-0.5 rounded-lg border border-white/10">
                  {test.weight}%
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingWeight(!isEditingWeight)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  {isEditingWeight ? 'Fechar' : 'Alterar'}
                </button>
              </div>
            </div>

            {isEditingWeight && (
              <div className="pt-2 border-t border-white/5 space-y-3 animate-fade-in">
                {/* Type Selector */}
                <div>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
                    Tipo de Avaliação
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.keys(EVALUATION_TYPE_CONFIGS) as EvaluationType[]).map((tKey) => {
                      const cfg = EVALUATION_TYPE_CONFIGS[tKey];
                      const isSel = selectedType === tKey;
                      return (
                        <button
                          key={tKey}
                          type="button"
                          onClick={() => {
                            setSelectedType(tKey);
                            setSelectedWeight(cfg.defaultWeight);
                          }}
                          className={`p-1.5 rounded-xl text-left border text-xs transition-all ${
                            isSel
                              ? `${cfg.badgeClass.bg} ${cfg.badgeClass.border} font-bold text-white shadow-sm ring-1 ring-white/20`
                              : 'bg-zinc-800/40 border-white/5 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <div className="truncate">{cfg.shortLabel}</div>
                          <div className="text-[9px] opacity-70">Padrão: {cfg.defaultWeight}%</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Weight Input & Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-semibold text-zinc-400">
                      Peso Personalizado
                    </span>
                    <div className="flex items-center gap-1 bg-zinc-950 border border-white/10 rounded-lg px-2 py-0.5">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={selectedWeight}
                        onChange={(e) => setSelectedWeight(Math.max(1, Number(e.target.value) || 1))}
                        className="w-10 bg-transparent text-right font-bold text-xs text-white focus:outline-none"
                      />
                      <span className="text-xs text-blue-400 font-bold">%</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {COMMON_WEIGHT_PRESETS.map((wVal) => (
                      <button
                        key={wVal}
                        type="button"
                        onClick={() => setSelectedWeight(wVal)}
                        className={`text-xs px-2 py-0.5 rounded-lg border transition-all ${
                          selectedWeight === wVal
                            ? 'bg-blue-600 border-blue-500 text-white font-bold'
                            : 'bg-zinc-800/60 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {wVal}%
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveWeight}
                    className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      justSavedWeight
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-ios-glow-blue'
                    }`}
                  >
                    {justSavedWeight ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Peso Atualizado!</span>
                      </>
                    ) : (
                      <span>Gravar Ponderação ({selectedWeight}%)</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Test Metadata */}
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Data:
              </span>
              <span className="font-medium text-white capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Modo de Avaliação:
              </span>
              <span className="font-medium text-zinc-200 capitalize">
                {test.mode === 'domains'
                  ? 'Por Domínios'
                  : test.mode === 'questions'
                  ? 'Por Exercícios'
                  : 'Cotação Direta'}
              </span>
            </div>
          </div>

          {/* Domains / Questions breakdown if available */}
          {test.domains && test.domains.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                Discriminação por {test.mode === 'domains' ? 'Domínio' : 'Questão'}
              </h4>

              <div className="space-y-1.5">
                {test.domains.map((d, i) => {
                  const pct = d.maxScore > 0 ? (d.obtainedScore / d.maxScore) * 100 : 0;
                  return (
                    <div
                      key={d.id || i}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-white">{d.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {pct.toFixed(0)}% de aproveitamento
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {d.obtainedScore}{' '}
                          <span className="text-zinc-500 font-normal">/ {d.maxScore} pts</span>
                        </div>
                        <div className="text-[10px] text-blue-400 font-medium">
                          {((d.obtainedScore / (d.maxScore || 1)) * 20).toFixed(1)} val
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {test.notes && (
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1">
              <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Observações
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">"{test.notes}"</p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 pt-2 border-t border-white/5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Tens a certeza que desejas eliminar este teste?')) {
                onDelete(test.id);
                onClose();
              }
            }}
            className="flex-1 py-3 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center justify-center gap-1.5 ios-pressable transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onEdit(test);
              onClose();
            }}
            className="flex-1 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 ios-pressable transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Teste</span>
          </button>
        </div>
      </div>
    </div>
  );
};
