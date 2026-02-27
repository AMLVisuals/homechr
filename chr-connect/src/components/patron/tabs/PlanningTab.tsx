'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, MapPin, Trash2, Edit2, Filter, Globe, X, FileText, Wrench } from 'lucide-react';
import { clsx } from 'clsx';
import { useCalendarStore, CalendarEvent, EventType } from '@/store/calendarStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import EventModal from '../planning/EventModal';
import MissionDetailsModal from '../missions/MissionDetailsModal';
import { CreateMissionWizard } from '@/components/mission/CreateMissionWizard';
import { useMissionsStore } from '@/store/useMissionsStore';

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const EVENT_FILTERS: { id: EventType | 'ALL'; label: string; color: string }[] = [
  { id: 'ALL', label: 'Tout', color: 'bg-white' },
  { id: 'MAINTENANCE', label: 'Maint.', color: 'bg-blue-500' },
  { id: 'STAFFING', label: 'Staff', color: 'bg-orange-500' },
  { id: 'SUPPLY', label: 'Livr.', color: 'bg-purple-500' },
  { id: 'EVENT', label: 'Event', color: 'bg-emerald-500' },
  { id: 'NOTE', label: 'Note', color: 'bg-yellow-500' },
  { id: 'OTHER', label: 'Autre', color: 'bg-gray-500' },
];

