export type EvaluationMode = 'domains' | 'questions' | 'direct';

export interface DomainItem {
  id: string;
  name: string;
  maxScore: number;
  obtainedScore: number;
  criterionId?: string; // Links this test item to a SubjectCriterionDomain.id
}

export interface SubjectCriterionDomain {
  id: string;
  name: string;
  percentage: number; // Percentage weight of this domain in the subject criteria (e.g., 50)
}

export type SubjectCriteriaMap = Record<string, SubjectCriterionDomain[]>;

export type GradeClassification = 'excelente' | 'bom' | 'suficiente' | 'insuficiente';

export type EvaluationType = 'teste' | 'questao-aula' | 'trabalho' | 'exame' | 'outro';

export interface SchoolTest {
  id: string;
  title: string;
  subject: string;
  totalScale: number;
  weight: number; // weight in the domain/subject average (e.g. Teste = 2x, Questão-Aula = 1x)
  mode: EvaluationMode;
  domains: DomainItem[];
  criteriaDomainIds?: string[]; // Criteria domain IDs present in this test
  obtainedPoints: number;
  grade20: number; // Final grade 0.00 to 20.00
  percentage: number; // 0% to 100%
  classification: GradeClassification;
  term: string; // e.g. "1º Período", "2º Período", "3º Período", "1º Semestre", etc.
  date: string;
  notes?: string;
  type?: EvaluationType;
}

export interface CriterionDomainStat {
  criterionId: string;
  name: string;
  percentage: number;
  average: number | null;
  testCount: number;
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
  usedCriteria?: boolean;
  criteriaStats?: CriterionDomainStat[];
  evaluatedCriteriaPct?: number;
  totalCriteriaPct?: number;
  untaggedTestCount?: number;
}

export interface UpcomingEvaluation {
  id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm (optional, e.g. "10:15")
  type: EvaluationType;
  weight?: number; // e.g. 25 (%)
  totalScale?: number; // e.g. 200 or 20
  notes?: string;
}

export type CourseArea =
  | 'Saúde'
  | 'Engenharia & Tecnologia'
  | 'Economia & Gestão'
  | 'Direito & Ciências Sociais'
  | 'Ciências'
  | 'Artes & Arquitetura'
  | 'Humanidades';

export interface UniversityCourse {
  id: string;
  code: string;
  name: string;
  institution: string;
  institutionCode: string;
  shortInstitution: string;
  city: string;
  area: CourseArea;
  lastCutoff200: number; // e.g. 182.5 (out of 200)
  places: number;
  requiredExams: string; // e.g. "19 Matemática A" ou "02 Bio/Geo + 07 FQ"
  secondaryWeightPct: number; // e.g. 50, 60, 65
  examsWeightPct: number; // e.g. 50, 40, 35
  websiteUrl?: string;
}
