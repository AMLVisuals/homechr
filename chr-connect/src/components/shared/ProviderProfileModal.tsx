'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MapPin, Award, Calendar, CheckCircle, Briefcase, Clock, MessageSquare, Plus, FileText, ChevronRight } from 'lucide-react';
import { ProviderProfile, Review } from '@/types/provider';
import { clsx } from 'clsx';
import { ReviewFormModal } from '../provider/ReviewFormModal';


interface ProviderProfileModalProps {
  provider: ProviderProfile;
  isOpen?: boolean;
  onClose: () => void;
  onBook: () => void;
}

export default function ProviderProfileModal({ provider, isOpen = true, onClose, onBook }: ProviderProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'ABOUT' | 'SKILLS' | 'REVIEWS'>('ABOUT');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [localReviews, setLocalReviews] = useState<Review[]>(provider?.reviews || []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !provider || !mounted) return null;

  const handleReviewSubmit = (rating: number, comment: string) => {
    const newReview: Review = {
      id: `new-${Date.now()}`,
      author: 'Vous',
      rating,
      comment,
      date: new Date().toLocaleDateString('fr-FR'),
      missionTitle: 'Mission Recente'
    };
    setLocalReviews([newReview, ...localReviews]);
  };


  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
      />

      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[720px] md:max-h-[90vh] md:rounded-3xl bg-[var(--bg-sidebar)] md:border md:border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col"
      >
        {/* Header Cover & Profile Info */}
        <div className="relative shrink-0">
          {/* Cover Image (could be dynamic) */}
          <div className="h-32 bg-gradient-to-r from-blue-900 to-purple-900 opacity-50" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-[var(--bg-active)] rounded-full text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="px-8 pb-6 -mt-12 flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-[var(--bg-card)] overflow-hidden bg-[var(--bg-hover)] shadow-xl">
                <img src={provider.avatarUrl} alt={provider.firstName} className="w-full h-full object-cover" />
              </div>
              {provider.badges.includes('VERIFIED') && (
                <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1 rounded-full border-2 border-[var(--bg-card)]" title="Profil Verifie">
                  <CheckCircle className="w-4 h-4" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">{provider.firstName} {provider.lastName}</h2>
                {provider.badges.includes('GOLD') && (
                  <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded-full border border-yellow-500/30 font-bold">GOLD</span>
                )}
              </div>
              <p className="text-lg text-blue-400 font-medium mb-2">{provider.title}</p>

              <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {provider.location.city}
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-yellow-500" />
                  <span className="font-bold text-[var(--text-primary)]">{provider.stats.rating}</span>
                  <span className="text-[var(--text-muted)]">({provider.reviews.length} avis)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" /> {provider.stats.missionsCompleted} missions
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-1">
                <Clock className="w-4 h-4 text-green-400" />
                Dispo: <span className="text-[var(--text-primary)] font-medium">{provider.availability.nextSlot}</span>
              </div>
              <button
                onClick={onBook}
                disabled={!provider.availability.isAvailable}
                className={clsx(
                  "px-6 py-2.5 font-bold rounded-xl transition-colors w-full md:w-auto",
                  provider.availability.isAvailable
                    ? "bg-white text-black hover:bg-gray-200"
                    : "bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                {provider.availability.isAvailable ? 'Solliciter' : 'Indisponible'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--border)] px-6 overflow-x-auto shrink-0">
          {[
            { id: 'ABOUT', label: 'A propos' },
            { id: 'SKILLS', label: 'Compétences & CV' },
            { id: 'REVIEWS', label: 'Avis' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'ABOUT' | 'SKILLS' | 'REVIEWS')}
              className={clsx(
                "px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-blue-500 text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-[var(--bg-card)]">
          <AnimatePresence mode='wait'>
            {activeTab === 'ABOUT' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <section>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Bio</h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed text-base">
                    {provider.bio}
                  </p>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Langues</h3>
                  <div className="flex gap-2">
                    {provider.languages.map(lang => (
                      <span key={lang} className="px-3 py-1 bg-[var(--bg-hover)] rounded-lg text-sm text-[var(--text-secondary)] border border-[var(--border)]">
                        {lang}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Statistiques</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[var(--bg-hover)] p-4 rounded-2xl border border-[var(--border)] text-center">
                      <div className="text-2xl font-bold text-blue-400">{provider.stats.responseRate}%</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">Reponse</div>
                    </div>
                    <div className="bg-[var(--bg-hover)] p-4 rounded-2xl border border-[var(--border)] text-center">
                      <div className="text-2xl font-bold text-green-400">{provider.stats.onTimeRate}%</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">Ponctualite</div>
                    </div>
                    <div className="bg-[var(--bg-hover)] p-4 rounded-2xl border border-[var(--border)] text-center">
                      <div className="text-2xl font-bold text-purple-400">{provider.stats.missionsCompleted}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">Missions</div>
                    </div>
                    <div className="bg-[var(--bg-hover)] p-4 rounded-2xl border border-[var(--border)] text-center">
                      <div className="text-2xl font-bold text-yellow-400">{provider.stats.rating}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">Note Moyenne</div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'SKILLS' && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <section>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Competences Techniques</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.skills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                {/* CV PDF */}
                {provider.cvUrl && (
                  <section>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">CV</h3>
                    <a
                      href={provider.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-4 bg-[var(--bg-hover)] rounded-xl border border-[var(--border)] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
                    >
                      <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20">
                        <FileText className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">CV - {provider.firstName} {provider.lastName}</p>
                        <p className="text-xs text-[var(--text-muted)]">Cliquez pour ouvrir le PDF</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-400 transition-colors" />
                    </a>
                  </section>
                )}

                <section>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Certifications & Documents</h3>
                  <div className="space-y-3">
                    {provider.certifications.map(cert => (
                      <div key={cert.id} className="flex items-center justify-between p-4 bg-[var(--bg-hover)] rounded-xl border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <Award className="w-8 h-8 text-yellow-500" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">{cert.name}</div>
                            <div className="text-sm text-[var(--text-secondary)]">{cert.issuer} - {cert.dateObtained}</div>
                          </div>
                        </div>
                        {cert.isVerified && (
                          <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                            <CheckCircle className="w-3 h-3" /> VERIFIE
                          </div>
                        )}
                      </div>
                    ))}
                    {provider.certifications.length === 0 && (
                      <p className="text-[var(--text-muted)] italic">Aucune certification affichee.</p>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Experience</h3>
                  <div className="relative border-l-2 border-[var(--border)] ml-3 space-y-8 py-2">
                    {provider.experiences.map((exp, idx) => (
                      <div key={exp.id} className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--bg-sidebar)] border-2 border-blue-500" />
                        <div>
                          <h4 className="font-bold text-lg text-[var(--text-primary)]">{exp.role}</h4>
                          <div className="text-blue-400 font-medium mb-1">{exp.company}</div>
                          <div className="text-sm text-[var(--text-muted)] mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {exp.startDate} - {exp.endDate || 'Present'}
                          </div>
                          <p className="text-[var(--text-secondary)] text-sm">{exp.description}</p>
                        </div>
                      </div>
                    ))}
                    {provider.experiences.length === 0 && (
                      <p className="text-[var(--text-muted)] italic pl-8">Aucune experience renseignee.</p>
                    )}
                  </div>
                </section>
              </motion.div>
            )}



            {activeTab === 'REVIEWS' && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Avis clients ({localReviews.length})</h3>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm font-bold transition-colors border border-blue-600/30"
                  >
                    <Plus className="w-4 h-4" />
                    Laisser un avis
                  </button>
                </div>

                {localReviews.map(review => (
                  <div key={review.id} className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)]">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-[var(--text-primary)]">{review.author}</div>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-yellow-500" />
                        <span className="font-bold">{review.rating}</span>
                      </div>
                    </div>
                    {review.missionTitle && (
                      <div className="text-xs text-blue-400 mb-2 uppercase tracking-wide font-bold">Mission: {review.missionTitle}</div>
                    )}
                    <p className="text-[var(--text-secondary)] text-sm">{review.comment}</p>
                    <div className="text-xs text-[var(--text-muted)] mt-2">{review.date}</div>
                  </div>
                ))}
                {localReviews.length === 0 && (
                  <div className="py-12 text-center text-[var(--text-muted)]">
                    Aucun avis pour le moment. Soyez le premier a en laisser un !
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <ReviewFormModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        provider={provider}
        onSubmit={handleReviewSubmit}
      />
    </>,
    document.body
  );
}
