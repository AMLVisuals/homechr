'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, FileText, History, Upload, Check, X, CreditCard, IdCard, BookOpenText, FileCheck,
  Camera, Loader2, User,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAvatar, uploadComplianceDoc, getSignedUrl } from '@/lib/supabase-storage';
import { supabase } from '@/lib/supabase';
import { ActivityTab } from './tabs/PayslipsTab';
import StripeOnboardingCard from './StripeOnboardingCard';

const TABS = [
  { id: 'IDENTITY' as const, label: 'Identité', icon: ShieldCheck, color: 'text-violet-400' },
  { id: 'CV' as const, label: 'Documents', icon: FileText, color: 'text-blue-400' },
  { id: 'HISTORY_PAY' as const, label: 'Mon activité', icon: History, color: 'text-amber-400' },
];

type TabId = typeof TABS[number]['id'];

type DocType = 'CNI' | 'PASSPORT' | 'TITRE_SEJOUR';

const DOC_OPTIONS: { id: DocType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'CNI', label: 'Carte d\'identité', icon: IdCard },
  { id: 'PASSPORT', label: 'Passeport', icon: BookOpenText },
  { id: 'TITRE_SEJOUR', label: 'Titre de séjour', icon: FileCheck },
];

// Map doc categories to compliance_documents.type
const DOC_TYPE_MAP: Record<string, string> = {
  identity_recto: 'IDENTITY',
  identity_verso: 'IDENTITY',
  carte_vitale: 'SOCIAL_SECURITY_CARD',
  cv: 'CERTIFICATIONS',
  kbis: 'ATTESTATION_PRO_KBIS',
  urssaf: 'URSSAF_ATTESTATION',
  rc_pro: 'RC_PRO',
  decennale: 'RC_PRO',
};

interface SavedDoc {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  uploadedAt: string;
}

