import React, { useState, useEffect } from 'react';
import { SchoolTest, SubjectStats } from '../types';
import { calculateSubjectStats, ANNUAL_12TH_SUBJECTS } from '../utils/gradeUtils';
import { triggerHaptic } from '../utils/haptics';
import { triggerCelebration } from '../utils/confetti';
import {
  GraduationCap,
  Sparkles,
  RotateCcw,
  Plus,
  Trash2,
  Sliders,
  Award,
  Info,
  Check,
  Edit2,
  BookOpen,
} from 'lucide-react';

export type SubjectType = 'trienal' | 'bienal' | 'anual';

export interface TableSubject {
  id: string;
  name: string;
  type: SubjectType;
  grade10: number | null; // 0-20 manual
  grade11: number | null; // 0-20 manual
  // Note: 12.º ano has NO manual grade; it is STRICTLY computed from the tests in the app!
  enConta: boolean; // "EN Conta?" Sim / Não
  examGrade: number | null; // 0-200 pontos
  acessoSuperior: boolean; // "Acesso ao Ensino Superior" Sim / Não (Prova de Ingresso)
  hasNationalExam: boolean; // false for Educação Física
}

const STORAGE_KEY_TABLE = 'pautapt_secondary_table_v4';
const STORAGE_KEY_COURSE = 'pautapt_secondary_course_v4';
const STORAGE_KEY_WEIGHT_PRESET = 'pautapt_cnaes_weight_preset_v4';
const STORAGE_KEY_ROUNDING = 'pautapt_rounding_mode_v4';
const STORAGE_KEY_EXAM_WEIGHT = 'pautapt_exam_weight_v4';

// Default Portuguese curriculum matching the official template
const DEFAULT_TABLE_SUBJECTS: Omit<TableSubject, 'id'>[] = [
  {
    name: 'Português',
    type: 'trienal',
    grade10: 15,
    grade11: 15,
    enConta: true,
    examGrade: 145,
    acessoSuperior: false,
    hasNationalExam: true,
  },
  {
    name: 'Língua Estrangeira',
    type: 'bienal',
    grade10: 16,
    grade11: 16,
    enConta: false,
    examGrade: null,
    acessoSuperior: false,
    hasNationalExam: true,
  },
  {
    name: 'Filosofia',
    type: 'bienal',
    grade10: 15,
    grade11: 15,
    enConta: false,
    examGrade: null,
    acessoSuperior: false,
    hasNationalExam: true,
  },
  {
    name: 'Educação Física',
    type: 'trienal',
    grade10: 17,
    grade11: 17,
    enConta: false,
    examGrade: null,
    acessoSuperior: false,
    hasNationalExam: false,
  },
  {
    name: 'Matemática A',
    type: 'trienal',
    grade10: 16,
    grade11: 16,
    enConta: true,
    examGrade: 160,
    acessoSuperior: false,
    hasNationalExam: true,
  },
  {
    name: 'Bienal 1',
    type: 'bienal',
    grade10: 12,
    grade11: 14,
    enConta: true,
    examGrade: 145,
    acessoSuperior: true, // Prova de Ingresso ativa
    hasNationalExam: true,
  },
  {
    name: 'Bienal 2',
    type: 'bienal',
    grade10: 15,
    grade11: 15,
    enConta: false,
    examGrade: null,
    acessoSuperior: false,
    hasNationalExam: true,
  },
  {
    name: 'Química',
    type: 'anual',
    grade10: null,
    grade11: null,
    enConta: false,
    examGrade: null,
    acessoSuperior: false,
    hasNationalExam: true,
  },
  {
    name: 'Biologia',
    type: 'anual',
    grade10: null,
    grade11: null,
    enConta: false,
    examGrade: null,
    acessoSuperior: false,
    hasNationalExam: true,
  },
];

// Course Presets to adapt subject names
const COURSE_NAME_PRESETS: Record<
  string,
  { label: string; mapping: { [key: number]: { name: string } } }
