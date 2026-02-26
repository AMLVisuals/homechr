import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Video, Mic, X, Plus, Image as ImageIcon, FileText, Check, 
  ChevronLeft, Clock, MapPin, Calendar, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useMissionEngine } from '@/store/mission-engine';

interface RichMissionReportProps {
  onSubmit: (data: { text: string; attachments: any[] }) => void;
  onCancel: () => void;
}

export default function RichMissionReport({ onSubmit, onCancel }: RichMissionReportProps) {
  const { interimData, startTime } = useMissionEngine();
  const [mounted, setMounted] = useState(false);
  
  // Initialize state with interim data
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<{ type: 'PHOTO' | 'VIDEO' | 'VOICE'; url: string }[]>([]);
  
  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Pre-fill data from interim capture
  useEffect(() => {
    let initialText = '';
    
    // Add notes
    if (interimData.notes.length > 0) {
      initialText += "Notes prises pendant l'intervention :\n";
      interimData.notes.forEach(note => {
        initialText += `- ${note}\n`;
      });
      initialText += "\n";
    }

    setText(initialText);

    // Add media
    if (interimData.media.length > 0) {
      const existingMedia = interimData.media.map(m => ({
        type: m.type,
        url: m.url
      }));
      setAttachments(prev => [...prev, ...existingMedia]);
    }
  }, [interimData]); // Run once on mount or when interimData changes (should be stable)

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    }
    return {
      offsetX: (e as React.MouseEvent).nativeEvent.offsetX,
      offsetY: (e as React.MouseEvent).nativeEvent.offsetY
    };
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setSignature(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'PHOTO' | 'VIDEO') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAttachments([...attachments, { type, url }]);
    }
  };

  const handleAddAttachment = (type: 'PHOTO' | 'VIDEO') => {
    if (type === 'PHOTO') fileInputRef.current?.click();
    else videoInputRef.current?.click();
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setAttachments([...attachments, { type: 'VOICE', url: 'audio-note.mp3' }]);
    } else {
      setIsRecording(true);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const formatDuration = () => {
    if (!startTime) return "00:00";
    const diff = Math.floor((Date.now() - startTime) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const content = (
    <div className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col h-full w-full animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between safe-area-top shadow-sm z-20">
        <Button variant="ghost" size="icon" onClick={onCancel} className="-ml-2">
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </Button>
        <h1 className="font-bold text-lg text-gray-900">Rapport de Mission</h1>
        <div className="w-8" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
        
        {/* Mission Summary Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-bold text-xl text-gray-900">Le Fouquet's</h2>
              <div className="flex items-center text-gray-500 text-sm mt-1 gap-1">
                <MapPin className="w-3.5 h-3.5" />
                99 Av. des Champs-Élysées
              </div>
            </div>
            <div className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
              Terminé
            </div>
          </div>
          
          <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Durée</p>
                <p className="text-sm font-bold text-gray-900">{formatDuration()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Date</p>
                <p className="text-sm font-bold text-gray-900">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interim Data Recap (Optional visual cue) */}
        {(interimData.notes.length > 0 || interimData.media.length > 0) && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900 text-sm">Données récupérées</h3>
                <p className="text-xs text-blue-700 mt-1">
                  {interimData.notes.length} note(s) et {interimData.media.length} média(s) capturés pendant l'intervention ont été intégrés automatiquement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wider pl-1">Compte Rendu</Label>
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-gray-100 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Décrivez les actions effectuées..."
                className="min-h-[180px] text-base resize-none border-none focus-visible:ring-0 bg-transparent p-4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center pl-1">
              <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Médias & Preuves</Label>
              <span className="text-xs text-gray-500 font-medium">{attachments.length} fichiers</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {attachments.map((att, idx) => (
                <div key={idx} className="aspect-square relative group rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
                  {att.type === 'PHOTO' && (
                    <img src={att.url} alt="Attachment" className="w-full h-full object-cover" />
                  )}
                  {att.type === 'VIDEO' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                      <Video className="w-8 h-8" />
                    </div>
                  )}
                  {att.type === 'VOICE' && (
                    <div className="w-full h-full flex items-center justify-center bg-purple-50 text-purple-600">
                      <Mic className="w-8 h-8" />
                    </div>
                  )}
                  
                  <button 
                    onClick={() => removeAttachment(idx)}
                    className="absolute top-1 right-1 p-1.5 bg-black/50 backdrop-blur-md text-white rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              <button 
                onClick={() => handleAddAttachment('PHOTO')}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide">Photo</span>
              </button>
              
              <button 
                onClick={() => handleAddAttachment('VIDEO')}
                className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide">Vidéo</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
             <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wider pl-1">Note Vocale</Label>
             <button 
              onClick={toggleRecording}
              className={cn(
                "w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-medium transition-all shadow-sm border",
                isRecording 
                  ? "bg-red-50 text-red-600 border-red-200 animate-pulse" 
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isRecording ? "bg-red-100" : "bg-gray-100")}>
                <Mic className={cn("w-4 h-4", isRecording && "animate-bounce")} />
              </div>
              {isRecording ? "Enregistrement en cours..." : "Ajouter une note vocale"}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center pl-1">
              <Label className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Signature</Label>
              {signature && (
                <button onClick={clearSignature} className="text-xs text-red-500 font-bold uppercase hover:text-red-600">
                  Effacer
                </button>
              )}
            </div>
            <div className="border border-gray-200 rounded-2xl bg-white shadow-sm touch-none overflow-hidden h-[180px] relative">
              <canvas
                ref={canvasRef}
                width={500}
                height={300}
                className="w-full h-full cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!signature && !isDrawing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-gray-300">
                  <div className="w-64 h-px bg-gray-100 mb-2" />
                  <span className="text-xs font-medium uppercase tracking-widest">Signer ici</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'PHOTO')}
      />
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/*"
        onChange={(e) => handleFileSelect(e, 'VIDEO')}
      />

      {/* Footer Actions */}
      <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-bottom">
        <Button 
          onClick={() => onSubmit({ text, attachments })} 
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-lg font-bold shadow-lg shadow-blue-600/20"
          disabled={!text && attachments.length === 0}
        >
          <Check className="w-5 h-5 mr-2" />
          Valider le rapport
        </Button>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(content, document.body);
}
