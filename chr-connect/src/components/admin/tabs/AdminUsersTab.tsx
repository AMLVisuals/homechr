'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Briefcase, Crown, Ban, X, UserCheck, UserX, CheckCircle2, AlertTriangle, XCircle, Clock, FileText, Shield, CreditCard, Award, Building2, FileCheck } from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminStore } from '@/store/useAdminStore';
import type { PlatformUser, UserStatus, UserDocument, DocumentStatus } from '@/types/admin';

type FilterType = 'ALL' | 'PATRONS' | 'WORKERS' | 'PREMIUM' | 'SUSPENDED' | 'NON_COMPLIANT';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'ALL', label: 'Tous' },
  { id: 'PATRONS', label: 'Patrons' },
  { id: 'WORKERS', label: 'Workers' },
  { id: 'PREMIUM', label: 'Premium' },
  { id: 'SUSPENDED', label: 'Suspendus' },
  { id: 'NON_COMPLIANT', label: 'Non conformes' },
];

// --- Helpers conformite ---

type ComplianceLevel = 'COMPLIANT' | 'PENDING' | 'NON_COMPLIANT';

function getComplianceLevel(documents: UserDocument[]): ComplianceLevel {
  const required = documents.filter((d) => d.required);
  const hasExpiredOrMissing = required.some((d) => d.status === 'EXPIRED' || d.status === 'MISSING');
  if (hasExpiredOrMissing) return 'NON_COMPLIANT';
  const hasPending = required.some((d) => d.status === 'PENDING');
  if (hasPending) return 'PENDING';
  return 'COMPLIANT';
}

const COMPLIANCE_CONFIG: Record<ComplianceLevel, { label: string; bg: string; text: string }> = {
  COMPLIANT: { label: 'Conforme', bg: 'bg-green-500/10', text: 'text-green-500' },
  PENDING: { label: 'En cours', bg: 'bg-amber-500/10', text: 'text-amber-500' },
  NON_COMPLIANT: { label: 'Non conforme', bg: 'bg-red-500/10', text: 'text-red-500' },
};

const DOC_STATUS_CONFIG: Record<DocumentStatus, { label: string; bg: string; text: string; Icon: typeof CheckCircle2 }> = {
  VERIFIED: { label: 'Vérifié', bg: 'bg-green-500/10', text: 'text-green-500', Icon: CheckCircle2 },
  PENDING: { label: 'En attente', bg: 'bg-amber-500/10', text: 'text-amber-500', Icon: Clock },
  EXPIRED: { label: 'Expiré', bg: 'bg-orange-500/10', text: 'text-orange-500', Icon: AlertTriangle },
  MISSING: { label: 'Manquant', bg: 'bg-red-500/10', text: 'text-red-500', Icon: XCircle },
};

function getDocIcon(docId: string) {
  switch (docId) {
    case 'ATTESTATION_PRO_KBIS': return Building2;
    case 'IDENTITY': return Shield;
    case 'RIB': return CreditCard;
    case 'URSSAF_ATTESTATION': return FileCheck;
    case 'RC_PRO': return Shield;
    case 'SOCIAL_SECURITY_CARD': return FileCheck;
    case 'CERTIFICATIONS': return Award;
    default: return FileText;
  }
}

