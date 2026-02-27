'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MessageCircle, Info } from 'lucide-react';

interface LightboxImage {
  url: string;
  caption?: string;
}

interface LightboxProps {
  images: (string | LightboxImage)[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, isOpen, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showCaption, setShowCaption] = useState(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setShowCaption(false);
  }, [initialIndex, isOpen]);

  // Normalize images to object format
  const normalizedImages = images.map(img => 
    typeof img === 'string' ? { url: img, caption: '' } : img
  );

  const currentImage = normalizedImages[currentIndex];

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % normalizedImages.length);
    setShowCaption(false);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + normalizedImages.length) % normalizedImages.length);
    setShowCaption(false);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex items-center justify-center"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-[var(--bg-active)] hover:bg-white/20 rounded-full text-[var(--text-primary)] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Buttons */}
          {normalizedImages.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 z-50 p-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-full text-[var(--text-primary)] transition-colors hidden md:block"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 z-50 p-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-full text-[var(--text-primary)] transition-colors hidden md:block"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Main Image Container */}
          <div className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={currentIndex}
                src={currentImage.url}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);

                  if (swipe < -swipeConfidenceThreshold) {
                    handleNext();
                  } else if (swipe > swipeConfidenceThreshold) {
                    handlePrev();
                  }
                }}
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl absolute"
                alt={currentImage.caption || "Full screen view"}
              />
            </AnimatePresence>

            {/* Caption Indicator / Toggle */}
            {currentImage.caption && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full max-w-md px-4">
                <AnimatePresence>
                  {showCaption && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      className="bg-black/80 backdrop-blur-md border border-[var(--border)] p-4 rounded-2xl text-center w-full"
                    >
                      <p className="text-[var(--text-primary)] text-sm font-medium">{currentImage.caption}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button
                  onClick={() => setShowCaption(!showCaption)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all ${
                    showCaption
                      ? 'bg-white text-black border-white'
                      : 'bg-black/50 text-[var(--text-primary)] border-[var(--border)] hover:bg-black/70'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">
                    {showCaption ? 'Masquer info' : 'Voir info'}
                  </span>
                </button>
              </div>
            )}
            
            {/* Page Indicator */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-[var(--text-secondary)]">
              {currentIndex + 1} / {normalizedImages.length}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};
