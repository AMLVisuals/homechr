import { create } from 'zustand';
import { Mission } from '@/types/missions';

export type DispatchStatus = 'IDLE' | 'SEARCHING' | 'PROPOSING' | 'COOLDOWN' | 'SUSPENDED';

interface MissionDispatchState {
  // State machine
  status: DispatchStatus;

  // Queue
  queue: Mission[];
  currentProposal: Mission | null;

  // Countdown
  countdown: number; // seconds remaining (30s max)

  // Refusal tracking
  consecutiveRefusals: number;
  showWarning: boolean; // true after 3rd refusal

  // Suspension
  suspendedUntil: number | null; // timestamp

  // Actions
  setStatus: (status: DispatchStatus) => void;
  setQueue: (missions: Mission[]) => void;
  proposeNext: () => void;
  acceptProposal: () => void;
  refuseProposal: () => { shouldSuspend: boolean; shouldWarn: boolean };
  setCountdown: (seconds: number) => void;
  decrementCountdown: () => number;
  dismissWarning: () => void;
  reset: () => void;
  suspend: () => void;
  checkSuspension: () => boolean; // returns true if still suspended
}

const INITIAL_STATE = {
  status: 'IDLE' as DispatchStatus,
  queue: [] as Mission[],
  currentProposal: null as Mission | null,
  countdown: 30,
  consecutiveRefusals: 0,
  showWarning: false,
  suspendedUntil: null as number | null,
};

export const useMissionDispatchStore = create<MissionDispatchState>((set, get) => ({
  ...INITIAL_STATE,

  setStatus: (status) => set({ status }),

  setQueue: (missions) => set({ queue: missions }),

  proposeNext: () => {
    const { queue } = get();
    if (queue.length === 0) {
      set({ status: 'IDLE', currentProposal: null });
      return;
    }
    const [next, ...rest] = queue;
    set({
      status: 'PROPOSING',
      currentProposal: next,
      queue: rest,
      countdown: 30,
    });
  },

  acceptProposal: () => {
    set({
      status: 'IDLE',
      currentProposal: null,
      consecutiveRefusals: 0,
      queue: [],
    });
  },

  refuseProposal: () => {
    const { consecutiveRefusals } = get();
    const newCount = consecutiveRefusals + 1;

    const shouldWarn = newCount === 3;
    const shouldSuspend = newCount >= 5;

    set({
      currentProposal: null,
      consecutiveRefusals: newCount,
      showWarning: shouldWarn,
      status: shouldSuspend ? 'SUSPENDED' : 'COOLDOWN',
    });

    return { shouldSuspend, shouldWarn };
  },

  setCountdown: (seconds) => set({ countdown: seconds }),

  decrementCountdown: () => {
    const current = get().countdown;
    const next = Math.max(0, current - 1);
    set({ countdown: next });
    return next;
  },

  dismissWarning: () => set({ showWarning: false }),

  suspend: () => {
    const suspendedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes
    set({
      status: 'SUSPENDED',
      suspendedUntil,
      currentProposal: null,
      queue: [],
    });
  },

  checkSuspension: () => {
    const { suspendedUntil } = get();
    if (!suspendedUntil) return false;
    if (Date.now() >= suspendedUntil) {
      set({ suspendedUntil: null, status: 'IDLE', consecutiveRefusals: 0 });
      return false;
    }
    return true;
  },

  reset: () => set(INITIAL_STATE),
}));