export default function PlanningTab() {
  const { events, deleteEvent } = useCalendarStore();
  const { activeVenueId, venues } = useVenuesStore();
  const { missions } = useMissionsStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<any | null>(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);
  const [filterType, setFilterType] = useState<EventType | 'ALL'>('ALL');
  const [showGlobal, setShowGlobal] = useState(false);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [isChoiceOpen, setIsChoiceOpen] = useState(false);
  const [showMissionWizard, setShowMissionWizard] = useState(false);
  const [wizardDate, setWizardDate] = useState<string>('');

  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);

  // Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  
  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const days = [];
    
    // Previous month days
    for (let i = startDayIndex - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(year, month - 1, day);
      days.push({ 
        day, 
        currentMonth: false, 
        date: date.toISOString().split('T')[0] 
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ 
        day: i, 
        currentMonth: true, 
        date: date.toISOString().split('T')[0] 
      });
    }

    // Fill remaining cells to always have 42 (6 rows x 7 cols)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ 
        day: i, 
        currentMonth: false, 
        date: date.toISOString().split('T')[0] 
      });
    }

    return days;
  }, [year, month, startDayIndex, daysInMonth, prevMonthDays]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1);
    setCurrentDate(newDate);
    // Optionally auto-select the first day of the new month to keep context sync
    // setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Sync logic: if not global view, filter by activeVenueId
      // But allow GLOBAL events (venueId is empty/null) to show everywhere
      if (!showGlobal && activeVenueId) {
         if (e.venueId && e.venueId !== activeVenueId) return false;
      }
      return filterType === 'ALL' || e.type === filterType;
    });
  }, [events, filterType, activeVenueId, showGlobal]);

  const selectedDayEvents = filteredEvents.filter(e => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    // Sync current month view if user clicks a day from prev/next month
    const clickedDate = new Date(dateStr);
    if (clickedDate.getMonth() !== month || clickedDate.getFullYear() !== year) {
      setCurrentDate(new Date(clickedDate.getFullYear(), clickedDate.getMonth(), 1));
    }
    setIsMobileDetailOpen(true);
  };

  const handleDayDoubleClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setEditingEvent(undefined);
    setIsModalOpen(true);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  const handleAddEvent = () => {
    setEditingEvent(undefined);
    setIsChoiceOpen(true);
  };

  const handleCreateNote = () => {
    setIsChoiceOpen(false);
    setIsModalOpen(true);
  };

  const handleCreateMission = () => {
    setIsChoiceOpen(false);
    setWizardDate(selectedDate);
    setShowMissionWizard(true);
  };

  const handleEditEvent = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();

    // Check if event is linked to a mission
    if (event.missionId) {
      const mission = missions.find(m => m.id === event.missionId);
      if (mission) {
        setSelectedMission(mission);
        setIsMissionModalOpen(true);
        return;
      }
    }

    // Sync calendar to event date
    const eventDate = new Date(event.date);
    setCurrentDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
    
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Voulez-vous supprimer cet événement ?')) {
      deleteEvent(id);
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'MAINTENANCE': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'STAFFING': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'SUPPLY': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'EVENT': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'NOTE': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden lg:h-full">
      <div className="flex-1 overflow-y-auto custom-scrollbar relative lg:overflow-hidden lg:flex lg:flex-row lg:gap-6 lg:h-full">
        {/* Fixed Header Section (Header + Calendar) */}
        <div className="lg:static lg:flex-1 lg:h-full lg:flex lg:flex-col pb-4 lg:pb-0 px-4 lg:px-0 lg:overflow-y-auto lg:overflow-x-hidden custom-scrollbar">
          {/* Mobile Page Header */}
          <div className="md:hidden mb-2 text-center pt-4">
            <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">
              Planning
            </h2>
            <p className="text-sm text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">
              Gérez votre emploi du temps et vos équipes
            </p>
          </div>

          {/* Calendar Area */}
          <div className="w-full lg:flex-1 flex flex-col bg-[var(--bg-card)] backdrop-blur-xl rounded-3xl border border-[var(--border)] overflow-hidden shadow-2xl ring-1 ring-[var(--border)] min-h-[400px]">
        {/* Calendar Header - Compact & Modern */}
        <div className="sticky top-0 z-10 bg-[var(--bg-card)] backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between p-3 md:p-6 border-b border-[var(--border)] gap-3 md:gap-4">
          {/* Top Row (Mobile): Date + Add Button */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2 capitalize">
                <span className="bg-gradient-to-tr from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">
                  {new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(currentDate)}
                </span>
                <span className="text-[var(--text-muted)] font-light">
                  {new Intl.DateTimeFormat('fr-FR', { year: 'numeric' }).format(currentDate)}
                </span>
              </h2>
            </div>
            
            {/* Mobile Add Button */}
            <button 
              onClick={handleAddEvent}
              className="md:hidden w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between md:justify-end gap-2 md:gap-4 w-full md:w-auto">
            <div className="flex items-center bg-[var(--bg-input)] rounded-lg p-1 border border-[var(--border)] shadow-inner shrink-0">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1.5 hover:bg-[var(--bg-active)] rounded-md transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleJumpToToday}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <span className="hidden md:inline">Aujourd'hui</span>
                <span className="md:hidden">auj.</span>
              </button>
              <button
                onClick={() => changeMonth(1)}
                className="p-1.5 hover:bg-[var(--bg-active)] rounded-md transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              {/* Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={clsx(
                    "flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-lg border transition-all",
                    isFilterOpen ? "bg-white text-black border-white" : "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">
                    {filterType === 'ALL' ? 'Filtres' : EVENT_FILTERS.find(f => f.id === filterType)?.label}
                  </span>
                </button>

                <AnimatePresence>
                  {isFilterOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsFilterOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl z-20 overflow-hidden"
                      >
                        <div className="p-1 space-y-0.5">
                          {EVENT_FILTERS.map(filter => (
                            <button
                              key={filter.id}
                              onClick={() => {
                                setFilterType(filter.id);
                                setIsFilterOpen(false);
                              }}
                              className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-lg transition-colors",
                                filterType === filter.id
                                  ? "bg-[var(--bg-active)] text-[var(--text-primary)]"
                                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                              )}
                            >
                              <span className={clsx("w-2 h-2 rounded-full", filter.color)} />
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-4 w-px bg-[var(--border)] hidden md:block" />

              {/* Global Toggle */}
              <div className="flex items-center bg-[var(--bg-input)] rounded-lg p-1 border border-[var(--border)] shadow-inner">
                <button
                  onClick={() => setShowGlobal(false)}
                  className={clsx(
                    "px-2 md:px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                    !showGlobal ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <span className="hidden md:inline">Local</span>
                  <span className="md:hidden">L</span>
                </button>
                <button
                  onClick={() => setShowGlobal(true)}
                  className={clsx(
                    "px-2 md:px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1.5",
                    showGlobal ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Globe className="w-3 h-3 md:hidden" />
                  <span className="hidden md:inline flex items-center gap-1.5"><Globe className="w-3 h-3" /> Global</span>
                </button>
              </div>

              <button 
                onClick={handleAddEvent}
                className="hidden md:flex ml-0 md:ml-2 w-8 h-8 bg-blue-600 hover:bg-blue-500 text-white rounded-lg items-center justify-center transition-all shadow-lg shadow-blue-900/20 hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Grid - Auto Fit */}
        <div className="flex-1 flex flex-col min-h-[350px] md:min-h-0 p-2 md:p-4">
          <div className="grid grid-cols-7 mb-2 px-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest py-1">
                {d.slice(0, 1)}<span className="hidden md:inline">{d.slice(1)}</span>
              </div>
            ))}
          </div>
          <div 
            className="grid grid-cols-7 gap-px bg-[var(--border)] border border-[var(--border)] rounded-2xl overflow-hidden flex-1 min-h-0 shadow-2xl"
            style={{ gridTemplateRows: `repeat(6, 1fr)` }}
          >
            {calendarDays.map((dayObj, idx) => {
              const dayEvents = filteredEvents.filter(e => e.date === dayObj.date);
              const isSelected = dayObj.date === selectedDate;
              const isToday = dayObj.date === new Date().toISOString().split('T')[0];
              
              return (
                <div 
                  key={`${dayObj.date}-${idx}`}
                  onClick={() => handleDayClick(dayObj.date)}
                  onDoubleClick={() => handleDayDoubleClick(dayObj.date)}
                  className={clsx(
                    "relative transition-all cursor-pointer flex flex-col group overflow-hidden bg-[var(--bg-card)]",
                    !dayObj.currentMonth && "bg-[var(--bg-sidebar)] opacity-50",
                    dayObj.currentMonth && !isSelected && "hover:bg-[var(--bg-hover)]",
                    isSelected && "bg-blue-500/5 shadow-[inset_0_0_0_2px_rgba(59,130,246,0.5)] z-10"
                  )}
                >
                  <div className="flex justify-center md:justify-between items-center md:items-start p-1 md:p-2 h-full md:h-auto">
                    <span className={clsx(
                      "text-[10px] md:text-xs font-medium w-6 h-6 md:w-6 md:h-6 flex items-center justify-center rounded-full transition-all",
                      isSelected ? "bg-blue-500 text-white" :
                      isToday ? "bg-white text-black font-bold" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                    )}>
                      {dayObj.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="hidden md:block text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded-full">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1 px-0.5 md:px-1.5 pb-0.5 md:pb-1.5 overflow-hidden flex flex-col justify-end md:justify-start">
                    {/* Desktop: Text Events */}
                    <div className="hidden md:block space-y-1 overflow-y-auto custom-scrollbar h-full">
                      {dayEvents.slice(0, 4).map(event => (
                        <div 
                          key={event.id} 
                          className={clsx(
                            "text-[9px] truncate px-1.5 py-0.5 rounded-sm font-medium border-l-[2px] bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-colors",
                            getEventColor(event.type)
                          )}
                        >
                          {event.time} {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 4 && (
                        <div className="text-[9px] text-[var(--text-muted)] pl-1 font-medium">
                          + {dayEvents.length - 4}
                        </div>
                      )}
                    </div>

                    {/* Mobile: Dots Only */}
                    <div className="md:hidden flex flex-wrap gap-0.5 justify-center content-end pb-1 absolute bottom-1 left-0 right-0 px-1">
                      {dayEvents.slice(0, 4).map(event => (
                        <div 
                          key={event.id} 
                          className={clsx(
                            "w-1.5 h-1.5 rounded-full",
                            event.type === 'MAINTENANCE' ? 'bg-blue-500' :
                            event.type === 'STAFFING' ? 'bg-orange-500' :
                            event.type === 'SUPPLY' ? 'bg-purple-500' :
                            event.type === 'EVENT' ? 'bg-emerald-500' :
                            event.type === 'NOTE' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          )} 
                        />
                      ))}
                      {dayEvents.length > 4 && (
                         <div className="w-1.5 h-1.5 rounded-full bg-[var(--bg-active)]" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>

      {/* Side Panel: Selected Day & Upcoming (Right Column) */}
      <div className="hidden lg:flex w-full lg:w-96 flex-col gap-6 shrink-0 h-full">
        {/* Selected Day Header */}
        <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border)] shadow-xl relative overflow-hidden group shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-blue-600/20 transition-all duration-500" />
          
          <div className="relative z-10">
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-1 capitalize">
              {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric' }).format(new Date(selectedDate))}
            </h3>
            <p className="text-[var(--text-secondary)] font-medium text-lg capitalize">
              {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(selectedDate))}
            </p>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] shadow-xl flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map(event => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => handleEditEvent(event, e)}
                  className="p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-active)] transition-all group cursor-pointer relative overflow-hidden"
                >
                  <div className={clsx("absolute left-0 top-0 bottom-0 w-1", 
                    event.type === 'MAINTENANCE' ? 'bg-blue-500' :
                    event.type === 'STAFFING' ? 'bg-orange-500' :
                    event.type === 'SUPPLY' ? 'bg-purple-500' :
                    event.type === 'EVENT' ? 'bg-emerald-500' :
                    event.type === 'NOTE' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  )} />
                  
                  <div className="flex justify-between items-start mb-2 pl-2">
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                      getEventColor(event.type)
                    )}>
                      {event.type}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditEvent(event, e)}
                        className="p-1 hover:bg-[var(--bg-active)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteEvent(event.id, e)}
                        className="p-1 hover:bg-red-500/20 rounded text-[var(--text-secondary)] hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="pl-2">
                    <h4 className="font-bold text-[var(--text-primary)] text-lg mb-1">{event.title}</h4>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {event.time} {event.endTime ? `- ${event.endTime}` : ''}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                      {showGlobal && event.venueId && (
                        <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          <Globe className="w-3 h-3" />
                          {venues.find(v => v.id === event.venueId)?.name || 'Inconnu'}
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="mt-3 text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed border-t border-[var(--border)] pt-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center py-10 text-[var(--text-muted)] border-2 border-dashed border-[var(--border)] rounded-2xl"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4">
                  <CalendarIcon className="w-8 h-8 opacity-20" />
                </div>
                <p className="font-medium mb-1">Aucun événement</p>
                <p className="text-xs text-[var(--text-muted)] mb-4">Rien de prévu pour cette journée</p>
                <button 
                  onClick={handleAddEvent}
                  className="text-sm text-blue-400 hover:text-blue-300 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Ajouter une tâche
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>
      </div>

      <AnimatePresence>
        {isMobileDetailOpen && (
          <MobileDaySheet
            date={selectedDate}
            events={selectedDayEvents}
            onClose={() => setIsMobileDetailOpen(false)}
            onAdd={() => {
              setIsMobileDetailOpen(false);
              handleAddEvent();
            }}
            onEdit={(e, event) => {
              setIsMobileDetailOpen(false);
              handleEditEvent(event, e);
            }}
            onDelete={(e, id) => {
              handleDeleteEvent(id, e);
            }}
            getEventColor={getEventColor}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChoiceOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsChoiceOpen(false)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden"
             >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Ajouter au planning</h3>
                <p className="text-[var(--text-muted)] text-sm mb-6">Que souhaitez-vous programmer pour le {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(selectedDate))} ?</p>
                
                <div className="grid gap-4">
                  <button
                    onClick={handleCreateMission}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 hover:border-blue-500/50 transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Wrench className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">Programmer une Mission</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Maintenance, Staffing, Réparation...</p>
                    </div>
                  </button>

                  <button
                    onClick={handleCreateNote}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] hover:bg-[var(--bg-active)] transition-all group text-left"
                  >
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-active)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-secondary)] transition-colors">Note ou Rendez-vous</h4>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Rappel simple, réunion, mémo...</p>
                    </div>
                  </button>
                </div>

                <button 
                  onClick={() => setIsChoiceOpen(false)}
                  className="mt-6 w-full py-3 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Annuler
                </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CreateMissionWizard 
        isOpen={showMissionWizard}
        onClose={() => setShowMissionWizard(false)}
        defaultDate={wizardDate}
      />

      <AnimatePresence>
        {isModalOpen && (
          <EventModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            selectedDate={selectedDate}
            existingEvent={editingEvent}
            onSuccess={(eventData) => {
              setSelectedDate(eventData.date);
              
              // Switch to Global view if the event was created for a different venue
              if (!showGlobal && activeVenueId && eventData.venueId && eventData.venueId !== activeVenueId) {
                setShowGlobal(true);
              }

              // Ensure we jump to the month of the new event
              const eventDate = new Date(eventData.date);
              if (eventDate.getMonth() !== currentDate.getMonth() || eventDate.getFullYear() !== currentDate.getFullYear()) {
                setCurrentDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMissionModalOpen && selectedMission && (
          <MissionDetailsModal 
            mission={selectedMission}
            isOpen={isMissionModalOpen}
            onClose={() => setIsMissionModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileDaySheet({ 
  date, 
  events, 
  onClose, 
  onAdd, 
  onEdit, 
  onDelete,
  getEventColor 
}: { 
  date: string; 
  events: CalendarEvent[]; 
  onClose: () => void; 
  onAdd: () => void;
  onEdit: (e: React.MouseEvent, event: CalendarEvent) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  getEventColor: (type: string) => string;
}) {
  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 z-[60] md:hidden backdrop-blur-sm"
      />
      <motion.div
        initial={{ y: "100%" }} 
        animate={{ y: 0 }} 
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-[var(--bg-card)] rounded-t-3xl z-[70] md:hidden border-t border-[var(--border)] shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto mt-3 mb-6 shrink-0" />
        
        <div className="px-6 mb-6 shrink-0 flex items-start justify-between">
          <div>
            <h3 className="text-3xl font-bold text-[var(--text-primary)] mb-1 capitalize">
              {new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric' }).format(new Date(date))}
            </h3>
            <p className="text-[var(--text-secondary)] font-medium text-lg capitalize">
              {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(date))}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-[var(--bg-hover)] rounded-full hover:bg-[var(--bg-active)] transition-colors"
          >
            <X className="w-6 h-6 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-20 space-y-3">
          {events.length > 0 ? (
            events.map(event => (
              <div 
                key={event.id}
                onClick={(e) => onEdit(e, event)}
                className="p-4 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border)] active:scale-[0.98] transition-all relative overflow-hidden"
              >
                <div className={clsx("absolute left-0 top-0 bottom-0 w-1", 
                  event.type === 'MAINTENANCE' ? 'bg-blue-500' :
                  event.type === 'STAFFING' ? 'bg-orange-500' :
                  event.type === 'SUPPLY' ? 'bg-purple-500' :
                  event.type === 'EVENT' ? 'bg-emerald-500' :
                  event.type === 'NOTE' ? 'bg-yellow-500' :
                  'bg-gray-500'
                )} />
                
                <div className="flex justify-between items-start mb-2 pl-2">
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border",
                    getEventColor(event.type)
                  )}>
                    {event.type}
                  </span>
                  <button 
                    onClick={(e) => onDelete(e, event.id)}
                    className="p-2 -mr-2 -mt-2 text-[var(--text-muted)] active:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="text-base font-bold text-[var(--text-primary)] mb-1 pl-2">{event.title}</h4>
                
                <div className="flex items-center gap-3 pl-2">
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs">
                    <Clock className="w-3 h-3" />
                    {event.time}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1.5 text-[var(--text-secondary)] text-xs">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center text-[var(--text-muted)] py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4">
                <CalendarIcon className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm font-medium">Aucun événement prévu</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-card)] pb-8">
          <button 
            onClick={onAdd}
            className="w-full py-4 bg-blue-600 active:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ajouter un événement
          </button>
        </div>
      </motion.div>
    </>
  );
}
