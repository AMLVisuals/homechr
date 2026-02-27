'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioWaveformViewer } from './AudioWaveformViewer';
import {
  X,
  Camera,
  Video,
  Mic,
  StopCircle,
  Play,
  Check,
  RotateCcw,
  Smartphone,
  RefreshCw,
  Loader2,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type CaptureMode = 'PHOTO' | 'VIDEO' | 'AUDIO';

interface MediaCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File, type: 'image' | 'video' | 'audio') => void;
  initialMode?: CaptureMode;
}

export function MediaCaptureModal({ 
  isOpen, 
  onClose, 
  onCapture, 
  initialMode = 'PHOTO' 
}: MediaCaptureModalProps) {
  const [mode, setMode] = useState<CaptureMode>(initialMode);
  
  // Update internal mode when initialMode changes (fixes state persistence issue)
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setCapturedMedia(null);
      setIsRecording(false);
      setRecordingTime(0);
      setError(null);
      chunksRef.current = [];
    }
  }, [isOpen, initialMode]);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<{ url: string; type: 'image' | 'video' | 'audio'; blob: Blob } | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mimeTypeRef = useRef<string>('');

  // Initialize Camera/Mic based on mode
  useEffect(() => {
    if (isOpen && !capturedMedia) {
      startMediaStream();
    } else {
      stopMediaStream();
    }
    return () => stopMediaStream();
  }, [isOpen, mode, facingMode, capturedMedia]);

  const startMediaStream = async () => {
    stopMediaStream();
    setError(null);

    try {
      let constraints: MediaStreamConstraints = {};
      
      if (mode === 'AUDIO') {
        constraints = { audio: true, video: false };
      } else {
        constraints = { 
          audio: mode === 'VIDEO', 
          video: { facingMode } 
        };
      }

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current && mode !== 'AUDIO') {
        videoRef.current.srcObject = newStream;
      }
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError('Impossible d\'accéder à la caméra ou au microphone. Veuillez vérifier les permissions.');
    }
  };

  const stopMediaStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Switch Mode
  const handleModeChange = (newMode: CaptureMode) => {
    if (isRecording) return;
    setMode(newMode);
    setCapturedMedia(null);
  };

  // Photo Capture
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setCapturedMedia({ url, type: 'image', blob });
        }
      }, 'image/jpeg', 0.9);
    }
  };

  // Video/Audio Recording
  const startRecording = () => {
    if (!stream) return;

    // Determine supported MIME type
    const possibleTypes = mode === 'AUDIO' 
      ? ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/aac']
      : ['video/webm;codecs=vp9', 'video/webm', 'video/mp4', 'video/ogg'];
    
    const mimeType = possibleTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
    
    if (!mimeType) {
      setError('Format d\'enregistrement non supporté par ce navigateur.');
      return;
    }
    
    mimeTypeRef.current = mimeType;

    try {
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ 
          url, 
          type: mode === 'AUDIO' ? 'audio' : 'video', 
          blob 
        });
        setIsRecording(false);
        setRecordingTime(0);
      };

      mediaRecorder.start(1000); // Collect chunks every second
      setIsRecording(true);
      
      // Timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (err) {
      console.error('Recording error:', err);
      setError('Erreur lors du démarrage de l\'enregistrement.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const confirmCapture = () => {
    if (capturedMedia) {
      let ext = 'webm'; // Default
      if (capturedMedia.type === 'image') {
        ext = 'jpg';
      } else {
        // Infer extension from mime type
        const mime = capturedMedia.blob.type;
        if (mime.includes('mp4')) ext = 'mp4';
        else if (mime.includes('ogg')) ext = 'ogg';
        else if (mime.includes('aac')) ext = 'aac';
        else if (mime.includes('wav')) ext = 'wav';
      }

      const fileName = `capture_${Date.now()}.${ext}`;
      const file = new File([capturedMedia.blob], fileName, { type: capturedMedia.blob.type });
      onCapture(file, capturedMedia.type);
      onClose();
    }
  };

  const retake = () => {
    if (capturedMedia) {
      URL.revokeObjectURL(capturedMedia.url);
      setCapturedMedia(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-[var(--text-primary)] font-medium flex items-center gap-2">
            {mode === 'PHOTO' && <Camera className="w-5 h-5 text-blue-400" />}
            {mode === 'VIDEO' && <Video className="w-5 h-5 text-purple-400" />}
            {mode === 'AUDIO' && <Mic className="w-5 h-5 text-red-400" />}
            <span>
              {mode === 'PHOTO' ? 'Prendre une photo' : mode === 'VIDEO' ? 'Enregistrer une vidéo' : 'Enregistrer un audio'}
            </span>
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-active)] rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 relative bg-black flex items-center justify-center min-h-[300px] overflow-hidden">
          {error ? (
            <div className="text-center p-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-[var(--text-muted)]">{error}</p>
            </div>
          ) : capturedMedia ? (
            // Captured Preview
            <div className="relative w-full h-full flex items-center justify-center">
              {capturedMedia.type === 'image' && (
                <img src={capturedMedia.url} alt="Capture" className="max-w-full max-h-full object-contain" />
              )}
              {capturedMedia.type === 'video' && (
                <video src={capturedMedia.url} controls className="max-w-full max-h-full" />
              )}
              {capturedMedia.type === 'audio' && (
                <div className="w-full px-6 py-8 flex flex-col items-center justify-center">
                  <div className="w-full bg-[var(--bg-hover)] rounded-lg overflow-hidden border border-[var(--border)] shadow-xl">
                    <AudioWaveformViewer 
                      url={capturedMedia.url} 
                      name={`Audio ${new Date().toLocaleTimeString()}`} 
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Live Preview
            <div className="relative w-full h-full flex items-center justify-center">
              {mode === 'AUDIO' ? (
                <div className="flex flex-col items-center gap-6">
                   <div className={cn(
                     "w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-300",
                     isRecording ? "border-red-500 bg-red-500/10 scale-110" : "border-[var(--border)] bg-[var(--bg-hover)]"
                   )}>
                     <Mic className={cn("w-12 h-12 transition-colors", isRecording ? "text-red-500" : "text-[var(--text-muted)]")} />
                   </div>
                   {isRecording && (
                     <div className="text-2xl font-mono text-[var(--text-primary)] font-bold tracking-widest">
                       {formatTime(recordingTime)}
                     </div>
                   )}
                   <div className="flex gap-1 h-8 items-end">
                      {isRecording && Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [10, 32, 10] }}
                          transition={{ repeat: Infinity, duration: 0.5 + i * 0.1, delay: i * 0.1 }}
                          className="w-2 bg-red-500 rounded-full"
                        />
                      ))}
                   </div>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={cn(
                      "max-w-full max-h-full object-cover",
                      facingMode === 'user' && "scale-x-[-1]"
                    )} 
                  />
                  {mode === 'VIDEO' && isRecording && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      <span className="text-[var(--text-primary)] text-sm font-mono font-medium">{formatTime(recordingTime)}</span>
                    </div>
                  )}
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-6 bg-[var(--bg-card)] border-t border-[var(--border)]">
          {capturedMedia ? (
            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={retake}
                className="flex-1 py-3 px-4 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Réessayer
              </button>
              <button 
                onClick={confirmCapture}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 transition-colors font-medium shadow-lg shadow-blue-500/20"
              >
                <Check className="w-4 h-4" />
                Valider
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Mode Selector */}
              <div className="flex justify-center bg-[var(--bg-input)] p-1 rounded-xl self-center">
                {(['PHOTO', 'VIDEO', 'AUDIO'] as CaptureMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    disabled={isRecording}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      mode === m 
                        ? "bg-[var(--bg-active)] text-[var(--text-primary)] shadow-sm" 
                        : "text-[var(--text-muted)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-hover)]",
                      isRecording && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {m === 'PHOTO' ? 'Photo' : m === 'VIDEO' ? 'Vidéo' : 'Audio'}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                 {/* Flip Camera (only for Photo/Video) */}
                 <div className="w-12">
                   {mode !== 'AUDIO' && (
                     <button 
                       onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
                       disabled={isRecording}
                       className="p-3 rounded-full bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-30"
                     >
                       <RefreshCw className="w-5 h-5" />
                     </button>
                   )}
                 </div>

                 {/* Trigger Button */}
                 <div className="relative">
                   {mode === 'PHOTO' ? (
                     <button 
                       onClick={takePhoto}
                       className="w-16 h-16 rounded-full border-4 border-[var(--border-strong)] flex items-center justify-center hover:scale-105 hover:border-white transition-all group"
                     >
                       <div className="w-12 h-12 rounded-full bg-white group-hover:scale-90 transition-transform" />
                     </button>
                   ) : (
                     <button 
                       onClick={isRecording ? stopRecording : startRecording}
                       className={cn(
                         "w-16 h-16 rounded-full border-4 flex items-center justify-center hover:scale-105 transition-all",
                         isRecording ? "border-red-500/50" : "border-[var(--border-strong)] hover:border-white"
                       )}
                     >
                       <div className={cn(
                         "rounded-full transition-all duration-300",
                         isRecording 
                           ? "w-6 h-6 bg-red-500 rounded-sm" 
                           : "w-12 h-12 bg-red-500"
                       )} />
                     </button>
                   )}
                 </div>

                 <div className="w-12" /> {/* Spacer for balance */}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
