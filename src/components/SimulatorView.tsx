import React, { useState } from 'react';
import { SchoolTest } from '../types';
import {
  calculateSubjectStats,
  simulateRequiredGrade,
  PORTUGAL_DEFAULT_SUBJECTS,
  SCALE_PRESETS,
} from '../utils/gradeUtils';
import { HigherEducationSimulator } from './HigherEducationSimulator';
import { SecondaryAverageCalculator } from './SecondaryAverageCalculator';
import { triggerHaptic } from '../utils/haptics';
import {
  Target,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  Award,
} from 'lucide-react';

interface SimulatorViewProps {
  tests: SchoolTest[];
  initialSubject?: string;
  initialTab?: 'test' | 'secondary' | 'higher-ed';
  onNavigateToCalculatorWithParams?: (subject: string, targetScore: number) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  tests,
  initialSubject,
  initialTab = 'secondary',
}) => {
  const [simulatorTab, setSimulatorTab] = useState<'test' | 'secondary' | 'higher-ed'>(initialTab);
  const subjectStats = calculateSubjectStats(tests);
  const existingSubjectNames = Object.keys(subjectStats);

  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubject && existingSubjectNames.includes(initialSubject)
      ? initialSubject
      : existingSubjectNames[0] || 'Matemática A'
  );

  const activeStat = subjectStats[selectedSubject];

  // Simulator inputs
  const [currentAvg, setCurrentAvg] = useState<number>(
    activeStat ? activeStat.weightedAverage : 13.5
  );
  const [currentWeight, setCurrentWeight] = useState<number>(
    activeStat ? activeStat.totalWeight : 40
  );
  const [nextWeight, setNextWeight] = useState<number>(35);
  const [targetAverage, setTargetAverage] = useState<number>(16.0);
  const [testScale, setTestScale] = useState<number>(200);

  // Sync when subject dropdown changes
  const handleSubjectChange = (name: string) => {
    setSelectedSubject(name);
    const stat = subjectStats[name];
    if (stat) {
      setCurrentAvg(stat.weightedAverage);
      setCurrentWeight(stat.totalWeight);
    }
  };

  // Calculation
  const currentWeightedSum = currentAvg * currentWeight;
  const simulation = simulateRequiredGrade(
    currentWeightedSum,
    currentWeight,
    nextWeight,
    targetAverage
  );

  const requiredPointsOnScale = Math.round((simulation.requiredGrade / 20) * testScale);

  const getFeasibilityStatus = () => {
    if (simulation.requiredGrade <= 0) {
      return {
        label: 'Meta Já Garantida!',
        desc: 'Mesmo tirando 0 no próximo teste, a tua média ficará igual ou acima do objetivo.',
        badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        icon: CheckCircle,
      };
    }
    if (simulation.requiredGrade > 20.0) {
      return {
        label: 'Matematicamente Impossível',
        desc: `Exigiria uma nota de ${simulation.requiredGrade.toFixed(1)} valores (o máximo é 20.0). Considera ajustar a meta ou o peso.`,
        badge: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: AlertCircle,
      };
    }
    if (simulation.requiredGrade >= 18.0) {
      return {
        label: 'Meta Muito Exigente (Excelente)',
        desc: 'Precisas de um teste praticamente perfeito, mas é perfeitamente possível!',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        icon: Sparkles,
      };
    }
    return {
      label: 'Meta Perfeitamente Atingível',
      desc: 'Com estudo focado nos domínios do teste, atinges esta média com tranquilidade.',
      badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      icon: TrendingUp,
    };
  };

  const status = getFeasibilityStatus();
  const StatusIcon = status.icon;

  // Segmented Tabs Header Component
  const renderSegmentedTabs = () => (
    <div className="grid grid-cols-3 p-1 bg-zinc-950 rounded-2xl border border-white/5 mb-3">
      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setSimulatorTab('secondary');
        }}
        className={`py-2 px-1 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
          simulatorTab === 'secondary'
            ? 'bg-zinc-800 text-white shadow-sm font-bold'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
        <span className="truncate">Secundário</span>
      </button>

      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setSimulatorTab('test');
        }}
        className={`py-2 px-1 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
          simulatorTab === 'test'
            ? 'bg-zinc-800 text-white shadow-sm font-bold'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Target className="w-3.5 h-3.5 text-amber-400" />
        <span className="truncate">Próximo Teste</span>
      </button>

      <button
        type="button"
        onClick={() => {
          triggerHaptic('light');
          setSimulatorTab('higher-ed');
        }}
        className={`py-2 px-1 text-[11px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1 ${
          simulatorTab === 'higher-ed'
            ? 'bg-zinc-800 text-white shadow-sm font-bold'
            : 'text-zinc-400 hover:text-white'
        }`}
      >
        <Award className="w-3.5 h-3.5 text-purple-400" />
        <span className="truncate">CNAES</span>
      </button>
    </div>
  );

  if (simulatorTab === 'secondary') {
    return (
      <div className="max-w-md mx-auto pt-2 px-4 space-y-3">
        {renderSegmentedTabs()}
        <SecondaryAverageCalculator tests={tests} />
      </div>
    );
  }

  if (simulatorTab === 'higher-ed') {
    return (
      <div className="max-w-md mx-auto pt-2 px-4 space-y-3">
        {renderSegmentedTabs()}
        <HigherEducationSimulator tests={tests} />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-28 pt-2 px-4 space-y-4 animate-fade-in">
      {renderSegmentedTabs()}
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Target className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Simulador de Metas</h2>
            <p className="text-xs text-zinc-400">
              Descobre a nota necessária no próximo teste para atingir a tua média
            </p>
          </div>
        </div>
      </div>

      {/* Main Result Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 border border-white/10 shadow-ios-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Nota Necessária no Próximo Teste
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${status.badge}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-5xl font-black tracking-tight ${
                simulation.requiredGrade > 20
                  ? 'text-red-400'
                  : simulation.requiredGrade <= 0
                  ? 'text-emerald-400'
                  : 'text-white'
              }`}
            >
              {simulation.requiredGrade <= 0
                ? '0.0'
                : simulation.requiredGrade.toFixed(1)}
            </span>
            <span className="text-xl font-semibold text-zinc-500">/ 20 valores</span>
          </div>

          <div className="text-right">
            <div className="text-xl font-bold text-blue-400">
              {simulation.requiredGrade <= 0 ? 0 : Math.min(testScale, requiredPointsOnScale)} pts
            </div>
            <div className="text-[10px] text-zinc-400">
              na escala de {testScale}
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
          {status.desc}
        </p>
      </div>

      {/* Simulator Controls Card */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-ios-card space-y-4">
        {/* Subject selection */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Disciplina
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {existingSubjectNames.length > 0 && (
              <optgroup label="Disciplinas com Testes Registados">
                {existingSubjectNames.map((s) => (
                  <option key={s} value={s}>
                    {s} (Média atual: {subjectStats[s].weightedAverage.toFixed(1)})
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Outras Disciplinas">
              {PORTUGAL_DEFAULT_SUBJECTS.filter((s) => !existingSubjectNames.includes(s)).map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </optgroup>
          </select>
        </div>

        {/* Target Average Slider & Quick buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Média Final Desejada (Meta)
            </label>
            <span className="text-sm font-bold text-amber-400">
              {targetAverage.toFixed(1)} valores
            </span>
          </div>
          <input
            type="range"
            min="9.5"
            max="20"
            step="0.5"
            value={targetAverage}
            onChange={(e) => setTargetAverage(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between gap-1.5 pt-2">
            {[10, 12, 14, 16, 18, 20].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTargetAverage(t)}
                className={`flex-1 py-1 rounded-xl text-[11px] font-semibold border transition-all ios-pressable ${
                  targetAverage === t
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-zinc-800/60 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Current State: Média atual & Peso atual */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Média Atual (0-20)
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={currentAvg}
              onChange={(e) => setCurrentAvg(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Peso Já Avaliado (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={currentWeight}
                onChange={(e) => setCurrentWeight(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-2 text-xs text-zinc-500">%</span>
            </div>
          </div>
        </div>

        {/* Next Test Parameters: Peso & Escala */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Peso do Próximo Teste
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="100"
                value={nextWeight}
                onChange={(e) => setNextWeight(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-2 text-xs text-zinc-500">%</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
              Escala da Cotação
            </label>
            <select
              value={testScale}
              onChange={(e) => setTestScale(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-2.5 py-2 text-xs text-white focus:outline-none cursor-pointer"
            >
              {SCALE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.value} {p.unit}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
