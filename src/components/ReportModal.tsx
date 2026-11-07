import React from 'react';
import { SchoolTest } from '../types';
import { calculateSubjectStats } from '../utils/gradeUtils';
import { X, Printer, Award } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: SchoolTest[];
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, tests }) => {
  if (!isOpen) return null;

  const stats = calculateSubjectStats(tests);
  const subjects = Object.values(stats);

  const totalTests = tests.length;
  const overallAvg =
    subjects.length > 0
      ? (
          subjects.reduce((acc, curr) => acc + curr.weightedAverage, 0) / subjects.length
        ).toFixed(2)
      : '0.0';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in print:p-0 print:bg-white">
      <div className="w-full max-w-lg max-h-[90vh] bg-zinc-950 border border-white/10 rounded-3xl overflow-y-auto no-scrollbar p-5 space-y-4 print:border-none print:bg-white print:text-black print:max-w-none print:max-h-none print:p-8">
        {/* Top Actions (hidden during print) */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Relatório Escolar / Pauta de Notas</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 ios-pressable"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="space-y-4 print:text-black">
          {/* Header */}
          <div className="border-b border-white/10 pb-3 print:border-black">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-white print:text-black">PAUTA ESCOLAR</h1>
                <p className="text-xs text-zinc-400 print:text-gray-600">
                  Registo Pessoal de Avaliações Contínuas
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 print:text-gray-600 block">
                  Data de Emissão:
                </span>
                <span className="text-xs font-semibold text-zinc-300 print:text-black">
                  {new Date().toLocaleDateString('pt-PT')}
                </span>
              </div>
            </div>
          </div>

          {/* General Summary Card */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-zinc-900 border border-white/5 print:bg-gray-100 print:border-gray-300">
            <div>
              <span className="text-[10px] text-zinc-400 print:text-gray-600 uppercase block">
                Média Geral de Avaliações
              </span>
              <span className="text-2xl font-black text-blue-400 print:text-black">
                {overallAvg} <span className="text-xs font-normal text-zinc-500">/ 20</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 print:text-gray-600 uppercase block">
                Total de Testes Registados
              </span>
              <span className="text-2xl font-black text-white print:text-black">
                {totalTests}
              </span>
            </div>
          </div>

          {/* Subjects Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 print:text-black">
              Classificações por Disciplina
            </h4>
            <div className="border border-white/10 rounded-2xl overflow-hidden print:border-gray-300">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-900/80 border-b border-white/10 print:bg-gray-200 print:border-gray-300 print:text-black">
                  <tr>
                    <th className="p-2.5 font-bold">Disciplina</th>
                    <th className="p-2.5 font-bold text-center">Nº Testes</th>
                    <th className="p-2.5 font-bold text-right">Média Final (0-20)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-gray-300">
                  {subjects.map((sub) => (
                    <tr key={sub.name}>
                      <td className="p-2.5 font-medium text-white print:text-black">{sub.name}</td>
                      <td className="p-2.5 text-center text-zinc-400 print:text-black">{sub.count}</td>
                      <td className="p-2.5 text-right font-bold text-blue-400 print:text-black">
                        {sub.weightedAverage.toFixed(1)} val
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed list */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 print:text-black">
              Histórico Completo de Testes
            </h4>
            <div className="space-y-1.5">
              {tests.map((t) => (
                <div
                  key={t.id}
                  className="p-2 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between text-xs print:bg-white print:border-gray-200"
                >
                  <div>
                    <span className="font-semibold text-white print:text-black">{t.subject}</span>
                    <span className="text-zinc-500 mx-1">•</span>
                    <span className="text-zinc-400 print:text-gray-700">{t.title}</span>
                  </div>
                  <div className="font-mono font-bold text-white print:text-black">
                    {t.obtainedPoints}/{t.totalScale} pts ({t.grade20.toFixed(1)} val)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
