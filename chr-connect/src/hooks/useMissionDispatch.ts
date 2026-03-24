'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { useMissionEngine } from '@/store/mission-engine';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useMissionDispatchStore } from '@/store/useMissionDispatchStore';
import { Mission } from '@/types/missions';
import { getMissionFlowType } from '@/lib/utils';

interface UseMissionDispatchOptions {
  authorizedCategories: string[];
  /** Only activate dispatch when on the MISSIONS view */
  enabled: boolean;
}

// Stable action accessors (never change between renders)
const getDispatchActions = () => useMissionDispatchStore.getState();

export function useMissionDispatch({ authorizedCategories, enabled }: UseMissionDispatchOptions) {
  const isOnAir = useStore((s) => s.isOnAir);
  const setIsOnAir = useStore((s) => s.setIsOnAir);
  const engineStatus = useMissionEngine((s) => s.status);
  const startMission = useMissionEngine((s) => s.startMission);
  const setFlowType = useMissionEngine((s) => s.setFlowType);
  const missions = useMissionsStore((s) => s.missions);
  const syncUpdateMission = useMissionsStore((s) => s.syncUpdateMission);

  // Subscribe to individual state slices (not the whole store)
  const dispatchStatus = useMissionDispatchStore((s) => s.status);
  const currentProposal = useMissionDispatchStore((s) => s.currentProposal);
  const countdown = useMissionDispatchStore((s) => s.countdown);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoriesRef = useRef(authorizedCategories);
  categoriesRef.current = authorizedCategories;

  // Clean up intervals
  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const clearSearchTimeout = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  // Build sorted queue from SEARCHING missions (uses ref for categories to avoid dep changes)
  const buildQueue = useCallback((): Mission[] => {
    const currentMissions = useMissionsStore.getState().missions;
    const cats = categoriesRef.current;
    // Only dispatch immediate missions (not scheduled/planned)
    const searching = currentMissions.filter(
      (m) => m.status === 'SEARCHING' && m.type && cats.includes(m.type) && !m.scheduled
    );

    return [...searching].sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      const scoreA = a.matchScore ?? 0;
      const scoreB = b.matchScore ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const distA = parseFloat(a.distance?.replace(/[^\d.]/g, '') ?? '999');
      const distB = parseFloat(b.distance?.replace(/[^\d.]/g, '') ?? '999');
      return distA - distB;
    });
  }, []);

  // Start dispatch cycle: SEARCHING phase
  const startSearching = useCallback(() => {
    const store = getDispatchActions();
    if (store.status === 'PROPOSING') return;

    store.setStatus('SEARCHING');
    const queue = buildQueue();
    store.setQueue(queue);

    clearSearchTimeout();
    searchTimeoutRef.current = setTimeout(() => {
      const s = getDispatchActions();
      if (s.status === 'SEARCHING') {
        if (s.queue.length === 0) {
          // Queue vide → relancer la recherche dans 5s
          searchTimeoutRef.current = setTimeout(() => {
            const s2 = getDispatchActions();
            if (s2.status === 'SEARCHING') {
              // Rebuild queue and retry
              const newQueue = buildQueue();
              s2.setQueue(newQueue);
              if (newQueue.length > 0) {
                s2.proposeNext();
              }
              // Si toujours vide, on reste en SEARCHING (le radar tourne)
            }
          }, 5000);
        } else {
          s.proposeNext();
        }
      }
    }, 2500);
  }, [buildQueue, clearSearchTimeout]);

  // Refuse current mission → go offline immediately (no penalty)
  const handleRefuse = useCallback(() => {
    clearCountdown();
    clearSearchTimeout();
    getDispatchActions().refuseProposal();
    setIsOnAir(false);
  }, [clearCountdown, clearSearchTimeout, setIsOnAir]);

  // Start countdown timer
  const handleRefuseRef = useRef(handleRefuse);
  handleRefuseRef.current = handleRefuse;

  const startCountdown = useCallback(() => {
    clearCountdown();
    countdownRef.current = setInterval(() => {
      const remaining = getDispatchActions().decrementCountdown();
      if (remaining <= 0) {
        clearCountdown();
        handleRefuseRef.current();
      }
    }, 1000);
  }, [clearCountdown]);

  // Accept current mission → goes to AWAITING_PATRON_CONFIRMATION + offline
  const handleAccept = useCallback(() => {
    const { currentProposal: proposal } = getDispatchActions();
    if (!proposal) return;

    clearCountdown();
    clearSearchTimeout();
    const flowType = getMissionFlowType(proposal);

    // Determine worker employment category
    // In a real app, this would come from the worker's profile.
    // For now: STAFF missions default to EXTRA, TECH to FREELANCE
    const employmentCategory: import('@/types/compliance').EmploymentCategory =
      flowType === 'STAFF' ? 'EXTRA' : 'FREELANCE';

    // Set dpaeStatus based on employment category
    const dpaeStatus: import('@/types/compliance').DPAEMissionStatus =
      employmentCategory === 'EXTRA' ? 'PENDING' : 'NOT_REQUIRED';

    // Store pending worker info on the mission for patron review
    syncUpdateMission(proposal.id, {
      status: 'AWAITING_PATRON_CONFIRMATION',
      dpaeStatus,
      pendingWorker: {
        id: 'worker-self',
        name: 'Vous',
        specialty: flowType === 'STAFF' ? 'Personnel / Extra' : 'Technicien',
        rating: 4.8,
        avatar: 'https://i.pravatar.cc/150?u=worker-self',
        completedMissions: 47,
        employmentCategory,
        reliabilityRate: 96,
        skills: flowType === 'STAFF'
          ? ['Service en salle', 'Cocktails', 'Anglais courant']
          : ['Froid commercial', 'Climatisation', 'Dépannage urgent'],
        distanceKm: 2.3,
        recentReviews: [
          { rating: 5, comment: 'Excellent travail, ponctuel et professionnel.', author: 'Le Comptoir', date: '2026-03-10' },
          { rating: 4, comment: 'Bonne prestation, je recommande.', author: 'Café Marly', date: '2026-03-05' },
          { rating: 5, comment: 'Très réactif, mission impeccable.', author: 'Brasserie du Marais', date: '2026-02-28' },
        ],
      },
    });
    startMission(proposal.id);
    setFlowType(flowType);

    // Set DPAE status on engine
    useMissionEngine.getState().setDpaeStatus(dpaeStatus);

    getDispatchActions().acceptProposal();

    // Go offline (worker is now busy with a mission)
    setIsOnAir(false);

    // Set engine to awaiting patron confirmation
    useMissionEngine.getState().setStatus('AWAITING_PATRON_CONFIRMATION');
  }, [clearCountdown, clearSearchTimeout, syncUpdateMission, startMission, setFlowType, setIsOnAir]);

  // Watch for PROPOSING state to start countdown
  useEffect(() => {
    if (dispatchStatus === 'PROPOSING' && currentProposal) {
      startCountdown();
    }
    return () => clearCountdown();
  }, [dispatchStatus, currentProposal, startCountdown, clearCountdown]);

  // Main trigger: isOnAir + engine IDLE + enabled (on MISSIONS view) → start/restart dispatch
  useEffect(() => {
    if (enabled && isOnAir && engineStatus === 'IDLE') {
      const s = getDispatchActions();
      if (s.status !== 'PROPOSING') {
        startSearching();
      }
    }
  }, [enabled, isOnAir, engineStatus, startSearching]);

  // When profile changes (authorizedCategories), force restart dispatch with new categories
  const categoriesKey = authorizedCategories.join(',');
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return; // Skip first mount — main trigger handles it
    }
    if (enabled && isOnAir && engineStatus === 'IDLE') {
      clearCountdown();
      clearSearchTimeout();
      getDispatchActions().reset();
      // Small delay so reset settles before restarting
      setTimeout(() => startSearching(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriesKey]);

  // When going offline, reset everything
  useEffect(() => {
    if (!isOnAir) {
      clearCountdown();
      clearSearchTimeout();
      getDispatchActions().reset();
    }
  }, [isOnAir, clearCountdown, clearSearchTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCountdown();
      clearSearchTimeout();
    };
  }, [clearCountdown, clearSearchTimeout]);

  return {
    dispatchStatus,
    currentProposal,
    countdown,
    handleAccept,
    handleRefuse,
    restartSearch: startSearching,
  };
}
