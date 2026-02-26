'use client';

import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, ScanLine, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface SmartScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageSrc: string) => void;
  type: 'IDENTITY' | 'DOCUMENT';
}

export default function SmartScanner({ isOpen, onClose, onCapture, type }: SmartScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isScanning, setIsScanning] = useState(false);

  const capture = useCallback(() => {
    setIsScanning(true);
    setTimeout(() => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        onCapture(imageSrc);
      }
      setIsScanning(false);
    }, 1500); // Fake scan duration
  }, [webcamRef, onCapture]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4"
      >
        <div className="relative w-full max-w-lg aspect-[3/4] md:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{ facingMode: "environment" }}
          />

          {/* Overlay UI */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white pointer-events-auto hover:bg-black/70"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Scanning Frame */}
            <div className="absolute inset-8 md:inset-12 border-2 border-white/30 rounded-2xl">
               {/* Corner Brackets */}
               <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
               <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
               <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
               <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />

               {/* Identity Oval or Document Rect */}
               {type === 'IDENTITY' && (
                 <div className="absolute inset-0 m-auto w-48 h-64 border-2 border-dashed border-white/50 rounded-[50%]" />
               )}

               {/* Laser Scan Animation */}
               {isScanning && (
                 <motion.div
                   initial={{ top: 0, opacity: 0 }}
                   animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                   transition={{ duration: 1.5, ease: "linear" }}
                   className="absolute left-0 right-0 h-1 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                 />
               )}
            </div>

            {/* Instruction Text */}
            <div className="absolute bottom-24 left-0 right-0 text-center">
              <p className="text-white font-medium drop-shadow-md">
                {isScanning ? "Analyse en cours..." : type === 'IDENTITY' ? "Placez votre visage dans le cadre" : "Placez le document dans le cadre"}
              </p>
            </div>
          </div>

          {/* Capture Button */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-auto">
            <button
              onClick={capture}
              disabled={isScanning}
              className={clsx(
                "w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-all active:scale-95",
                isScanning ? "bg-green-500 border-green-500 scale-90" : "bg-white/20 hover:bg-white/30"
              )}
            >
              <div className={clsx("w-12 h-12 rounded-full bg-white transition-all", isScanning && "scale-0")} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
