import React, { useState } from 'react';
import { SchoolTest, UniversityCourse } from '../types';
import { calculateSubjectStats } from '../utils/gradeUtils';
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

  // Automatically estimate secondary average from recorded tests or passed prop
  const calculatedDefault =
    subjectList.length > 0
      ? Number(
          (
            subjectList.reduce((acc, curr) => acc + curr.weightedAverage, 0) /
            subjectList.length
          ).toFixed(2)
        )
      : 15.0;

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
