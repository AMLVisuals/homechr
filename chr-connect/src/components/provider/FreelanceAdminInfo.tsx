'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, CreditCard, FileCheck, Receipt, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Écran "Informations administratives" auto-entrepreneur.
 * AML Visuals retour produit (20/04/2026) — point 9.
 *
 * Champs : SIRET (14 chiffres), IBAN, TVA (cocher), Forme juridique, Code APE.
 * Affiché uniquement pour les prestataires avec employment_category = 'FREELANCE'.
 */
export default function FreelanceAdminInfo() {
  const { profile, updateProfile } = useAuth();
  const [siret, setSiret] = useState(profile?.siret || '');
  const [iban, setIban] = useState(profile?.iban || '');
  const [vatLiable, setVatLiable] = useState(profile?.vat_liable || false);
  const [apeCode, setApeCode] = useState(profile?.ape_code || '');
  const [legalForm, setLegalForm] = useState(profile?.legal_form || 'AUTO_ENTREPRENEUR');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSiret(profile?.siret || '');
    setIban(profile?.iban || '');
    setVatLiable(profile?.vat_liable || false);
    setApeCode(profile?.ape_code || '');
    setLegalForm(profile?.legal_form || 'AUTO_ENTREPRENEUR');
  }, [profile]);

  if (!profile || profile.employment_category !== 'FREELANCE') return null;

  function validateSiret(value: string): boolean {
    const digits = value.replace(/\s/g, '');
    return /^\d{14}$/.test(digits);
  }

  function validateIban(value: string): boolean {
    const clean = value.replace(/\s/g, '').toUpperCase();
    return /^FR\d{12}[A-Z0-9]{11}\d{2}$/.test(clean);
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    if (siret && !validateSiret(siret)) {
      setError('SIRET invalide (14 chiffres requis).');
      return;
    }
    if (iban && !validateIban(iban)) {
      setError('IBAN invalide (format FR76... avec 27 caractères).');
      return;
    }

    setSaving(true);
    const { error: updateErr } = await updateProfile({
      siret: siret || null,
      iban: iban || null,
      vat_liable: vatLiable,
      ape_code: apeCode || null,
      legal_form: legalForm || null,
    });
    setSaving(false);

    if (updateErr) {
      setError(updateErr.message || 'Erreur sauvegarde');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Receipt className="w-5 h-5 text-emerald-500" />
        <h3 className="font-bold text-[var(--text-primary)]">Informations administratives</h3>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-4">
        Renseignez vos coordonnées fiscales et bancaires pour émettre vos factures en tant qu'auto-entrepreneur.
      </p>

      <div className="space-y-4">
        {/* SIRET */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 flex items-center gap-1">
            <FileCheck className="w-3 h-3" />
            SIRET (14 chiffres)
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={siret}
            onChange={(e) => setSiret(e.target.value.replace(/\D/g, '').slice(0, 14))}
            placeholder="12345678901234"
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Forme juridique */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Forme juridique
          </label>
          <select
            value={legalForm}
            onChange={(e) => setLegalForm(e.target.value)}
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-emerald-500"
          >
            <option value="AUTO_ENTREPRENEUR">Auto-entrepreneur (micro-entreprise)</option>
            <option value="EI">Entreprise individuelle (EI)</option>
            <option value="EURL">EURL</option>
            <option value="SARL">SARL</option>
            <option value="SAS">SAS / SASU</option>
          </select>
        </div>

        {/* Code APE */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">
            Code APE (NAF)
          </label>
          <input
            type="text"
            value={apeCode}
            onChange={(e) => setApeCode(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="5610A"
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-emerald-500 font-mono"
          />
          <p className="text-[10px] text-[var(--text-muted)] mt-1">Ex : 5610A (restauration traditionnelle), 5610C (restauration de type rapide), 7022Z (conseil)...</p>
        </div>

        {/* IBAN */}
        <div>
          <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1 flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            IBAN
          </label>
          <input
            type="text"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            placeholder="FR76 1234 5678 9012 3456 7890 123"
            className="w-full px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-emerald-500 font-mono"
          />
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            Uniquement un RIB bancaire. <strong>Le livret A n'est pas accepté.</strong>
          </p>
        </div>

        {/* TVA */}
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)]">
          <input
            type="checkbox"
            checked={vatLiable}
            onChange={(e) => setVatLiable(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-emerald-500"
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Assujetti à la TVA</p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Cocher si vous dépassez le seuil de franchise (85 800 € HT pour la vente, 34 400 € HT pour les services en 2026).
            </p>
          </div>
        </label>

        {/* Messages */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {saved && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-500 flex items-center gap-2">
            <Check className="w-4 h-4" />
            Informations enregistrées.
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer
            </>
          )}
        </button>
      </div>
    </motion.section>
  );
}
