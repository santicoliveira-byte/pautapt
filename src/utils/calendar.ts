import { UpcomingEvaluation } from '../types';

/**
 * Formats a date string YYYY-MM-DD (and optional HH:mm) into iCalendar DTSTART / DTEND format.
 */
function formatICSDateTime(dateStr: string, timeStr?: string): { dtStart: string; dtEnd: string; isAllDay: boolean } {
  const cleanDate = dateStr.replace(/-/g, '');

  if (!timeStr) {
    // All-day event
    // In iCalendar, DTEND for an all-day event is the next day
    const [y, m, d] = dateStr.split('-').map(Number);
    const nextDay = new Date(Date.UTC(y, m - 1, d + 1));
    const nextY = nextDay.getUTCFullYear();
    const nextM = String(nextDay.getUTCMonth() + 1).padStart(2, '0');
    const nextD = String(nextDay.getUTCDate()).padStart(2, '0');
    return {
      dtStart: `;VALUE=DATE:${cleanDate}`,
      dtEnd: `;VALUE=DATE:${nextY}${nextM}${nextD}`,
      isAllDay: true,
    };
  }

  // Event with specific time (assume 90 minutes duration if not specified)
  const [hours, mins] = timeStr.split(':').map(Number);
  const startH = String(hours).padStart(2, '0');
  const startM = String(mins).padStart(2, '0');

  // Compute end time + 90 mins
  let endHour = hours + 1;
  let endMin = mins + 30;
  if (endMin >= 60) {
    endHour += 1;
    endMin -= 60;
  }
  const endH = String(endHour % 24).padStart(2, '0');
  const endM = String(endMin).padStart(2, '0');

  return {
    dtStart: `:${cleanDate}T${startH}${startM}00`,
    dtEnd: `:${cleanDate}T${endH}${endM}00`,
    isAllDay: false,
  };
}

/**
 * Escapes characters for iCalendar format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an iCalendar VEVENT block for an evaluation
 */
function buildEventBlock(item: UpcomingEvaluation): string {
  const { dtStart, dtEnd, isAllDay } = formatICSDateTime(item.date, item.time);
  const now = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

  const typeLabels: Record<string, string> = {
    teste: 'Teste',
    exame: 'Exame Nacional',
    'questao-aula': 'Questão-Aula',
    trabalho: 'Apresentação / Trabalho',
  };

  const typeLabel = typeLabels[item.type] || 'Avaliação';
  const summary = escapeICS(`[${typeLabel}] ${item.subject} - ${item.title}`);
  const description = escapeICS(
    `Disciplina: ${item.subject}\nTipo: ${typeLabel}\n${
      item.weight ? `Peso na Média: ${item.weight}%\n` : ''
    }${item.totalScale ? `Cotação: ${item.totalScale} pontos\n` : ''}${
      item.notes ? `Notas: ${item.notes}\n` : ''
    }\nCriado via PautaPT (https://pautapt.vercel.app)`
  );

  return [
    'BEGIN:VEVENT',
    `UID:pautapt-${item.id}@pautapt.vercel.app`,
    `DTSTAMP:${now}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:Escola Secundária`,
    `DTSTART${dtStart}`,
    `DTEND${dtEnd}`,
    // 1-day advance notification
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Amanhã: ${summary}`,
    'END:VALARM',
    // 2-hour advance notification (if timed)
    !isAllDay
      ? [
          'BEGIN:VALARM',
          'TRIGGER:-PT2H',
          'ACTION:DISPLAY',
          `DESCRIPTION:Daqui a 2 horas: ${summary}`,
          'END:VALARM',
        ].join('\r\n')
      : '',
    'END:VEVENT',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Generates complete .ics file content
 */
export function generateICS(evaluations: UpcomingEvaluation[]): string {
  const events = evaluations.map(buildEventBlock).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PautaPT//Agenda de Testes e Exames//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:PautaPT - Avaliações',
    'X-WR-TIMEZONE:Europe/Lisbon',
    events,
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Triggers native download of the .ics file.
 * Compatible with iOS Safari, macOS, Windows, Android.
 */
export function downloadICSFile(filename: string, icsContent: string): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Generates direct Google Calendar Web URL to add an event with 1 click
 */
export function generateGoogleCalendarUrl(item: UpcomingEvaluation): string {
  const typeLabels: Record<string, string> = {
    teste: 'Teste',
    exame: 'Exame Nacional',
    'questao-aula': 'Questão-Aula',
    trabalho: 'Apresentação / Trabalho',
  };
  const typeLabel = typeLabels[item.type] || 'Avaliação';
  const title = `[${typeLabel}] ${item.subject} - ${item.title}`;

  const cleanDate = item.date.replace(/-/g, '');
  let datesParam: string;

  if (item.time) {
    const [h, m] = item.time.split(':').map(Number);
    const startH = String(h).padStart(2, '0');
    const startM = String(m).padStart(2, '0');
    let endH = h + 1;
    let endM = m + 30;
    if (endM >= 60) {
      endH += 1;
      endM -= 60;
    }
    const endHStr = String(endH % 24).padStart(2, '0');
    const endMStr = String(endM).padStart(2, '0');
    datesParam = `${cleanDate}T${startH}${startM}00/${cleanDate}T${endHStr}${endMStr}00`;
  } else {
    const [y, mo, d] = item.date.split('-').map(Number);
    const nextDay = new Date(Date.UTC(y, mo - 1, d + 1));
    const nextY = nextDay.getUTCFullYear();
    const nextM = String(nextDay.getUTCMonth() + 1).padStart(2, '0');
    const nextD = String(nextDay.getUTCDate()).padStart(2, '0');
    datesParam = `${cleanDate}/${nextY}${nextM}${nextD}`;
  }

  const details = [
    `Disciplina: ${item.subject}`,
    `Tipo: ${typeLabel}`,
    item.weight ? `Peso na Média: ${item.weight}%` : '',
    item.totalScale ? `Cotação: ${item.totalScale} pontos` : '',
    item.notes ? `Notas: ${item.notes}` : '',
    'Criado via PautaPT (https://pautapt.vercel.app)',
  ]
    .filter(Boolean)
    .join('\n');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: datesParam,
    details: details,
    location: 'Escola Secundária',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
