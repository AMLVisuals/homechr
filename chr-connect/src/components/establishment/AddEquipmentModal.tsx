'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  QrCode,
  FileText,
  Plus,
  ChevronRight,
  ChevronLeft,
  Check,
  Upload,
  Info,
  Video,
  Mic,
  Trash2,
  Play,
  Image as ImageIcon,
} from 'lucide-react';
import { EQUIPMENT_CATEGORIES_DETAILS } from '@/constants/equipment';
import { cn } from '@/lib/utils';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { DocumentManager } from '../equipment/DocumentManager';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import { MediaCaptureModal, type CaptureMode } from '@/components/shared/MediaCaptureModal';
import type { EquipmentCategory, Equipment, EquipmentDocument, ImageAnnotation } from '@/types/equipment';
import { APP_CONFIG } from '@/config/appConfig';

// ============================================================================
// TYPES
// ============================================================================

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (equipment: Equipment) => void;
  defaultCategory?: EquipmentCategory;
  venueId?: string;
}

type AddMethod = 'SCAN_QR' | 'SCAN_OCR' | 'MANUAL';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AddEquipmentModal({
  isOpen,
  onClose,
  onSuccess,
  defaultCategory,
  venueId,
}: AddEquipmentModalProps) {
  const { currentEstablishment } = useEstablishment();
  const { syncAddEquipment } = useEquipmentStore();

  const targetVenueId = venueId || currentEstablishment?.id;

  // Step management
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form state
  const [addMethod, setAddMethod] = useState<AddMethod | null>(null);
  const [category, setCategory] = useState<EquipmentCategory | null>(null);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyEnd, setWarrantyEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [documents, setDocuments] = useState<EquipmentDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captureModalOpen, setCaptureModalOpen] = useState(false);

  // Media State
  const [mediaData, setMediaData] = useState<{
    file: File;
    preview: string;
    type: 'image' | 'video' | 'audio';
    annotations?: ImageAnnotation[];
  }[]>([]);
  const [addMediaModalOpen, setAddMediaModalOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('PHOTO');

  // Annotation state
  const [annotatorOpen, setAnnotatorOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number | null>(null);

  // Computed selected document for DocumentViewer
  const selectedDocument = React.useMemo(() => {
    if (currentMediaIndex === null || !mediaData[currentMediaIndex]) return null;
    const item = mediaData[currentMediaIndex];
    
    return {
      id: `media-${currentMediaIndex}`,
      name: item.file.name,
      url: item.preview,
      type: 'OTHER',
      uploadedAt: new Date().toISOString(),
      annotations: item.annotations,
      file: item.file,
      mimeType: item.file.type
    } as EquipmentDocument;
  }, [currentMediaIndex, mediaData]);

  // Handle Document Save (Annotations)
  const handleSaveDocument = (updatedDoc: EquipmentDocument) => {
    if (currentMediaIndex !== null && updatedDoc.annotations) {
      setMediaData(prev => prev.map((item, idx) => 
        idx === currentMediaIndex 
          ? { ...item, annotations: updatedDoc.annotations } 
          : item
      ));
    }
  };

  // Camera/Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default category when provided
  useEffect(() => {
    if (defaultCategory && isOpen) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory, isOpen]);

  // Reset on close
  const handleClose = () => {
    setStep(1);
    setAddMethod(null);
    setCategory(null);
    setName('');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setLocation('');
    setPurchaseDate('');
    setWarrantyEnd('');
    setNotes('');
    setPhotos([]);
    setDocuments([]);
    setMediaData([]);
    setAddMediaModalOpen(false);
    setScanResult(null);
    setIsScanning(false);
    onClose();
  };

  // Handle media capture
  const handleCapture = (file: File, type: 'image' | 'video' | 'audio') => {
    const preview = URL.createObjectURL(file);
    setMediaData(prev => [...prev, { file, preview, type }]);
    setAddMediaModalOpen(false);
  };

  useEffect(() => {
    return () => {
      mediaData.forEach(media => URL.revokeObjectURL(media.preview));
    };
  }, [mediaData]);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const preview = URL.createObjectURL(file);
      let type: 'image' | 'video' | 'audio' = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      
      setMediaData(prev => [...prev, { file, preview, type }]);
    });
    setAddMediaModalOpen(false);
  };

  const removeMedia = (index: number) => {
    setMediaData(prev => {
      const newMedia = [...prev];
      URL.revokeObjectURL(newMedia[index].preview);
      newMedia.splice(index, 1);
      return newMedia;
    });
  };

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // Simulate QR scan
  const simulateQRScan = async () => {
    setIsScanning(true);

    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Simulated QR result
    const mockQRData = {
      brand: 'Liebherr',
      model: 'GKv 4310',
      serialNumber: 'LB-2024-78542',
      category: 'FRIDGE' as EquipmentCategory,
    };

    setBrand(mockQRData.brand);
    setModel(mockQRData.model);
    setSerialNumber(mockQRData.serialNumber);
    setCategory(mockQRData.category);
    setScanResult(`Équipement détecté: ${mockQRData.brand} ${mockQRData.model}`);
    setIsScanning(false);
    setStep(2);
  };

  // Simulate OCR scan
  const simulateOCRScan = async () => {
    setIsScanning(true);

    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Simulated OCR result from nameplate
    const mockOCRData = {
      brand: 'Rational',
      model: 'SCC 61',
      serialNumber: 'RT-2023-45123',
      category: 'OVEN' as EquipmentCategory,
      additionalInfo: 'Combi-Steamer, 400V, 50Hz',
    };

    setBrand(mockOCRData.brand);
    setModel(mockOCRData.model);
    setSerialNumber(mockOCRData.serialNumber);
    setCategory(mockOCRData.category);
    setNotes(mockOCRData.additionalInfo);
    setScanResult(`Plaque signalétique lue: ${mockOCRData.brand} ${mockOCRData.model}`);
    setIsScanning(false);
    setStep(2);
  };

  // Handle method selection
  const handleMethodSelect = async (method: AddMethod) => {
    setAddMethod(method);

    if (method === 'SCAN_QR') {
      await simulateQRScan();
    } else if (method === 'SCAN_OCR') {
      await simulateOCRScan();
    } else {
      setStep(2);
    }
  };

  // Handle submit - Actually save to store
  const handleSubmit = async () => {
    if (!category || !name || !currentEstablishment) return;

    setIsSubmitting(true);

    try {
      // Process mediaData
      const processedPhotos: string[] = [...photos];
      const processedDocuments: EquipmentDocument[] = [...documents];

      for (const media of mediaData) {
        if (media.type === 'image') {
          // Convert to base64 for photos
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(media.file);
          });
          processedPhotos.push(base64);
        } else {
          // Add as document
          processedDocuments.push({
            id: `doc_${Date.now()}_${Math.random()}`,
            name: media.file.name,
            url: media.preview,
            type: 'OTHER',
            uploadedAt: new Date().toISOString(),
            mimeType: media.file.type,
            file: media.file
          });
        }
      }

      if (!targetVenueId) {
        console.error('No venue ID provided');
        return;
      }

      // Create equipment in the store (Single Source of Truth)
      const newEquipment = await syncAddEquipment({
        venueId: targetVenueId,
        ownerId: APP_CONFIG.DEFAULT_OWNER_ID,
        category,
        brand: brand || 'Non spécifié',
        model: model || 'Non spécifié',
        serialNumber: serialNumber || undefined,
        nickname: name,
        location: location || 'Non spécifié',
        specifications: {},
        installationDate: purchaseDate || new Date().toISOString().split('T')[0],
        purchaseDate: purchaseDate || undefined,
        warrantyExpiry: warrantyEnd || undefined,
        documents: processedDocuments,
        status: 'OPERATIONAL',
        healthScore: 100,
        photos: processedPhotos.map((url, index) => ({
          id: `ph_${Date.now()}_${index}`,
          url,
          type: 'OVERVIEW' as const,
          uploadedAt: new Date().toISOString(),
        })),
        createdBy: APP_CONFIG.DEFAULT_OWNER_ID,
        metadata: notes ? { notes } : undefined,
      });

      setIsSubmitting(false);
      onSuccess?.(newEquipment);
      handleClose();
    } catch (error) {
      console.error('Failed to add equipment:', error);
      setIsSubmitting(false);
    }
  };

  // Can proceed to next step
  const canProceed = () => {
    switch (step) {
      case 1:
        return addMethod !== null;
      case 2:
        return category !== null && name.trim() !== '';
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-equipment-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[var(--text-primary)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Ajouter un équipement</h2>
                  <p className="text-[var(--text-muted)] text-sm">
                    {step === 1 && 'Choisissez la méthode d\'ajout'}
                    {step === 2 && 'Informations de l\'équipement'}
                    {step === 3 && 'Détails additionnels'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[var(--bg-active)] rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="flex gap-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < step ? 'bg-green-500' : 'bg-[var(--bg-active)]'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Choose Method */}
                {step === 1 && !isScanning && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <p className="text-[var(--text-muted)] text-sm mb-6">
                      Comment souhaitez-vous ajouter votre équipement ?
                    </p>

                    {/* QR Code Scan */}
                    <button
                      onClick={() => handleMethodSelect('SCAN_QR')}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <QrCode className="w-7 h-7 text-[var(--text-primary)]" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[var(--text-primary)] font-semibold text-lg">Scanner un QR Code</p>
                        <p className="text-[var(--text-muted)] text-sm">
                          Scan rapide du QR code Home CHR sur l'équipement
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-blue-500/20 rounded-full">
                        <span className="text-blue-400 text-xs font-bold">RAPIDE</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-muted)] transition-colors" />
                    </button>

                    {/* OCR Scan */}
                    <button
                      onClick={() => handleMethodSelect('SCAN_OCR')}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 hover:border-amber-500/40 transition-all group"
                    >
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Camera className="w-7 h-7 text-[var(--text-primary)]" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[var(--text-primary)] font-semibold text-lg">Scanner la plaque</p>
                        <p className="text-[var(--text-muted)] text-sm">
                          Photographier la plaque signalétique pour extraction OCR
                        </p>
                      </div>
                      <div className="px-3 py-1 bg-amber-500/20 rounded-full">
                        <span className="text-amber-400 text-xs font-bold">INTELLIGENT</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-muted)] transition-colors" />
                    </button>

                    {/* Manual Entry */}
                    <button
                      onClick={() => handleMethodSelect('MANUAL')}
                      className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[var(--bg-hover)] border border-[var(--border)] hover:border-[var(--border-strong)] transition-all group"
                    >
                      <div className="w-14 h-14 rounded-xl bg-[var(--bg-active)] flex items-center justify-center">
                        <FileText className="w-7 h-7 text-[var(--text-muted)]" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-[var(--text-primary)] font-semibold text-lg">Saisie manuelle</p>
                        <p className="text-[var(--text-muted)] text-sm">
                          Remplir les informations manuellement
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-muted)] transition-colors" />
                    </button>
                  </motion.div>
                )}

                {/* Scanning Animation */}
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <div className="relative w-32 h-32 mb-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full"
                      />
                      <div className="absolute inset-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                        {addMethod === 'SCAN_QR' ? (
                          <QrCode className="w-12 h-12 text-blue-400" />
                        ) : (
                          <Camera className="w-12 h-12 text-amber-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-[var(--text-primary)] font-semibold text-lg mb-2">
                      {addMethod === 'SCAN_QR' ? 'Scan du QR Code...' : 'Analyse de la plaque...'}
                    </p>
                    <p className="text-[var(--text-muted)] text-sm">
                      {addMethod === 'SCAN_QR'
                        ? 'Pointez la caméra vers le QR Code'
                        : 'Reconnaissance optique en cours'}
                    </p>
                  </motion.div>
                )}

                {/* Step 2: Equipment Info */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Scan Result Banner */}
                    {scanResult && (
                      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <Check className="w-5 h-5 text-green-400" />
                        <p className="text-green-400 text-sm font-medium">{scanResult}</p>
                      </div>
                    )}

                    {/* Category Selection */}
                    <div>
                      <label className="block text-[var(--text-primary)] font-semibold mb-3">
                        Catégorie <span className="text-red-400">*</span>
                      </label>
                      <div className={cn(
                        "grid gap-2 transition-all",
                        category ? "grid-cols-1" : "grid-cols-3 max-h-48 overflow-y-auto"
                      )}>
                        {EQUIPMENT_CATEGORIES_DETAILS
                          .filter((cat) => !category || category === cat.id)
                          .map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => setCategory(category === cat.id ? null : cat.id)}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border transition-all',
                                category === cat.id
                                  ? 'bg-green-500/20 border-green-500/50 flex-row text-left'
                                  : 'bg-[var(--bg-hover)] border-[var(--border)] hover:bg-[var(--bg-active)] flex-col text-center justify-center'
                              )}
                            >
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-primary)] shrink-0',
                                  `bg-gradient-to-br ${cat.color}`
                                )}
                              >
                                {cat.icon}
                              </div>
                              <div className="flex-1">
                                <p className={cn(
                                  "text-[var(--text-primary)] font-medium",
                                  category === cat.id ? "text-base" : "text-xs"
                                )}>
                                  {cat.label}
                                </p>
                              </div>
                              {category === cat.id && (
                                <div className="p-1 rounded-lg bg-[var(--bg-active)] hover:bg-[var(--bg-active)] transition-colors">
                                  <X className="w-4 h-4 text-[var(--text-primary)]" />
                                </div>
                              )}
                            </button>
                          ))}
                      </div>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-[var(--text-primary)] font-semibold mb-2">
                        Nom de l'équipement <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Frigo principal cuisine"
                        className="w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-green-500/50"
                      />
                    </div>

                    {/* Brand & Model */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[var(--text-primary)] font-semibold mb-2">Marque</label>
                        <input
                          type="text"
                          value={brand}
                          onChange={(e) => setBrand(e.target.value)}
                          placeholder="Ex: Liebherr"
                          className="w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-green-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--text-primary)] font-semibold mb-2">Modèle</label>
                        <input
                          type="text"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                          placeholder="Ex: GKv 4310"
                          className="w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-green-500/50"
                        />
                      </div>
                    </div>

                    {/* Serial Number */}
                    <div>
                      <label className="block text-[var(--text-primary)] font-semibold mb-2">
                        Numéro de série
                      </label>
                      <input
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="Ex: SN-2024-XXXXX"
                        className="w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-green-500/50"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Additional Details */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Location */}
                    <div>
                      <label className="block text-[var(--text-primary)] font-semibold mb-2">
                        Emplacement
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Ex: Cuisine principale, côté gauche"
                        className="w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-green-500/50"
                      />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[var(--text-primary)] font-semibold mb-2">
                          Date d'achat
                        </label>
                        <input
                          type="date"
                          value={purchaseDate}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-green-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-[var(--text-primary)] font-semibold mb-2">
                          Fin de garantie
                        </label>
                        <input
                          type="date"
                          value={warrantyEnd}
                          onChange={(e) => setWarrantyEnd(e.target.value)}
                          className="w-full px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-green-500/50"
                        />
                      </div>
                    </div>

                    <div>
                       <label className="block text-[var(--text-primary)] font-semibold mb-2">Médias (Photos, Vidéos, Audio)</label>
                       
                       {/* Hidden Input */}
                       <input
                         type="file"
                         ref={fileInputRef}
                         className="hidden"
                         multiple
                         accept="image/*,video/*,audio/*"
                         onChange={handleFileUpload}
                       />

                       <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                          {/* Unified Add Button */}
                          <button 
                            onClick={() => {
                              setAddMediaModalOpen(true);
                            }}
                            className="flex-shrink-0 w-24 h-24 rounded-xl border border-dashed border-[var(--border-strong)] hover:border-white/40 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] flex flex-col items-center justify-center gap-2 transition-all group"
                            title="Ajouter un média"
                          >
                             <div className="w-8 h-8 rounded-full bg-[var(--bg-active)] flex items-center justify-center group-hover:scale-110 transition-transform">
                               <Plus className="w-4 h-4 text-[var(--text-muted)]" />
                             </div>
                             <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text-muted)]">Ajouter</span>
                          </button>

                          {/* Legacy Photos */}
                          {photos.map((photo, index) => (
                             <div key={`legacy-${index}`} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-[var(--border)] group bg-black">
                                <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute bottom-1 right-1">
                                  <ImageIcon className="w-3 h-3 text-[var(--text-muted)]" />
                                </div>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button 
                                     onClick={() => removePhoto(index)}
                                     className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                                     title="Supprimer"
                                  >
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                             </div>
                          ))}

                          {/* New Media Data */}
                          {mediaData.map((item, idx) => (
                             <div key={`media-${idx}`} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-[var(--border)] group bg-black">
                                {item.type === 'video' ? (
                                  <div className="w-full h-full flex items-center justify-center bg-[var(--bg-hover)]">
                                    <video src={item.preview} className="w-full h-full object-cover opacity-50" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <Play className="w-8 h-8 text-[var(--text-primary)] fill-white/20" />
                                    </div>
                                    <div className="absolute bottom-1 right-1">
                                      <Video className="w-3 h-3 text-[var(--text-muted)]" />
                                    </div>
                                  </div>
                                ) : item.type === 'audio' ? (
                                  <div className="w-full h-full flex items-center justify-center bg-[var(--bg-hover)]">
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                                      <Mic className="w-8 h-8 text-[var(--text-secondary)]" />
                                    </div>
                                    <div className="absolute bottom-1 right-1">
                                      <Mic className="w-3 h-3 text-[var(--text-muted)]" />
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <img src={item.preview} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-1 right-1">
                                      <ImageIcon className="w-3 h-3 text-[var(--text-muted)]" />
                                    </div>
                                  </>
                                )}
                                
                                {/* Overlay Actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button 
                                     onClick={() => {
                                       setCurrentMediaIndex(idx);
                                       setAnnotatorOpen(true);
                                     }}
                                     className="p-1.5 bg-[var(--bg-active)] hover:bg-[var(--bg-active)] rounded-lg text-[var(--text-primary)] transition-colors"
                                     title={item.type === 'video' ? "Voir" : item.type === 'audio' ? "Écouter" : "Voir et Annoter"}
                                  >
                                     {item.type === 'audio' ? <Mic className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                                  </button>
                                  <button 
                                     onClick={() => removeMedia(idx)}
                                     className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                                     title="Supprimer"
                                  >
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <DocumentManager 
                        documents={documents} 
                        onDocumentsChange={setDocuments} 
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[var(--text-primary)] font-semibold mb-2">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Informations complémentaires..."
                        className="w-full h-24 px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-green-500/50"
                      />
                    </div>

                    {/* Info Banner */}
                    <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-blue-400 text-sm font-medium">
                          QR Code automatique
                        </p>
                        <p className="text-[var(--text-muted)] text-xs mt-1">
                          Un QR Code unique sera généré pour cet équipement, facilitant les
                          interventions futures.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!isScanning && (
              <div className="p-6 border-t border-[var(--border)] flex items-center justify-between">
                <button
                  onClick={() => step > 1 && setStep(step - 1)}
                  disabled={step === 1}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                    step === 1
                      ? 'text-[var(--text-muted)] cursor-not-allowed'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]'
                  )}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Retour
                </button>

                {step < totalSteps ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    className={cn(
                      'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all',
                      canProceed()
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/25'
                        : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                    )}
                  >
                    Continuer
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !canProceed()}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-[var(--border-strong)] border-t-white rounded-full"
                        />
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Ajouter l'équipement
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

      {/* Media Selection Modal */}
      <AnimatePresence>
        {addMediaModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setAddMediaModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
              <button
                onClick={() => setAddMediaModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-[var(--bg-active)] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>

              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 text-center">
                Ajouter un média
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setCaptureMode('PHOTO');
                    setCaptureModalOpen(true);
                    setAddMediaModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Photo</span>
                </button>

                <button
                  onClick={() => {
                    setCaptureMode('VIDEO');
                    setCaptureModalOpen(true);
                    setAddMediaModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Vidéo</span>
                </button>

                <button
                  onClick={() => {
                    setCaptureMode('AUDIO');
                    setCaptureModalOpen(true);
                    setAddMediaModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Audio</span>
                </button>

                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setAddMediaModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Importer</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Media Capture Modal */}
      <MediaCaptureModal
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        onCapture={handleCapture}
        initialMode={captureMode}
      />

      {/* Document Viewer (Annotator) */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={annotatorOpen}
        onClose={() => {
          setAnnotatorOpen(false);
          setCurrentMediaIndex(null);
        }}
        onSave={handleSaveDocument}
        readonly={false}
      />
    </>
  );
}