export default function ProviderProfileEditor() {
  const { profile, user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('IDENTITY');

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Viewer modal
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  // Document uploads state (local File for preview)
  const [selectedDocType, setSelectedDocType] = useState<DocType>('CNI');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Saved documents from Supabase
  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Load avatar + documents on mount
  useEffect(() => {
    if (profile) {
      setAvatarUrl(profile.avatar_url);
      loadDocuments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  async function loadDocuments() {
    if (!user) return;
    setLoadingDocs(true);
    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('worker_id', user.id)
      .order('uploaded_at', { ascending: false });
    if (!error && data) {
      setSavedDocs(data.map(d => ({
        id: d.id,
        type: d.type,
        fileUrl: d.file_url,
        status: d.status,
        uploadedAt: d.uploaded_at,
      })));
    }
    setLoadingDocs(false);
  }

  // Avatar upload
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    try {
      const { url } = await uploadAvatar(user.id, file);
      await updateProfile({ avatar_url: url });
      setAvatarUrl(url);
    } catch (err) {
      console.error('Avatar upload error:', err);
    }
    setAvatarUploading(false);
  }

  // Document upload
  async function handleDocUpload(docKey: string, complianceType: string, file: File) {
    if (!user) return;
    setUploadingKey(docKey);
    try {
      const { url } = await uploadComplianceDoc(user.id, docKey, file);
      // Save to compliance_documents table
      const { error } = await supabase
        .from('compliance_documents')
        .insert({
          worker_id: user.id,
          type: complianceType,
          file_url: url,
          status: 'UPLOADED',
        });
      if (!error) {
        await loadDocuments();
      } else {
        console.error('Doc save error:', error);
      }
    } catch (err) {
      console.error('Doc upload error:', err);
    }
    setUploadingKey(null);
  }

  // Check if a doc type is already uploaded
  function getDocForType(type: string): SavedDoc | undefined {
    return savedDocs.find(d => d.type === type);
  }

  // Delete a document
  async function handleDeleteDoc(docId: string) {
    const { error } = await supabase
      .from('compliance_documents')
      .delete()
      .eq('id', docId);
    if (!error) {
      setSavedDocs(prev => prev.filter(d => d.id !== docId));
    }
  }

  return (
    <div className="max-w-2xl mx-auto text-[var(--text-primary)]">
      {/* Avatar section */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full rounded-2xl bg-[var(--bg-card)] flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-[var(--text-muted)]" />
              )}
            </div>
          </div>
        </div>
        <p className="text-sm font-bold text-[var(--text-primary)] mt-3">
          {profile ? `${profile.first_name} ${profile.last_name}` : 'Prestataire'}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {avatarUrl && (
            <button
              onClick={() => setViewerUrl(avatarUrl)}
              className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-colors"
            >
              Voir la photo
            </button>
          )}
          <label className={clsx(
            "text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center gap-1.5",
            avatarUrl
              ? "text-[var(--text-muted)] bg-[var(--bg-hover)] border border-[var(--border)] hover:text-[var(--text-primary)]"
              : "text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20"
          )}>
            {avatarUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
            {avatarUrl ? 'Changer' : 'Ajouter une photo'}
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={avatarUploading} />
          </label>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 p-1.5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] mb-6 overflow-x-auto no-scrollbar" style={{ boxShadow: 'var(--shadow-card)' }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'IDENTITY' && (
          <TabContent key="identity">
            <div className="space-y-6">
              {/* Onboarding Stripe Connect */}
              <StripeOnboardingCard />

              {/* Pièce d'identité */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-violet-400" />
                  Pièce d&apos;identité
                </h3>

                {/* Doc type selector */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {DOC_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedDocType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedDocType(opt.id)}
                        className={clsx(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center",
                          isSelected
                            ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                            : "bg-[var(--bg-hover)] border-[var(--border)] text-[var(--text-muted)] hover:border-violet-500/20"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-bold leading-tight">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>

                <UploadZone
                  savedDoc={getDocForType('IDENTITY')}
                  uploading={uploadingKey === 'identity'}
                  onFileChange={(file) => handleDocUpload('identity', 'IDENTITY', file)}
                  onDelete={getDocForType('IDENTITY') ? () => handleDeleteDoc(getDocForType('IDENTITY')!.id) : undefined}
                  onView={(url) => setViewerUrl(url)}
                  label={`Téléverser votre ${DOC_OPTIONS.find(d => d.id === selectedDocType)?.label}`}
                  accept="image/*,.pdf"
                />
              </div>

              {/* Carte Vitale */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  Carte Vitale
                </h3>
                <UploadZone
                  savedDoc={getDocForType('SOCIAL_SECURITY_CARD')}
                  uploading={uploadingKey === 'carte_vitale'}
                  onFileChange={(file) => handleDocUpload('carte_vitale', 'SOCIAL_SECURITY_CARD', file)}
                  onDelete={getDocForType('SOCIAL_SECURITY_CARD') ? () => handleDeleteDoc(getDocForType('SOCIAL_SECURITY_CARD')!.id) : undefined}
                  onView={(url) => setViewerUrl(url)}
                  label="Téléverser votre carte vitale"
                  accept="image/*,.pdf"
                />
              </div>
            </div>
          </TabContent>
        )}

        {activeTab === 'CV' && (
          <TabContent key="cv">
            <div className="space-y-4">
              {/* CV */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Curriculum Vitae
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  Augmentez vos chances d&apos;être sélectionné sur les missions planifiées.
                </p>
                <UploadZone
                  savedDoc={getDocForType('CERTIFICATIONS')}
                  uploading={uploadingKey === 'cv'}
                  onFileChange={(file) => handleDocUpload('cv', 'CERTIFICATIONS', file)}
                  onDelete={getDocForType('CERTIFICATIONS') ? () => handleDeleteDoc(getDocForType('CERTIFICATIONS')!.id) : undefined}
                  onView={(url) => setViewerUrl(url)}
                  label="Téléverser votre CV"
                  accept=".pdf,.doc,.docx"
                />
              </div>

              {/* Documents obligatoires */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  Documents obligatoires
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-5">
                  Requis pour exercer en tant que prestataire indépendant.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Extrait KBIS ou K <span className="text-xs text-[var(--text-muted)]">(moins de 3 mois)</span></label>
                    <UploadZone
                      savedDoc={getDocForType('ATTESTATION_PRO_KBIS')}
                      uploading={uploadingKey === 'kbis'}
                      onFileChange={(file) => handleDocUpload('kbis', 'ATTESTATION_PRO_KBIS', file)}
                      onDelete={getDocForType('ATTESTATION_PRO_KBIS') ? () => handleDeleteDoc(getDocForType('ATTESTATION_PRO_KBIS')!.id) : undefined}
                      onView={(url) => setViewerUrl(url)}
                      label="Téléverser votre KBIS"
                      accept=".pdf,image/*"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Attestation de vigilance URSSAF</label>
                    <UploadZone
                      savedDoc={getDocForType('URSSAF_ATTESTATION')}
                      uploading={uploadingKey === 'urssaf'}
                      onFileChange={(file) => handleDocUpload('urssaf', 'URSSAF_ATTESTATION', file)}
                      onDelete={getDocForType('URSSAF_ATTESTATION') ? () => handleDeleteDoc(getDocForType('URSSAF_ATTESTATION')!.id) : undefined}
                      onView={(url) => setViewerUrl(url)}
                      label="Téléverser votre attestation URSSAF"
                      accept=".pdf,image/*"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Assurance RC Professionnelle</label>
                    <UploadZone
                      savedDoc={getDocForType('RC_PRO')}
                      uploading={uploadingKey === 'rc_pro'}
                      onFileChange={(file) => handleDocUpload('rc_pro', 'RC_PRO', file)}
                      onDelete={getDocForType('RC_PRO') ? () => handleDeleteDoc(getDocForType('RC_PRO')!.id) : undefined}
                      onView={(url) => setViewerUrl(url)}
                      label="Téléverser votre attestation RC Pro"
                      accept=".pdf,image/*"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabContent>
        )}

        {activeTab === 'HISTORY_PAY' && (
          <TabContent key="history_pay">
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
              <ActivityTab />
            </div>
          </TabContent>
        )}
      </AnimatePresence>

      {/* Viewer modal in-app */}
      <AnimatePresence>
        {viewerUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[300] flex items-center justify-center p-4"
            onClick={() => setViewerUrl(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-3xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setViewerUrl(null)}
                className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              {viewerUrl.match(/\.pdf/i) ? (
                <object
                  data={`${viewerUrl}#toolbar=0&navpanes=0&view=FitPage`}
                  type="application/pdf"
                  className="w-full rounded-2xl bg-white"
                  style={{ aspectRatio: '0.707', maxHeight: '85vh' }}
                >
                  <img src={viewerUrl} alt="Document" className="w-full max-h-[85vh] object-contain rounded-2xl" />
                </object>
              ) : (
                <img
                  src={viewerUrl}
                  alt="Document"
                  className="w-full max-h-[85vh] object-contain rounded-2xl"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Tab Content wrapper ───────────────────────── */

function TabContent({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

/* ── Upload Zone ───────────────────────────────── */

function UploadZone({
  savedDoc,
  uploading,
  onFileChange,
  onDelete,
  onView,
  label,
  accept,
}: {
  savedDoc?: SavedDoc;
  uploading: boolean;
  onFileChange: (file: File) => void;
  onDelete?: () => void;
  onView?: (url: string) => void;
  label: string;
  accept: string;
}) {
  const [viewLoading, setViewLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileChange(f);
  };

  async function handleView(fileUrl: string) {
    setViewLoading(true);
    try {
      const match = fileUrl.match(/\/storage\/v1\/object\/public\/compliance\/(.+)$/);
      const url = match ? await getSignedUrl('compliance', match[1], 3600) : fileUrl;
      if (onView) {
        onView(url);
      }
    } catch {
      if (onView) onView(fileUrl);
    }
    setViewLoading(false);
  }

  if (uploading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        <p className="text-sm font-bold text-blue-400">Upload en cours...</p>
      </div>
    );
  }

  if (savedDoc) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-green-400">Document envoyé</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {savedDoc.status === 'VERIFIED' ? 'Vérifié' : 'En attente de vérification'} — {new Date(savedDoc.uploadedAt).toLocaleDateString('fr-FR')}
          </p>
        </div>
        <button
          onClick={() => handleView(savedDoc.fileUrl)}
          disabled={viewLoading}
          className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs font-bold"
        >
          {viewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Voir'}
        </button>
        <label className="p-2 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer" title="Remplacer">
          <Upload className="w-4 h-4" />
          <input type="file" accept={accept} onChange={handleChange} className="hidden" />
        </label>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
            title="Supprimer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-[var(--border)] rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center group-hover:bg-blue-500/10 transition-colors">
        <Upload className="w-6 h-6 text-[var(--text-muted)] group-hover:text-blue-400 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-[var(--text-primary)]">{label}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">PDF, JPG ou PNG — max 10 Mo</p>
      </div>
      <input type="file" accept={accept} onChange={handleChange} className="hidden" />
    </label>
  );
}