export default function AdminUsersTab() {
  const { adminUser } = useAdminStore();
  const isAdmin = adminUser?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedUser(null);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (filter === 'PATRONS') result = result.filter((u) => u.type === 'PATRON');
    else if (filter === 'WORKERS') result = result.filter((u) => u.type === 'WORKER');
    else if (filter === 'PREMIUM') result = result.filter((u) => u.premium);
    else if (filter === 'SUSPENDED') result = result.filter((u) => u.status === 'SUSPENDED');
    else if (filter === 'NON_COMPLIANT') result = result.filter((u) => getComplianceLevel(u.documents) !== 'COMPLIANT');
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, filter, search]);

  const updateDocStatus = (userId: string, docId: string, newStatus: 'VERIFIED' | 'MISSING') => {
    const today = new Date().toISOString().slice(0, 10);
    const updateDocs = (docs: UserDocument[]): UserDocument[] =>
      docs.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: newStatus,
              ...(newStatus === 'VERIFIED' ? { verifiedAt: today } : { verifiedAt: undefined }),
            }
          : d
      );
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, documents: updateDocs(u.documents) } : u
      )
    );
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, documents: updateDocs(prev.documents) } : null
      );
    }
  };

  const toggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: (u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE') as UserStatus }
          : u
      )
    );
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, status: prev.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : null
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Utilisateurs</h1>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-sm text-[var(--text-muted)]">{users.length} utilisateurs inscrits</p>
          {(() => {
            const nonCompliantCount = users.filter((u) => getComplianceLevel(u.documents) !== 'COMPLIANT').length;
            if (nonCompliantCount === 0) return null;
            return (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                <AlertTriangle className="w-3 h-3" />
                {nonCompliantCount} non conforme{nonCompliantCount > 1 ? 's' : ''}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                'px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                filter === f.id
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                  : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Ville</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Missions</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Docs</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Statut</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Premium</th>
                {isAdmin && (
                  <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Financier</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const compliance = getComplianceLevel(user.documents);
                return (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                          {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)]">{user.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        user.type === 'PATRON' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                      )}>
                        {user.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{user.city}</td>
                    <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{user.missions}</td>
                    <td className="px-4 py-3">
                      {compliance === 'COMPLIANT' ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs font-bold px-2 py-0.5 rounded-full',
                        user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      )}>
                        {user.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.premium && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black">
                          <Crown className="w-3 h-3" />
                          PRO
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-[var(--text-primary)] font-medium">
                        {user.type === 'PATRON'
                          ? `${user.totalSpent.toLocaleString('fr-FR')} € dép.`
                          : `${user.totalEarned.toLocaleString('fr-FR')} € gagné`}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[var(--border)]">
          {filteredUsers.map((user) => {
            const compliance = getComplianceLevel(user.documents);
            return (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="w-full text-left p-4 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-[var(--text-primary)] truncate">{user.name}</span>
                      {user.premium && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {compliance === 'COMPLIANT' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={clsx(
                        'text-[11px] font-bold px-1.5 py-0.5 rounded',
                        user.type === 'PATRON' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                      )}>
                        {user.type}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">{user.city}</span>
                      <span className="text-xs text-[var(--text-muted)]">{user.missions} missions</span>
                    </div>
                  </div>
                  <span className={clsx(
                    'text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0',
                    user.status === 'ACTIVE' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  )}>
                    {user.status === 'ACTIVE' ? 'Actif' : 'Suspendu'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center text-[var(--text-muted)] text-sm">Aucun utilisateur trouvé</div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] z-[110] overflow-hidden flex flex-col max-h-[90vh]"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                <h2 className="font-bold text-lg text-[var(--text-primary)]">Détails utilisateur</h2>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-[var(--bg-hover)] rounded-xl transition-colors">
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto">
                {/* User header + compliance badge */}
                {(() => {
                  const compliance = getComplianceLevel(selectedUser.documents);
                  const config = COMPLIANCE_CONFIG[compliance];
                  return (
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                        {selectedUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg text-[var(--text-primary)]">{selectedUser.name}</h3>
                          <span className={clsx('text-[11px] font-bold px-2 py-0.5 rounded-full', config.bg, config.text)}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] truncate">{selectedUser.email}</p>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Type</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{selectedUser.type}</div>
                  </div>
                  <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Ville</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{selectedUser.city}</div>
                  </div>
                  <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Missions</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{selectedUser.missions}</div>
                  </div>
                  <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                    <div className="text-xs text-[var(--text-muted)] mb-1">Inscrit le</div>
                    <div className="text-sm font-bold text-[var(--text-primary)]">{selectedUser.createdAt}</div>
                  </div>
                  {selectedUser.establishmentName && (
                    <div className="bg-[var(--bg-hover)] rounded-xl p-3 col-span-2">
                      <div className="text-xs text-[var(--text-muted)] mb-1">Établissement</div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">{selectedUser.establishmentName}</div>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="bg-[var(--bg-hover)] rounded-xl p-3 col-span-2">
                      <div className="text-xs text-[var(--text-muted)] mb-1">
                        {selectedUser.type === 'PATRON' ? 'Total dépensé' : 'Total gagné'}
                      </div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        {(selectedUser.type === 'PATRON' ? selectedUser.totalSpent : selectedUser.totalEarned).toLocaleString('fr-FR')} €
                      </div>
                    </div>
                  )}
                </div>

                {/* Documents section */}
                {(() => {
                  const requiredDocs = selectedUser.documents.filter((d) => d.required);
                  const optionalDocs = selectedUser.documents.filter((d) => !d.required);

                  const renderDoc = (doc: UserDocument) => {
                    const statusCfg = DOC_STATUS_CONFIG[doc.status];
                    const DocIcon = getDocIcon(doc.id);
                    return (
                      <div key={doc.id} className="flex items-center gap-3 py-2.5">
                        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', statusCfg.bg)}>
                          <DocIcon className={clsx('w-4 h-4', statusCfg.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.label}</div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {doc.uploadedAt && (
                              <span className="text-[11px] text-[var(--text-muted)]">Deposé le {doc.uploadedAt}</span>
                            )}
                            {doc.expiresAt && (
                              <span className="text-[11px] text-[var(--text-muted)]">· Expire le {doc.expiresAt}</span>
                            )}
                          </div>
                        </div>
                        {doc.status === 'PENDING' ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); updateDocStatus(selectedUser.id, doc.id, 'VERIFIED'); }}
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors"
                            >
                              Valider
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); updateDocStatus(selectedUser.id, doc.id, 'MISSING'); }}
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                            >
                              Refuser
                            </button>
                          </div>
                        ) : (
                          <span className={clsx('text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0', statusCfg.bg, statusCfg.text)}>
                            {statusCfg.label}
                          </span>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Documents</h4>
                      <div className="bg-[var(--bg-hover)] rounded-xl p-3 divide-y divide-[var(--border)]">
                        {requiredDocs.map(renderDoc)}
                        {optionalDocs.length > 0 && (
                          <>
                            <div className="pt-2 pb-1">
                              <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Optionnels</span>
                            </div>
                            {optionalDocs.map(renderDoc)}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={() => toggleStatus(selectedUser.id)}
                  className={clsx(
                    'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-colors',
                    selectedUser.status === 'ACTIVE'
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30'
                      : 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/30'
                  )}
                >
                  {selectedUser.status === 'ACTIVE' ? (
                    <><UserX className="w-4 h-4" /> Suspendre le compte</>
                  ) : (
                    <><UserCheck className="w-4 h-4" /> Réactiver le compte</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
