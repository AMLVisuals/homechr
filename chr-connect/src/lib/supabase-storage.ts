import { supabase } from './supabase';

// ============================================================================
// TYPES
// ============================================================================

export type StorageBucket =
  | 'avatars'
  | 'venues'
  | 'equipment'
  | 'missions'
  | 'documents'
  | 'invoices'
  | 'compliance'
  | 'portfolio';

interface UploadResult {
  url: string;
  path: string;
}

// ============================================================================
// UPLOAD
// ============================================================================

/**
 * Upload un fichier dans Supabase Storage.
 * Le fichier est rangé dans : bucket/userId/filename
 *
 * @param bucket - Le bucket cible (avatars, venues, equipment, etc.)
 * @param userId - L'ID de l'utilisateur (sert de dossier pour le RLS)
 * @param file - Le fichier (File, Blob, ou base64 string)
 * @param fileName - Nom du fichier (optionnel, auto-généré si absent)
 * @returns { url, path } ou throw en cas d'erreur
 */
export async function uploadFile(
  bucket: StorageBucket,
  userId: string,
  file: File | Blob,
  fileName?: string
): Promise<UploadResult> {
  const name = fileName || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${userId}/${name}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const url = getPublicUrl(bucket, path);
  return { url, path };
}

/**
 * Upload depuis une data URL (base64).
 * Convertit le base64 en Blob avant l'upload.
 */
export async function uploadBase64(
  bucket: StorageBucket,
  userId: string,
  dataUrl: string,
  fileName?: string
): Promise<UploadResult> {
  const blob = dataUrlToBlob(dataUrl);
  const ext = blob.type.split('/')[1] || 'bin';
  const name = fileName || `${Date.now()}.${ext}`;
  return uploadFile(bucket, userId, blob, name);
}

// ============================================================================
// READ / URL
// ============================================================================

/**
 * Retourne l'URL publique d'un fichier.
 * Fonctionne pour les buckets publics (avatars, venues, equipment, missions, portfolio).
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Retourne une URL signée temporaire (pour les buckets privés).
 * Valide pendant `expiresIn` secondes (défaut: 1h).
 */
export async function getSignedUrl(
  bucket: StorageBucket,
  path: string,
  expiresIn = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Supprime un ou plusieurs fichiers d'un bucket.
 */
export async function deleteFiles(bucket: StorageBucket, paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Supprime un seul fichier.
 */
export async function deleteFile(bucket: StorageBucket, path: string): Promise<void> {
  return deleteFiles(bucket, [path]);
}

// ============================================================================
// LIST
// ============================================================================

/**
 * Liste les fichiers dans un dossier d'un bucket.
 */
export async function listFiles(bucket: StorageBucket, folder: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { sortBy: { column: 'created_at', order: 'desc' } });

  if (error) throw new Error(`List failed: ${error.message}`);
  return data ?? [];
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convertit une data URL (base64) en Blob.
 */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

// ============================================================================
// RACCOURCIS PAR DOMAINE
// ============================================================================

/** Upload un avatar utilisateur */
export async function uploadAvatar(userId: string, file: File | Blob) {
  const ext = file instanceof File ? file.name.split('.').pop() : 'jpg';
  return uploadFile('avatars', userId, file, `avatar.${ext}`);
}

/** Upload une photo de venue */
export async function uploadVenuePhoto(userId: string, venueId: string, file: File | Blob) {
  const name = `${venueId}/${Date.now()}.${getExtension(file)}`;
  return uploadFile('venues', userId, file, name);
}

/** Upload une photo d'équipement */
export async function uploadEquipmentPhoto(userId: string, equipmentId: string, file: File | Blob) {
  const name = `${equipmentId}/${Date.now()}.${getExtension(file)}`;
  return uploadFile('equipment', userId, file, name);
}

/** Upload un fichier de mission (photo avant/après, rapport) */
export async function uploadMissionFile(userId: string, missionId: string, file: File | Blob) {
  const name = `${missionId}/${Date.now()}.${getExtension(file)}`;
  return uploadFile('missions', userId, file, name);
}

/** Upload un document privé (facture, contrat, attestation) */
export async function uploadDocument(userId: string, file: File | Blob, category?: string) {
  const prefix = category ? `${category}/` : '';
  const name = `${prefix}${Date.now()}-${file instanceof File ? file.name : 'file'}`;
  return uploadFile('documents', userId, file, name);
}

/** Upload un document de compliance (identité, kbis, etc.) */
export async function uploadComplianceDoc(userId: string, docType: string, file: File | Blob) {
  const name = `${docType}/${Date.now()}.${getExtension(file)}`;
  return uploadFile('compliance', userId, file, name);
}

/** Upload un élément de portfolio worker */
export async function uploadPortfolioItem(userId: string, file: File | Blob) {
  const name = `${Date.now()}.${getExtension(file)}`;
  return uploadFile('portfolio', userId, file, name);
}

/** Upload une facture PDF */
export async function uploadInvoice(userId: string, invoiceRef: string, file: Blob) {
  const name = `${invoiceRef}.pdf`;
  return uploadFile('invoices', userId, file, name);
}

function getExtension(file: File | Blob): string {
  if (file instanceof File) {
    return file.name.split('.').pop() || 'bin';
  }
  return file.type.split('/')[1] || 'bin';
}
