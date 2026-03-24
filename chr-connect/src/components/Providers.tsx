'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { EstablishmentProvider } from '@/contexts/EstablishmentContext';
import { ToastProvider } from '@/components/ui/toast';
import { useRealtimeSubscriptions } from '@/hooks/useRealtimeSubscriptions';
import { useDataLoader } from '@/hooks/useDataLoader';

// ============================================================================
// PROVIDERS WRAPPER
// ============================================================================
// Wrapper pour tous les providers de l'application
// Cela permet de garder le layout.tsx propre et server-side

// Composant interne qui charge les données Supabase + active le Realtime
// Doit etre enfant de AuthProvider pour acceder a useAuth()
function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useDataLoader();
  useRealtimeSubscriptions();
  return <>{children}</>;
}

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <ToastProvider>
        <EstablishmentProvider>
          <RealtimeProvider>
            {children}
          </RealtimeProvider>
        </EstablishmentProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
