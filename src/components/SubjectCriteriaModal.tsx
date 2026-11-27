import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SubjectCriteriaMap, SubjectCriterionDomain } from '../types';
import {
  ANNUAL_12TH_SUBJECTS,
  CRITERIA_PRESETS,
  PORTUGAL_DEFAULT_SUBJECTS,
  buildCriteriaFromPreset,
  getSubjectCriteriaEntry,
} from '../utils/gradeUtils';
import { triggerHaptic } from '../utils/haptics';
import { useBodyScrollLock } from '../utils/useBodyScrollLock';
import {
  X,
  Plus,
  Trash2,
  Sliders,
  Sparkles,
  Check,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface SubjectCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectName: string;
  allowSubjectSelection?: boolean;
  criteriaMap?: SubjectCriteriaMap;
  onSave: (subjectName: string, criteria: SubjectCriterionDomain[]) => void;
}

const DOMAIN_COLORS = [
  'bg-blue-500',
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-cyan-500',
];

const DEFAULT_NEW_DOMAINS = (): SubjectCriterionDomain[] => {
  const ts = Date.now();
  return [
    { id: `crit-${ts}-0`, name: 'Conhecimento e Conceitos', percentage: 60 },
    { id: `crit-${ts}-1`, name: 'Resolução de Problemas', percentage: 25 },
    { id: `crit-${ts}-2`, name: 'Comunicação / Participação', percentage: 15 },
  ];
};

