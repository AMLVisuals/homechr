'use client';

import { Filter, Zap, DollarSign, Snowflake, Flame, Users, Music, Monitor, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterType } from '@/types/missions';
import { motion } from 'framer-motion';

interface FilterPillsProps {
  activeFilter: FilterType;
  setActiveFilter: (filter: FilterType) => void;
  authorizedCategories?: string[];
}

export function FilterPills({ activeFilter, setActiveFilter, authorizedCategories }: FilterPillsProps) {
  const allFilters = [
    { id: 'all' as FilterType, label: 'Tout', icon: <Filter className="h-3 w-3" /> },
    { id: 'urgent' as FilterType, label: 'Urgences', icon: <Zap className="h-3 w-3" /> },
    { id: 'high-paying' as FilterType, label: '+200€', icon: <DollarSign className="h-3 w-3" /> },
    { id: 'cold' as FilterType, label: 'Froid', icon: <Snowflake className="h-3 w-3" /> },
    { id: 'hot' as FilterType, label: 'Chaud', icon: <Flame className="h-3 w-3" /> },
    { id: 'staff' as FilterType, label: 'Staff', icon: <Users className="h-3 w-3" /> },
  ];

  const filters = allFilters.filter(f => {
    // Always show global filters
    if (['all', 'urgent', 'high-paying'].includes(f.id)) return true;
    // Show category filters only if authorized
    if (authorizedCategories && authorizedCategories.length > 0) {
        return authorizedCategories.includes(f.id);
    }
    return true; // Show all if no restriction
  });
  
  return (
    <div className="absolute top-24 left-0 right-0 z-[400] px-4">
      <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar touch-pan-x">
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              'flex items-center space-x-2 whitespace-nowrap backdrop-blur-md px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
              activeFilter === filter.id
                ? 'bg-white/20 text-white border-white/40 shadow-lg shadow-white/10'
                : 'bg-black/40 text-[var(--text-muted)] border-[var(--border)] hover:bg-black/60 hover:text-[var(--text-primary)]'
            )}
          >
            {filter.icon}
            <span>{filter.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
