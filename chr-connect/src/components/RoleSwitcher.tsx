'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Check, ChevronRight, ArrowLeft, Mail, Lock, Phone, UserPlus, LogIn, FileText, Building2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { CATEGORIES, COMING_SOON_CATEGORIES } from '@/data/categories';
import { EMPLOYMENT_CATEGORY_LABELS, EMPLOYMENT_CATEGORY_DESCRIPTIONS } from '@/config/compliance';
import type { EmploymentCategory } from '@/types/compliance';
import { clsx } from 'clsx';

export default function RoleSwitcher() {
  const { setUserRole } = useStore();
  const [step, setStep] = useState<'role' | 'auth' | 'status' | 'category' | 'services'>('role');
  const [selectedRole, setSelectedRole] = useState<'PATRON' | 'WORKER' | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [employmentCategory, setEmploymentCategory] = useState<EmploymentCategory | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Auth form state
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [authError, setAuthError] = useState('');

  const handleRoleSelect = (role: 'PATRON' | 'WORKER') => {
    setSelectedRole(role);
    setAuthMode('login');
    setAuthError('');
    setAuthForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
    setStep('auth');
  };

  const handleLogin = () => {
    setAuthError('');
    if (!authForm.email || !authForm.password) {
      setAuthError('Veuillez remplir tous les champs.');
      return;
    }
    if (selectedRole) {
      setUserRole(selectedRole);
    }
  };

  const handleRegister = () => {
    setAuthError('');
    if (!authForm.name || !authForm.email || !authForm.phone || !authForm.password || !authForm.confirmPassword) {
      setAuthError('Veuillez remplir tous les champs.');
      return;
    }
    if (authForm.password !== authForm.confirmPassword) {
      setAuthError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (authForm.password.length < 6) {
      setAuthError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (selectedRole === 'WORKER') {
      setStep('category');
    } else {
      setUserRole('PATRON');
    }
  };

  const handleStatusSelect = (category: EmploymentCategory) => {
    setEmploymentCategory(category);
    setStep('services');
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    if (category.id === 'PERSONNEL') {
      setStep('status');
    } else {
      setEmploymentCategory('FREELANCE');
      setStep('services');
    }
  };

  const handleBackToCategories = () => {
    if (selectedCategory?.id === 'PERSONNEL') {
      setStep('status');
    } else {
      setSelectedCategory(null);
      setStep('category');
    }
  };

  return (
    <div className="min-h-screen flex items-start md:items-center justify-center bg-[var(--bg-app)] relative overflow-x-hidden overflow-y-auto">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-xl scale-110" />
      <div className="fixed inset-0 bg-[var(--bg-overlay)]" />

      <div className="relative z-10 w-full max-w-4xl p-4 md:p-6 py-8 md:py-6">
        <AnimatePresence mode='wait'>
          {/* ── ÉTAPE 1 : Choix du rôle ── */}
          {step === 'role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="flex flex-col md:flex-row gap-6 justify-center"
            >
              <RoleCard
                title="Je gère un établissement"
                subtitle="Demandeur"
                icon={Briefcase}
                onClick={() => handleRoleSelect('PATRON')}
              />
              <RoleCard
                title="Je suis un Expert / Talent"
                subtitle="Prestataire"
                icon={User}
                onClick={() => handleRoleSelect('WORKER')}
              />
            </motion.div>
          )}

          {/* ── ÉTAPE 2 : Authentification ── */}
          {step === 'auth' && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="glass-strong rounded-3xl p-4 md:p-8 max-w-md mx-auto"
            >
              <button
                onClick={() => { setStep('role'); setSelectedRole(null); }}
                className="mb-3 md:mb-4 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs md:text-sm">Retour</span>
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-3">
                  {selectedRole === 'PATRON' ? <Briefcase className="w-7 h-7 text-white" /> : <User className="w-7 h-7 text-white" />}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                  {selectedRole === 'PATRON' ? 'Espace Demandeur' : 'Espace Prestataire'}
                </h2>
              </div>

              {/* Toggle login / register */}
              <div className="flex rounded-xl bg-[var(--bg-hover)] p-1 mb-6">
                <button
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={clsx(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                    authMode === 'login'
                      ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </button>
                <button
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={clsx(
                    "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                    authMode === 'register'
                      ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                  Créer un compte
                </button>
              </div>

              <div className="space-y-3">
                {authMode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Nom complet"
                      value={authForm.name}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    placeholder="Adresse email"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                {authMode === 'register' && (
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="tel"
                      placeholder="Téléphone"
                      value={authForm.phone}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                )}

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                </div>

                {authMode === 'register' && (
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                    <input
                      type="password"
                      placeholder="Confirmer le mot de passe"
                      value={authForm.confirmPassword}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                )}
              </div>

              {authError && (
                <p className="mt-3 text-xs text-red-500 text-center">{authError}</p>
              )}

              <button
                onClick={authMode === 'login' ? handleLogin : handleRegister}
                className="mt-6 w-full py-3 md:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {authMode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <button
                onClick={() => {
                  if (selectedRole) {
                    if (selectedRole === 'WORKER') {
                      setStep('category');
                    } else {
                      setUserRole('PATRON');
                    }
                  }
                }}
                className="mt-3 text-[10px] md:text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] mx-auto block"
              >
                Dev Mode: Skip Auth
              </button>

              {authMode === 'login' && (
                <button className="mt-2 text-xs text-blue-500 hover:text-blue-400 mx-auto block transition-colors">
                  Mot de passe oublié ?
                </button>
              )}
            </motion.div>
          )}

          {/* ── ÉTAPE 3bis (Worker/Personnel) : Choix du statut ── */}
          {step === 'status' && (
            <motion.div
              key="status"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="glass-strong rounded-3xl p-4 md:p-8 max-w-lg mx-auto"
            >
              <button
                onClick={() => setStep('category')}
                className="mb-3 md:mb-4 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs md:text-sm">Retour</span>
              </button>

              <h2 className="text-xl md:text-2xl font-bold mb-2 text-[var(--text-primary)] text-center">Quel est votre statut ?</h2>
              <p className="text-xs md:text-sm text-[var(--text-muted)] mb-6 md:mb-8 text-center">Cela détermine les documents que vous devrez fournir ultérieurement pour valider votre profil.</p>

              <div className="space-y-4">
                {/* Extra / CDD */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleStatusSelect('EXTRA')}
                  className={clsx(
                    "w-full p-4 md:p-5 rounded-2xl border text-left transition-all",
                    employmentCategory === 'EXTRA'
                      ? "border-orange-500/50 bg-orange-500/10"
                      : "border-[var(--border)] bg-[var(--bg-hover)] hover:border-[var(--border-active)]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)]">
                        {EMPLOYMENT_CATEGORY_LABELS.EXTRA}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                        {EMPLOYMENT_CATEGORY_DESCRIPTIONS.EXTRA}
                      </p>
                    </div>
                  </div>
                </motion.button>

                {/* Freelance / Indépendant */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleStatusSelect('FREELANCE')}
                  className={clsx(
                    "w-full p-4 md:p-5 rounded-2xl border text-left transition-all",
                    employmentCategory === 'FREELANCE'
                      ? "border-emerald-500/50 bg-emerald-500/10"
                      : "border-[var(--border)] bg-[var(--bg-hover)] hover:border-[var(--border-active)]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)]">
                        {EMPLOYMENT_CATEGORY_LABELS.FREELANCE}
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                        {EMPLOYMENT_CATEGORY_DESCRIPTIONS.FREELANCE}
                      </p>
                    </div>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── ÉTAPE 3 (Worker) : Choix du domaine ── */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="glass-strong rounded-3xl p-4 md:p-6 max-w-4xl mx-auto"
            >
              <button
                onClick={() => setStep('auth')}
                className="mb-3 md:mb-4 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs md:text-sm">Retour</span>
              </button>
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-[var(--text-primary)] text-center">Choisissez votre domaine</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {CATEGORIES.map((category) => {
                  const isComingSoon = COMING_SOON_CATEGORIES.includes(category.id);
                  return (
                  <motion.button
                    key={category.id}
                    {...(!isComingSoon ? { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 } } : {})}
                    onClick={() => !isComingSoon && handleCategorySelect(category)}
                    className={clsx(
                      "relative glass p-3 md:p-4 rounded-2xl flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px] transition-colors",
                      isComingSoon ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--bg-hover)]"
                    )}
                  >
                    {isComingSoon && (
                      <span className="absolute top-2 right-2 text-[9px] md:text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full z-10">
                        Bientôt disponible
                      </span>
                    )}
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-2 md:mb-3">
                      <category.icon className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xs md:text-sm font-bold text-[var(--text-primary)]">{category.label}</h3>
                    <p className="text-[10px] md:text-xs text-[var(--text-muted)] mt-1">{category.description}</p>
                  </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── ÉTAPE 5 (Worker) : Sélection des compétences ── */}
          {step === 'services' && (
            <motion.div
              key="services"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="glass-strong rounded-3xl p-4 md:p-6 max-w-2xl mx-auto"
            >
              <button
                onClick={handleBackToCategories}
                className="mb-3 md:mb-4 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs md:text-sm">Retour</span>
              </button>
              <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center flex-shrink-0">
                  <selectedCategory.icon className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base md:text-xl font-bold text-[var(--text-primary)] truncate">{selectedCategory.label}</h2>
                  <p className="text-xs md:text-sm text-[var(--text-muted)] truncate">{selectedCategory.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:gap-3 md:max-h-[55vh] md:overflow-y-auto pr-1 md:pr-2 custom-scrollbar pb-2">
                {selectedCategory.services.map((service: any) => (
                  <motion.div
                    key={service.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedSkills(prev =>
                      prev.includes(service.id) ? prev.filter(id => id !== service.id) : [...prev, service.id]
                    )}
                    className={clsx(
                      "p-3 md:p-4 rounded-xl border cursor-pointer transition-all min-h-[70px] md:min-h-[80px] flex flex-col justify-center",
                      selectedSkills.includes(service.id)
                        ? "bg-[var(--bg-active)] border-[var(--border-active)] text-[var(--text-primary)]"
                        : "bg-[var(--bg-hover)] border-transparent text-[var(--text-muted)] hover:bg-[var(--bg-active)]"
                    )}
                  >
                    <span className="text-xs md:text-sm font-medium">{service.label}</span>
                    {selectedSkills.includes(service.id) && (
                      <Check className="w-3 h-3 md:w-4 md:h-4 ml-auto mt-1 text-green-400" />
                    )}
                  </motion.div>
                ))}
              </div>
              <button
                onClick={() => setUserRole('WORKER')}
                disabled={selectedSkills.length === 0}
                className={clsx(
                  "mt-4 md:mt-6 w-full py-3 md:py-4 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm md:text-base",
                  selectedSkills.length > 0
                    ? "bg-[var(--text-primary)] text-[var(--bg-app)] hover:bg-[var(--text-secondary)]"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                Créer mon profil <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RoleCard({ title, subtitle, icon: Icon, onClick }: { title: string, subtitle: string, icon: any, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center w-full aspect-square md:aspect-square hover:bg-[var(--bg-hover)] transition-colors group"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4 md:mb-6 group-hover:bg-[var(--bg-active)] transition-colors">
        <Icon className="w-8 h-8 md:w-10 md:h-10 text-[var(--text-primary)]" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-1 md:mb-2">{subtitle}</h3>
      <p className="text-xs md:text-sm text-[var(--text-muted)]">{title}</p>
    </motion.button>
  );
}
