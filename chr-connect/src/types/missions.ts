// ── Dispute / Litige ──
export type DisputeReason =
  | 'NO_SHOW'              // Le prestataire ne s'est pas présenté
  | 'QUALITY_ISSUE'        // Travail mal fait / non conforme
  | 'INCOMPLETE_WORK'      // Travail inachevé
  | 'DAMAGE'               // Dégât causé pendant l'intervention
  | 'LATE_ARRIVAL'         // Retard important
  | 'UNPROFESSIONAL'       // Comportement non professionnel
  | 'BILLING_DISPUTE'      // Problème de facturation
  | 'OTHER';               // Autre

export type DisputeStatus =
  | 'OPEN'                 // Ticket ouvert, en attente de traitement
  | 'UNDER_REVIEW'         // En cours d'examen par le support
  | 'RESOLVED_PATRON'      // Résolu en faveur du patron
  | 'RESOLVED_PROVIDER'    // Résolu en faveur du prestataire
  | 'CLOSED';              // Fermé

export const DISPUTE_REASONS: Record<DisputeReason, string> = {
  NO_SHOW: 'No-show — Le prestataire ne s\'est pas présenté',
  QUALITY_ISSUE: 'Qualité insuffisante — Travail non conforme',
  INCOMPLETE_WORK: 'Travail inachevé',
  DAMAGE: 'Dégât causé pendant l\'intervention',
  LATE_ARRIVAL: 'Retard important (> 30 min)',
  UNPROFESSIONAL: 'Comportement non professionnel',
  BILLING_DISPUTE: 'Problème de facturation / surfacturation',
  OTHER: 'Autre motif',
};

export type MissionType =
  | 'cold' | 'hot' | 'plumbing' | 'electricity' | 'coffee' | 'beer' // Maintenance
  | 'staff' | 'security' | 'cleaning' | 'dj' | 'aide_menagere' // Staffing
  | 'light' | 'video' | 'sound' | 'pos' | 'network' // Tech
  | 'architecture' | 'decoration' | 'painting' | 'carpentry' // Bâtiment
  | 'MAINTENANCE' | 'STAFFING' | 'CONSULTING' | 'OTHER'; // Legacy/Patron types

export type FilterType = 'all' | 'urgent' | 'high-paying' | MissionType;

export interface Review {
  rating: number;
  comment: string;
  photos: string[];
  videos: string[];
  date: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceHistoryEvent {
  date: string;
  status: 'CREATED' | 'SENT' | 'VIEWED' | 'PAID';
  label: string;
}

export interface Invoice {
  id: string;
  missionId: string;
  number: string;
  date: string;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  items: InvoiceItem[];
  totalAmount: number;
  taxAmount: number; // TVA
  fileUrl?: string; // Simulated PDF URL
  
  // Extended details for "Chef d'oeuvre"
  issuerDetails?: {
    name: string;
    address: string;
    siret: string;
    email: string;
    logo?: string;
  };
  clientDetails?: {
    name: string;
    address: string;
    vatNumber?: string;
  };
  paymentMethod?: {
    type: 'CARD' | 'TRANSFER' | 'CASH';
    last4?: string;
  };
  history?: InvoiceHistoryEvent[];
}

export interface Provider {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  completedMissions: number;
  bio: string;
  phone: string;
  email?: string;
  address?: string;
  siret?: string;
}

export type CandidateStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface MissionCandidate {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  avatar?: string;
  completedMissions: number;
  appliedAt: string; // ISO date
  status: CandidateStatus;
  message?: string; // Optional motivation message
}

export interface Mission {
  id: string;
  title: string;
  venue?: string; // Patron's name/venue
  venueId?: string;
  type?: MissionType;
  price: string | number; // Allow both for compatibility
  distance?: string;
  urgent?: boolean;
  description?: string;
  skills?: string[];
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  matchScore?: number; // 0-100
  expiresAt?: Date;
  photos?: (string | { url: string; caption?: string })[];
  
