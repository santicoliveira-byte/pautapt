export type EvaluationMode = 'domains' | 'questions' | 'direct';

export interface DomainItem {
  id: string;
  name: string;
  maxScore: number;
  obtainedScore: number;
}

export type GradeClassification = 'excelente' | 'bom' | 'suficiente' | 'insuficiente';

export interface SchoolTest {
  id: string;
  title: string;
  subject: string;
  totalScale: number;
  weight: number; // percentage in the subject average (e.g. 25%)
  mode: EvaluationMode;
  domains: DomainItem[];
  obtainedPoints: number;
  grade20: number; // Final grade 0.00 to 20.00
  percentage: number; // 0% to 100%
  classification: GradeClassification;
  term: string; // e.g. "1º Período", "2º Período", "3º Período", "1º Semestre", etc.
  date: string;
  notes?: string;
}

export interface SubjectStats {
  name: string;
  count: number;
  simpleAverage: number;
  weightedAverage: number;
  highestGrade: number;
  lowestGrade: number;
  totalWeight: number;
  tests: SchoolTest[];
}
