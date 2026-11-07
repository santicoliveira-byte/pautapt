import React, { useState, useEffect } from 'react';
import { SchoolTest } from '../types';
import { calculateSubjectStats } from '../utils/gradeUtils';
import { triggerHaptic } from '../utils/haptics';
import { triggerCelebration } from '../utils/confetti';
import {
  GraduationCap,
  Sparkles,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';

export type SubjectType = 'trienal' | 'bienal' | 'anual';

export interface SecondarySubject {
  id: string;
  name: string;
  type: SubjectType;
  grade10: number; // 0-20
  grade11: number; // 0-20
  grade12: number; // 0-20
  useAppTests: boolean;
}

const STORAGE_KEY_SUBJECTS = 'pautapt_secondary_subjects_v2';
const STORAGE_KEY_COURSE = 'pautapt_secondary_course_v1';

// Default presets for Portuguese secondary courses
const COURSE_PRESETS: Record<string, { label: string; subjects: Omit<SecondarySubject, 'id'>[] }> = {
  ct: {
    label: 'Ciências e Tecnologias (CT)',
    subjects: [
      // Trienais (3 anos)
      { name: 'Português', type: 'trienal', grade10: 15, grade11: 15, grade12: 15, useAppTests: true },
      { name: 'Matemática A', type: 'trienal', grade10: 16, grade11: 16, grade12: 16, useAppTests: true },
      { name: 'Educação Física', type: 'trienal', grade10: 17, grade11: 17, grade12: 17, useAppTests: false },
      // Bienais (2 anos: 10º e 11º)
      { name: 'Físico-Química A', type: 'bienal', grade10: 15, grade11: 15, grade12: 0, useAppTests: false },
      { name: 'Biologia e Geologia', type: 'bienal', grade10: 15, grade11: 15, grade12: 0, useAppTests: false },
      { name: 'Filosofia', type: 'bienal', grade10: 16, grade11: 16, grade12: 0, useAppTests: false },
      { name: 'Inglês', type: 'bienal', grade10: 17, grade11: 17, grade12: 0, useAppTests: false },
      // Anuais (12º ano)
      { name: 'Opção 12º (ex: Química)', type: 'anual', grade10: 0, grade11: 0, grade12: 16, useAppTests: true },
      { name: 'Opção 12º (ex: Biologia)', type: 'anual', grade10: 0, grade11: 0, grade12: 16, useAppTests: true },
    ],
  },
  cse: {
    label: 'Ciências Socioeconómicas (CSE)',
    subjects: [
      { name: 'Português', type: 'trienal', grade10: 15, grade11: 15, grade12: 15, useAppTests: true },
      { name: 'Matemática A', type: 'trienal', grade10: 16, grade11: 16, grade12: 16, useAppTests: true },
      { name: 'Educação Física', type: 'trienal', grade10: 17, grade11: 17, grade12: 17, useAppTests: false },
      { name: 'Economia A', type: 'bienal', grade10: 16, grade11: 16, grade12: 0, useAppTests: false },
      { name: 'Geografia A', type: 'bienal', grade10: 15, grade11: 15, grade12: 0, useAppTests: false },
      { name: 'Filosofia', type: 'bienal', grade10: 15, grade11: 15, grade12: 0, useAppTests: false },
      { name: 'Inglês', type: 'bienal', grade10: 16, grade11: 16, grade12: 0, useAppTests: false },
      { name: 'Opção 12º (ex: Sociologia)', type: 'anual', grade10: 0, grade11: 0, grade12: 16, useAppTests: true },
      { name: 'Opção 12º (ex: Psicologia B)', type: 'anual', grade10: 0, grade11: 0, grade12: 16, useAppTests: true },
    ],
  },
  lh: {
    label: 'Línguas e Humanidades (LH)',
    subjects: [
      { name: 'Português', type: 'trienal', grade10: 16, grade11: 16, grade12: 16, useAppTests: true },
      { name: 'História A', type: 'trienal', grade10: 16, grade11: 16, grade12: 16, useAppTests: true },
      { name: 'Educação Física', type: 'trienal', grade10: 17, grade11: 17, grade12: 17, useAppTests: false },
      { name: 'Geografia A', type: 'bienal', grade10: 15, grade11: 15, grade12: 0, useAppTests: false },
      { name: 'MACS / Literatura', type: 'bienal', grade10: 15, grade11: 15, grade12: 0, useAppTests: false },
      { name: 'Filosofia', type: 'bienal', grade10: 16, grade11: 16, grade12: 0, useAppTests: false },
      { name: 'Inglês', type: 'bienal', grade10: 17, grade11: 17, grade12: 0, useAppTests: false },
      { name: 'Opção 12º (ex: Psicologia B)', type: 'anual', grade10: 0, grade11: 0, grade12: 16, useAppTests: true },
      { name: 'Opção 12º (ex: Sociologia)', type: 'anual', grade10: 0, grade11: 0, grade12: 16, useAppTests: true },
    ],
  },
  av: {
    label: 'Artes Visuais (AV)',
    subjects: [
      { name: 'Português', type: 'trienal', grade10: 15, grade11: 15, grade12: 15, useAppTests: true },
      { name: 'Desenho A', type: 'trienal', grade10: 17, grade11: 17, grade12: 17, useAppTests: true },
      { name: 'Educação Física', type: 'trienal', grade10: 17, grade11: 17, grade12: 17, useAppTests: false },
      { name: 'Geometria Descritiva A', type: 'bienal', grade10: 16, grade11: 16, grade12: 0, useAppTests: false },
      { name: 'História da Cultura e Artes', type: 'bienal', grade10: 16, grade11: 16, grade12: 0, useAppTests: false },
      { name: 'Filosofia', type: 'bienal', grade10: 15, grade11: 15, grade12: 0, useAppTests: false },
      { name: 'Inglês', type: 'bienal', grade10: 16, grade11: 16, grade12: 0, useAppTests: false },
      { name: 'Opção 12º (ex: Oficina de Artes)', type: 'anual', grade10: 0, grade11: 0, grade12: 17, useAppTests: true },
      { name: 'Opção 12º (ex: Materiais)', type: 'anual', grade10: 0, grade11: 0, grade12: 16, useAppTests: true },
    ],
  },
};

interface SecondaryAverageCalculatorProps {
  tests: SchoolTest[];
}

export const SecondaryAverageCalculator: React.FC<SecondaryAverageCalculatorProps> = ({ tests }) => {
  const subjectStats = calculateSubjectStats(tests);

  // Selected course preset
  const [selectedCourse, setSelectedCourse] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_COURSE) || 'ct';
    } catch {
      return 'ct';
    }
  });

  // Subjects state
  const [subjects, setSubjects] = useState<SecondarySubject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBJECTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Default to CT preset
    return COURSE_PRESETS.ct.subjects.map((s, idx) => ({
      ...s,
      id: `subj-${idx}-${Date.now()}`,
    }));
  });

  // Target final average
  const [targetCFC, setTargetCFC] = useState<number>(16.5);
  const [isEditingCourse, setIsEditingCourse] = useState<boolean>(false);
  const [newSubjType, setNewSubjType] = useState<SubjectType>('bienal');
  const [newSubjName, setNewSubjName] = useState<string>('');

  // Save subjects to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBJECTS, JSON.stringify(subjects));
    } catch {
      // ignore
    }
  }, [subjects]);

  // Save selected course
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COURSE, selectedCourse);
    } catch {
      // ignore
    }
  }, [selectedCourse]);

  // Load a preset course
  const handleLoadCoursePreset = (courseKey: string) => {
    triggerHaptic('medium');
    setSelectedCourse(courseKey);
    const preset = COURSE_PRESETS[courseKey];
    if (preset) {
      setSubjects(
        preset.subjects.map((s, idx) => ({
          ...s,
          id: `subj-${idx}-${Date.now()}`,
        }))
      );
    }
  };

  // Helper to compute effective 12th grade for a subject
  const getEffectiveGrade12 = (s: SecondarySubject): number => {
    if (s.useAppTests && subjectStats[s.name]) {
      return subjectStats[s.name].weightedAverage;
    }
    return s.grade12 || 0;
  };

  // Helper to compute CFD (Classificação Final de Disciplina)
  const getSubjectCFD = (s: SecondarySubject): number => {
    if (s.type === 'trienal') {
      const g12 = getEffectiveGrade12(s);
      return Number(((s.grade10 + s.grade11 + g12) / 3).toFixed(2));
    }
    if (s.type === 'bienal') {
      return Number(((s.grade10 + s.grade11) / 2).toFixed(2));
    }
    // Anual
    return getEffectiveGrade12(s);
  };

  // Overall Secondary Average (Classificação Final de Curso - CFC)
  const cfdList = subjects.map((s) => getSubjectCFD(s));
  const finalCFC =
    cfdList.length > 0
      ? Number(
          (cfdList.reduce((acc, curr) => acc + curr, 0) / cfdList.length).toFixed(2)
        )
      : 0;

  const finalCFCPoints200 = Number((finalCFC * 10).toFixed(1));

  // Update subject grades
  const updateSubjectField = (
    id: string,
    field: 'grade10' | 'grade11' | 'grade12' | 'useAppTests' | 'name',
    val: number | boolean | string
  ) => {
    setSubjects((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (typeof val === 'number') {
          return { ...s, [field]: Math.max(0, Math.min(20, val)) };
        }
        return { ...s, [field]: val };
      })
    );
  };

  // Add custom subject
  const handleAddSubject = () => {
    if (!newSubjName.trim()) return;
    triggerHaptic('medium');
    const newSubj: SecondarySubject = {
      id: `custom-${Date.now()}`,
      name: newSubjName.trim(),
      type: newSubjType,
      grade10: 15,
      grade11: 15,
      grade12: 15,
      useAppTests: newSubjType !== 'bienal',
    };
    setSubjects((prev) => [...prev, newSubj]);
    setNewSubjName('');
  };

  // Remove subject
  const handleRemoveSubject = (id: string) => {
    triggerHaptic('light');
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  // Group subjects by Trienais, Bienais and Anuais
  const trienais = subjects.filter((s) => s.type === 'trienal');
  const bienais = subjects.filter((s) => s.type === 'bienal');
  const anuais = subjects.filter((s) => s.type === 'anual');

  // Target simulation:
  // CFC = (sum(fixed_CFD) + sum(trienal_CFDs_12) + sum(anual_CFDs_12)) / totalSubjects
  // How much average is needed in 12th year across the trienais and anuais?
  const non12thCFDSum = bienais.reduce((acc, b) => acc + getSubjectCFD(b), 0);
  const trienais1011Sum = trienais.reduce((acc, t) => acc + (t.grade10 + t.grade11) / 3, 0);
  const totalCount = subjects.length;

  // targetCFC * totalCount = non12thCFDSum + trienais1011Sum + (1/3) * sum(trienais_12) + sum(anuais_12)
  const num12thSubjects = trienais.length * (1 / 3) + anuais.length;
  const needed12thSum =
    targetCFC * totalCount - non12thCFDSum - trienais1011Sum;
  const needed12thAverage =
    num12thSubjects > 0 ? Number((needed12thSum / num12thSubjects).toFixed(2)) : 0;

  const handleCelebrate = () => {
    triggerHaptic('success');
    triggerCelebration();
  };

  return (
    <div className="max-w-md mx-auto pb-28 pt-1 px-4 space-y-4 animate-fade-in">
      {/* Header & Course Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Média do Secundário (CFC)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Disciplinas Trienais, Bienais e Anuais
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsEditingCourse(!isEditingCourse);
          }}
          className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1 ios-pressable"
        >
          <Sliders className="w-3 h-3 text-blue-400" />
          <span>Mudar Curso</span>
        </button>
      </div>

      {/* Course Presets Drawer (when open) */}
      {isEditingCourse && (
        <div className="p-3.5 rounded-3xl bg-zinc-900 border border-white/10 space-y-2 animate-fade-in">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            Escolhe o teu Curso do Secundário:
          </span>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(COURSE_PRESETS).map(([key, c]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  handleLoadCoursePreset(key);
                  setIsEditingCourse(false);
                }}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all ios-pressable ${
                  selectedCourse === key
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-zinc-950/60 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Result Card (Hero) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 border border-blue-500/30 shadow-ios-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Média Final de Curso (CFC)
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {subjects.length} Disciplinas
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-white">
              {finalCFC.toFixed(1)}
            </span>
            <span className="text-lg font-semibold text-zinc-500">/ 20 val</span>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">
              {finalCFCPoints200.toFixed(0)} pts
            </div>
            <div className="text-[10px] text-zinc-500">escala de candidatura</div>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs">
          <div className="flex justify-between text-zinc-400 text-[11px]">
            <span>
              {trienais.length} Trienais • {bienais.length} Bienais • {anuais.length} Anuais
            </span>
            <span className="text-blue-400 font-semibold">
              {finalCFC >= 14.0 ? 'Positiva Confortável' : 'Requer Atenção'}
            </span>
          </div>
        </div>

        {finalCFC >= 17.0 && (
          <button
            onClick={handleCelebrate}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/20 flex items-center justify-center gap-1.5 ios-pressable transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Excelente Média de Secundário! Celebrar 🎉</span>
          </button>
        )}
      </div>

      {/* Target Simulator */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Meta Final do Secundário
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-400">
            Objetivo: {targetCFC.toFixed(1)} val
          </span>
        </div>

        <input
          type="range"
          min="12"
          max="20"
          step="0.5"
          value={targetCFC}
          onChange={(e) => {
            triggerHaptic('light');
            setTargetCFC(Number(e.target.value));
          }}
          className="w-full accent-amber-400 cursor-pointer"
        />

        <div
          className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
            needed12thAverage <= finalCFC
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : needed12thAverage <= 20.0
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <div>
            <div className="font-semibold">
              {needed12thAverage <= finalCFC
                ? 'Meta Superada!'
                : needed12thAverage <= 20.0
                ? 'Média Necessária no 12º Ano:'
                : 'Matematicamente Impossível:'}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {needed12thAverage <= finalCFC
                ? 'As tuas notas atuais do 12º já asseguram esta média.'
                : needed12thAverage <= 20.0
                ? `Precisas de média de ${needed12thAverage.toFixed(1)} nas disciplinas do 12º ano.`
                : `Exigiria mais de 20 valores no 12º ano para atingir ${targetCFC.toFixed(1)}.`}
            </div>
          </div>

          <div className="text-right">
            <span className="text-lg font-black">
              {needed12thAverage <= 0
                ? '0.0'
                : needed12thAverage > 20
                ? '> 20'
                : needed12thAverage.toFixed(1)}
            </span>
            <span className="text-[10px] block opacity-80">/ 20 val</span>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 1. DISCIPLINAS TRIENAIS (10º + 11º + 12º)                  */}
      {/* ========================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Disciplinas Trienais (3 Anos)
            </h3>
            <p className="text-[10px] text-zinc-500">
              CFD = (10º + 11º + 12º) / 3 • O 12º ano liga aos testes da app
            </p>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/5">
            {trienais.length} disciplinas
          </span>
        </div>

        <div className="space-y-2.5">
          {trienais.map((s) => {
            const hasAppTests = s.useAppTests && !!subjectStats[s.name];
            const live12Grade = getEffectiveGrade12(s);
            const cfd = getSubjectCFD(s);

            return (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-ios-card space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{s.name}</span>
                    {hasAppTests && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Testes da App
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-xs font-black text-blue-400">{cfd.toFixed(1)}</span>
                      <span className="text-[9px] text-zinc-500 ml-1">CFD</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(s.id)}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 3 Years Inputs */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 block mb-1">
                      10º Ano
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={s.grade10}
                      onChange={(e) =>
                        updateSubjectField(s.id, 'grade10', Number(e.target.value))
                      }
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-1 text-xs text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-zinc-500 block mb-1">
                      11º Ano
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={s.grade11}
                      onChange={(e) =>
                        updateSubjectField(s.id, 'grade11', Number(e.target.value))
                      }
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-1 text-xs text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-semibold text-blue-400 block">
                        12º Ano
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateSubjectField(s.id, 'useAppTests', !s.useAppTests)
                        }
                        title="Alternar entre média dos testes ou manual"
                        className="text-[9px] text-zinc-500 hover:text-white"
                      >
                        {s.useAppTests ? 'Auto' : 'Manual'}
                      </button>
                    </div>

                    {s.useAppTests && hasAppTests ? (
                      <div className="w-full bg-blue-600/10 border border-blue-500/30 rounded-xl py-1 text-xs text-blue-400 font-bold text-center">
                        {live12Grade.toFixed(1)}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={s.grade12}
                        onChange={(e) =>
                          updateSubjectField(s.id, 'grade12', Number(e.target.value))
                        }
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-1 text-xs text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 2. DISCIPLINAS BIENAIS (10º + 11º - CONCLUÍDAS)            */}
      {/* ========================================================== */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Disciplinas Bienais (10º e 11º)
            </h3>
            <p className="text-[10px] text-zinc-500">
              CFD = (10º + 11º) / 2 • Já estão concluídas no 11º ano
            </p>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/5">
            {bienais.length} disciplinas
          </span>
        </div>

        <div className="space-y-2">
          {bienais.map((s) => {
            const cfd = getSubjectCFD(s);

            return (
              <div
                key={s.id}
                className="p-3 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-ios-card flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-bold text-white block">{s.name}</span>
                  <span className="text-[10px] text-zinc-500">
                    10º: {s.grade10} val • 11º: {s.grade11} val
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={s.grade10}
                      onChange={(e) =>
                        updateSubjectField(s.id, 'grade10', Number(e.target.value))
                      }
                      title="Nota do 10º Ano"
                      className="w-11 bg-zinc-950 border border-white/10 rounded-xl py-1 text-xs text-white font-bold text-center focus:outline-none"
                    />
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      value={s.grade11}
                      onChange={(e) =>
                        updateSubjectField(s.id, 'grade11', Number(e.target.value))
                      }
                      title="Nota do 11º Ano"
                      className="w-11 bg-zinc-950 border border-white/10 rounded-xl py-1 text-xs text-white font-bold text-center focus:outline-none"
                    />
                  </div>

                  <div className="text-right min-w-[45px]">
                    <span className="text-xs font-black text-purple-400">{cfd.toFixed(1)}</span>
                    <span className="text-[9px] text-zinc-500 block">CFD</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSubject(s.id)}
                    className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. DISCIPLINAS ANUAIS DO 12º ANO                           */}
      {/* ========================================================== */}
      {anuais.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Disciplinas Anuais (12º Ano)
              </h3>
              <p className="text-[10px] text-zinc-500">
                CFD = Nota do 12º Ano • Opções do plano curricular
              </p>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-900 border border-white/5">
              {anuais.length} disciplinas
            </span>
          </div>

          <div className="space-y-2">
            {anuais.map((s) => {
              const hasAppTests = s.useAppTests && !!subjectStats[s.name];
              const live12Grade = getEffectiveGrade12(s);

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-ios-card flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{s.name}</span>
                    <span className="text-[10px] text-zinc-500">
                      {hasAppTests ? 'Calculada dos testes' : 'Manual'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {s.useAppTests && hasAppTests ? (
                      <div className="w-14 bg-emerald-500/10 border border-emerald-500/30 rounded-xl py-1 text-xs text-emerald-400 font-bold text-center">
                        {live12Grade.toFixed(1)}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={s.grade12}
                        onChange={(e) =>
                          updateSubjectField(s.id, 'grade12', Number(e.target.value))
                        }
                        className="w-14 bg-zinc-950 border border-white/10 rounded-xl py-1 text-xs text-white font-bold text-center focus:outline-none"
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(s.id)}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Subject Section */}
      <div className="pt-2">
        <div className="p-3.5 rounded-3xl bg-zinc-900/60 border border-white/5 space-y-2.5">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
            + Adicionar Outra Disciplina
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nome da disciplina (ex: Francês)..."
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
            />
            <select
              value={newSubjType}
              onChange={(e) => setNewSubjType(e.target.value as SubjectType)}
              className="bg-zinc-950 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="trienal">Trienal</option>
              <option value="bienal">Bienal</option>
              <option value="anual">Anual</option>
            </select>
            <button
              type="button"
              onClick={handleAddSubject}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 ios-pressable"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
