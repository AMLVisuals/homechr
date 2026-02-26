'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MapPin, CheckCircle, Phone, MessageSquare, Shield, Video, Camera, FileText, Mic } from 'lucide-react';
import { useMissionEngine } from '@/store/mission-engine';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';

// Dynamic import for Map to avoid SSR issues
const MissionMap = dynamic(() => import('./MissionMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Chargement de la carte...</div>
});

export default function LiveMissionTracker() {
  const { status, technicianLocation, venueLocation, eta, evidence, report, startTime, resetMission } = useMissionEngine();
  const [elapsedTime, setElapsedTime] = useState('00:00');

  // Timer synchronization
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'IN_PROGRESS' && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.floor((now - startTime) / 1000);
        const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
        const seconds = (diff % 60).toString().padStart(2, '0');
        setElapsedTime(`${minutes}:${seconds}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status, startTime]);

  const renderAttachment = (att: { type: 'PHOTO' | 'VIDEO' | 'VOICE', url: string }, index: number) => {
    return (
      <div key={index} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-left w-full">
        <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
          {att.type === 'VIDEO' && <Video className="w-3 h-3" />}
          {att.type === 'PHOTO' && <Camera className="w-3 h-3" />}
          {att.type === 'VOICE' && <Mic className="w-3 h-3" />}
          {att.type === 'VOICE' ? 'Note Vocale' : `Preuve ${index + 1}`}
        </h4>
        
        {att.type === 'VOICE' ? (
          <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
             <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
               <Mic className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <div className="h-2 bg-gray-200 rounded-full w-full overflow-hidden">
                 <div className="h-full bg-purple-500 w-1/3" />
               </div>
               <span className="text-xs text-gray-400 mt-1 block">00:42</span>
             </div>
          </div>
        ) : (
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
            {att.type === 'VIDEO' ? (
               <video src={att.url} controls className="w-full h-full object-cover" />
            ) : (
               <img src={att.url} alt="Attachment" className="w-full h-full object-cover" />
            )}
          </div>
        )}
      </div>
    );
  };

  const renderEvidenceMedia = (item: { type: 'PHOTO' | 'VIDEO', url: string } | null, label: string) => {
    if (!item) return null;
    return (
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-left w-full">
        <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
          {item.type === 'VIDEO' ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
          {label}
        </h4>
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
          {item.type === 'VIDEO' ? (
             <video src={item.url} controls className="w-full h-full object-cover" />
          ) : (
             <img src={item.url} alt={label} className="w-full h-full object-cover" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col h-[650px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10">
        <div>
          <h2 className="font-bold text-gray-900">Suivi de Mission</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className={`w-2 h-2 rounded-full animate-pulse ${status === 'COMPLETED' ? 'bg-blue-500' : 'bg-green-500'}`} />
            {status === 'COMPLETED' ? 'Terminé' : 'En direct'}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
            <Phone className="w-4 h-4" />
          </button>
          <button className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content based on Status */}
      <div className="flex-1 relative bg-gray-50 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* STATE: ACCEPTED or ON_WAY */}
          {(status === 'ACCEPTED' || status === 'ON_WAY' || status === 'ON_SITE') && (
            <motion.div 
              key="map-view"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="relative flex-1">
                <MissionMap techLocation={technicianLocation} venueLocation={venueLocation} />
                
                {/* ETA Overlay */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-200 z-[400] flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Arrivée estimée</div>
                    <div className="text-xl font-bold text-gray-900">{eta} min</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300 mx-2" />
                  <div className="text-left">
                    <div className="text-sm font-bold text-gray-900">Jean D.</div>
                    <div className="text-xs text-gray-500">Plombier Expert</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STATE: IN_PROGRESS */}
          {status === 'IN_PROGRESS' && (
            <motion.div 
              key="working-view"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 p-6 flex flex-col items-center justify-start text-center space-y-6 overflow-y-auto"
            >
              <div className="w-full max-w-md space-y-6">
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-900 mb-2">Intervention en cours</h3>
                  <div className="text-4xl font-mono font-bold text-blue-600">{elapsedTime}</div>
                </div>

                {evidence.before && renderEvidenceMedia(evidence.before, "Preuve de début")}
              </div>
            </motion.div>
          )}

          {/* STATE: COMPLETED */}
          {status === 'COMPLETED' && (
            <motion.div 
              key="completed-view"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-6 flex flex-col h-full overflow-y-auto"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Mission Terminée</h3>
                <p className="text-gray-500">Veuillez valider le résultat final.</p>
              </div>

              {/* Before Evidence */}
              {evidence.before && (
                <div className="mb-6">
                  {renderEvidenceMedia(evidence.before, "Avant Intervention")}
                </div>
              )}

              {/* Report Content */}
              {report && (
                <div className="space-y-6">
                  {/* Text Report */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-left">
                    <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                      <FileText className="w-3 h-3" />
                      Rapport du technicien
                    </h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {report.text}
                    </p>
                  </div>

                  {/* Attachments */}
                  {report.attachments && report.attachments.length > 0 && (
                    <div className="grid grid-cols-1 gap-4">
                      {report.attachments.map((att, idx) => renderAttachment(att, idx))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 space-y-3 pb-4">
                <button 
                  onClick={resetMission}
                  className="w-full py-4 bg-black hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Valider & Payer la prestation
                </button>
                <p className="text-center text-xs text-gray-400">
                  En validant, vous déclenchez le paiement sécurisé.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