  // Proof of work
  beforePhoto?: string;
  afterPhoto?: string;
  evidence?: {
    before?: { type: 'PHOTO' | 'VIDEO', url: string };
    after?: { type: 'PHOTO' | 'VIDEO', url: string };
  };
  report?: string;
  
  // Attributes for filtering
  attributes?: {
    interventionType?: string[];
    equipment?: string[];
    role?: string[];
    serviceType?: string;
    establishmentType?: string[];
    expertise?: string[];
    system?: string[];
    urgency?: boolean;
    specialty?: string[];
    machineType?: string;
    style?: string[];
    surface?: string[];
    finish?: string;
  };

  // Patron View Fields
  expert?: string; // Display name of expert/company
  status: 'SEARCHING' | 'SCHEDULED' | 'ON_WAY' | 'ON_SITE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DIAGNOSING' | 'QUOTE_SENT' | 'STANDBY' | 'PENDING_VALIDATION' | 'AWAITING_PATRON_CONFIRMATION' | 'DISPUTED';
  date?: string;
  category?: 'MAINTENANCE' | 'STAFFING' | 'CONSULTING' | 'OTHER'; // Can map to type
  iconName?: 'Wrench' | 'ChefHat' | 'Monitor' | 'Hammer' | 'Zap';
  color?: string;
  notes?: string[];
  provider?: Provider;
  
  // Real-time tracking
  technicianLocation?: { lat: number; lng: number };
  eta?: number; // minutes

  // Persistence
  review?: Review;
  invoice?: Invoice;

  // Post-acceptance workflow fields
  quote?: import('@/components/provider/QuoteBuilderUltimate').FinalQuote;
  quoteRejection?: {
    reason: 'too_expensive' | 'not_needed';
    comment: string;
    rejectedAt: string;
    displacementFeeApplied?: boolean;
    displacementFeeAmount?: number;
  };
  partsStatus?: 'PART_ORDERED' | 'PART_RECEIVED';
  partsDescription?: string;
  staffValidation?: {
    validated: boolean;
    validatedAt?: string;
    hoursWorked?: number;
  };

  // Scheduling
  scheduled?: boolean; // true = planned for later, false/undefined = immediate
  scheduledDate?: string; // ISO date string for planned missions
  requiredWorkers?: number; // nombre de prestataires nécessaires (default 1)

  // Candidature system (planned missions)
  candidates?: MissionCandidate[];

  // Relation fee (entremetteur model)
  paidRelationFee?: boolean;
  relationFeeAmount?: number;

  // ── Conformité & DPAE ──
  dpaeStatus?: import('./compliance').DPAEMissionStatus;
  dpaeReceiptId?: string;        // AEE URSSAF
  actualHoursWorked?: number;
  payslipUrl?: string;

  // Dispute / Litige
  dispute?: {
    reason: DisputeReason;
    description: string;
    photos?: string[];
    createdAt: string;
    status: DisputeStatus;
    resolution?: string;
    resolvedAt?: string;
    replacementMissionId?: string; // Mission gratuite créée en remplacement (no-show)
  };

  // Patron confirmation flow
  pendingWorker?: {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    avatar?: string;
    completedMissions?: number;
    employmentCategory?: import('./compliance').EmploymentCategory;
    // Enriched profile fields
    reliabilityRate?: number;      // Taux de fiabilite 0-100 (missions terminees sans probleme)
    skills?: string[];             // Competences / tags
    distanceKm?: number;           // Distance par rapport a l'etablissement
    recentReviews?: {              // Derniers avis recus
      rating: number;
      comment: string;
      author: string;
      date: string;
    }[];
  };
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  company?: string; // Optional, for external providers
  rating?: number;
  missions: number;
  status: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
  avatar: string;
  tags: string[];
  venueId?: string; // Associated venue ID
  email?: string;
  phone?: string;
}
