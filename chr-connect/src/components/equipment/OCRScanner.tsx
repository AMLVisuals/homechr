'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  X,
  Upload,
  RefreshCw,
  Check,
  AlertCircle,
  Scan,
  Keyboard,
  Zap,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipmentScanner } from '@/hooks/useEquipmentScanner';
import type { OCRResult, EquipmentFormData } from '@/types/equipment';

// ============================================================================
// TYPES
// ============================================================================

interface OCRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (data: Partial<EquipmentFormData>, image?: string) => void;
  onManualEntry: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function OCRScanner({
  isOpen,
  onClose,
  onScanComplete,
  onManualEntry,
}: OCRScannerProps) {
  const {
    scanState,
    isScanning,
    processImage,
    reset,
    extractFormData,
    getConfidenceLevel,
    videoRef,
    canvasRef,
  } = useEquipmentScanner();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen && !cameraActive) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture photo from camera
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        if (blob) {
          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
          await processImage(file);
        }
      },
      'image/jpeg',
      0.9
    );
  }, [processImage, videoRef, canvasRef]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processImage(file);
    }
  };

  // Handle successful scan
  const handleConfirm = () => {
    const formData = extractFormData();
    if (formData) {
      onScanComplete(formData, scanState.capturedImage || undefined);
      handleClose();
    }
  };

  // Reset and try again
  const handleRetry = () => {
    reset();
    startCamera();
  };

  // Close modal
  const handleClose = () => {
    stopCamera();
    reset();
    onClose();
  };

  // Handle manual entry
  const handleManualEntry = () => {
    handleClose();
    onManualEntry();
  };

  if (!isOpen) return null;

  const confidenceLevel = getConfidenceLevel();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        {/* Header */}
        <div className="relative z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="text-center">
            <h2 className="text-white font-semibold">Scanner la plaque</h2>
            <p className="text-white/60 text-sm">Plaque signalétique</p>
          </div>

          <button
            onClick={handleManualEntry}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center"
          >
            <Keyboard className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Camera View / Processing / Results */}
        <div className="flex-1 relative overflow-hidden">
          {/* Video Stream */}
          {(scanState.status === 'idle' || scanState.status === 'capturing') && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Frame Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-[85%] max-w-md aspect-[4/3]">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />

                  {/* Scanning line animation */}
                  <motion.div
                    initial={{ top: '0%' }}
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                  />

                  {/* Target icon in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className="w-12 h-12 text-blue-500/30" />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="absolute bottom-32 left-0 right-0 px-6">
                <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Scan className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">
                      Visez la plaque signalétique
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">
                    L&apos;étiquette argentée avec les informations techniques de la machine
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Processing State */}
          {scanState.status === 'processing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
              {/* Captured Image Preview */}
              {scanState.capturedImage && (
                <div className="absolute inset-0 opacity-30">
                  <img
                    src={scanState.capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="relative z-10 text-center px-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 mx-auto mb-6"
                >
                  <div className="w-full h-full rounded-full border-4 border-blue-500/30 border-t-blue-500" />
                </motion.div>

                <h3 className="text-white text-xl font-semibold mb-2">
                  Analyse en cours...
                </h3>
                <p className="text-white/60 mb-6">
                  Notre IA lit les informations de la plaque
                </p>

                {/* Progress bar */}
                <div className="w-64 mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${scanState.progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                  />
                </div>
                <p className="text-white/40 text-sm mt-2">{scanState.progress}%</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {scanState.status === 'success' && scanState.result && (
            <div className="absolute inset-0 flex flex-col bg-black">
              {/* Captured Image */}
              {scanState.capturedImage && (
                <div className="h-1/3">
                  <img
                    src={scanState.capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Results */}
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Success Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">
                      Informations extraites
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm',
                          confidenceLevel === 'high'
                            ? 'text-green-400'
                            : confidenceLevel === 'medium'
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        )}
                      >
                        {Math.round((scanState.result.confidence || 0) * 100)}% de confiance
                      </span>
                      <Zap
                        className={cn(
                          'w-4 h-4',
                          confidenceLevel === 'high'
                            ? 'text-green-400'
                            : confidenceLevel === 'medium'
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* Extracted Data */}
                <div className="space-y-4">
                  {scanState.result.brand && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white/50 text-sm mb-1">Marque</p>
                      <p className="text-white text-lg font-semibold">
                        {scanState.result.brand}
                      </p>
                    </div>
                  )}

                  {scanState.result.model && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white/50 text-sm mb-1">Modèle</p>
                      <p className="text-white text-lg font-semibold">
                        {scanState.result.model}
                      </p>
                    </div>
                  )}

                  {scanState.result.serialNumber && (
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <p className="text-white/50 text-sm mb-1">N° de Série</p>
                      <p className="text-white text-lg font-mono">
                        {scanState.result.serialNumber}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {scanState.result.voltage && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white/50 text-sm mb-1">Tension</p>
                        <p className="text-white font-semibold">
                          {scanState.result.voltage}
                        </p>
                      </div>
                    )}

                    {scanState.result.power && (
                      <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                        <p className="text-white/50 text-sm mb-1">Puissance</p>
                        <p className="text-white font-semibold">
                          {scanState.result.power}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {scanState.status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black px-8">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>

              <h3 className="text-white text-xl font-semibold mb-2 text-center">
                Impossible de lire la plaque
              </h3>
              <p className="text-white/60 text-center mb-8">
                {scanState.error || 'Assurez-vous que la plaque est bien visible et essayez à nouveau.'}
              </p>

              <div className="space-y-3 w-full max-w-xs">
                <button
                  onClick={handleRetry}
                  className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                  Réessayer
                </button>

                <button
                  onClick={handleManualEntry}
                  className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Keyboard className="w-5 h-5" />
                  Saisir manuellement
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="relative z-10 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
          {(scanState.status === 'idle' || scanState.status === 'capturing') && (
            <div className="flex items-center justify-center gap-6">
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <Upload className="w-6 h-6 text-white" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                disabled={!cameraActive}
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center transition-all',
                  cameraActive
                    ? 'bg-white hover:scale-105 active:scale-95'
                    : 'bg-white/30 cursor-not-allowed'
                )}
              >
                <div className="w-16 h-16 rounded-full bg-white border-4 border-gray-300" />
              </button>

              {/* Spacer for symmetry */}
              <div className="w-14 h-14" />
            </div>
          )}

          {scanState.status === 'success' && (
            <div className="flex gap-4">
              <button
                onClick={handleRetry}
                className="flex-1 py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Réessayer
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-5 h-5" />
                Confirmer
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
