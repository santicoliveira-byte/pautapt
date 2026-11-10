import React, { useState } from 'react';
import {
  DomainItem,
  EvaluationMode,
  SchoolTest,
} from '../types';
import {
  PORTUGAL_DEFAULT_SUBJECTS,
  ANNUAL_12TH_SUBJECTS,
  SCALE_PRESETS,
  calculateGrade20,
  getClassification,
} from '../utils/gradeUtils';
import { GradeDisplayCard } from './GradeDisplayCard';
import { IAVEPresetsModal, IAVEPreset } from './IAVEPresetsModal';
import { NumpadModal } from './NumpadModal';
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
} from 'lucide-react';

interface TestWizardProps {
  onSaveTest: (test: SchoolTest) => void;
  onCancel?: () => void;
  initialTest?: SchoolTest | null;
}

export const TestWizard: React.FC<TestWizardProps> = ({
  onSaveTest,
  initialTest,
}) => {
  // Wizard Step: 1 = Configuração, 2 = Introdução de Valores & Cálculo
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [subject, setSubject] = useState<string>(initialTest?.subject || 'Matemática A');
  const [customSubject, setCustomSubject] = useState<string>('');
  const [title, setTitle] = useState<string>(initialTest?.title || '');
  const term = initialTest?.term || 'Geral';
  const [date, setDate] = useState<string>(
    initialTest?.date || new Date().toISOString().split('T')[0]
  );
  const weight = initialTest?.weight ?? 1;
  const [totalScale, setTotalScale] = useState<number>(initialTest?.totalScale || 200);
  const [customScaleInput, setCustomScaleInput] = useState<string>('');
  const [mode, setMode] = useState<EvaluationMode>(initialTest?.mode || 'domains');

  // Domains / Questions state
  const [domains, setDomains] = useState<DomainItem[]>(
    initialTest?.domains && initialTest.domains.length > 0
      ? initialTest.domains
      : [
          { id: '1', name: 'Domínio 1 (ex: Conhecimento)', maxScore: 80, obtainedScore: 0 },
          { id: '2', name: 'Domínio 2 (ex: Raciocínio & Cálculo)', maxScore: 80, obtainedScore: 0 },
          { id: '3', name: 'Domínio 3 (ex: Comunicação)', maxScore: 40, obtainedScore: 0 },
        ]
  );

  // Direct calculation obtained points
  const [directObtained, setDirectObtained] = useState<number>(
    initialTest?.obtainedPoints || 0
  );

  const [notes, setNotes] = useState<string>(initialTest?.notes || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync state whenever initialTest changes (e.g. user clicked "+ Teste" for an annual subject)
  React.useEffect(() => {
    if (initialTest) {
      setSubject(initialTest.subject || 'Matemática A');
      setTitle(initialTest.title || '');
      setDate(initialTest.date || new Date().toISOString().split('T')[0]);
      setTotalScale(initialTest.totalScale || 200);
      setMode(initialTest.mode || 'domains');
      if (initialTest.domains && initialTest.domains.length > 0) {
        setDomains(initialTest.domains);
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

  // Helper to switch to custom subject if selected
  const handleSubjectSelect = (sub: string) => {
    if (sub === 'OUTRA') {
      setSubject('OUTRA');
    } else {
      setSubject(sub);
      setCustomSubject('');
    }
  };

  const finalSubjectName = subject === 'OUTRA' ? customSubject.trim() || 'Outra Disciplina' : subject;

  // Add domain
  const handleAddDomain = () => {
    const nextId = String(Date.now());
    const count = domains.length + 1;
    const defaultName =
      mode === 'domains'
        ? `Domínio ${count}`
        : `Questão ${count}`;

    setDomains([
      ...domains,
      { id: nextId, name: defaultName, maxScore: 20, obtainedScore: 0 },
    ]);
  };

  // Remove domain
  const handleRemoveDomain = (id: string) => {
    if (domains.length <= 1) return;
    setDomains(domains.filter((d) => d.id !== id));
  };

  // Update domain field
  const handleUpdateDomain = (
    id: string,
    field: 'name' | 'maxScore' | 'obtainedScore',
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
        return d;
      })
    );
  };

  // Switch mode and configure defaults
  const handleModeChange = (newMode: EvaluationMode) => {
    setMode(newMode);
    if (newMode === 'questions' && (!domains.length || domains[0].name.startsWith('Domínio'))) {
      setDomains([
        { id: 'q1', name: 'Grupo I / Q1', maxScore: 50, obtainedScore: 0 },
        { id: 'q2', name: 'Grupo II / Q2', maxScore: 75, obtainedScore: 0 },
        { id: 'q3', name: 'Grupo III / Q3', maxScore: 75, obtainedScore: 0 },
      ]);
    } else if (newMode === 'domains' && (!domains.length || domains[0].name.startsWith('Grupo'))) {
      setDomains([
        { id: 'd1', name: 'Domínio 1 (Conhecimento)', maxScore: 80, obtainedScore: 0 },
        { id: 'd2', name: 'Domínio 2 (Raciocínio & Cálculo)', maxScore: 80, obtainedScore: 0 },
        { id: 'd3', name: 'Domínio 3 (Comunicação)', maxScore: 40, obtainedScore: 0 },
      ]);
    }
  };

  // Quick distribution: scale domains proportionally to match totalScale
  const handleAutoAdjustDomainsToScale = () => {
    const currentSum = domains.reduce((acc, d) => acc + d.maxScore, 0);
    if (currentSum === 0) return;
    const factor = totalScale / currentSum;

    let accumulated = 0;
    const updated = domains.map((d, index) => {
      if (index === domains.length - 1) {
        // give remaining to last to avoid rounding errors
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

    const newTest: SchoolTest = {
      id: initialTest?.id || String(Date.now()),
      title: effectiveTitle,
      subject: finalSubjectName,
      totalScale: scaleToUse,
      weight: Number(weight) || 0,
      mode,
      domains: mode === 'direct' ? [] : domains,
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
                onChange={(e) => setCustomSubject(e.target.value)}
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

          {/* Card: Cotação Total e Ponderação */}
          <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-4">
            <div>
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
                    onClick={() => {
                      setTotalScale(preset.value);
                      setCustomScaleInput('');
                    }}
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
                      Ajustar a {totalScale}
                    </button>
                  </div>
                </div>

                {domains.map((domain, index) => (
                  <div
                    key={domain.id}
                    className="flex items-center gap-2 bg-zinc-950/70 p-2 rounded-2xl border border-white/5"
                  >
                    <span className="text-xs text-zinc-500 font-mono w-4 text-center">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={domain.name}
                      onChange={(e) => handleUpdateDomain(domain.id, 'name', e.target.value)}
                      placeholder="Nome do domínio..."
                      className="flex-1 bg-transparent text-xs text-white placeholder-zinc-600 focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5">
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
                ))}

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
              <div className="bg-zinc-950/60 rounded-2xl p-3 border border-white/5 text-center">
                <p className="text-xs text-zinc-400">
                  Modo Cotação Direta: no próximo passo basta introduzir o total de pontos obtidos de 0 a {totalScale}.
                </p>
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
                onChange={(e) => setTitle(e.target.value)}
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

                  return (
                    <div
                      key={item.id}
                      className="bg-zinc-950/80 p-3 rounded-2xl border border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white">
                          {item.name || `Item ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-1.5">
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
                        <span className="text-[10px] text-zinc-400 font-mono w-9 text-right">
                          {itemPct.toFixed(0)}%
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
    </div>
  );
};
