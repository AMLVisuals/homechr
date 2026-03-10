'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Mission } from '@/types/missions';

interface CompleteMissionFormProps {
  mission: Mission;
  onComplete: (data: { beforePhoto?: File, afterPhoto: File, comment?: string }) => void;
  onCancel: () => void;
  requireBeforePhoto?: boolean; // If true, asks for before photo too (if missed earlier)
}

export function CompleteMissionForm({ mission, onComplete, onCancel, requireBeforePhoto = false }: CompleteMissionFormProps) {
  const [step, setStep] = useState<'BEFORE' | 'AFTER' | 'CONFIRM'>(requireBeforePhoto ? 'BEFORE' : 'AFTER');
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'BEFORE' | 'AFTER') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (type === 'BEFORE') {
          setBeforeFile(file);
          setBeforePreview(ev.target?.result as string);
        } else {
          setAfterFile(file);
          setAfterPreview(ev.target?.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!afterFile) return;
    if (requireBeforePhoto && !beforeFile) return;

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      onComplete({
        beforePhoto: beforeFile || undefined,
        afterPhoto: afterFile,
        comment
      });
      setIsSubmitting(false);
    }, 1500);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-black/90 backdrop-blur-md"
        onClick={onCancel}
      />

      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[9999] w-full md:w-[560px] bg-[var(--bg-sidebar)] border border-[var(--border)] md:rounded-3xl overflow-hidden flex flex-col shadow-2xl md:max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-hover)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Fin de Mission</h2>
            <p className="text-sm text-[var(--text-secondary)]">{mission.title}</p>
          </div>
          <button 
            onClick={onCancel}
            className="p-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <AnimatePresence mode="wait">
            {step === 'BEFORE' && (
              <motion.div 
                key="step-before"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                    <Camera className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Photo "Avant" manquante</h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    Pour valider la qualité de votre travail, nous avons besoin d'une photo de l'état initial.
                  </p>
                </div>

                <div 
                  onClick={() => beforeInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                    beforePreview ? 'border-green-500/50 bg-green-500/5' : 'border-[var(--border-strong)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={beforeInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'BEFORE')}
                  />
                  
                  {beforePreview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                      <img src={beforePreview} alt="Before preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white font-bold">Changer la photo</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-[var(--text-muted)]" />
                      <p className="text-[var(--text-secondary)] font-medium">Appuyez pour prendre une photo</p>
                    </>
                  )}
                </div>

                <button
                  disabled={!beforeFile}
                  onClick={() => setStep('AFTER')}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  Suivant <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 'AFTER' && (
              <motion.div 
                key="step-after"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Validation du travail</h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    Prenez une photo du résultat final pour déclencher le paiement.
                  </p>
                </div>

                <div 
                  onClick={() => afterInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                    afterPreview ? 'border-green-500/50 bg-green-500/5' : 'border-[var(--border-strong)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={afterInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'AFTER')}
                  />
                  
                  {afterPreview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                      <img src={afterPreview} alt="After preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white font-bold">Changer la photo</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-[var(--text-muted)]" />
                      <p className="text-[var(--text-secondary)] font-medium">Photo du résultat "APRÈS"</p>
                    </>
                  )}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                  <p className="text-xs text-blue-200">
                    Cette photo sera utilisée pour créer votre "Transformation Slider" et enrichir votre portfolio automatiquement.
                  </p>
                </div>

                <button
                  disabled={!afterFile}
                  onClick={() => setStep('CONFIRM')}
                  className="w-full py-4 bg-white text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  Valider la mission <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {step === 'CONFIRM' && (
              <motion.div 
                key="step-confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Récapitulatif</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-xs text-[var(--text-muted)] uppercase font-bold">Avant</span>
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                      {beforePreview ? (
                        <img src={beforePreview} alt="Before" className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-xs">Non requis</div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs text-green-500 uppercase font-bold">Après</span>
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                      <img src={afterPreview!} alt="After" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Commentaire final (optionnel)</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors resize-none h-24"
                    placeholder="Rapport d'intervention rapide..."
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl hover:from-green-500 hover:to-green-400 transition-all shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Terminer et Encaisser {mission.price}€
                      <CheckCircle className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
