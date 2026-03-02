import type { PlatformUser, Subscription, RevenueMetrics, DashboardStats, UserDocument } from '@/types/admin';
import { PATRON_DOCUMENTS, WORKER_DOCUMENTS } from '@/config/documents';

// --- Helpers pour generer les documents mock ---

function makePatronDocs(overrides: Partial<Record<string, Partial<UserDocument>>> = {}): UserDocument[] {
  const defaults: Record<string, UserDocument> = {
    kbis: { id: 'kbis', label: 'Extrait Kbis', status: 'VERIFIED', required: true, uploadedAt: '2025-09-20', verifiedAt: '2025-09-21', fileName: 'kbis_2025.pdf' },
    identity: { id: 'identity', label: "Pièce d'identité du Gérant", status: 'VERIFIED', required: true, uploadedAt: '2025-09-18', verifiedAt: '2025-09-19', fileName: 'cni_recto_verso.pdf' },
    rib: { id: 'rib', label: 'RIB / IBAN', status: 'VERIFIED', required: true, uploadedAt: '2025-09-18', verifiedAt: '2025-09-19', fileName: 'rib_banque.pdf' },
    license: { id: 'license', label: "Licence d'Exploitation", status: 'MISSING', required: false },
  };
  return PATRON_DOCUMENTS.map((doc) => ({
    ...defaults[doc.id],
    ...overrides[doc.id],
  }));
}

function makeWorkerDocs(overrides: Partial<Record<string, Partial<UserDocument>>> = {}): UserDocument[] {
  const defaults: Record<string, UserDocument> = {
    sirene: { id: 'sirene', label: 'Avis de Situation SIRENE / Kbis', status: 'VERIFIED', required: true, uploadedAt: '2025-10-05', verifiedAt: '2025-10-06', fileName: 'sirene_avis.pdf' },
    identity: { id: 'identity', label: "Pièce d'identité", status: 'VERIFIED', required: true, uploadedAt: '2025-10-04', verifiedAt: '2025-10-05', fileName: 'passeport.pdf' },
    urssaf: { id: 'urssaf', label: 'Attestation de Vigilance URSSAF', status: 'VERIFIED', required: true, uploadedAt: '2025-10-05', verifiedAt: '2025-10-06', expiresAt: '2026-10-05', fileName: 'urssaf_vigilance.pdf' },
    rc_pro: { id: 'rc_pro', label: 'Assurance RC Pro', status: 'VERIFIED', required: true, uploadedAt: '2025-10-03', verifiedAt: '2025-10-04', expiresAt: '2026-10-03', fileName: 'rc_pro_attestation.pdf' },
    decennale: { id: 'decennale', label: 'Assurance Décennale', status: 'MISSING', required: true, uploadedAt: undefined, fileName: undefined },
    certifications: { id: 'certifications', label: 'Certifications / Diplômes', status: 'MISSING', required: false },
  };
  return WORKER_DOCUMENTS.map((doc) => ({
    ...defaults[doc.id],
    ...overrides[doc.id],
  }));
}

