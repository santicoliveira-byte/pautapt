import React from 'react';
import { SchoolTest } from '../types';
import { GradeDisplayCard } from './GradeDisplayCard';
import {
  X,
  Calendar,
  Layers,
  FileText,
  Trash2,
  Edit3,
} from 'lucide-react';

interface TestDetailModalProps {
  test: SchoolTest | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (test: SchoolTest) => void;
}

export const TestDetailModal: React.FC<TestDetailModalProps> = ({
  test,
  onClose,
  onDelete,
  onEdit,
}) => {
  if (!test) return null;

  const formattedDate = new Date(test.date).toLocaleDateString('pt-PT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md max-h-[90vh] bg-zinc-950 border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-y-auto no-scrollbar shadow-2xl animate-slide-up flex flex-col">
        {/* iOS Drag handle */}
        <div className="pt-3 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Modal Top Bar */}
        <div className="p-4 pb-2 flex items-center justify-between border-b border-white/5">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
              {test.term} • {test.subject}
            </span>
            <h3 className="text-base font-bold text-white truncate max-w-[280px]">
              {test.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white ios-pressable transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 flex-1">
          {/* Main Grade Card */}
          <GradeDisplayCard
            obtainedPoints={test.obtainedPoints}
            totalScale={test.totalScale}
            grade20={test.grade20}
            weight={test.weight}
            subject={test.subject}
          />

          {/* Test Metadata */}
          <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Data:
              </span>
              <span className="font-medium text-white capitalize">{formattedDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Modo de Avaliação:
              </span>
              <span className="font-medium text-zinc-200 capitalize">
                {test.mode === 'domains'
                  ? 'Por Domínios'
                  : test.mode === 'questions'
                  ? 'Por Exercícios'
                  : 'Cotação Direta'}
              </span>
            </div>
          </div>

          {/* Domains / Questions breakdown if available */}
          {test.domains && test.domains.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
                Discriminação por {test.mode === 'domains' ? 'Domínio' : 'Questão'}
              </h4>

              <div className="space-y-1.5">
                {test.domains.map((d, i) => {
                  const pct = d.maxScore > 0 ? (d.obtainedScore / d.maxScore) * 100 : 0;
                  return (
                    <div
                      key={d.id || i}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-white">{d.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {pct.toFixed(0)}% de aproveitamento
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {d.obtainedScore}{' '}
                          <span className="text-zinc-500 font-normal">/ {d.maxScore} pts</span>
                        </div>
                        <div className="text-[10px] text-blue-400 font-medium">
                          {((d.obtainedScore / (d.maxScore || 1)) * 20).toFixed(1)} val
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          {test.notes && (
            <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1">
              <div className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Observações
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed italic">"{test.notes}"</p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 pt-2 border-t border-white/5 flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Tens a certeza que desejas eliminar este teste?')) {
                onDelete(test.id);
                onClose();
              }
            }}
            className="flex-1 py-3 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center justify-center gap-1.5 ios-pressable transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onEdit(test);
              onClose();
            }}
            className="flex-1 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 ios-pressable transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Teste</span>
          </button>
        </div>
      </div>
    </div>
  );
};
