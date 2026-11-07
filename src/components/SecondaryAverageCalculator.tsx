import React, { useState, useEffect } from 'react';
import { SchoolTest } from '../types';
import { calculateSubjectStats } from '../utils/gradeUtils';
import { triggerHaptic } from '../utils/haptics';
import { triggerCelebration } from '../utils/confetti';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface SecondaryAverageCalculatorProps {
  tests: SchoolTest[];
}

const STORAGE_KEY_SECONDARY = 'pautapt_secondary_grades_v1';

export const SecondaryAverageCalculator: React.FC<SecondaryAverageCalculatorProps> = ({ tests }) => {
  const subjectStats = calculateSubjectStats(tests);
  const subjectList = Object.values(subjectStats);

  // Real-time 12th year average from tests in app
  let testsSum = 0;
  let testsWeight = 0;
  tests.forEach((t) => {
    testsSum += t.grade20 * (t.weight > 0 ? t.weight : 1);
    testsWeight += t.weight > 0 ? t.weight : 1;
  });

  const calculated12thAvg =
    testsWeight > 0 ? Number((testsSum / testsWeight).toFixed(2)) : null;

  // Stored 10th and 11th year grades
  const [grade10, setGrade10] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SECONDARY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.grade10 === 'number') return parsed.grade10;
      }
    } catch {
      // ignore
    }
    return 15.0;
  });

  const [grade11, setGrade11] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SECONDARY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.grade11 === 'number') return parsed.grade11;
      }
    } catch {
      // ignore
    }
    return 15.5;
  });

  // 12th year grade: uses calculated tests average by default, or manual override
  const [override12, setOverride12] = useState<boolean>(false);
  const [manualGrade12, setManualGrade12] = useState<number>(16.0);

  const effectiveGrade12 = override12
    ? manualGrade12
    : calculated12thAvg !== null
    ? calculated12thAvg
    : manualGrade12;

  // Target final secondary average
  const [targetSecondary, setTargetSecondary] = useState<number>(16.0);

  // Save 10th and 11th to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_SECONDARY,
        JSON.stringify({ grade10, grade11 })
      );
    } catch {
      // ignore
    }
  }, [grade10, grade11]);

  // Overall Secondary Average: (10th + 11th + 12th) / 3
  const overallSecondaryAverage = Number(
    ((grade10 + grade11 + effectiveGrade12) / 3).toFixed(2)
  );
  const overallSecondaryPoints200 = Number(
    (overallSecondaryAverage * 10).toFixed(1)
  );

  // Required 12th grade to reach target secondary average:
  // target = (10 + 11 + req12) / 3 => req12 = target * 3 - (10 + 11)
  const required12thGrade = Number(
    (targetSecondary * 3 - (grade10 + grade11)).toFixed(2)
  );

  const handleCelebrate = () => {
    triggerHaptic('success');
    triggerCelebration();
  };

  return (
    <div className="max-w-md mx-auto pb-28 pt-2 px-4 space-y-4 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Média do Ensino Secundário
            </h2>
            <p className="text-[11px] text-zinc-400">
              Combinação do 10º, 11º e testes do 12º ano (escala 0-20 e 0-200)
            </p>
          </div>
        </div>
      </div>

      {/* Hero Display: Final Secondary Average */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 border border-blue-500/30 shadow-ios-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Média Final do Secundário Prevista
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            10º + 11º + 12º
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-white">
              {overallSecondaryAverage.toFixed(1)}
            </span>
            <span className="text-lg font-semibold text-zinc-500">/ 20 val</span>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">
              {overallSecondaryPoints200.toFixed(0)} pts
            </div>
            <div className="text-[10px] text-zinc-500">na escala de 200</div>
          </div>
        </div>

        {/* 3 Years Distribution Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-white/5">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">
                10º Ano
              </span>
              <span className="text-sm font-bold text-zinc-200">
                {grade10.toFixed(1)} val
              </span>
            </div>
            <div className="p-2 rounded-xl bg-zinc-950/60 border border-white/5">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">
                11º Ano
              </span>
              <span className="text-sm font-bold text-zinc-200">
                {grade11.toFixed(1)} val
              </span>
            </div>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <span className="text-[10px] text-blue-400 uppercase block font-medium">
                12º Ano (Atual)
              </span>
              <span className="text-sm font-bold text-blue-400">
                {effectiveGrade12.toFixed(1)} val
              </span>
            </div>
          </div>
        </div>

        {overallSecondaryAverage >= 17.0 && (
          <button
            onClick={handleCelebrate}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/20 flex items-center justify-center gap-1.5 ios-pressable transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Média de Excelência para a Universidade! Celebrar 🎉</span>
          </button>
        )}
      </div>

      {/* Input Form Card */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-4">
        {/* 10º Ano Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Média do 10º Ano
            </label>
            <span className="text-xs font-bold text-white">
              {grade10.toFixed(1)} valores
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="20"
            step="0.1"
            value={grade10}
            onChange={(e) => {
              triggerHaptic('light');
              setGrade10(Number(e.target.value));
            }}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        {/* 11º Ano Input */}
        <div className="pt-2 border-t border-white/5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Média do 11º Ano
            </label>
            <span className="text-xs font-bold text-white">
              {grade11.toFixed(1)} valores
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="20"
            step="0.1"
            value={grade11}
            onChange={(e) => {
              triggerHaptic('light');
              setGrade11(Number(e.target.value));
            }}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        {/* 12º Ano Input (Auto from tests or Manual) */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Média do 12º Ano
              </label>
              <span className="text-[10px] text-zinc-500">
                {calculated12thAvg !== null && !override12
                  ? `Calculada automaticamente (${tests.length} testes registados)`
                  : 'Modo de simulação manual'}
              </span>
            </div>

            {calculated12thAvg !== null && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('medium');
                  setOverride12(!override12);
                }}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                  override12
                    ? 'bg-zinc-800 border-white/10 text-zinc-400'
                    : 'bg-blue-600 border-blue-500 text-white'
                }`}
              >
                {override12 ? 'Voltar aos Testes' : 'Usar Testes da App'}
              </button>
            )}
          </div>

          {override12 || calculated12thAvg === null ? (
            <div className="space-y-1 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Simular valor:</span>
                <span className="font-bold text-blue-400">
                  {manualGrade12.toFixed(1)} valores
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="20"
                step="0.1"
                value={manualGrade12}
                onChange={(e) => {
                  triggerHaptic('light');
                  setManualGrade12(Number(e.target.value));
                }}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-zinc-950/80 border border-blue-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-zinc-300 font-medium">
                  {subjectList.length} disciplinas registadas no 12º
                </span>
              </div>
              <span className="text-sm font-bold text-blue-400">
                {calculated12thAvg.toFixed(2)} val
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Target Simulator: What grade is needed in the 12th year? */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Simulador de Meta Final do Secundário
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-400">
            Meta: {targetSecondary.toFixed(1)} val
          </span>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Descobre que média precisas de manter no 12º ano para atingires a média pretendida nos 3 anos:
        </p>

        {/* Target Slider */}
        <input
          type="range"
          min="12"
          max="20"
          step="0.5"
          value={targetSecondary}
          onChange={(e) => {
            triggerHaptic('light');
            setTargetSecondary(Number(e.target.value));
          }}
          className="w-full accent-amber-400 cursor-pointer"
        />

        {/* Simulation Output Pill */}
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
            required12thGrade <= effectiveGrade12
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : required12thGrade <= 20.0
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <div>
            <div className="font-semibold">
              {required12thGrade <= effectiveGrade12
                ? 'Meta Superada!'
                : required12thGrade <= 20.0
                ? 'Média Necessária no 12º:'
                : 'Matematicamente Impossível:'}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {required12thGrade <= effectiveGrade12
                ? `A tua média atual do 12º (${effectiveGrade12.toFixed(1)}) já garante esta meta.`
                : required12thGrade <= 20.0
                ? `Precisas de média de ${required12thGrade.toFixed(1)} valores nos testes do 12º ano.`
                : `Exigiria ${required12thGrade.toFixed(1)} valores no 12º ano (o máximo é 20.0).`}
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-black">
              {required12thGrade <= 0
                ? '0.0'
                : required12thGrade > 20
                ? '> 20'
                : required12thGrade.toFixed(1)}
            </span>
            <span className="text-[10px] block opacity-80">/ 20 val</span>
          </div>
        </div>
      </div>
    </div>
  );
};
