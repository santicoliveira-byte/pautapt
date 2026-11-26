import { SchoolTest, SubjectCriteriaMap, SubjectStats } from '../types';
import { ANNUAL_12TH_SUBJECTS, calculateSubjectStats } from './gradeUtils';

export type SubjectType = 'trienal' | 'bienal' | 'anual';

export interface TableSubject {
  id: string;
  name: string;
  type: SubjectType;
  grade10: number | null;
  grade11: number | null;
  enConta: boolean;
  examGrade: number | null;
  acessoSuperior: boolean;
  hasNationalExam: boolean;
  isMelhoria?: boolean;
}

export interface CFDResult {
  value: number | null;
  regularValue: number | null;
  isMelhoriaApplied: boolean;
  gain: number;
}

export const STORAGE_KEY_TABLE = 'pautapt_secondary_table_v4';
export const STORAGE_KEY_COURSE = 'pautapt_secondary_course_v4';
export const STORAGE_KEY_WEIGHT_PRESET = 'pautapt_cnaes_weight_preset_v4';
export const STORAGE_KEY_ROUNDING = 'pautapt_rounding_mode_v4';
export const STORAGE_KEY_EXAM_WEIGHT = 'pautapt_exam_weight_v4';
export const STORAGE_KEY_CFC_WEIGHT_MODE = 'pautapt_cfc_weight_mode_v4';
export const STORAGE_KEY_MELHORIA_MODE = 'pautapt_melhoria_mode_v4';

