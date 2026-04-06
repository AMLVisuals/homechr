'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVenuesStore } from '@/store/useVenuesStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { useStockStore } from '@/store/useStockStore';
import { useNotificationsStore } from '@/store/useNotificationsStore';
import { useDocumentsStore } from '@/store/useDocumentsStore';
import { useCalendarStore } from '@/store/calendarStore';

/**
 * Hook qui charge toutes les données Supabase quand l'utilisateur se connecte.
 * À appeler une seule fois dans un provider haut niveau.
 */
export function useDataLoader() {
  const { user, profile } = useAuth();
  const loaded = useRef(false);

  useEffect(() => {
    console.log('[useDataLoader] check:', { user: !!user, profile: !!profile, loaded: loaded.current });
    if (!user || !profile || loaded.current) return;
    loaded.current = true;

    const userId = user.id;

    console.log('[useDataLoader] Loading data for user:', userId);
    // Charger en parallèle
    Promise.allSettled([
      useVenuesStore.getState().fetchVenues(userId),
      useMissionsStore.getState().fetchMissions(userId),
      useEquipmentStore.getState().fetchEquipment(userId),
      useNotificationsStore.getState().fetchNotifications(userId),
      useDocumentsStore.getState().fetchDocuments(userId),
      useCalendarStore.getState().fetchEvents(userId),
    ]).then((results) => {
      // Une fois les venues chargées, charger le stock de la venue active
      const activeVenueId = useVenuesStore.getState().activeVenueId;
      if (activeVenueId) {
        useStockStore.getState().fetchStock(activeVenueId);
      }

      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.warn(`[useDataLoader] ${failed.length} chargement(s) échoué(s)`);
      }
    });
  }, [user, profile]);

  // Reset quand l'user se déconnecte
  useEffect(() => {
    if (!user && loaded.current) {
      loaded.current = false;
    }
  }, [user]);
}
