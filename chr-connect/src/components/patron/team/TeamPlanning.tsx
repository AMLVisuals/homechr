'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Palmtree, Thermometer, UserPlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMissionsStore, type ScheduleStatus } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const ALL_STATUSES: (ScheduleStatus | null)[] = ['PRESENT', 'CONGE', 'MALADIE', null];

const STATUS_CONFIG: Record<string, {
  label: string;
  bg: string;
  border: string;
  text: string;
  icon: typeof Check;
}> = {
  PRESENT: {
    label: 'Présent',
    bg: 'bg-green-500/20',
    border: 'border-green-500/40',
    text: 'text-green-400',
    icon: Check,
  },
  CONGE: {
    label: 'Congé',
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/40',
    text: 'text-blue-400',
    icon: Palmtree,
  },
  MALADIE: {
    label: 'Maladie',
    bg: 'bg-red-500/20',
    border: 'border-red-500/40',
    text: 'text-red-400',
    icon: Thermometer,
  },
};

export default function TeamPlanning() {
  const { team, teamSchedule, setScheduleStatus } = useMissionsStore();
  const { activeVenueId } = useVenuesStore();

  const filteredTeam = team.filter(member => {
    if (activeVenueId && member.venueId && member.venueId !== activeVenueId) return false;
    return true;
  });

  const [weekOffset, setWeekOffset] = useState(0);
  const [openPopup, setOpenPopup] = useState<{ dateKey: string; memberId: string } | null>(null);

  const days = useMemo(() => {
    const start = getWeekStart(new Date());
    start.setDate(start.getDate() + weekOffset * 7);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const today = formatDateKey(new Date());

  const handleSelect = useCallback((dateKey: string, memberId: string, status: ScheduleStatus | null) => {
    setScheduleStatus(dateKey, memberId, status);
    setOpenPopup(null);
  }, [setScheduleStatus]);

  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    days.forEach(d => {
      const key = formatDateKey(d);
      const dayData = teamSchedule[key] || {};
      counts[key] = Object.entries(dayData).filter(
        ([id, status]) => status === 'PRESENT' && filteredTeam.some(m => m.id === id)
      ).length;
    });
    return counts;
  }, [days, teamSchedule, filteredTeam]);

  if (filteredTeam.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4">
          <UserPlus className="w-10 h-10 text-[var(--text-muted)]" />
        </div>
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Aucun membre</h3>
        <p className="text-[var(--text-muted)] max-w-sm">
          Ajoutez des membres à votre équipe pour gérer leur planning.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Navigation semaines */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset(w => w - 2)}
          className="w-9 h-9 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-[var(--text-primary)]">
            {days[0].getDate()} {MONTH_NAMES[days[0].getMonth()]} — {days[13].getDate()} {MONTH_NAMES[days[13].getMonth()]} {days[13].getFullYear()}
          </p>
          <button
            onClick={() => setWeekOffset(0)}
            className={cn(
              "text-xs transition-colors",
              weekOffset === 0 ? "text-[var(--text-muted)]" : "text-blue-400 hover:text-blue-300 cursor-pointer"
            )}
            disabled={weekOffset === 0}
          >
            {weekOffset === 0 ? 'Semaines en cours' : "Revenir à aujourd'hui"}
          </button>
        </div>
        <button
          onClick={() => setWeekOffset(w => w + 2)}
          className="w-9 h-9 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Planning grid */}
      <div className="overflow-x-auto -mx-4 px-4 pb-2 custom-scrollbar">
        <div className="min-w-[800px]">
          {/* Header jours */}
          <div className="grid" style={{ gridTemplateColumns: '180px repeat(14, minmax(44px, 1fr))' }}>
            <div className="p-2" />
            {days.map((d, i) => {
              const key = formatDateKey(d);
              const isToday = key === today;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              const count = dayCounts[key] || 0;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex flex-col items-center py-3 rounded-t-xl text-center",
                    isToday && "bg-blue-500/10",
                    isWeekend && !isToday && "bg-[var(--bg-hover)]/50",
                    i === 6 && "border-r-2 border-[var(--border)]"
                  )}
                >
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    isToday ? "text-blue-400" : isWeekend ? "text-[var(--text-muted)]" : "text-[var(--text-secondary)]"
                  )}>
                    {DAY_NAMES[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                  </span>
                  <span className={cn(
                    "text-sm font-bold mt-0.5",
                    isToday
                      ? "w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center"
                      : "text-[var(--text-primary)]"
                  )}>
                    {d.getDate()}
                  </span>
                  {count > 0 && (
                    <span className="text-[9px] font-medium text-green-400 mt-0.5">{count}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rows par membre */}
          {filteredTeam.map((member, memberIdx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: memberIdx * 0.03 }}
              className="grid border-t border-[var(--border)]"
              style={{ gridTemplateColumns: '180px repeat(14, minmax(44px, 1fr))' }}
            >
              {/* Member name */}
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-[var(--border)] shrink-0">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate">{member.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">{member.role}</p>
                </div>
              </div>

              {/* Day cells */}
              {days.map((d, i) => {
                const key = formatDateKey(d);
                const status = teamSchedule[key]?.[member.id] || null;
                const isToday = key === today;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                const config = status ? STATUS_CONFIG[status] : null;
                const isPopupOpen = openPopup?.dateKey === key && openPopup?.memberId === member.id;

                return (
                  <div
                    key={key}
                    className={cn(
                      "flex items-center justify-center py-3 transition-all",
                      isToday && "bg-blue-500/5",
                      isWeekend && !isToday && "bg-[var(--bg-hover)]/30",
                      i === 6 && "border-r-2 border-[var(--border)]",
                      "hover:bg-[var(--bg-hover)] cursor-pointer"
                    )}
                    onClick={() => setOpenPopup(isPopupOpen ? null : { dateKey: key, memberId: member.id })}
                  >
                    {config ? (
                      <motion.div
                        key={status}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          "w-9 h-9 rounded-xl border flex items-center justify-center",
                          config.bg,
                          config.border
                        )}
                      >
                        <config.icon className={cn("w-4 h-4", config.text)} />
                      </motion.div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl border border-dashed border-[var(--border)] opacity-30 hover:opacity-60 transition-opacity" />
                    )}
                  </div>
                );
              })}
            </motion.div>
          ))}

          {/* Footer: total présents par jour */}
          <div
            className="grid border-t-2 border-[var(--border)] mt-1"
            style={{ gridTemplateColumns: '180px repeat(14, minmax(44px, 1fr))' }}
          >
            <div className="flex items-center px-3 py-3">
              <span className="text-[11px] font-bold uppercase text-[var(--text-muted)]">Présents</span>
            </div>
            {days.map((d, i) => {
              const key = formatDateKey(d);
              const count = dayCounts[key] || 0;
              const isToday = key === today;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center justify-center py-3",
                    isToday && "bg-blue-500/5",
                    i === 6 && "border-r-2 border-[var(--border)]"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    count === 0 ? "text-red-400" : count < filteredTeam.length ? "text-amber-400" : "text-green-400"
                  )}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popup sélecteur - rendu en fixed pour éviter le décalage */}
      <AnimatePresence>
        {openPopup && (
          <>
            {/* Backdrop invisible pour fermer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100]"
              onClick={() => setOpenPopup(null)}
            />
            <PopupSelector
              dateKey={openPopup.dateKey}
              memberId={openPopup.memberId}
              currentStatus={teamSchedule[openPopup.dateKey]?.[openPopup.memberId] || null}
              onSelect={handleSelect}
            />
          </>
        )}
      </AnimatePresence>

      {/* Légende */}
      <div className="flex flex-wrap items-center justify-center gap-5 pt-2">
        {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[string]][]).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-lg border flex items-center justify-center", config.bg, config.border)}>
              <config.icon className={cn("w-3.5 h-3.5", config.text)} />
            </div>
            <span className="text-xs text-[var(--text-muted)]">{config.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg border border-dashed border-[var(--border)] opacity-40" />
          <span className="text-xs text-[var(--text-muted)]">Non renseigné</span>
        </div>
      </div>
    </div>
  );
}

