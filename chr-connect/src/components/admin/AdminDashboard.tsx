'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, Shield, ShieldCheck } from 'lucide-react';
import { useAdminStore } from '@/store/useAdminStore';
import AdminSidebar from './AdminSidebar';
import AdminOverviewTab from './tabs/AdminOverviewTab';
import AdminUsersTab from './tabs/AdminUsersTab';
import AdminSubscriptionsTab from './tabs/AdminSubscriptionsTab';
import AdminSettingsTab from './tabs/AdminSettingsTab';
import type { AdminTab } from '@/types/admin';

export default function AdminDashboard() {
  const { isAuthenticated, adminUser, logout } = useAdminStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getInitialTab = (path: string): AdminTab => {
    const tabMap: Record<string, AdminTab> = {
      '/admin/tableau-de-bord': 'DASHBOARD',
      '/admin/utilisateurs': 'USERS',
      '/admin/abonnements': 'SUBSCRIPTIONS',
      '/admin/parametres': 'SETTINGS',
    };
    return tabMap[path] || 'DASHBOARD';
  };

  const [activeTab, setActiveTab] = useState<AdminTab>(() => getInitialTab(pathname));

  useEffect(() => {
    setActiveTab(getInitialTab(pathname));
  }, [pathname]);

  // Guard: not authenticated → redirect to /auth
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, router]);

  // Guard: SUPPORT on admin-only tab → redirect to users
  useEffect(() => {
    if (adminUser?.role === 'SUPPORT' && (activeTab === 'DASHBOARD' || activeTab === 'SETTINGS')) {
      router.replace('/admin/utilisateurs');
    }
  }, [adminUser, activeTab, router]);

  if (!isAuthenticated || !adminUser) return null;

  const isAdmin = adminUser.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  return (
    <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden font-sans" style={{ height: '100dvh' }}>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex-col z-20">
        <AdminSidebar activeTab={activeTab} layoutId="adminActiveTabDesktop" />
      </aside>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] z-[100] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <AdminSidebar activeTab={activeTab} layoutId="adminActiveTabMobile" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-app)] relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-[var(--border)] z-50 bg-[var(--bg-header)] backdrop-blur-xl sticky top-0" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              {isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ) : (
                <Shield className="w-4 h-4 text-teal-500" />
              )}
              <span className="text-sm font-medium text-[var(--text-secondary)]">{adminUser.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-emerald-500/10 text-emerald-500' : 'bg-teal-500/10 text-teal-500'}`}>
                {adminUser.role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          {activeTab === 'DASHBOARD' && isAdmin && <AdminOverviewTab />}
          {activeTab === 'USERS' && <AdminUsersTab />}
          {activeTab === 'SUBSCRIPTIONS' && <AdminSubscriptionsTab />}
          {activeTab === 'SETTINGS' && isAdmin && <AdminSettingsTab />}
        </div>
      </div>
    </div>
  );
}
