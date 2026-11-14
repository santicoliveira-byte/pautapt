import { EvaluationType, GradeClassification, SchoolTest, SubjectStats } from '../types';

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
 * Calcula estatísticas agrupadas por disciplina com médias ponderadas corretas
 */
export function calculateSubjectStats(tests: SchoolTest[]): Record<string, SubjectStats> {
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

    result[subject] = {
      name: subject,
      count,
      simpleAverage: Number((sumGrades / count).toFixed(2)),
      weightedAverage: totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : 0,
      highestGrade: highest === -Infinity ? 0 : highest,
      lowestGrade: lowest === Infinity ? 0 : lowest,
      totalWeight,
      tests: subjectTests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
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
