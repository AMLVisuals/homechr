'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Radar } from 'lucide-react';

interface DispatchSearchingOverlayProps {
  visible: boolean;
  isCooldown?: boolean;
  /** When true, just block clicks — no radar animation (used during PROPOSING) */
  minimal?: boolean;
}

export default function DispatchSearchingOverlay({ visible, isCooldown, minimal }: DispatchSearchingOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute inset-0 z-[50] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Dark overlay — always present to block map interactions */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />

          {/* Radar animation — only during SEARCHING / COOLDOWN */}
          {!minimal && (
            <>
              <div className="relative flex items-center justify-center">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute w-40 h-40 rounded-full border-2 border-blue-500/30"
                    initial={{ scale: 0.3, opacity: 0.8 }}
                    animate={{
                      scale: [0.3, 1.8],
                      opacity: [0.6, 0],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.8,
                      ease: 'easeOut',
                    }}
                  />
                ))}

                {/* Center icon */}
                <motion.div
                  className="relative z-10 w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center backdrop-blur-md"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Radar className="w-8 h-8 text-blue-400" />
                </motion.div>
              </div>

              {/* Text */}
              <div className="absolute bottom-20 left-0 right-0 text-center">
                <motion.p
                  className="text-white/90 text-sm font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {isCooldown ? 'Mission suivante dans un instant...' : 'Recherche de missions en cours...'}
                </motion.p>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
