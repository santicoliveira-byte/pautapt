import React, { useState, useEffect } from 'react';
import { SchoolTest, UniversityCourse } from '../types';
import { calculateSubjectStats, getSubjectDurationWeight } from '../utils/gradeUtils';
import { triggerHaptic } from '../utils/haptics';
import { triggerCelebration } from '../utils/confetti';
import { DGES_COURSES } from '../data/dgesCourses';
import { loadTargetCourseId, saveTargetCourseId } from '../utils/storage';
import { TargetCourseCard } from './TargetCourseCard';
import { CourseSearchModal } from './CourseSearchModal';
import {
  GraduationCap,
  Sparkles,
  Search,
  Target,
} from 'lucide-react';

interface HigherEducationSimulatorProps {
  tests: SchoolTest[];
  initialSecondaryAverage?: number;
}

export const HigherEducationSimulator: React.FC<HigherEducationSimulatorProps> = ({
  tests,
  initialSecondaryAverage,
}) => {
  const stats = calculateSubjectStats(tests);
  const subjectList = Object.values(stats);

  // Automatically estimate secondary average from recorded tests using 3:2:1 duration weighting
  const totalWeight = subjectList.reduce((acc, curr) => acc + getSubjectDurationWeight(curr.name), 0);
  const weightedSum = subjectList.reduce(
    (acc, curr) => acc + curr.weightedAverage * getSubjectDurationWeight(curr.name),
    0
  );
  const calculatedDefault =
    totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : 15.0;

  const [secondaryAvg, setSecondaryAvg] = useState<number>(
    initialSecondaryAverage !== undefined ? initialSecondaryAverage : calculatedDefault
  );
  const [exam1Score, setExam1Score] = useState<number>(160); // in 200 scale
  const [exam1Name, setExam1Name] = useState<string>('Exame Matemática A (635)');
  const [hasExam2, setHasExam2] = useState<boolean>(false);
  const [exam2Score, setExam2Score] = useState<number>(150);
  const [exam2Name, setExam2Name] = useState<string>('Exame Físico-Química A (715)');

  // Target Course state
  const [targetCourseId, setTargetCourseId] = useState<string | null>(() => loadTargetCourseId());
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const targetCourse = DGES_COURSES.find((c) => c.id === targetCourseId) || null;

  // Weights: typically 50/50, 60/40, or 65/35
  const [secondaryWeightPct, setSecondaryWeightPct] = useState<number>(
    targetCourse ? targetCourse.secondaryWeightPct : 50
  );
  const examWeightPct = 100 - secondaryWeightPct;

  // Compute average of exams
  const examsAverage200 = hasExam2 ? (exam1Score + exam2Score) / 2 : exam1Score;
  const secondaryScore200 = secondaryAvg * 10;

  // Final Application Score (Nota de Candidatura CNAES)
  const finalScore200 = Number(
    (
      (secondaryScore200 * secondaryWeightPct) / 100 +
      (examsAverage200 * examWeightPct) / 100
    ).toFixed(2)
  );

  const finalScore20 = Number((finalScore200 / 10).toFixed(2));

  // Inverse Simulator Target Cutoff State (defaults to targetCourse.lastCutoff200 or 165.0)
  const [targetCutoff, setTargetCutoff] = useState<number>(() =>
    targetCourse ? targetCourse.lastCutoff200 : 165.0
  );

  useEffect(() => {
    if (targetCourse) {
      setTargetCutoff(targetCourse.lastCutoff200);
    }
  }, [targetCourseId]);

  // Inverse Calculation:
  // targetCutoff = (secondaryScore200 * secondaryWeightPct + requiredExam * examWeightPct) / 100
  // requiredExam = (targetCutoff * 100 - secondaryScore200 * secondaryWeightPct) / examWeightPct
  const rawInverseRequiredExam =
    examWeightPct > 0
      ? (targetCutoff * 100 - secondaryScore200 * secondaryWeightPct) / examWeightPct
      : 0;
  const inverseRequiredExam = Number(rawInverseRequiredExam.toFixed(1));

  // If 2 exams, what is needed on Exam 2 given Exam 1:
  const exam2RequiredCalculated = Number((2 * rawInverseRequiredExam - exam1Score).toFixed(1));

  const getFeasibility = (score: number) => {
    if (score > 200) {
      return {
        label: 'Impossível (>200 pts)',
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        description:
          'Mesmo com 200 pontos no exame, a tua média do secundário não alcança a nota de corte.',
      };
    }
    if (score > 180) {
      return {
        label: 'Meta de Excelência (18+ val)',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        description:
          'Requer preparação intensiva e domínio total dos critérios de correção IAVE.',
      };
    }
    if (score > 150) {
      return {
        label: 'Meta Exigente (15 a 18 val)',
        color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
        description:
          'Perfeitamente alcançável com estudo consistente e exames de anos anteriores.',
      };
    }
    if (score >= 95) {
      return {
        label: 'Ao Teu Alcance (9.5 a 15 val)',
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        description: 'Muito acessível! Precisas apenas de uma nota média para assegurar a vaga.',
      };
    }
    return {
      label: 'Basta Mínimo Legal (95 pts)',
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      description:
        'A tua média do secundário já cobre a meta. Precisas apenas dos 95 pontos mínimos da DGES.',
    };
  };

  const feasibility = getFeasibility(inverseRequiredExam);

  const handleCelebrate = () => {
    triggerHaptic('success');
    triggerCelebration();
  };

  const handleSelectCourse = (course: UniversityCourse) => {
    setTargetCourseId(course.id);
    saveTargetCourseId(course.id);
    setSecondaryWeightPct(course.secondaryWeightPct);

    // Auto-set exam names if matches
    if (course.requiredExams.includes('+')) {
      const parts = course.requiredExams.split('+').map((p) => p.trim());
      setExam1Name(parts[0]);
      setExam2Name(parts[1]);
      setHasExam2(true);
    } else {
      setExam1Name(course.requiredExams);
      setHasExam2(false);
    }
  };

  const handleClearTarget = () => {
    setTargetCourseId(null);
    saveTargetCourseId(null);
  };

  return (
    <div className="max-w-md mx-auto pb-28 pt-2 px-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Média do Ensino Superior
            </h2>
            <p className="text-[11px] text-zinc-400">
              Cálculo oficial de candidatura CNAES (DGES Portugal)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsSearchOpen(true);
          }}
          className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 ios-pressable transition-colors"
          title="Pesquisar Base de Cursos DGES"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-[11px]">Cursos DGES</span>
        </button>
      </div>

      {/* Target Course Pinned Card */}
      <TargetCourseCard
        course={targetCourse}
        userScore200={finalScore200}
        secondaryScore200={secondaryScore200}
        onOpenSearch={() => setIsSearchOpen(true)}
        onApplyCourseFormula={(secWeight) => setSecondaryWeightPct(secWeight)}
        onClearTarget={handleClearTarget}
      />

      {/* Main Result Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 border border-purple-500/30 shadow-ios-card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
            Nota de Candidatura Prevista
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Escala CNAES
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tight text-white">
              {finalScore200.toFixed(1)}
            </span>
            <span className="text-lg font-semibold text-zinc-500">/ 200 pts</span>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">
              {finalScore20.toFixed(2)}
            </div>
            <div className="text-[10px] text-zinc-500">em 20 valores</div>
          </div>
        </div>

        {/* Proportions Bar */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-blue-500 h-full"
              style={{ width: `${secondaryWeightPct}%` }}
              title={`Secundário: ${secondaryWeightPct}%`}
            />
            <div
              className="bg-purple-500 h-full"
              style={{ width: `${examWeightPct}%` }}
              title={`Provas de Ingresso: ${examWeightPct}%`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-400">
            <span className="text-blue-400">
              Secundário: {secondaryScore200.toFixed(1)} ({secondaryWeightPct}%)
            </span>
            <span className="text-purple-400">
              Exames: {examsAverage200.toFixed(1)} ({examWeightPct}%)
            </span>
          </div>
        </div>

        {finalScore20 >= 16.0 && (
          <button
            onClick={handleCelebrate}
            className="mt-3 w-full py-2 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/20 flex items-center justify-center gap-1.5 ios-pressable transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Excelente média para Medicina / Engenharia! Celebrar 🎉</span>
          </button>
        )}
      </div>

      {/* Simulator Inputs Card */}
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-ios-card space-y-4">
        {/* Secondary Average */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              1. Média do Secundário (10º, 11º e 12º)
            </label>
            <span className="text-xs font-bold text-blue-400">
              {secondaryAvg.toFixed(2)} valores ({secondaryScore200.toFixed(0)} pts)
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="20"
            step="0.05"
            value={secondaryAvg}
            onChange={(e) => setSecondaryAvg(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Weights Preset */}
        <div className="pt-2 border-t border-white/5">
          <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
            Fórmula de Ponderação da Universidade / Politécnico
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '50% / 50%', sec: 50 },
              { label: '60% / 40%', sec: 60 },
              { label: '65% / 35%', sec: 65 },
            ].map((p) => (
              <button
                key={p.sec}
                type="button"
                onClick={() => setSecondaryWeightPct(p.sec)}
                className={`py-2 px-1 rounded-xl text-xs font-semibold border transition-all ${
                  secondaryWeightPct === p.sec
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm'
                    : 'bg-zinc-800/40 border-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exam 1 */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-zinc-300">
              2. Prova de Ingresso 1
            </label>
            <span className="font-bold text-purple-400">
              {exam1Score} pts ({(exam1Score / 10).toFixed(1)} val)
            </span>
          </div>
          <input
            type="text"
            value={exam1Name}
            onChange={(e) => setExam1Name(e.target.value)}
            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
          />
          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={exam1Score}
            onChange={(e) => setExam1Score(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Optional Exam 2 */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300">
              Prova de Ingresso 2 (Se o curso exigir duas)
            </label>
            <button
              type="button"
              onClick={() => setHasExam2(!hasExam2)}
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                hasExam2
                  ? 'bg-purple-600 border-purple-500 text-white'
                  : 'bg-zinc-800 border-white/10 text-zinc-400'
              }`}
            >
              {hasExam2 ? 'Ativa' : '+ Adicionar 2º Exame'}
            </button>
          </div>

          {hasExam2 && (
            <div className="space-y-2 animate-fade-in">
              <input
                type="text"
                value={exam2Name}
                onChange={(e) => setExam2Name(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Nota obtida:</span>
                <span className="font-bold text-purple-400">
                  {exam2Score} pts ({(exam2Score / 10).toFixed(1)} val)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={exam2Score}
                onChange={(e) => setExam2Score(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Inverse Exam Score Calculator: Que nota preciso no Exame? */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-purple-500/30 rounded-3xl p-5 shadow-ios-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Simulador Inverso: Que nota preciso no Exame?
              </h3>
              <p className="text-[11px] text-zinc-400">
                Calcula a nota necessária nas provas de ingresso para atingir a meta
              </p>
            </div>
          </div>
        </div>

        {/* Target Admission Cutoff Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">Nota de Candidatura Alvo:</span>
            <span className="font-extrabold text-purple-400 text-sm">
              {targetCutoff.toFixed(1)} pts ({(targetCutoff / 10).toFixed(2)} val)
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="200"
            step="0.5"
            value={targetCutoff}
            onChange={(e) => setTargetCutoff(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          {targetCourse && (
            <div className="flex justify-between items-center text-[10px] text-zinc-500">
              <span>Curso: {targetCourse.name} ({targetCourse.shortInstitution})</span>
              <button
                type="button"
                onClick={() => setTargetCutoff(targetCourse.lastCutoff200)}
                className="text-purple-400 hover:underline font-semibold"
              >
                Repor {targetCourse.lastCutoff200} pts
              </button>
            </div>
          )}
        </div>

        {/* Result of Required Exam Score */}
        <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-white/5 space-y-2">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                {hasExam2 ? 'Média Necessária nas 2 Provas' : `Nota Necessária em ${exam1Name}`}
              </span>
              <span className="text-3xl font-black text-white">
                {inverseRequiredExam > 200
                  ? '> 200'
                  : inverseRequiredExam <= 95
                  ? '95.0'
                  : inverseRequiredExam.toFixed(1)}
                <span className="text-xs text-zinc-500 font-semibold ml-1">pts</span>
              </span>
              <span className="text-xs text-purple-400 font-bold ml-2">
                {inverseRequiredExam > 200
                  ? '(Inacessível)'
                  : inverseRequiredExam <= 95
                  ? '(9.5 val - mínimo DGES)'
                  : `(${(inverseRequiredExam / 10).toFixed(1)} valores)`}
              </span>
            </div>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${feasibility.color}`}>
              {feasibility.label}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-snug">
            {feasibility.description}
          </p>

          {hasExam2 && (
            <div className="pt-2 border-t border-white/5 text-[11px] text-zinc-400 flex justify-between items-center">
              <span>Se tirares {exam1Score} pts na 1ª prova:</span>
              <span className="font-bold text-white">
                Precisas de{' '}
                {exam2RequiredCalculated > 200
                  ? '> 200 pts'
                  : exam2RequiredCalculated <= 95
                  ? '95.0 pts (9.5 val)'
                  : `${exam2RequiredCalculated.toFixed(1)} pts (${(exam2RequiredCalculated / 10).toFixed(1)} val)`}{' '}
                na 2ª
              </span>
            </div>
          )}
        </div>
      </div>

      {/* DGES Courses Search Modal */}
      <CourseSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        selectedCourseId={targetCourseId}
        onSelectCourse={handleSelectCourse}
        userCandidateScore200={finalScore200}
      />
    </div>
  );
};
