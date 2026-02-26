// ============================================================================
// KNOWLEDGE BASE TYPES - Architecture OCOA (Object-Context Oriented Architecture)
// ============================================================================
// Ce fichier définit les types pour le système de diagnostic intelligent
// basé sur une taxonomie stricte et des arbres de décision IA

import type { EquipmentCategory } from '@/types/equipment';

// ============================================================================
// ENERGY & TECHNICAL SPECIFICATIONS
// ============================================================================

export type EnergyType = 'ELECTRIC_MONO' | 'ELECTRIC_TRI' | 'GAS_NATURAL' | 'GAS_PROPANE' | 'HYBRID';
export type CoolingType = 'AIR' | 'WATER';
export type RefrigerantType = 'R134a' | 'R290' | 'R404A' | 'R452A' | 'R600a' | 'R32' | 'OTHER';
export type CompressorLocation = 'INTEGRATED' | 'REMOTE'; // Logé vs À distance

// ============================================================================
// EQUIPMENT FAMILY SYSTEM
// ============================================================================

export type EquipmentFamilyId =
  | 'COLD'           // Froid (Réfrigération & Congélation)
  | 'HOT'            // Chaud (Cuisson & Maintien)
  | 'BEVERAGE'       // Boissons (Café, Bière, Glaces)
  | 'HYGIENE'        // Hygiène (Plonge, Ventilation)
  | 'TECH_AV'        // Tech & Audiovisuel
  | 'BUILDING'       // Bâtiment (Plomberie, Électricité, etc.)
  | 'STAFFING';      // Ressources Humaines

export interface EquipmentFamily {
  id: EquipmentFamilyId;
  label: string;
  description: string;
  icon: string;
  color: string;
  categories: EquipmentSubCategory[];
  commonSkills: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  regulatoryRequirements?: string[];
}

// ============================================================================
// EQUIPMENT SUB-CATEGORIES (Granular Classification)
// ============================================================================

export interface EquipmentSubCategory {
  id: string;
  familyId: EquipmentFamilyId;
  label: string;
  description: string;
  icon: string;
  equipmentTypes: EquipmentTypeDefinition[];
  defaultEnergyType?: EnergyType;
  requiredCertifications?: string[]; // Ex: Qualigaz, Habilitation électrique
}

export interface EquipmentTypeDefinition {
  id: string;
  label: string;
  description: string;
  brands?: string[]; // Marques courantes
  specifications: TechnicalSpecification[];
  commonProblems: string[]; // IDs des problèmes
  maintenanceInterval?: number; // Jours entre maintenances préventives
  avgLifespan?: number; // Années
  priceRangeNew?: { min: number; max: number };
}

export interface TechnicalSpecification {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  unit?: string;
  options?: string[];
  required?: boolean;
  helpText?: string;
}

// ============================================================================
// DIAGNOSTIC SYSTEM - Arbres de Décision IA
// ============================================================================

export type ProblemSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProblemType =
  | 'MECHANICAL'     // Mécanique (moteurs, courroies, etc.)
  | 'ELECTRICAL'     // Électrique (résistances, câblage, etc.)
  | 'REFRIGERANT'    // Frigorifique (gaz, compresseur, etc.)
  | 'HYDRAULIC'      // Hydraulique (fuites, vannes, etc.)
  | 'THERMAL'        // Thermique (surchauffe, thermostat, etc.)
  | 'CONTROL'        // Contrôle (capteurs, électronique, etc.)
  | 'CONSUMABLE'     // Consommable (joints, filtres, etc.)
  | 'CLEANING'       // Nettoyage (entartrage, encrassement, etc.)
  | 'GAS'            // Gaz (veilleuse, thermocouple, etc.)
  | 'SOFTWARE';      // Logiciel (firmware, config, etc.)

export interface DiagnosticProblem {
  id: string;
  categoryId: string; // Lié à EquipmentSubCategory
  label: string;
  description: string;
  severity: ProblemSeverity;
  type: ProblemType;

  // Symptômes observables par l'utilisateur
  symptoms: Symptom[];

