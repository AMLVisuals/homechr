'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, FileText, History, Upload, Check, X, CreditCard, IdCard, BookOpenText, FileCheck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { HistoryTab } from './tabs/HistoryTab';
import { PayslipsTab } from './tabs/PayslipsTab';

const TABS = [
  { id: 'IDENTITY' as const, label: 'Identité', icon: ShieldCheck, color: 'text-violet-400' },
  { id: 'CV' as const, label: 'Documents', icon: FileText, color: 'text-blue-400' },
  { id: 'HISTORY_PAY' as const, label: 'Historique & Paie', icon: History, color: 'text-amber-400' },
];

type TabId = typeof TABS[number]['id'];

type DocType = 'CNI' | 'PASSPORT' | 'TITRE_SEJOUR';

const DOC_OPTIONS: { id: DocType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'CNI', label: 'Carte d\'identité', icon: IdCard },
  { id: 'PASSPORT', label: 'Passeport', icon: BookOpenText },
  { id: 'TITRE_SEJOUR', label: 'Titre de séjour', icon: FileCheck },
];

export default function ProviderProfileEditor() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'IDENTITY';
    const saved = sessionStorage.getItem('profile-tab');
    if (saved) {
      sessionStorage.removeItem('profile-tab');
      // Map old tab IDs to new ones
      if (saved === 'SKILLS' || saved === 'EXPERIENCE' || saved === 'IDENTITY') return 'IDENTITY';
      if (saved === 'HISTORY' || saved === 'PAYSLIPS') return 'HISTORY_PAY';
    }
    return 'IDENTITY';
  });

  // Document uploads state
  const [selectedDocType, setSelectedDocType] = useState<DocType>('CNI');
  const [identityFileRecto, setIdentityFileRecto] = useState<File | null>(null);
  const [identityFileVerso, setIdentityFileVerso] = useState<File | null>(null);
  const [carteVitaleFile, setCarteVitaleFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [urssafFile, setUrssafFile] = useState<File | null>(null);
  const [rcProFile, setRcProFile] = useState<File | null>(null);
  const [decennaleFile, setDecennaleFile] = useState<File | null>(null);
  const [historyView, setHistoryView] = useState<'history' | 'payslips'>('history');

  return (
    <div className="max-w-2xl mx-auto text-[var(--text-primary)]">
      {/* Tab bar — same style as WorkerMissionsPage */}
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

                {/* Upload zone(s) — recto/verso uniquement pour CNI */}
                {selectedDocType === 'CNI' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-secondary)] mb-2 block uppercase tracking-wide">Recto</label>
                      <UploadZone
                        file={identityFileRecto}
                        onFileChange={setIdentityFileRecto}
                        label="Recto"
                        accept="image/*,.pdf"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[var(--text-secondary)] mb-2 block uppercase tracking-wide">Verso</label>
                      <UploadZone
                        file={identityFileVerso}
                        onFileChange={setIdentityFileVerso}
                        label="Verso"
                        accept="image/*,.pdf"
                      />
                    </div>
                  </div>
                ) : (
                  <UploadZone
                    file={identityFileRecto}
                    onFileChange={setIdentityFileRecto}
                    label={`Téléverser votre ${DOC_OPTIONS.find(d => d.id === selectedDocType)?.label}`}
                    accept="image/*,.pdf"
                  />
                )}
              </div>

              {/* Carte Vitale */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  Carte Vitale
                </h3>
                <UploadZone
                  file={carteVitaleFile}
                  onFileChange={setCarteVitaleFile}
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
                <UploadZone file={cvFile} onFileChange={setCvFile} label="Téléverser votre CV" accept=".pdf,.doc,.docx" />
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
                    <UploadZone file={kbisFile} onFileChange={setKbisFile} label="Téléverser votre KBIS" accept=".pdf,image/*" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Attestation de vigilance URSSAF</label>
                    <UploadZone file={urssafFile} onFileChange={setUrssafFile} label="Téléverser votre attestation URSSAF" accept=".pdf,image/*" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Assurance RC Professionnelle</label>
                    <UploadZone file={rcProFile} onFileChange={setRcProFile} label="Téléverser votre attestation RC Pro" accept=".pdf,image/*" />
                  </div>
                </div>
              </div>

              {/* Documents métier */}
              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                <h3 className="font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Documents métier <span className="text-xs font-normal text-[var(--text-muted)]">(selon votre activité)</span>
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-5">
                  Habilitations et garanties spécifiques à votre domaine d&apos;intervention.
                </p>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Garantie décennale <span className="text-xs text-[var(--text-muted)]">(bâtiment, plomberie, électricité)</span></label>
                  <UploadZone file={decennaleFile} onFileChange={setDecennaleFile} label="Téléverser votre attestation décennale" accept=".pdf,image/*" />
                </div>
              </div>
            </div>
          </TabContent>
        )}

        {activeTab === 'HISTORY_PAY' && (
          <TabContent key="history_pay">
            <div className="space-y-4">
              {/* Sub-toggle */}
              <div className="flex gap-2 p-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                <button
                  onClick={() => setHistoryView('history')}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-bold transition-all text-center",
                    historyView === 'history'
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  Historique
                </button>
                <button
                  onClick={() => setHistoryView('payslips')}
                  className={clsx(
                    "flex-1 py-2 rounded-lg text-sm font-bold transition-all text-center",
                    historyView === 'payslips'
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  Fiches de paie
                </button>
              </div>

              <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
                {historyView === 'history' ? <HistoryTab /> : <PayslipsTab />}
              </div>
            </div>
          </TabContent>
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
  file,
  onFileChange,
  label,
  accept,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  label: string;
  accept: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFileChange(f);
  };

  if (file) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-500/5 border border-green-500/20 rounded-xl">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-green-400 truncate">{file.name}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{(file.size / 1024).toFixed(0)} Ko</p>
        </div>
        <button
          onClick={() => onFileChange(null)}
          className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
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
