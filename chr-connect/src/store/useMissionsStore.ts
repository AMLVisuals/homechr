import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Mission, MissionCandidate, Review, Invoice, InvoiceItem, Provider, TeamMember, DisputeReason } from '@/types/missions';
import type { DPAEMissionStatus } from '@/types/compliance';
import {
  getMissionsByPatron as fetchMissionsFromSupabase,
  createMission as createMissionInSupabase,
  updateMission as updateMissionInSupabase,
  getTeamByPatron as fetchTeamFromSupabase,
  createDispute as createDisputeInSupabase,
} from '@/lib/supabase-helpers';

// Schedule statuses per member per day
export type ScheduleStatus = 'PRESENT' | 'CONGE' | 'MALADIE';
// { "2026-03-09": { "t1": "PRESENT", "t2": "CONGE" } }
type TeamSchedule = Record<string, Record<string, ScheduleStatus>>;

interface MissionsState {
  missions: Mission[];
  team: TeamMember[];
  teamSchedule: TeamSchedule;
  addMission: (mission: Mission) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  addReview: (missionId: string, review: Review) => void;
  generateInvoice: (missionId: string) => void;
  payInvoice: (invoiceId: string) => void;
  rejectQuote: (missionId: string, rejection: NonNullable<Mission['quoteRejection']>) => void;
  acceptQuote: (missionId: string, signature?: { signedAt: string; paymentMethod?: string; approvalText?: string }) => void;
  askQuoteQuestion: (missionId: string, message: string) => void;
  setPartsStatus: (missionId: string, status: 'PART_ORDERED' | 'PART_RECEIVED') => void;
  validateStaffMission: (missionId: string, hoursWorked?: number) => void;
  resumeStandbyMission: (missionId: string) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (id: string) => void;
  setScheduleStatus: (date: string, memberId: string, status: ScheduleStatus | null) => void;
  addCandidate: (missionId: string, candidate: MissionCandidate) => void;
  removeCandidate: (missionId: string, candidateId: string) => void;
  selectCandidate: (missionId: string, candidateId: string) => void;
  rejectCandidate: (missionId: string, candidateId: string) => void;
  updateDpaeStatus: (missionId: string, status: DPAEMissionStatus, receiptId?: string) => void;
  reportDispute: (missionId: string, reason: DisputeReason, description: string, photos?: string[]) => void;
  syncReportDispute: (missionId: string, reason: DisputeReason, description: string, photos?: string[]) => Promise<{ ok: boolean; error?: string }>;
  resolveDispute: (missionId: string, resolution: string) => void;

  // Async Supabase actions
  isLoading: boolean;
  error: string | null;
  fetchMissions: (patronId: string) => Promise<void>;
  syncAddMission: (mission: Mission) => Promise<void>;
  syncUpdateMission: (id: string, updates: Partial<Mission>) => Promise<void>;
  fetchTeam: (patronId: string) => Promise<void>;
}


