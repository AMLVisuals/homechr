'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getJobFilters } from '@/lib/job-filters-mapping';
import { ActiveFilters } from '@/types/filters';
import { Filter, X } from 'lucide-react';

interface DynamicFilterPillsProps {
  jobId: string;
  activeFilters: ActiveFilters;
  onFilterChange: (filters: ActiveFilters) => void;
}

export function DynamicFilterPills({ jobId, activeFilters, onFilterChange }: DynamicFilterPillsProps) {
  const config = useMemo(() => getJobFilters(jobId), [jobId]);

  if (!config) return null;

  const handleToggle = (categoryId: string, value: string | boolean, isMultiSelect: boolean = false) => {
    const current = activeFilters[categoryId];
    let newValue: string | string[] | boolean | undefined;

    if (typeof value === 'boolean') {
      // Toggle boolean
      newValue = current === value ? undefined : value;
    } else {
      // String value
      if (isMultiSelect) {
        const currentArray = Array.isArray(current) ? current : (current ? [current as string] : []);
        if (currentArray.includes(value)) {
          newValue = currentArray.filter(v => v !== value);
          if (newValue.length === 0) newValue = undefined;
        } else {
          newValue = [...currentArray, value];
        }
      } else {
        newValue = current === value ? undefined : value;
      }
    }

    const newFilters = { ...activeFilters };
    if (newValue === undefined) {
      delete newFilters[categoryId];
    } else {
      newFilters[categoryId] = newValue;
    }
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="absolute top-24 left-0 right-0 z-[400] px-4">
      <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar touch-pan-x items-center">
        {/* Reset Button */}
        {hasActiveFilters && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 shrink-0"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}

        {/* Global Label (Optional) */}
        {!hasActiveFilters && (
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[var(--bg-active)] text-[var(--text-muted)] border border-[var(--border)] text-sm shrink-0">
            <Filter className="w-3 h-3" />
            <span>Filtres</span>
          </div>
        )}

        {/* Categories & Options */}
        {config.categories.map((category) => (
          <React.Fragment key={category.id}>
            {/* Divider if multiple categories? Maybe just space them out */}
            {category.options.map((option) => {
              const isActive = (() => {
                const current = activeFilters[category.id];
                if (Array.isArray(current)) return current.includes(option.value as string);
                return current === option.value;
              })();

              return (
                <motion.button
                  key={`${category.id}-${option.id}`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleToggle(category.id, option.value, category.isMultiSelect)}
                  className={cn(
                    'flex items-center space-x-2 whitespace-nowrap backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-medium transition-all border shrink-0',
                    isActive
                      ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-900/20'
                      : 'bg-black/40 text-[var(--text-muted)] border-[var(--border)] hover:bg-black/60 hover:text-[var(--text-primary)]'
                  )}
                >
                  {option.icon && <span className={isActive ? "text-white" : ""}>{option.icon}</span>}
                  <span>{option.label}</span>
                </motion.button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
