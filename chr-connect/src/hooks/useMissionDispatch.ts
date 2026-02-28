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
  const updateMission = useMissionsStore((s) => s.updateMission);

  // Subscribe to individual state slices (not the whole store)
  const dispatchStatus = useMissionDispatchStore((s) => s.status);
  const currentProposal = useMissionDispatchStore((s) => s.currentProposal);
  const countdown = useMissionDispatchStore((s) => s.countdown);
  const consecutiveRefusals = useMissionDispatchStore((s) => s.consecutiveRefusals);
  const showWarning = useMissionDispatchStore((s) => s.showWarning);
  const suspendedUntil = useMissionDispatchStore((s) => s.suspendedUntil);

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
    const searching = currentMissions.filter(
      (m) => m.status === 'SEARCHING' && m.type && cats.includes(m.type)
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
    if (store.status === 'SUSPENDED' && store.checkSuspension()) return;
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

  // Refuse current mission
  const handleRefuse = useCallback(() => {
    clearCountdown();

    const { shouldSuspend } = getDispatchActions().refuseProposal();

    if (shouldSuspend) {
      getDispatchActions().suspend();
      setIsOnAir(false);
      return;
    }

    // Cooldown 2s before next proposal
    setTimeout(() => {
      const s = getDispatchActions();
      if (s.status === 'COOLDOWN') {
        s.proposeNext();
      }
    }, 2000);
  }, [clearCountdown, setIsOnAir]);

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

  // Accept current mission → goes to AWAITING_PATRON_CONFIRMATION
  const handleAccept = useCallback(() => {
    const { currentProposal: proposal } = getDispatchActions();
    if (!proposal) return;

    clearCountdown();
    const flowType = getMissionFlowType(proposal);

    // Store pending worker info on the mission for patron review
    updateMission(proposal.id, {
      status: 'AWAITING_PATRON_CONFIRMATION',
      pendingWorker: {
        id: 'worker-self',
        name: 'Vous',
        specialty: flowType === 'STAFF' ? 'Personnel / Extra' : 'Technicien',
        rating: 4.8,
        avatar: 'https://i.pravatar.cc/150?u=worker-self',
        completedMissions: 47,
      },
    });
    startMission(proposal.id);
    setFlowType(flowType);
    getDispatchActions().acceptProposal();

    // Set engine to awaiting patron confirmation
    useMissionEngine.getState().setStatus('AWAITING_PATRON_CONFIRMATION');
  }, [clearCountdown, updateMission, startMission, setFlowType]);

  // Watch for PROPOSING state to start countdown
  useEffect(() => {
    if (dispatchStatus === 'PROPOSING' && currentProposal) {
      startCountdown();
    }
    return () => clearCountdown();
  }, [dispatchStatus, currentProposal, startCountdown, clearCountdown]);

  // Main trigger: isOnAir + engine IDLE + enabled (on MISSIONS view) → start/restart dispatch
  // Also handles remount after navigation (old timeout was cleared by unmount cleanup)
  useEffect(() => {
    if (enabled && isOnAir && engineStatus === 'IDLE') {
      const s = getDispatchActions();
      // Start if IDLE, or restart if stuck in SEARCHING/COOLDOWN (stale from previous mount)
      if (s.status !== 'PROPOSING' && s.status !== 'SUSPENDED') {
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

  const dismissWarning = useCallback(() => {
    getDispatchActions().dismissWarning();
  }, []);

  return {
    dispatchStatus,
    currentProposal,
    countdown,
    consecutiveRefusals,
    showWarning,
    suspendedUntil,
    handleAccept,
    handleRefuse,
    dismissWarning,
    restartSearch: startSearching,
  };
}
