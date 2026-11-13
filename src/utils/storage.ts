import { SchoolTest, UpcomingEvaluation } from '../types';
import { detectEvaluationType, EVALUATION_TYPE_CONFIGS } from './gradeUtils';

const STORAGE_KEY = 'pautapt_tests_v2';
const UPCOMING_KEY = 'pautapt_upcoming_evaluations_v1';
const TARGET_COURSE_KEY = 'pautapt_target_course_id_v1';

export function loadSavedUpcomingEvaluations(): UpcomingEvaluation[] {
  try {
    const raw = localStorage.getItem(UPCOMING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Erro ao ler avaliações agendadas do localStorage:', error);
    return [];
  }
}

export function saveUpcomingEvaluations(items: UpcomingEvaluation[]): void {
  try {
    localStorage.setItem(UPCOMING_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Erro ao guardar avaliações agendadas no localStorage:', error);
  }
}

export function loadTargetCourseId(): string | null {
  try {
    return localStorage.getItem(TARGET_COURSE_KEY);
  } catch {
    return null;
  }
}

export function saveTargetCourseId(courseId: string | null): void {
  try {
    if (courseId) {
      localStorage.setItem(TARGET_COURSE_KEY, courseId);
    } else {
      localStorage.removeItem(TARGET_COURSE_KEY);
    }
  } catch (error) {
    console.error('Erro ao guardar curso alvo no localStorage:', error);
  }
}

export function loadSavedTests(): SchoolTest[] {
  try {
    // Ensure legacy demo data from v1 is cleared
    if (localStorage.getItem('pautapt_tests_v1') && !localStorage.getItem(STORAGE_KEY)) {
      localStorage.removeItem('pautapt_tests_v1');
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Auto-migrate legacy tests that had weight stuck at 1 or missing type
    let needsResave = false;
    const migrated: SchoolTest[] = parsed.map((t: SchoolTest) => {
      const detectedType = t.type || detectEvaluationType(t.title);
      let updatedWeight = t.weight;
      let updatedType = t.type;

      if (!t.type) {
        updatedType = detectedType;
        needsResave = true;
      }
      if (t.weight === undefined || t.weight === null || t.weight === 1) {
        updatedWeight = EVALUATION_TYPE_CONFIGS[detectedType]?.defaultWeight || 70;
        needsResave = true;
      }

      return {
        ...t,
        type: updatedType,
        weight: updatedWeight,
      };
    });

    if (needsResave) {
      saveTests(migrated);
    }

    return migrated;
  } catch (error) {
    console.error('Erro ao ler testes do localStorage:', error);
    return [];
  }
}

export function saveTests(tests: SchoolTest[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  } catch (error) {
    console.error('Erro ao salvar testes no localStorage:', error);
  }
}

export function exportDataAsJSON(tests: SchoolTest[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      tests,
    },
    null,
    2
  );
}

export function importDataFromJSON(jsonString: string): SchoolTest[] | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && Array.isArray(parsed.tests)) {
      return parsed.tests;
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearAllTests(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Erro ao limpar testes do localStorage:', error);
  }
}