export const SubjectCriteriaModal: React.FC<SubjectCriteriaModalProps> = ({
  isOpen,
  onClose,
  subjectName,
  allowSubjectSelection = false,
  criteriaMap,
  onSave,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<string>(subjectName || 'Matemática A');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [domains, setDomains] = useState<SubjectCriterionDomain[]>([]);

  useBodyScrollLock(isOpen);

  // Load initial domains whenever modal opens or subject changes
  useEffect(() => {
    if (!isOpen) return;
    const targetSubj = subjectName || 'Matemática A';
    setSelectedSubject(targetSubj);
    setCustomSubject('');
    const { criteria } = getSubjectCriteriaEntry(criteriaMap, targetSubj);
    setDomains(criteria.length > 0 ? criteria.map((c) => ({ ...c })) : DEFAULT_NEW_DOMAINS());
  }, [isOpen, subjectName, criteriaMap]);

  if (!isOpen) return null;

  const effectiveSubjectName =
    selectedSubject === 'OUTRA' ? customSubject.trim() || 'Nova Disciplina' : selectedSubject;

  const handleSubjectDropdownChange = (newSubj: string) => {
    setSelectedSubject(newSubj);
    if (newSubj !== 'OUTRA') {
      setCustomSubject('');
      const { criteria } = getSubjectCriteriaEntry(criteriaMap, newSubj);
      setDomains(criteria.length > 0 ? criteria.map((c) => ({ ...c })) : DEFAULT_NEW_DOMAINS());
    }
  };

  const totalPct = domains.reduce((sum, d) => sum + (Number(d.percentage) || 0), 0);
  const roundedTotalPct = Number(totalPct.toFixed(1));

  const handleAddDomain = () => {
    triggerHaptic('light');
    const remaining = Math.max(0, Math.round(100 - totalPct));
    setDomains((prev) => [
      ...prev,
      {
        id: `crit-${Date.now()}-${prev.length}`,
        name: `Domínio ${prev.length + 1}`,
        percentage: remaining > 0 ? remaining : 10,
      },
    ]);
  };

  const handleRemoveDomain = (id: string) => {
    triggerHaptic('light');
    setDomains((prev) => prev.filter((d) => d.id !== id));
  };

  const handleUpdateDomain = (
    id: string,
    field: 'name' | 'percentage',
    value: string | number
  ) => {
    setDomains((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        if (field === 'percentage') {
          const parsed = Number(value);
          return {
            ...d,
            percentage: isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed)),
          };
        }
        return { ...d, name: String(value) };
      })
    );
  };

  const handleNormalizeTo100 = () => {
    if (domains.length === 0 || totalPct <= 0) return;
    triggerHaptic('medium');
    let acc = 0;
    const normalized = domains.map((d, idx) => {
      if (idx === domains.length - 1) {
        return { ...d, percentage: Math.max(0, Math.round(100 - acc)) };
      }
      const nextPct = Math.round(((Number(d.percentage) || 0) / totalPct) * 100);
      acc += nextPct;
      return { ...d, percentage: nextPct };
    });
    setDomains(normalized);
  };

  const handleSave = () => {
    const cleaned = domains
      .map((d) => ({
        ...d,
        name: d.name.trim() || 'Domínio',
        percentage: Math.max(0, Number(d.percentage) || 0),
      }))
      .filter((d) => d.percentage > 0);

    triggerHaptic('success');
    onSave(effectiveSubjectName, cleaned);
    onClose();
  };

  const handleClearCriteria = () => {
    triggerHaptic('medium');
    onSave(effectiveSubjectName, []);
    onClose();
  };

  const existingSaved = getSubjectCriteriaEntry(criteriaMap, effectiveSubjectName).criteria;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overscroll-contain"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[88dvh] bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col"
      >
        {/* iOS Drag handle */}
        <div className="shrink-0 pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Modal Top Bar */}
        <div className="shrink-0 p-4 pb-3 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Critérios de Avaliação (%)</h3>
              <p className="text-[11px] text-zinc-400">
                {allowSubjectSelection
                  ? 'Define os domínios e percentagens por disciplina'
                  : effectiveSubjectName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white ios-pressable transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1 min-h-0 overflow-y-auto modal-scroll-area">
          {/* Subject selector if allowed */}
          {allowSubjectSelection && (
            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
                Disciplina
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => handleSubjectDropdownChange(e.target.value)}
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Disciplinas Trienais e Bienais">
                  {PORTUGAL_DEFAULT_SUBJECTS.filter((s) => !ANNUAL_12TH_SUBJECTS.includes(s)).map(
                    (sub) => (
                      <option key={sub} value={sub} className="bg-zinc-900 text-white">
                        {sub}
                      </option>
                    )
                  )}
                </optgroup>
                <optgroup label="Opções Anuais (12.º Ano)">
                  {ANNUAL_12TH_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub} className="bg-zinc-900 text-white">
                      {sub}
                    </option>
                  ))}
                </optgroup>
                <option value="OUTRA" className="bg-zinc-900 text-white">
                  + Outra disciplina personalizada...
                </option>
              </select>

              {selectedSubject === 'OUTRA' && (
                <input
                  type="text"
                  placeholder="Nome da disciplina (ex: Área de Integração)"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full bg-zinc-900 border border-blue-500/40 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>
          )}

          {/* Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-400" />
                Modelos Rápidos (Editáveis)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CRITERIA_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setDomains(buildCriteriaFromPreset(preset));
                  }}
                  title={preset.description}
                  className="text-[11px] px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-blue-500/40 text-zinc-200 font-medium ios-pressable transition-all"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live distribution bar */}
          <div className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-medium">Distribuição dos Domínios</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  roundedTotalPct === 100
                    ? 'text-emerald-400'
                    : roundedTotalPct > 100
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`}
              >
                {roundedTotalPct === 100 ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>100% Completo</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{roundedTotalPct}% / 100%</span>
                  </>
                )}
              </span>
            </div>

            <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-white/5">
              {domains.map((d, idx) => {
                const widthPct = Math.max(0, Math.min(100, Number(d.percentage) || 0));
                if (widthPct === 0) return null;
                return (
                  <div
                    key={d.id}
                    style={{ width: `${totalPct > 100 ? (widthPct / totalPct) * 100 : widthPct}%` }}
                    className={`${DOMAIN_COLORS[idx % DOMAIN_COLORS.length]} h-full transition-all duration-300 border-r border-zinc-950/50 last:border-r-0`}
                    title={`${d.name}: ${d.percentage}%`}
                  />
                );
              })}
            </div>

            {roundedTotalPct !== 100 && domains.length > 0 && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-zinc-400">
                  {roundedTotalPct < 100
                    ? `Faltam ${(100 - roundedTotalPct).toFixed(0)}% para totalizar 100%.`
                    : `Excede 100% em ${(roundedTotalPct - 100).toFixed(0)}%.`}
                </span>
                {totalPct > 0 && (
                  <button
                    type="button"
                    onClick={handleNormalizeTo100}
                    className="text-[10px] font-semibold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Ajustar para 100%
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Domains List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium px-1">
              <span>Nome do Domínio</span>
              <span>Peso na Disciplina (%)</span>
            </div>

            {domains.length === 0 ? (
              <div className="text-center py-6 rounded-2xl bg-zinc-900/50 border border-dashed border-white/10 text-xs text-zinc-500">
                Nenhum domínio definido. Adiciona abaixo ou escolhe um modelo rápido.
              </div>
            ) : (
              domains.map((domain, idx) => (
                <div
                  key={domain.id}
                  className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-2xl border border-white/10"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      DOMAIN_COLORS[idx % DOMAIN_COLORS.length]
                    }`}
                  />
                  <input
                    type="text"
                    value={domain.name}
                    onChange={(e) => handleUpdateDomain(domain.id, 'name', e.target.value)}
                    placeholder="Ex: Conhecimento, Oralidade, Lab..."
                    className="flex-1 bg-transparent text-xs font-medium text-white placeholder-zinc-600 focus:outline-none min-w-0"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl px-2 py-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={domain.percentage || ''}
                        onChange={(e) =>
                          handleUpdateDomain(domain.id, 'percentage', e.target.value)
                        }
                        placeholder="0"
                        className="w-12 bg-transparent text-right text-xs font-bold text-white focus:outline-none"
                      />
                      <span className="text-xs font-bold text-blue-400 ml-0.5">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 ios-pressable transition-colors"
                      title="Remover domínio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}

            <button
              type="button"
              onClick={handleAddDomain}
              className="w-full py-2.5 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-dashed border-white/15 text-xs font-semibold text-blue-400 flex items-center justify-center gap-1.5 ios-pressable transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Domínio</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row gap-2 bg-zinc-950 safe-bottom sm:pb-4">
          {existingSaved.length > 0 && (
            <button
              type="button"
              onClick={handleClearCriteria}
              className="py-3 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold ios-pressable transition-colors"
            >
              Remover Critérios
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="sm:flex-1 py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/10 text-xs font-semibold ios-pressable transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="sm:flex-[2] py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-ios-glow-blue flex items-center justify-center gap-1.5 ios-pressable transition-colors"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Guardar Critérios de {effectiveSubjectName}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