export const useMissionsStore = create<MissionsState>()(
  persist(
    (set, get) => ({
      missions: [],
      team: [],
      teamSchedule: {},
      addMission: (mission) => set((state) => ({ 
        missions: [mission, ...state.missions] 
      })),
      updateMission: (id, updates) => set((state) => ({
        missions: state.missions.map((m) => m.id === id ? { ...m, ...updates } : m)
      })),
      addReview: (missionId, review) => set((state) => ({
        missions: state.missions.map((m) => m.id === missionId ? { ...m, review } : m)
      })),
      generateInvoice: (missionId) => set((state) => {
        const mission = state.missions.find(m => m.id === missionId);
        if (!mission || mission.invoice) return state;

        const now = new Date();
        const dueDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        let priceNum = 0;
        let invoiceItems: InvoiceItem[] = [];

        // Build invoice from accepted quote if available (TECH flow)
        if (mission.quote) {
          priceNum = mission.quote.totalTTC;
          invoiceItems = mission.quote.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPriceHT
          }));
        } else {
          // Fallback: parse price from mission (STAFF flow or legacy)
          if (typeof mission.price === 'string') {
            priceNum = parseInt(mission.price.replace(/[^0-9]/g, '')) || 100;
          } else {
            priceNum = mission.price || 100;
          }
          invoiceItems = [{ description: mission.title, quantity: 1, unitPrice: priceNum }];
        }

        const tax = mission.quote ? mission.quote.totalTVA : priceNum * 0.20;

        const newInvoice: Invoice = {
          id: `inv-${Date.now()}`,
          missionId: mission.id,
          number: `INV-${now.getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
          date: now.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          status: 'PENDING',
          items: invoiceItems,
          totalAmount: priceNum,
          taxAmount: tax,
          fileUrl: '#',
          issuerDetails: {
            name: mission.quote?.provider?.name || mission.provider?.name || 'Prestataire',
            address: mission.quote?.provider?.address || '123 Avenue des Champs-Élysées, 75008 Paris',
            siret: mission.quote?.provider?.siret || '123 456 789 00012',
            email: mission.quote?.provider?.email || 'contact@prestataire.com',
            logo: mission.provider?.avatar
          },
          clientDetails: {
            name: mission.quote?.client?.establishmentName || mission.venue || 'Le Bistrot Parisien',
            address: mission.quote?.client?.establishmentAddress || '10 Rue de la Paix, 75002 Paris',
            vatNumber: 'FR 12 345678900'
          },
          history: [
            {
              date: now.toISOString(),
              status: 'CREATED',
              label: 'Facture générée automatiquement'
            },
            {
              date: now.toISOString(),
              status: 'SENT',
              label: 'Envoyée au client'
            }
          ]
        };

        return {
          missions: state.missions.map(m => m.id === missionId ? { ...m, invoice: newInvoice } : m)
        };
      }),
      payInvoice: (invoiceId) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.invoice && m.invoice.id === invoiceId) {
            const now = new Date();
            return {
              ...m,
              invoice: { 
                ...m.invoice, 
                status: 'PAID',
                paymentMethod: {
                  type: 'CARD',
                  last4: '4242'
                },
                history: [
                  ...(m.invoice.history || []),
                  {
                    date: now.toISOString(),
                    status: 'PAID',
                    label: 'Paiement reçu par carte bancaire'
                  }
                ]
              }
            };
          }
          return m;
        })
      })),
      rejectQuote: (missionId, rejection) => set((state) => ({
        missions: state.missions.map(m => m.id === missionId ? {
          ...m,
          status: 'CANCELLED' as const,
          quoteRejection: rejection
        } : m)
      })),
      acceptQuote: (missionId, signature) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId || !m.quote) return m;
          return {
            ...m,
            status: 'SCHEDULED' as const,
            quote: {
              ...m.quote,
              status: 'ACCEPTED' as const,
              signature: {
                ...m.quote.signature,
                signed: true,
                signedAt: signature?.signedAt ? new Date(signature.signedAt) : new Date(),
                phoneVerified: m.quote.signature?.phoneVerified ?? false,
              },
            },
          };
        }),
      })),
      askQuoteQuestion: (missionId, message) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId || !m.quote) return m;
          const questions = (m.quote as any).questions || [];
          return {
            ...m,
            quote: {
              ...m.quote,
              questions: [
                ...questions,
                { id: Math.random().toString(36).slice(2), question: message, askedAt: new Date().toISOString(), status: 'pending' },
              ],
            } as any,
          };
        }),
      })),
      setPartsStatus: (missionId, partsStatus) => set((state) => ({
        missions: state.missions.map(m => m.id === missionId ? { ...m, partsStatus } : m)
      })),
      validateStaffMission: (missionId, hoursWorked) => set((state) => ({
        missions: state.missions.map(m => m.id === missionId ? {
          ...m,
          staffValidation: {
            validated: true,
            validatedAt: new Date().toISOString(),
            hoursWorked
          }
        } : m)
      })),
      resumeStandbyMission: (missionId) => set((state) => ({
        missions: state.missions.map(m => m.id === missionId ? {
          ...m,
          status: 'ON_WAY' as const,
          partsStatus: 'PART_RECEIVED' as const
        } : m)
      })),
      addTeamMember: (member) => set((state) => ({ team: [...state.team, member] })),
      updateTeamMember: (id, updates) => set((state) => ({
        team: state.team.map((t) => t.id === id ? { ...t, ...updates } : t)
      })),
      removeTeamMember: (id) => set((state) => ({
        team: state.team.filter((t) => t.id !== id)
      })),
      setScheduleStatus: (date, memberId, status) => set((state) => {
        const dayData = { ...(state.teamSchedule[date] || {}) };
        if (status === null) {
          delete dayData[memberId];
        } else {
          dayData[memberId] = status;
        }
        return {
          teamSchedule: {
            ...state.teamSchedule,
            [date]: dayData
          }
        };
      }),
      addCandidate: (missionId, candidate) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId) return m;
          const existing = m.candidates || [];
          if (existing.some(c => c.id === candidate.id)) return m;
          return { ...m, candidates: [...existing, candidate] };
        })
      })),
      removeCandidate: (missionId, candidateId) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId) return m;
          return { ...m, candidates: (m.candidates || []).filter(c => c.id !== candidateId) };
        })
      })),
      selectCandidate: (missionId, candidateId) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId) return m;
          const required = m.requiredWorkers || 1;
          // Marquer ce candidat comme ACCEPTED
          const updatedCandidates = (m.candidates || []).map(c =>
            c.id === candidateId ? { ...c, status: 'ACCEPTED' as const } : c
          );
          const acceptedCount = updatedCandidates.filter(c => c.status === 'ACCEPTED').length;
          const allFilled = acceptedCount >= required;
          // Si tous les postes sont pourvus, rejeter les PENDING restants et passer en SCHEDULED
          const finalCandidates = allFilled
            ? updatedCandidates.map(c => c.status === 'PENDING' ? { ...c, status: 'REJECTED' as const } : c)
            : updatedCandidates;
          const lastSelected = finalCandidates.find(c => c.id === candidateId);
          const acceptedList = finalCandidates.filter(c => c.status === 'ACCEPTED');
          // Calcul note moyenne des candidats acceptés
          const avgRating = acceptedList.length > 0
            ? Math.round((acceptedList.reduce((sum, c) => sum + c.rating, 0) / acceptedList.length) * 10) / 10
            : lastSelected?.rating || 0;
          const totalMissions = acceptedList.reduce((sum, c) => sum + c.completedMissions, 0);

          return {
            ...m,
            candidates: finalCandidates,
            status: allFilled ? 'SCHEDULED' as const : m.status,
            // Pour STAFFING : initialiser dpaeStatus quand tous les postes sont pourvus
            ...(allFilled && m.category === 'STAFFING' ? { dpaeStatus: 'PENDING' as const } : {}),
            provider: allFilled && lastSelected ? {
              id: acceptedList.map(c => c.id).join(','),
              name: acceptedCount > 1
                ? acceptedList.map(c => c.name).join(', ')
                : lastSelected.name,
              rating: avgRating,
              completedMissions: totalMissions,
              bio: acceptedCount > 1
                ? acceptedList.map(c => c.specialty).join(' • ')
                : lastSelected.specialty,
              phone: '+33 6 00 00 00 00',
              avatar: lastSelected.avatar,
            } : m.provider,
          };
        })
      })),
      rejectCandidate: (missionId, candidateId) => set((state) => ({
        missions: state.missions.map(m => {
          if (m.id !== missionId) return m;
          return {
            ...m,
            candidates: (m.candidates || []).map(c =>
              c.id === candidateId ? { ...c, status: 'REJECTED' as const } : c
            )
          };
        })
      })),
      updateDpaeStatus: (missionId, dpaeStatus, dpaeReceiptId) => set((state) => ({
        missions: state.missions.map(m =>
          m.id === missionId
            ? { ...m, dpaeStatus, ...(dpaeReceiptId ? { dpaeReceiptId } : {}) }
            : m
        )
      })),
      syncReportDispute: async (missionId, reason, description, photos) => {
        get().reportDispute(missionId, reason, description, photos);
        const { error } = await createDisputeInSupabase({
          missionId,
          reason,
          description,
          photos: photos ?? null,
          status: 'OPEN',
        });
        if (error) {
          console.error('[syncReportDispute] Supabase error:', error);
          return { ok: false, error: (error as any)?.message || 'Erreur serveur' };
        }
        try {
          await updateMissionInSupabase(missionId, { status: 'DISPUTED' } as any);
        } catch (err) {
          console.warn('[syncReportDispute] status update warning:', err);
        }
        fetch('/api/missions/notify-dispute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ missionId, reason }),
        }).catch(() => { /* best-effort */ });
        return { ok: true };
      },
      reportDispute: (missionId, reason, description, photos) => set((state) => ({
        missions: state.missions.map(m =>
          m.id === missionId
            ? {
                ...m,
                status: 'DISPUTED' as const,
                dispute: {
                  reason,
                  description,
                  photos,
                  createdAt: new Date().toISOString(),
                  status: 'OPEN' as const,
                },
              }
            : m
        )
      })),
      resolveDispute: (missionId, resolution) => set((state) => ({
        missions: state.missions.map(m =>
          m.id === missionId && m.dispute
            ? {
                ...m,
                status: 'COMPLETED' as const,
                dispute: {
                  ...m.dispute,
                  status: 'RESOLVED_PATRON' as const,
                  resolution,
                  resolvedAt: new Date().toISOString(),
                },
              }
            : m
        )
      })),

      // ── Async Supabase actions ──────────────────────────────────
      isLoading: false,
      error: null,

      fetchMissions: async (patronId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data: missions, error } = await fetchMissionsFromSupabase(patronId);
          console.log('[fetchMissions] result:', { count: missions?.length, error, patronId });
          if (missions && missions.length > 0) {
            set({ missions: missions as Mission[], isLoading: false });
          } else {
            set({ missions: [], isLoading: false });
          }
        } catch (err) {
          console.error('[useMissionsStore] fetchMissions error:', err);
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur chargement missions' });
        }
      },

      syncAddMission: async (mission: Mission) => {
        // Optimistic: add locally first
        get().addMission(mission);
        try {
          const { data } = await createMissionInSupabase(mission as any);
          const persistedId = (data as any)?.id || mission.id;

          if (mission.status === 'SEARCHING') {
            fetch('/api/missions/notify-candidates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ missionId: persistedId }),
            }).catch((err) => {
              console.warn('[syncAddMission] notify-candidates failed:', err);
            });
          }
        } catch (err) {
          console.error('[useMissionsStore] syncAddMission error:', err);
        }
      },

      syncUpdateMission: async (id: string, updates: Partial<Mission>) => {
        // Optimistic: update locally first
        get().updateMission(id, updates);
        try {
          await updateMissionInSupabase(id, updates as any);
        } catch (err) {
          console.error('[useMissionsStore] syncUpdateMission error:', err);
        }
      },

      fetchTeam: async (patronId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data: team } = await fetchTeamFromSupabase(patronId);
          if (team && team.length > 0) {
            set({ team: team as TeamMember[], isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (err) {
          console.error('[useMissionsStore] fetchTeam error:', err);
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur chargement équipe' });
        }
      },
    }),
    {
      name: 'missions-storage-v15',
      partialize: (state) => ({
        teamSchedule: state.teamSchedule,
      }),
    }
  )
);
