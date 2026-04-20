'use client';

import { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, AlertTriangle, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import type { CalendarEvent, EventType } from '@/store/calendarStore';
import type { Mission } from '@/types/missions';

// Hour range 7h-23h (17 slots)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 7);
const SLOT_HEIGHT = 48; // px per hour

type PlanningItem =
  | { kind: 'event'; event: CalendarEvent }
  | { kind: 'mission'; mission: Mission };

interface WeekDayViewProps {
  mode: 'WEEK' | 'DAY';
  anchorDate: Date;
  events: CalendarEvent[];
  missions: Mission[];
  filterType: EventType | 'ALL';
  onItemClick: (item: PlanningItem) => void;
  onEventReschedule: (eventId: string, newDate: string, newTime: string) => void;
  onCreateAt: (date: string, time: string) => void;
}

const EVENT_COLORS: Record<EventType, string> = {
  MAINTENANCE: 'from-blue-500/80 to-blue-600/80 border-blue-400 text-white',
  STAFFING: 'from-orange-500/80 to-orange-600/80 border-orange-400 text-white',
  SUPPLY: 'from-purple-500/80 to-purple-600/80 border-purple-400 text-white',
  EVENT: 'from-emerald-500/80 to-emerald-600/80 border-emerald-400 text-white',
  NOTE: 'from-yellow-500/80 to-yellow-600/80 border-yellow-400 text-black',
  OTHER: 'from-gray-500/80 to-gray-600/80 border-gray-400 text-white',
};

function getDatesForMode(mode: 'WEEK' | 'DAY', anchor: Date): Date[] {
  if (mode === 'DAY') return [new Date(anchor)];
  const monday = new Date(anchor);
  const day = monday.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

function parseTime(t: string): { h: number; m: number } {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  return { h: h || 0, m: m || 0 };
}

function durationMinutes(start: string, end?: string): number {
  if (!end) return 60;
  const a = parseTime(start);
  const b = parseTime(end);
  return Math.max(30, (b.h * 60 + b.m) - (a.h * 60 + a.m));
}

function positionTop(time: string): number {
  const { h, m } = parseTime(time);
  const offsetH = h - HOURS[0];
  if (offsetH < 0) return 0;
  return offsetH * SLOT_HEIGHT + (m / 60) * SLOT_HEIGHT;
}

// Conflits : 2 events sur la même date qui se chevauchent
function detectConflicts(items: { id: string; date: string; time: string; endTime?: string }[]): Set<string> {
  const conflictIds = new Set<string>();
  const byDate = new Map<string, typeof items>();
  for (const it of items) {
    if (!byDate.has(it.date)) byDate.set(it.date, []);
    byDate.get(it.date)!.push(it);
  }
  for (const [, dayItems] of byDate) {
    for (let i = 0; i < dayItems.length; i++) {
      for (let j = i + 1; j < dayItems.length; j++) {
        const a = dayItems[i];
        const b = dayItems[j];
        const aStart = parseTime(a.time);
        const aEnd = a.endTime ? parseTime(a.endTime) : { h: aStart.h + 1, m: aStart.m };
        const bStart = parseTime(b.time);
        const bEnd = b.endTime ? parseTime(b.endTime) : { h: bStart.h + 1, m: bStart.m };
        const aS = aStart.h * 60 + aStart.m;
        const aE = aEnd.h * 60 + aEnd.m;
        const bS = bStart.h * 60 + bStart.m;
        const bE = bEnd.h * 60 + bEnd.m;
        if (aS < bE && bS < aE) {
          conflictIds.add(a.id);
          conflictIds.add(b.id);
        }
      }
    }
  }
  return conflictIds;
}

export default function WeekDayView({
  mode,
  anchorDate,
  events,
  missions,
  filterType,
  onItemClick,
  onEventReschedule,
  onCreateAt,
}: WeekDayViewProps) {
  const dates = useMemo(() => getDatesForMode(mode, anchorDate), [mode, anchorDate]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: string; time: string } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Filtrer les events
  const visibleEvents = useMemo(() => {
    return events.filter((e) => {
      if (filterType !== 'ALL' && e.type !== filterType) return false;
      return dates.some((d) => toIso(d) === e.date);
    });
  }, [events, filterType, dates]);

  // Projection des missions en items planning (si scheduledDate + date)
  const missionItems = useMemo(() => {
    return missions
      .filter((m) => m.scheduledDate || m.date)
      .map((m) => {
        const rawDate = m.scheduledDate || m.date || '';
        const dateStr = rawDate.includes('T') ? rawDate.split('T')[0] : rawDate;
        return { mission: m, date: dateStr, time: '09:00', endTime: '10:00' };
      })
      .filter((m) => dates.some((d) => toIso(d) === m.date));
  }, [missions, dates]);

  // Détection de conflits (events + missions confondus)
  const conflictIds = useMemo(() => {
    const allItems = [
      ...visibleEvents.map((e) => ({ id: e.id, date: e.date, time: e.time, endTime: e.endTime })),
      ...missionItems.map((m) => ({ id: m.mission.id, date: m.date, time: m.time, endTime: m.endTime })),
    ];
    return detectConflicts(allItems);
  }, [visibleEvents, missionItems]);

  const todayIso = toIso(new Date());

  const headerLabel = (d: Date) => {
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    if (mode === 'DAY') {
      return `${dayNames[d.getDay()]} ${d.getDate()} ${monthNames[d.getMonth()]}`;
    }
    return `${dayNames[d.getDay()]} ${d.getDate()}`;
  };

  function handleDragStart(e: React.DragEvent, eventId: string) {
    setDraggingId(eventId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', eventId);
  }

  function handleDragOver(e: React.DragEvent, date: string, hour: number) {
    if (!draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const time = `${String(hour).padStart(2, '0')}:00`;
    if (!dropTarget || dropTarget.date !== date || dropTarget.time !== time) {
      setDropTarget({ date, time });
    }
  }

  function handleDrop(e: React.DragEvent, date: string, hour: number) {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggingId;
    if (!eventId) return;
    const time = `${String(hour).padStart(2, '0')}:00`;
    onEventReschedule(eventId, date, time);
    setDraggingId(null);
    setDropTarget(null);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDropTarget(null);
  }

  return (
    <div className="w-full">
      {/* Headers colonnes */}
      <div
        className={clsx(
          'grid border-b border-[var(--border)] bg-[var(--bg-card)] sticky top-0 z-10',
          mode === 'DAY' ? 'grid-cols-[60px_1fr]' : 'grid-cols-[60px_repeat(7,1fr)]'
        )}
      >
        <div className="border-r border-[var(--border)] px-2 py-2 text-[10px] font-semibold text-[var(--text-secondary)] uppercase">
          Heure
        </div>
        {dates.map((d) => {
          const iso = toIso(d);
          const isToday = iso === todayIso;
          return (
            <div
              key={iso}
              className={clsx(
                'px-2 py-2 text-center border-r border-[var(--border)] last:border-r-0',
                isToday && 'bg-blue-500/10'
              )}
            >
              <p
                className={clsx(
                  'text-xs font-semibold uppercase',
                  isToday ? 'text-blue-500' : 'text-[var(--text-secondary)]'
                )}
              >
                {headerLabel(d)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grille */}
      <div
        ref={gridRef}
        className={clsx(
          'grid relative',
          mode === 'DAY' ? 'grid-cols-[60px_1fr]' : 'grid-cols-[60px_repeat(7,1fr)]'
        )}
      >
        {/* Colonne heures */}
        <div className="border-r border-[var(--border)]">
          {HOURS.map((h) => (
            <div
              key={h}
              style={{ height: SLOT_HEIGHT }}
              className="text-[10px] text-[var(--text-secondary)] px-2 pt-1 border-b border-[var(--border)]"
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Colonnes jours */}
        {dates.map((d) => {
          const iso = toIso(d);
          const isToday = iso === todayIso;

          const dayEvents = visibleEvents.filter((e) => e.date === iso);
          const dayMissions = missionItems.filter((m) => m.date === iso);

          return (
            <div
              key={iso}
              className={clsx(
                'relative border-r border-[var(--border)] last:border-r-0',
                isToday && 'bg-blue-500/5'
              )}
              style={{ height: HOURS.length * SLOT_HEIGHT }}
            >
              {/* Lignes heures (fond) */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  onDragOver={(e) => handleDragOver(e, iso, h)}
                  onDrop={(e) => handleDrop(e, iso, h)}
                  onDoubleClick={() => onCreateAt(iso, `${String(h).padStart(2, '0')}:00`)}
                  className={clsx(
                    'border-b border-[var(--border)] transition-colors',
                    dropTarget?.date === iso && dropTarget?.time === `${String(h).padStart(2, '0')}:00`
                      ? 'bg-emerald-500/20'
                      : 'hover:bg-[var(--bg-hover)]/30 cursor-pointer'
                  )}
                  style={{ height: SLOT_HEIGHT }}
                  title="Double-cliquer pour créer"
                />
              ))}

              {/* Events positionnés */}
              {dayEvents.map((ev) => {
                const top = positionTop(ev.time);
                const dur = durationMinutes(ev.time, ev.endTime);
                const height = Math.max(28, (dur / 60) * SLOT_HEIGHT - 2);
                const hasConflict = conflictIds.has(ev.id);
                const colorClass = EVENT_COLORS[ev.type];

                return (
                  <motion.div
                    key={ev.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: draggingId === ev.id ? 0.4 : 1 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e as any, ev.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onItemClick({ kind: 'event', event: ev })}
                    className={clsx(
                      'absolute left-1 right-1 rounded-md px-2 py-1 text-[11px] font-medium cursor-grab active:cursor-grabbing overflow-hidden shadow-sm bg-gradient-to-br border',
                      colorClass,
                      hasConflict && 'ring-2 ring-red-500'
                    )}
                    style={{ top, height }}
                  >
                    <div className="flex items-start gap-1">
                      <GripVertical className="w-3 h-3 mt-0.5 opacity-60 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate flex items-center gap-1">
                          {hasConflict && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                          {ev.title}
                        </p>
                        <p className="text-[10px] opacity-90 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {ev.time}{ev.endTime ? `-${ev.endTime}` : ''}
                        </p>
                        {ev.location && (
                          <p className="text-[10px] opacity-80 truncate flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            {ev.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Missions positionnées (non-draggable car scheduledDate vient d'ailleurs) */}
              {dayMissions.map(({ mission, time }) => {
                const top = positionTop(time);
                const hasConflict = conflictIds.has(mission.id);

                return (
                  <motion.button
                    key={mission.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => onItemClick({ kind: 'mission', mission })}
                    className={clsx(
                      'absolute left-1 right-1 rounded-md px-2 py-1 text-[11px] font-medium overflow-hidden shadow-sm bg-gradient-to-br from-indigo-500/80 to-indigo-600/80 border border-indigo-400 text-white cursor-pointer text-left',
                      hasConflict && 'ring-2 ring-red-500'
                    )}
                    style={{ top, height: SLOT_HEIGHT - 2 }}
                  >
                    <p className="font-semibold truncate flex items-center gap-1">
                      {hasConflict && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
                      🔧 {mission.title}
                    </p>
                    <p className="text-[10px] opacity-90">Mission · {mission.status}</p>
                  </motion.button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[var(--text-secondary)]">
        <span className="flex items-center gap-1">
          <GripVertical className="w-3 h-3" /> Glisser pour replanifier
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-500" /> Conflit horaire
        </span>
        <span>Double-clic créneau : créer un événement</span>
      </div>
    </div>
  );
}
