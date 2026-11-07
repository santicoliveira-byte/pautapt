import { SchoolTest } from '../types';

const STORAGE_KEY = 'pautapt_tests_v1';

export function loadSavedTests(): SchoolTest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getInitialDemoData();
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
}

function getInitialDemoData(): SchoolTest[] {
  return [
    {
      id: 'demo-1',
      title: '1º Teste - Geometria Analítica & Funções',
      subject: 'Matemática A',
      totalScale: 200,
      weight: 35,
      mode: 'domains',
      domains: [
        { id: 'd1', name: 'Raciocínio & Dedução', maxScore: 80, obtainedScore: 72 },
        { id: 'd2', name: 'Cálculo & Resolução', maxScore: 80, obtainedScore: 68 },
        { id: 'd3', name: 'Comunicação Matemática', maxScore: 40, obtainedScore: 35 },
      ],
      obtainedPoints: 175,
      grade20: 17.5,
      percentage: 87.5,
      classification: 'excelente',
      term: '1º Período',
      date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
      notes: 'Excelente desempenho no estudo de funções.',
    },
    {
      id: 'demo-2',
      title: 'Ficha de Avaliação 1 - Mecânica',
      subject: 'Físico-Química A',
      totalScale: 200,
      weight: 30,
      mode: 'questions',
      domains: [
        { id: 'q1', name: 'Grupo I (Opção Múltipla)', maxScore: 50, obtainedScore: 42 },
        { id: 'q2', name: 'Grupo II (Movimento Retilíneo)', maxScore: 75, obtainedScore: 58 },
        { id: 'q3', name: 'Grupo III (Energia e Forças)', maxScore: 75, obtainedScore: 52 },
      ],
      obtainedPoints: 152,
      grade20: 15.2,
      percentage: 76.0,
      classification: 'bom',
      term: '1º Período',
      date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      notes: 'Atenção aos cálculos com algarismos significativos no Grupo III.',
    },
    {
      id: 'demo-3',
      title: 'Teste Escrito - Camões Lírico e Mensagem',
      subject: 'Português',
      totalScale: 200,
      weight: 40,
      mode: 'direct',
      domains: [],
      obtainedPoints: 164,
      grade20: 16.4,
      percentage: 82.0,
      classification: 'bom',
      term: '1º Período',
      date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
      notes: 'Boa interpretação do poema.',
    },
  ];
}
