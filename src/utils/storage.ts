import { SchoolTest } from '../types';

const STORAGE_KEY = 'pautapt_tests_v2';

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
    return Array.isArray(parsed) ? parsed : [];
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
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('pautapt_tests_v1');
}
