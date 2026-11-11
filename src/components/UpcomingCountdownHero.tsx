import React from 'react';
import { UpcomingEvaluation } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { downloadICSFile, generateICS } from '../utils/calendar';
import {
  Calendar,
  Clock,
  Plus,
  ChevronRight,
  Download,
} from 'lucide-react';

interface UpcomingCountdownHeroProps {
  evaluations: UpcomingEvaluation[];
  onOpenAgendaModal: () => void;
  onQuickAdd: () => void;
}

export const UpcomingCountdownHero: React.FC<UpcomingCountdownHeroProps> = ({
  evaluations,
  onOpenAgendaModal,
  onQuickAdd,
}) => {
  // Sort evaluations by date ascending
  const sorted = [...evaluations].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}:00`).getTime();
    const dateB = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime();
    return dateA - dateB;
  });

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Filter only upcoming or today
  const upcomingOnly = sorted.filter((ev) => ev.date >= todayStr);
  const nextTest = upcomingOnly[0];

  // Calculate days remaining
  const calculateDaysRemaining = (targetDateStr: string, timeStr?: string) => {
    const target = new Date(`${targetDateStr}T${timeStr || '23:59'}:00`);
    const diffMs = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleExportICS = (e: React.MouseEvent, test: UpcomingEvaluation) => {
    e.stopPropagation();
    triggerHaptic('medium');
    const ics = generateICS([test]);
    downloadICSFile(`PautaPT_${test.subject.replace(/\s+/g, '_')}_${test.date}`, ics);
  };

  if (!nextTest) {
    return (
      <div
        onClick={onOpenAgendaModal}
        className="cursor-pointer p-4 rounded-3xl bg-zinc-900/60 border border-white/5 hover:border-white/10 flex items-center justify-between ios-pressable transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              Agenda de Avaliações
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Novo
              </span>
            </h4>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Regista testes e sincroniza com o calendário do telemóvel (.ics)
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd();
          }}
          className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm flex items-center gap-1 text-xs font-semibold ios-pressable"
          title="Agendar Avaliação"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Agendar</span>
        </button>
      </div>
    );
  }

  const daysLeft = calculateDaysRemaining(nextTest.date, nextTest.time);

  // Format human label
  let countdownLabel = '';
  let badgeColor = '';

  if (daysLeft < 0) {
    countdownLabel = 'Passou';
    badgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
  } else if (daysLeft === 0) {
    countdownLabel = 'Hoje!';
    badgeColor = 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
  } else if (daysLeft === 1) {
    countdownLabel = 'Amanhã';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  } else {
    countdownLabel = `Faltam ${daysLeft} dias`;
    badgeColor = daysLeft <= 3 
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
      : 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  }

  const typeLabels: Record<string, string> = {
    teste: 'Teste',
    exame: 'Exame Nacional',
    'questao-aula': 'Questão-Aula',
    trabalho: 'Apresentação',
  };

  return (
    <div
      onClick={onOpenAgendaModal}
      className="cursor-pointer relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-4 border border-blue-500/20 hover:border-blue-500/35 shadow-ios-card ios-pressable transition-all"
    >
      <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Próxima Avaliação
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
            {countdownLabel}
          </span>
          <span className="text-[10px] text-zinc-500 font-medium">
            ({evaluations.length} {evaluations.length === 1 ? 'agendada' : 'agendadas'})
          </span>
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-white/5">
              {typeLabels[nextTest.type] || 'Teste'}
            </span>
            <h4 className="text-sm font-bold text-white truncate">{nextTest.subject}</h4>
          </div>
          <p className="text-xs text-zinc-300 mt-1 truncate">
            {nextTest.title}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-zinc-500" />
              {new Date(nextTest.date + 'T12:00:00').toLocaleDateString('pt-PT', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
            {nextTest.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-500" />
                {nextTest.time}
              </span>
            )}
            {nextTest.weight && (
              <span className="text-blue-400 font-medium">
                Peso: {nextTest.weight}%
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => handleExportICS(e, nextTest)}
            className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 ios-pressable transition-colors"
            title="Adicionar ao Calendário (.ics)"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[10px]">.ICS</span>
          </button>
          <div className="text-[10px] text-zinc-500 flex items-center gap-0.5">
            <span>Ver agenda</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
};
