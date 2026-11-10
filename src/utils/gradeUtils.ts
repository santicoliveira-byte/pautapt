import { GradeClassification, SchoolTest, SubjectStats } from '../types';

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
 * Calcula estatísticas agrupadas por disciplina
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
      const w = t.weight > 0 ? t.weight : 1;
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
 * nextWeight: peso do próximo teste (ex: 30)
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
