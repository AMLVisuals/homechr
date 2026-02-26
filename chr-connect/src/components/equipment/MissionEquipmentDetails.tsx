'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Phone,
  Navigation,
  FileText,
  Download,
  Calendar,
  Zap,
  Shield,
  History,
  ChevronRight,
  Star,
  Wrench,
  Clock,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Image,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import type { Equipment, MaintenanceRecord } from '@/types/equipment';
import { Mission } from '@/types/missions';
import {
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_STATUS_INFO,
} from '@/types/equipment';

// ============================================================================
// TYPES
// ============================================================================

interface MissionEquipmentDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentId: string;
  mission?: Mission;
  onAcceptMission?: () => void;
  onOpenWaze?: () => void;
  onCallRestaurant?: () => void;
}

// ============================================================================
// IMAGE GALLERY
// ============================================================================

interface ImageGalleryProps {
  images: string[];
}

function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center">
        <Image className="w-12 h-12 text-white/20" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-xl overflow-hidden bg-white/5">
        <img
          src={images[activeIndex]}
          alt="Equipment"
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={cn(
                'w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors',
                activeIndex === idx
                  ? 'border-blue-500'
                  : 'border-transparent hover:border-white/30'
              )}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MissionEquipmentDetails({
  isOpen,
  onClose,
  equipmentId,
  mission,
  onAcceptMission,
  onOpenWaze,
  onCallRestaurant,
}: MissionEquipmentDetailsProps) {
  const { getEquipmentById, getEquipmentHistory } = useEquipmentStore();
  const [copiedSerial, setCopiedSerial] = useState(false);

  const equipment = getEquipmentById(equipmentId);
  const history = getEquipmentHistory(equipmentId);

  // Get image URLs
  const images = useMemo(() => {
    if (!equipment) return [];
    return equipment.photos.map((p) => p.url);
  }, [equipment]);

  // Copy serial number
  const copySerial = () => {
    if (equipment?.serialNumber) {
      navigator.clipboard.writeText(equipment.serialNumber);
      setCopiedSerial(true);
      setTimeout(() => setCopiedSerial(false), 2000);
    }
  };

  if (!isOpen || !equipment) return null;

  const statusInfo = EQUIPMENT_STATUS_INFO[equipment.status];
  const displayName = equipment.nickname || `${equipment.brand} ${equipment.model}`;

  // Mock documents for demo
  const mockDocuments = [
    { type: 'manual', name: 'Manuel utilisateur', size: '2.4 MB' },
    { type: 'parts', name: 'Vue éclatée', size: '1.8 MB' },
    { type: 'service', name: 'Guide de maintenance', size: '956 KB' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    statusInfo.bgColor,
                    statusInfo.color
                  )}
                >
                  {statusInfo.label}
                </span>
                {mission?.urgent ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                    URGENT
                  </span>
                ) : null}
              </div>
              <h2 className="text-xl font-semibold text-white">{displayName}</h2>
              <p className="text-white/50 text-sm">
                {EQUIPMENT_CATEGORY_LABELS[equipment.category]} • {equipment.location}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Photo Gallery */}
            <ImageGallery images={images} />

            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/50 text-sm mb-1">Marque / Modèle</p>
                <p className="text-white font-medium">
                  {equipment.brand} {equipment.model}
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-white/50 text-sm mb-1">Emplacement</p>
                <p className="text-white font-medium">{equipment.location}</p>
              </div>
            </div>

            {/* Serial Number */}
            {equipment.serialNumber ? (
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/50 text-sm mb-1">Numéro de série</p>
                    <p className="text-white font-mono">{equipment.serialNumber}</p>
                  </div>
                  <button
                    onClick={copySerial}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    {copiedSerial ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Technical Specs */}
            {equipment.specifications && Object.keys(equipment.specifications).length > 0 ? (
              <div>
                <h4 className="text-white/60 text-sm font-medium mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Spécifications techniques
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {equipment.specifications.voltage ? (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                      <p className="text-blue-300/70 text-xs">Tension</p>
                      <p className="text-blue-300 font-medium">
                        {equipment.specifications.voltage}
                      </p>
                    </div>
                  ) : null}
                  {equipment.specifications.power ? (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                      <p className="text-blue-300/70 text-xs">Puissance</p>
                      <p className="text-blue-300 font-medium">
                        {equipment.specifications.power}
                      </p>
                    </div>
                  ) : null}
                  {equipment.specifications.gasType ? (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                      <p className="text-blue-300/70 text-xs">Gaz frigorigène</p>
                      <p className="text-blue-300 font-medium">
                        {equipment.specifications.gasType}
                      </p>
                    </div>
                  ) : null}
                  {equipment.specifications.capacity ? (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                      <p className="text-blue-300/70 text-xs">Capacité</p>
                      <p className="text-blue-300 font-medium">
                        {equipment.specifications.capacity}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Maintenance History */}
            {history.length > 0 && (
              <div>
                <h4 className="text-white/60 text-sm font-medium mb-3 flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Historique des interventions
                </h4>
                <div className="space-y-3">
                  {history.slice(0, 3).map((record) => (
                    <div
                      key={record.id}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center',
                              record.type === 'REPAIR'
                                ? 'bg-red-500/20'
                                : 'bg-blue-500/20'
                            )}
                          >
                            <Wrench
                              className={cn(
                                'w-4 h-4',
                                record.type === 'REPAIR'
                                  ? 'text-red-400'
                                  : 'text-blue-400'
                              )}
                            />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {record.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-white/50 text-xs">
                                {new Date(record.date).toLocaleDateString('fr-FR')}
                              </span>
                              {record.technicianName && (
                                <>
                                  <span className="text-white/30">•</span>
                                  <span className="text-white/50 text-xs">
                                    {record.technicianName}
                                  </span>
                                </>
                              )}
                              {record.technicianRating && (
                                <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
                                  <Star className="w-3 h-3 fill-current" />
                                  {record.technicianRating}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {record.resolution && (
                        <p className="text-white/60 text-sm mt-2 pl-11">
                          {record.resolution}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentation */}
            <div>
              <h4 className="text-white/60 text-sm font-medium mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documentation technique
              </h4>
              <div className="space-y-2">
                {mockDocuments.map((doc, idx) => (
                  <button
                    key={idx}
                    className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-white/40" />
                      <div className="text-left">
                        <p className="text-white text-sm">{doc.name}</p>
                        <p className="text-white/40 text-xs">{doc.size}</p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* Current Problem (if fault) */}
            {equipment.status === 'FAULT' && equipment.metadata?.lastFault ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 font-medium">Problème signalé</p>
                    <p className="text-red-300/70 text-sm mt-1">
                      {equipment.metadata.lastFault}
                    </p>
                    {equipment.metadata.faultReportedAt ? (
                      <p className="text-red-300/50 text-xs mt-2">
                        Signalé le{' '}
                        {new Date(equipment.metadata.faultReportedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/10 space-y-3">
            {/* Quick Actions Row */}
            <div className="flex gap-3">
              {onOpenWaze && (
                <button
                  onClick={onOpenWaze}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Navigation className="w-4 h-4" />
                  Ouvrir Waze
                </button>
              )}
              {onCallRestaurant && (
                <button
                  onClick={onCallRestaurant}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Appeler
                </button>
              )}
            </div>

            {/* Accept Mission Button */}
            {onAcceptMission && (
              <button
                onClick={onAcceptMission}
                className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
                Accepter la mission
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