export const MOCK_USERS: PlatformUser[] = [
  // u1 - PATRON ACTIVE PREMIUM - tout conforme
  {
    id: 'u1', name: 'Jean-Pierre Martin', email: 'jp.martin@brasserie-martin.fr', type: 'PATRON', city: 'Paris 11e', missions: 24, premium: true, status: 'ACTIVE', totalSpent: 4820, totalEarned: 0, createdAt: '2025-09-15', establishmentName: 'Brasserie Martin',
    documents: makePatronDocs({
      license: { id: 'license', label: "Licence d'Exploitation", status: 'VERIFIED', required: false, uploadedAt: '2025-09-22', verifiedAt: '2025-09-23', fileName: 'licence_IV.pdf' },
    }),
  },
  // u2 - WORKER ACTIVE - URSSAF pending
  {
    id: 'u2', name: 'Sophie Durand', email: 'sophie.d@hotmail.fr', type: 'WORKER', city: 'Paris 3e', missions: 31, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 3720, createdAt: '2025-10-02',
    documents: makeWorkerDocs({
      urssaf: { id: 'urssaf', label: 'Attestation de Vigilance URSSAF', status: 'PENDING', required: true, uploadedAt: '2026-02-28', fileName: 'urssaf_2026.pdf' },
      decennale: { id: 'decennale', label: 'Assurance Décennale', status: 'VERIFIED', required: true, uploadedAt: '2025-10-10', verifiedAt: '2025-10-11', expiresAt: '2026-10-10', fileName: 'decennale.pdf' },
    }),
  },
  // u3 - PATRON ACTIVE PREMIUM - conforme
  {
    id: 'u3', name: 'Marc Leblanc', email: 'marc@le-petit-zinc.fr', type: 'PATRON', city: 'Boulogne-Billancourt', missions: 12, premium: true, status: 'ACTIVE', totalSpent: 2450, totalEarned: 0, createdAt: '2025-11-20', establishmentName: 'Le Petit Zinc',
    documents: makePatronDocs(),
  },
  // u4 - WORKER ACTIVE - tout conforme
  {
    id: 'u4', name: 'Fatima Benali', email: 'fatima.benali@gmail.com', type: 'WORKER', city: 'Saint-Denis', missions: 45, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 5400, createdAt: '2025-08-10',
    documents: makeWorkerDocs({
      decennale: { id: 'decennale', label: 'Assurance Décennale', status: 'VERIFIED', required: true, uploadedAt: '2025-08-15', verifiedAt: '2025-08-16', expiresAt: '2026-08-15', fileName: 'decennale_benali.pdf' },
      certifications: { id: 'certifications', label: 'Certifications / Diplômes', status: 'VERIFIED', required: false, uploadedAt: '2025-08-12', verifiedAt: '2025-08-13', fileName: 'haccp_diplome.pdf' },
    }),
  },
  // u5 - PATRON ACTIVE PREMIUM - conforme + licence
  {
    id: 'u5', name: 'Thomas Petit', email: 'thomas@cafe-de-flore.fr', type: 'PATRON', city: 'Paris 6e', missions: 38, premium: true, status: 'ACTIVE', totalSpent: 7800, totalEarned: 0, createdAt: '2025-07-05', establishmentName: 'Café de Flore',
    documents: makePatronDocs({
      license: { id: 'license', label: "Licence d'Exploitation", status: 'VERIFIED', required: false, uploadedAt: '2025-07-10', verifiedAt: '2025-07-11', fileName: 'licence_restaurant.pdf' },
    }),
  },
  // u6 - WORKER ACTIVE - RC Pro pending
  {
    id: 'u6', name: 'Aminata Diallo', email: 'aminata.d@outlook.fr', type: 'WORKER', city: 'Montreuil', missions: 18, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 2160, createdAt: '2025-12-01',
    documents: makeWorkerDocs({
      rc_pro: { id: 'rc_pro', label: 'Assurance RC Pro', status: 'PENDING', required: true, uploadedAt: '2026-02-20', fileName: 'rc_pro_new.pdf' },
      decennale: { id: 'decennale', label: 'Assurance Décennale', status: 'VERIFIED', required: true, uploadedAt: '2025-12-05', verifiedAt: '2025-12-06', expiresAt: '2026-12-05', fileName: 'decennale_diallo.pdf' },
    }),
  },
  // u7 - PATRON ACTIVE FREE - Kbis expired
  {
    id: 'u7', name: 'Philippe Moreau', email: 'p.moreau@chez-philippe.fr', type: 'PATRON', city: 'Vincennes', missions: 8, premium: false, status: 'ACTIVE', totalSpent: 960, totalEarned: 0, createdAt: '2026-01-10', establishmentName: 'Chez Philippe',
    documents: makePatronDocs({
      kbis: { id: 'kbis', label: 'Extrait Kbis', status: 'EXPIRED', required: true, uploadedAt: '2025-06-10', verifiedAt: '2025-06-11', expiresAt: '2025-09-10', fileName: 'kbis_ancien.pdf' },
    }),
  },
  // u8 - WORKER ACTIVE - tout conforme
  {
    id: 'u8', name: 'Lucie Garnier', email: 'lucie.garnier@gmail.com', type: 'WORKER', city: 'Ivry-sur-Seine', missions: 52, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 6240, createdAt: '2025-06-15',
    documents: makeWorkerDocs({
      decennale: { id: 'decennale', label: 'Assurance Décennale', status: 'VERIFIED', required: true, uploadedAt: '2025-06-20', verifiedAt: '2025-06-21', expiresAt: '2026-06-20', fileName: 'decennale_garnier.pdf' },
      certifications: { id: 'certifications', label: 'Certifications / Diplômes', status: 'VERIFIED', required: false, uploadedAt: '2025-06-18', verifiedAt: '2025-06-19', fileName: 'qualibat.pdf' },
    }),
  },
  // u9 - PATRON ACTIVE PREMIUM - conforme
  {
    id: 'u9', name: 'Nicolas Roux', email: 'nicolas@la-rotonde.fr', type: 'PATRON', city: 'Paris 14e', missions: 15, premium: true, status: 'ACTIVE', totalSpent: 3200, totalEarned: 0, createdAt: '2025-10-28', establishmentName: 'La Rotonde',
    documents: makePatronDocs({
      license: { id: 'license', label: "Licence d'Exploitation", status: 'PENDING', required: false, uploadedAt: '2026-02-15', fileName: 'licence_pending.pdf' },
    }),
  },
  // u10 - WORKER SUSPENDED - docs manquants/expires
  {
    id: 'u10', name: 'Camille Bernard', email: 'camille.b@yahoo.fr', type: 'WORKER', city: 'Nanterre', missions: 27, premium: false, status: 'SUSPENDED', totalSpent: 0, totalEarned: 3240, createdAt: '2025-09-20',
    documents: makeWorkerDocs({
      sirene: { id: 'sirene', label: 'Avis de Situation SIRENE / Kbis', status: 'EXPIRED', required: true, uploadedAt: '2025-03-10', verifiedAt: '2025-03-11', expiresAt: '2025-09-10', fileName: 'sirene_ancien.pdf' },
      urssaf: { id: 'urssaf', label: 'Attestation de Vigilance URSSAF', status: 'MISSING', required: true },
      rc_pro: { id: 'rc_pro', label: 'Assurance RC Pro', status: 'EXPIRED', required: true, uploadedAt: '2024-11-01', verifiedAt: '2024-11-02', expiresAt: '2025-11-01', fileName: 'rc_pro_expire.pdf' },
    }),
  },
  // u11 - PATRON ACTIVE PREMIUM - conforme + licence
  {
    id: 'u11', name: 'François Dubois', email: 'f.dubois@hotel-royal.fr', type: 'PATRON', city: 'Neuilly-sur-Seine', missions: 42, premium: true, status: 'ACTIVE', totalSpent: 9600, totalEarned: 0, createdAt: '2025-05-12', establishmentName: 'Hôtel Royal',
    documents: makePatronDocs({
      license: { id: 'license', label: "Licence d'Exploitation", status: 'VERIFIED', required: false, uploadedAt: '2025-05-15', verifiedAt: '2025-05-16', fileName: 'licence_hotel.pdf' },
    }),
  },
  // u12 - WORKER ACTIVE - identite pending (recente)
  {
    id: 'u12', name: 'Yasmine Khelifi', email: 'yasmine.k@gmail.com', type: 'WORKER', city: 'Aubervilliers', missions: 14, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 1680, createdAt: '2026-01-25',
    documents: makeWorkerDocs({
      identity: { id: 'identity', label: "Pièce d'identité", status: 'PENDING', required: true, uploadedAt: '2026-02-25', fileName: 'cni_khelifi.pdf' },
      decennale: { id: 'decennale', label: 'Assurance Décennale', status: 'VERIFIED', required: true, uploadedAt: '2026-01-28', verifiedAt: '2026-01-29', expiresAt: '2027-01-28', fileName: 'decennale_khelifi.pdf' },
    }),
  },
  // u13 - PATRON SUSPENDED - RIB manquant, Kbis expire
  {
    id: 'u13', name: 'Antoine Leroy', email: 'antoine@bistrot-leroy.fr', type: 'PATRON', city: 'Paris 18e', missions: 6, premium: false, status: 'SUSPENDED', totalSpent: 480, totalEarned: 0, createdAt: '2026-02-01', establishmentName: 'Bistrot Leroy',
    documents: makePatronDocs({
      kbis: { id: 'kbis', label: 'Extrait Kbis', status: 'EXPIRED', required: true, uploadedAt: '2025-08-01', verifiedAt: '2025-08-02', expiresAt: '2025-11-01', fileName: 'kbis_expire.pdf' },
      rib: { id: 'rib', label: 'RIB / IBAN', status: 'MISSING', required: true },
    }),
  },
  // u14 - WORKER ACTIVE - conforme
  {
    id: 'u14', name: 'Chloé Mercier', email: 'chloe.mercier@hotmail.fr', type: 'WORKER', city: 'Créteil', missions: 35, premium: false, status: 'ACTIVE', totalSpent: 0, totalEarned: 4200, createdAt: '2025-08-28',
    documents: makeWorkerDocs({
      decennale: { id: 'decennale', label: 'Assurance Décennale', status: 'VERIFIED', required: true, uploadedAt: '2025-09-01', verifiedAt: '2025-09-02', expiresAt: '2026-09-01', fileName: 'decennale_mercier.pdf' },
    }),
  },
  // u15 - PATRON ACTIVE PREMIUM - conforme + licence
  {
    id: 'u15', name: 'Olivier Girard', email: 'olivier@le-grand-cafe.fr', type: 'PATRON', city: 'Versailles', missions: 20, premium: true, status: 'ACTIVE', totalSpent: 5100, totalEarned: 0, createdAt: '2025-07-18', establishmentName: 'Le Grand Café',
    documents: makePatronDocs({
      license: { id: 'license', label: "Licence d'Exploitation", status: 'VERIFIED', required: false, uploadedAt: '2025-07-20', verifiedAt: '2025-07-21', fileName: 'licence_IV_girard.pdf' },
    }),
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

export const MOCK_REVENUE: RevenueMetrics = {
  caMTD: 12450,
  mrr: 8400,
  commissions: 2450,
  matchingFees: 3200,
  subscriptionRevenue: 6800,
  growthPercent: 11.2,
};

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 156,
  patrons: 72,
  workers: 84,
  premiumSubscribers: 68,
  activeMissions: 23,
  missionsThisMonth: 187,
  newUsersThisWeek: 8,
  avgRating: 4.7,
};