> = {
  ct: {
    label: 'Ciências e Tecnologias (CT)',
    mapping: {
      1: { name: 'Inglês' },
      4: { name: 'Matemática A' },
      5: { name: 'Físico-Química A' },
      6: { name: 'Biologia e Geologia' },
      7: { name: 'Química' },
      8: { name: 'Biologia' },
    },
  },
  cse: {
    label: 'Ciências Socioeconómicas (CSE)',
    mapping: {
      1: { name: 'Inglês' },
      4: { name: 'Matemática A' },
      5: { name: 'Economia A' },
      6: { name: 'Geografia A' },
      7: { name: 'Sociologia' },
      8: { name: 'Psicologia B' },
    },
  },
  lh: {
    label: 'Línguas e Humanidades (LH)',
    mapping: {
      1: { name: 'Inglês' },
      4: { name: 'História A' },
      5: { name: 'Geografia A' },
      6: { name: 'MACS / Literatura' },
      7: { name: 'Psicologia B' },
      8: { name: 'Sociologia' },
    },
  },
  av: {
    label: 'Artes Visuais (AV)',
    mapping: {
      1: { name: 'Inglês' },
      4: { name: 'Desenho A' },
      5: { name: 'Geometria Descritiva A' },
      6: { name: 'História da Cultura e Artes' },
      7: { name: 'Oficina de Artes' },
      8: { name: 'Materiais e Tecnologias' },
    },
  },
};

interface SecondaryAverageCalculatorProps {
  tests: SchoolTest[];
  onNavigateToNewTest?: (subjectName: string) => void;
}

