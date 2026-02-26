'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { clsx } from 'clsx';
import { GripVertical } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  aspectRatio?: string; // e.g. 'aspect-video', 'aspect-square'
}

export default function BeforeAfterSlider({ 
  beforeImage, 
  afterImage, 
  className,
  aspectRatio = 'aspect-video'
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(percentage);
  };

  const handleInteractionStart = () => setIsDragging(true);
  const handleInteractionEnd = () => setIsDragging(false);

  // Label opacity based on slider position
  // Left label (AVANT) fades out as slider moves left (0%)
  // Right label (APRÈS) fades out as slider moves right (100%)
  const beforeLabelOpacity = sliderPosition < 10 ? 0 : 1;
  const afterLabelOpacity = sliderPosition > 90 ? 0 : 1;

  return (
    <div 
      ref={containerRef}
      className={clsx(
        "relative w-full overflow-hidden select-none cursor-ew-resize group rounded-xl", 
        aspectRatio, 
        className
      )}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
    >
      {/* Background Image (AFTER) - The "Base" */}
      <div className="absolute inset-0 w-full h-full">
        <img 
          src={afterImage} 
          alt="Après" 
          className="w-full h-full object-cover"
        />
        <div 
          className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded shadow-lg transition-opacity duration-300 pointer-events-none"
          style={{ opacity: afterLabelOpacity }}
        >
          APRÈS
        </div>
      </div>

      {/* Foreground Image (BEFORE) - Clipped */}
      <div 
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img 
          src={beforeImage} 
          alt="Avant" 
          className="absolute top-0 left-0 max-w-none h-full object-cover"
          style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
        />
        <div 
          className="absolute top-4 left-4 bg-gray-800/90 backdrop-blur-sm text-gray-200 text-xs font-bold px-2 py-1 rounded shadow-lg transition-opacity duration-300 pointer-events-none"
          style={{ opacity: beforeLabelOpacity }}
        >
          AVANT
        </div>
      </div>

      {/* Slider Handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-600">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>
      
      {/* Overlay instruction on hover if not interacted yet */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-md">
          Glissez pour comparer
        </div>
      </div>
    </div>
  );
}
