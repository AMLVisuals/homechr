'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Star,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  ChevronRight,
  Plus,
  QrCode,
  Calendar,
  Zap,
  Settings,
  Bell,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { EstablishmentSelector } from './EstablishmentSelector';
import { EquipmentCard } from '../equipment/EquipmentCard';
import { EquipmentDetailsModal } from '../equipment/EquipmentDetailsModal';
import { FloatingActionButton } from './FloatingActionButton';
import { ReportIssueModal } from './ReportIssueModal';
import { RequestStaffModal } from './RequestStaffModal';
import { ScheduleMaintenanceModal } from './ScheduleMaintenanceModal';
import { AddEquipmentModal } from './AddEquipmentModal';
import type { Equipment, EquipmentCategory } from '@/types/equipment';
import { EQUIPMENT_STATUS_INFO, EQUIPMENT_CATEGORY_LABELS } from '@/types/equipment';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'grid' | 'list';
type GarageFilter = 'all' | 'operational' | 'warning' | 'fault';
type GarageCategoryFilter = 'ALL' | 'KITCHEN' | 'BAR' | 'TECH' | 'OTHER';

const CATEGORY_GROUPS: Record<GarageCategoryFilter, EquipmentCategory[]> = {
  ALL: [],
  KITCHEN: ['FRIDGE', 'FREEZER', 'COLD_ROOM', 'OVEN', 'DISHWASHER', 'VENTILATION', 'COOKING'],
  BAR: ['COFFEE_MACHINE', 'ICE_MACHINE', 'BEER_TAP'],
  TECH: ['AUDIO', 'LIGHTING', 'VIDEO', 'POS', 'NETWORK', 'SCREEN'],
  OTHER: ['OTHER'],
};

const CATEGORY_LABELS: Record<GarageCategoryFilter, string> = {
  ALL: 'Tout',
  KITCHEN: 'Cuisine',
  BAR: 'Bar',
  TECH: 'Tech',
  OTHER: 'Autre',
};

// ============================================================================
// STATS CARD
// ============================================================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  color: string;
}

function StatCard({ icon, label, value, trend, color }: StatCardProps) {
  return (
    <div className="bg-[var(--bg-hover)] backdrop-blur-sm rounded-2xl p-4 border border-[var(--border)]">
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trend.isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)] mt-3">{value}</p>
      <p className="text-[var(--text-muted)] text-sm">{label}</p>
    </div>
  );
}

// ============================================================================
// ACTIVE MISSION CARD
// ============================================================================

interface ActiveMissionCardProps {
  mission: {
    id: string;
    title: string;
    status: string;
    providerName?: string;
    eta?: number;
  };
  onClick: () => void;
}

