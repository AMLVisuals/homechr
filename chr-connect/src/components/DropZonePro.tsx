'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, Loader2, FileText, Camera, Eye } from 'lucide-react';
import { clsx } from 'clsx';
import SmartScanner from './SmartScanner';

interface DropZoneProProps {
  label: string;
  description?: string;
  type: 'IDENTITY' | 'DOCUMENT';
  status: 'idle' | 'uploading' | 'pending' | 'verified';
  onStatusChange: (status: 'idle' | 'uploading' | 'pending' | 'verified') => void;
}

export default function DropZonePro({ label, description, type, status, onStatusChange }: DropZoneProProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (status === 'verified') return;
    
    onStatusChange('uploading');
    // Simulate upload
    setTimeout(() => {
      onStatusChange('pending');
      setPreview("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"); // Mock PDF
      // Simulate verification delay
      setTimeout(() => {
        onStatusChange('verified');
      }, 2000);
    }, 1500);
  };

  const handleScan = (imageSrc: string) => {
    setIsScannerOpen(false);
    onStatusChange('uploading');
    setPreview(imageSrc);
    setTimeout(() => {
        onStatusChange('verified');
    }, 2000);
  };

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between items-end mb-2">
         <label className="block text-sm font-medium text-gray-400">{label}</label>
         {status === 'verified' && <span className="text-xs text-green-500 font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Validé</span>}
      </div>
      
      <div className="relative group">
        <motion.div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={clsx(
            "relative h-32 rounded-xl border border-dashed transition-all flex items-center justify-center overflow-hidden",
            status === 'idle' && "border-gray-700 hover:border-gray-500 bg-white/5",
            status === 'uploading' && "border-blue-500 bg-blue-500/10",
            status === 'pending' && "border-yellow-500 bg-yellow-500/10",
            status === 'verified' && "border-green-500 bg-green-500/10"
            )}
        >
            {/* Background Preview if Verified/Pending */}
            {preview && (status === 'pending' || status === 'verified') && (
                <div className="absolute inset-0 opacity-30 bg-cover bg-center" style={{ backgroundImage: `url(${preview.startsWith('data') ? preview : 'https://upload.wikimedia.org/wikipedia/commons/8/87/PDF_file_icon.svg'})` }} />
            )}

            <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center w-full">
                 {status === 'idle' && (
                    <>
                        <div className="flex gap-4 mb-2">
                            <button 
                                onClick={() => document.getElementById(`file-${label}`)?.click()}
                                className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors"
                            >
                                <div className="p-3 rounded-full bg-white/5 hover:bg-white/10">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <span className="text-xs">Upload</span>
                            </button>
                            <div className="w-px h-12 bg-gray-700" />
                            <button 
                                onClick={() => setIsScannerOpen(true)}
                                className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors"
                            >
                                <div className="p-3 rounded-full bg-white/5 hover:bg-white/10">
                                    <Camera className="w-5 h-5" />
                                </div>
                                <span className="text-xs">Scan</span>
                            </button>
                        </div>
                        <span className="text-xs text-gray-600">{description || "Glisser ou choisir une option"}</span>
                    </>
                 )}

                {status === 'uploading' && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center text-blue-400"
                >
                    <Loader2 className="w-6 h-6 animate-spin mb-1" />
                    <span className="text-xs">Analyse en cours...</span>
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
                    <CheckCircle className="w-8 h-8 mb-1 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </motion.div>
                )}
            </div>
            <input id={`file-${label}`} type="file" className="hidden" onChange={(e) => handleDrop({ preventDefault: () => {} } as any)} />
        </motion.div>
      </div>

      <SmartScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onCapture={handleScan}
        type={type === 'IDENTITY' ? 'IDENTITY' : 'DOCUMENT'}
      />
    </div>
  );
}
