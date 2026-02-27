'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  AlertTriangle,
  Users,
  Calendar,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface FloatingActionButtonProps {
  onAction: (action: string) => void;
}

interface ActionItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// ============================================================================
// ACTION ITEMS
// ============================================================================

const ACTIONS: ActionItem[] = [
  {
    id: 'REPORT_EQUIPMENT_ISSUE',
    label: 'Déclarer une panne',
    description: 'Signaler un problème sur un équipement',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 'REQUEST_STAFF',
    label: 'Demander du personnel',
    description: 'Trouver un extra pour votre service',
    icon: <Users className="w-5 h-5" />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'SCHEDULE_MAINTENANCE',
    label: 'Planifier maintenance',
    description: 'Programmer une maintenance préventive',
    icon: <Calendar className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'ADD_EQUIPMENT',
    label: 'Ajouter équipement',
    description: 'Scanner ou ajouter une machine',
    icon: <Wrench className="w-5 h-5" />,
    color: 'from-green-500 to-emerald-500',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FloatingActionButton({ onAction }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (actionId: string) => {
    setIsOpen(false);
    onAction(actionId);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Action Items */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col gap-3"
            >
              {ACTIONS.map((action, index) => (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: 1,
                    transition: { delay: index * 0.05 },
                  }}
                  exit={{
                    opacity: 0,
                    x: 20,
                    scale: 0.8,
                    transition: { delay: (ACTIONS.length - index) * 0.03 },
                  }}
                  onClick={() => handleAction(action.id)}
                  className="flex items-center gap-3 group"
                >
                  {/* Label */}
                  <div className="px-4 py-2 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[var(--text-primary)] text-sm font-medium whitespace-nowrap">
                      {action.label}
                    </p>
                    <p className="text-[var(--text-muted)] text-xs">
                      {action.description}
                    </p>
                  </div>

                  {/* Icon Button */}
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-[var(--text-primary)] shadow-lg transition-transform hover:scale-110',
                      `bg-gradient-to-r ${action.color}`
                    )}
                  >
                    {action.icon}
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center text-[var(--text-primary)] shadow-2xl transition-colors',
            isOpen
              ? 'bg-[var(--bg-active)]'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
          )}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Plus className="w-6 h-6" />
          )}
        </motion.button>
      </div>
    </>
  );
}
