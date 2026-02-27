'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Receipt, Warehouse, Calendar } from 'lucide-react';
import { clsx } from 'clsx';

const BOTTOM_NAV_ITEMS = [
  { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Accueil' },
  { id: 'TEAM', icon: Users, label: 'Équipe' },
  { id: 'PAYSLIPS', icon: Receipt, label: 'Paie' },
  { id: 'GARAGE', icon: Warehouse, label: 'Équip.' },
  { id: 'PLANNING', icon: Calendar, label: 'Planning' },
];

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[80] lg:hidden">
      <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/10 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActive"
                    className="absolute -top-px left-3 right-3 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <item.icon
                  className={clsx(
                    'w-5 h-5 transition-colors',
                    isActive ? 'text-blue-400' : 'text-gray-500'
                  )}
                />
                <span
                  className={clsx(
                    'text-[10px] font-medium transition-colors',
                    isActive ? 'text-blue-400' : 'text-gray-500'
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
