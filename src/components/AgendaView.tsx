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
  Download,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface AgendaViewProps {
  evaluations: UpcomingEvaluation[];
  onSaveEvaluation: (evaluation: UpcomingEvaluation) => void;
  onDeleteEvaluation: (id: string) => void;
  onMarkAsCompleted: (evaluation: UpcomingEvaluation) => void;
  existingSubjects?: string[];
  initialSubject?: string;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
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
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState('10:00');
  const [type, setType] = useState<EvaluationType>('teste');
  const [weight, setWeight] = useState<number>(25);
  const [totalScale, setTotalScale] = useState<number>(200);
  const [notes, setNotes] = useState('');

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
    'questao-aula': {
      label: 'Questão Aula',
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    trabalho: {
      label: 'Trabalho',
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
    },
    exame: {
      label: 'Exame',
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
    outro: {
      label: 'Outro',
      bg: 'bg-zinc-500/20',
      text: 'text-zinc-400',
      border: 'border-zinc-500/30',
    },
  };

  const getDaysDiff = (targetDateStr: string) => {
    const target = new Date(`${targetDateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-4xl mx-auto pb-28 pt-2 px-3 sm:px-6 space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 p-6 border border-indigo-500/20 shadow-2xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Gestão e Sincronização
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-400" />
              Agenda & Calendário Escolar
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl">
              Regista testes, questões-aula e entregas. Sincroniza diretamente com o Google Calendar ou descarrega em formato .ics para Apple Calendar e Outlook.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 ios-pressable transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{showAddForm ? 'Fechar Formulário' : '+ Agendar Avaliação'}</span>
            </button>

            {evaluations.length > 0 && (
              <button
                type="button"
                onClick={handleExportAll}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 font-medium text-xs ios-pressable transition-all"
                title="Descarregar ficheiro .ics com todas as datas"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Exportar .ICS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Evaluation Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 rounded-3xl bg-zinc-900/90 border border-indigo-500/30 space-y-4 shadow-xl animate-fade-in"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Nova Avaliação na Agenda
            </h3>
            <span className="text-[11px] text-zinc-400">Preenche os detalhes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Disciplina</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {allSubjects.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Tipo de Avaliação</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EvaluationType)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="teste" className="bg-zinc-900 text-white">Teste (Vale 2x)</option>
                <option value="questao-aula" className="bg-zinc-900 text-white">Questão Aula (Vale 1x)</option>
                <option value="trabalho" className="bg-zinc-900 text-white">Trabalho / Projeto</option>
                <option value="exame" className="bg-zinc-900 text-white">Exame Nacional</option>
                <option value="outro" className="bg-zinc-900 text-white">Outro</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Título / Matéria</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Teste 2 - Funções e Derivadas"
                required
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Hora (Opcional)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Peso no Período (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Cotação Máxima (Escala)</label>
              <select
                value={totalScale}
                onChange={(e) => setTotalScale(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={200} className="bg-zinc-900 text-white">200 pontos (Escala Nacional)</option>
                <option value={100} className="bg-zinc-900 text-white">100 pontos (%)</option>
                <option value={20} className="bg-zinc-900 text-white">20 valores</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-zinc-400 mb-1 block">Notas / Conteúdos (Opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sala B2, levar calculadora gráfica e formulário"
                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-medium hover:bg-zinc-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
            >
              Guardar Avaliação
            </button>
          </div>
        </form>
      )}

      {/* Evaluations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Próximas Avaliações ({upcomingList.length})
          </h3>
          <span className="text-[11px] text-zinc-500">Ordenadas por data</span>
        </div>

        {upcomingList.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl bg-zinc-900/40 border border-white/5 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-400 mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-300">Sem avaliações agendadas</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Adiciona as tuas próximas datas de testes para teres contagem decrescente e sincronização de calendário.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Agendar Agora</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingList.map((item) => {
              const daysDiff = getDaysDiff(item.date);
              const cfg = typeConfig[item.type] || typeConfig.teste;
              const gCalUrl = generateGoogleCalendarUrl(item);

              let countdownBadge = {
                text: `${daysDiff} dias`,
                color: 'text-zinc-300 bg-zinc-800 border-white/10',
              };
              if (daysDiff === 0) {
                countdownBadge = {
                  text: 'Hoje!',
                  color: 'text-red-400 bg-red-500/10 border-red-500/30 font-bold animate-pulse',
                };
              } else if (daysDiff === 1) {
                countdownBadge = {
                  text: 'Amanhã',
                  color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 font-bold',
                };
              } else if (daysDiff <= 3) {
                countdownBadge = {
                  text: `Em ${daysDiff} dias`,
                  color: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
                };
              }

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-indigo-500/30 flex flex-col justify-between space-y-3 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white px-2 py-0.5 rounded-lg bg-zinc-800">
                          {item.subject}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-lg border ${countdownBadge.color}`}
                        >
                          {countdownBadge.text}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mt-1">{item.title}</h4>
                      {item.notes && (
                        <p className="text-xs text-zinc-400 italic mt-0.5">{item.notes}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteEvaluation(item.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Eliminar agendamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{new Date(item.date).toLocaleDateString('pt-PT')}</span>
                      {item.time && <span>às {item.time}</span>}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        title="Adicionar ao Google Calendar"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleExportSingle(item)}
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                        title="Descarregar ficheiro .ics"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarkAsCompleted(item)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-semibold text-[11px] transition-colors"
                        title="Calcular e registar nota deste teste"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Fazer Teste</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Past Evaluations */}
        {pastList.length > 0 && (
          <div className="pt-4 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-1">
              Avaliações Passadas ({pastList.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 opacity-75">
              {pastList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-zinc-300">{item.subject}</span>
                      <span className="text-[10px] text-zinc-500">
                        {new Date(item.date).toLocaleDateString('pt-PT')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{item.title}</p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onMarkAsCompleted(item)}
                      className="px-2 py-1 rounded-lg bg-blue-600/20 text-blue-400 text-xs font-medium hover:bg-blue-600/30"
                    >
                      Converter em Teste
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteEvaluation(item.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
