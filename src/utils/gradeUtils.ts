import {
  CriterionDomainStat,
  DomainItem,
  EvaluationType,
  GradeClassification,
  SchoolTest,
  SubjectCriteriaMap,
  SubjectCriterionDomain,
  SubjectStats,
} from '../types';

export const ANNUAL_12TH_SUBJECTS = [
  'Química',
  'Biologia',
  'Física',
  'Geologia',
  'Psicologia B',
  'Sociologia',
  'Economia C',
  'Direito',
  'Aplicações Informáticas B',
  'Oficina de Artes',
  'Oficina Multimédia B',
  'Materiais e Tecnologias',
  'Antropologia',
  'Ciência Política',
  'Filosofia A',
  'Língua Estrangeira (12º)',
];

export const PORTUGAL_DEFAULT_SUBJECTS = [
  // Trienais
  'Português',
  'Matemática A',
  'Educação Física',
  'História A',
  'Desenho A',
  // Bienais
  'Físico-Química A',
  'Biologia e Geologia',
  'Filosofia',
  'Inglês',
  'Economia A',
  'Geografia A',
  'Geometria Descritiva A',
  'História da Cultura e Artes',
  'Matemática B',
  'MACS',
  // Disciplinas Anuais (12.º Ano)
  ...ANNUAL_12TH_SUBJECTS,
  'Programação e Sistemas',
];

export const SCALE_PRESETS = [
  { label: '200 Pontos (IAVE / Secundário)', value: 200, unit: 'pts' },
  { label: '20 Valores (Padrão Nacional)', value: 20, unit: 'val' },
  { label: '100 Pontos (Modular / Frequência)', value: 100, unit: 'pts' },
  { label: '50 Pontos (Mini-teste / Questão-Aula)', value: 50, unit: 'pts' },
];

export const TERMS_LIST = [
  '1º Período',
  '2º Período',
  '3º Período',
  '1º Semestre',
  '2º Semestre',
  'Ano Letivo Completo',
];

export interface EvaluationTypeConfig {
  id: EvaluationType;
  label: string;
  shortLabel: string;
  defaultWeight: number; // Peso relativo (ex: Teste = 2x, Questão-Aula = 1x)
  description: string;
  badgeClass: {
    bg: string;
    text: string;
    border: string;
  };
}

