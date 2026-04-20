// ============================================================================
// ADMIN TYPE SYSTEM
// ============================================================================

export type AdminRole = 'ADMIN' | 'SUPPORT';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
}

export type UserType = 'PATRON' | 'WORKER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
export type SubscriptionPlan = 'FREE' | 'PREMIUM';

export type DocumentStatus = 'VERIFIED' | 'PENDING' | 'MISSING' | 'EXPIRED';

export interface UserDocument {
  id: string;
  label: string;
  status: DocumentStatus;
  required: boolean;
  uploadedAt?: string;
  expiresAt?: string;
  verifiedAt?: string;
  fileName?: string;
}

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  type: UserType;
  city: string;
  missions: number;
  premium: boolean;
  status: UserStatus;
  totalSpent: number;   // For PATRON
  totalEarned: number;  // For WORKER
  createdAt: string;
  establishmentName?: string;
  documents: UserDocument[];
}

export interface Subscription {
  id: string;
  userId: string;
  userName: string;
  establishmentName?: string;
  plan: SubscriptionPlan;
  amount: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
}

export interface RevenueMetrics {
  caMTD: number;          // CA du mois en cours
  matchingFees: number;   // Frais de mise en relation
  subscriptionRevenue: number; // Revenus abonnements
  growthPercent: number;  // Croissance vs mois precedent
}

export interface DashboardStats {
  totalUsers: number;
  patrons: number;
  workers: number;
  premiumSubscribers: number;
  activeMissions: number;
  missionsThisMonth: number;
  newUsersThisWeek: number;
  avgRating: number;
}

export type AdminTab = 'DASHBOARD' | 'USERS' | 'DISPUTES' | 'SUBSCRIPTIONS' | 'STAFF' | 'SETTINGS';

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: AdminRole;
  jobTitle?: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  lastLoginAt?: string;
  notes?: string;
}
