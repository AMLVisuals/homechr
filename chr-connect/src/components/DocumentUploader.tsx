'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, Loader2, FileText } from 'lucide-react';
import { clsx } from 'clsx';

interface DocumentUploaderProps {
  label: string;
  onUpload?: (file: File) => void;
}

export default function DocumentUploader({ label, onUpload }: DocumentUploaderProps) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'pending' | 'verified'>('idle');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setStatus('uploading');
    // Simulate upload
    setTimeout(() => {
      setStatus('pending');
      // Simulate verification delay
      setTimeout(() => {
        setStatus('verified');
      }, 2000);
    }, 1500);
  };

  return (
    <div className="w-full mb-4">
      <label className="block text-sm font-medium text-gray-400 mb-2">{label}</label>
      <motion.div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => status === 'idle' && handleDrop({ preventDefault: () => {} } as any)}
        className={clsx(
          "relative h-24 rounded-xl border border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden",
          status === 'idle' && "border-gray-700 hover:border-gray-500 bg-white/5",
          status === 'uploading' && "border-blue-500 bg-blue-500/10",
          status === 'pending' && "border-yellow-500 bg-yellow-500/10",
          status === 'verified' && "border-green-500 bg-green-500/10"
        )}
        whileHover={status === 'idle' ? { scale: 1.02 } : {}}
        whileTap={status === 'idle' ? { scale: 0.98 } : {}}
      >
        {status === 'idle' && (
          <div className="text-center text-gray-500">
            <Upload className="w-6 h-6 mx-auto mb-1" />
            <span className="text-xs">Glisser ou cliquer</span>
          </div>
        )}

        {status === 'uploading' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center text-blue-400"
          >
            <Loader2 className="w-6 h-6 animate-spin mb-1" />
            <span className="text-xs">Upload en cours...</span>
          </motion.div>
        )}

        {status === 'pending' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center text-yellow-400"
          >
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs">Vérification IA...</span>
          </motion.div>
        )}

        {status === 'verified' && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center text-green-400"
          >
            <CheckCircle className="w-6 h-6 mb-1" />
            <span className="text-xs font-bold">CERTIFIÉ</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
