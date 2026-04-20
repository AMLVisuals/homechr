'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string | null;
  role: 'PATRON' | 'WORKER';
  subscription_tier: 'FREE' | 'PRO' | 'PREMIUM';
  company_name: string | null;
  siret: string | null;
  title: string | null;
  bio: string | null;
  skills: string[];
  employment_category: string | null;
  hourly_rate: number | null;
  radius_km: number;
  is_available: boolean;
  // Infos fiscales & bancaires auto-entrepreneur
  iban?: string | null;
  vat_liable?: boolean | null;
  ape_code?: string | null;
  legal_form?: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; mfaRequired?: boolean; factorId?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
  verifyMfaCode: (factorId: string, code: string) => Promise<{ error: Error | null }>;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Appliquer les données d'onboarding en attente + metadata auth manquantes
  async function applyPendingOnboarding(authUser: User, currentProfile: Profile | null): Promise<Profile | null> {
    if (!currentProfile) return null;

    const updates: Partial<Profile> = {};

    // Si le profil a des champs vides, les remplir depuis les metadata auth
    const meta = authUser.user_metadata || {};
    if (!currentProfile.first_name && meta.first_name) {
      updates.first_name = meta.first_name;
    }
    if (!currentProfile.last_name && meta.last_name) {
      updates.last_name = meta.last_name;
    }
    if (!currentProfile.phone && meta.phone) {
      updates.phone = meta.phone;
    }
    if (!currentProfile.role && meta.role) {
      updates.role = meta.role;
    }

    // Appliquer les données d'onboarding stockées en localStorage
    if (typeof window !== 'undefined') {
      const pendingRaw = localStorage.getItem('chr-onboarding-pending');
      if (pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          if (pending.skills?.length && (!currentProfile.skills || currentProfile.skills.length === 0)) {
            updates.skills = pending.skills;
          }
          if (pending.employment_category && !currentProfile.employment_category) {
            updates.employment_category = pending.employment_category;
          }
          localStorage.removeItem('chr-onboarding-pending');
        } catch { /* ignore invalid JSON */ }
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', authUser.id);

      if (!error) {
        return { ...currentProfile, ...updates };
      }
      console.error('Erreur mise à jour profil onboarding:', error.message);
    }

    return currentProfile;
  }

  // Charger le profil depuis Supabase
  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Erreur chargement profil:', error.message, error.code, error.details, error.hint);
      return null;
    }
    return data as Profile;
  }

  // Écouter les changements d'auth
  useEffect(() => {
    // Récupérer la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).then(async (p) => {
          const updated = await applyPendingOnboarding(session!.user, p);
          setProfile(updated);
        });
      }
      setLoading(false);
    });

    // Écouter les changements
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          let p = await fetchProfile(session.user.id);
          p = await applyPendingOnboarding(session.user, p);
          setProfile(p);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Inscription
  async function signUp(email: string, password: string, metadata?: Record<string, unknown>) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: metadata ? { data: metadata } : undefined,
    });
    return { error: error as Error | null };
  }

  // Connexion
  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error as Error | null };

    // Vérifier si MFA est requis pour atteindre aal2
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== aal?.nextLevel && aal?.nextLevel === 'aal2') {
        // Récupérer le factorId TOTP vérifié
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp?.find((f: any) => f.status === 'verified');
        if (totp) {
          return { error: null, mfaRequired: true, factorId: totp.id };
        }
      }
    } catch (err) {
      console.error('[AuthContext] MFA check error:', err);
    }

    return { error: null };
  }

  async function verifyMfaCode(factorId: string, code: string) {
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) return { error: challenge.error as Error };
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (verify.error) return { error: verify.error as Error };
      return { error: null };
    } catch (err: any) {
      return { error: err as Error };
    }
  }

  // Déconnexion
  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  // Mettre à jour le profil
  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: new Error('Non connecté') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    return { error: error as Error | null };
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      verifyMfaCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
