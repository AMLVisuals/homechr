import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Briefcase, Award, Image as ImageIcon, 
  Save, Eye, Check, History
} from 'lucide-react';
import { ProviderProfile } from '@/types/provider';
import ProviderProfileModal from '../shared/ProviderProfileModal';
import IdentityTab from './tabs/IdentityTab';
import SkillsTab from './tabs/SkillsTab';
import ExperienceTab from './tabs/ExperienceTab';
import PortfolioTab from './tabs/PortfolioTab';
import { HistoryTab } from './tabs/HistoryTab';

// Mock initial data for a new provider
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

export default function ProviderProfileEditor() {
  const [profile, setProfile] = useState<ProviderProfile>(INITIAL_PROFILE);
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'SKILLS' | 'PORTFOLIO' | 'EXPERIENCE' | 'HISTORY'>('IDENTITY');
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const calculateCompletion = () => {
    let score = 0;
    const steps = [];

    // 1. Avatar (15%)
    if (profile.avatarUrl && !profile.avatarUrl.includes('pravatar.cc')) {
      score += 15;
      steps.push({ label: 'Photo de profil', completed: true });
    } else {
      steps.push({ label: 'Photo de profil', completed: false });
    }

    // 2. Identity (25%)
    if (profile.firstName && profile.lastName && profile.title && profile.bio && profile.location.city) {
      score += 25;
      steps.push({ label: 'Identité & Bio', completed: true });
    } else {
      steps.push({ label: 'Identité & Bio', completed: false });
    }

    // 3. Skills (15%)
    if (profile.skills.length >= 3) {
      score += 15;
      steps.push({ label: 'Compétences (3+)', completed: true });
    } else {
      steps.push({ label: 'Compétences (3 min)', completed: false });
    }

    // 4. Experience (20%)
    if (profile.experiences.length >= 1) {
      score += 20;
      steps.push({ label: 'Expérience', completed: true });
    } else {
      steps.push({ label: 'Ajouter une expérience', completed: false });
    }

    // 5. Certifications (15%)
    if (profile.certifications.length >= 1) {
      score += 15;
      steps.push({ label: 'Certifications', completed: true });
    } else {
      steps.push({ label: 'Ajouter une certification', completed: false });
    }

    // 6. Portfolio (10%)
    if (profile.portfolio.length >= 1) {
      score += 10;
      steps.push({ label: 'Portfolio', completed: true });
    } else {
      steps.push({ label: 'Ajouter au portfolio', completed: false });
    }

    return { score, steps };
  };

  const { score, steps } = calculateCompletion();

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      alert('Profil enregistré avec succès !');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Éditeur de Profil</h1>
          <p className="text-sm text-gray-400">Complétez votre fiche pour attirer plus de clients</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <Eye className="w-4 h-4" />
            Aperçu
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
            Enregistrer
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab('IDENTITY')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'IDENTITY' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-zinc-900/50 text-gray-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <User className="w-5 h-5" />
            <div className="text-left">
              <span className="block font-medium">Identité</span>
              <span className="text-xs opacity-70">Infos personnelles</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('SKILLS')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'SKILLS' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-zinc-900/50 text-gray-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Award className="w-5 h-5" />
            <div className="text-left">
              <span className="block font-medium">Compétences</span>
              <span className="text-xs opacity-70">Expertise & Certifs</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('EXPERIENCE')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'EXPERIENCE' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-zinc-900/50 text-gray-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <div className="text-left">
              <span className="block font-medium">Expérience</span>
              <span className="text-xs opacity-70">Parcours pro</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('PORTFOLIO')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'PORTFOLIO' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-zinc-900/50 text-gray-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <ImageIcon className="w-5 h-5" />
            <div className="text-left">
              <span className="block font-medium">Portfolio</span>
              <span className="text-xs opacity-70">Photos & Vidéos</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'HISTORY' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'bg-zinc-900/50 text-gray-400 hover:bg-zinc-800 hover:text-white'
            }`}
          >
            <History className="w-5 h-5" />
            <div className="text-left">
              <span className="block font-medium">Historique</span>
              <span className="text-xs opacity-70">Missions passées</span>
            </div>
          </button>

          {/* Completion Status */}
          <div className="mt-8 bg-zinc-900/50 rounded-xl p-4 border border-white/5">
            <h3 className="text-sm font-medium text-white mb-3">Progression du profil</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Complétion</span>
                <span className={`font-bold ${score === 100 ? 'text-green-400' : 'text-blue-400'}`}>{score}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${score}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <ul className="space-y-2 mt-4">
                {steps.map((step, index) => (
                  <li key={index} className={`flex items-center gap-2 text-xs ${step.completed ? 'text-green-400' : 'text-gray-500'}`}>
                    {step.completed ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-gray-600" />
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
            className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 min-h-[600px]"
          >
            {activeTab === 'IDENTITY' && (
              <IdentityTab profile={profile} setProfile={setProfile} />
            )}
            {activeTab === 'SKILLS' && (
              <SkillsTab profile={profile} setProfile={setProfile} />
            )}
            {activeTab === 'EXPERIENCE' && (
              <ExperienceTab profile={profile} setProfile={setProfile} />
            )}
            {activeTab === 'PORTFOLIO' && (
              <PortfolioTab profile={profile} setProfile={setProfile} />
            )}
            {activeTab === 'HISTORY' && (
              <HistoryTab />
            )}
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