function ActiveMissionCard({ mission, onClick }: ActiveMissionCardProps) {
  const statusConfig = {
    SEARCHING: { label: 'Recherche...', color: 'bg-yellow-500', animate: true },
    ON_WAY: { label: 'En route', color: 'bg-blue-500', animate: true },
    ON_SITE: { label: 'Sur place', color: 'bg-green-500', animate: false },
    IN_PROGRESS: { label: 'En cours', color: 'bg-purple-500', animate: true },
  }[mission.status] || { label: mission.status, color: 'bg-gray-500', animate: false };

  return (
    <button
      onClick={onClick}
      className="w-full p-4 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-xl border border-[var(--border)] text-left transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={cn('w-3 h-3 rounded-full', statusConfig.color)} />
            {statusConfig.animate && (
              <div className={cn('absolute inset-0 rounded-full animate-ping', statusConfig.color, 'opacity-50')} />
            )}
          </div>
          <div>
            <p className="text-[var(--text-primary)] font-medium">{mission.title}</p>
            <p className="text-[var(--text-muted)] text-sm">
              {mission.providerName || 'Recherche en cours...'}
              {mission.eta && ` • ETA ${mission.eta} min`}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-muted)] transition-colors" />
      </div>
      <div className="mt-2">
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          statusConfig.color.replace('bg-', 'bg-') + '/20',
          statusConfig.color.replace('bg-', 'text-').replace('-500', '-400')
        )}>
          {statusConfig.label}
        </span>
      </div>
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EstablishmentDashboard() {
  const {
    currentEstablishment,
    equipment,
    equipmentByStatus,
    activeMissions,
    pendingMissions,
    stats,
    isLoading,
  } = useEstablishment();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [garageFilter, setGarageFilter] = useState<GarageFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<GarageCategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [showEquipmentDetails, setShowEquipmentDetails] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [showRequestStaff, setShowRequestStaff] = useState(false);
  const [showScheduleMaintenance, setShowScheduleMaintenance] = useState(false);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [equipmentForIssue, setEquipmentForIssue] = useState<Equipment | null>(null);

  // Filtered equipment
  const filteredEquipment = equipment.filter(eq => {
    // Filter by status
    if (garageFilter !== 'all') {
      const statusMap: Record<GarageFilter, string> = {
        all: '',
        operational: 'OPERATIONAL',
        warning: 'WARNING',
        fault: 'FAULT',
      };
      if (eq.status !== statusMap[garageFilter]) return false;
    }

    // Filter by category
    if (categoryFilter !== 'ALL') {
      const allowedCategories = CATEGORY_GROUPS[categoryFilter];
      if (!allowedCategories.includes(eq.category)) return false;
    }

    // Filter by search
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      const matchesBrand = eq.brand.toLowerCase().includes(search);
      const matchesModel = eq.model.toLowerCase().includes(search);
      const matchesNickname = eq.nickname?.toLowerCase().includes(search);
      const matchesLocation = eq.location.toLowerCase().includes(search);
      if (!matchesBrand && !matchesModel && !matchesNickname && !matchesLocation) return false;
    }

    return true;
  });

  // Handlers
  const handleEquipmentClick = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setShowEquipmentDetails(true);
  };

  const handleReportIssue = (eq?: Equipment) => {
    setEquipmentForIssue(eq || null);
    setShowReportIssue(true);
  };

  const handleRequestStaff = () => {
    setShowRequestStaff(true);
  };

  const handleScheduleMaintenance = () => {
    setShowScheduleMaintenance(true);
  };

  const handleAddEquipment = () => {
    setShowAddEquipment(true);
  };

  const handleFloatingAction = (action: string) => {
    switch (action) {
      case 'REPORT_EQUIPMENT_ISSUE':
        handleReportIssue();
        break;
      case 'REQUEST_STAFF':
        handleRequestStaff();
        break;
      case 'SCHEDULE_MAINTENANCE':
        handleScheduleMaintenance();
        break;
      case 'ADD_EQUIPMENT':
        handleAddEquipment();
        break;
    }
  };

  // No establishment selected
  if (!currentEstablishment) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-10 h-10 text-[var(--text-muted)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Sélectionnez un établissement
          </h2>
          <p className="text-[var(--text-muted)] mb-6">
            Choisissez un établissement pour voir son garage et ses missions.
          </p>
          <EstablishmentSelector />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <EstablishmentSelector />
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-colors">
              <Bell className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
            <button className="p-2 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] transition-colors">
              <Settings className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="w-8 h-8 border-2 border-[var(--border-strong)] border-t-blue-500 rounded-full animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key={currentEstablishment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Establishment Info */}
              <div className="flex items-start gap-4">
                {currentEstablishment.photoUrl ? (
                  <img
                    src={currentEstablishment.photoUrl}
                    alt={currentEstablishment.name}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-[var(--text-muted)]" />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">{currentEstablishment.name}</h1>
                  <p className="text-[var(--text-muted)] flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    {currentEstablishment.address}, {currentEstablishment.city}
                  </p>
                  {currentEstablishment.rating && (
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-[var(--text-primary)] font-medium">{currentEstablishment.rating}</span>
                      <span className="text-[var(--text-muted)] text-sm">
                        ({currentEstablishment.reviewCount} avis)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<Wrench className="w-5 h-5 text-blue-400" />}
                  label="Équipements"
                  value={stats.totalEquipment}
                  color="bg-blue-500/20"
                />
                <StatCard
                  icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
                  label="En panne"
                  value={stats.equipmentInFault}
                  color="bg-red-500/20"
                />
                <StatCard
                  icon={<Clock className="w-5 h-5 text-orange-400" />}
                  label="Missions actives"
                  value={stats.activeMissionsCount}
                  color="bg-orange-500/20"
                />
                <StatCard
                  icon={<Zap className="w-5 h-5 text-purple-400" />}
                  label="En attente"
                  value={stats.pendingMissionsCount}
                  color="bg-purple-500/20"
                />
              </div>

              {/* Active Missions */}
              {(activeMissions.length > 0 || pendingMissions.length > 0) && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      Missions en cours
                    </h2>
                    <button className="text-blue-400 text-sm hover:underline">
                      Voir tout
                    </button>
                  </div>
                  <div className="space-y-3">
                    {[...activeMissions, ...pendingMissions].slice(0, 3).map((mission) => (
                      <ActiveMissionCard
                        key={mission.id}
                        mission={{
                          id: mission.id,
                          title: mission.title,
                          status: mission.status,
                          providerName: mission.expert || mission.provider?.name,
                          eta: mission.eta,
                        }}
                        onClick={() => {/* Open mission details */}}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Garage Section */}
              <section>
                <div className="sticky top-[71px] z-40 bg-[var(--bg-app)] backdrop-blur-xl pt-4 pb-2 -mx-6 px-6 mb-4 border-b border-[var(--border)] shadow-lg shadow-black/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-green-400" />
                      Mon Garage
                    </h2>
                    <div className="flex items-center gap-2">
                      {/* Search */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-2 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 w-48"
                        />
                      </div>

                      {/* View Toggle */}
                      <div className="flex bg-[var(--bg-hover)] rounded-lg p-1">
                        <button
                          onClick={() => setViewMode('grid')}
                          className={cn(
                            'p-1.5 rounded-md transition-colors',
                            viewMode === 'grid' ? 'bg-[var(--bg-active)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                          )}
                        >
                          <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('list')}
                          className={cn(
                            'p-1.5 rounded-md transition-colors',
                            viewMode === 'list' ? 'bg-[var(--bg-active)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                          )}
                        >
                          <List className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                    {(Object.keys(CATEGORY_LABELS) as GarageCategoryFilter[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setCategoryFilter(filter)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                          categoryFilter === filter
                            ? 'bg-blue-500 text-white'
                            : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-active)]'
                        )}
                      >
                        {CATEGORY_LABELS[filter]}
                      </button>
                    ))}
                  </div>

                  {/* Status Filter Pills */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {[
                      { id: 'all', label: 'Tous', count: equipment.length },
                      { id: 'operational', label: 'Opérationnels', count: equipmentByStatus.operational.length, color: 'green' },
                      { id: 'warning', label: 'Attention', count: equipmentByStatus.warning.length, color: 'yellow' },
                      { id: 'fault', label: 'En panne', count: equipmentByStatus.fault.length, color: 'red' },
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setGarageFilter(filter.id as GarageFilter)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
                          garageFilter === filter.id
                            ? 'bg-[var(--bg-active)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-hover)] text-[var(--text-muted)] hover:bg-[var(--bg-active)]'
                        )}
                      >
                        {filter.color && (
                          <span className={cn(
                            'w-2 h-2 rounded-full',
                            filter.color === 'green' && 'bg-green-500',
                            filter.color === 'yellow' && 'bg-yellow-500',
                            filter.color === 'red' && 'bg-red-500'
                          )} />
                        )}
                        {filter.label}
                        <span className="text-[var(--text-muted)]">({filter.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment Grid */}
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-12 bg-[var(--bg-hover)] rounded-2xl border border-[var(--border)]">
                    <Wrench className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <p className="text-[var(--text-muted)]">Aucun équipement trouvé</p>
                    <p className="text-[var(--text-muted)] text-sm mt-1">
                      {searchQuery ? 'Essayez une autre recherche' : 'Ajoutez votre premier équipement'}
                    </p>
                  </div>
                ) : (
                  <div className={cn(
                    viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                      : 'space-y-3'
                  )}>
                    {filteredEquipment.map((eq) => (
                      <EquipmentCard
                        key={eq.id}
                        equipment={eq}
                        onClick={() => handleEquipmentClick(eq)}
                        compact={viewMode === 'list'}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Bottom Spacer for FAB */}
              <div className="h-24" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onAction={handleFloatingAction} />

      {/* Modals */}
      {selectedEquipment && (
        <EquipmentDetailsModal
          isOpen={showEquipmentDetails}
          onClose={() => {
            setShowEquipmentDetails(false);
            setSelectedEquipment(null);
          }}
          equipment={selectedEquipment}
        />
      )}

      <ReportIssueModal
        isOpen={showReportIssue}
        onClose={() => {
          setShowReportIssue(false);
          setEquipmentForIssue(null);
        }}
        preselectedEquipment={equipmentForIssue}
      />

      <RequestStaffModal
        isOpen={showRequestStaff}
        onClose={() => setShowRequestStaff(false)}
      />

      <ScheduleMaintenanceModal
        isOpen={showScheduleMaintenance}
        onClose={() => setShowScheduleMaintenance(false)}
      />

      <AddEquipmentModal
        isOpen={showAddEquipment}
        onClose={() => setShowAddEquipment(false)}
      />
    </div>
  );
}
