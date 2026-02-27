import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProviderProfile, PortfolioItem } from '@/types/provider';
import { Plus, X, Image as ImageIcon, Video, Trash2, Edit2, Upload, AlertCircle, SplitSquareHorizontal } from 'lucide-react';
import BeforeAfterSlider from '../../BeforeAfterSlider';
import { clsx } from 'clsx';

interface PortfolioTabProps {
  profile: ProviderProfile;
  setProfile: (profile: ProviderProfile) => void;
}

export default function PortfolioTab({ profile, setProfile }: PortfolioTabProps) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showTip, setShowTip] = useState(true);
  
  // Upload State
  const [uploadMode, setUploadMode] = useState<'SIMPLE' | 'BEFORE_AFTER'>('SIMPLE');
  const [beforeFile, setBeforeFile] = useState<{file: File, preview: string} | null>(null);
  const [afterFile, setAfterFile] = useState<{file: File, preview: string} | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleSimpleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const newItem: PortfolioItem = {
        id: Date.now().toString(),
        type: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
        url: event.target?.result as string,
        title: file.name.split('.')[0],
        description: '',
      };

      setProfile({
        ...profile,
        portfolio: [newItem, ...profile.portfolio]
      });
    };
    reader.readAsDataURL(file);
  };

  const handleBeforeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBeforeFile({ file, preview: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const handleAfterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAfterFile({ file, preview: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const createBeforeAfterItem = () => {
    if (!beforeFile || !afterFile) return;

    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      type: 'BEFORE_AFTER',
      url: afterFile.preview, // Main image is After
      beforeUrl: beforeFile.preview,
      title: 'Transformation',
      description: 'Glissez pour voir la différence',
    };

    setProfile({
      ...profile,
      portfolio: [newItem, ...profile.portfolio]
    });

    // Reset
    setBeforeFile(null);
    setAfterFile(null);
    setUploadMode('SIMPLE');
  };

  const handleDelete = (id: string) => {
    setProfile({
      ...profile,
      portfolio: profile.portfolio.filter(item => item.id !== id)
    });
    setSelectedItem(null);
  };

  const handleUpdate = () => {
    if (!selectedItem) return;

    const updatedItem = {
      ...selectedItem,
      title: editTitle,
      description: editDescription
    };

    setProfile({
      ...profile,
      portfolio: profile.portfolio.map(item => item.id === selectedItem.id ? updatedItem : item)
    });
    
    setSelectedItem(updatedItem);
    setIsEditing(false);
  };

  const openItem = (item: PortfolioItem) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Portfolio</h3>
          <p className="text-sm text-[var(--text-secondary)]">Vos meilleures réalisations</p>
        </div>
        
        {/* Mode Toggle */}
        <div className="flex bg-[var(--bg-hover)] rounded-lg p-1 border border-[var(--border)]">
          <button
            onClick={() => setUploadMode('SIMPLE')}
            className={clsx(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
              uploadMode === 'SIMPLE' ? "bg-blue-500 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <ImageIcon className="w-3 h-3" /> Standard
          </button>
          <button
            onClick={() => setUploadMode('BEFORE_AFTER')}
            className={clsx(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
              uploadMode === 'BEFORE_AFTER' ? "bg-blue-500 text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <SplitSquareHorizontal className="w-3 h-3" /> Avant/Après
          </button>
        </div>
      </div>

      {/* Pro Tip Banner */}
      <AnimatePresence>
        {showTip && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 relative overflow-hidden"
          >
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="pr-8">
              <h4 className="text-blue-400 font-medium text-sm mb-1">Astuce : Transformation</h4>
              <p className="text-blue-300/80 text-sm">
                Utilisez le mode "Avant/Après" pour montrer l'impact de votre travail. C'est prouvé : ces visuels convertissent 3x plus de clients !
              </p>
            </div>
            <button 
              onClick={() => setShowTip(false)}
              className="absolute top-4 right-4 text-blue-400/50 hover:text-blue-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Zone */}
      {uploadMode === 'SIMPLE' ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border)] hover:border-blue-500/50 bg-[var(--bg-hover)] hover:bg-[var(--bg-hover)] rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all group"
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleSimpleUpload}
            accept="image/*,video/*"
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-[var(--bg-active)] group-hover:bg-blue-500/20 flex items-center justify-center mb-3 transition-colors">
            <Upload className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-blue-400" />
          </div>
          <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            Cliquez pour ajouter une photo ou vidéo
          </span>
        </div>
      ) : (
        <div className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Before Input */}
          <div 
            onClick={() => beforeInputRef.current?.click()}
            className={clsx(
              "border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden",
              beforeFile ? "border-green-500/50" : "border-[var(--border)] hover:border-blue-500/50"
            )}
          >
            <input type="file" ref={beforeInputRef} onChange={handleBeforeUpload} accept="image/*" className="hidden" />
            {beforeFile ? (
              <>
                <img src={beforeFile.preview} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <span className="relative z-10 bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">AVANT OK</span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-[var(--text-muted)] mb-1">ÉTAPE 1</span>
                <span className="text-sm text-[var(--text-secondary)]">Photo AVANT</span>
              </>
            )}
          </div>

          {/* After Input */}
          <div 
            onClick={() => afterInputRef.current?.click()}
            className={clsx(
              "border-2 border-dashed rounded-xl h-32 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden",
              afterFile ? "border-green-500/50" : "border-[var(--border)] hover:border-blue-500/50"
            )}
          >
            <input type="file" ref={afterInputRef} onChange={handleAfterUpload} accept="image/*" className="hidden" />
            {afterFile ? (
              <>
                <img src={afterFile.preview} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <span className="relative z-10 bg-green-500 text-white text-xs px-2 py-1 rounded font-bold">APRÈS OK</span>
              </>
            ) : (
              <>
                <span className="text-xs font-bold text-[var(--text-muted)] mb-1">ÉTAPE 2</span>
                <span className="text-sm text-[var(--text-secondary)]">Photo APRÈS</span>
              </>
            )}
          </div>

          {/* Action */}
          <div className="flex flex-col items-center justify-center h-full">
            <button
              disabled={!beforeFile || !afterFile}
              onClick={createBeforeAfterItem}
              className="w-full h-12 bg-blue-600 hover:bg-blue-500 disabled:bg-[var(--bg-active)] disabled:text-[var(--text-muted)] text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <SplitSquareHorizontal className="w-4 h-4" />
              Créer le Slider
            </button>
            <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
              Crée un comparatif interactif
            </p>
          </div>
        </div>
      )}

      {/* Masonry Grid */}
      <div className="columns-2 md:columns-3 gap-4 space-y-4">
        {profile.portfolio.map((item) => (
          <motion.div
            key={item.id}
            layoutId={`portfolio-${item.id}`}
            onClick={() => openItem(item)}
            className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden bg-[var(--bg-card)] border border-[var(--border)]"
          >
            {item.type === 'VIDEO' ? (
              <div className="relative aspect-video bg-black">
                <video src={item.url} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-active)] backdrop-blur-sm flex items-center justify-center">
                    <Video className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ) : item.type === 'BEFORE_AFTER' ? (
              <div className="relative aspect-video">
                {/* Preview static - just show split or slider */}
                <BeforeAfterSlider 
                  beforeImage={item.beforeUrl!} 
                  afterImage={item.url} 
                  className="pointer-events-none" // Disable interaction in grid preview
                />
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-lg z-10">
                  <SplitSquareHorizontal className="w-3 h-3 text-white" />
                </div>
              </div>
            ) : (
              <img src={item.url} alt={item.title} className="w-full h-auto object-cover" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-20">
              <h4 className="text-[var(--text-primary)] font-medium truncate">{item.title}</h4>
              {item.description && (
                <p className="text-[var(--text-secondary)] text-xs line-clamp-2 mt-1">{item.description}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {profile.portfolio.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] mx-auto flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Votre portfolio est vide</h3>
          <p className="text-[var(--text-muted)] max-w-sm mx-auto">
            Ajoutez des photos de vos réalisations pour convaincre les futurs clients.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            
            <motion.div
              layoutId={`portfolio-${selectedItem.id}`}
              className="relative w-full max-w-4xl bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] border border-[var(--border)]"
            >
              {/* Media Section */}
              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden relative">
                {selectedItem.type === 'VIDEO' ? (
                  <video src={selectedItem.url} controls className="max-w-full max-h-[60vh] md:max-h-full" />
                ) : selectedItem.type === 'BEFORE_AFTER' ? (
                  <div className="w-full h-full p-4 flex items-center">
                     <BeforeAfterSlider 
                      beforeImage={selectedItem.beforeUrl!} 
                      afterImage={selectedItem.url} 
                      aspectRatio="aspect-video"
                      className="w-full h-auto max-h-full shadow-2xl"
                    />
                  </div>
                ) : (
                  <img src={selectedItem.url} alt={selectedItem.title} className="max-w-full max-h-[60vh] md:max-h-full object-contain" />
                )}
              </div>

              {/* Sidebar */}
              <div className="w-full md:w-80 bg-[var(--bg-card)] p-6 flex flex-col border-l border-[var(--border)]">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Détails</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="p-2 hover:bg-[var(--bg-active)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedItem.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Titre</label>
                      <input 
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-black/50 border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
                      <textarea 
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={4}
                        className="w-full bg-black/50 border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:border-blue-500 outline-none resize-none"
                      />
                    </div>
                    <button 
                      onClick={handleUpdate}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg transition-colors"
                    >
                      Enregistrer
                    </button>
                  </div>
                ) : (
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{selectedItem.title}</h2>
                    <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                      {selectedItem.description || "Aucune description."}
                    </p>
                    
                    {selectedItem.type === 'BEFORE_AFTER' && (
                      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-sm mb-1">
                          <SplitSquareHorizontal className="w-4 h-4" />
                          Transformation
                        </div>
                        <p className="text-xs text-blue-300/80">
                          Ce visuel interactif montre la qualité de votre intervention.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="mt-6 w-full border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-medium py-2 rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