export const SecondaryAverageCalculator: React.FC<SecondaryAverageCalculatorProps> = ({
  tests,
  onNavigateToNewTest,
}) => {
  const subjectStats = calculateSubjectStats(tests);

  // Smart subject matching for tests
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const getSubjectStat = (tableName: string): SubjectStats | undefined => {
    if (subjectStats[tableName]) return subjectStats[tableName];

    const normTable = normalize(tableName);

    // Exact normalized match
    for (const [key, stat] of Object.entries(subjectStats)) {
      if (normalize(key) === normTable) return stat;
    }

    // Substring / Keyword matching
    for (const [key, stat] of Object.entries(subjectStats)) {
      const normKey = normalize(key);
      if (normTable.includes(normKey) || normKey.includes(normTable)) {
        return stat;
      }
      const keywords = [
        'portugues',
        'matematica',
        'fisic',
        'quimic',
        'biolog',
        'educacao',
        'filosof',
        'ingles',
        'geograf',
        'histori',
        'econom',
        'desenh',
        'geometr',
      ];
      for (const kw of keywords) {
        if (normTable.includes(kw) && normKey.includes(kw)) {
          return stat;
        }
      }
    }

    return undefined;
  };

  // Subjects state
  const [subjects, setSubjects] = useState<TableSubject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TABLE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_TABLE_SUBJECTS.map((s, idx) => ({
      ...s,
      id: `subj-${idx}-${Date.now()}`,
    }));
  });

  const [selectedCourse, setSelectedCourse] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_COURSE) || 'default';
    } catch {
      return 'default';
    }
  });

  // Admission weights: 50/50, 60/40, 65/35
  const [admissionWeight, setAdmissionWeight] = useState<'50-50' | '60-40' | '65-35'>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY_WEIGHT_PRESET) as any) || '50-50';
    } catch {
      return '50-50';
    }
  });

  // Rounding mode: 'official' (arredonda às unidades em CI e CFD) vs 'decimal' (mantém 1 casa decimal)
  const [roundingMode, setRoundingMode] = useState<'official' | 'decimal'>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY_ROUNDING) as any) || 'official';
    } catch {
      return 'official';
    }
  });

  // Exam weight in CFD: 25% (Decreto-Lei n.º 62/2023 - regime atual oficial) vs 30% (regime anterior)
  const [examWeight, setExamWeight] = useState<25 | 30>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXAM_WEIGHT);
      if (saved === '30') return 30;
      return 25;
    } catch {
      return 25;
    }
  });

  const [showCoursePicker, setShowCoursePicker] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSubjName, setNewSubjName] = useState<string>('');
  const [newSubjType, setNewSubjType] = useState<SubjectType>('bienal');
  const [editingAnnualSubject, setEditingAnnualSubject] = useState<TableSubject | null>(null);
  const [customAnnualName, setCustomAnnualName] = useState<string>('');

  const handleSelectAnnualOption = (
    subjectId: string,
    name: string,
    createTestNow: boolean = false
  ) => {
    triggerHaptic('medium');
    updateSubject(subjectId, { name });
    setEditingAnnualSubject(null);
    setCustomAnnualName('');
    if (createTestNow && onNavigateToNewTest) {
      onNavigateToNewTest(name);
    }
  };

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TABLE, JSON.stringify(subjects));
    } catch {
      // ignore
    }
  }, [subjects]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COURSE, selectedCourse);
    } catch {
      // ignore
    }
  }, [selectedCourse]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WEIGHT_PRESET, admissionWeight);
    } catch {
      // ignore
    }
  }, [admissionWeight]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ROUNDING, roundingMode);
    } catch {
      // ignore
    }
  }, [roundingMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXAM_WEIGHT, String(examWeight));
    } catch {
      // ignore
    }
  }, [examWeight]);

  // STRICT: 12th year grade is ONLY retrieved from tests in the app!
  const get12thGradeFromTests = (s: TableSubject): number | null => {
    if (s.type === 'bienal') return null;
    const stat = getSubjectStat(s.name);
    if (stat && stat.count > 0) {
      return stat.weightedAverage;
    }
    return null;
  };

  // Helper: compute CI (Classificação Interna)
  const computeCI = (s: TableSubject): { value: number | null; isProvisional: boolean } => {
    let raw: number | null = null;
    let isProvisional = false;

    if (s.type === 'trienal') {
      const g10 = s.grade10 ?? 0;
      const g11 = s.grade11 ?? 0;
      const g12 = get12thGradeFromTests(s);

      if (g12 !== null) {
        // Officially has 12th year tests
        raw = (g10 + g11 + g12) / 3;
      } else {
        // Provisional average based on 10th and 11th year until tests are added
        raw = (g10 + g11) / 2;
        isProvisional = true;
      }
    } else if (s.type === 'bienal') {
      const g10 = s.grade10 ?? 0;
      const g11 = s.grade11 ?? 0;
      raw = (g10 + g11) / 2;
    } else {
      // Anual (12º ano apenas)
      const g12 = get12thGradeFromTests(s);
      if (g12 !== null) {
        raw = g12;
      } else {
        // No tests yet for this 12th year option
        return { value: null, isProvisional: true };
      }
    }

    if (raw === null) return { value: null, isProvisional };

    if (roundingMode === 'official') {
      return { value: Math.round(raw), isProvisional };
    }
    return { value: Number(raw.toFixed(1)), isProvisional };
  };

  // Helper: compute CFD (Classificação Final da Disciplina)
  const computeCFD = (s: TableSubject): number | null => {
    const { value: ci } = computeCI(s);
    if (ci === null) return null;

    if (!s.enConta || s.examGrade === null || s.examGrade === undefined) {
      return ci;
    }

    // Regra Oficial do Ensino Secundário em Portugal (Decreto-Lei n.º 62/2023):
    // 1) A nota do Exame Nacional (escala de 0 a 200 pontos) arredonda primeiro às unidades na escala de 0 a 20 valores
    // Exemplo: 145 pts -> 14.5 -> arredonda para 15 valores
    const examUnits = Math.round(s.examGrade / 10);

    // 2) Aplica-se a ponderação oficial de 25% Exame e 75% Interna (ou 30%/70% se selecionado)
    // Exemplo: 0.75 * 13 + 0.25 * 15 = 9.75 + 3.75 = 13.5 -> arredonda para 14 valores!
    const weight = examWeight / 100;
    const rawCFD = (1 - weight) * ci + weight * examUnits;

    if (roundingMode === 'official') {
      return Math.round(rawCFD);
    }
    return Number(rawCFD.toFixed(1));
  };

  // Overall Secondary Average (CFC - Classificação Final de Curso)
  const validCFDs = subjects
    .map((s) => computeCFD(s))
    .filter((cfd): cfd is number => cfd !== null);

  const finalCFC =
    validCFDs.length > 0
      ? Number((validCFDs.reduce((acc, curr) => acc + curr, 0) / validCFDs.length).toFixed(2))
      : 0;

  const finalCFCPoints200 = Number((finalCFC * 10).toFixed(1));

  // Entrance exams (Provas de Ingresso)
  const activeEntranceExams = subjects.filter(
    (s) => s.acessoSuperior && s.examGrade !== null && s.examGrade !== undefined
  );

  const entranceAverage =
    activeEntranceExams.length > 0
      ? Number(
          (
            activeEntranceExams.reduce((acc, curr) => acc + (curr.examGrade || 0), 0) /
            activeEntranceExams.length
          ).toFixed(1)
        )
      : null;

  // Final Application Score (Nota de Candidatura ao Ensino Superior)
  const getWeights = () => {
    switch (admissionWeight) {
      case '60-40':
        return { sec: 0.6, exam: 0.4 };
      case '65-35':
        return { sec: 0.65, exam: 0.35 };
      case '50-50':
      default:
        return { sec: 0.5, exam: 0.5 };
    }
  };

  const weights = getWeights();
  const finalApplicationScore =
    entranceAverage !== null
      ? Number((finalCFCPoints200 * weights.sec + entranceAverage * weights.exam).toFixed(1))
      : null;

  // Handlers for subject field updates
  const updateSubject = (id: string, updates: Partial<TableSubject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleApplyPreset = (presetKey: string) => {
    triggerHaptic('medium');
    setSelectedCourse(presetKey);
    const preset = COURSE_NAME_PRESETS[presetKey];
    if (!preset) return;

    setSubjects((prev) =>
      prev.map((s, idx) => {
        if (preset.mapping[idx]) {
          return { ...s, name: preset.mapping[idx].name };
        }
        return s;
      })
    );
    setShowCoursePicker(false);
  };

  const handleResetToDefault = () => {
    triggerHaptic('medium');
    setSubjects(
      DEFAULT_TABLE_SUBJECTS.map((s, idx) => ({
        ...s,
        id: `subj-${idx}-${Date.now()}`,
      }))
    );
    setSelectedCourse('default');
  };

  const handleAddCustomSubject = () => {
    if (!newSubjName.trim()) return;
    triggerHaptic('medium');
    const newSubj: TableSubject = {
      id: `custom-${Date.now()}`,
      name: newSubjName.trim(),
      type: newSubjType,
      grade10: newSubjType === 'anual' ? null : 15,
      grade11: newSubjType === 'anual' ? null : 15,
      enConta: false,
      examGrade: null,
      acessoSuperior: false,
      hasNationalExam: true,
    };
    setSubjects((prev) => [...prev, newSubj]);
    setNewSubjName('');
    setShowAddModal(false);
  };

  const handleRemoveSubject = (id: string) => {
    triggerHaptic('light');
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="w-full pb-28 pt-1 space-y-4 animate-fade-in">
      {/* Top Notification: 12th year grades are strictly linked to tests + Exam 25% rounding rule */}
      <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between gap-3 text-blue-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Fórmula Oficial da CFD (DL 62/2023):</strong> A nota do exame arredonda primeiro às unidades (ex: 145 pts $\to$ 15 val) e aplica-se <strong>{examWeight}% de exame + {100 - examWeight}% de interna</strong>. As notas do 12.º ano vêm exclusivamente dos testes!
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setExamWeight(examWeight === 25 ? 30 : 25);
          }}
          title="Clique para alternar a ponderação do exame na CFD"
          className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap hover:bg-blue-500/30 transition-colors"
        >
          {examWeight}% Exame
        </button>
      </div>

      {/* Top Bar with Course Picker & Tools */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Cálculo da Média do Secundário & Acesso</span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              Grelha oficial com Exames Nacionais e Candidatura ao Ensino Superior
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setExamWeight(examWeight === 25 ? 30 : 25);
            }}
            title="Ponderação do Exame na CFD: 25% (Decreto-Lei n.º 62/2023 - regime atual) ou 30% (regime anterior)"
            className="text-[10px] font-semibold px-2 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1 ios-pressable"
          >
            <span className="text-blue-400 font-bold">{examWeight}%</span>
            <span>Exame</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowCoursePicker(!showCoursePicker);
            }}
            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white flex items-center gap-1 ios-pressable"
          >
            <Sliders className="w-3 h-3 text-blue-400" />
            <span>Mudar Curso</span>
          </button>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setRoundingMode(roundingMode === 'official' ? 'decimal' : 'official');
            }}
            title="Alternar entre arredondamento oficial às unidades ou com décimas"
            className="text-[10px] font-semibold px-2 py-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <span>{roundingMode === 'official' ? 'Unidades' : 'Décimas'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            title="Repor valores da grelha padrão"
            className="p-1.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white ios-pressable"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Course Presets Drawer */}
      {showCoursePicker && (
        <div className="p-3.5 rounded-3xl bg-zinc-900 border border-white/10 space-y-2.5 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Escolhe o teu Curso do Secundário:
            </span>
            <button
              onClick={() => setShowCoursePicker(false)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Fechar
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(COURSE_NAME_PRESETS).map(([key, c]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleApplyPreset(key)}
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

      {/* Summary Highlight Cards (CFC, Provas de Ingresso, Candidatura) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Média Secundário (CFC) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-blue-500/30 shadow-ios-card relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              Média Secundário (CFC)
            </span>
            <span className="text-[10px] font-semibold text-zinc-400">
              {validCFDs.length} avaliadas
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-3xl font-black text-white">{finalCFC.toFixed(2)}</span>
              <span className="text-xs text-zinc-500 ml-1">/ 20</span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-blue-400">
                {finalCFCPoints200.toFixed(1)}
              </span>
              <span className="text-[10px] text-zinc-500 block">pontos (0-200)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Provas de Ingresso (PI) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/30 shadow-ios-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Provas de Ingresso (PI)
            </span>
            <span className="text-[10px] font-semibold text-emerald-400/80">
              {activeEntranceExams.length} selecionada(s)
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              {entranceAverage !== null ? (
                <>
                  <span className="text-3xl font-black text-white">
                    {entranceAverage.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-500 ml-1">pts</span>
                </>
              ) : (
                <span className="text-xs text-zinc-500 italic">Marca "Sim" em Acesso</span>
              )}
            </div>
            {entranceAverage !== null && (
              <div className="text-right">
                <span className="text-sm font-bold text-emerald-400">
                  {(entranceAverage / 10).toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 block">/ 20 val</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Nota de Candidatura (DGES) */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-purple-500/30 shadow-ios-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Candidatura Superior
            </span>
            {/* Weight Switcher */}
            <div className="flex gap-1 text-[9px] font-bold">
              {(['50-50', '60-40', '65-35'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setAdmissionWeight(w);
                  }}
                  className={`px-1.5 py-0.5 rounded-md transition-all ${
                    admissionWeight === w
                      ? 'bg-purple-600 text-white font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {w.replace('-', '/')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div>
              {finalApplicationScore !== null ? (
                <>
                  <span className="text-3xl font-black text-white">
                    {finalApplicationScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-zinc-500 ml-1">pts</span>
                </>
              ) : (
                <span className="text-xs text-zinc-500 italic">Requer Prova de Ingresso</span>
              )}
            </div>
            {finalApplicationScore !== null && (
              <div className="text-right">
                <span className="text-sm font-bold text-purple-400">
                  {(finalApplicationScore / 10).toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500 block">/ 20 val</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Calculation Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">
              Preenche as notas do 10º e 11º ano. As do 12º ano sincronizam automaticamente com os teus testes:
            </span>
            <span className="sm:hidden text-[11px] text-blue-400 font-medium">
              Desliza horizontalmente 👉 para ver todas as colunas
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 ios-pressable"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Disciplina</span>
          </button>
        </div>

        {/* Scrollable Container with Sticky First Column for mobile / iPhone */}
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl shadow-ios-card scrollbar-thin">
          <table className="w-full min-w-[820px] text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-bold text-zinc-300 uppercase tracking-wider bg-zinc-950/50">
                <th className="sticky left-0 bg-zinc-950/95 backdrop-blur-md z-20 px-3 py-3.5 border-r border-white/10 min-w-[150px]">
                  Disciplina
                </th>
                <th className="px-2 py-3.5 text-center min-w-[65px]">10.º Ano</th>
                <th className="px-2 py-3.5 text-center min-w-[65px]">11.º Ano</th>

                {/* 12.º Ano Header: Clearly marked as purely from tests */}
                <th className="px-2 py-3.5 text-center min-w-[110px] bg-blue-500/10 text-blue-400">
                  <div className="flex items-center justify-center gap-1">
                    <span>12.º Ano</span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-blue-500/30 text-blue-200 font-black tracking-normal uppercase">
                      Testes
                    </span>
                  </div>
                  <div className="text-[9px] font-normal text-blue-300/70 lowercase">
                    calculado da app
                  </div>
                </th>

                <th className="px-2 py-3.5 text-center min-w-[55px] text-blue-400 bg-blue-500/5">
                  CI
                </th>
                <th className="px-2 py-3.5 text-center min-w-[75px]">EN Conta?</th>
                <th className="px-2 py-3.5 text-center min-w-[110px]">
                  <div>Notas Exames Nacionais</div>
                  <div className="text-[9px] font-normal text-zinc-500 lowercase">0 a 200 pontos</div>
                </th>
                <th className="px-2 py-3.5 text-center min-w-[60px] text-blue-400 bg-blue-500/5">
                  CFD
                </th>
                <th className="px-3 py-3.5 text-center min-w-[105px]">
                  <div>Acesso ao</div>
                  <div>Ensino Superior</div>
                </th>
                <th className="px-2 py-3.5 text-center min-w-[40px]" />
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 font-medium">
              {subjects.map((s) => {
                const isTrienal = s.type === 'trienal';
                const isBienal = s.type === 'bienal';
                const isAnual = s.type === 'anual';

                const stat12 = getSubjectStat(s.name);
                const has12Tests = stat12 && stat12.count > 0;
                const grade12FromTests = get12thGradeFromTests(s);

                const { value: ci, isProvisional } = computeCI(s);
                const cfd = computeCFD(s);

                return (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Column 1: Disciplina (Sticky on left for mobile) */}
                    <td className="sticky left-0 bg-zinc-900/95 backdrop-blur-md z-10 px-3 py-2.5 border-r border-white/10 font-bold text-white">
                      <div className="flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            setEditingAnnualSubject(s);
                            setCustomAnnualName(s.name);
                          }}
                          className="truncate max-w-[120px] text-left hover:text-blue-400 transition-colors flex items-center gap-1 group"
                          title="Clica para escolher ou mudar o nome da disciplina"
                        >
                          <span className="truncate">{s.name}</span>
                          <Edit2 className="w-2.5 h-2.5 text-zinc-600 group-hover:text-blue-400 shrink-0 opacity-70" />
                        </button>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                            isTrienal
                              ? 'text-blue-400 bg-blue-500/10'
                              : isBienal
                              ? 'text-purple-400 bg-purple-500/10'
                              : 'text-emerald-400 bg-emerald-500/10'
                          }`}
                        >
                          {isTrienal ? '3A' : isBienal ? '2A' : '1A'}
                        </span>
                      </div>
                    </td>

                    {/* Column 2: 10.º Ano (Manual input) */}
                    <td className="px-2 py-2 text-center">
                      {isAnual ? (
                        <div
                          className="h-8 rounded-xl bg-zinc-800/40 border border-dashed border-white/5 flex items-center justify-center text-zinc-600 select-none text-xs"
                          title="Não aplicável ao 10º ano"
                        >
                          —
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={s.grade10 ?? ''}
                          onChange={(e) =>
                            updateSubject(s.id, {
                              grade10: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className="w-14 h-8 bg-zinc-950 border border-white/10 rounded-xl px-1 text-center font-bold text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </td>

                    {/* Column 3: 11.º Ano (Manual input) */}
                    <td className="px-2 py-2 text-center">
                      {isAnual ? (
                        <div
                          className="h-8 rounded-xl bg-zinc-800/40 border border-dashed border-white/5 flex items-center justify-center text-zinc-600 select-none text-xs"
                          title="Não aplicável ao 11º ano"
                        >
                          —
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={s.grade11 ?? ''}
                          onChange={(e) =>
                            updateSubject(s.id, {
                              grade11: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className="w-14 h-8 bg-zinc-950 border border-white/10 rounded-xl px-1 text-center font-bold text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      )}
                    </td>

                    {/* Column 4: 12.º Ano (STRICTLY FROM TESTS IN THE APP - NO MANUAL INPUT) */}
                    <td className="px-2 py-2 text-center bg-blue-500/5">
                      {isBienal ? (
                        <div
                          className="h-8 rounded-xl bg-zinc-800/40 border border-dashed border-white/5 flex items-center justify-center text-zinc-600 select-none text-xs"
                          title="Disciplina bienal conclui no 11º ano"
                        >
                          —
                        </div>
                      ) : has12Tests && grade12FromTests !== null ? (
                        // Display live calculated test average
                        <div
                          className="h-8 px-2 mx-auto rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center gap-1 font-black text-blue-400 text-xs shadow-sm"
                          title={`Média calculada de ${stat12.count} teste(s) registado(s) em ${s.name}`}
                        >
                          <span>{grade12FromTests.toFixed(1)}</span>
                          <span className="text-[9px] text-blue-300/80 font-normal">
                            ({stat12.count}T)
                          </span>
                        </div>
                      ) : (
                        // No tests yet: prompt user to add a test for this subject
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            if (
                              isAnual &&
                              (s.name.includes('Opção') || s.name.includes('opcao') || s.name.startsWith('Opção'))
                            ) {
                              setEditingAnnualSubject(s);
                              setCustomAnnualName('');
                            } else if (onNavigateToNewTest) {
                              onNavigateToNewTest(s.name);
                            }
                          }}
                          className="h-8 px-2 mx-auto rounded-xl bg-zinc-950 border border-dashed border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-1 text-[10px] font-bold w-full max-w-[105px] group"
                          title="Não existem testes registados. Clica para adicionar um teste desta disciplina!"
                        >
                          <Plus className="w-2.5 h-2.5 text-amber-400 group-hover:scale-110 transition-transform" />
                          <span>Adicionar teste</span>
                        </button>
                      )}
                    </td>

                    {/* Column 5: CI (Classificação Interna) */}
                    <td className="px-2 py-2 text-center bg-blue-500/5">
                      <div
                        className="h-8 px-2 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center font-bold text-blue-300 text-xs"
                        title={
                          isProvisional
                            ? 'Nota provisória (calculada sem testes de 12º ano)'
                            : 'Classificação Interna Oficial'
                        }
                      >
                        <span>{ci !== null ? ci : '—'}</span>
                        {isProvisional && isTrienal && (
                          <span className="text-[8px] text-amber-400/80 font-normal leading-none">
                            provisória
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 6: EN Conta? (Sim / Não Toggle) */}
                    <td className="px-2 py-2 text-center">
                      {!s.hasNationalExam ? (
                        <div
                          className="h-8 rounded-xl bg-zinc-800/40 border border-dashed border-white/5 flex items-center justify-center text-zinc-600 text-[10px] select-none"
                          title="Esta disciplina não tem Exame Nacional"
                        >
                          Sem Exame
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            updateSubject(s.id, { enConta: !s.enConta });
                          }}
                          className={`h-8 px-3 rounded-xl font-bold text-xs transition-all ios-pressable flex items-center justify-center gap-1 mx-auto ${
                            s.enConta
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                              : 'bg-zinc-800/80 text-zinc-400 border border-white/5 hover:text-white'
                          }`}
                        >
                          {s.enConta && <Check className="w-3 h-3 stroke-[2.5]" />}
                          <span>{s.enConta ? 'Sim' : 'Não'}</span>
                        </button>
                      )}
                    </td>

                    {/* Column 7: Notas Exames Nacionais (0 a 200 pontos) */}
                    <td className="px-2 py-2 text-center">
                      {!s.hasNationalExam ? (
                        <div className="h-8 rounded-xl bg-zinc-800/40 border border-dashed border-white/5 flex items-center justify-center text-zinc-600 select-none text-xs">
                          —
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="200"
                          step="1"
                          placeholder="0-200"
                          disabled={!s.enConta && !s.acessoSuperior}
                          value={s.examGrade ?? ''}
                          onChange={(e) =>
                            updateSubject(s.id, {
                              examGrade: e.target.value === '' ? null : Number(e.target.value),
                            })
                          }
                          className={`w-20 h-8 rounded-xl px-2 text-center font-bold text-xs focus:outline-none transition-all ${
                            s.enConta || s.acessoSuperior
                              ? 'bg-zinc-950 border border-white/10 text-white focus:ring-1 focus:ring-blue-500'
                              : 'bg-zinc-900/40 border border-white/5 text-zinc-600 cursor-not-allowed placeholder-zinc-700'
                          }`}
                        />
                      )}
                    </td>

                    {/* Column 8: CFD (Classificação Final da Disciplina) */}
                    <td className="px-2 py-2 text-center bg-blue-500/5">
                      <div
                        className="h-8 px-2 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-black text-white text-xs cursor-default"
                        title={
                          s.enConta && s.examGrade !== null && ci !== null
                            ? `${100 - examWeight}% Interna (${ci}) + ${examWeight}% Exame arredondado (${Math.round(s.examGrade / 10)}) = ${cfd}`
                            : `CFD = CI = ${ci}`
                        }
                      >
                        {cfd !== null ? cfd : '—'}
                      </div>
                    </td>

                    {/* Column 9: Acesso ao Ensino Superior (Prova de Ingresso) */}
                    <td className="px-2 py-2 text-center">
                      {!s.hasNationalExam ? (
                        <div className="h-8 rounded-xl bg-zinc-800/40 border border-dashed border-white/5 flex items-center justify-center text-zinc-600 select-none text-xs">
                          —
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            triggerHaptic('light');
                            updateSubject(s.id, { acessoSuperior: !s.acessoSuperior });
                          }}
                          className={`h-8 px-3 rounded-xl font-bold text-xs transition-all ios-pressable flex items-center justify-center gap-1 mx-auto ${
                            s.acessoSuperior
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                              : 'bg-zinc-800/80 text-zinc-400 border border-white/5 hover:text-white'
                          }`}
                        >
                          {s.acessoSuperior && <Check className="w-3 h-3 stroke-[2.5]" />}
                          <span>{s.acessoSuperior ? 'Sim' : 'Não'}</span>
                        </button>
                      )}
                    </td>

                    {/* Column 10: Delete action */}
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(s.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors rounded-lg"
                        title="Remover disciplina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Section to Add a Custom Subject */}
      {showAddModal && (
        <div className="p-4 rounded-3xl bg-zinc-900 border border-white/10 space-y-3 animate-fade-in shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Adicionar Nova Disciplina
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="Nome da disciplina (ex: Francês, Latim, EMRC)..."
              value={newSubjName}
              onChange={(e) => setNewSubjName(e.target.value)}
              className="sm:col-span-2 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={newSubjType}
              onChange={(e) => setNewSubjType(e.target.value as SubjectType)}
              className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="trienal">Trienal (10º, 11º, 12º)</option>
              <option value="bienal">Bienal (10º e 11º)</option>
              <option value="anual">Anual (12º ano)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleAddCustomSubject}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 ios-pressable"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar à Tabela</span>
          </button>
        </div>
      )}

      {/* Modal to configure / pick an Annual 12th year subject */}
      {editingAnnualSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-900 border border-white/10 p-5 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Escolhe a Disciplina de 12.º Ano</span>
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Seleciona a tua opção curricular de 12.º ano
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAnnualSubject(null)}
                className="text-xs text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick list of official Portuguese 12th year options */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Opções Oficiais do 12.º Ano:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto no-scrollbar">
                {ANNUAL_12TH_SUBJECTS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelectAnnualOption(editingAnnualSubject.id, opt, true)}
                    className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all ios-pressable flex items-center gap-1 ${
                      editingAnnualSubject.name === opt
                        ? 'bg-emerald-600 border-emerald-500 text-white font-bold'
                        : 'bg-zinc-800/80 border-white/5 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <span>{opt}</span>
                    {subjectStats[opt] && (
                      <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-300">
                        {subjectStats[opt].count}T
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Existing test subjects in app (if any) */}
            {Object.keys(subjectStats).length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  Vincular a Testes já Criados na App:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(subjectStats).map(([subjName, stat]) => (
                    <button
                      key={subjName}
                      type="button"
                      onClick={() => handleSelectAnnualOption(editingAnnualSubject.id, subjName, false)}
                      className="text-xs px-2 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 flex items-center gap-1"
                    >
                      <span>{subjName}</span>
                      <span className="text-[9px] text-zinc-400 font-normal">
                        ({stat.weightedAverage.toFixed(1)} val)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom name input */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Ou escreve outro nome:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome da disciplina anual..."
                  value={customAnnualName}
                  onChange={(e) => setCustomAnnualName(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAnnualName.trim()) {
                      handleSelectAnnualOption(editingAnnualSubject.id, customAnnualName.trim(), true);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs ios-pressable"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Celebration for high secondary average */}
      {finalCFC >= 17.0 && (
        <button
          onClick={() => {
            triggerHaptic('success');
            triggerCelebration();
          }}
          className="w-full py-2.5 px-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/20 flex items-center justify-center gap-2 ios-pressable transition-colors"
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>Excelente Média de Secundário ({finalCFC.toFixed(2)} valores)! Celebrar 🎉</span>
        </button>
      )}
    </div>
  );
};
