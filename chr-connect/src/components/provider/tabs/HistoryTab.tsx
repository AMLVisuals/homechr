import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Calendar, MapPin, Clock, ArrowRight, CheckCircle, ChevronRight, ChevronDown, Euro } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { useMissionsStore } from '@/store/useMissionsStore';

function formatMonthLabel(year: number, month: number): string {
  const date = new Date(year, month);
  return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function generateMonthOptions() {
  const now = new Date();
  const options: { year: number; month: number; label: string }[] = [];
  // 3 ans en arrière jusqu'au mois en cours
  for (let i = 36; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    });
  }
  return options.reverse(); // plus récent en haut
}

interface HistoryEntry {
  id: string;
  title: string;
  venue: string;
  date: string;
  isoDate: string;
  duration: string;
  amount: string;
  status: string;
  image: string;
  report: { text: string; before: string; after: string };
}

export function HistoryTab() {
  const now = new Date();
  const allMissions = useMissionsStore((s) => s.missions);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<HistoryEntry | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Build history from completed missions
  const HISTORY: HistoryEntry[] = useMemo(() =>
    allMissions
      .filter((m) => m.status === 'COMPLETED')
      .map((m) => ({
        id: m.id,
        title: m.title,
        venue: m.venue || '—',
        date: m.expiresAt
          ? new Date(m.expiresAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—',
        isoDate: m.expiresAt ? new Date(m.expiresAt).toISOString().slice(0, 10) : '',
        duration: '—',
        amount: m.price ? `${Number(m.price).toFixed(2)} €` : '—',
        status: 'COMPLETED',
        image: '',
        report: { text: m.description || '', before: '', after: '' },
      })),
    [allMissions]
  );

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  // Fermer le picker au clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    if (isPickerOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isPickerOpen]);

  const filtered = useMemo(() => {
    return HISTORY.filter(m => {
      const d = new Date(m.isoDate);
      return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
  }, [selectedYear, selectedMonth]);

  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
  const currentLabel = formatMonthLabel(selectedYear, selectedMonth);

  if (selectedMission) {
      return (
          <div className="h-full flex flex-col">
              <button
                onClick={() => setSelectedMission(null)}
                className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 transition-colors"
              >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  Retour à l'historique
              </button>

              <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-300">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                      <div>
                          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{selectedMission.title}</h2>
                          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                              <MapPin className="w-4 h-4" />
                              {selectedMission.venue}
                          </div>
                      </div>
                      <div className="text-right">
                          <div className="text-xl font-bold text-green-400">{selectedMission.amount}</div>
                          <div className="text-sm text-[var(--text-muted)]">{selectedMission.date}</div>
                      </div>
                  </div>

                  {/* Before / After */}
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <span className="text-sm font-medium text-[var(--text-secondary)]">Avant</span>
                          <div className="aspect-video rounded-xl overflow-hidden bg-[var(--bg-hover)] border border-[var(--border)] relative group">
                              <img src={selectedMission.report.before} alt="Avant" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <span className="text-sm font-medium text-[var(--text-secondary)]">Après</span>
                          <div className="aspect-video rounded-xl overflow-hidden bg-[var(--bg-hover)] border border-[var(--border)] relative group">
                              <img src={selectedMission.report.after} alt="Après" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              <div className="absolute bottom-2 right-2 bg-green-500/90 text-black text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Validé
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Report */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-5 border border-[var(--border)]">
                      <h3 className="font-bold text-[var(--text-primary)] mb-3">Rapport d'intervention</h3>
                      <p className="text-[var(--text-secondary)] leading-relaxed">
                          {selectedMission.report.text}
                      </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                      <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] text-center">
                          <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-[var(--text-primary)]">{selectedMission.duration}</div>
                          <div className="text-xs text-[var(--text-muted)]">Durée</div>
                      </div>
                      <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] text-center">
                          <Euro className="w-5 h-5 text-green-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-[var(--text-primary)]">{selectedMission.amount}</div>
                          <div className="text-xs text-[var(--text-muted)]">Facturé</div>
                      </div>
                      <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] text-center">
                          <CheckCircle className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                          <div className="text-lg font-bold text-[var(--text-primary)]">5.0</div>
                          <div className="text-xs text-[var(--text-muted)]">Note</div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-4">
      {/* Month Picker Dropdown */}
      <div ref={pickerRef} className="relative">
        <button
          onClick={() => setIsPickerOpen(!isPickerOpen)}
          className="w-full flex items-center justify-between bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 hover:border-[var(--border-strong)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-[var(--text-primary)] capitalize">{currentLabel}</span>
            {isCurrentMonth && <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Mois en cours</span>}
          </div>
          <ChevronDown className={clsx("w-4 h-4 text-[var(--text-muted)] transition-transform", isPickerOpen && "rotate-180")} />
        </button>
        <AnimatePresence>
          {isPickerOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-30 max-h-64 overflow-y-auto custom-scrollbar"
            >
              {monthOptions.map((opt) => {
                const isSelected = opt.year === selectedYear && opt.month === selectedMonth;
                const isCurrent = opt.year === now.getFullYear() && opt.month === now.getMonth();
                return (
                  <button
                    key={`${opt.year}-${opt.month}`}
                    onClick={() => { setSelectedYear(opt.year); setSelectedMonth(opt.month); setIsPickerOpen(false); }}
                    className={clsx(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors capitalize flex items-center justify-between",
                      isSelected
                        ? "bg-blue-600/10 text-blue-400 font-bold"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <span>{opt.label}</span>
                    {isCurrent && <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">Actuel</span>}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)] text-sm">Aucune mission ce mois-ci</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">{filtered.length} mission{filtered.length > 1 ? 's' : ''}</p>
          {filtered.map((mission, index) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedMission(mission)}
              className="bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-xl p-4 cursor-pointer transition-all group"
            >
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-[var(--bg-active)] shrink-0">
                  <img src={mission.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-[var(--text-primary)] truncate pr-4">{mission.title}</h3>
                    <span className="text-green-400 font-mono font-bold">{mission.amount}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-2">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{mission.venue}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                    <span>{mission.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/20">
                        TERMINÉE
                     </span>
                     <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {mission.duration}
                     </span>
                  </div>
                </div>
                <div className="flex items-center text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
