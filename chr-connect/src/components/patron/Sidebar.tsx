'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Receipt, Warehouse,
  CreditCard, Calendar, Settings, User, Crown, Briefcase, Package, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';

export const NAV_ITEMS = [
  { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Mon tableau de bord', path: '/patron/tableau-de-bord' },
  { id: 'MISSIONS', icon: Briefcase, label: 'Missions', path: '/patron/missions' },
  { id: 'TEAM', icon: Users, label: 'Mon Équipe', path: '/patron/mon-equipe' },
  { id: 'PAYSLIPS', icon: Receipt, label: 'Bulletin de paie', path: '/patron/bulletins-paie', premium: true },
  { id: 'DPAE', icon: FileText, label: 'DPAE', path: '/patron/dpae', premium: true },
  { id: 'STOCK', icon: Package, label: 'Stock', path: '/patron/stock', premium: true },
  { id: 'GARAGE', icon: Warehouse, label: 'Mes équipements', path: '/patron/equipements' },
  { id: 'INVOICES', icon: CreditCard, label: 'Mes factures', path: '/patron/factures' },
  { id: 'PLANNING', icon: Calendar, label: 'Planning', path: '/patron/planning' },
];

interface SidebarProps {
  activeTab: string;
  onSettingsClick?: () => void;
  layoutId?: string;
}

export default function Sidebar({ activeTab, onSettingsClick, layoutId = 'activeTabDesktop' }: SidebarProps) {
  const router = useRouter();
  return (
    <>
      <div
        onClick={() => router.push('/')}
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
            onClick={() => router.push(item.path)}
            className={clsx(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
              activeTab === item.id
                ? 'bg-blue-500/10 text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            <item.icon className={clsx('w-5 h-5 z-10', activeTab === item.id ? 'text-blue-500' : 'group-hover:text-[var(--text-primary)]')} />
            <span className="font-medium text-sm z-10">{item.label}</span>
            {item.premium && (
              <span className="z-10 ml-auto inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black">
                <Crown className="w-3 h-3" />
              </span>
            )}

            {activeTab === item.id && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/5 rounded-xl"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Paramètres</span>
        </button>
      </div>
    </>
  );
}
