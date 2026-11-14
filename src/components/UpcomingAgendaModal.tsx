import React, { useState } from 'react';
import { UpcomingEvaluation, EvaluationType } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { generateICS, downloadICSFile, generateGoogleCalendarUrl } from '../utils/calendar';
import { PORTUGAL_DEFAULT_SUBJECTS, ANNUAL_12TH_SUBJECTS } from '../utils/gradeUtils';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  X,
  Download,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface UpcomingAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluations: UpcomingEvaluation[];
  onSaveEvaluation: (evaluation: UpcomingEvaluation) => void;
  onDeleteEvaluation: (id: string) => void;
  onMarkAsCompleted: (evaluation: UpcomingEvaluation) => void;
  existingSubjects?: string[];
  initialSubject?: string;
}

export const UpcomingAgendaModal: React.FC<UpcomingAgendaModalProps> = ({
  isOpen,
  onClose,
  evaluations,
  onSaveEvaluation,
  onDeleteEvaluation,
  onMarkAsCompleted,
  existingSubjects = [],
  initialSubject = '',
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [subject, setSubject] = useState(initialSubject || 'Matemática A');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3); // default in 3 days
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState<EvaluationType>('teste');
  const [weight, setWeight] = useState<number>(25);
  const [totalScale, setTotalScale] = useState<number>(200);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Combine subjects without duplicates
  const allSubjects = Array.from(
    new Set([
      ...PORTUGAL_DEFAULT_SUBJECTS,
      ...ANNUAL_12TH_SUBJECTS,
      ...existingSubjects,
    ])
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !title.trim() || !date) return;

    triggerHaptic('medium');
    const newEval: UpcomingEvaluation = {
      id: Date.now().toString(),
      subject: subject.trim(),
      title: title.trim(),
      date,
      time: time || undefined,
      type,
      weight: Number(weight) || 25,
      totalScale: Number(totalScale) || 200,
      notes: notes.trim() || undefined,
    };

    onSaveEvaluation(newEval);
    setTitle('');
    setNotes('');
    setShowAddForm(false);
  };

  const handleExportAll = () => {
    if (evaluations.length === 0) return;
    triggerHaptic('medium');
    const ics = generateICS(evaluations);
    downloadICSFile('PautaPT_Todas_Avaliacoes', ics);
  };

  const handleExportSingle = (item: UpcomingEvaluation) => {
    triggerHaptic('light');
    const ics = generateICS([item]);
    downloadICSFile(`PautaPT_${item.subject}_${item.date}`, ics);
  };

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const sorted = [...evaluations].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || '00:00'}:00`).getTime();
    const dateB = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime();
    return dateA - dateB;
  });

  const upcomingList = sorted.filter((e) => e.date >= todayStr);
  const pastList = sorted.filter((e) => e.date < todayStr);

  const typeConfig: Record<
    EvaluationType,
    { label: string; bg: string; text: string; border: string }
  > = {
    teste: {
      label: 'Teste',
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    exame: {
      label: 'Exame Nacional',
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
    },
    'questao-aula': {
      label: 'Questão-Aula',
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    trabalho: {
      label: 'Apresentação',
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
    },
    outro: {
      label: 'Outro',
      bg: 'bg-zinc-500/20',
      text: 'text-zinc-300',
      border: 'border-zinc-500/30',
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Agenda Escolar
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {evaluations.length} {evaluations.length === 1 ? 'evento' : 'eventos'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Testes futuros, exames nacionais e exportação para calendário
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {evaluations.length > 0 && (
              <button
                type="button"
                onClick={handleExportAll}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs font-semibold flex items-center gap-1.5 ios-pressable"
                title="Exportar Todas (.ics)"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline text-xs">Exportar (.ics)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 ios-pressable"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Top Quick Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setShowAddForm(!showAddForm);
              }}
              className={`w-full py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ios-pressable ${
                showAddForm
                  ? 'bg-zinc-800 border-white/10 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-ios-glow-blue'
              }`}
            >
              {showAddForm ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Fechar Formulário</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>+ Agendar Nova Avaliação</span>
                </>
              )}
            </button>
          </div>

          {/* Add Form (Collapsible) */}
          {showAddForm && (
            <form
              onSubmit={handleSubmit}
              className="p-4 rounded-2xl bg-zinc-900/90 border border-blue-500/30 space-y-3.5 animate-scale-up"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Novo Agendamento
                </span>
                <span className="text-[10px] text-zinc-500">Alertas automáticos incluídos</span>
              </div>

              {/* Type Chips */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
                  Tipo de Avaliação
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(['teste', 'exame', 'questao-aula', 'trabalho'] as EvaluationType[]).map((t) => {
                    const cfg = typeConfig[t];
                    const isSelected = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all truncate ${
                          isSelected
                            ? `${cfg.bg} ${cfg.text} ${cfg.border} ring-1 ring-white/20`
                            : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject Dropdown & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Disciplina
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {allSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Título / Matéria
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Teste 1 (Funções e Limites)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Data da Avaliação
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Hora (Opcional)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Weight & Scale */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Peso na Média (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Escala Total (Pontos)
                  </label>
                  <select
                    value={totalScale}
                    onChange={(e) => setTotalScale(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={200}>200 Pontos (Exames / Secundário)</option>
                    <option value={20}>20 Valores (Escala Tradicional)</option>
                    <option value={100}>100 Pontos / Percentagem</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Observações / Matéria a Estudar
                </label>
                <textarea
                  rows={2}
                  placeholder="Capítulos 1 e 2, exercícios do manual pág 45-60..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-ios-glow-blue ios-pressable"
              >
                Guardar e Criar Lembrete
              </button>
            </form>
          )}

          {/* Evaluations List */}
          {evaluations.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 text-zinc-500 flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-zinc-300">Sem avaliações agendadas</h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Clica no botão acima para agendar o teu próximo teste ou exame nacional com exportação para o calendário do telemóvel.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upcoming */}
              {upcomingList.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Próximas Avaliações ({upcomingList.length})
                  </span>
                  <div className="space-y-2">
                    {upcomingList.map((item) => {
                      const cfg = typeConfig[item.type] || typeConfig.teste;
                      const targetDate = new Date(`${item.date}T${item.time || '23:59'}:00`);
                      const diffDays = Math.ceil(
                        (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                      );

                      let badgeText = '';
                      let badgeStyle = '';
                      if (diffDays <= 0) {
                        badgeText = 'Hoje!';
                        badgeStyle = 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
                      } else if (diffDays === 1) {
                        badgeText = 'Amanhã';
                        badgeStyle = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                      } else {
                        badgeText = `Faltam ${diffDays} dias`;
                        badgeStyle = diffDays <= 3
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-500/30';
                      }

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/10 hover:border-white/15 space-y-2.5 transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                                >
                                  {cfg.label}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                                  {badgeText}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1">
                                {item.subject}
                              </h4>
                              <p className="text-xs text-zinc-300">{item.title}</p>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <a
                                href={generateGoogleCalendarUrl(item)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 ios-pressable transition-colors flex items-center gap-1 text-[10px] font-bold"
                                title="Adicionar diretamente ao Google Calendar"
                              >
                                <span>Google Cal</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleExportSingle(item)}
                                className="px-2 py-1 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 ios-pressable transition-colors flex items-center gap-1 text-[10px] font-bold"
                                title="Descarregar ficheiro .ics (Apple Calendar / Outlook / Telemóvel)"
                              >
                                <Download className="w-3 h-3 text-blue-400" />
                                <span>.ics</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteEvaluation(item.id)}
                                className="p-1.5 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 border border-white/5 ios-pressable transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-zinc-500" />
                                {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-PT', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                              {item.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-zinc-500" />
                                  {item.time}
                                </span>
                              )}
                              {item.weight && (
                                <span className="text-blue-400 font-medium">
                                  Peso: {item.weight}%
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => onMarkAsCompleted(item)}
                              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 ios-pressable"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Registar Nota</span>
                            </button>
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-zinc-500 italic bg-zinc-950/40 p-2 rounded-xl">
                              "{item.notes}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Past */}
              {pastList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Avaliações Realizadas / Anteriores ({pastList.length})
                  </span>
                  <div className="space-y-2 opacity-65 hover:opacity-100 transition-opacity">
                    {pastList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-300">
                              {item.subject}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(item.date + 'T12:00:00').toLocaleDateString('pt-PT')}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-400">{item.title}</p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onMarkAsCompleted(item)}
                            className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20 hover:bg-emerald-500/20"
                          >
                            Lançar Nota
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteEvaluation(item.id)}
                            className="p-1 rounded-lg text-zinc-500 hover:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
