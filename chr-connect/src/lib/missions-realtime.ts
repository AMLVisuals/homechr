import { supabase } from './supabase';

export type MissionRealtimeEvent =
  | { kind: 'NEW_SEARCHING'; mission: any }
  | { kind: 'UPDATED'; mission: any }
  | { kind: 'REMOVED'; id: string };

export function subscribeToSearchingMissions(
  onEvent: (event: MissionRealtimeEvent) => void
) {
  const channel = supabase
    .channel('missions:searching')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'missions' },
      (payload: any) => {
        if (payload.new?.status === 'SEARCHING') {
          onEvent({ kind: 'NEW_SEARCHING', mission: payload.new });
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'missions' },
      (payload: any) => {
        const prevStatus = payload.old?.status;
        const newStatus = payload.new?.status;
        if (newStatus === 'SEARCHING' && prevStatus !== 'SEARCHING') {
          onEvent({ kind: 'NEW_SEARCHING', mission: payload.new });
        } else if (prevStatus === 'SEARCHING' && newStatus !== 'SEARCHING') {
          onEvent({ kind: 'REMOVED', id: payload.new.id });
        } else if (newStatus === 'SEARCHING') {
          onEvent({ kind: 'UPDATED', mission: payload.new });
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToMyCandidatures(
  workerId: string,
  onChange: () => void
) {
  const channel = supabase
    .channel(`candidatures:${workerId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'mission_candidates',
        filter: `worker_id=eq.${workerId}`,
      },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
