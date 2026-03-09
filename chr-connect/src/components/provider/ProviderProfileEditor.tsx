import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Briefcase, Award,
  Save, Eye, Check, History, Receipt
} from 'lucide-react';
import { clsx } from 'clsx';
import { ProviderProfile } from '@/types/provider';
import ProviderProfileModal from '../shared/ProviderProfileModal';
import IdentityTab from './tabs/IdentityTab';
import SkillsTab from './tabs/SkillsTab';
import ExperienceTab from './tabs/ExperienceTab';
import { HistoryTab } from './tabs/HistoryTab';
import { PayslipsTab } from './tabs/PayslipsTab';

const TABS = [
  { id: 'IDENTITY' as const, label: 'Identité', icon: User },
  { id: 'SKILLS' as const, label: 'Compétences', icon: Award },
  { id: 'EXPERIENCE' as const, label: 'Expérience', icon: Briefcase },
  { id: 'HISTORY' as const, label: 'Historique', icon: History },
  { id: 'PAYSLIPS' as const, label: 'Fiches de paie', icon: Receipt },
];

const INITIAL_PROFILE: ProviderProfile = {
  id: 'new-user',
  firstName: '',
  lastName: '',
  title: '',
  bio: '',
  avatarUrl: 'https://i.pravatar.cc/150?u=new',
  location: { city: '' },
  stats: { rating: 0, missionsCompleted: 0, responseRate: 100, onTimeRate: 100 },
  skills: [],
  certifications: [],
  portfolio: [],
  experiences: [],
  reviews: [],
  languages: [],
  badges: ['NEW'],
  preferences: {
    radius: 20,
    minHourlyRate: 25,
    availabilityBadges: []
  },
  availability: { isAvailable: true }
};

type TabId = typeof TABS[number]['id'];

export default function ProviderProfileEditor() {
  const [profile, setProfile] = useState<ProviderProfile>(INITIAL_PROFILE);
  const [activeTab, setActiveTab] = useState<TabId>('IDENTITY');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const calculateCompletion = () => {
    let score = 0;
    const steps = [];

    if (profile.avatarUrl && !profile.avatarUrl.includes('pravatar.cc')) {
      score += 15;
      steps.push({ label: 'Photo de profil', completed: true });
    } else {
      steps.push({ label: 'Photo de profil', completed: false });
    }

    if (profile.firstName && profile.lastName && profile.title && profile.bio && profile.location.city) {
      score += 25;
      steps.push({ label: 'Identité & Bio', completed: true });
    } else {
      steps.push({ label: 'Identité & Bio', completed: false });
    }

    if (profile.skills.length >= 3) {
      score += 15;
      steps.push({ label: 'Compétences (3+)', completed: true });
    } else {
      steps.push({ label: 'Compétences (3 min)', completed: false });
    }

    if (profile.experiences.length >= 1) {
      score += 20;
      steps.push({ label: 'Expérience', completed: true });
    } else {
      steps.push({ label: 'Ajouter une expérience', completed: false });
    }

    if (profile.certifications.length >= 1) {
      score += 15;
      steps.push({ label: 'Certifications', completed: true });
    } else {
      steps.push({ label: 'Ajouter une certification', completed: false });
    }

    return { score, steps };
  };

  const { score, steps } = calculateCompletion();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Profil enregistré avec succès !');
    }, 1500);
  };

  return (
    <div className="text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold">Éditeur de Profil</h1>
          <p className="text-sm text-[var(--text-secondary)]">Complétez votre fiche pour attirer plus de clients</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-[var(--bg-active)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Enregistrer</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar — horizontal scroll */}
      <div className="lg:hidden mb-6 -mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all shrink-0",
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-900/20"
                  : "bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border)]"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Desktop Sidebar — hidden on mobile */}
        <div className="hidden lg:block lg:col-span-3 space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)] hover:text-[var(--text-primary)]"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <div className="text-left">
                <span className="block font-medium">{tab.label}</span>
              </div>
            </button>
          ))}

          {/* Completion Status */}
          <div className="mt-8 bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">Progression du profil</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                <span>Complétion</span>
                <span className={`font-bold ${score === 100 ? 'text-green-400' : 'text-blue-400'}`}>{score}%</span>
              </div>
              <div className="h-1.5 bg-[var(--bg-active)] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <ul className="space-y-2 mt-4">
                {steps.map((step, index) => (
                  <li key={index} className={`flex items-center gap-2 text-xs ${step.completed ? 'text-green-400' : 'text-[var(--text-muted)]'}`}>
                    {step.completed ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-[var(--text-muted)]" />
                    )}
                    {step.label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl p-4 md:p-6 min-h-[400px] lg:min-h-[600px]"
          >
            {activeTab === 'IDENTITY' && <IdentityTab profile={profile} setProfile={setProfile} />}
            {activeTab === 'SKILLS' && <SkillsTab profile={profile} setProfile={setProfile} />}
            {activeTab === 'EXPERIENCE' && <ExperienceTab profile={profile} setProfile={setProfile} />}
            {activeTab === 'HISTORY' && <HistoryTab />}
            {activeTab === 'PAYSLIPS' && <PayslipsTab />}
          </motion.div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <ProviderProfileModal
          provider={profile}
          onClose={() => setShowPreview(false)}
          onBook={() => alert("Ceci est un aperçu. Le client pourra réserver depuis ici.")}
        />
      )}
    </div>
  );
}
