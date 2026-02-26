'use client';

import React from 'react';
import { EstablishmentProvider } from '@/contexts/EstablishmentContext';
import { ToastProvider } from '@/components/ui/toast';

// ============================================================================
// PROVIDERS WRAPPER
// ============================================================================
// Wrapper pour tous les providers de l'application
// Cela permet de garder le layout.tsx propre et server-side

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ToastProvider>
      <EstablishmentProvider>
        {children}
      </EstablishmentProvider>
    </ToastProvider>
  );
}
