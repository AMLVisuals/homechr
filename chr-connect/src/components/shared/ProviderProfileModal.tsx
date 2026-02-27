'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, MapPin, Award, Calendar, CheckCircle, Briefcase, Clock, MessageSquare, Plus, Video, SplitSquareHorizontal } from 'lucide-react';
import { ProviderProfile, Review } from '@/types/provider';
import { clsx } from 'clsx';
import { ReviewFormModal } from '../provider/ReviewFormModal';
import BeforeAfterSlider from '../BeforeAfterSlider';

interface ProviderProfileModalProps {
  provider: ProviderProfile;
  isOpen?: boolean;
  onClose: () => void;
  onBook: () => void;
}

export default function ProviderProfileModal({ provider, isOpen = true, onClose, onBook }: ProviderProfileModalProps) {
  if (!isOpen || !provider) return null;

  const [activeTab, setActiveTab] = useState<'ABOUT' | 'SKILLS' | 'PORTFOLIO' | 'REVIEWS'>('ABOUT');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [localReviews, setLocalReviews] = useState<Review[]>(provider.reviews || []);

  const handleReviewSubmit = (rating: number, comment: string) => {
    const newReview: Review = {
      id: `new-${Date.now()}`,
      author: 'Vous', // Hardcoded for demo
      rating,
      comment,
      date: new Date().toLocaleDateString('fr-FR'),
      missionTitle: 'Mission Récente' // Hardcoded for demo
    };
    setLocalReviews([newReview, ...localReviews]);
  };

  const featuredWork = provider.portfolio?.filter(item => item.type === 'BEFORE_AFTER') || [];

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl"
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
                <div className="absolute bottom-2 right-2 bg-blue-500 text-white p-1 rounded-full border-2 border-[var(--bg-card)]" title="Profil Vérifié">
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
            { id: 'ABOUT', label: 'À propos' },
            { id: 'SKILLS', label: 'Compétences & CV' },
            { id: 'PORTFOLIO', label: 'Portfolio' },
            { id: 'REVIEWS', label: 'Avis' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
                {featuredWork.length > 0 && (
                  <section>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                      <SplitSquareHorizontal className="w-5 h-5 text-purple-400" />
                      Mes plus belles réalisations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {featuredWork.map((work) => (
                        <div key={work.id} className="space-y-2">
                          <div className="rounded-xl overflow-hidden border border-[var(--border)] shadow-lg">
                            <BeforeAfterSlider 
                              beforeImage={work.beforeUrl!} 
                              afterImage={work.url}
                              aspectRatio="aspect-video"
                            />
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] font-medium text-center">{work.title}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

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
                      <div className="text-xs text-[var(--text-muted)] mt-1">Réponse</div>
                    </div>
                    <div className="bg-[var(--bg-hover)] p-4 rounded-2xl border border-[var(--border)] text-center">
                      <div className="text-2xl font-bold text-green-400">{provider.stats.onTimeRate}%</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">Ponctualité</div>
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
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Compétences Techniques</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.skills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/20">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Certifications & Documents</h3>
                  <div className="space-y-3">
                    {provider.certifications.map(cert => (
                      <div key={cert.id} className="flex items-center justify-between p-4 bg-[var(--bg-hover)] rounded-xl border border-[var(--border)]">
                        <div className="flex items-center gap-3">
                          <Award className="w-8 h-8 text-yellow-500" />
                          <div>
                            <div className="font-bold text-[var(--text-primary)]">{cert.name}</div>
                            <div className="text-sm text-[var(--text-secondary)]">{cert.issuer} • {cert.dateObtained}</div>
                          </div>
                        </div>
                        {cert.isVerified && (
                          <div className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                            <CheckCircle className="w-3 h-3" /> VÉRIFIÉ
                          </div>
                        )}
                      </div>
                    ))}
                    {provider.certifications.length === 0 && (
                      <p className="text-[var(--text-muted)] italic">Aucune certification affichée.</p>
                    )}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Expérience</h3>
                  <div className="relative border-l-2 border-[var(--border)] ml-3 space-y-8 py-2">
                    {provider.experiences.map((exp, idx) => (
                      <div key={exp.id} className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[var(--bg-sidebar)] border-2 border-blue-500" />
                        <div>
                          <h4 className="font-bold text-lg text-[var(--text-primary)]">{exp.role}</h4>
                          <div className="text-blue-400 font-medium mb-1">{exp.company}</div>
                          <div className="text-sm text-[var(--text-muted)] mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {exp.startDate} - {exp.endDate || 'Présent'}
                          </div>
                          <p className="text-[var(--text-secondary)] text-sm">{exp.description}</p>
                        </div>
                      </div>
                    ))}
                    {provider.experiences.length === 0 && (
                      <p className="text-[var(--text-muted)] italic pl-8">Aucune expérience renseignée.</p>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'PORTFOLIO' && (
              <motion.div 
                key="portfolio"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {provider.portfolio.map(item => (
                    <div key={item.id} className="group relative aspect-video bg-[var(--bg-hover)] rounded-xl overflow-hidden border border-[var(--border)]">
                      {item.type === 'BEFORE_AFTER' ? (
                         <div className="w-full h-full pointer-events-none">
                            {/* Non-interactive preview for grid, or just static image with badge */}
                            <BeforeAfterSlider 
                              beforeImage={item.beforeUrl!} 
                              afterImage={item.url} 
                              className="pointer-events-none"
                            />
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md p-1.5 rounded-lg z-10 border border-[var(--border)]">
                              <SplitSquareHorizontal className="w-4 h-4 text-[var(--text-primary)]" />
                            </div>
                         </div>
                      ) : item.type === 'VIDEO' ? (
                        <>
                          <img src={item.url} alt={item.title} className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-12 h-12 bg-[var(--bg-active)] backdrop-blur-md rounded-full flex items-center justify-center border border-[var(--border-strong)] group-hover:scale-110 transition-transform">
                               <Video className="w-5 h-5 text-[var(--text-primary)] ml-1" />
                             </div>
                          </div>
                        </>
                      ) : (
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
                        <h4 className="font-bold text-[var(--text-primary)]">{item.title}</h4>
                        {item.description && <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                  {provider.portfolio.length === 0 && (
                    <div className="col-span-full py-12 text-center text-[var(--text-muted)]">
                      Aucun élément dans le portfolio.
                    </div>
                  )}
                </div>
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
                    Aucun avis pour le moment. Soyez le premier à en laisser un !
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
    </div>
  );
}
