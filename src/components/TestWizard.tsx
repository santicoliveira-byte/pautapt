import React, { useState } from 'react';
import {
  DomainItem,
  EvaluationMode,
  EvaluationType,
  SchoolTest,
  SubjectCriteriaMap,
  SubjectCriterionDomain,
} from '../types';
import {
  PORTUGAL_DEFAULT_SUBJECTS,
  ANNUAL_12TH_SUBJECTS,
  SCALE_PRESETS,
  calculateGrade20,
  getClassification,
  detectEvaluationType,
  EVALUATION_TYPE_CONFIGS,
  formatWeight,
  getSubjectCriteriaEntry,
  distributeScaleByCriteria,
  getTestCriterionIds,
} from '../utils/gradeUtils';
import { GradeDisplayCard } from './GradeDisplayCard';
import { IAVEPresetsModal, IAVEPreset } from './IAVEPresetsModal';
import { NumpadModal } from './NumpadModal';
import { SubjectCriteriaModal } from './SubjectCriteriaModal';
import { triggerHaptic } from '../utils/haptics';
import { triggerCelebration } from '../utils/confetti';
import {
  Plus,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Check,
  Save,
  Sliders,
  ListPlus,
  Hash,
  RotateCcw,
  Sparkles,
  Calculator,
  CheckSquare,
  Square,
} from 'lucide-react';

interface TestWizardProps {
  onSaveTest: (test: SchoolTest) => void;
  onCancel?: () => void;
  initialTest?: SchoolTest | null;
  subjectCriteria?: SubjectCriteriaMap;
  onSaveSubjectCriteria?: (subjectName: string, criteria: SubjectCriterionDomain[]) => void;
}

