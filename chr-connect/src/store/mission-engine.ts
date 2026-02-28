import { create } from 'zustand';

export type MissionStatus = 'IDLE' | 'ACCEPTED' | 'ON_WAY' | 'ON_SITE' | 'IN_PROGRESS' | 'COMPLETED' | 'DIAGNOSING' | 'QUOTE_BUILDING' | 'AWAITING_QUOTE_RESPONSE' | 'AWAITING_PATRON_CONFIRMATION';

interface Coordinates {
  lat: number;
  lng: number;
}

export type FlowType = 'STAFF' | 'TECH' | null;

interface MissionState {
  // Data
  status: MissionStatus;
  activeMissionId: string | null;
  flowType: FlowType;
  technicianLocation: Coordinates;
  venueLocation: Coordinates;
  eta: number; // in minutes
  evidence: {
    before: { type: 'PHOTO' | 'VIDEO', url: string } | null;
    after: { type: 'PHOTO' | 'VIDEO', url: string } | null;
  };
  report: {
    text: string;
    attachments: { type: 'PHOTO' | 'VIDEO' | 'VOICE'; url: string }[];
  } | null;
  startTime: number | null; // Timestamp when IN_PROGRESS started

  // Interim data collected during IN_PROGRESS
  interimData: {
    notes: string[];
    media: { type: 'PHOTO' | 'VIDEO' | 'VOICE'; url: string; timestamp: number }[];
  };

  // Diagnostic data (TECH flow)
  diagnosticData: {
    notes: string[];
    photos: string[];
  };

  // Actions
  startMission: (missionId?: string) => void;
  setStatus: (status: MissionStatus) => void;
  setFlowType: (flowType: FlowType) => void;
  updateLocation: (lat: number, lng: number) => void;
  setEta: (minutes: number) => void;
  uploadEvidence: (period: 'BEFORE' | 'AFTER', type: 'PHOTO' | 'VIDEO', url: string) => void;
  addInterimNote: (note: string) => void;
  addInterimMedia: (type: 'PHOTO' | 'VIDEO' | 'VOICE', url: string) => void;
  addDiagnosticNote: (note: string) => void;
  addDiagnosticPhoto: (photo: string) => void;
  submitReport: (data: { text: string; attachments: { type: 'PHOTO' | 'VIDEO' | 'VOICE'; url: string }[] }) => void;
  resetMission: () => void;
}

// Initial coordinates (Paris)
const INITIAL_TECH_LOC = { lat: 48.8675, lng: 2.3638 }; // Place de la République
const VENUE_LOC = { lat: 48.8716, lng: 2.3013 }; // Champs-Élysées

export const useMissionEngine = create<MissionState>((set) => ({
  status: 'IDLE',
  activeMissionId: null,
  flowType: null,
  technicianLocation: INITIAL_TECH_LOC,
  venueLocation: VENUE_LOC,
  eta: 15,
  evidence: { before: null, after: null },
  report: null,
  startTime: null,
  interimData: { notes: [], media: [] },
  diagnosticData: { notes: [], photos: [] },

  startMission: (missionId) => set({ status: 'ACCEPTED', activeMissionId: missionId || null }),

  setStatus: (status) => set((state) => {
    // If starting work, record start time
    if (status === 'IN_PROGRESS' && !state.startTime) {
      return { status, startTime: Date.now() };
    }
    return { status };
  }),

  setFlowType: (flowType) => set({ flowType }),

  updateLocation: (lat, lng) => set({ technicianLocation: { lat, lng } }),

  setEta: (minutes) => set({ eta: minutes }),

  uploadEvidence: (period, type, url) => set((state) => ({
    evidence: {
      ...state.evidence,
      [period === 'BEFORE' ? 'before' : 'after']: { type, url }
    }
  })),

  addInterimNote: (note) => set((state) => ({
    interimData: {
      ...state.interimData,
      notes: [...state.interimData.notes, note]
    }
  })),

  addInterimMedia: (type, url) => set((state) => ({
    interimData: {
      ...state.interimData,
      media: [...state.interimData.media, { type, url, timestamp: Date.now() }]
    }
  })),

  addDiagnosticNote: (note) => set((state) => ({
    diagnosticData: {
      ...state.diagnosticData,
      notes: [...state.diagnosticData.notes, note]
    }
  })),

  addDiagnosticPhoto: (photo) => set((state) => ({
    diagnosticData: {
      ...state.diagnosticData,
      photos: [...state.diagnosticData.photos, photo]
    }
  })),

  submitReport: (data) => set({ report: data }),

  resetMission: () => set({
    status: 'IDLE',
    activeMissionId: null,
    flowType: null,
    technicianLocation: INITIAL_TECH_LOC,
    eta: 15,
    evidence: { before: null, after: null },
    report: null,
    startTime: null,
    interimData: { notes: [], media: [] },
    diagnosticData: { notes: [], photos: [] }
  })
}));
