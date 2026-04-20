import { supabase } from './supabase';

/**
 * Helpers Supabase MFA (TOTP) — Google Authenticator / 1Password / Authy etc.
 * Docs : https://supabase.com/docs/guides/auth/auth-mfa
 */

export interface EnrollResponse {
  factorId: string;
  qrCode: string;        // data:image/svg+xml
  secret: string;        // manual-entry code
  uri: string;           // otpauth://...
}

/** Liste les facteurs MFA actifs de l'utilisateur courant. */
export async function listFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return {
    totp: data?.totp || [],
    all: data?.all || [],
  };
}

/** Démarre l'inscription d'un nouveau facteur TOTP. */
export async function enrollTotp(friendlyName = 'Authenticator'): Promise<EnrollResponse> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName,
  });
  if (error) throw error;
  if (!data) throw new Error('Aucune donnée MFA renvoyée');

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    uri: data.totp.uri,
  };
}

/**
 * Finalise l'enrollment en challengeant + vérifiant le code OTP.
 * Doit être appelé avec le code à 6 chiffres issu de l'app authenticator.
 */
export async function verifyTotpEnrollment(factorId: string, code: string) {
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) throw challenge.error;

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });
  if (verify.error) throw verify.error;

  return verify.data;
}

/**
 * Challenge + verify au login (après entrée email/password si MFA activé).
 */
export async function challengeAndVerify(factorId: string, code: string) {
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error) throw challenge.error;

  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code,
  });
  if (verify.error) throw verify.error;

  return verify.data;
}

/** Retire un facteur MFA (désactive la 2FA). */
export async function unenrollFactor(factorId: string) {
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  return data;
}

/**
 * Vérifie si la session courante est "aal2" (deuxième facteur validé).
 * Utile après login pour savoir si on doit demander le code OTP.
 */
export async function getAssuranceLevel(): Promise<{
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
  mfaRequired: boolean;
}> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  return {
    currentLevel: (data?.currentLevel as any) || null,
    nextLevel: (data?.nextLevel as any) || null,
    mfaRequired: data?.currentLevel !== data?.nextLevel,
  };
}