/* Popup rendu en portail fixed, positionné au centre de l'écran */
function PopupSelector({
  dateKey,
  memberId,
  currentStatus,
  onSelect,
}: {
  dateKey: string;
  memberId: string;
  currentStatus: ScheduleStatus | null;
  onSelect: (dateKey: string, memberId: string, status: ScheduleStatus | null) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className="fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-2xl shadow-2xl p-2 min-w-[180px]"
      onClick={(e) => e.stopPropagation()}
    >
      <p className="text-[10px] font-bold uppercase text-[var(--text-muted)] px-3 pt-1 pb-2">Statut du jour</p>
      {ALL_STATUSES.map((s) => {
        const c = s ? STATUS_CONFIG[s] : null;
        const isActive = currentStatus === s;
        return (
          <button
            key={s || 'empty'}
            onClick={() => onSelect(dateKey, memberId, s)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
              isActive
                ? "bg-[var(--bg-active)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            )}
          >
            {c ? (
              <>
                <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0", c.bg, c.border)}>
                  <c.icon className={cn("w-4 h-4", c.text)} />
                </div>
                {c.label}
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-lg border border-dashed border-[var(--border)] flex items-center justify-center shrink-0 opacity-50">
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
                Effacer
              </>
            )}
            {isActive && <Check className="w-4 h-4 ml-auto text-blue-400" />}
          </button>
        );
      })}
    </motion.div>
  );
}
