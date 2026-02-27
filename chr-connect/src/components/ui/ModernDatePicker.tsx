import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernDatePickerProps {
  value: string; // YYYY-MM-DD or YYYY-MM
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  type?: 'date' | 'month';
  disabled?: boolean;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export default function ModernDatePicker({ 
  value, 
  onChange, 
  label, 
  placeholder = "Sélectionner une date",
  className = "",
  type = 'month',
  disabled = false
}: ModernDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'days' | 'months'>('days');
  const [currentDate, setCurrentDate] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const [yearInput, setYearInput] = useState(currentDate.getFullYear().toString());

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setCurrentDate(date);
      setYearInput(date.getFullYear().toString());
    }
    // Set initial view based on type
    if (type === 'month') setView('months');
  }, [value, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleYearChange = (increment: number) => {
    const newDate = new Date(currentDate);
    // Reset to 1st of month to avoid skipping months (e.g. Jan 31 -> Feb 28)
    newDate.setDate(1);
    newDate.setFullYear(newDate.getFullYear() + increment);
    setCurrentDate(newDate);
    setYearInput(newDate.getFullYear().toString());
  };

  const handleYearInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYearInput(val);
    if (val.length === 4) {
      const year = parseInt(val);
      if (!isNaN(year) && year > 1900 && year < 2100) {
        const newDate = new Date(currentDate);
        newDate.setDate(1); // Reset to 1st of month
        newDate.setFullYear(year);
        setCurrentDate(newDate);
      }
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(1); // Reset to 1st of month
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    
    if (type === 'month') {
      const year = newDate.getFullYear();
      const formattedDate = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
      onChange(formattedDate);
      setIsOpen(false);
    } else {
      setView('days');
    }
  };

  const handleDaySelect = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (type === 'month') {
      return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    }
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Use the 1st of the current month/year for start offset
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    return { daysInMonth, startOffset: adjustedFirstDay };
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>}
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full bg-[var(--bg-input)] border rounded-xl px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-all
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-[var(--border)] hover:border-[var(--border-strong)]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <CalendarIcon className={`w-4 h-4 ${value ? 'text-blue-400' : 'text-[var(--text-muted)]'}`} />
        <span className={`text-sm ${value ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
          {value ? formatDateDisplay(value) : placeholder}
        </span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] mt-2 w-72 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-hover)]">
              <button 
                onClick={(e) => { e.stopPropagation(); handleYearChange(-1); }}
                className="p-1 hover:bg-[var(--bg-active)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('months')}
                  className="font-bold text-[var(--text-primary)] hover:text-blue-400 transition-colors"
                >
                  {MONTHS[currentDate.getMonth()]}
                </button>
                <input 
                  type="number"
                  value={yearInput}
                  onChange={handleYearInput}
                  className="w-16 bg-transparent text-center font-bold text-[var(--text-primary)] border-none focus:ring-0 outline-none p-0 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); handleYearChange(1); }}
                className="p-1 hover:bg-[var(--bg-active)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* View Content */}
            <div className="p-2">
              {view === 'months' ? (
                <div className="grid grid-cols-3 gap-1">
                  {MONTHS.map((month, index) => {
                    const isSelected = value && 
                      new Date(value).getMonth() === index && 
                      new Date(value).getFullYear() === currentDate.getFullYear();
                    
                    return (
                      <button
                        key={month}
                        onClick={(e) => { e.stopPropagation(); handleMonthSelect(index); }}
                        className={`
                          p-2 rounded-lg text-sm font-medium transition-colors
                          ${isSelected
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                          }
                          ${index === currentDate.getMonth() ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]' : ''}
                        `}
                      >
                        {month.slice(0, 3)}.
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                          <div className="grid grid-cols-7 mb-2 text-center">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                              <span key={`${d}-${i}`} className="text-xs font-medium text-[var(--text-muted)]">{d}</span>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: getDaysInMonth(currentDate).startOffset }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: getDaysInMonth(currentDate).daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isSelected = value && 
                        new Date(value).getDate() === day &&
                        new Date(value).getMonth() === currentDate.getMonth() && 
                        new Date(value).getFullYear() === currentDate.getFullYear();

                      return (
                        <button
                          key={day}
                          onClick={(e) => { e.stopPropagation(); handleDaySelect(day); }}
                          className={`
                            w-8 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center mx-auto
                            ${isSelected
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
                            }
                          `}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
