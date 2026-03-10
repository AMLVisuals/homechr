'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  QrCode,
  Edit2,
  Calendar,
  MapPin,
  Zap,
  Shield,
  FileText,
  Download,
  Printer,
  History,
  Wrench,
  AlertCircle,
  Star,
  Copy,
  Check,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { DocumentManager } from './DocumentManager';
import type { Equipment, MaintenanceRecord } from '@/types/equipment';
import {
  EQUIPMENT_STATUS_INFO,
} from '@/types/equipment';
import { EQUIPMENT_CATEGORIES_DETAILS } from '@/constants/equipment';
import { FaultDeclarationModal } from './FaultDeclarationModal';

// ============================================================================
// TYPES
// ============================================================================

interface EquipmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  onEdit?: () => void;
  onRestore?: () => void;
  onDelete?: () => void;
}

type TabType = 'overview' | 'history' | 'documents';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EquipmentDetailsModal({
  isOpen,
  onClose,
  equipment,
  onEdit,
  onRestore,
  onDelete,
}: EquipmentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showFaultModal, setShowFaultModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const { getEquipmentHistory } = useEquipmentStore();
  const history = getEquipmentHistory(equipment.id);

  const statusInfo = EQUIPMENT_STATUS_INFO[equipment.status];
  const displayName = equipment.nickname || `${equipment.brand} ${equipment.model}`;

  // Check warranty status
  const warrantyStatus = useMemo(() => {
    if (!equipment.warrantyExpiry) return null;
    const expiry = new Date(equipment.warrantyExpiry);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate progress if start date is available
    let progress = 0;
    const startDateStr = equipment.purchaseDate || equipment.installationDate || equipment.createdAt;
    if (startDateStr) {
      const start = new Date(startDateStr);
      const totalDuration = expiry.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();

      if (totalDuration > 0) {
        // Calculate remaining percentage instead of elapsed
        // New (0 elapsed) -> 100% remaining
        // Expired (elapsed >= total) -> 0% remaining
        const elapsedPercentage = (elapsed / totalDuration) * 100;
        progress = Math.max(0, Math.min(100, 100 - elapsedPercentage));
      } else {
        progress = 0; // Invalid duration or immediate expiry
      }
    }

    if (daysUntilExpiry < 0) return { status: 'expired', days: Math.abs(daysUntilExpiry), progress: 0 };
    if (daysUntilExpiry < 90) return { status: 'expiring_soon', days: daysUntilExpiry, progress };
    return { status: 'active', days: daysUntilExpiry, progress };
  }, [equipment.warrantyExpiry, equipment.purchaseDate, equipment.installationDate, equipment.createdAt]);

  // Copy serial number
  const copySerial = () => {
    if (equipment.serialNumber) {
      navigator.clipboard.writeText(equipment.serialNumber);
      setCopiedSerial(true);
      setTimeout(() => setCopiedSerial(false), 2000);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-md"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[640px] md:max-h-[80vh] md:rounded-3xl bg-[var(--bg-sidebar)] border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col"
        >
          {/* Fixed Header with close button */}
          <div className="absolute top-4 right-4 z-20">
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-primary)]" />
            </button>
          </div>

          {/* Scrollable Content - Everything scrolls together */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Hero Image */}
            <div className="relative">
              <div className="aspect-[16/10] bg-gradient-to-br from-white/5 to-transparent">
                {equipment.photos.length > 0 ? (
                  <img
                    src={equipment.photos[0].url}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    <Wrench className="w-20 h-20 text-[var(--text-muted)]" />
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div
                className={cn(
                  'absolute top-4 left-4 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-md text-white',
                  equipment.status === 'OPERATIONAL' ? 'bg-green-500' :
                  equipment.status === 'WARNING' ? 'bg-yellow-500' :
                  equipment.status === 'FAULT' ? 'bg-red-500' :
                  'bg-blue-500'
                )}
              >
                {statusInfo.label}
              </div>

              {/* QR Code Button */}
              <button
                onClick={() => setShowQRCode(true)}
                className="absolute bottom-4 right-4 px-3 py-2 rounded-xl bg-black/50 backdrop-blur-md flex items-center gap-2 hover:bg-black/70 transition-colors"
              >
                <QrCode className="w-4 h-4 text-[var(--text-primary)]" />
                <span className="text-[var(--text-primary)] text-sm">QR Code</span>
              </button>
            </div>

            {/* Title Section */}
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{displayName}</h2>
              <p className="text-[var(--text-muted)] mt-1">
                {EQUIPMENT_CATEGORIES_DETAILS.find(c => c.id === equipment.category)?.label || equipment.category} - {equipment.brand} {equipment.model}
              </p>
            </div>

            {/* Tabs */}
            <div className="px-6 border-b border-[var(--border)] sticky top-0 bg-[var(--bg-sidebar)] z-10">
              <div className="flex gap-6">
                {[
                  { id: 'overview', label: 'Apercu' },
                  { id: 'history', label: 'Historique' },
                  { id: 'documents', label: 'Documents' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={cn(
                      'py-4 text-sm font-medium border-b-2 -mb-px transition-colors',
                      activeTab === tab.id
                        ? 'border-blue-500 text-[var(--text-primary)]'
                        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Status Banner */}
                  {equipment.status === 'FAULT' && (
                    <div className="bg-red-500 rounded-xl p-4 flex items-start gap-3 shadow-lg">
                      <AlertCircle className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white font-bold">Equipement en panne</p>
                        <p className="text-white/80 text-sm mt-1">
                          {equipment.metadata?.lastFault || 'Probleme signale'}
                        </p>
                        {equipment.metadata?.faultReportedAt && (
                          <p className="text-white/60 text-xs mt-2">
                            Signale le {new Date(equipment.metadata.faultReportedAt).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {equipment.status === 'WARNING' && (
                    <div className="bg-yellow-500 rounded-xl p-4 flex items-start gap-3 shadow-lg">
                      <AlertTriangle className="w-6 h-6 text-white flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white font-bold">Maintenance recommandee</p>
                        <p className="text-white/80 text-sm mt-1">
                          {equipment.metadata?.warningReason || 'Verification preventive conseillee'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Main Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                      <p className="text-[var(--text-muted)] text-sm mb-1">Marque</p>
                      <p className="text-[var(--text-primary)] font-medium text-lg">{equipment.brand}</p>
                    </div>
                    <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                      <p className="text-[var(--text-muted)] text-sm mb-1">Modele</p>
                      <p className="text-[var(--text-primary)] font-medium text-lg">{equipment.model}</p>
                    </div>
                  </div>

                  {/* Serial Number */}
                  {equipment.serialNumber && (
                    <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[var(--text-muted)] text-sm mb-1">Numero de serie</p>
                          <p className="text-[var(--text-primary)] font-mono text-lg">{equipment.serialNumber}</p>
                        </div>
                        <button
                          onClick={copySerial}
                          className="p-2 rounded-lg bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-colors"
                        >
                          {copiedSerial ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <Copy className="w-5 h-5 text-[var(--text-muted)]" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Location */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-[var(--text-muted)] text-sm">Emplacement</p>
                        <p className="text-[var(--text-primary)] font-medium">{equipment.location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Technical Specs */}
                  {equipment.specifications && (
                    equipment.specifications.voltage ||
                    equipment.specifications.power ||
                    equipment.specifications.capacity ||
                    equipment.specifications.gasType
                  ) && (
                    <div>
                      <h4 className="text-[var(--text-muted)] text-sm font-medium mb-3 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Specifications techniques
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {equipment.specifications.voltage && (
                          <div className="bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--border)]">
                            <p className="text-[var(--text-muted)] text-xs">Tension</p>
                            <p className="text-[var(--text-primary)] font-medium">{equipment.specifications.voltage}</p>
                          </div>
                        )}
                        {equipment.specifications.power && (
                          <div className="bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--border)]">
                            <p className="text-[var(--text-muted)] text-xs">Puissance</p>
                            <p className="text-[var(--text-primary)] font-medium">{equipment.specifications.power}</p>
                          </div>
                        )}
                        {equipment.specifications.capacity && (
                          <div className="bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--border)]">
                            <p className="text-[var(--text-muted)] text-xs">Capacite</p>
                            <p className="text-[var(--text-primary)] font-medium">{equipment.specifications.capacity}</p>
                          </div>
                        )}
                        {equipment.specifications.gasType && (
                          <div className="bg-[var(--bg-hover)] rounded-xl p-3 border border-[var(--border)]">
                            <p className="text-[var(--text-muted)] text-xs">Gaz frigorigene</p>
                            <p className="text-[var(--text-primary)] font-medium">{equipment.specifications.gasType}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  {(equipment.installationDate || equipment.lastServiceDate || equipment.nextServiceDue) && (
                    <div>
                      <h4 className="text-[var(--text-muted)] text-sm font-medium mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Dates importantes
                      </h4>
                      <div className="space-y-3">
                        {equipment.installationDate && (
                          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                            <span className="text-[var(--text-muted)]">Installation</span>
                            <span className="text-[var(--text-primary)]">
                              {new Date(equipment.installationDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                        {equipment.lastServiceDate && (
                          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                            <span className="text-[var(--text-muted)]">Derniere maintenance</span>
                            <span className="text-[var(--text-primary)]">
                              {new Date(equipment.lastServiceDate).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                        {equipment.nextServiceDue && (
                          <div className="flex items-center justify-between py-2 border-b border-[var(--border)]">
                            <span className="text-[var(--text-muted)]">Prochaine maintenance</span>
                            <span className="text-blue-400 font-medium">
                              {new Date(equipment.nextServiceDue).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Warranty Status */}
                  {warrantyStatus && (
                    <div
                      className={cn(
                        'rounded-xl p-4 flex flex-col gap-3 shadow-md text-white',
                        warrantyStatus.status === 'active'
                          ? 'bg-green-500'
                          : warrantyStatus.status === 'expiring_soon'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 flex-shrink-0 mt-1 text-white" />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-bold text-white">
                                {warrantyStatus.status === 'active'
                                  ? 'Sous garantie'
                                  : warrantyStatus.status === 'expiring_soon'
                                    ? 'Garantie expire bientot'
                                    : 'Garantie expiree'}
                              </p>
                              <p className="text-white/80 text-sm">
                                {warrantyStatus.status === 'expired'
                                  ? `Expiree depuis ${warrantyStatus.days} jours`
                                  : `${warrantyStatus.days} jours restants`}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-white/70 text-xs">Fin de garantie</p>
                              <p className="text-white text-sm font-mono">
                                {new Date(equipment.warrantyExpiry!).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden mb-1">
                            <div
                              className="h-full rounded-full transition-all duration-1000 ease-out bg-white"
                              style={{ width: `${warrantyStatus.progress}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-white/70">
                            <span>
                              {equipment.purchaseDate || equipment.installationDate
                                ? new Date(equipment.purchaseDate || equipment.installationDate!).toLocaleDateString('fr-FR')
                                : 'Date d\'achat'}
                            </span>
                            <span>
                              {Math.round(warrantyStatus.progress)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Report Fault Button */}
                  {equipment.status !== 'FAULT' && !equipment.isDeleted && (
                    <button
                      onClick={() => setShowFaultModal(true)}
                      className="w-full py-4 px-6 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-500/30"
                    >
                      <AlertTriangle className="w-5 h-5" />
                      Declarer une panne
                    </button>
                  )}
                </div>
              )}

              {/* HISTORY TAB */}
              {activeTab === 'history' && (
                <div>
                  {history.length === 0 ? (
                    <div className="text-center py-12">
                      <History className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                      <p className="text-[var(--text-muted)]">Aucun historique de maintenance</p>
                      <p className="text-[var(--text-muted)] text-sm mt-2">
                        Les interventions apparaitront ici
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((record) => (
                        <div
                          key={record.id}
                          className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  'w-10 h-10 rounded-lg flex items-center justify-center shadow-md',
                                  record.type === 'REPAIR'
                                    ? 'bg-red-500'
                                    : record.type === 'PREVENTIVE'
                                      ? 'bg-blue-500'
                                      : 'bg-green-500'
                                )}
                              >
                                <Wrench className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-[var(--text-primary)] font-medium">{record.description}</p>
                                <p className="text-[var(--text-muted)] text-sm">
                                  {new Date(record.date).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                            <span
                              className={cn(
                                'text-xs font-bold px-2 py-1 rounded-full text-white',
                                record.type === 'REPAIR'
                                  ? 'bg-red-500'
                                  : record.type === 'PREVENTIVE'
                                    ? 'bg-blue-500'
                                    : 'bg-green-500'
                              )}
                            >
                              {record.type === 'REPAIR'
                                ? 'Reparation'
                                : record.type === 'PREVENTIVE'
                                  ? 'Preventive'
                                  : 'Installation'}
                            </span>
                          </div>

                          {record.resolution && (
                            <p className="text-[var(--text-muted)] text-sm mb-3">{record.resolution}</p>
                          )}

                          {record.technicianName && (
                            <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                              <div className="flex items-center gap-2">
                                <span className="text-[var(--text-muted)] text-sm">{record.technicianName}</span>
                                {record.technicianRating && (
                                  <span className="flex items-center gap-1 text-yellow-400 text-sm">
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    {record.technicianRating}
                                  </span>
                                )}
                              </div>
                              {record.cost && (
                                <span className="text-[var(--text-primary)] font-medium">{record.cost}€</span>
                              )}
                            </div>
                          )}

                          {record.partsReplaced && record.partsReplaced.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[var(--border)]">
                              <p className="text-[var(--text-muted)] text-xs mb-2">Pieces remplacees</p>
                              <div className="flex flex-wrap gap-2">
                                {record.partsReplaced.map((part, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-[var(--bg-hover)] rounded text-xs text-[var(--text-muted)]"
                                  >
                                    {part}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="bg-blue-500 rounded-xl p-4 flex items-start gap-3 shadow-md">
                    <FileText className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium text-sm">
                        Documentation technique pour {equipment.brand} {equipment.model}
                      </p>
                    </div>
                  </div>

                  <DocumentManager
                    documents={equipment.documents || []}
                    onDocumentsChange={() => {}}
                    readonly
                  />
                </div>
              )}
            </div>

            {/* Spacer for fixed footer */}
            <div className="h-24" />
          </div>

          {/* Fixed Footer Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--bg-sidebar)] via-[var(--bg-sidebar)] to-transparent pt-8">
            <div className="flex gap-3">
              {equipment.isDeleted ? (
                onRestore && (
                  <button
                    onClick={onRestore}
                    className="w-full py-3 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-500/30"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restaurer l'equipement
                  </button>
                )
              ) : (
                <>
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="flex-1 py-3 px-6 bg-[var(--bg-active)] hover:bg-[var(--bg-active)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </button>
                  )}
                  <button
                    onClick={() => setShowQRCode(true)}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer QR Code
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0 shadow-md"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center mb-4 shadow-md">
                <Trash2 className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                Supprimer cet equipement ?
              </h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">
                L'equipement sera deplace vers la corbeille. Vous pourrez le restaurer plus tard si besoin.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-primary)] rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onDelete?.();
                    setShowDeleteConfirm(false);
                  }}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRCode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setShowQRCode(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-sm w-full text-center"
            >
              <h3 className="text-gray-900 text-xl font-semibold mb-2">
                QR Code HorecaLink
              </h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">
                Collez ce QR code sur votre equipement pour un acces rapide
              </p>

              {equipment.qrCodeUrl ? (
                <img
                  src={equipment.qrCodeUrl}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto mb-6"
                />
              ) : (
                <div className="w-48 h-48 mx-auto mb-6 bg-gray-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-[var(--text-secondary)]" />
                </div>
              )}

              <p className="text-[var(--text-secondary)] text-xs mb-6">
                {displayName} - {equipment.serialNumber || 'N/A'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowQRCode(false)}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium"
                >
                  Fermer
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fault Declaration Modal */}
      <FaultDeclarationModal
        isOpen={showFaultModal}
        onClose={() => setShowFaultModal(false)}
        equipment={equipment}
        onSuccess={() => {
          setShowFaultModal(false);
          onClose();
        }}
      />
    </>,
    document.body
  );
}