export const EVALUATION_TYPE_CONFIGS: Record<EvaluationType, EvaluationTypeConfig> = {
  teste: {
    id: 'teste',
    label: 'Teste Sumativo (2x)',
    shortLabel: 'Teste',
    defaultWeight: 2, // O teste vale o dobro da questão-aula
    description: 'Vale o dobro de uma questão-aula (peso 2x)',
    badgeClass: {
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
  },
  'questao-aula': {
    id: 'questao-aula',
    label: 'Questão-Aula / Questionário (1x)',
    shortLabel: 'Questão-Aula',
    defaultWeight: 1, // Peso base 1x (metade do teste)
    description: 'Peso base 1x (metade do teste)',
    badgeClass: {
      bg: 'bg-purple-500/15',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
    },
  },
  trabalho: {
    id: 'trabalho',
    label: 'Trabalho / Projeto (1x)',
    shortLabel: 'Trabalho',
    defaultWeight: 1,
    description: 'Relatório, projeto ou trabalho prático',
    badgeClass: {
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    },
  },
  exame: {
    id: 'exame',
    label: 'Exame / Prova Global (3x)',
    shortLabel: 'Exame',
    defaultWeight: 3,
    description: 'Exame nacional ou prova de equivalência',
    badgeClass: {
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
  },
  outro: {
    id: 'outro',
    label: 'Outro / Personalizado',
    shortLabel: 'Outro',
    defaultWeight: 1,
    description: 'Outro elemento avaliativo',
    badgeClass: {
      bg: 'bg-zinc-500/15',
      text: 'text-zinc-300',
      border: 'border-zinc-500/30',
    },
  },
};

export const COMMON_WEIGHT_PRESETS = [1, 2, 3, 4, 10, 20, 25, 30, 50, 70];

export function formatWeight(weight?: number): string {
  if (weight === undefined || weight === null || weight <= 0) return '1x';
  if (weight <= 10 && Number.isInteger(weight)) {
    return `${weight}x`;
  }
  return `${weight}%`;
}

/**
 * Deteta automaticamente o tipo de avaliação a partir do título
 */
export function detectEvaluationType(title: string): EvaluationType {
  const lower = (title || '').toLowerCase();
  if (
    lower.includes('question') ||
    lower.includes('questão') ||
    lower.includes('questao') ||
    lower.includes('mini-teste') ||
    lower.includes('miniteste') ||
    lower.includes('quiz') ||
    lower.includes('ficha')
  ) {
    return 'questao-aula';
  }
  if (
    lower.includes('trabalho') ||
    lower.includes('projeto') ||
    lower.includes('relatório') ||
    lower.includes('relatorio') ||
    lower.includes('apresentação') ||
    lower.includes('apresentacao')
  ) {
    return 'trabalho';
  }
  if (
    lower.includes('exame') ||
    lower.includes('prova global') ||
    lower.includes('frequência') ||
    lower.includes('frequencia')
  ) {
    return 'exame';
  }
  return 'teste';
}

/**
 * Retorna o peso efetivo de um teste
 * Garante a regra: Teste vale o dobro (peso 2x) da Questão-Aula (peso 1x)
 */
export function getEffectiveWeight(test: SchoolTest): number {
  if (test.weight !== undefined && test.weight > 0) {
    // Migração de valores temporários anteriores (70 vira 2, 15 vira 1)
    if (test.weight === 70) return 2;
    if (test.weight === 15) return 1;
    return test.weight;
  }
  const type = test.type || detectEvaluationType(test.title);
  return type === 'teste' ? 2 : 1;
}

/**
 * Converte qualquer cotação para a escala oficial de 0 a 20 valores
 */
export function calculateGrade20(obtained: number, totalScale: number): number {
  if (totalScale <= 0 || isNaN(obtained) || isNaN(totalScale)) return 0;
  const grade = (obtained / totalScale) * 20;
  return Math.min(20, Math.max(0, Number(grade.toFixed(2))));
}

/**
 * Determina a menção qualitativa em Portugal
 */
export function getClassification(grade20: number): GradeClassification {
  if (grade20 < 9.5) return 'insuficiente';
  if (grade20 < 13.5) return 'suficiente';
  if (grade20 < 17.5) return 'bom';
  return 'excelente';
}

export function getClassificationLabel(classification: GradeClassification): string {
  switch (classification) {
    case 'insuficiente':
      return 'Não Satisfaz (Negativa)';
    case 'suficiente':
      return 'Satisfaz (Suficiente)';
    case 'bom':
      return 'Bom (Satisfaz Bem)';
    case 'excelente':
      return 'Muito Bom (Excelente)';
  }
}

export function getClassificationBadgeStyle(classification: GradeClassification): {
  bg: string;
  text: string;
  border: string;
  glow: string;
  dot: string;
} {
  switch (classification) {
    case 'insuficiente':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/20',
        glow: 'shadow-ios-glow-red',
        dot: 'bg-red-500',
      };
    case 'suficiente':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        glow: 'shadow-ios-glow-amber',
        dot: 'bg-amber-400',
      };
    case 'bom':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        glow: 'shadow-ios-glow-blue',
        dot: 'bg-blue-400',
      };
    case 'excelente':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        glow: 'shadow-ios-glow-green',
        dot: 'bg-emerald-400',
      };
  }
}

/**
 * Normaliza o nome da disciplina para correspondência fiável (sem acentos/maiúsculas)
 */
