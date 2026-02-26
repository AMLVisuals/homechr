'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Clock, CheckCircle, Navigation, ArrowRight, FileText, ChevronLeft, MoreVertical, Phone, Shield } from 'lucide-react';
import { useMissionEngine } from '@/store/mission-engine';
import { useMissionsStore } from '@/store/useMissionsStore';
import { Button } from '@/components/ui/button';
import Webcam from 'react-webcam';
import RichMissionReport from './RichMissionReport';
import { cn } from '@/lib/utils';

// Dynamic import for Map to avoid SSR issues
const MissionMap = dynamic(() => import('./MissionMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Chargement de la carte...</div>
});

// Mock images for fallback
const MOCK_BEFORE = "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=800&auto=format&fit=crop"; 

export default function MissionWorkflow() {
  const { 
    status, setStatus, updateLocation, setEta, eta,
    uploadEvidence, submitReport, addInterimNote, addInterimMedia,
    venueLocation, technicianLocation, startTime,
    resetMission, activeMissionId
  } = useMissionEngine();
  
  const { updateMission, generateInvoice, missions } = useMissionsStore();
  const activeMission = activeMissionId ? missions.find(m => m.id === activeMissionId) : null;

  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceStep, setEvidenceStep] = useState<'BEFORE' | 'AFTER' | 'INTERIM'>('BEFORE');
  const [mediaType, setMediaType] = useState<'PHOTO' | 'VIDEO'>('PHOTO');
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickNote, setQuickNote] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer for IN_PROGRESS
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

  // Real Geolocation or Simulation when ON_WAY
  const [distance, setDistance] = useState(1200); // meters
  const [instruction, setInstruction] = useState("Tournez à droite sur Rue de Rivoli");

  useEffect(() => {
    let watchId: number;
    if (status === 'ON_WAY') {
      // Simulation mode for demo
      const moveInterval = setInterval(() => {
        // Move tech 5% closer to venue
        const lat = technicianLocation.lat + (venueLocation.lat - technicianLocation.lat) * 0.05;
        const lng = technicianLocation.lng + (venueLocation.lng - technicianLocation.lng) * 0.05;
        
        updateLocation(lat, lng);
        
        // Update distance
        const newDist = Math.sqrt(
          Math.pow(lat - venueLocation.lat, 2) + 
          Math.pow(lng - venueLocation.lng, 2)
        ) * 111000; // rough deg to meters
        
        setDistance(Math.round(newDist));
        const newEta = Math.ceil(newDist / 500 * 60);
        setEta(newEta);

        // Sync real-time location with persistent store
        if (activeMissionId) {
          updateMission(activeMissionId, {
            technicianLocation: { lat, lng },
            eta: newEta
          });
        }

        // Update instructions based on distance
        if (newDist < 100) setInstruction("Vous êtes arrivé à destination");
        else if (newDist < 300) setInstruction("La destination est sur votre droite");
        else if (newDist < 800) setInstruction("Continuez tout droit sur 500m");
        
        if (Math.abs(lat - venueLocation.lat) < 0.0001) clearInterval(moveInterval);
      }, 1000);
      
      return () => clearInterval(moveInterval);
    }
  }, [status, venueLocation]);

  const handleStartTrip = () => {
    setStatus('ON_WAY');
    if (activeMissionId) updateMission(activeMissionId, { status: 'ON_WAY' });
  };
  
  const handleArrived = () => {
    setStatus('ON_SITE');
    if (activeMissionId) updateMission(activeMissionId, { status: 'ON_SITE' });
  };
  
  const handleStartMission = () => {
    setEvidenceStep('BEFORE');
    setShowEvidenceModal(true);
  };

  const handleFinishWork = () => {
    setIsReporting(true);
  };

  const handleAddQuickNote = () => {
    if (quickNote.trim()) {
      addInterimNote(quickNote);
      
      // Sync with persistent store
      if (activeMissionId) {
        const currentNotes = activeMission?.notes || [];
        updateMission(activeMissionId, { notes: [...currentNotes, quickNote] });
      }

      setQuickNote('');
      setShowQuickNote(false);
    }
  };

  const handleInterimCapture = () => {
    setEvidenceStep('INTERIM');
    setShowEvidenceModal(true);
  };

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      const mockUrl = mediaType === 'PHOTO' 
        ? MOCK_BEFORE
        : "https://example.com/video.mp4"; 
      
      if (evidenceStep === 'BEFORE') {
        uploadEvidence('BEFORE', mediaType, mockUrl);
        setIsCapturing(false);
        setShowEvidenceModal(false);
        setStatus('IN_PROGRESS');
        
        // Sync with persistent store
        if (activeMissionId) {
          updateMission(activeMissionId, { 
            status: 'IN_PROGRESS',
            evidence: {
              ...activeMission?.evidence,
              before: { type: mediaType, url: mockUrl }
            }
          });
        }
      } else if (evidenceStep === 'INTERIM') {
        addInterimMedia(mediaType, mockUrl);
        setIsCapturing(false);
        setShowEvidenceModal(false);
      }
    }, 1500);
  };

  const handleReportSubmit = (data: { text: string; attachments: any[] }) => {
    submitReport(data);
    setIsReporting(false);
    setStatus('COMPLETED');

    // Sync with persistent store and generate invoice
    if (activeMissionId) {
      updateMission(activeMissionId, { 
        status: 'COMPLETED',
        report: data.text
        // We could also map attachments here
      });
      generateInvoice(activeMissionId);
    }
  };

  const [recenterKey, setRecenterKey] = useState(0);

  const handleRecenter = () => {
    setRecenterKey(prev => prev + 1);
  };

  // If in reporting mode, show full screen report component
  if (isReporting) {
    return (
      <RichMissionReport 
        onSubmit={handleReportSubmit} 
        onCancel={() => setIsReporting(false)} 
      />
    );
  }

  // Calculate progress percentage
  const steps = ['ACCEPTED', 'ON_WAY', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'];
  const currentStepIndex = steps.indexOf(status);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="h-full flex flex-col bg-gray-50 relative overflow-hidden">
      
      {/* Compact Header - Always visible except ON_WAY (GPS mode) */}
      {status !== 'ON_WAY' && (
        <div className="flex-none bg-white px-4 py-3 border-b border-gray-100 flex justify-between items-center shadow-sm z-20">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              {activeMission ? activeMission.title : 'Mission #1245'}
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                {status.replace('_', ' ')}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {status === 'IN_PROGRESS' && (
              <div className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                {elapsedTime}
              </div>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
            <motion.div 
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          
          {/* 1. ACCEPTED STATE */}
          {status === 'ACCEPTED' && (
            <motion.div 
              key="accepted"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-full flex flex-col p-4"
            >
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                  <Navigation className="w-10 h-10 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Prêt à partir ?</h3>
                  <p className="text-gray-500 mt-2 max-w-xs mx-auto">
                    Confirmez votre départ pour prévenir le client et lancer la navigation.
                  </p>
                </div>
              </div>
              <Button onClick={handleStartTrip} size="lg" className="w-full h-14 text-lg font-bold shadow-xl shadow-blue-900/20 rounded-2xl">
                Commencer le trajet <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}

          {/* 2. ON_WAY STATE (UBER GPS MODE) - MOVED TO PORTAL */}

          {/* 3. ON_SITE STATE */}
          {status === 'ON_SITE' && (
            <motion.div 
              key="on-site"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col p-4"
            >
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">État des lieux</h3>
                  <p className="text-gray-500 mt-2">
                    Prenez une photo de l'équipement avant d'intervenir pour valider votre arrivée.
                  </p>
                </div>
              </div>
              <Button onClick={handleStartMission} size="lg" className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-900/20 rounded-2xl">
                <Camera className="mr-2 w-5 h-5" /> Prendre photo
              </Button>
            </motion.div>
          )}

          {/* 4. IN_PROGRESS STATE */}
          {status === 'IN_PROGRESS' && (
            <motion.div 
              key="in-progress"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-full flex flex-col p-4"
            >
              <div className="flex-1 space-y-6">
                <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-900/20">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-xl">Intervention en cours</h3>
                    <div className="bg-white/20 px-3 py-1 rounded-full font-mono text-sm backdrop-blur-sm">
                      {elapsedTime}
                    </div>
                  </div>
                  <div className="flex gap-4 text-blue-100 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Début: {startTime ? new Date(startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </div>
                  </div>
                </div>

                {/* Quick Actions Grid */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-4">Actions Rapides</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setShowQuickNote(true)}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3"
                    >
                      <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-gray-900">Ajouter Note</span>
                    </button>
                    
                    <button 
                      onClick={handleInterimCapture}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-3"
                    >
                      <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="font-medium text-gray-900">Ajouter Photo/Vidéo</span>
                    </button>
                  </div>
                </div>

                {/* Quick Note Modal */}
                <AnimatePresence>
                  {showQuickNote && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-4"
                      >
                        <h3 className="font-bold text-lg">Nouvelle note</h3>
                        <textarea
                          value={quickNote}
                          onChange={(e) => setQuickNote(e.target.value)}
                          placeholder="Note rapide..."
                          className="w-full h-32 p-3 bg-gray-50 rounded-xl border-none resize-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <div className="flex gap-3">
                          <Button variant="outline" className="flex-1" onClick={() => setShowQuickNote(false)}>Annuler</Button>
                          <Button className="flex-1 bg-blue-600 text-white" onClick={handleAddQuickNote}>Enregistrer</Button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>

                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                   <h4 className="font-bold text-gray-900 mb-2">Instructions</h4>
                   <ul className="space-y-3">
                     <li className="flex gap-3 text-sm text-gray-600">
                       <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                         <CheckCircle className="w-3 h-3" />
                       </div>
                       Vérifier l'alimentation électrique
                     </li>
                     <li className="flex gap-3 text-sm text-gray-600">
                       <div className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                         <CheckCircle className="w-3 h-3" />
                       </div>
                       Inspecter les joints d'étanchéité
                     </li>
                     <li className="flex gap-3 text-sm text-gray-600">
                       <div className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                         <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                       </div>
                       Remplacer le filtre si nécessaire
                     </li>
                   </ul>
                </div>
              </div>

              <Button onClick={handleFinishWork} size="lg" className="w-full h-14 text-lg font-bold bg-gray-900 text-white shadow-xl rounded-2xl mt-4">
                Terminer l'intervention
              </Button>
            </motion.div>
          )}

          {/* 5. COMPLETED STATE */}
          {status === 'COMPLETED' && (
            <motion.div 
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col p-6 items-center justify-center text-center space-y-8"
            >
              <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center relative">
                 <motion.div 
                   initial={{ scale: 0 }}
                   animate={{ scale: 1 }}
                   transition={{ delay: 0.2, type: "spring" }}
                 >
                   <CheckCircle className="w-16 h-16 text-green-600" />
                 </motion.div>
              </div>
              
              <div>
                <h3 className="text-3xl font-bold text-gray-900">Mission Terminée !</h3>
                <p className="text-gray-500 mt-2">Le rapport a été transmis au client.</p>
              </div>

              <div className="w-full bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                 <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                   <span className="text-gray-500">Temps total</span>
                   <span className="font-mono font-bold text-lg">{elapsedTime}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-gray-500">Gain estimé</span>
                   <span className="font-bold text-lg text-green-600">85.00 €</span>
                 </div>
              </div>

              <Button onClick={resetMission} size="lg" variant="outline" className="w-full h-14 rounded-2xl border-gray-200">
                Retour à la carte
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Portal for ON_WAY state (GPS) */}
      {mounted && createPortal(
        <AnimatePresence>
          {status === 'ON_WAY' && (
            <motion.div 
              key="on-way-portal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex flex-col bg-white"
            >
              {/* Top Navigation Panel */}
              <div className="absolute top-4 left-4 right-4 z-[40] bg-[#1a1a1a] text-white p-4 rounded-xl shadow-2xl border border-white/10 flex items-start gap-4 safe-area-top">
                <div className="mt-1">
                  <ArrowRight className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl leading-tight">{distance}m</h3>
                  <p className="text-gray-400 text-sm">{instruction}</p>
                </div>
              </div>

              {/* Full Screen Map */}
              <div className="flex-1 w-full h-full bg-gray-200 relative">
                <MissionMap 
                  techLocation={technicianLocation} 
                  venueLocation={venueLocation} 
                  recenterKey={recenterKey}
                />
                
                {/* Map Controls */}
                <div className="absolute right-4 top-32 flex flex-col gap-2 z-[40]">
                  <Button onClick={handleRecenter} size="icon" className="h-10 w-10 rounded-full bg-white text-black shadow-lg hover:bg-gray-50">
                    <Navigation className="w-4 h-4" />
                  </Button>
                  <Button size="icon" className="h-10 w-10 rounded-full bg-white text-black shadow-lg hover:bg-gray-50">
                    <Shield className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Bottom Action Sheet */}
              <div className="absolute bottom-0 left-0 right-0 bg-white p-5 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-[40] safe-area-bottom">
                <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="font-bold text-lg">Le Fouquet's</h4>
                    <p className="text-sm text-gray-500">Arrivée estimée: {new Date(Date.now() + eta * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-2xl text-blue-600">{Math.ceil(distance / 250)} min</span>
                    <span className="text-xs text-gray-400">{(distance / 1000).toFixed(1)} km</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3">
                   <Button variant="outline" className="col-span-1 h-12 rounded-xl border-gray-200">
                     <Phone className="w-5 h-5" />
                   </Button>
                   <Button onClick={handleArrived} className="col-span-3 h-12 text-base font-bold rounded-xl shadow-lg shadow-blue-900/20 bg-blue-600 hover:bg-blue-700">
                     Je suis arrivé
                   </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Capture Modal (Unchanged logic, just ensure styling is correct) */}
      <AnimatePresence>
        {showEvidenceModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex flex-col"
          >
            <div className="flex justify-between items-center p-4 pt-12 text-white bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
              <button onClick={() => setShowEvidenceModal(false)} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <span className="font-bold text-lg">
                {evidenceStep === 'BEFORE' ? 'Preuve avant travaux' : 'Preuve de fin'}
              </span>
              <div className="w-10" />
            </div>

            <div className="flex-1 relative bg-black">
              <Webcam audio={false} className="w-full h-full object-cover" />
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-8">
               <div className="flex bg-white/20 backdrop-blur-md rounded-full p-1.5">
                  <button 
                    onClick={() => setMediaType('PHOTO')}
                    className={cn(
                      "px-6 py-2 rounded-full text-sm font-bold transition-all",
                      mediaType === 'PHOTO' ? 'bg-white text-black shadow-lg' : 'text-white'
                    )}
                  >
                    Photo
                  </button>
                  <button 
                     onClick={() => setMediaType('VIDEO')}
                     className={cn(
                      "px-6 py-2 rounded-full text-sm font-bold transition-all",
                      mediaType === 'VIDEO' ? 'bg-white text-black shadow-lg' : 'text-white'
                    )}
                  >
                    Vidéo
                  </button>
               </div>

               <button 
                 onClick={handleCapture}
                 disabled={isCapturing}
                 className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative"
               >
                 <div className={cn(
                   "w-16 h-16 rounded-full bg-white transition-all duration-300",
                   isCapturing ? "scale-75 opacity-50" : "scale-100"
                 )} />
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}