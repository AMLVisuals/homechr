'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Image as ImageIcon, X, Play, Loader2, ScanLine } from 'lucide-react';
import { clsx } from 'clsx';
import SmartScanner from './SmartScanner';

interface MediaHubProps {
  onMediaAdd: (type: 'image' | 'voice', data: any) => void;
}

export default function MediaHub({ onMediaAdd }: MediaHubProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaItems, setMediaItems] = useState<{ type: 'image' | 'voice', url?: string, label?: string, caption?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (imageSrc: string) => {
    setIsScannerOpen(false);
    // Simulate AI Detection
    const newItem = { type: 'image' as const, url: imageSrc, label: 'Analyse IA...' };
    setMediaItems(prev => [newItem, ...prev]);
    
    setTimeout(() => {
      setMediaItems(prev => prev.map(item => 
        item === newItem ? { ...item, label: 'Détection: Panne probable' } : item
      ));
      onMediaAdd('image', imageSrc);
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleCapture(url);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      const newItem = { type: 'voice' as const, label: 'Note Vocale (0:12)' };
      setMediaItems(prev => [newItem, ...prev]);
      onMediaAdd('voice', 'audio-blob-mock');
    } else {
      setIsRecording(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="glass p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[var(--bg-active)] transition-all active:scale-95 group"
        >
          <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 group-hover:bg-blue-500/30 group-hover:text-blue-300 transition-colors">
            <Camera className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-[var(--text-secondary)]">Photo / Vidéo</span>
        </button>

        <button 
          onClick={toggleRecording}
          className={clsx(
            "glass p-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group relative overflow-hidden",
            isRecording && "border-red-500/50 bg-red-500/10"
          )}
        >
          {isRecording ? (
            <div className="flex items-center gap-1 h-12">
               {[1,2,3,4,5].map(i => (
                 <motion.div 
                   key={i}
                   animate={{ height: [10, 24, 10] }}
                   transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                   className="w-1 bg-red-500 rounded-full"
                 />
               ))}
            </div>
          ) : (
            <div className="p-3 bg-purple-500/20 rounded-full text-purple-400 group-hover:bg-purple-500/30 group-hover:text-purple-300 transition-colors">
              <Mic className="w-6 h-6" />
            </div>
          )}
          <span className={clsx("text-sm font-medium", isRecording ? "text-red-400" : "text-[var(--text-secondary)]")}>
            {isRecording ? "Arrêter" : "Note Vocale"}
          </span>
        </button>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="glass p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-[var(--bg-active)] transition-all active:scale-95 group col-span-2"
        >
          <div className="flex items-center gap-2 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
            <ImageIcon className="w-5 h-5" />
            <span className="text-sm font-medium">Ouvrir la Galerie</span>
          </div>
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>

      {/* Preview Zone */}
      <AnimatePresence>
        {mediaItems.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            className="grid grid-cols-2 gap-3"
          >
            {mediaItems.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-black/40 group"
              >
                {item.type === 'image' ? (
                  <>
                    <img src={item.url} alt="Preview" className="w-full h-full object-cover" />
                    {item.label === 'Analyse IA...' && (
                       <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                          <ScanLine className="w-8 h-8 text-green-400 animate-pulse" />
                       </div>
                    )}
                    {/* Caption Input */}
                    <div className="absolute bottom-8 left-2 right-2 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                       <input
                         type="text"
                         placeholder="Ajouter une légende..."
                         value={item.caption || ''}
                         onChange={(e) => {
                           const val = e.target.value;
                           setMediaItems(prev => prev.map((p, i) => i === idx ? { ...p, caption: val } : p));
                         }}
                         className="w-full bg-black/60 backdrop-blur-sm border border-[var(--border-strong)] rounded-md px-2 py-1 text-[10px] text-white placeholder-gray-400 focus:outline-none focus:border-[var(--border)]0 transition-colors"
                         onClick={(e) => e.stopPropagation()}
                       />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-500/10">
                     <Play className="w-8 h-8 text-purple-400" />
                  </div>
                )}
                
                {/* AI Tag / Label */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-1.5">
                    {item.label === 'Analyse IA...' ? (
                      <Loader2 className="w-3 h-3 text-green-400 animate-spin" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">{item.label}</span>
                  </div>
                </div>

                <button 
                   onClick={() => setMediaItems(prev => prev.filter((_, i) => i !== idx))}
                   className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <SmartScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onCapture={handleCapture}
        type="DOCUMENT"
      />
    </div>
  );
}
