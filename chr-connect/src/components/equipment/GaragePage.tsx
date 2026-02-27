'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Camera,
  Keyboard,
  Refrigerator,
  Snowflake,
  Coffee,
  Flame,
  Droplets,
  Cog,
  ChevronLeft,
  List,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  QrCode,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { EquipmentCard, EquipmentCardSkeleton } from './EquipmentCard';
import { OCRScanner } from './OCRScanner';
import { EquipmentForm } from './EquipmentForm';
import { EquipmentDetailsModal } from './EquipmentDetailsModal';
import type {
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  EquipmentFormData,
} from '@/types/equipment';
import {
  EQUIPMENT_CATEGORY_LABELS,
  EQUIPMENT_STATUS_INFO,
} from '@/types/equipment';

// ============================================================================
// TYPES
// ============================================================================

interface GaragePageProps {
  venueId: string;
  ownerId: string;
  venueName?: string;
  onBack?: () => void;
}



// ============================================================================
// FILTER SECTION COMPONENT
// ============================================================================

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: EquipmentCategory | null;
  onCategoryChange: (category: EquipmentCategory | null) => void;
  selectedStatus: EquipmentStatus | null;
  onStatusChange: (status: EquipmentStatus | null) => void;
  showDeleted: boolean;
  onShowDeletedChange: (show: boolean) => void;
}

function FilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  showDeleted,
  onShowDeletedChange,
}: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const categories: { value: EquipmentCategory; label: string; icon: React.ElementType; color: string; selectedBg: string; selectedBorder: string }[] = [
    { value: 'FRIDGE', label: 'Froid', icon: Refrigerator, color: 'text-cyan-500', selectedBg: 'bg-cyan-500', selectedBorder: 'border-cyan-500' },
    { value: 'FREEZER', label: 'Congélation', icon: Snowflake, color: 'text-blue-500', selectedBg: 'bg-blue-500', selectedBorder: 'border-blue-500' },
    { value: 'COFFEE_MACHINE', label: 'Café', icon: Coffee, color: 'text-amber-500', selectedBg: 'bg-amber-500', selectedBorder: 'border-amber-500' },
    { value: 'OVEN', label: 'Cuisson', icon: Flame, color: 'text-orange-500', selectedBg: 'bg-orange-500', selectedBorder: 'border-orange-500' },
    { value: 'DISHWASHER', label: 'Lavage', icon: Droplets, color: 'text-emerald-500', selectedBg: 'bg-emerald-500', selectedBorder: 'border-emerald-500' },
    { value: 'OTHER', label: 'Autre', icon: Cog, color: 'text-gray-500', selectedBg: 'bg-gray-500', selectedBorder: 'border-gray-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un équipement..."
            className="w-full pl-12 pr-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text-secondary)]" />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'px-4 py-3 rounded-xl border transition-all flex items-center gap-2',
            showFilters
              ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-[var(--bg-hover)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]'
          )}
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Expandable Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-[var(--bg-hover)] rounded-xl border border-[var(--border)] space-y-4">
              {/* Category Filters */}
              <div>
                <p className="text-[var(--text-secondary)] text-sm mb-2">Type d&apos;équipement</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(({ value, label, icon: Icon, color, selectedBg, selectedBorder }) => (
                    <button
                      key={value}
                      onClick={() =>
                        onCategoryChange(selectedCategory === value ? null : value)
                      }
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border',
                        selectedCategory === value
                          ? `${selectedBg} text-white ${selectedBorder} shadow-lg`
                          : `bg-[var(--bg-card)] ${color} border-[var(--border)] hover:bg-[var(--bg-active)]`
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Filters */}
              <div>
                <p className="text-[var(--text-secondary)] text-sm mb-2">Autres filtres</p>
                <button
                  onClick={() => onShowDeletedChange(!showDeleted)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border',
                    showDeleted
                      ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30'
                      : 'bg-[var(--bg-card)] text-red-500 border-[var(--border)] hover:bg-[var(--bg-active)]'
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  Voir la corbeille
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// STATS BAR COMPONENT
// ============================================================================

interface StatsBarProps {
  equipment: Equipment[];
  selectedStatus: EquipmentStatus | null;
  onStatusClick: (status: EquipmentStatus | null) => void;
}

function StatsBar({ equipment, selectedStatus, onStatusClick }: StatsBarProps) {
  const stats = useMemo(() => {
    const total = equipment.length;
    const operational = equipment.filter((e) => e.status === 'OPERATIONAL').length;
    const warning = equipment.filter((e) => e.status === 'WARNING').length;
    const fault = equipment.filter((e) => e.status === 'FAULT').length;
    const maintenance = equipment.filter((e) => e.status === 'MAINTENANCE').length;

    return { total, operational, warning, fault, maintenance };
  }, [equipment]);

  const handleStatusClick = (status: EquipmentStatus) => {
    if (selectedStatus === status) {
      onStatusClick(null);
    } else {
      onStatusClick(status);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <button
        onClick={() => handleStatusClick('OPERATIONAL')}
        className={cn(
          "rounded-xl p-3 text-center transition-all border",
          selectedStatus === 'OPERATIONAL'
            ? "bg-green-500 border-green-500 shadow-lg shadow-green-500/30 text-white"
            : "bg-[var(--bg-card)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
        )}
      >
        <CheckCircle2 className={cn("w-5 h-5 mx-auto mb-1", selectedStatus === 'OPERATIONAL' ? "text-white" : "text-green-500")} />
        <p className={cn("text-2xl font-bold", selectedStatus === 'OPERATIONAL' ? "text-white" : "text-green-500")}>{stats.operational}</p>
        <p className={cn("text-xs font-medium", selectedStatus === 'OPERATIONAL' ? "text-white/80" : "text-green-500/70")}>Opérationnel</p>
      </button>

      <button
        onClick={() => handleStatusClick('WARNING')}
        className={cn(
          "rounded-xl p-3 text-center transition-all border",
          selectedStatus === 'WARNING'
            ? "bg-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/30 text-white"
            : "bg-[var(--bg-card)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
        )}
      >
        <Clock className={cn("w-5 h-5 mx-auto mb-1", selectedStatus === 'WARNING' ? "text-white" : "text-yellow-500")} />
        <p className={cn("text-2xl font-bold", selectedStatus === 'WARNING' ? "text-white" : "text-yellow-500")}>{stats.warning}</p>
        <p className={cn("text-xs font-medium", selectedStatus === 'WARNING' ? "text-white/80" : "text-yellow-500/70")}>Attention</p>
      </button>

      <button
        onClick={() => handleStatusClick('FAULT')}
        className={cn(
          "rounded-xl p-3 text-center transition-all border",
          selectedStatus === 'FAULT'
            ? "bg-red-500 border-red-500 shadow-lg shadow-red-500/30 text-white"
            : "bg-[var(--bg-card)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
        )}
      >
        <AlertCircle className={cn("w-5 h-5 mx-auto mb-1", selectedStatus === 'FAULT' ? "text-white" : "text-red-500")} />
        <p className={cn("text-2xl font-bold", selectedStatus === 'FAULT' ? "text-white" : "text-red-500")}>{stats.fault}</p>
        <p className={cn("text-xs font-medium", selectedStatus === 'FAULT' ? "text-white/80" : "text-red-500/70")}>En panne</p>
      </button>

      <button
        onClick={() => handleStatusClick('MAINTENANCE')}
        className={cn(
          "rounded-xl p-3 text-center transition-all border",
          selectedStatus === 'MAINTENANCE'
            ? "bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/30 text-white"
            : "bg-[var(--bg-card)] border-[var(--border)] hover:bg-[var(--bg-hover)]"
        )}
      >
        <Wrench className={cn("w-5 h-5 mx-auto mb-1", selectedStatus === 'MAINTENANCE' ? "text-white" : "text-blue-500")} />
        <p className={cn("text-2xl font-bold", selectedStatus === 'MAINTENANCE' ? "text-white" : "text-blue-500")}>{stats.maintenance}</p>
        <p className={cn("text-xs font-medium", selectedStatus === 'MAINTENANCE' ? "text-white/80" : "text-blue-500/70")}>Maintenance</p>
      </button>
    </div>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  onAddEquipment: () => void;
}

function EmptyState({ onAddEquipment }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6">
        <QrCode className="w-12 h-12 text-blue-400" />
      </div>
      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
        Aucun équipement enregistré
      </h3>
      <p className="text-[var(--text-secondary)] text-center mb-8 max-w-md">
        Ajoutez vos équipements pour créer leur jumeau numérique et faciliter les
        interventions de maintenance.
      </p>
      <button
        onClick={onAddEquipment}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium flex items-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Ajouter mon premier équipement
      </button>
    </div>
  );
}

// ============================================================================
// ADD EQUIPMENT MODAL
// ============================================================================

interface AddEquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanChoice: () => void;
  onManualChoice: () => void;
}

function AddEquipmentModal({
  isOpen,
  onClose,
  onScanChoice,
  onManualChoice,
}: AddEquipmentModalProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-end justify-center sm:items-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-3xl overflow-hidden w-full max-w-md"
      >
        <div className="p-6 text-center border-b border-[var(--border)]">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Ajouter un équipement
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Choisissez une méthode d&apos;ajout
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Scan Option */}
          <button
            onClick={onScanChoice}
            className="w-full p-5 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl text-left hover:from-blue-600/30 hover:to-purple-600/30 transition-colors group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Camera className="w-7 h-7 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-[var(--text-primary)] font-semibold text-lg mb-1">
                  Scanner la plaque
                </h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  Notre IA lit automatiquement les informations de la plaque
                  signalétique
                </p>
                <span className="inline-block mt-2 text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded-full">
                  Recommandé
                </span>
              </div>
            </div>
          </button>

          {/* Manual Option */}
          <button
            onClick={onManualChoice}
            className="w-full p-5 bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl text-left hover:bg-[var(--bg-active)] transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-active)] flex items-center justify-center">
                <Keyboard className="w-7 h-7 text-[var(--text-secondary)]" />
              </div>
              <div className="flex-1">
                <h3 className="text-[var(--text-primary)] font-semibold text-lg mb-1">
                  Saisie manuelle
                </h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  Entrez les informations de l&apos;équipement à la main
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Annuler
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GaragePage({ venueId, ownerId, venueName, onBack }: GaragePageProps) {
  const {
    equipment,
    filters,
    setFilters,
    getFilteredEquipment,
    selectEquipment,
    selectedEquipmentId,
    restoreEquipment,
    deleteEquipment,
  } = useEquipmentStore();

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state from OCR
  const [ocrFormData, setOcrFormData] = useState<Partial<EquipmentFormData> | null>(null);
  const [ocrImage, setOcrImage] = useState<string | undefined>(undefined);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>(undefined);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EquipmentCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<EquipmentStatus | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Filter equipment for this venue
  const venueEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      if (eq.venueId !== venueId) return false;
      // If showing deleted, only show deleted items. Otherwise only show active items.
      return showDeleted ? !!eq.isDeleted : !eq.isDeleted;
    });
  }, [equipment, venueId, showDeleted]);

  // Apply local filters
  const filteredEquipment = useMemo(() => {
    return venueEquipment.filter((eq) => {
      // Search filter
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const searchableText = `${eq.brand} ${eq.model} ${eq.nickname || ''} ${eq.location} ${eq.serialNumber || ''}`.toLowerCase();
        if (!searchableText.includes(search)) return false;
      }

      // Category filter
      if (selectedCategory && eq.category !== selectedCategory) return false;

      // Status filter
      if (selectedStatus && eq.status !== selectedStatus) return false;

      return true;
    });
  }, [venueEquipment, searchQuery, selectedCategory, selectedStatus]);

  // Selected equipment for details modal
  const selectedEquipment = useMemo(() => {
    if (!selectedEquipmentId) return null;
    return equipment.find((eq) => eq.id === selectedEquipmentId);
  }, [equipment, selectedEquipmentId]);

  // Handlers
  const handleAddClick = () => setShowAddModal(true);

  const handleScanChoice = () => {
    setShowAddModal(false);
    setShowScanner(true);
  };

  const handleManualChoice = () => {
    setShowAddModal(false);
    setOcrFormData(null);
    setOcrImage(undefined);
    setShowForm(true);
  };

  const handleScanComplete = (data: Partial<EquipmentFormData>, image?: string) => {
    setOcrFormData(data);
    setOcrImage(image);
    setShowScanner(false);
    setShowForm(true);
  };

  const handleEquipmentClick = (eq: Equipment) => {
    selectEquipment(eq.id);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    selectEquipment(null);
  };

  const handleEdit = () => {
    if (selectedEquipment) {
      setEditingEquipment(selectedEquipment);
      setShowDetails(false);
      setShowForm(true);
    }
  };

  const handleRestore = () => {
    if (selectedEquipment) {
      restoreEquipment(selectedEquipment.id);
      setShowDetails(false);
    }
  };

  const handleDelete = () => {
    if (selectedEquipment) {
      deleteEquipment(selectedEquipment.id);
      setShowDetails(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 md:gap-4 mb-4 md:mb-8 p-4 md:p-0">
        <div className="text-center md:text-left w-full md:w-auto">
          <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">Mes Équipements</h2>
          <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">Gérez et suivez tous vos équipements</p>
        </div>

        <button
          onClick={handleAddClick}
          className="hidden md:flex bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold items-center gap-2 transition-colors shadow-lg shadow-blue-900/20 shrink-0 h-[42px]"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {venueEquipment.length === 0 ? (
          <EmptyState onAddEquipment={handleAddClick} />
        ) : (
          <>
            {/* Stats Bar */}
            {venueEquipment.length > 0 && (
              <div className="mb-6">
                <StatsBar
                  equipment={venueEquipment}
                  selectedStatus={selectedStatus}
                  onStatusClick={setSelectedStatus}
                />
              </div>
            )}

            {/* Filter Bar */}
            <div className="mb-6">
              <FilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                showDeleted={showDeleted}
                onShowDeletedChange={setShowDeleted}
              />
            </div>

            {/* Results count */}
            <p className="text-[var(--text-muted)] text-sm mb-4">
              {filteredEquipment.length} équipement{filteredEquipment.length > 1 ? 's' : ''}{' '}
              {(searchQuery || selectedCategory || selectedStatus) && 'trouvé(s)'}
              {showDeleted && ' (Corbeille)'}
            </p>

            {/* Equipment Grid/List */}
            {filteredEquipment.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[var(--text-secondary)]">
                  Aucun équipement ne correspond à vos critères
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedStatus(null);
                  }}
                  className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredEquipment.map((eq) => (
                    <motion.div
                      key={eq.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <EquipmentCard
                        equipment={eq}
                        onClick={() => handleEquipmentClick(eq)}
                        compact
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Action Button (mobile) */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleAddClick}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center lg:hidden"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddEquipmentModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onScanChoice={handleScanChoice}
            onManualChoice={handleManualChoice}
          />
        )}
      </AnimatePresence>

      <OCRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanComplete={handleScanComplete}
        onManualEntry={handleManualChoice}
      />

      <EquipmentForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setOcrFormData(null);
          setOcrImage(undefined);
          setEditingEquipment(undefined);
        }}
        initialData={ocrFormData || undefined}
        initialImage={ocrImage}
        editingEquipment={editingEquipment}
        venueId={venueId}
        ownerId={ownerId}
      />

      {selectedEquipment && (
        <EquipmentDetailsModal
          isOpen={showDetails}
          onClose={handleCloseDetails}
          equipment={selectedEquipment}
          onEdit={handleEdit}
          onRestore={handleRestore}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
