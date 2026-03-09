import { create } from 'zustand';
import { Mission } from '@/types/missions';

export type DispatchStatus = 'IDLE' | 'SEARCHING' | 'PROPOSING' | 'COOLDOWN';

interface MissionDispatchState {
  // State machine
  status: DispatchStatus;

  // Queue
  queue: Mission[];
  currentProposal: Mission | null;

  // Countdown
  countdown: number; // seconds remaining (30s max)

  // Actions
  setStatus: (status: DispatchStatus) => void;
  setQueue: (missions: Mission[]) => void;
  proposeNext: () => void;
  acceptProposal: () => void;
  refuseProposal: () => void;
  setCountdown: (seconds: number) => void;
  decrementCountdown: () => number;
  reset: () => void;
}

const INITIAL_STATE = {
  status: 'IDLE' as DispatchStatus,
  queue: [] as Mission[],
  currentProposal: null as Mission | null,
  countdown: 30,
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
      queue: [],
    });
  },

  refuseProposal: () => {
    set({
      currentProposal: null,
      status: 'IDLE',
    });
  },

  setCountdown: (seconds) => set({ countdown: seconds }),

  decrementCountdown: () => {
    const current = get().countdown;
    const next = Math.max(0, current - 1);
    set({ countdown: next });
    return next;
  },

  reset: () => set(INITIAL_STATE),
}));
