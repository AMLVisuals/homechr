// ============================================================================
// SCHEMA - Database Schema Simulation (DynamoDB Single Table Design)
// This is the "Bible" - all mocks MUST respect these interfaces
// ============================================================================

import type { EquipmentCategory, EquipmentStatus, EquipmentPhoto, MaintenanceRecord } from './equipment';

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * Machine - The central equipment entity (DynamoDB compatible)
 * Primary Key: PK = "MACHINE#${id}", SK = "METADATA"
 */
export interface Machine {
  id: string;                          // ex: "eq_872364"
  ownerId: string;                     // ex: "rest_998" (restaurant owner)
  venueId: string;                     // ex: "venue_123"

  // Core identification
  type: EquipmentCategory;
  brand: string;                       // ex: "La Marzocco"
  model: string;                       // ex: "Linea PB"
  serialNumber: string;
  nickname?: string;                   // User-friendly name
  location: string;                    // Physical location in venue

  // Dates
  installationDate: string;            // ISO Date
  purchaseDate?: string;
  warrantyExpiry?: string;
  lastServiceDate?: string;

  // Status
  status: EquipmentStatus;
  healthScore?: number;                // 0-100

  // Media
  photos: EquipmentPhoto[];
  qrCodeUrl: string;                   // URL vers l'image du QR
  documentUrls?: string[];

  // Flexible metadata (for AI extracted data)
  metadata: {
    voltage?: string;
    power?: string;
    capacity?: string;
    gasType?: string;
    dimensions?: string;
    [key: string]: unknown;
  };

  // DynamoDB metadata
  createdAt: string;
  updatedAt: string;
  GSI1PK?: string;                     // For queries: "VENUE#${venueId}"
  GSI1SK?: string;                     // For sorting: "STATUS#${status}#${createdAt}"
}

/**
 * Mission - Service request/intervention
 * Primary Key: PK = "MISSION#${id}", SK = "METADATA"
 */
export interface Mission {
  id: string;

  // Linking
  machineId?: string;                  // Link to equipment (optional for staffing)
  venueId: string;
  patronId: string;                    // Restaurant owner
  technicianId?: string;               // Assigned technician

  // Mission details
  type: string;                        // Mission type
  title: string;
  description?: string;
  faultType?: string;                  // From equipment fault types

  // Status workflow
  status: 'SEARCHING' | 'ACCEPTED' | 'ON_WAY' | 'ON_SITE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

  // Location
  geo: {
    lat: number;
    lng: number;
    address?: string;
  };

  // Pricing
  price: {
    estimated: number;
    final?: number;
    currency: 'EUR';
  };

  // Scheduling
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  scheduledFor?: string;               // ISO Date
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;

  // Evidence
  photos?: string[];
  beforePhoto?: string;
  afterPhoto?: string;
  report?: string;

  // Review
  rating?: number;
  review?: string;

  // DynamoDB metadata
  createdAt: string;
  updatedAt: string;
  GSI1PK?: string;                     // "PATRON#${patronId}"
  GSI1SK?: string;                     // "STATUS#${status}#${createdAt}"
  GSI2PK?: string;                     // "TECH#${technicianId}"
  GSI2SK?: string;                     // "STATUS#${status}#${createdAt}"
}

/**
 * Technician/Provider - Service provider profile
 * Primary Key: PK = "TECH#${id}", SK = "PROFILE"
 */
export interface Technician {
  id: string;

  // Identity
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;

  // Professional info
  company?: string;
  siret?: string;
  specialties: EquipmentCategory[];    // What they can repair
  certifications?: string[];

  // Stats
  rating: number;
  completedMissions: number;
  responseRate: number;                // 0-100
  onTimeRate: number;                  // 0-100

  // Location & availability
  location: {
    lat: number;
    lng: number;
    city: string;
    radius: number;                    // Max travel distance in km
  };
  isAvailable: boolean;

  // DynamoDB metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Patron/Restaurant Owner
 * Primary Key: PK = "PATRON#${id}", SK = "PROFILE"
 */
export interface Patron {
  id: string;

  // Identity
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;

  // Business
  companyName?: string;
  siret?: string;
  vatNumber?: string;

  // Venues
  venueIds: string[];

  // Preferences
  preferredPaymentMethod?: 'CARD' | 'TRANSFER' | 'CASH';

  // DynamoDB metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Venue/Establishment
 * Primary Key: PK = "VENUE#${id}", SK = "METADATA"
 */
export interface Venue {
  id: string;
  ownerId: string;

  // Basic info
  name: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
  category: string;                    // Restaurant, Bar, Hotel, etc.

  // Location
  geo: {
    lat: number;
    lng: number;
  };

  // Contact
  phone?: string;
  email?: string;

  // Access
  access?: {
    digicode?: string;
    instructions?: string;
    contactName?: string;
    contactPhone?: string;
  };

  // Technical
  technical?: {
    elecType: 'MONO' | 'TRI' | 'UNKNOWN';
    gasType: 'TOWN' | 'BOTTLE' | 'NONE';
    hasFreightElevator: boolean;
  };

  // Stats
  equipmentCount?: number;
  lastMissionDate?: string;

  // DynamoDB metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Maintenance History Record
 * Primary Key: PK = "MACHINE#${machineId}", SK = "HISTORY#${date}#${id}"
 */
export interface MaintenanceHistoryRecord extends MaintenanceRecord {
  // Additional DynamoDB fields
  GSI1PK?: string;                     // "TECH#${technicianId}"
  GSI1SK?: string;                     // "DATE#${date}"
}

// ============================================================================
// PARTIAL TYPES (for updates and creation)
// ============================================================================

export type MachinePartial = Partial<Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>>;
export type MissionPartial = Partial<Omit<Mission, 'id' | 'createdAt' | 'updatedAt'>>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  items: T[];
  nextToken?: string;
  count: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface MachineQuery {
  venueId?: string;
  ownerId?: string;
  status?: EquipmentStatus;
  type?: EquipmentCategory;
  limit?: number;
  nextToken?: string;
}

export interface MissionQuery {
  patronId?: string;
  technicianId?: string;
  venueId?: string;
  machineId?: string;
  status?: Mission['status'];
  limit?: number;
  nextToken?: string;
}
