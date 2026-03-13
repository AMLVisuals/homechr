import type { PlatformUser, Subscription, RevenueMetrics, DashboardStats, UserDocument } from '@/types/admin';
import { PATRON_DOCUMENTS, EXTRA_DOCUMENTS, FREELANCE_DOCUMENTS } from '@/config/documents';

// --- Helpers pour generer les documents mock ---

type WorkerSubtype = 'EXTRA' | 'FREELANCE';

function makePatronDocs(overrides: Partial<Record<string, Partial<UserDocument>>> = {}): UserDocument[] {
  const defaults: Record<string, UserDocument> = {
    IDENTITY: { id: 'IDENTITY', label: "Pièce d'identité du Gérant", status: 'VERIFIED', required: true, uploadedAt: '2025-09-18', verifiedAt: '2025-09-19', fileName: 'cni_recto_verso.pdf' },
    ATTESTATION_PRO_KBIS: { id: 'ATTESTATION_PRO_KBIS', label: 'Kbis', status: 'VERIFIED', required: true, uploadedAt: '2025-09-20', verifiedAt: '2025-09-21', fileName: 'kbis_2025.pdf' },
    RIB: { id: 'RIB', label: 'RIB / IBAN', status: 'VERIFIED', required: true, uploadedAt: '2025-09-18', verifiedAt: '2025-09-19', fileName: 'rib_banque.pdf' },
  };
  return PATRON_DOCUMENTS.map((doc) => ({
    ...defaults[doc.id],
    ...overrides[doc.id],
  }));
}

function makeWorkerDocs(subtype: WorkerSubtype, overrides: Partial<Record<string, Partial<UserDocument>>> = {}): UserDocument[] {
  const template = subtype === 'EXTRA' ? EXTRA_DOCUMENTS : FREELANCE_DOCUMENTS;

  const extraDefaults: Record<string, UserDocument> = {
    IDENTITY: { id: 'IDENTITY', label: "Pièce d'identité", status: 'VERIFIED', required: true, uploadedAt: '2025-10-04', verifiedAt: '2025-10-05', fileName: 'passeport.pdf' },
    RIB: { id: 'RIB', label: 'RIB / IBAN', status: 'VERIFIED', required: true, uploadedAt: '2025-10-05', verifiedAt: '2025-10-06', fileName: 'rib_worker.pdf' },
    SOCIAL_SECURITY_CARD: { id: 'SOCIAL_SECURITY_CARD', label: 'Carte Vitale ou Attestation sécu', status: 'VERIFIED', required: true, uploadedAt: '2025-10-05', verifiedAt: '2025-10-06', fileName: 'carte_vitale.pdf' },
    CERTIFICATIONS: { id: 'CERTIFICATIONS', label: 'Certifications / Diplômes', status: 'MISSING', required: false },
  };

  const freelanceDefaults: Record<string, UserDocument> = {
    IDENTITY: { id: 'IDENTITY', label: "Pièce d'identité", status: 'VERIFIED', required: true, uploadedAt: '2025-10-04', verifiedAt: '2025-10-05', fileName: 'passeport.pdf' },
    ATTESTATION_PRO_KBIS: { id: 'ATTESTATION_PRO_KBIS', label: 'Attestation Pro / Kbis', status: 'VERIFIED', required: true, uploadedAt: '2025-10-05', verifiedAt: '2025-10-06', fileName: 'kbis_pro.pdf' },
    URSSAF_ATTESTATION: { id: 'URSSAF_ATTESTATION', label: 'Attestation de Vigilance URSSAF', status: 'VERIFIED', required: true, uploadedAt: '2025-10-05', verifiedAt: '2025-10-06', expiresAt: '2026-10-05', fileName: 'urssaf_vigilance.pdf' },
    RC_PRO: { id: 'RC_PRO', label: 'Assurance RC Pro', status: 'VERIFIED', required: true, uploadedAt: '2025-10-03', verifiedAt: '2025-10-04', expiresAt: '2026-10-03', fileName: 'rc_pro_attestation.pdf' },
    CERTIFICATIONS: { id: 'CERTIFICATIONS', label: 'Certifications / Diplômes', status: 'MISSING', required: false },
  };

  const defaults = subtype === 'EXTRA' ? extraDefaults : freelanceDefaults;

  return template.map((doc) => ({
    ...defaults[doc.id],
    ...overrides[doc.id],
  }));
}

