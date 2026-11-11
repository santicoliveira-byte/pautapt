import React, { useState, useMemo } from 'react';
import { UniversityCourse, CourseArea } from '../types';
import { DGES_COURSES } from '../data/dgesCourses';
import { triggerHaptic } from '../utils/haptics';
import {
  Search,
  X,
  GraduationCap,
  Check,
  MapPin,
  FileCheck,
  Percent,
  Target,
} from 'lucide-react';

interface CourseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCourseId: string | null;
  onSelectCourse: (course: UniversityCourse) => void;
  userCandidateScore200?: number;
}

export const CourseSearchModal: React.FC<CourseSearchModalProps> = ({
  isOpen,
  onClose,
  selectedCourseId,
  onSelectCourse,
  userCandidateScore200,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('Todas');
  const [selectedCity, setSelectedCity] = useState<string>('Todas');

  const areas: ('Todas' | CourseArea)[] = [
    'Todas',
    'Saúde',
    'Engenharia & Tecnologia',
    'Economia & Gestão',
    'Direito & Ciências Sociais',
    'Ciências',
    'Artes & Arquitetura',
  ];

  const cities = useMemo(() => {
    const list = Array.from(new Set(DGES_COURSES.map((c) => c.city))).sort();
    return ['Todas', ...list];
  }, []);

  const filteredCourses = useMemo(() => {
    return DGES_COURSES.filter((course) => {
      // Area match
      if (selectedArea !== 'Todas' && course.area !== selectedArea) {
        return false;
      }
      // City match
      if (selectedCity !== 'Todas' && course.city !== selectedCity) {
        return false;
      }
      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = course.name.toLowerCase().includes(query);
        const matchesInst = course.institution.toLowerCase().includes(query);
        const matchesShort = course.shortInstitution.toLowerCase().includes(query);
        const matchesCity = course.city.toLowerCase().includes(query);
        const matchesExams = course.requiredExams.toLowerCase().includes(query);
        const matchesCode = course.code.includes(query) || course.institutionCode.includes(query);
        return matchesName || matchesInst || matchesShort || matchesCity || matchesExams || matchesCode;
      }
      return true;
    });
  }, [searchTerm, selectedArea, selectedCity]);

  if (!isOpen) return null;

  const handlePickCourse = (course: UniversityCourse) => {
    triggerHaptic('medium');
    onSelectCourse(course);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Cursos do Ensino Superior
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  DGES Concurso Nacional
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Notas do Último Colocado (1ª Fase), Provas de Ingresso e Ponderação Oficial
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 ios-pressable"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-white/5 bg-zinc-900/30 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Pesquisar por curso, faculdade (FMUP, IST, Nova, FEUP...), cidade ou exame..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900/90 border border-white/10 rounded-2xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Area filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {areas.map((area) => (
              <button
                key={area}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedArea(area);
                }}
                className={`py-1 px-2.5 rounded-xl text-[11px] font-semibold whitespace-nowrap border transition-all ios-pressable ${
                  selectedArea === area
                    ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 border-white/5 hover:text-white'
                }`}
              >
                {area}
              </button>
            ))}
          </div>

          {/* City filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
            <span className="text-zinc-500 font-medium whitespace-nowrap pl-0.5">Cidade:</span>
            {cities.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCity(city);
                }}
                className={`py-0.5 px-2 rounded-lg font-medium whitespace-nowrap border transition-colors ${
                  selectedCity === city
                    ? 'bg-zinc-700 text-white border-zinc-600'
                    : 'bg-zinc-950/60 text-zinc-400 border-white/5 hover:text-zinc-200'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Results Header */}
        <div className="px-4 py-2 bg-zinc-900/20 border-b border-white/5 flex items-center justify-between text-xs text-zinc-400">
          <span>{filteredCourses.length} cursos encontrados</span>
          {userCandidateScore200 !== undefined && (
            <span className="text-purple-400 font-semibold">
              Tua Nota Prevista: {userCandidateScore200.toFixed(1)} pts
            </span>
          )}
        </div>

        {/* Courses List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredCourses.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-300">Nenhum curso encontrado</h4>
              <p className="text-xs text-zinc-500">
                Tenta pesquisar por termos mais gerais ou limpa os filtros ativos.
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => {
              const isSelected = selectedCourseId === course.id;

              // Calculate feasibility status if user score is known
              let statusBadge = null;
              if (userCandidateScore200 !== undefined) {
                const diff = Number((userCandidateScore200 - course.lastCutoff200).toFixed(1));
                if (diff >= 0) {
                  statusBadge = {
                    label: `Entrada Provável (+${diff.toFixed(1)} pts)`,
                    bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                  };
                } else if (diff >= -5.0) {
                  statusBadge = {
                    label: `Competitivo (${diff.toFixed(1)} pts)`,
                    bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                  };
                } else {
                  statusBadge = {
                    label: `Requer Subida (${diff.toFixed(1)} pts)`,
                    bg: 'bg-red-500/20 text-red-300 border-red-500/30',
                  };
                }
              }

              return (
                <div
                  key={course.id}
                  onClick={() => handlePickCourse(course)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all ios-pressable space-y-3 ${
                    isSelected
                      ? 'bg-purple-950/25 border-purple-500/60 shadow-ios-card ring-1 ring-purple-500/40'
                      : 'bg-zinc-900/70 border-white/10 hover:border-white/20 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {course.shortInstitution}
                        </span>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-zinc-500" />
                          {course.city}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {course.area}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white mt-1.5 leading-snug">
                        {course.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {course.institution}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-xs uppercase font-semibold text-zinc-500">
                        Último Colocado
                      </div>
                      <div className="text-xl font-black text-white">
                        {course.lastCutoff200.toFixed(1)}
                        <span className="text-xs text-zinc-500 font-semibold ml-0.5">pts</span>
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        ({(course.lastCutoff200 / 10).toFixed(2)} val)
                      </div>
                    </div>
                  </div>

                  {/* Requirements & Weights Bar */}
                  <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-white/5 space-y-1.5 text-xs">
                    <div className="flex items-start gap-1.5 text-zinc-300">
                      <FileCheck className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[11px]">
                        <strong className="text-zinc-200">Provas de Ingresso:</strong>{' '}
                        {course.requiredExams}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1 border-t border-white/5">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3 h-3 text-blue-400" />
                        Ponderação: {course.secondaryWeightPct}% Secundário / {course.examsWeightPct}% Exames
                      </span>
                      <span>{course.places} Vagas</span>
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      {statusBadge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePickCourse(course);
                      }}
                      className={`py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Curso Alvo Ativo</span>
                        </>
                      ) : (
                        <>
                          <Target className="w-3.5 h-3.5 text-purple-400" />
                          <span>Fixar como Alvo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
