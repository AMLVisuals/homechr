'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BarChart3, Users, CreditCard, Settings, LogOut, ShieldCheck, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminStore } from '@/store/useAdminStore';
import type { AdminRole, AdminTab } from '@/types/admin';

interface NavItem {
  id: AdminTab;
  icon: typeof BarChart3;
  label: string;
  path: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'DASHBOARD', icon: BarChart3, label: "Vue d'ensemble", path: '/admin/tableau-de-bord', adminOnly: true },
  { id: 'USERS', icon: Users, label: 'Utilisateurs', path: '/admin/utilisateurs' },
  { id: 'DISPUTES', icon: AlertTriangle, label: 'Litiges', path: '/admin/litiges' },
  { id: 'SUBSCRIPTIONS', icon: CreditCard, label: 'Abonnements', path: '/admin/abonnements' },
  { id: 'STAFF', icon: ShieldCheck, label: 'Comptes Staff', path: '/admin/staff', adminOnly: true },
  { id: 'SETTINGS', icon: Settings, label: 'Paramètres', path: '/admin/parametres', adminOnly: true },
];

function getVisibleItems(role: AdminRole) {
  return NAV_ITEMS.filter((item) => !item.adminOnly || role === 'ADMIN');
}

interface AdminSidebarProps {
  activeTab: AdminTab;
  layoutId?: string;
}

export default function AdminSidebar({ activeTab, layoutId = 'adminActiveTabDesktop' }: AdminSidebarProps) {
  const router = useRouter();
  const { adminUser, logout } = useAdminStore();
  const visibleItems = getVisibleItems(adminUser?.role || 'SUPPORT');

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  return (
    <>
      {/* Logo */}
      <div
        onClick={() => router.push('/admin/tableau-de-bord')}
        className="h-16 flex items-center justify-start px-6 border-b border-[var(--border)] cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center font-bold text-lg text-white">
          C
        </div>
        <span className="ml-3 font-bold text-xl tracking-wider text-[var(--text-primary)]">ADMIN</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 space-y-2 px-3">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.path)}
            className={clsx(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden',
              activeTab === item.id
                ? 'bg-emerald-500/10 text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            <item.icon className={clsx('w-5 h-5 z-10', activeTab === item.id ? 'text-emerald-500' : 'group-hover:text-[var(--text-primary)]')} />
            <span className="font-medium text-sm z-10">{item.label}</span>

            {activeTab === item.id && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl"
              />
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-[var(--border)]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </>
  );
}
