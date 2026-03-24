'use client';

import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import type { NotificationType } from '@/store/useNotificationsStore';

// ============================================================================
// Types pour les payloads Realtime Supabase
// ============================================================================

interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

interface MissionRow {
  id: string;
  patron_id: string;
  provider_id: string | null;
  [key: string]: unknown;
}

// ============================================================================
// Hook
// ============================================================================

export function useRealtimeSubscriptions() {
  const { user } = useAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    const addNotification = useNotificationsStore.getState().addNotification;
    const updateMission = useMissionsStore.getState().updateMission;

    // Canal unique pour toutes les souscriptions
    const channel = supabase
      .channel(`realtime:${userId}`)
      // ── Notifications: INSERT pour l'utilisateur courant ────────────
      .on<NotificationRow>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new;
          addNotification({
            title: row.title,
            description: row.description,
            type: row.type,
          });
        }
      )
      // ── Missions: UPDATE ou le user est patron ─────────────────────
      .on<MissionRow>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'missions',
          filter: `patron_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new;
          updateMission(row.id, row);
        }
      )
      // ── Missions: UPDATE ou le user est prestataire ────────────────
      .on<MissionRow>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'missions',
          filter: `provider_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new;
          updateMission(row.id, row);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Souscriptions actives pour', userId);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] Erreur de canal');
        }
      });

    channelRef.current = channel;

    // ── Cleanup ──────────────────────────────────────────────────────
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user]);
}
