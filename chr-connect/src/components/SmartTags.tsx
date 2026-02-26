'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SmartTagsProps {
  tags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

export default function SmartTags({ tags, selectedTags, onToggle }: SmartTagsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-fade-right"
        style={{ scrollbarWidth: 'none' }}
      >
        {tags.map((tag, idx) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <motion.button
              key={tag}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => onToggle(tag)}
              className={clsx(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border",
                isSelected 
                  ? "bg-white text-black border-white" 
                  : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:border-white/20"
              )}
              whileTap={{ scale: 0.95 }}
            >
              {tag}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
