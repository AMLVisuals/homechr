'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useVenuesStore } from '@/store/useVenuesStore';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import type { Venue } from '@/types/venue';
import type { Equipment } from '@/types/equipment';
import type { Mission } from '@/types/missions';

// ============================================================================
// TYPES
// ============================================================================

interface EstablishmentContextValue {
  // Current establishment
  currentEstablishment: Venue | null;
  setCurrentEstablishmentId: (id: string) => void;

  // Establishment data
  establishments: Venue[];

  // Equipment for current establishment
  equipment: Equipment[];
  equipmentByStatus: {
    operational: Equipment[];
    warning: Equipment[];
    fault: Equipment[];
    maintenance: Equipment[];
  };

  // Missions for current establishment
  missions: Mission[];
  activeMissions: Mission[];
  pendingMissions: Mission[];
  completedMissions: Mission[];

  // Stats
  stats: {
    totalEquipment: number;
    equipmentInFault: number;
    activeMissionsCount: number;
    pendingMissionsCount: number;
  };

  // Loading state
  isLoading: boolean;
}

// ============================================================================
// CONTEXT
// ============================================================================

const EstablishmentContext = createContext<EstablishmentContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function EstablishmentProvider({ children }: { children: React.ReactNode }) {
  const { venues, activeVenueId, setActiveVenue } = useVenuesStore();
  const { equipment: allEquipment, getEquipmentByVenue } = useEquipmentStore();
  const { missions: allMissions } = useMissionsStore();

  const [isLoading, setIsLoading] = useState(false);

  // Current establishment
  const currentEstablishment = useMemo(() => {
    if (!activeVenueId) return null;
    return venues.find(v => v.id === activeVenueId) || null;
  }, [venues, activeVenueId]);

  // Set current establishment
  const setCurrentEstablishmentId = useCallback((id: string) => {
    setIsLoading(true);
    setActiveVenue(id);
    // Simulate loading for smooth transition
    setTimeout(() => setIsLoading(false), 300);
  }, [setActiveVenue]);

  // Equipment for current establishment
  const equipment = useMemo(() => {
    if (!activeVenueId) return [];
    return getEquipmentByVenue(activeVenueId);
  }, [activeVenueId, getEquipmentByVenue, allEquipment]);

  // Equipment grouped by status
  const equipmentByStatus = useMemo(() => ({
    operational: equipment.filter(e => e.status === 'OPERATIONAL'),
    warning: equipment.filter(e => e.status === 'WARNING'),
    fault: equipment.filter(e => e.status === 'FAULT'),
    maintenance: equipment.filter(e => e.status === 'MAINTENANCE'),
  }), [equipment]);

  // Missions for current establishment
  const missions = useMemo(() => {
    if (!activeVenueId) return [];
    return allMissions.filter(m => m.venueId === activeVenueId);
  }, [activeVenueId, allMissions]);

  // Missions grouped by status
  const activeMissions = useMemo(() =>
    missions.filter(m => ['ON_WAY', 'ON_SITE', 'IN_PROGRESS'].includes(m.status)),
  [missions]);

  const pendingMissions = useMemo(() =>
    missions.filter(m => ['SEARCHING', 'SCHEDULED'].includes(m.status)),
  [missions]);

  const completedMissions = useMemo(() =>
    missions.filter(m => m.status === 'COMPLETED'),
  [missions]);

  // Stats
  const stats = useMemo(() => ({
    totalEquipment: equipment.length,
    equipmentInFault: equipmentByStatus.fault.length,
    activeMissionsCount: activeMissions.length,
    pendingMissionsCount: pendingMissions.length,
  }), [equipment.length, equipmentByStatus.fault.length, activeMissions.length, pendingMissions.length]);

  const value: EstablishmentContextValue = {
    currentEstablishment,
    setCurrentEstablishmentId,
    establishments: venues,
    equipment,
    equipmentByStatus,
    missions,
    activeMissions,
    pendingMissions,
    completedMissions,
    stats,
    isLoading,
  };

  return (
    <EstablishmentContext.Provider value={value}>
      {children}
    </EstablishmentContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useEstablishment() {
  const context = useContext(EstablishmentContext);
  if (!context) {
    throw new Error('useEstablishment must be used within an EstablishmentProvider');
  }
  return context;
}

// ============================================================================
// SELECTOR HOOKS (for optimized re-renders)
// ============================================================================

export function useCurrentEstablishment() {
  const { currentEstablishment } = useEstablishment();
  return currentEstablishment;
}

export function useEstablishmentEquipment() {
  const { equipment, equipmentByStatus } = useEstablishment();
  return { equipment, equipmentByStatus };
}

export function useEstablishmentMissions() {
  const { missions, activeMissions, pendingMissions, completedMissions } = useEstablishment();
  return { missions, activeMissions, pendingMissions, completedMissions };
}

export function useEstablishmentStats() {
  const { stats } = useEstablishment();
  return stats;
}
