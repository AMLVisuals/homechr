import type { Mission } from '@/types/missions';

function icsEscape(text: string): string {
  return text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
}

function toIcsDateUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function parseScheduled(mission: Mission): { start: Date; end: Date } | null {
  const iso = mission.scheduledDate || mission.date;
  if (!iso) return null;
  const start = new Date(iso);
  if (isNaN(start.getTime())) return null;
  const durationMin = (mission as any).estimatedDuration ?? 120;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  return { start, end };
}

function statusLabel(status?: string): string {
  const map: Record<string, string> = {
    SEARCHING: 'En recherche',
    SCHEDULED: 'Planifié',
    ON_WAY: 'En route',
    ON_SITE: 'Sur site',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
    DISPUTED: 'Litige',
  };
  return map[status || ''] || status || '';
}

export function buildIcsFromMissions(missions: Mission[], opts: { prodId?: string; calName?: string } = {}): string {
  const prodId = opts.prodId || '-//ConnectCHR//Planning Patron//FR';
  const calName = opts.calName || 'ConnectCHR — Planning';
  const nowStamp = toIcsDateUTC(new Date());

  const events: string[] = [];
  for (const m of missions) {
    const dates = parseScheduled(m);
    if (!dates) continue;

    const uid = `mission-${m.id}@connectchr`;
    const summary = icsEscape(m.title || 'Mission');
    const locationParts = [m.location?.address, m.venue].filter(Boolean).join(', ');
    const description = icsEscape(
      [
        m.description,
        m.expert ? `Prestataire : ${m.expert}` : null,
        m.price ? `Tarif : ${m.price}${typeof m.price === 'number' ? '€' : ''}` : null,
        `Statut : ${statusLabel(m.status)}`,
      ]
        .filter(Boolean)
        .join('\n')
    );

    events.push(
      [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${toIcsDateUTC(dates.start)}`,
        `DTEND:${toIcsDateUTC(dates.end)}`,
        `SUMMARY:${summary}`,
        locationParts ? `LOCATION:${icsEscape(locationParts)}` : null,
        `DESCRIPTION:${description}`,
        m.status === 'CANCELLED' ? 'STATUS:CANCELLED' : 'STATUS:CONFIRMED',
        'END:VEVENT',
      ]
        .filter(Boolean)
        .join('\r\n')
    );
  }

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${prodId}`,
    `X-WR-CALNAME:${calName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function downloadIcs(missions: Mission[], filename = 'connectchr-planning.ics') {
  const ics = buildIcsFromMissions(missions);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