  // Causes racines possibles (ordonnées par probabilité)
  rootCauses: RootCause[];

  // Arbre de diagnostic (questions à poser)
  diagnosticTree?: DiagnosticNode;

  // Actions recommandées
  immediateActions: string[]; // Ce que le patron peut faire immédiatement
  professionalActions: string[]; // Ce que le technicien doit faire

  // Estimations
  estimatedResponseTime: string;
  priceRange: { min: number; max: number };
  estimatedDowntime?: string;

  // Compétences requises pour l'intervention
  requiredSkills: string[];
  requiredCertifications?: string[];

  // Risques associés
  safetyHazards?: string[];
  regulatoryImplications?: string[];

  // Problèmes liés (peut causer ou être causé par)
  relatedProblemIds?: string[];
}

export interface Symptom {
  id: string;
  description: string;
  userQuestion: string; // Question à poser à l'utilisateur
  observationType: 'VISUAL' | 'AUDITORY' | 'TACTILE' | 'OLFACTORY' | 'FUNCTIONAL';
}

export interface RootCause {
  id: string;
  description: string;
  probability: number; // 0-1
  diagnosticClues: string[];
  requiredParts?: string[];
  repairComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX' | 'SPECIALIST';
}

// ============================================================================
// DIAGNOSTIC TREE - Arbre de Décision Interactif
// ============================================================================

export interface DiagnosticNode {
  id: string;
  type: 'QUESTION' | 'ACTION' | 'CONCLUSION';
  content: string;
  helpText?: string;

  // Pour les questions
  answers?: DiagnosticAnswer[];

  // Pour les conclusions
  concludedProblemId?: string;
  confidence?: number; // 0-1

  // Actions immédiates suggérées
  suggestedAction?: string;
}

export interface DiagnosticAnswer {
  id: string;
  text: string;
  nextNodeId?: string;
  weight?: number; // Impact sur le score de probabilité
}

// ============================================================================
// STAFFING SYSTEM - Profils Métiers Dynamiques
// ============================================================================

export type StaffingCategory =
  | 'SERVICE'        // Salle (Serveur, Chef de Rang, etc.)
  | 'CUISINE'        // Cuisine (Chef, Commis, Plongeur)
  | 'BAR'            // Bar (Barman, Sommelier)
  | 'RECEPTION'      // Accueil (Hôte/Hôtesse, Vestiaire)
  | 'SECURITY'       // Sécurité (Videur, Agent)
  | 'MANAGEMENT';    // Management (Maître d'Hôtel, Directeur)

export interface StaffingProfile {
  id: string;
  category: StaffingCategory;
  role: string;
  description: string;
  icon: string;

  // Critères de sélection
  hardSkills: HardSkill[];
  softSkills: SoftSkill[];

  // Conditions
  hourlyRateRange: { min: number; max: number };
  typicalShiftDuration: number; // Heures

  // Qualifications
  requiredCertifications?: string[];
  preferredExperience?: string;
  languageRequirements?: string[];

  // Matching weights
  matchingCriteria: MatchingCriterion[];
}

export interface HardSkill {
  id: string;
  label: string;
  description: string;
  weight: number; // Importance 0-1
  verificationMethod?: 'SELF_DECLARED' | 'TEST' | 'CERTIFICATION';
}

export interface SoftSkill {
  id: string;
  label: string;
  description: string;
  weight: number;
}

export interface MatchingCriterion {
  criterionId: string;
  label: string;
  weight: number; // % de l'importance totale
  type: 'BOOLEAN' | 'SCALE' | 'MATCH';
}

// ============================================================================
// PROJECT VS MAINTENANCE (CapEx vs OpEx)
// ============================================================================

export type FlowType = 'MAINTENANCE' | 'PROJECT';

export interface MaintenanceFlow {
  type: 'MAINTENANCE';
  urgency: 'IMMEDIATE' | 'SCHEDULED' | 'PREVENTIVE';
  targetEquipmentId?: string;
  diagnosedProblemId?: string;
  estimatedCost: { min: number; max: number };
  estimatedDuration: string;
}

