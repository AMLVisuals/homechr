'use client';

import { motion } from 'framer-motion';
import { Settings, Euro, Percent, Save } from 'lucide-react';
import { APP_CONFIG } from '@/config/appConfig';

const CONFIG_ITEMS = [
  {
    label: 'Frais de mise en relation',
    value: `${APP_CONFIG.MISSION_FEE} €`,
    description: 'Montant facturé aux utilisateurs Free par mission',
    icon: Euro,
  },
  {
    label: 'Abonnement Premium',
    value: `${APP_CONFIG.PREMIUM_MONTHLY_PRICE} €/mois`,
    description: 'Tarif mensuel de l\'abonnement Premium',
    icon: Euro,
  },
  {
    label: 'Commission plateforme',
    value: `${APP_CONFIG.PLATFORM_FEE_PERCENT}%`,
    description: 'Commission prélevée sur chaque transaction',
    icon: Percent,
  },
  {
    label: 'SMIC horaire brut',
    value: `${APP_CONFIG.SMIC_HOURLY_RATE} €`,
    description: 'Taux horaire minimum légal (2024)',
    icon: Euro,
  },
];

export default function AdminSettingsTab() {
  const handleSave = () => {
    // Toast would be triggered here
    alert('Fonctionnalité bientôt disponible');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Paramètres</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Configuration de la plateforme</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="p-5 border-b border-[var(--border)] flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-500" />
          <h2 className="font-bold text-[var(--text-primary)]">Tarification</h2>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {CONFIG_ITEMS.map((item) => (
            <div key={item.label} className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[var(--text-primary)]">{item.label}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">{item.description}</div>
              </div>
              <div className="text-sm font-bold text-[var(--text-primary)] bg-[var(--bg-hover)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 border-t border-[var(--border)] flex justify-end">
          <button
            onClick={handleSave}
            disabled
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm opacity-50 cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </motion.div>
    </div>
  );
}