export const TestWizard: React.FC<TestWizardProps> = ({
  onSaveTest,
  initialTest,
  subjectCriteria = {},
  onSaveSubjectCriteria,
}) => {
  // Wizard Step: 1 = Configuração, 2 = Introdução de Valores & Cálculo
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [subject, setSubject] = useState<string>(initialTest?.subject || 'Matemática A');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [title, setTitle] = useState<string>(initialTest?.title || '');
  const initialDetectedType =
    initialTest?.type || (initialTest?.title ? detectEvaluationType(initialTest.title) : 'teste');
  const [evalType, setEvalType] = useState<EvaluationType>(initialDetectedType);
  const [weight, setWeight] = useState<number>(() => {
    if (initialTest && initialTest.weight !== undefined && initialTest.weight > 0) {
      if (initialTest.weight === 70) return 2;
      if (initialTest.weight === 15) return 1;
      return initialTest.weight;
    }
    return (
      EVALUATION_TYPE_CONFIGS[initialDetectedType]?.defaultWeight ||
      (initialDetectedType === 'teste' ? 2 : 1)
    );
  });
  const term = initialTest?.term || 'Geral';
  const [date, setDate] = useState<string>(
    initialTest?.date || new Date().toISOString().split('T')[0]
  );
  const [totalScale, setTotalScale] = useState<number>(initialTest?.totalScale || 200);
  const [customScaleInput, setCustomScaleInput] = useState<string>('');
  const [mode, setMode] = useState<EvaluationMode>(initialTest?.mode || 'domains');

  // Initial criteria matching for initial subject
  const initialSubjectStr = initialTest?.subject || 'Matemática A';
  const initialSubjCriteria = getSubjectCriteriaEntry(subjectCriteria, initialSubjectStr).criteria;
  const isEditingExistingTest = Boolean(initialTest && initialTest.id);

  const [selectedCriteriaIds, setSelectedCriteriaIds] = useState<string[]>(() => {
    if (initialTest && initialTest.id) {
      return getTestCriterionIds(initialTest, initialSubjCriteria);
    }
    return initialSubjCriteria.map((c) => c.id);
  });

  // Domains / Questions state
  const [domains, setDomains] = useState<DomainItem[]>(() => {
    if (initialTest?.id && initialTest.domains && initialTest.domains.length > 0) {
      return initialTest.domains;
    }
    if (!isEditingExistingTest && initialSubjCriteria.length > 0 && (initialTest?.mode || 'domains') === 'domains') {
      return distributeScaleByCriteria(
        initialSubjCriteria,
        initialSubjCriteria.map((c) => c.id),
        initialTest?.totalScale || 200
      );
    }
    if (initialTest?.domains && initialTest.domains.length > 0) {
      return initialTest.domains;
    }
    return [
      { id: '1', name: 'Domínio 1 (ex: Conhecimento)', maxScore: 80, obtainedScore: 0 },
      { id: '2', name: 'Domínio 2 (ex: Raciocínio & Cálculo)', maxScore: 80, obtainedScore: 0 },
      { id: '3', name: 'Domínio 3 (ex: Comunicação)', maxScore: 40, obtainedScore: 0 },
    ];
  });

  // Direct calculation obtained points
  const [directObtained, setDirectObtained] = useState<number>(
    initialTest?.obtainedPoints || 0
  );

  const [notes, setNotes] = useState<string>(initialTest?.notes || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState<boolean>(false);

  const finalSubjectName =
    subject === 'OUTRA' ? customSubject.trim() || 'Outra Disciplina' : subject;
  const { criteria: currentSubjectCriteria } = getSubjectCriteriaEntry(
    subjectCriteria,
    finalSubjectName
  );

  // Sync state whenever initialTest changes (e.g. user clicked "+ Teste" for an annual subject or Edit)
  React.useEffect(() => {
    if (initialTest) {
      const subj = initialTest.subject || 'Matemática A';
      const scale = initialTest.totalScale || 200;
      const m = initialTest.mode || 'domains';
      setSubject(subj);
      setTitle(initialTest.title || '');
      setDate(initialTest.date || new Date().toISOString().split('T')[0]);
      setTotalScale(scale);
      setMode(m);
      const detType = initialTest.type || detectEvaluationType(initialTest.title || '');
      setEvalType(detType);
      const effectiveW =
        initialTest.weight && initialTest.weight > 0
          ? initialTest.weight === 70
            ? 2
            : initialTest.weight === 15
            ? 1
            : initialTest.weight
          : EVALUATION_TYPE_CONFIGS[detType]?.defaultWeight || (detType === 'teste' ? 2 : 1);
      setWeight(effectiveW);

      const { criteria } = getSubjectCriteriaEntry(subjectCriteria, subj);
      if (initialTest.id) {
        setSelectedCriteriaIds(getTestCriterionIds(initialTest, criteria));
        if (initialTest.domains && initialTest.domains.length > 0) {
          setDomains(initialTest.domains);
        }
      } else if (criteria.length > 0) {
        const allIds = criteria.map((c) => c.id);
        setSelectedCriteriaIds(allIds);
        if (m === 'domains') {
          setDomains(distributeScaleByCriteria(criteria, allIds, scale));
        } else if (initialTest.domains && initialTest.domains.length > 0) {
          setDomains(initialTest.domains);
        }
      } else {
        setSelectedCriteriaIds([]);
        if (initialTest.domains && initialTest.domains.length > 0) {
          setDomains(initialTest.domains);
        }
      }

      setDirectObtained(initialTest.obtainedPoints || 0);
      setNotes(initialTest.notes || '');
      setCustomSubject('');
      setStep(1);
    }
  }, [initialTest]);

  // Modals for IAVE models & iOS Numpad
  const [isIAVEModalOpen, setIsIAVEModalOpen] = useState(false);
  const [numpadConfig, setNumpadConfig] = useState<{
    isOpen: boolean;
    domainId?: string;
    isDirect?: boolean;
    title: string;
    maxScore: number;
    initialValue: number;
  }>({
    isOpen: false,
    title: '',
    maxScore: 200,
    initialValue: 0,
  });

  const handleSelectIAVEPreset = (preset: IAVEPreset) => {
    triggerHaptic('medium');
    setSubject(preset.name);
    setTotalScale(preset.totalScale);
    setMode('domains');
    setDomains(
      preset.groups.map((g, idx) => ({
        id: `iave-${idx}`,
        name: g.name,
        maxScore: g.maxScore,
        obtainedScore: 0,
      }))
    );
  };

  // Computed totals
  const currentTotalMaxPoints =
    mode === 'direct'
      ? totalScale
      : domains.reduce((acc, curr) => acc + (Number(curr.maxScore) || 0), 0);

  const currentTotalObtained =
    mode === 'direct'
      ? Number(directObtained) || 0
      : domains.reduce((acc, curr) => acc + (Number(curr.obtainedScore) || 0), 0);

  const currentGrade20 = calculateGrade20(
    currentTotalObtained,
    mode === 'direct' ? totalScale : currentTotalMaxPoints
  );

  // Helper to sync criteria selection and domains when subject changes
  const syncCriteriaForSubject = (
    targetSubject: string,
    targetMode: EvaluationMode = mode,
    targetScale: number = totalScale
  ) => {
    const { criteria } = getSubjectCriteriaEntry(subjectCriteria, targetSubject);
    if (criteria.length > 0) {
      const allIds = criteria.map((c) => c.id);
      setSelectedCriteriaIds(allIds);
      if (targetMode === 'domains') {
        setDomains(distributeScaleByCriteria(criteria, allIds, targetScale));
      }
    } else {
      setSelectedCriteriaIds([]);
      if (targetMode === 'domains' && domains.some((d) => d.criterionId)) {
        setDomains([
          { id: '1', name: 'Domínio 1 (ex: Conhecimento)', maxScore: Math.round(targetScale * 0.4), obtainedScore: 0 },
          { id: '2', name: 'Domínio 2 (ex: Raciocínio & Cálculo)', maxScore: Math.round(targetScale * 0.4), obtainedScore: 0 },
          { id: '3', name: 'Domínio 3 (ex: Comunicação)', maxScore: targetScale - Math.round(targetScale * 0.4) * 2, obtainedScore: 0 },
        ]);
      }
    }
  };

  // Helper to switch to custom subject if selected
  const handleSubjectSelect = (sub: string) => {
    if (sub === 'OUTRA') {
      setSubject('OUTRA');
      setSelectedCriteriaIds([]);
    } else {
      setSubject(sub);
      setCustomSubject('');
      syncCriteriaForSubject(sub);
    }
  };

  const handleToggleCriterion = (critId: string) => {
    triggerHaptic('light');
    const exists = selectedCriteriaIds.includes(critId);
    const nextIds = exists
      ? selectedCriteriaIds.filter((id) => id !== critId)
      : [...selectedCriteriaIds, critId];
    setSelectedCriteriaIds(nextIds);

    if (mode === 'domains' && currentSubjectCriteria.length > 0) {
      if (nextIds.length > 0) {
        setDomains((prev) =>
          distributeScaleByCriteria(currentSubjectCriteria, nextIds, totalScale, prev)
        );
      } else {
        setDomains((prev) => prev.map((d) => ({ ...d, criterionId: undefined })));
      }
    }
  };

  const handleSelectAllCriteria = () => {
    triggerHaptic('light');
    const allIds = currentSubjectCriteria.map((c) => c.id);
    setSelectedCriteriaIds(allIds);
    if (mode === 'domains' && allIds.length > 0) {
      setDomains((prev) =>
        distributeScaleByCriteria(currentSubjectCriteria, allIds, totalScale, prev)
      );
    }
  };

  const handleClearSelectedCriteria = () => {
    triggerHaptic('light');
    setSelectedCriteriaIds([]);
    if (mode === 'domains') {
      setDomains((prev) => prev.map((d) => ({ ...d, criterionId: undefined })));
    }
  };

  const handleSaveWizardCriteria = (subj: string, newCriteria: SubjectCriterionDomain[]) => {
    onSaveSubjectCriteria?.(subj, newCriteria);
    if (newCriteria.length > 0) {
      const allIds = newCriteria.map((c) => c.id);
      setSelectedCriteriaIds(allIds);
      if (mode === 'domains') {
        setDomains((prev) => distributeScaleByCriteria(newCriteria, allIds, totalScale, prev));
      }
    } else {
      setSelectedCriteriaIds([]);
      setDomains((prev) => prev.map((d) => ({ ...d, criterionId: undefined })));
    }
  };

  // Add domain
  const handleAddDomain = () => {
    const nextId = String(Date.now());
    const count = domains.length + 1;
    const defaultName = mode === 'domains' ? `Domínio ${count}` : `Questão ${count}`;

    setDomains([
      ...domains,
      { id: nextId, name: defaultName, maxScore: 20, obtainedScore: 0 },
    ]);
  };

  // Remove domain
  const handleRemoveDomain = (id: string) => {
    if (domains.length <= 1) return;
    const target = domains.find((d) => d.id === id);
    const remaining = domains.filter((d) => d.id !== id);
    setDomains(remaining);
    if (target?.criterionId) {
      const stillHasCriterion = remaining.some((d) => d.criterionId === target.criterionId);
      if (!stillHasCriterion) {
        setSelectedCriteriaIds((prev) => prev.filter((cid) => cid !== target.criterionId));
      }
    }
  };

  // Update domain field
  const handleUpdateDomain = (
    id: string,
    field: 'name' | 'maxScore' | 'obtainedScore' | 'criterionId',
    value: string | number
  ) => {
    setDomains((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        if (field === 'obtainedScore') {
          const num = Number(value);
          const clamped = Math.max(0, Math.min(d.maxScore, isNaN(num) ? 0 : num));
          return { ...d, obtainedScore: clamped };
        }
        if (field === 'maxScore') {
          const num = Number(value);
          return { ...d, maxScore: Math.max(0, isNaN(num) ? 0 : num) };
        }
        if (field === 'name') {
          return { ...d, name: String(value) };
        }
        if (field === 'criterionId') {
          return { ...d, criterionId: value ? String(value) : undefined };
        }
        return d;
      })
    );
  };

  // Switch mode and configure defaults
  const handleModeChange = (newMode: EvaluationMode) => {
    setMode(newMode);
    if (newMode === 'questions') {
      const isCurrentlyDomainTemplate =
        !domains.length ||
        domains[0].name.startsWith('Domínio') ||
        domains.some((d) => Boolean(d.criterionId));
      if (isCurrentlyDomainTemplate) {
        const isSmall = totalScale <= 20;
        const p1 = isSmall ? 5 : Math.round(totalScale * 0.25);
        const p2 = isSmall ? 7.5 : Math.round(totalScale * 0.375);
        const p3 = Math.max(0, totalScale - p1 - p2);
        setDomains([
          { id: 'q1', name: 'Grupo I / Q1', maxScore: p1, obtainedScore: 0 },
          { id: 'q2', name: 'Grupo II / Q2', maxScore: p2, obtainedScore: 0 },
          { id: 'q3', name: 'Grupo III / Q3', maxScore: p3, obtainedScore: 0 },
        ]);
      }
    } else if (newMode === 'domains') {
      if (currentSubjectCriteria.length > 0 && selectedCriteriaIds.length > 0) {
        setDomains(
          distributeScaleByCriteria(currentSubjectCriteria, selectedCriteriaIds, totalScale)
        );
      } else if (!domains.length || domains[0].name.startsWith('Grupo')) {
        setDomains([
          { id: 'd1', name: 'Domínio 1 (Conhecimento)', maxScore: 80, obtainedScore: 0 },
          { id: 'd2', name: 'Domínio 2 (Raciocínio & Cálculo)', maxScore: 80, obtainedScore: 0 },
          { id: 'd3', name: 'Domínio 3 (Comunicação)', maxScore: 40, obtainedScore: 0 },
        ]);
      }
    }
  };

  // Update totalScale and proportionally redistribute linked criteria domains if no grades entered yet
  const handleScalePresetSelect = (newScale: number) => {
    setTotalScale(newScale);
    setCustomScaleInput('');
    if (
      mode === 'domains' &&
      currentSubjectCriteria.length > 0 &&
      selectedCriteriaIds.length > 0 &&
      domains.every((d) => !d.obtainedScore)
    ) {
      setDomains((prev) =>
        distributeScaleByCriteria(currentSubjectCriteria, selectedCriteriaIds, newScale, prev)
      );
    }
  };

  // Quick distribution: scale domains proportionally to match totalScale
  const handleAutoAdjustDomainsToScale = () => {
    if (
      mode === 'domains' &&
      currentSubjectCriteria.length > 0 &&
      selectedCriteriaIds.length > 0
    ) {
      setDomains((prev) =>
        distributeScaleByCriteria(currentSubjectCriteria, selectedCriteriaIds, totalScale, prev)
      );
      return;
    }

    const currentSum = domains.reduce((acc, d) => acc + d.maxScore, 0);
    if (currentSum === 0) return;
    const factor = totalScale / currentSum;

    let accumulated = 0;
    const updated = domains.map((d, index) => {
      if (index === domains.length - 1) {
        const lastScore = totalScale - accumulated;
        return { ...d, maxScore: Math.max(0, Math.round(lastScore)) };
      }
      const newMax = Math.round(d.maxScore * factor);
      accumulated += newMax;
      return { ...d, maxScore: newMax };
    });
    setDomains(updated);
  };

  // Save handler
  const handleSave = () => {
    const scaleToUse = mode === 'direct' ? totalScale : currentTotalMaxPoints;
    const effectiveTitle =
      title.trim() ||
      `Teste de ${finalSubjectName} (${new Date(date).toLocaleDateString('pt-PT')})`;

    const effectiveWeight =
      Number(weight) > 0
        ? Number(weight)
        : EVALUATION_TYPE_CONFIGS[evalType]?.defaultWeight || (evalType === 'teste' ? 2 : 1);

    const activeCritIds = new Set(currentSubjectCriteria.map((c) => c.id));
    const combinedCritIds = new Set<string>();
    selectedCriteriaIds.forEach((id) => {
      if (activeCritIds.has(id)) combinedCritIds.add(id);
    });
    if (mode !== 'direct') {
      domains.forEach((d) => {
        if (d.criterionId && activeCritIds.has(d.criterionId)) {
          combinedCritIds.add(d.criterionId);
        }
      });
    }

    const newTest: SchoolTest = {
      id: initialTest?.id || String(Date.now()),
      title: effectiveTitle,
      subject: finalSubjectName,
      totalScale: scaleToUse,
      weight: effectiveWeight,
      type: evalType,
      mode,
      domains: mode === 'direct' ? [] : domains,
      criteriaDomainIds: combinedCritIds.size > 0 ? Array.from(combinedCritIds) : undefined,
      obtainedPoints: currentTotalObtained,
      grade20: currentGrade20,
      percentage: scaleToUse > 0 ? (currentTotalObtained / scaleToUse) * 100 : 0,
      classification: getClassification(currentGrade20),
      term,
      date,
      notes: notes.trim(),
    };

    onSaveTest(newTest);
    triggerHaptic('success');
    if (newTest.grade20 >= 17.5) {
      triggerCelebration();
    }

    // Sincroniza logo a disciplina anual na tabela da calculadora de secundário
    try {
      const isKnownAnnual = ANNUAL_12TH_SUBJECTS.some(
        (a) => a.toLowerCase() === finalSubjectName.toLowerCase()
      );
      if (isKnownAnnual) {
        const savedTable = localStorage.getItem('pautapt_secondary_table_v4');
        if (savedTable) {
          const parsed = JSON.parse(savedTable);
          if (Array.isArray(parsed)) {
            const alreadyInTable = parsed.some(
              (s: any) => s.name.toLowerCase() === finalSubjectName.toLowerCase()
            );
            if (!alreadyInTable) {
              const slot = parsed.find(
                (s: any) =>
                  s.type === 'anual' &&
                  (s.name.toLowerCase().includes('opção') ||
                    s.name.toLowerCase().includes('opcao'))
              );
              if (slot) {
                slot.name = finalSubjectName;
                localStorage.setItem('pautapt_secondary_table_v4', JSON.stringify(parsed));
              }
            }
          }
        }
      }
    } catch {
      // ignore
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto pb-28 pt-2 px-4 animate-fade-in">
      {/* Wizard Header / Navigation Stepper */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 ios-pressable transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {step === 1 ? '1. Configuração do Teste' : '2. Lançar Valores & Nota'}
            </h2>
            <p className="text-xs text-zinc-400">
              {step === 1
                ? 'Defina a disciplina, escala e domínios avaliados'
                : 'Introduza as cotações obtidas e veja a nota instantânea'}
            </p>
          </div>
        </div>

        {/* Step indicator pill */}
        <div className="flex items-center bg-zinc-900 border border-white/10 rounded-full px-2.5 py-1 text-xs font-semibold text-zinc-300">
          <span className={step === 1 ? 'text-blue-400' : 'text-zinc-500'}>Passo 1</span>
          <span className="mx-1 text-zinc-600">/</span>
          <span className={step === 2 ? 'text-blue-400' : 'text-zinc-500'}>Passo 2</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 1: CONFIGURAÇÃO DO TESTE                            */}
      {/* ======================================================== */}
      {step === 1 && (
        <div className="space-y-5 animate-fade-in">
          {/* Card: Disciplina */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Disciplina / Módulo
              </label>
              <button
                type="button"
                onClick={() => setIsIAVEModalOpen(true)}
                className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full ios-pressable"
              >
                <Sparkles className="w-3 h-3" />
                <span>Modelos IAVE</span>
              </button>
            </div>

            {/* Quick chips for common subjects in Portugal */}
            <div className="space-y-2 mb-3">
              <div>
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                  Disciplinas Principais
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Matemática A',
                    'Português',
                    'Físico-Química A',
                    'Biologia e Geologia',
                    'Educação Física',
                    'Filosofia',
                    'Inglês',
                    'História A',
                  ].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleSubjectSelect(sub)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ios-pressable ${
                        subject === sub
                          ? 'bg-blue-600 border-blue-500 text-white font-medium shadow-ios-glow-blue'
                          : 'bg-zinc-800/60 border-white/5 text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Opções 12.º Ano (Disciplinas Anuais)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ANNUAL_12TH_SUBJECTS.slice(0, 8).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleSubjectSelect(sub)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ios-pressable ${
                        subject === sub
                          ? 'bg-emerald-600 border-emerald-500 text-white font-bold shadow-sm'
                          : 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300 hover:bg-emerald-900/40'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSubjectSelect('OUTRA')}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ios-pressable ${
                      subject === 'OUTRA'
                        ? 'bg-blue-600 border-blue-500 text-white font-medium'
                        : 'bg-zinc-800/60 border-white/5 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    + Outra
                  </button>
                </div>
              </div>
            </div>

            {/* Custom subject input if selected or chosen from select */}
            {subject === 'OUTRA' ? (
              <input
                type="text"
                placeholder="Escreve o nome da disciplina..."
                value={customSubject}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomSubject(val);
                  if (val.trim()) syncCriteriaForSubject(val.trim());
                }}
                autoFocus
                className="w-full bg-zinc-950 border border-blue-500/50 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <select
                value={subject}
                onChange={(e) => handleSubjectSelect(e.target.value)}
                className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
              >
                {!PORTUGAL_DEFAULT_SUBJECTS.includes(subject) && subject && (
                  <option value={subject}>{subject}</option>
                )}
                <optgroup label="Disciplinas Anuais (12.º Ano)">
                  {ANNUAL_12TH_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub} (12.º Ano)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Disciplinas Trienais e Bienais">
                  {PORTUGAL_DEFAULT_SUBJECTS.filter((s) => !ANNUAL_12TH_SUBJECTS.includes(s)).map(
                    (sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    )
                  )}
                </optgroup>
              </select>
            )}
          </div>

          {/* Card: Critérios de Avaliação (Domínios Presentes neste Teste) */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-4 shadow-ios-card space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Domínios Presentes ({finalSubjectName})
                </label>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {currentSubjectCriteria.length > 0
                    ? 'Seleciona quais os domínios dos critérios de avaliação presentes neste teste.'
                    : 'Define a % de cada domínio nos critérios desta disciplina para calcular a média por domínios.'}
                </p>
              </div>
              {onSaveSubjectCriteria && (
                <button
                  type="button"
                  onClick={() => setIsCriteriaModalOpen(true)}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 shrink-0 ios-pressable transition-colors"
                >
                  {currentSubjectCriteria.length > 0 ? 'Editar %' : '+ Definir %'}
                </button>
              )}
            </div>

            {currentSubjectCriteria.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {currentSubjectCriteria.map((crit) => {
                    const isChecked = selectedCriteriaIds.includes(crit.id);
                    return (
                      <button
                        key={crit.id}
                        type="button"
                        onClick={() => handleToggleCriterion(crit.id)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-2xl border transition-all ios-pressable ${
                          isChecked
                            ? 'bg-blue-600/25 border-blue-500 text-white font-semibold shadow-sm'
                            : 'bg-zinc-950/60 border-white/10 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                        )}
                        <span>{crit.name}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isChecked
                              ? 'bg-blue-500/30 text-blue-200'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {crit.percentage}%
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
                  <span>
                    {selectedCriteriaIds.length} de {currentSubjectCriteria.length} selecionados
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSelectAllCriteria}
                      className="text-blue-400 hover:underline font-medium"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={handleClearSelectedCriteria}
                      className="text-zinc-400 hover:text-white hover:underline font-medium"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {selectedCriteriaIds.length === 0 && (
                  <p className="text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2">
                    Nenhum domínio selecionado — este teste será registado sem associação direta a um domínio específico.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Card: Cotação Total e Ponderação */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-4">
            {/* Tipo de Avaliação */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Tipo de Avaliação
                </label>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${EVALUATION_TYPE_CONFIGS[evalType].badgeClass.bg} ${EVALUATION_TYPE_CONFIGS[evalType].badgeClass.text} ${EVALUATION_TYPE_CONFIGS[evalType].badgeClass.border}`}>
                  {EVALUATION_TYPE_CONFIGS[evalType].label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(Object.keys(EVALUATION_TYPE_CONFIGS) as EvaluationType[]).map((tKey) => {
                  const cfg = EVALUATION_TYPE_CONFIGS[tKey];
                  const isSelected = evalType === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      onClick={() => {
                        setEvalType(tKey);
                        setWeight(cfg.defaultWeight);
                      }}
                      className={`p-2 rounded-xl text-left border transition-all ios-pressable ${
                        isSelected
                          ? `${cfg.badgeClass.bg} ${cfg.badgeClass.border} font-bold text-white shadow-sm ring-1 ring-white/20`
                          : 'bg-zinc-800/40 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="text-xs font-semibold truncate">{cfg.shortLabel}</div>
                      <div className="text-[10px] opacity-75">Sugerido: {cfg.defaultWeight}%</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ponderação / Peso na Média */}
            <div className="pt-3 border-t border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Peso na Média da Disciplina
                  </label>
                  <p className="text-[10px] text-zinc-500">
                    O teste vale o dobro da questão-aula (2x vs 1x)
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={weight}
                    onChange={(e) => setWeight(Math.max(1, Number(e.target.value) || 1))}
                    className="w-10 bg-transparent text-right font-bold text-sm text-white focus:outline-none"
                  />
                  <span className="text-xs text-blue-400 font-bold">{weight <= 10 ? 'x' : '%'}</span>
                </div>
              </div>

              {/* Rácio Coeficientes 2x / 1x */}
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-zinc-400 block uppercase">
                  Rácio Proporcional (Teste = Dobro)
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWeight(2)}
                    className={`py-2 px-3 rounded-xl border text-left transition-all ios-pressable ${
                      weight === 2
                        ? 'bg-blue-600/30 border-blue-500 text-white font-bold shadow-ios-glow-blue ring-1 ring-blue-500/50'
                        : 'bg-zinc-800/40 border-white/5 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-blue-400 flex items-center justify-between">
                      <span>2x (Dobro)</span>
                      <span className="text-[10px] font-normal text-zinc-400">Teste</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Padrão para Teste Sumativo</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWeight(1)}
                    className={`py-2 px-3 rounded-xl border text-left transition-all ios-pressable ${
                      weight === 1
                        ? 'bg-purple-600/30 border-purple-500 text-white font-bold shadow-sm ring-1 ring-purple-500/50'
                        : 'bg-zinc-800/40 border-white/5 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-purple-400 flex items-center justify-between">
                      <span>1x (Base)</span>
                      <span className="text-[10px] font-normal text-zinc-400">Questão-Aula</span>
                    </div>
                    <div className="text-[10px] text-zinc-400">Metade do teste</div>
                  </button>
                </div>
              </div>

              {/* Outros pesos e percentagens */}
              <div>
                <span className="text-[10px] font-semibold text-zinc-500 block mb-1">
                  Ou outros pesos / percentagens:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[3, 4, 10, 20, 25, 30, 50, 70].map((wPreset) => (
                    <button
                      key={wPreset}
                      type="button"
                      onClick={() => setWeight(wPreset)}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-all ios-pressable ${
                        weight === wPreset
                          ? 'bg-blue-600 border-blue-500 text-white font-bold'
                          : 'bg-zinc-800/60 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {formatWeight(wPreset)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Cotação Total */}
            <div className="pt-3 border-t border-white/5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Cotação Total do Teste
                </label>
                <span className="text-xs font-bold text-blue-400">
                  {totalScale} {totalScale === 20 ? 'valores' : 'pontos'}
                </span>
              </div>

              {/* Quick scale selection presets */}
              <div className="grid grid-cols-2 gap-2">
                {SCALE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleScalePresetSelect(preset.value)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ios-pressable ${
                      totalScale === preset.value && !customScaleInput
                        ? 'bg-blue-600/20 border-blue-500/80 text-white shadow-sm'
                        : 'bg-zinc-800/40 border-white/5 text-zinc-300 hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="text-sm font-bold text-white">{preset.value}</div>
                    <div className="text-[10px] text-zinc-400 leading-tight">
                      {preset.label.split('(')[1]?.replace(')', '') || preset.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom scale input */}
              <div className="mt-2.5">
                <input
                  type="number"
                  placeholder="Ou cotação personalizada (ex: 150, 80)..."
                  value={customScaleInput}
                  onChange={(e) => {
                    setCustomScaleInput(e.target.value);
                    const val = Number(e.target.value);
                    if (val > 0) setTotalScale(val);
                  }}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Card: Estrutura do Teste (Domínios / Matérias) */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Estrutura & Domínios Avaliados
                </label>
                <p className="text-[11px] text-zinc-500">
                  Como queres lançar as cotações do teste?
                </p>
              </div>
            </div>

            {/* Mode Segmented Control */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-950 rounded-2xl border border-white/5 mb-4">
              <button
                type="button"
                onClick={() => handleModeChange('domains')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all ${
                  mode === 'domains'
                    ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 mx-auto mb-0.5" />
                Domínios
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('questions')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all ${
                  mode === 'questions'
                    ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ListPlus className="w-3.5 h-3.5 mx-auto mb-0.5" />
                Exercícios
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('direct')}
                className={`py-2 px-1 text-center rounded-xl text-xs font-medium transition-all ${
                  mode === 'direct'
                    ? 'bg-zinc-800 text-white shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Hash className="w-3.5 h-3.5 mx-auto mb-0.5" />
                Direto
              </button>
            </div>

            {/* Domains / Questions Configuration */}
            {mode !== 'direct' ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-medium px-1">
                  <span>Nome do Domínio / Item</span>
                  <div className="flex items-center gap-2">
                    <span>Cotação Máx.</span>
                    <button
                      type="button"
                      onClick={handleAutoAdjustDomainsToScale}
                      title={`Ajustar soma para ${totalScale}`}
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      {mode === 'domains' && currentSubjectCriteria.length > 0 && selectedCriteriaIds.length > 0
                        ? `Distribuir por % (${totalScale})`
                        : `Ajustar a ${totalScale}`}
                    </button>
                  </div>
                </div>

                {domains.map((domain, index) => {
                  const linkedCrit = domain.criterionId
                    ? currentSubjectCriteria.find((c) => c.id === domain.criterionId)
                    : undefined;
                  const availableCriteriaForQuestions = currentSubjectCriteria.filter((c) =>
                    selectedCriteriaIds.includes(c.id)
                  );

                  return (
                    <div
                      key={domain.id}
                      className="bg-zinc-950/70 p-2 rounded-2xl border border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-mono w-4 text-center">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={domain.name}
                          onChange={(e) => handleUpdateDomain(domain.id, 'name', e.target.value)}
                          placeholder="Nome do domínio..."
                          className="flex-1 bg-transparent text-xs text-white placeholder-zinc-600 focus:outline-none min-w-0"
                        />
                        {linkedCrit && mode === 'domains' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/25 shrink-0">
                            {linkedCrit.percentage}%
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="0"
                            value={domain.maxScore || ''}
                            onChange={(e) =>
                              handleUpdateDomain(domain.id, 'maxScore', e.target.value)
                            }
                            className="w-16 bg-zinc-900 border border-white/10 rounded-xl px-2 py-1 text-right text-xs text-white font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-[10px] text-zinc-500">pts</span>
                          {domains.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveDomain(domain.id)}
                              className="p-1 text-zinc-600 hover:text-red-400 ios-pressable transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {mode === 'questions' && availableCriteriaForQuestions.length > 0 && (
                        <div className="flex items-center justify-between pl-6 pr-1 pt-1 border-t border-white/5">
                          <span className="text-[10px] text-zinc-500">Critério:</span>
                          <select
                            value={domain.criterionId || ''}
                            onChange={(e) =>
                              handleUpdateDomain(domain.id, 'criterionId', e.target.value)
                            }
                            className="bg-zinc-900 border border-white/10 rounded-lg px-2 py-0.5 text-[10px] text-blue-300 focus:outline-none"
                          >
                            <option value="" className="bg-zinc-900 text-zinc-300">
                              Todos os domínios selecionados
                            </option>
                            {availableCriteriaForQuestions.map((c) => (
                              <option key={c.id} value={c.id} className="bg-zinc-900 text-white">
                                {c.name} ({c.percentage}%)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleAddDomain}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium ios-pressable transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Adicionar {mode === 'domains' ? 'Domínio' : 'Questão'}</span>
                  </button>

                  <div className="text-xs text-right">
                    <span className="text-zinc-500">Soma: </span>
                    <span
                      className={`font-bold ${
                        currentTotalMaxPoints === totalScale
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {currentTotalMaxPoints} / {totalScale} pts
                    </span>
                  </div>
                </div>

                {currentTotalMaxPoints !== totalScale && (
                  <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 mt-2">
                    Aviso: A soma dos itens ({currentTotalMaxPoints} pts) difere da cotação total ({totalScale} pts). A app converterá proporcionalmente para a escala de 20 valores.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-zinc-950/60 rounded-2xl p-3 border border-white/5 text-center space-y-1.5">
                <p className="text-xs text-zinc-400">
                  Modo Cotação Direta: no próximo passo basta introduzir o total de pontos obtidos de 0 a {totalScale}.
                </p>
                {selectedCriteriaIds.length > 0 && (
                  <p className="text-[11px] text-blue-300">
                    A nota obtida será aplicada aos domínios selecionados:{' '}
                    <strong>
                      {currentSubjectCriteria
                        .filter((c) => selectedCriteriaIds.includes(c.id))
                        .map((c) => `${c.name} (${c.percentage}%)`)
                        .join(', ')}
                    </strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action button to Step 2 */}
          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full py-4 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-ios-glow-blue flex items-center justify-center gap-2 ios-pressable transition-all"
          >
            <span>Avançar para Lançamento de Notas</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: CÁLCULO E INTRODUÇÃO DE VALORES EM TEMPO REAL     */}
      {/* ======================================================== */}
      {step === 2 && (
        <div className="space-y-5 animate-fade-in">
          {/* Live Grade Display Card */}
          <GradeDisplayCard
            obtainedPoints={currentTotalObtained}
            totalScale={mode === 'direct' ? totalScale : currentTotalMaxPoints}
            grade20={currentGrade20}
            weight={weight}
            subject={finalSubjectName}
          />

          {/* Test Title / Info Quick Edit */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Identificação do Teste (Opcional)
              </label>
              <input
                type="text"
                placeholder={`Ex: 1º Teste de ${finalSubjectName}`}
                value={title}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitle(val);
                  if (!initialTest && val.trim().length >= 3) {
                    const detected = detectEvaluationType(val);
                    if (detected !== evalType) {
                      setEvalType(detected);
                      setWeight(EVALUATION_TYPE_CONFIGS[detected].defaultWeight);
                    }
                  }
                }}
                className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-zinc-500 block mb-1">Data de Realização</span>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="flex flex-col justify-end">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-left py-1.5 px-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs flex items-center justify-between border border-white/5 ios-pressable"
                >
                  <span className="truncate">{finalSubjectName}</span>
                  <span className="text-blue-400 font-medium ml-1">Editar</span>
                </button>
              </div>
            </div>

            {/* Ponderação & Tipo badge in Step 2 */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${EVALUATION_TYPE_CONFIGS[evalType].badgeClass.bg} ${EVALUATION_TYPE_CONFIGS[evalType].badgeClass.text} ${EVALUATION_TYPE_CONFIGS[evalType].badgeClass.border}`}>
                  {EVALUATION_TYPE_CONFIGS[evalType].shortLabel}
                </span>
                <span className="text-zinc-400">
                  Peso na Média: <strong className="text-white">{formatWeight(weight)}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-blue-400 hover:text-blue-300 font-medium ios-pressable"
              >
                Ajustar Peso
              </button>
            </div>

            {currentSubjectCriteria.length > 0 && (
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400 uppercase font-semibold tracking-wider">
                    Domínios Presentes
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-blue-400 hover:underline font-medium"
                  >
                    Alterar seleção
                  </button>
                </div>
                {selectedCriteriaIds.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {currentSubjectCriteria
                      .filter((c) => selectedCriteriaIds.includes(c.id))
                      .map((c) => (
                        <span
                          key={c.id}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/25 font-medium"
                        >
                          {c.name} ({c.percentage}%)
                        </span>
                      ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-amber-400">Nenhum domínio selecionado</p>
                )}
              </div>
            )}
          </div>

          {/* Value Inputs: Mode Specific */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {mode === 'direct'
                  ? 'Cotação Obtida'
                  : mode === 'domains'
                  ? 'Pontuação por Domínio'
                  : 'Pontuação por Questão / Exercício'}
              </label>

              <span className="text-xs text-zinc-400 font-medium">
                Total: <strong className="text-white">{currentTotalObtained}</strong> /{' '}
                {mode === 'direct' ? totalScale : currentTotalMaxPoints} pts
              </span>
            </div>

            {/* Direct Mode Input */}
            {mode === 'direct' ? (
              <div className="space-y-3 py-2">
                <div className="flex items-center justify-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max={totalScale}
                    step="0.1"
                    value={directObtained || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDirectObtained(
                        isNaN(val) ? 0 : Math.max(0, Math.min(totalScale, val))
                      );
                    }}
                    placeholder="0"
                    autoFocus
                    className="w-36 text-center text-4xl font-black bg-zinc-950 border-2 border-blue-500/50 rounded-3xl py-3 px-2 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                  />
                  <span className="text-xl font-bold text-zinc-500">/ {totalScale} pts</span>
                  <button
                    type="button"
                    onClick={() =>
                      setNumpadConfig({
                        isOpen: true,
                        isDirect: true,
                        title: `Cotação de ${finalSubjectName}`,
                        maxScore: totalScale,
                        initialValue: directObtained,
                      })
                    }
                    title="Abrir teclado numérico tátil"
                    className="p-2.5 rounded-2xl bg-zinc-800 text-zinc-300 hover:text-white border border-white/5 active:scale-95 transition-all"
                  >
                    <Calculator className="w-5 h-5" />
                  </button>
                </div>

                {/* Slider for smooth dragging */}
                <input
                  type="range"
                  min="0"
                  max={totalScale}
                  step="0.5"
                  value={directObtained}
                  onChange={(e) => setDirectObtained(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />

                <div className="flex justify-between gap-2 pt-2">
                  {[0.5, 0.7, 0.85, 1].map((pct) => {
                    const score = Math.round(totalScale * pct);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDirectObtained(score)}
                        className="flex-1 py-1 px-2 rounded-xl bg-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-700 ios-pressable"
                      >
                        {pct * 100}% ({score} pts)
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Domains / Questions Input List */
              <div className="space-y-3">
                {domains.map((item, index) => {
                  const itemPct =
                    item.maxScore > 0 ? (item.obtainedScore / item.maxScore) * 100 : 0;
                  const itemGrade20 =
                    item.maxScore > 0 ? calculateGrade20(item.obtainedScore, item.maxScore) : 0;
                  const linkedCrit = item.criterionId
                    ? currentSubjectCriteria.find((c) => c.id === item.criterionId)
                    : undefined;

                  return (
                    <div
                      key={item.id}
                      className="bg-zinc-950/80 p-3 rounded-2xl border border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="min-w-0">
                          <span className="font-semibold text-white block truncate">
                            {item.name || `Item ${index + 1}`}
                          </span>
                          {linkedCrit && (
                            <span className="text-[10px] text-blue-400 font-medium">
                              Critério: {linkedCrit.percentage}% na disciplina
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max={item.maxScore}
                            step="0.5"
                            value={item.obtainedScore || ''}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateDomain(item.id, 'obtainedScore', e.target.value)
                            }
                            className="w-16 bg-zinc-900 border border-white/10 rounded-xl px-2 py-1 text-right text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setNumpadConfig({
                                isOpen: true,
                                domainId: item.id,
                                title: item.name || `Item ${index + 1}`,
                                maxScore: item.maxScore,
                                initialValue: item.obtainedScore,
                              })
                            }
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white active:scale-95 transition-all"
                            title="Abrir teclado numérico"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-zinc-500 font-medium">/ {item.maxScore}</span>
                        </div>
                      </div>

                      {/* Mini slider / progress indicator per domain */}
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max={item.maxScore}
                          step="0.5"
                          value={item.obtainedScore}
                          onChange={(e) =>
                            handleUpdateDomain(item.id, 'obtainedScore', Number(e.target.value))
                          }
                          className="w-full accent-blue-500 h-1.5 rounded-lg cursor-pointer"
                        />
                        <span className="text-[10px] text-zinc-400 font-mono shrink-0 text-right">
                          {itemGrade20.toFixed(1)} val • {itemPct.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notes field */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Observações / Tópicos a rever
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Errei a questão 2 por falta de atenção na regra de derivação..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              className={`w-full py-4 px-5 rounded-2xl font-semibold text-sm shadow-ios-glow-blue flex items-center justify-center gap-2 ios-pressable transition-all ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {saveSuccess ? (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>Nota Guardada com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 stroke-[2.2]" />
                  <span>Guardar Teste na Caderneta</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs border border-white/10 flex items-center justify-center gap-1.5 ios-pressable transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Alterar Configuração da Cotação</span>
            </button>
          </div>
        </div>
      )}

      {/* IAVE Exam Presets Modal */}
      <IAVEPresetsModal
        isOpen={isIAVEModalOpen}
        onClose={() => setIsIAVEModalOpen(false)}
        onSelectPreset={handleSelectIAVEPreset}
      />

      {/* Tactile iOS Numpad Modal */}
      <NumpadModal
        isOpen={numpadConfig.isOpen}
        title={numpadConfig.title}
        maxScore={numpadConfig.maxScore}
        initialValue={numpadConfig.initialValue}
        onClose={() => setNumpadConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={(val) => {
          if (numpadConfig.isDirect) {
            setDirectObtained(val);
          } else if (numpadConfig.domainId) {
            handleUpdateDomain(numpadConfig.domainId, 'obtainedScore', val);
          }
        }}
      />

      {/* Subject Criteria Configuration Modal */}
      <SubjectCriteriaModal
        isOpen={isCriteriaModalOpen}
        onClose={() => setIsCriteriaModalOpen(false)}
        subjectName={finalSubjectName}
        criteriaMap={subjectCriteria}
        onSave={handleSaveWizardCriteria}
      />
    </div>
  );
};