export interface ProjectFlow {
  type: 'PROJECT';
  projectType: 'INSTALLATION' | 'RENOVATION' | 'UPGRADE' | 'AUDIT';
  scope: ProjectScope;
  constraints: ProjectConstraint[];
  requiresPermits?: boolean;
  estimatedBudget?: { min: number; max: number };
  estimatedDuration?: string;
}

export interface ProjectScope {
  description: string;
  zones: string[];
  affectedSystems: string[];
  operationalImpact: 'NONE' | 'PARTIAL' | 'FULL_CLOSURE';
}

export interface ProjectConstraint {
  type: 'TIMING' | 'BUDGET' | 'REGULATORY' | 'OPERATIONAL';
  description: string;
  critical: boolean;
}

// ============================================================================
// BUILDING SYSTEMS
// ============================================================================

export type BuildingSystemType =
  | 'PLUMBING'       // Plomberie
  | 'ELECTRICAL'     // Électricité
  | 'HVAC'           // CVC (Chauffage, Ventilation, Climatisation)
  | 'SECURITY'       // Sécurité (Alarme, Incendie)
  | 'ACCESS'         // Accès (Portes, Serrures)
  | 'STRUCTURE';     // Structure (Murs, Sols, Toiture)

export interface BuildingSystem {
  id: string;
  type: BuildingSystemType;
  label: string;
  description: string;
  elements: BuildingElement[];
  maintenanceChecklist: MaintenanceCheckItem[];
  regulatoryChecks?: RegulatoryCheck[];
}

export interface BuildingElement {
  id: string;
  label: string;
  description: string;
  location?: string;
  lastInspection?: string;
  nextInspection?: string;
  problems: DiagnosticProblem[];
}

export interface MaintenanceCheckItem {
  id: string;
  label: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  procedure: string;
  requiredCertification?: string;
}

export interface RegulatoryCheck {
  id: string;
  label: string;
  regulation: string; // Ex: "ERP", "Légionelle", "HACCP"
  frequency: string;
  lastCheck?: string;
  nextCheck?: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING';
}

// ============================================================================
// TECH & AUDIOVISUAL
// ============================================================================

export type TechCategory =
  | 'AUDIO'          // Sonorisation
  | 'LIGHTING'       // Éclairage
  | 'VIDEO'          // Vidéo/Affichage
  | 'POS'            // Point de Vente
  | 'NETWORK'        // Réseau & IT
  | 'SECURITY_TECH'; // Sécurité électronique

export interface TechSystem {
  id: string;
  category: TechCategory;
  label: string;
  description: string;
  components: TechComponent[];
  signalFlow?: string[]; // Ordre du flux signal pour diagnostic
  commonIssues: DiagnosticProblem[];
}

export interface TechComponent {
  id: string;
  label: string;
  type: string; // Ex: 'amplifier', 'speaker', 'switch'
  brand?: string;
  model?: string;
  connectionType?: 'WIRED' | 'WIRELESS' | 'HYBRID';
  powerSource?: 'MAINS' | 'POE' | 'BATTERY';
}

// ============================================================================
// SEVERITY CONFIGURATION
// ============================================================================

export const SEVERITY_CONFIG: Record<ProblemSeverity, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  responseTime: string;
  priority: number;
  description: string;
}> = {
  LOW: {
    label: 'Faible',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    responseTime: '48-72h',
    priority: 1,
    description: 'Peut attendre - Aucun impact sur l\'exploitation'
  },
  MEDIUM: {
    label: 'Moyen',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    responseTime: '24-48h',
    priority: 2,
    description: 'À traiter rapidement - Impact limité'
  },
  HIGH: {
    label: 'Élevé',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    responseTime: '4-12h',
    priority: 3,
    description: 'Urgent - Impact significatif sur l\'exploitation'
  },
  CRITICAL: {
    label: 'Critique',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    responseTime: '< 2h',
    priority: 4,
    description: 'Urgence absolue - Risque sanitaire ou sécuritaire'
  }
};
