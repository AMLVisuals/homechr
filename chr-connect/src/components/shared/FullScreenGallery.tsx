'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { clsx } from 'clsx';

interface FullScreenGalleryProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function FullScreenGallery({ images, initialIndex = 0, isOpen, onClose }: FullScreenGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) setCurrentIndex(initialIndex);
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') navigate(-1);
      if (e.key === 'ArrowRight') navigate(1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  const navigate = (direction: number) => {
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;
    setCurrentIndex(newIndex);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl">
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation Left */}
      <button 
        onClick={(e) => { e.stopPropagation(); navigate(-1); }}
        className="absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors z-50 group"
      >
        <ChevronLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* Navigation Right */}
      <button 
        onClick={(e) => { e.stopPropagation(); navigate(1); }}
        className="absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors z-50 group"
      >
        <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Main Image */}
      <div className="relative w-full h-full p-10 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative max-w-full max-h-full"
          >
             {/* In a real app, this would be <Image />. Using a div with bg for now as placeholders are strings */}
             {images[currentIndex].startsWith('http') || images[currentIndex].startsWith('/') ? (
               <img 
                 src={images[currentIndex]} 
                 alt={`Gallery image ${currentIndex + 1}`} 
                 className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
               />
             ) : (
                <div className="w-[80vw] h-[60vh] bg-gray-800 rounded-2xl flex flex-col items-center justify-center text-gray-500">
                    <ZoomIn className="w-16 h-16 mb-4 opacity-50" />
                    <span className="text-xl font-medium">Image {currentIndex + 1}</span>
                    <span className="text-sm mt-2">{images[currentIndex]}</span>
                </div>
             )}
             
             {/* Counter */}
             <div className="absolute bottom-[-3rem] left-1/2 -translate-x-1/2 text-white/80 font-medium text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
               {currentIndex + 1} / {images.length}
             </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnails Strip */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 max-w-[80vw] overflow-x-auto p-2 no-scrollbar bg-black/50 rounded-2xl backdrop-blur-md">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={clsx(
              "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 relative",
              idx === currentIndex ? "border-white scale-110 z-10" : "border-transparent opacity-50 hover:opacity-100"
            )}
          >
            {img.startsWith('http') || img.startsWith('/') ? (
              <img src={img} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-700 flex items-center justify-center text-[8px] text-white">
                {idx + 1}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
