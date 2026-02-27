'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Receipt, Warehouse,
  CreditCard, Calendar, Settings, User,
} from 'lucide-react';
import { clsx } from 'clsx';

export const NAV_ITEMS = [
  { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Mon tableau de bord' },
  { id: 'TEAM', icon: Users, label: 'Mon Équipe' },
  { id: 'PAYSLIPS', icon: Receipt, label: 'Bulletin de paie' },
  { id: 'GARAGE', icon: Warehouse, label: 'Mes équipements' },
  { id: 'INVOICES', icon: CreditCard, label: 'Mes factures' },
  { id: 'PLANNING', icon: Calendar, label: 'Planning' },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onRoleChange: () => void;
  onSettingsClick?: () => void;
  layoutId?: string;
}

export default function Sidebar({ activeTab, onTabChange, onRoleChange, onSettingsClick, layoutId = 'activeTabDesktop' }: SidebarProps) {
  return (
    <>
      <div
        onClick={() => onTabChange('DASHBOARD')}
        className="h-16 flex items-center justify-start px-6 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg text-white">
          C
        </div>
        <span className="ml-3 font-bold text-xl tracking-wider text-[var(--text-primary)]">CONNECT</span>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-3">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={clsx(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
              activeTab === item.id
                ? 'bg-blue-500/10 text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            <item.icon className={clsx('w-5 h-5 z-10', activeTab === item.id ? 'text-blue-500' : 'group-hover:text-[var(--text-primary)]')} />
            <span className="font-medium text-sm z-10">{item.label}</span>

            {activeTab === item.id && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/5 rounded-xl"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border)] space-y-2">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Paramètres</span>
        </button>
        <button
          onClick={onRoleChange}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-sm font-medium">Changer Rôle</span>
        </button>
      </div>
    </>
  );
}
