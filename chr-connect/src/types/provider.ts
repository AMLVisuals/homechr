export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  missionTitle?: string;
}

export interface PortfolioItem {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'BEFORE_AFTER';
  url: string; // Main image or AFTER image
  beforeUrl?: string; // BEFORE image for sliders
  title: string;
  description?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  dateObtained: string;
  expiryDate?: string;
  isVerified: boolean;
  documentUrl?: string;
}

export interface Experience {
  id: string;
  role: string;
  company: string;
  startDate: string;
  endDate?: string; // undefined = current
  description: string;
}

export interface ProviderProfile {
  id: string;
  firstName: string;
  lastName: string;
  title: string; // e.g., "Chef de Partie", "Plombier"
  bio: string;
  avatarUrl: string;
  location: {
    city: string;
    latitude?: number;
    longitude?: number;
  };
  stats: {
    rating: number;
    missionsCompleted: number;
    responseRate: number; // percentage
    onTimeRate: number; // percentage
  };
  skills: string[];
  certifications: Certification[];
  portfolio: PortfolioItem[];
  experiences: Experience[];
  reviews: Review[];
  languages: string[];
  badges: ('GOLD' | 'VERIFIED' | 'NEW' | 'TOP_RATED')[];
  preferences: {
    radius: number;
    minHourlyRate: number;
    availabilityBadges: string[]; // 'Matin', 'Soir', 'Week-end'
  };
  availability: {
    isAvailable: boolean;
    nextSlot?: string;
  };

  // CV / Resume
  cvUrl?: string;

  // ── Conformité légale ──
  employmentCategory: import('./compliance').EmploymentCategory;
  complianceStatus: import('./compliance').ComplianceStatus;
  siretNumber?: string;
  kbisVerifiedAt?: string;
  urssafVerifiedAt?: string;
}