export function normalizeSubjectKey(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Procura os critérios de avaliação de uma disciplina no mapa configurado
 */
export function getSubjectCriteriaEntry(
  criteriaMap: SubjectCriteriaMap | undefined,
  subjectName: string
): { key: string; criteria: SubjectCriterionDomain[] } {
  if (!criteriaMap || !subjectName) return { key: subjectName, criteria: [] };
  if (criteriaMap[subjectName]) {
    return { key: subjectName, criteria: criteriaMap[subjectName] };
  }
  const targetNorm = normalizeSubjectKey(subjectName);
  for (const [k, v] of Object.entries(criteriaMap)) {
    if (normalizeSubjectKey(k) === targetNorm) {
      return { key: k, criteria: v };
    }
  }
  return { key: subjectName.trim(), criteria: [] };
}

export interface CriteriaPreset {
  id: string;
  label: string;
  description: string;
  domains: { name: string; percentage: number }[];
}

export const CRITERIA_PRESETS: CriteriaPreset[] = [
  {
    id: 'ciencias',
    label: 'Ciências / Matemática',
    description: 'Conhecimento 50% • Resolução 30% • Comunicação 20%',
    domains: [
      { name: 'Conhecimento e Conceitos', percentage: 50 },
      { name: 'Resolução de Problemas', percentage: 30 },
      { name: 'Comunicação e Trabalho Prático', percentage: 20 },
    ],
  },
  {
    id: 'linguas',
    label: 'Português / Línguas',
    description: 'Leitura 35% • Escrita 25% • Gramática 25% • Oralidade 15%',
    domains: [
      { name: 'Leitura e Educação Literária', percentage: 35 },
      { name: 'Escrita', percentage: 25 },
      { name: 'Gramática', percentage: 25 },
      { name: 'Oralidade', percentage: 15 },
    ],
  },
  {
    id: 'lab',
    label: 'FQ / Biologia (Teórico-Prática)',
    description: 'Teórica 60% • Laboratorial 30% • Trabalho Autónomo 10%',
    domains: [
      { name: 'Componente Teórica', percentage: 60 },
      { name: 'Componente Laboratorial / Prática', percentage: 30 },
      { name: 'Participação e Trabalho Autónomo', percentage: 10 },
    ],
  },
  {
    id: 'ef',
    label: 'Educação Física',
    description: 'Atividades Físicas 70% • Aptidão Física 15% • Conhecimentos 15%',
    domains: [
      { name: 'Atividades Físicas', percentage: 70 },
      { name: 'Aptidão Física', percentage: 15 },
      { name: 'Conhecimentos', percentage: 15 },
    ],
  },
  {
    id: 'geral',
    label: 'Geral (Instrumentos)',
    description: 'Testes 60% • Questões-Aula/Trabalhos 30% • Atitudes 10%',
    domains: [
      { name: 'Testes Sumativos', percentage: 60 },
      { name: 'Questões-Aula e Trabalhos', percentage: 30 },
      { name: 'Participação e Atitudes', percentage: 10 },
    ],
  },
];

export function buildCriteriaFromPreset(preset: CriteriaPreset): SubjectCriterionDomain[] {
  const ts = Date.now();
  return preset.domains.map((d, idx) => ({
    id: `crit-${ts}-${idx}`,
    name: d.name,
    percentage: d.percentage,
  }));
}

/**
 * Gera ou sincroniza a lista de DomainItem de um teste a partir dos critérios selecionados,
 * distribuindo a cotação total proporcionalmente às percentagens e preservando notas já lançadas.
 */
export function distributeScaleByCriteria(
  criteria: SubjectCriterionDomain[],
  selectedIds: string[],
  totalScale: number,
  existingDomains: DomainItem[] = []
): DomainItem[] {
  const selected = criteria.filter((c) => selectedIds.includes(c.id));
  if (selected.length === 0) return existingDomains;

  const pctSum = selected.reduce((sum, c) => sum + (Number(c.percentage) || 0), 0);
  const existingByCriterionId = new Map<string, DomainItem>();
  existingDomains.forEach((d) => {
    if (d.criterionId) existingByCriterionId.set(d.criterionId, d);
  });

  const isSmallScale = totalScale <= 20;
  let accumulated = 0;

  return selected.map((c, index) => {
    const ratio = pctSum > 0 ? (Number(c.percentage) || 0) / pctSum : 1 / selected.length;
    let allocatedMax: number;

    if (index === selected.length - 1) {
      const rem = totalScale - accumulated;
      allocatedMax = Math.max(0, isSmallScale ? Number(rem.toFixed(1)) : Math.round(rem));
    } else {
      const raw = ratio * totalScale;
      allocatedMax = isSmallScale ? Number(raw.toFixed(1)) : Math.round(raw);
      accumulated += allocatedMax;
    }

    const prev = existingByCriterionId.get(c.id);
    const prevObtained = prev ? Number(prev.obtainedScore) || 0 : 0;

    return {
      id: prev?.id || `dom-${c.id}`,
      criterionId: c.id,
      name: c.name,
      maxScore: allocatedMax,
      obtainedScore: Math.min(allocatedMax, Math.max(0, prevObtained)),
    };
  });
}

/**
 * Devolve os IDs de critérios da disciplina presentes num teste
 */
export function getTestCriterionIds(
  test: SchoolTest,
  activeCriteria: SubjectCriterionDomain[]
): string[] {
  const activeIds = new Set(activeCriteria.map((c) => c.id));
  const found = new Set<string>();

  if (Array.isArray(test.criteriaDomainIds)) {
    test.criteriaDomainIds.forEach((id) => {
      if (activeIds.has(id)) found.add(id);
    });
  }

  if (test.mode !== 'direct' && Array.isArray(test.domains)) {
    test.domains.forEach((d) => {
      if (d.criterionId && activeIds.has(d.criterionId)) {
        found.add(d.criterionId);
      }
    });
  }

  return Array.from(found);
}

/**
 * Calcula a nota (0-20) obtida por cada critério presente num teste
 */
export function getTestCriterionScores(
  test: SchoolTest,
  activeCriteria: SubjectCriterionDomain[]
): Record<string, number> {
  const activeIds = new Set(activeCriteria.map((c) => c.id));
  const scores: Record<string, number> = {};

  if (test.mode !== 'direct' && Array.isArray(test.domains)) {
    const groupedPoints: Record<string, { obtained: number; max: number }> = {};

    test.domains.forEach((d) => {
      if (d.criterionId && activeIds.has(d.criterionId)) {
        if (!groupedPoints[d.criterionId]) {
          groupedPoints[d.criterionId] = { obtained: 0, max: 0 };
        }
        groupedPoints[d.criterionId].obtained += Number(d.obtainedScore) || 0;
        groupedPoints[d.criterionId].max += Number(d.maxScore) || 0;
      }
    });

    Object.entries(groupedPoints).forEach(([cid, pts]) => {
      if (pts.max > 0) {
        scores[cid] = calculateGrade20(pts.obtained, pts.max);
      }
    });
  }

  if (Array.isArray(test.criteriaDomainIds)) {
    test.criteriaDomainIds.forEach((cid) => {
      if (activeIds.has(cid) && scores[cid] === undefined) {
        scores[cid] = test.grade20;
      }
    });
  }

  return scores;
}

/**
 * Calcula estatísticas agrupadas por disciplina com médias ponderadas corretas
 * (usando os Critérios de Avaliação por domínios da disciplina quando configurados)
 */
export function calculateSubjectStats(
  tests: SchoolTest[],
  criteriaMap?: SubjectCriteriaMap
): Record<string, SubjectStats> {
  const grouped: Record<string, SchoolTest[]> = {};

  tests.forEach((test) => {
    if (!grouped[test.subject]) {
      grouped[test.subject] = [];
    }
    grouped[test.subject].push(test);
  });

  const result: Record<string, SubjectStats> = {};

  Object.entries(grouped).forEach(([subject, subjectTests]) => {
    const count = subjectTests.length;
    let sumGrades = 0;
    let weightedSum = 0;
    let totalWeight = 0;
    let highest = -Infinity;
    let lowest = Infinity;

    subjectTests.forEach((t) => {
      sumGrades += t.grade20;
      const w = getEffectiveWeight(t);
      weightedSum += t.grade20 * w;
      totalWeight += w;

      if (t.grade20 > highest) highest = t.grade20;
      if (t.grade20 < lowest) lowest = t.grade20;
    });

    const legacyWeightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const { criteria } = getSubjectCriteriaEntry(criteriaMap, subject);

    let finalWeightedAverage = legacyWeightedAverage;
    let usedCriteria = false;
    let criteriaStats: CriterionDomainStat[] | undefined;
    let evaluatedCriteriaPct: number | undefined;
    let totalCriteriaPct: number | undefined;
    let untaggedTestCount = 0;

    if (criteria.length > 0) {
      const accumulators: Record<
        string,
        { sumWeightedScore: number; sumTestWeight: number; testCount: number }
      > = {};
      criteria.forEach((c) => {
        accumulators[c.id] = { sumWeightedScore: 0, sumTestWeight: 0, testCount: 0 };
      });

      let taggedWeightSum = 0;
      let untaggedWeightSum = 0;
      let untaggedWeightedScoreSum = 0;

      subjectTests.forEach((t) => {
        const w = getEffectiveWeight(t);
        const testScores = getTestCriterionScores(t, criteria);
        const matchedIds = Object.keys(testScores);

        if (matchedIds.length > 0) {
          taggedWeightSum += w;
          matchedIds.forEach((cid) => {
            if (accumulators[cid]) {
              accumulators[cid].sumWeightedScore += testScores[cid] * w;
              accumulators[cid].sumTestWeight += w;
              accumulators[cid].testCount += 1;
            }
          });
        } else {
          untaggedTestCount += 1;
          untaggedWeightSum += w;
          untaggedWeightedScoreSum += t.grade20 * w;
        }
      });

      criteriaStats = criteria.map((c) => {
        const acc = accumulators[c.id];
        return {
          criterionId: c.id,
          name: c.name,
          percentage: c.percentage,
          average:
            acc.sumTestWeight > 0
              ? Number((acc.sumWeightedScore / acc.sumTestWeight).toFixed(2))
              : null,
          testCount: acc.testCount,
        };
      });

      totalCriteriaPct = criteria.reduce((sum, c) => sum + (Number(c.percentage) || 0), 0);
      const evaluated = criteriaStats.filter((cs) => cs.average !== null && cs.percentage > 0);
      evaluatedCriteriaPct = evaluated.reduce((sum, cs) => sum + cs.percentage, 0);

      if (evaluatedCriteriaPct > 0) {
        const criteriaAvg =
          evaluated.reduce((sum, cs) => sum + cs.average! * cs.percentage, 0) /
          evaluatedCriteriaPct;

        if (untaggedWeightSum > 0 && taggedWeightSum > 0) {
          const untaggedAvg = untaggedWeightedScoreSum / untaggedWeightSum;
          finalWeightedAverage =
            (criteriaAvg * taggedWeightSum + untaggedAvg * untaggedWeightSum) /
            (taggedWeightSum + untaggedWeightSum);
        } else {
          finalWeightedAverage = criteriaAvg;
        }
        usedCriteria = true;
      }
    }

    result[subject] = {
      name: subject,
      count,
      simpleAverage: Number((sumGrades / count).toFixed(2)),
      weightedAverage: Number(finalWeightedAverage.toFixed(2)),
      highestGrade: highest === -Infinity ? 0 : highest,
      lowestGrade: lowest === Infinity ? 0 : lowest,
      totalWeight,
      tests: subjectTests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      usedCriteria,
      criteriaStats,
      evaluatedCriteriaPct,
      totalCriteriaPct,
      untaggedTestCount,
    };
  });

  return result;
}

/**
 * Simula a nota necessária no próximo teste para atingir uma meta
 * targetAverage: média desejada (ex: 16.0)
 * currentWeightedSum: soma ponderada atual
 * currentTotalWeight: peso total atual
 * nextWeight: peso do próximo teste (ex: 2 para teste, 1 para questão-aula)
 */
export function simulateRequiredGrade(
  currentWeightedSum: number,
  currentTotalWeight: number,
  nextWeight: number,
  targetAverage: number
): { requiredGrade: number; isPossible: boolean } {
  if (nextWeight <= 0) return { requiredGrade: 0, isPossible: false };

  // target = (currentWeightedSum + requiredGrade * nextWeight) / (currentTotalWeight + nextWeight)
  // target * (currentTotalWeight + nextWeight) - currentWeightedSum = requiredGrade * nextWeight
  const targetTotal = targetAverage * (currentTotalWeight + nextWeight);
  const needed = (targetTotal - currentWeightedSum) / nextWeight;
  const rounded = Number(needed.toFixed(2));

  return {
    requiredGrade: rounded,
    isPossible: rounded <= 20.0,
  };
}

/**
 * Retorna o peso oficial por duração da disciplina no ensino secundário:
 * - Trienais (3 anos de escolaridade): peso 3
 * - Bienais (2 anos de escolaridade): peso 2
 * - Anuais (1 ano de escolaridade): peso 1
 */
export function getSubjectDurationWeight(subjectName: string): number {
  const lower = (subjectName || '').toLowerCase().trim();
  const isAnnual = ANNUAL_12TH_SUBJECTS.some((a) => a.toLowerCase() === lower);
  if (isAnnual || lower.includes('anual') || lower.includes('opção') || lower.includes('opcao')) {
    return 1;
  }

  const trienais = [
    'português',
    'portugues',
    'matemática a',
    'matematica a',
    'matemática b',
    'matematica b',
    'macs',
    'educação física',
    'educacao fisica',
    'história a',
    'historia a',
    'desenho a',
  ];
  if (trienais.some((t) => lower === t || lower.startsWith(t))) {
    return 3;
  }

  // Bienais por defeito (ex: FQ A, Bio/Geo, Filosofia, Inglês, Economia A, etc.)
  return 2;
}
