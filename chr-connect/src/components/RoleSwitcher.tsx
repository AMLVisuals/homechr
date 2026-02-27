'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, Check, ChevronRight, ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/useStore';
import DocumentUploader from './DocumentUploader';
import DropZonePro from './DropZonePro';
import { CATEGORIES } from '@/data/categories';
import { clsx } from 'clsx';
import { getRequiredDocuments, DocumentRequirement } from '@/config/documents';

export default function RoleSwitcher() {
  const { setUserRole } = useStore();
  const [step, setStep] = useState<'role' | 'category' | 'services' | 'verification'>('role');
  const [selectedRole, setSelectedRole] = useState<'PATRON' | 'WORKER' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [docStatuses, setDocStatuses] = useState<Record<string, 'idle' | 'uploading' | 'pending' | 'verified'>>({});

  const handleRoleSelect = (role: 'PATRON' | 'WORKER') => {
    setSelectedRole(role);
    setStep(role === 'WORKER' ? 'category' : 'verification');
  };

  const handleCategorySelect = (category: any) => {
    setSelectedCategory(category);
    setStep('services');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setStep('category');
  };

  const handleFinish = () => {
    if (selectedRole) {
      setUserRole(selectedRole);
    }
  };

  const handleDocStatusChange = (docId: string, status: 'idle' | 'uploading' | 'pending' | 'verified') => {
    setDocStatuses(prev => ({ ...prev, [docId]: status }));
  };

  const bypassVerification = () => {
    if (!selectedRole) return;
    const requiredDocs = getRequiredDocuments(selectedRole, selectedSkills);
    const newStatuses: Record<string, any> = {};
    requiredDocs.forEach(doc => {
        newStatuses[doc.id] = 'verified';
    });
    setDocStatuses(newStatuses);
  };

  const requiredDocuments = selectedRole ? getRequiredDocuments(selectedRole, selectedSkills) : [];
  const allVerified = requiredDocuments.every(doc => !doc.required || docStatuses[doc.id] === 'verified');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 blur-xl scale-110" />
      <div className="absolute inset-0 bg-[var(--bg-overlay)]" />

      <div className="relative z-10 w-full max-w-4xl p-4 md:p-6">
        <AnimatePresence mode='wait'>
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

          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="glass-strong rounded-3xl p-4 md:p-6 max-w-4xl mx-auto"
            >
              <button 
                onClick={() => setStep('role')}
                className="mb-3 md:mb-4 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs md:text-sm">Retour</span>
              </button>
              <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 text-[var(--text-primary)] text-center">Choisissez votre domaine</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {CATEGORIES.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(category)}
                    className="glass p-3 md:p-4 rounded-2xl flex flex-col items-center justify-center text-center min-h-[120px] md:min-h-[140px] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-2 md:mb-3">
                      <category.icon className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xs md:text-sm font-bold text-[var(--text-primary)]">{category.label}</h3>
                    <p className="text-[10px] md:text-xs text-[var(--text-muted)] mt-1">{category.description}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

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
              <div className="grid grid-cols-2 gap-2 md:gap-3 max-h-[55vh] overflow-y-auto pr-1 md:pr-2 custom-scrollbar pb-2">
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
                onClick={() => setStep('verification')}
                className="mt-4 md:mt-6 w-full py-3 md:py-4 bg-[var(--text-primary)] text-[var(--bg-app)] font-bold rounded-xl hover:bg-[var(--text-secondary)] transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
              >
                Continuer <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </motion.div>
          )}

          {step === 'verification' && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="glass-strong rounded-3xl p-4 md:p-8 max-w-xl mx-auto max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setStep(selectedRole === 'WORKER' ? 'services' : 'role')}
                className="mb-3 md:mb-4 flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs md:text-sm">Retour</span>
              </button>
              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2 text-[var(--text-primary)]">Vérification de Sécurité</h2>
              <p className="text-xs md:text-sm text-[var(--text-muted)] mb-4 md:mb-8">Pour garantir la qualité du réseau, nous devons valider votre identité.</p>
              
              <div className="space-y-3 md:space-y-4">
                {requiredDocuments.map((doc) => (
                  <DropZonePro 
                    key={doc.id}
                    label={doc.label} 
                    description={doc.description}
                    type={doc.type === 'IDENTITY' ? 'IDENTITY' : 'DOCUMENT'}
                    status={docStatuses[doc.id] || 'idle'}
                    onStatusChange={(status) => handleDocStatusChange(doc.id, status)}
                  />
                ))}
              </div>

              <button 
                onClick={handleFinish}
                disabled={!allVerified}
                className={clsx(
                  "mt-6 md:mt-8 w-full py-3 md:py-4 font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm md:text-base",
                  allVerified 
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-[var(--text-primary)] hover:opacity-90" 
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                Accéder au Command Center <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </button>

              <button onClick={bypassVerification} className="mt-3 md:mt-4 text-[10px] md:text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] mx-auto block">
                 Dev Mode: Auto-Verify
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
      className="glass p-8 rounded-3xl flex flex-col items-center justify-center text-center w-full aspect-[3/4] md:aspect-square hover:bg-[var(--bg-hover)] transition-colors group"
    >
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4 md:mb-6 group-hover:bg-[var(--bg-active)] transition-colors">
        <Icon className="w-8 h-8 md:w-10 md:h-10 text-[var(--text-primary)]" />
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-[var(--text-primary)] mb-1 md:mb-2">{subtitle}</h3>
      <p className="text-xs md:text-sm text-[var(--text-muted)]">{title}</p>
    </motion.button>
  );
}