export const DEFAULT_TABLE_SUBJECTS: Omit<TableSubject, 'id'>[] = [
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
    acessoSuperior: true,
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

const normalize = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const MATCH_KEYWORDS = [
  'portugues',
  'matematica',
  'fisic',
  'quimic',
  'biolog',
  'geolog',
  'psicolog',
  'sociolog',
  'direito',
  'antropolog',
  'politica',
  'artes',
  'oficina',
  'multimedia',
  'materiais',
  'informatica',
  'educacao',
  'filosof',
  'ingles',
  'geograf',
  'histori',
  'econom',
  'desenh',
  'geometr',
];

export function findMatchingSubjectStat(
  subjectStats: Record<string, SubjectStats>,
  tableName: string
): SubjectStats | undefined {
  if (subjectStats[tableName]) return subjectStats[tableName];

  const normTable = normalize(tableName);

  for (const [key, stat] of Object.entries(subjectStats)) {
    if (normalize(key) === normTable) return stat;
  }

  for (const [key, stat] of Object.entries(subjectStats)) {
    const normKey = normalize(key);
    if (normTable.includes(normKey) || normKey.includes(normTable)) {
      return stat;
    }
    for (const kw of MATCH_KEYWORDS) {
      if (normTable.includes(kw) && normKey.includes(kw)) {
        return stat;
      }
    }
  }

  return undefined;
}

export function get12thGradeFromTests(
  s: TableSubject,
  subjectStats: Record<string, SubjectStats>
): number | null {
  if (s.type === 'bienal') return null;
  const stat = findMatchingSubjectStat(subjectStats, s.name);
  if (stat && stat.count > 0) {
    return stat.weightedAverage;
  }
  return null;
}

export function computeSubjectCI(
  s: TableSubject,
  subjectStats: Record<string, SubjectStats>,
  roundingMode: 'official' | 'decimal'
): { value: number | null; isProvisional: boolean } {
  let raw: number | null = null;
  let isProvisional = false;

  if (s.type === 'trienal') {
    const g10 = s.grade10 ?? 0;
    const g11 = s.grade11 ?? 0;
    const g12 = get12thGradeFromTests(s, subjectStats);

    if (g12 !== null) {
      raw = (g10 + g11 + g12) / 3;
    } else {
      raw = (g10 + g11) / 2;
      isProvisional = true;
    }
  } else if (s.type === 'bienal') {
    const g10 = s.grade10 ?? 0;
    const g11 = s.grade11 ?? 0;
    raw = (g10 + g11) / 2;
  } else {
    const g12 = get12thGradeFromTests(s, subjectStats);
    if (g12 !== null) {
      raw = g12;
    } else {
      return { value: null, isProvisional: true };
    }
  }

  if (raw === null) return { value: null, isProvisional };

  if (roundingMode === 'official') {
    return { value: Math.round(raw), isProvisional };
  }
  return { value: Number(raw.toFixed(1)), isProvisional };
}

export function computeSubjectCFD(
  s: TableSubject,
  subjectStats: Record<string, SubjectStats>,
  options: {
    roundingMode: 'official' | 'decimal';
    examWeight: 25 | 30;
    melhoriaMode: 'auto' | 'off';
  }
): CFDResult {
  const { value: ci } = computeSubjectCI(s, subjectStats, options.roundingMode);
  if (ci === null) {
    return { value: null, regularValue: null, isMelhoriaApplied: false, gain: 0 };
  }

  if (!s.enConta || s.examGrade === null || s.examGrade === undefined) {
    return { value: ci, regularValue: ci, isMelhoriaApplied: false, gain: 0 };
  }

  const examUnits = Math.round(s.examGrade / 10);
  const weight = options.examWeight / 100;
  const rawCFD = (1 - weight) * ci + weight * examUnits;
  const regularValue =
    options.roundingMode === 'official' ? Math.round(rawCFD) : Number(rawCFD.toFixed(1));

  const canImprove = options.melhoriaMode === 'auto' || s.isMelhoria;
  if (canImprove && examUnits > regularValue) {
    const gain = Number((examUnits - regularValue).toFixed(1));
    return { value: examUnits, regularValue, isMelhoriaApplied: true, gain };
  }

  return { value: regularValue, regularValue, isMelhoriaApplied: false, gain: 0 };
}

export function loadStoredSecondarySubjects(): TableSubject[] {
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
}

export function syncAnnualSubjectsInMemory(
  subjects: TableSubject[],
  subjectStats: Record<string, SubjectStats>
): TableSubject[] {
  const testSubjectNames = Object.keys(subjectStats);
  if (testSubjectNames.length === 0) return subjects;

  const nonAnnualTableNames = subjects
    .filter((s) => s.type !== 'anual')
    .map((s) => normalize(s.name));

  const annualCandidates = testSubjectNames.filter((testName) => {
    const normTest = normalize(testName);
    const isKnownAnnual = ANNUAL_12TH_SUBJECTS.some(
      (a) =>
        normalize(a) === normTest ||
        normTest.includes(normalize(a)) ||
        normalize(a).includes(normTest)
    );
    if (isKnownAnnual) return true;

    const matchesNonAnnual = nonAnnualTableNames.some(
      (tName) => tName === normTest || tName.includes(normTest) || normTest.includes(tName)
    );
    return !matchesNonAnnual;
  });

  if (annualCandidates.length === 0) return subjects;

  const annualIndices: number[] = [];
  subjects.forEach((s, idx) => {
    if (s.type === 'anual') annualIndices.push(idx);
  });
  if (annualIndices.length === 0) return subjects;

  const next = [...subjects];
  const usedCandidates = new Set<string>();

  annualIndices.forEach((idx) => {
    const row = next[idx];
    const match = annualCandidates.find((c) => {
      const normC = normalize(c);
      const normRow = normalize(row.name);
      return normC === normRow || normC.includes(normRow) || normRow.includes(normC);
    });
    if (match) usedCandidates.add(match);
  });

  annualCandidates.forEach((candidate) => {
    if (usedCandidates.has(candidate)) return;
    const slotIdx = annualIndices.find((idx) => {
      const row = next[idx];
      const isGeneric =
        row.name.toLowerCase().includes('opção') || row.name.toLowerCase().includes('opcao');
      const hasTests = !!findMatchingSubjectStat(subjectStats, row.name);
      return isGeneric || !hasTests;
    });
    if (slotIdx !== undefined) {
      next[slotIdx] = { ...next[slotIdx], name: candidate };
      usedCandidates.add(candidate);
    }
  });

  return next;
}

export interface LiveSecondarySummary {
  finalCFC: number;
  regularCFC: number;
  finalCFCPoints200: number;
  cfcMelhoriaGain: number;
  hasAnyMelhoria: boolean;
  evaluatedCount: number;
  totalCfdWeights: number;
  cfcWeightMode: 'duration' | 'simple';
  synced12thCount: number;
}

export function computeLiveSecondarySummary(
  tests: SchoolTest[],
  subjectCriteria?: SubjectCriteriaMap
): LiveSecondarySummary {
  const subjectStats = calculateSubjectStats(tests, subjectCriteria);
  const subjects = syncAnnualSubjectsInMemory(loadStoredSecondarySubjects(), subjectStats);

  let roundingMode: 'official' | 'decimal' = 'official';
  let examWeight: 25 | 30 = 25;
  let cfcWeightMode: 'duration' | 'simple' = 'duration';
  let melhoriaMode: 'auto' | 'off' = 'auto';

  try {
    if (localStorage.getItem(STORAGE_KEY_ROUNDING) === 'decimal') roundingMode = 'decimal';
    if (localStorage.getItem(STORAGE_KEY_EXAM_WEIGHT) === '30') examWeight = 30;
    if (localStorage.getItem(STORAGE_KEY_CFC_WEIGHT_MODE) === 'simple') cfcWeightMode = 'simple';
    if (localStorage.getItem(STORAGE_KEY_MELHORIA_MODE) === 'off') melhoriaMode = 'off';
  } catch {
    // ignore
  }

  const getTypeWeight = (type: SubjectType) => {
    if (cfcWeightMode === 'simple') return 1;
    if (type === 'trienal') return 3;
    if (type === 'bienal') return 2;
    return 1;
  };

  let totalCfdWeights = 0;
  let weightedSum = 0;
  let regularWeightedSum = 0;
  let evaluatedCount = 0;
  let hasAnyMelhoria = false;
  let synced12thCount = 0;

  subjects.forEach((s) => {
    if (get12thGradeFromTests(s, subjectStats) !== null) {
      synced12thCount += 1;
    }
    const cfd = computeSubjectCFD(s, subjectStats, {
      roundingMode,
      examWeight,
      melhoriaMode,
    });
    if (cfd.value !== null) {
      const w = getTypeWeight(s.type);
      evaluatedCount += 1;
      totalCfdWeights += w;
      weightedSum += cfd.value * w;
      regularWeightedSum += (cfd.regularValue ?? cfd.value) * w;
      if (cfd.isMelhoriaApplied) hasAnyMelhoria = true;
    }
  });

  const finalCFC = totalCfdWeights > 0 ? Number((weightedSum / totalCfdWeights).toFixed(2)) : 0;
  const regularCFC =
    totalCfdWeights > 0 ? Number((regularWeightedSum / totalCfdWeights).toFixed(2)) : 0;

  return {
    finalCFC,
    regularCFC,
    finalCFCPoints200: Number((finalCFC * 10).toFixed(1)),
    cfcMelhoriaGain: Number((finalCFC - regularCFC).toFixed(2)),
    hasAnyMelhoria,
    evaluatedCount,
    totalCfdWeights,
    cfcWeightMode,
    synced12thCount,
  };
}
