import React from 'react';
import { X, ChevronRight, FileCheck } from 'lucide-react';

export interface IAVEPreset {
  code: string;
  name: string;
  totalScale: number;
  groups: { name: string; maxScore: number }[];
}

export const IAVE_EXAM_PRESETS: IAVEPreset[] = [
  {
    code: '635',
    name: 'Matemática A',
    totalScale: 200,
    groups: [
      { name: 'Caderno 1 (Com Calculadora)', maxScore: 100 },
      { name: 'Caderno 2 (Sem Calculadora)', maxScore: 100 },
    ],
  },
  {
    code: '715',
    name: 'Físico-Química A',
    totalScale: 200,
    groups: [
      { name: 'Grupo I (Física - Mecânica & Energia)', maxScore: 65 },
      { name: 'Grupo II (Química - Equilíbrio & Soluções)', maxScore: 70 },
      { name: 'Grupo III (Atividades Laboratoriais)', maxScore: 65 },
    ],
  },
  {
    code: '702',
    name: 'Biologia e Geologia',
    totalScale: 200,
    groups: [
      { name: 'Grupo I (Geologia & Tectónica)', maxScore: 65 },
      { name: 'Grupo II (Biologia Celular & Hereditariedade)', maxScore: 70 },
      { name: 'Grupo III (Evolução & Diversidade)', maxScore: 65 },
    ],
  },
  {
    code: '639',
    name: 'Português',
    totalScale: 200,
    groups: [
      { name: 'Parte A (Leitura & Educação Literária)', maxScore: 80 },
      { name: 'Parte B (Gramática)', maxScore: 50 },
      { name: 'Parte C (Escrita / Ensaio)', maxScore: 70 },
    ],
  },
  {
    code: '714',
    name: 'Filosofia',
    totalScale: 200,
    groups: [
      { name: 'Grupo I (Lógica & Argumentação)', maxScore: 50 },
      { name: 'Grupo II (Ação Humana & Valores)', maxScore: 75 },
      { name: 'Grupo III (Epistemologia & Conhecimento)', maxScore: 75 },
    ],
  },
  {
    code: '712',
    name: 'Economia A',
    totalScale: 200,
    groups: [
      { name: 'Grupo I (Atividade Económica & Mercados)', maxScore: 65 },
      { name: 'Grupo II (Contabilidade Nacional & Moeda)', maxScore: 70 },
      { name: 'Grupo III (Comércio & Integração)', maxScore: 65 },
    ],
  },
];

interface IAVEPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (preset: IAVEPreset) => void;
}

export const IAVEPresetsModal: React.FC<IAVEPresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md max-h-[85vh] bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl p-4 safe-bottom overflow-y-auto no-scrollbar shadow-2xl animate-slide-up">
        {/* iOS Drag handle */}
        <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-3 sm:hidden" />

        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Modelos Oficiais IAVE</h3>
              <p className="text-[10px] text-zinc-400">Estruturas oficiais de Exames Nacionais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {IAVE_EXAM_PRESETS.map((preset) => (
            <div
              key={preset.code}
              onClick={() => {
                onSelectPreset(preset);
                onClose();
              }}
              className="p-3 rounded-2xl bg-zinc-900 border border-white/5 hover:border-blue-500/30 cursor-pointer flex items-center justify-between ios-pressable transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                    Cód. {preset.code}
                  </span>
                  <span className="text-xs font-bold text-white">{preset.name}</span>
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  {preset.groups.length} partes • Cotação total de {preset.totalScale} pontos
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-500" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
