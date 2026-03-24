'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Shield, Plus, Edit3, Trash2, X, Check, UserPlus, Mail, Clock, Ban, CheckCircle2, Phone, Briefcase, Lock, Eye, EyeOff, StickyNote, KeyRound } from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminStore } from '@/store/useAdminStore';
import type { AdminRole, StaffAccount } from '@/types/admin';

export default function AdminStaffTab() {
  const { staffAccounts, adminUser, addStaffAccount, updateStaffAccount, updateStaffPassword, removeStaffAccount } = useAdminStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<StaffAccount>>({});
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const startEdit = (account: StaffAccount) => {
    setEditingId(account.id);
    setEditData({ name: account.name, email: account.email, phone: account.phone, role: account.role, jobTitle: account.jobTitle, notes: account.notes });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateStaffAccount(editingId, editData);
    setEditingId(null);
  };

  const handleResetPassword = () => {
    if (!resetPasswordId || !newPassword.trim()) return;
    updateStaffPassword(resetPasswordId, newPassword);
    setResetPasswordId(null);
    setNewPassword('');
    setShowNewPassword(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      removeStaffAccount(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Jamais';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const activeCount = staffAccounts.filter((s) => s.status === 'ACTIVE').length;
  const adminCount = staffAccounts.filter((s) => s.role === 'ADMIN' && s.status === 'ACTIVE').length;
  const supportCount = staffAccounts.filter((s) => s.role === 'SUPPORT' && s.status === 'ACTIVE').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Comptes Staff</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Gérez les comptes administrateurs et support</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold transition-all hover:shadow-lg hover:shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Nouveau compte
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{activeCount}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Comptes actifs</div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{adminCount}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Administrateurs</div>
        </div>
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center mb-3">
            <Shield className="w-5 h-5 text-teal-500" />
          </div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{supportCount}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">Support</div>
        </div>
      </div>

      {/* Staff List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="p-5 border-b border-[var(--border)]">
          <h2 className="font-bold text-[var(--text-primary)]">Tous les comptes ({staffAccounts.length})</h2>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {staffAccounts.map((account) => {
            const isEditing = editingId === account.id;
            const isSelf = adminUser?.id === account.id;

            return (
              <div key={account.id} className={clsx("p-5", account.status === 'DISABLED' && "opacity-60")}>
                {isEditing ? (
                  /* ========== Edit Mode ========== */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Nom complet</label>
                        <input
                          value={editData.name || ''}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Email</label>
                        <input
                          value={editData.email || ''}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          type="email"
                          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Téléphone</label>
                        <input
                          value={editData.phone || ''}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          type="tel"
                          placeholder="+33 6 00 00 00 00"
                          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Poste / Fonction</label>
                        <input
                          value={editData.jobTitle || ''}
                          onChange={(e) => setEditData({ ...editData, jobTitle: e.target.value })}
                          placeholder="Ex: Responsable support"
                          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Rôle</label>
                      <div className="flex gap-2">
                        {(['ADMIN', 'SUPPORT'] as AdminRole[]).map((role) => (
                          <button
                            key={role}
                            onClick={() => setEditData({ ...editData, role })}
                            className={clsx(
                              "px-4 py-2 rounded-xl border text-xs font-bold transition-all",
                              editData.role === role
                                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--border-strong)]"
                            )}
                          >
                            {role === 'ADMIN' ? 'Administrateur' : 'Support'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Note interne</label>
                      <textarea
                        value={editData.notes || ''}
                        onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                        placeholder="Note visible uniquement par les admins..."
                        rows={2}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveEdit}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ========== View Mode ========== */
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm",
                      account.status === 'DISABLED'
                        ? "bg-[var(--bg-hover)] text-[var(--text-muted)]"
                        : account.role === 'ADMIN'
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white"
                          : "bg-gradient-to-br from-teal-500 to-cyan-600 text-white"
                    )}>
                      {getInitials(account.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[var(--text-primary)]">{account.name}</h3>
                        <span className={clsx(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          account.role === 'ADMIN' ? "bg-emerald-500/10 text-emerald-500" : "bg-teal-500/10 text-teal-500"
                        )}>
                          {account.role === 'ADMIN' ? 'Administrateur' : 'Support'}
                        </span>
                        {account.status === 'DISABLED' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                            Désactivé
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                            Vous
                          </span>
                        )}
                      </div>

                      {account.jobTitle && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-[var(--text-secondary)]">
                          <Briefcase className="w-3 h-3" />
                          {account.jobTitle}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-1.5 text-xs text-[var(--text-muted)] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {account.email}
                        </span>
                        {account.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {account.phone}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-1 text-[10px] text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Dernière connexion : {formatDate(account.lastLoginAt)}
                        </span>
                        <span>Créé le {formatDate(account.createdAt)}</span>
                      </div>

                      {account.notes && (
                        <div className="flex items-start gap-1 mt-2 text-xs text-[var(--text-muted)] bg-[var(--bg-hover)] rounded-lg px-3 py-2">
                          <StickyNote className="w-3 h-3 mt-0.5 shrink-0" />
                          <span>{account.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {!isSelf && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(account)}
                          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          title="Modifier"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setResetPasswordId(account.id); setNewPassword(''); setShowNewPassword(false); }}
                          className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          title="Réinitialiser mot de passe"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateStaffAccount(account.id, { status: account.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' })}
                          className={clsx(
                            "p-2 rounded-lg transition-colors",
                            account.status === 'ACTIVE'
                              ? "hover:bg-orange-500/10 text-[var(--text-muted)] hover:text-orange-400"
                              : "hover:bg-green-500/10 text-[var(--text-muted)] hover:text-green-400"
                          )}
                          title={account.status === 'ACTIVE' ? 'Désactiver' : 'Réactiver'}
                        >
                          {account.status === 'ACTIVE' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className={clsx(
                            "p-2 rounded-lg transition-colors",
                            confirmDelete === account.id
                              ? "bg-red-500/20 text-red-400"
                              : "hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"
                          )}
                          title={confirmDelete === account.id ? 'Cliquer à nouveau pour confirmer' : 'Supprimer'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Permissions info */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
        <h3 className="font-bold text-sm text-[var(--text-primary)] mb-3">Permissions par rôle</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[var(--bg-hover)] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-400">Administrateur</span>
            </div>
            <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
              <li>- Vue d'ensemble & revenus</li>
              <li>- Gestion utilisateurs</li>
              <li>- Gestion abonnements</li>
              <li>- Gestion comptes staff</li>
              <li>- Paramètres plateforme</li>
            </ul>
          </div>
          <div className="bg-[var(--bg-hover)] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-bold text-teal-400">Support</span>
            </div>
            <ul className="space-y-1 text-xs text-[var(--text-secondary)]">
              <li>- Gestion utilisateurs</li>
              <li>- Gestion abonnements</li>
              <li className="text-[var(--text-muted)] line-through">- Vue d'ensemble (non accessible)</li>
              <li className="text-[var(--text-muted)] line-through">- Comptes staff (non accessible)</li>
              <li className="text-[var(--text-muted)] line-through">- Paramètres (non accessible)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateStaffModal
            onClose={() => setShowCreateModal(false)}
            onCreate={(data) => {
              addStaffAccount(data);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetPasswordId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetPasswordId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-2xl z-[9999] overflow-hidden"
            >
              <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Réinitialiser le mot de passe</h2>
                    <p className="text-xs text-[var(--text-muted)]">
                      {staffAccounts.find(s => s.id === resetPasswordId)?.name}
                    </p>
                  </div>
                </div>
                <button onClick={() => setResetPasswordId(null)} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 caractères"
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 pr-12 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={newPassword.length < 6}
                  className={clsx(
                    "w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                    newPassword.length >= 6
                      ? "bg-orange-600 hover:bg-orange-500 text-white"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"
                  )}
                >
                  <KeyRound className="w-4 h-4" />
                  Réinitialiser
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ========== Create Staff Modal ==========

interface CreateData {
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  jobTitle: string;
  password: string;
  confirmPassword: string;
  notes: string;
}

function CreateStaffModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: { name: string; email: string; phone?: string; role: AdminRole; jobTitle?: string; password: string; notes?: string }) => void;
}) {
  const [data, setData] = useState<CreateData>({
    name: '', email: '', phone: '', role: 'SUPPORT', jobTitle: '', password: '', confirmPassword: '', notes: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const update = (field: keyof CreateData, value: string) => setData(d => ({ ...d, [field]: value }));

  const isStep1Valid = data.name.trim().length >= 2 && data.email.includes('@') && data.email.includes('.');
  const isStep2Valid = data.password.length >= 6 && data.password === data.confirmPassword;

  const handleSubmit = () => {
    onCreate({
      name: data.name,
      email: data.email,
      phone: data.phone || undefined,
      role: data.role,
      jobTitle: data.jobTitle || undefined,
      password: data.password,
      notes: data.notes || undefined,
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
      />
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] md:rounded-3xl bg-[var(--bg-card)] border-0 md:border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Nouveau compte staff</h2>
                <p className="text-xs text-[var(--text-muted)]">Étape {step} sur 2 — {step === 1 ? 'Informations' : 'Sécurité & rôle'}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            <div className={clsx("h-1 flex-1 rounded-full", step >= 1 ? "bg-emerald-500" : "bg-[var(--bg-hover)]")} />
            <div className={clsx("h-1 flex-1 rounded-full", step >= 2 ? "bg-emerald-500" : "bg-[var(--bg-hover)]")} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {step === 1 ? (
            <>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Nom complet <span className="text-red-400">*</span>
                </label>
                <input
                  value={data.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Jean Dupont"
                  autoFocus
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  value={data.email}
                  onChange={(e) => update('email', e.target.value)}
                  type="email"
                  placeholder="jean@home-chr.fr"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Téléphone</label>
                <input
                  value={data.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  type="tel"
                  placeholder="+33 6 00 00 00 00"
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Poste / Fonction</label>
                <input
                  value={data.jobTitle}
                  onChange={(e) => update('jobTitle', e.target.value)}
                  placeholder="Ex: Responsable support, Développeur..."
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!isStep1Valid}
                className={clsx(
                  "w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  isStep1Valid
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/20"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"
                )}
              >
                Suivant
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                  Rôle <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => update('role', 'ADMIN')}
                    className={clsx(
                      "p-4 rounded-xl border text-left transition-all",
                      data.role === 'ADMIN'
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-[var(--border)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    <ShieldCheck className={clsx("w-5 h-5 mb-2", data.role === 'ADMIN' ? "text-emerald-500" : "text-[var(--text-muted)]")} />
                    <div className={clsx("text-sm font-bold", data.role === 'ADMIN' ? "text-emerald-400" : "text-[var(--text-primary)]")}>Administrateur</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Accès complet à la plateforme</div>
                  </button>
                  <button
                    onClick={() => update('role', 'SUPPORT')}
                    className={clsx(
                      "p-4 rounded-xl border text-left transition-all",
                      data.role === 'SUPPORT'
                        ? "border-teal-500/50 bg-teal-500/10"
                        : "border-[var(--border)] hover:border-[var(--border-strong)]"
                    )}
                  >
                    <Shield className={clsx("w-5 h-5 mb-2", data.role === 'SUPPORT' ? "text-teal-500" : "text-[var(--text-muted)]")} />
                    <div className={clsx("text-sm font-bold", data.role === 'SUPPORT' ? "text-teal-400" : "text-[var(--text-primary)]")}>Support</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Utilisateurs & abonnements</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Mot de passe <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={data.password}
                    onChange={(e) => update('password', e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimum 6 caractères"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-12 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {data.password && data.password.length < 6 && (
                  <p className="text-[10px] text-red-400 mt-1">Minimum 6 caractères</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
                  Confirmer le mot de passe <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={data.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Répéter le mot de passe"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                {data.confirmPassword && data.password !== data.confirmPassword && (
                  <p className="text-[10px] text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">Note interne (optionnel)</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => update('notes', e.target.value)}
                  placeholder="Note visible uniquement par les administrateurs..."
                  rows={2}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Recap */}
              <div className="bg-[var(--bg-hover)] rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Récapitulatif</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="text-[var(--text-muted)]">Nom</span>
                  <span className="text-[var(--text-primary)] font-medium">{data.name}</span>
                  <span className="text-[var(--text-muted)]">Email</span>
                  <span className="text-[var(--text-primary)] font-medium">{data.email}</span>
                  {data.phone && <>
                    <span className="text-[var(--text-muted)]">Téléphone</span>
                    <span className="text-[var(--text-primary)] font-medium">{data.phone}</span>
                  </>}
                  {data.jobTitle && <>
                    <span className="text-[var(--text-muted)]">Poste</span>
                    <span className="text-[var(--text-primary)] font-medium">{data.jobTitle}</span>
                  </>}
                  <span className="text-[var(--text-muted)]">Rôle</span>
                  <span className={clsx("font-bold", data.role === 'ADMIN' ? "text-emerald-400" : "text-teal-400")}>
                    {data.role === 'ADMIN' ? 'Administrateur' : 'Support'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isStep2Valid}
                  className={clsx(
                    "flex-1 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                    isStep2Valid
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-lg hover:shadow-emerald-500/20"
                      : "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed"
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                  Créer le compte
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
