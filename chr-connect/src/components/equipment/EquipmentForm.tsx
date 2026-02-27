'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Upload,
  MapPin,
  Calendar,
  Tag,
  Zap,
  QrCode,
  RotateCcw,
  Check,
  ChevronDown,
  Trash2,
  Info,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { generateQRCodeUrl } from '@/lib/ai-service.mock';
import { DocumentManager } from './DocumentManager';
import type {
  Equipment,
  EquipmentCategory,
  EquipmentFormData,
  EquipmentPhoto,
  EquipmentDocument,
} from '@/types/equipment';
import { EQUIPMENT_CATEGORIES_DETAILS } from '@/constants/equipment';

// ============================================================================
// TYPES
// ============================================================================

interface EquipmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<EquipmentFormData>;
  initialImage?: string;
  editingEquipment?: Equipment;
  venueId: string;
  ownerId: string;
}

// ============================================================================
// PHOTO UPLOADER SUB-COMPONENT
// ============================================================================

interface PhotoUploaderProps {
  photos: EquipmentPhoto[];
  onAdd: (photos: EquipmentPhoto[]) => void;
  onRemove: (photoId: string) => void;
  maxPhotos?: number;
}

function PhotoUploader({ photos, onAdd, onRemove, maxPhotos = 5 }: PhotoUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos: EquipmentPhoto[] = [];
    Array.from(files).forEach((file, index) => {
      if (photos.length + newPhotos.length >= maxPhotos) return;
      const url = URL.createObjectURL(file);
      newPhotos.push({
        id: `ph_${Date.now()}_${index}`,
        url,
        type: index === 0 && photos.length === 0 ? 'OVERVIEW' : 'OVERVIEW',
        uploadedAt: new Date().toISOString(),
        caption: file.name,
      });
    });

    if (newPhotos.length > 0) {
      onAdd(newPhotos);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm text-[var(--text-muted)]">Photos de l&apos;équipement</label>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-xl overflow-hidden bg-[var(--bg-hover)] group"
          >
            <img
              src={photo.url}
              alt={photo.caption || 'Equipment photo'}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemove(photo.id)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4 text-[var(--text-primary)]" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <span className="text-xs text-[var(--text-secondary)]">{photo.type}</span>
            </div>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="aspect-square rounded-xl border-2 border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors">
            <Upload className="w-6 h-6 text-[var(--text-muted)] mb-2" />
            <span className="text-xs text-[var(--text-muted)]">Ajouter</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EquipmentForm({
  isOpen,
  onClose,
  initialData,
  initialImage,
  editingEquipment,
  venueId,
  ownerId,
}: EquipmentFormProps) {
  const { addEquipment, updateEquipment, equipment, restoreEquipment } = useEquipmentStore();

  // Form state
  const [category, setCategory] = useState<EquipmentCategory>(
    initialData?.category || editingEquipment?.category || 'FRIDGE'
  );
  const [brand, setBrand] = useState(
    initialData?.brand || editingEquipment?.brand || ''
  );
  const [model, setModel] = useState(
    initialData?.model || editingEquipment?.model || ''
  );
  const [serialNumber, setSerialNumber] = useState(
    initialData?.serialNumber || editingEquipment?.serialNumber || ''
  );
  const [nickname, setNickname] = useState(
    editingEquipment?.nickname || ''
  );

  // Duplicate detection
  const [duplicateMatch, setDuplicateMatch] = useState<Equipment | null>(null);

  // Reset/Sync state when opening or changing equipment
  useEffect(() => {
    if (isOpen) {
      // Reset submission state
      setIsSubmitting(false);
      
      if (editingEquipment) {
        // Edit mode: Sync with existing data
        setCategory(editingEquipment.category);
        setBrand(editingEquipment.brand);
        setModel(editingEquipment.model);
        setSerialNumber(editingEquipment.serialNumber || '');
        setNickname(editingEquipment.nickname || '');
        setLocation(editingEquipment.location);
        setVoltage(editingEquipment.specifications?.voltage || '');
        setPower(editingEquipment.specifications?.power || '');
        setInstallationDate(editingEquipment.installationDate || '');
        setPurchaseDate(editingEquipment.purchaseDate || '');
        setWarrantyExpiry(editingEquipment.warrantyExpiry || '');
        setPhotos(editingEquipment.photos || []);
        setDocuments(editingEquipment.documents || []);
        setQrPreviewUrl(editingEquipment.qrCodeUrl || null);
        setShowQRCode(false);
      } else {
        // Create mode: Reset to defaults (or initialData if provided)
        // Only reset if we are not already in the middle of filling the form (optional optimization, but safer to reset on open)
        setCategory(initialData?.category || 'FRIDGE');
        setBrand(initialData?.brand || '');
        setModel(initialData?.model || '');
        setSerialNumber(initialData?.serialNumber || '');
        setNickname('');
        setLocation(initialData?.location || '');
        setVoltage(initialData?.specifications?.voltage || '');
        setPower(initialData?.specifications?.power || '');
        setInstallationDate('');
        setPurchaseDate('');
        setWarrantyExpiry('');
        
        // Handle initial image separately in its own effect, but we can clear here
        if (!initialImage) {
            setPhotos([]);
        }
        
        setDocuments([]);
        setQrPreviewUrl(null);
        setShowQRCode(false);
      }
    }
  }, [isOpen, editingEquipment, initialData]);

  useEffect(() => {
    if (editingEquipment) {
      setDuplicateMatch(null);
      return;
    }

    if (!brand && !model && !serialNumber && !nickname) {
      setDuplicateMatch(null);
      return;
    }

    const match = equipment.find(eq => 
      eq.isDeleted && 
      eq.venueId === venueId &&
      (
        (brand && model && eq.brand.toLowerCase() === brand.toLowerCase().trim() && eq.model.toLowerCase() === model.toLowerCase().trim()) ||
        (serialNumber && eq.serialNumber && eq.serialNumber.toLowerCase() === serialNumber.toLowerCase().trim()) ||
        (nickname && eq.nickname && eq.nickname.toLowerCase() === nickname.toLowerCase().trim())
      )
    );

    setDuplicateMatch(match || null);
  }, [brand, model, serialNumber, nickname, equipment, venueId, editingEquipment]);

  const [location, setLocation] = useState(
    initialData?.location || editingEquipment?.location || ''
  );
  const [voltage, setVoltage] = useState(
    initialData?.specifications?.voltage || editingEquipment?.specifications?.voltage || ''
  );
  const [power, setPower] = useState(
    initialData?.specifications?.power || editingEquipment?.specifications?.power || ''
  );
  const [installationDate, setInstallationDate] = useState(
    editingEquipment?.installationDate || ''
  );
  const [purchaseDate, setPurchaseDate] = useState(
    editingEquipment?.purchaseDate || ''
  );
  const [warrantyExpiry, setWarrantyExpiry] = useState(
    editingEquipment?.warrantyExpiry || ''
  );

  // Photos state
  const [photos, setPhotos] = useState<EquipmentPhoto[]>(
    editingEquipment?.photos || []
  );

  // Documents state
  const [documents, setDocuments] = useState<EquipmentDocument[]>(
    editingEquipment?.documents || []
  );

  // QR Code preview
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(
    editingEquipment?.qrCodeUrl || null
  );

  // UI state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  // Initialize with OCR image if provided
  useEffect(() => {
    if (initialImage && !editingEquipment) {
      const photo: EquipmentPhoto = {
        id: `ph_initial_${Date.now()}`,
        url: initialImage,
        type: 'NAMEPLATE',
        uploadedAt: new Date().toISOString(),
        caption: 'Photo plaque signalétique',
      };
      setPhotos([photo]);
    }
  }, [initialImage, editingEquipment]);

  // Update initial data when it changes (from OCR)
  useEffect(() => {
    if (initialData) {
      if (initialData.category) setCategory(initialData.category);
      if (initialData.brand) setBrand(initialData.brand);
      if (initialData.model) setModel(initialData.model);
      if (initialData.serialNumber) setSerialNumber(initialData.serialNumber);
      if (initialData.specifications?.voltage) setVoltage(initialData.specifications.voltage);
      if (initialData.specifications?.power) setPower(initialData.specifications.power);
    }
  }, [initialData]);

  // Handle photo operations
  const handleAddPhotos = (newPhotos: EquipmentPhoto[]) => {
    setPhotos((prev) => [...prev, ...newPhotos]);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Validate form
  const isValid = brand.trim() && model.trim() && location.trim();

  // Handle submit
  const handleSubmit = async () => {
    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const equipmentData = {
        venueId,
        ownerId,
        category,
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim() || undefined,
        nickname: nickname.trim() || undefined,
        location: location.trim(),
        specifications: {
          voltage: voltage.trim() || undefined,
          power: power.trim() || undefined,
        },
        installationDate: installationDate || undefined,
        purchaseDate: purchaseDate || undefined,
        warrantyExpiry: warrantyExpiry || undefined,
        photos,
        documents,
        status: 'OPERATIONAL' as const,
        createdBy: ownerId,
      };

      if (editingEquipment) {
        // Update existing
        updateEquipment(editingEquipment.id, equipmentData);
      } else {
        // Create new
        const newEquipment = addEquipment(equipmentData);
        setQrPreviewUrl(newEquipment.qrCodeUrl || generateQRCodeUrl(newEquipment.id));
        setShowQRCode(true);
        return; // Don't close yet, show QR code
      }

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Categories for dropdown
  // const categories = Object.entries(EQUIPMENT_CATEGORY_LABELS) as [EquipmentCategory, string][];

  // Common locations
  const commonLocations = [
    'Cuisine Principale',
    'Bar',
    'Plonge',
    'Cave',
    'Réserve',
    'Salle',
    'Terrasse',
    'Bureau',
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-3xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                {editingEquipment ? 'Modifier l\'équipement' : 'Nouvel équipement'}
              </h2>
              <p className="text-[var(--text-muted)] text-sm mt-1">
                {editingEquipment
                  ? 'Mettez à jour les informations'
                  : 'Complétez les informations de la machine'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>

          {/* QR Code Success View */}
          {showQRCode && qrPreviewUrl && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-[var(--text-primary)] text-xl font-semibold mb-2">
                Équipement enregistré !
              </h3>
              <p className="text-[var(--text-muted)] text-center mb-8">
                Imprimez ce QR code et collez-le sur la machine pour un accès rapide
              </p>

              <div className="bg-white p-4 rounded-2xl mb-6">
                <img
                  src={qrPreviewUrl}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>

              <p className="text-[var(--text-muted)] text-sm text-center mb-8">
                Scannez ce code pour accéder directement à la fiche de cet équipement
              </p>

              <button
                onClick={onClose}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium"
              >
                Terminé
              </button>
            </div>
          )}

          {/* Form Content */}
          {!showQRCode && (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Duplicate Warning */}
                {duplicateMatch && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-start gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[var(--text-primary)] font-medium mb-1">
                        Équipement similaire trouvé dans la corbeille
                      </h3>
                      <p className="text-[var(--text-muted)] text-sm mb-3">
                        Un équipement correspondant à <strong>{duplicateMatch.brand} {duplicateMatch.model}</strong> a été supprimé le {duplicateMatch.deletedAt ? new Date(duplicateMatch.deletedAt).toLocaleDateString('fr-FR') : 'récemment'}.
                        Souhaitez-vous le restaurer plutôt que d'en créer un nouveau ?
                      </p>
                      <button
                        onClick={() => {
                          restoreEquipment(duplicateMatch.id);
                          onClose();
                        }}
                        className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Restaurer l'équipement
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Photo Uploader */}
                <PhotoUploader
                  photos={photos}
                  onAdd={handleAddPhotos}
                  onRemove={handleRemovePhoto}
                />

                {/* Category Selector */}
                <div className="relative">
                  <label className="text-sm text-[var(--text-muted)] mb-2 block">
                    Type d&apos;équipement *
                  </label>
                  <button
                    onClick={() => !editingEquipment && setShowCategoryDropdown(!showCategoryDropdown)}
                    disabled={!!editingEquipment}
                    className={cn(
                      "w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl flex items-center justify-between text-left transition-colors",
                      !editingEquipment && "hover:bg-[var(--bg-active)]",
                      editingEquipment && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <span className="text-[var(--text-primary)] flex items-center gap-3">
                      {/* Show icon if available */}
                      {(() => {
                        const cat = EQUIPMENT_CATEGORIES_DETAILS.find(c => c.id === category);
                        if (cat?.iconComponent) {
                          const Icon = cat.iconComponent;
                          return <Icon className="w-5 h-5 text-blue-400" />;
                        }
                        return null;
                      })()}
                      {EQUIPMENT_CATEGORIES_DETAILS.find(c => c.id === category)?.label || category}
                    </span>
                    {!editingEquipment && (
                      <ChevronDown
                        className={cn(
                          'w-5 h-5 text-[var(--text-muted)] transition-transform',
                          showCategoryDropdown && 'rotate-180'
                        )}
                      />
                    )}
                  </button>

                  {editingEquipment && (
                    <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Le type d&apos;équipement ne peut pas être modifié
                    </p>
                  )}

                  <AnimatePresence>
                    {showCategoryDropdown && !editingEquipment && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xl"
                      >
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {EQUIPMENT_CATEGORIES_DETAILS.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setCategory(cat.id);
                                setShowCategoryDropdown(false);
                              }}
                              className={cn(
                                'w-full p-3 text-left hover:bg-[var(--bg-hover)] flex items-center gap-3 transition-colors',
                                category === cat.id && 'bg-blue-500/20'
                              )}
                            >
                              <cat.iconComponent className="w-5 h-5 text-[var(--text-muted)]" />
                              <span className="text-[var(--text-primary)]">{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Brand & Model */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-[var(--text-muted)] mb-2 block">
                      Marque *
                    </label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      disabled={!!editingEquipment}
                      placeholder="ex: Hoshizaki"
                      className={cn(
                        "w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50",
                        editingEquipment && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[var(--text-muted)] mb-2 block">
                      Modèle *
                    </label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      disabled={!!editingEquipment}
                      placeholder="ex: IM-240"
                      className={cn(
                        "w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50",
                        editingEquipment && "opacity-50 cursor-not-allowed"
                      )}
                    />
                  </div>
                </div>
                {editingEquipment && (
                  <p className="text-xs text-[var(--text-muted)] -mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Identifiants verrouillés pour préserver l&apos;historique
                  </p>
                )}

                {/* Serial Number */}
                <div>
                  <label className="text-sm text-[var(--text-muted)] mb-2 block">
                    N° de Série
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    disabled={!!editingEquipment}
                    placeholder="ex: L098765"
                    className={cn(
                      "w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] font-mono placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50",
                      editingEquipment && "opacity-50 cursor-not-allowed"
                    )}
                  />
                </div>

                {/* Nickname */}
                <div>
                  <label className="text-sm text-[var(--text-muted)] mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Surnom (optionnel)
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="ex: Frigo Bar Principal"
                    className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="text-sm text-[var(--text-muted)] mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Emplacement *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="ex: Cuisine Principale"
                    className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {commonLocations.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className={cn(
                          'px-3 py-1.5 text-xs rounded-full transition-colors',
                          location === loc
                            ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                            : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-active)]'
                        )}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Technical Specs */}
                <div>
                  <label className="text-sm text-[var(--text-muted)] mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Spécifications techniques
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={voltage}
                        onChange={(e) => setVoltage(e.target.value)}
                        placeholder="Tension (ex: 230V)"
                        className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={power}
                        onChange={(e) => setPower(e.target.value)}
                        placeholder="Puissance (ex: 2.5kW)"
                        className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <label className="text-sm text-[var(--text-muted)] mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Dates importantes
                  </label>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-[var(--text-muted)] block mb-1">
                        Date d&apos;installation
                      </span>
                      <input
                        type="date"
                        value={installationDate}
                        onChange={(e) => setInstallationDate(e.target.value)}
                        className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-[var(--text-muted)] block mb-1">
                          Date d&apos;achat
                        </span>
                        <input
                          type="date"
                          value={purchaseDate}
                          onChange={(e) => setPurchaseDate(e.target.value)}
                          className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-[var(--text-muted)] block mb-1">
                          Fin de garantie
                        </span>
                        <input
                          type="date"
                          value={warrantyExpiry}
                          onChange={(e) => setWarrantyExpiry(e.target.value)}
                          className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <DocumentManager 
                    documents={documents} 
                    onDocumentsChange={setDocuments}
                  />
                </div>

                {/* QR Code Info */}
                {!editingEquipment && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
                    <QrCode className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="text-blue-300 text-sm font-medium">
                        QR Code HorecaLink
                      </p>
                      <p className="text-blue-300/70 text-xs mt-1">
                        Un QR code unique sera généré pour cet équipement. Vous pourrez
                        l&apos;imprimer et le coller sur la machine pour un accès rapide.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-[var(--border)]">
                <button
                  onClick={handleSubmit}
                  disabled={!isValid || isSubmitting}
                  className={cn(
                    'w-full py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                    isValid && !isSubmitting
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-[var(--border-strong)] border-t-white rounded-full"
                      />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {editingEquipment ? 'Enregistrer les modifications' : 'Enregistrer l\'équipement'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