export const MOCK_USERS: PlatformUser[] = [
  // u1 - PATRON ACTIVE PREMIUM - tout conforme
  {
    id: 'u1', name: 'Jean-Pierre Martin', email: 'jp.martin@brasserie-martin.fr', type: 'PATRON', city: 'Paris 11e', missions: 24, premium: true, status: 'ACTIVE', totalSpent: 4820, totalEarned: 0, createdAt: '2025-09-15', establishmentName: 'Brasserie Martin',
    documents: makePatronDocs(),
  },
  // u2 - WORKER FREELANCE ACTIVE - URSSAF pending
  {
    id: 'u2', name: 'Sophie Durand', email: 'sophie.d@hotmail.fr', type: 'WORKER', city: 'Paris 3e', missions: 31, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 3720, createdAt: '2025-10-02',
    documents: makeWorkerDocs('FREELANCE', {
      URSSAF_ATTESTATION: { id: 'URSSAF_ATTESTATION', label: 'Attestation de Vigilance URSSAF', status: 'PENDING', required: true, uploadedAt: '2026-02-28', fileName: 'urssaf_2026.pdf' },
    }),
  },
  // u3 - PATRON ACTIVE PREMIUM - conforme
  {
    id: 'u3', name: 'Marc Leblanc', email: 'marc@le-petit-zinc.fr', type: 'PATRON', city: 'Boulogne-Billancourt', missions: 12, premium: true, status: 'ACTIVE', totalSpent: 2450, totalEarned: 0, createdAt: '2025-11-20', establishmentName: 'Le Petit Zinc',
    documents: makePatronDocs(),
  },
  // u4 - WORKER EXTRA ACTIVE - tout conforme
  {
    id: 'u4', name: 'Fatima Benali', email: 'fatima.benali@gmail.com', type: 'WORKER', city: 'Saint-Denis', missions: 45, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 5400, createdAt: '2025-08-10',
    documents: makeWorkerDocs('EXTRA', {
      CERTIFICATIONS: { id: 'CERTIFICATIONS', label: 'Certifications / Diplômes', status: 'VERIFIED', required: false, uploadedAt: '2025-08-12', verifiedAt: '2025-08-13', fileName: 'haccp_diplome.pdf' },
    }),
  },
  // u5 - PATRON ACTIVE PREMIUM - conforme
  {
    id: 'u5', name: 'Thomas Petit', email: 'thomas@cafe-de-flore.fr', type: 'PATRON', city: 'Paris 6e', missions: 38, premium: true, status: 'ACTIVE', totalSpent: 7800, totalEarned: 0, createdAt: '2025-07-05', establishmentName: 'Café de Flore',
    documents: makePatronDocs(),
  },
  // u6 - WORKER FREELANCE ACTIVE - RC Pro pending
  {
    id: 'u6', name: 'Aminata Diallo', email: 'aminata.d@outlook.fr', type: 'WORKER', city: 'Montreuil', missions: 18, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 2160, createdAt: '2025-12-01',
    documents: makeWorkerDocs('FREELANCE', {
      RC_PRO: { id: 'RC_PRO', label: 'Assurance RC Pro', status: 'PENDING', required: true, uploadedAt: '2026-02-20', fileName: 'rc_pro_new.pdf' },
    }),
  },
  // u7 - PATRON SUSPENDED - Kbis expired
  {
    id: 'u7', name: 'Philippe Moreau', email: 'p.moreau@chez-philippe.fr', type: 'PATRON', city: 'Vincennes', missions: 8, premium: false, status: 'SUSPENDED', totalSpent: 960, totalEarned: 0, createdAt: '2026-01-10', establishmentName: 'Chez Philippe',
    documents: makePatronDocs({
      ATTESTATION_PRO_KBIS: { id: 'ATTESTATION_PRO_KBIS', label: 'Kbis', status: 'EXPIRED', required: true, uploadedAt: '2025-06-10', verifiedAt: '2025-06-11', expiresAt: '2025-09-10', fileName: 'kbis_ancien.pdf' },
    }),
  },
  // u8 - WORKER FREELANCE ACTIVE - tout conforme
  {
    id: 'u8', name: 'Lucie Garnier', email: 'lucie.garnier@gmail.com', type: 'WORKER', city: 'Ivry-sur-Seine', missions: 52, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 6240, createdAt: '2025-06-15',
    documents: makeWorkerDocs('FREELANCE', {
      CERTIFICATIONS: { id: 'CERTIFICATIONS', label: 'Certifications / Diplômes', status: 'VERIFIED', required: false, uploadedAt: '2025-06-18', verifiedAt: '2025-06-19', fileName: 'qualibat.pdf' },
    }),
  },
  // u9 - PATRON ACTIVE PREMIUM - conforme
  {
    id: 'u9', name: 'Nicolas Roux', email: 'nicolas@la-rotonde.fr', type: 'PATRON', city: 'Paris 14e', missions: 15, premium: true, status: 'ACTIVE', totalSpent: 3200, totalEarned: 0, createdAt: '2025-10-28', establishmentName: 'La Rotonde',
    documents: makePatronDocs(),
  },
  // u10 - WORKER FREELANCE SUSPENDED - docs expires
  {
    id: 'u10', name: 'Camille Bernard', email: 'camille.b@yahoo.fr', type: 'WORKER', city: 'Nanterre', missions: 27, premium: false, status: 'SUSPENDED', totalSpent: 0, totalEarned: 3240, createdAt: '2025-09-20',
    documents: makeWorkerDocs('FREELANCE', {
      ATTESTATION_PRO_KBIS: { id: 'ATTESTATION_PRO_KBIS', label: 'Attestation Pro / Kbis', status: 'EXPIRED', required: true, uploadedAt: '2025-03-10', verifiedAt: '2025-03-11', expiresAt: '2025-09-10', fileName: 'kbis_ancien.pdf' },
      URSSAF_ATTESTATION: { id: 'URSSAF_ATTESTATION', label: 'Attestation de Vigilance URSSAF', status: 'MISSING', required: true },
      RC_PRO: { id: 'RC_PRO', label: 'Assurance RC Pro', status: 'EXPIRED', required: true, uploadedAt: '2024-11-01', verifiedAt: '2024-11-02', expiresAt: '2025-11-01', fileName: 'rc_pro_expire.pdf' },
    }),
  },
  // u11 - PATRON ACTIVE PREMIUM - conforme
  {
    id: 'u11', name: 'François Dubois', email: 'f.dubois@hotel-royal.fr', type: 'PATRON', city: 'Neuilly-sur-Seine', missions: 42, premium: true, status: 'ACTIVE', totalSpent: 9600, totalEarned: 0, createdAt: '2025-05-12', establishmentName: 'Hôtel Royal',
    documents: makePatronDocs(),
  },
  // u12 - WORKER EXTRA ACTIVE - identite pending
  {
    id: 'u12', name: 'Yasmine Khelifi', email: 'yasmine.k@gmail.com', type: 'WORKER', city: 'Aubervilliers', missions: 14, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 1680, createdAt: '2026-01-25',
    documents: makeWorkerDocs('EXTRA', {
      IDENTITY: { id: 'IDENTITY', label: "Pièce d'identité", status: 'PENDING', required: true, uploadedAt: '2026-02-25', fileName: 'cni_khelifi.pdf' },
    }),
  },
  // u13 - PATRON SUSPENDED - RIB manquant, Kbis expire
  {
    id: 'u13', name: 'Antoine Leroy', email: 'antoine@bistrot-leroy.fr', type: 'PATRON', city: 'Paris 18e', missions: 6, premium: false, status: 'SUSPENDED', totalSpent: 480, totalEarned: 0, createdAt: '2026-02-01', establishmentName: 'Bistrot Leroy',
    documents: makePatronDocs({
      ATTESTATION_PRO_KBIS: { id: 'ATTESTATION_PRO_KBIS', label: 'Kbis', status: 'EXPIRED', required: true, uploadedAt: '2025-08-01', verifiedAt: '2025-08-02', expiresAt: '2025-11-01', fileName: 'kbis_expire.pdf' },
      RIB: { id: 'RIB', label: 'RIB / IBAN', status: 'MISSING', required: true },
    }),
  },
  // u14 - WORKER FREELANCE ACTIVE - conforme
  {
    id: 'u14', name: 'Chloé Mercier', email: 'chloe.mercier@hotmail.fr', type: 'WORKER', city: 'Créteil', missions: 35, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 4200, createdAt: '2025-08-28',
    documents: makeWorkerDocs('FREELANCE'),
  },
  // u15 - PATRON ACTIVE PREMIUM - conforme
  {
    id: 'u15', name: 'Olivier Girard', email: 'olivier@le-grand-cafe.fr', type: 'PATRON', city: 'Versailles', missions: 20, premium: true, status: 'ACTIVE', totalSpent: 5100, totalEarned: 0, createdAt: '2025-07-18', establishmentName: 'Le Grand Café',
    documents: makePatronDocs(),
  },
];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub1', userId: 'u1', userName: 'Jean-Pierre Martin', establishmentName: 'Brasserie Martin', plan: 'PREMIUM', amount: 100, startDate: '2025-11-01', endDate: '2026-11-01', status: 'ACTIVE' },
  { id: 'sub2', userId: 'u3', userName: 'Marc Leblanc', establishmentName: 'Le Petit Zinc', plan: 'PREMIUM', amount: 100, startDate: '2025-12-15', endDate: '2026-12-15', status: 'ACTIVE' },
  { id: 'sub3', userId: 'u5', userName: 'Thomas Petit', establishmentName: 'Café de Flore', plan: 'PREMIUM', amount: 100, startDate: '2025-09-01', endDate: '2026-09-01', status: 'ACTIVE' },
  { id: 'sub4', userId: 'u9', userName: 'Nicolas Roux', establishmentName: 'La Rotonde', plan: 'PREMIUM', amount: 100, startDate: '2026-01-10', endDate: '2027-01-10', status: 'ACTIVE' },
  { id: 'sub5', userId: 'u11', userName: 'François Dubois', establishmentName: 'Hôtel Royal', plan: 'PREMIUM', amount: 100, startDate: '2025-06-01', endDate: '2026-06-01', status: 'ACTIVE' },
  { id: 'sub6', userId: 'u15', userName: 'Olivier Girard', establishmentName: 'Le Grand Café', plan: 'PREMIUM', amount: 100, startDate: '2025-08-20', endDate: '2026-08-20', status: 'ACTIVE' },
  { id: 'sub7', userId: 'u13', userName: 'Antoine Leroy', establishmentName: 'Bistrot Leroy', plan: 'PREMIUM', amount: 100, startDate: '2025-10-01', endDate: '2026-04-01', status: 'CANCELLED' },
  { id: 'sub8', userId: 'u7', userName: 'Philippe Moreau', establishmentName: 'Chez Philippe', plan: 'PREMIUM', amount: 100, startDate: '2025-03-01', endDate: '2025-09-01', status: 'EXPIRED' },
];

// Revenus cohérents avec le modèle entremetteur :
// - 6 abonnés premium actifs × 100€ = 600€ abonnements
// - Frais mise en relation : ~160 missions free × 20€ = 3200€ (matching fees)
// - CA total = 600 + 3200 = 3800€
export const MOCK_REVENUE: RevenueMetrics = {
  caMTD: 3800,
  matchingFees: 3200,
  subscriptionRevenue: 600,
  growthPercent: 11.2,
};

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 156,
  patrons: 72,
  workers: 84,
  premiumSubscribers: 6,
  activeMissions: 23,
  missionsThisMonth: 187,
  newUsersThisWeek: 8,
  avgRating: 4.7,
};
