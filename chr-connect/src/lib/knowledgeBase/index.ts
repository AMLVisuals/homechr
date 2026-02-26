// ============================================================================
// KNOWLEDGE BASE - INDEX
// ============================================================================
// Point d'entrée principal pour la base de connaissances OCOA
// Exporte toutes les familles, taxonomies et fonctions de diagnostic

// Types
export * from './types';

// Familles d'équipements
export { COLD_KNOWLEDGE_BASE, COLD_FAMILY, COLD_PROBLEMS } from './cold';
export { HOT_KNOWLEDGE_BASE, HOT_FAMILY, HOT_PROBLEMS } from './hot';
export { STAFFING_KNOWLEDGE_BASE, STAFFING_FAMILY, ALL_STAFFING_PROFILES, STAFFING_CATEGORIES } from './staffing';

// Imports pour le registre
import { COLD_KNOWLEDGE_BASE, COLD_PROBLEMS } from './cold';
import { HOT_KNOWLEDGE_BASE, HOT_PROBLEMS } from './hot';
import { STAFFING_KNOWLEDGE_BASE } from './staffing';
import type {
  EquipmentFamily,
  EquipmentFamilyId,
  EquipmentSubCategory,
  DiagnosticProblem,
  DiagnosticNode,
  StaffingProfile,
  ProblemSeverity,
  SEVERITY_CONFIG,
} from './types';

// ============================================================================
// UNIFIED KNOWLEDGE BASE REGISTRY
// ============================================================================

export interface KnowledgeBaseRegistry {
  families: Record<EquipmentFamilyId, EquipmentFamily>;
  getAllFamilies: () => EquipmentFamily[];
  getFamily: (id: EquipmentFamilyId) => EquipmentFamily | undefined;
  getSubCategory: (familyId: EquipmentFamilyId, subCategoryId: string) => EquipmentSubCategory | undefined;

  // Problems
  getAllProblems: () => DiagnosticProblem[];
  getProblemsForCategory: (categoryId: string) => DiagnosticProblem[];
  getProblemById: (problemId: string) => DiagnosticProblem | undefined;
  getProblemsBySeverity: (severity: ProblemSeverity) => DiagnosticProblem[];

  // Diagnostic
  getDiagnosticNode: (nodeId: string) => DiagnosticNode | undefined;
  startDiagnostic: (problemId: string) => DiagnosticNode | undefined;

  // Staffing
  getStaffingProfiles: () => StaffingProfile[];
  getStaffingProfileById: (id: string) => StaffingProfile | undefined;
}

// Aggregate all problems
const ALL_PROBLEMS: DiagnosticProblem[] = [
  ...COLD_PROBLEMS,
  ...HOT_PROBLEMS,
];

// Aggregate all diagnostic nodes
const ALL_DIAGNOSTIC_NODES: Record<string, DiagnosticNode> = {
  ...COLD_KNOWLEDGE_BASE.diagnosticNodes,
  ...HOT_KNOWLEDGE_BASE.diagnosticNodes,
};

// ============================================================================
// KNOWLEDGE BASE SINGLETON
// ============================================================================

export const KnowledgeBase: KnowledgeBaseRegistry = {
  families: {
    COLD: COLD_KNOWLEDGE_BASE.family,
    HOT: HOT_KNOWLEDGE_BASE.family,
    BEVERAGE: {
      id: 'BEVERAGE',
      label: 'Boissons',
      description: 'Équipements de préparation de boissons',
      icon: 'Coffee',
      color: 'from-amber-500 to-orange-600',
      categories: [],
      commonSkills: ['machine-cafe', 'tirage-biere'],
      riskLevel: 'MEDIUM'
    },
    HYGIENE: {
      id: 'HYGIENE',
      label: 'Hygiène',
      description: 'Plonge et ventilation',
      icon: 'Sparkles',
      color: 'from-emerald-500 to-teal-600',
      categories: [],
      commonSkills: ['plonge-pro', 'ventilation'],
      riskLevel: 'MEDIUM'
    },
    TECH_AV: {
      id: 'TECH_AV',
      label: 'Tech & Audiovisuel',
      description: 'Son, lumière, réseau, caisse',
      icon: 'Monitor',
      color: 'from-blue-500 to-indigo-600',
      categories: [],
      commonSkills: ['audiovisuel', 'reseau', 'pos'],
      riskLevel: 'LOW'
    },
    BUILDING: {
      id: 'BUILDING',
      label: 'Bâtiment',
      description: 'Plomberie, électricité, structure',
      icon: 'Building2',
      color: 'from-gray-500 to-slate-600',
      categories: [],
      commonSkills: ['plomberie', 'electricite', 'menuiserie'],
      riskLevel: 'MEDIUM'
    },
    STAFFING: STAFFING_KNOWLEDGE_BASE.family
  },

  getAllFamilies() {
    return Object.values(this.families);
  },

  getFamily(id: EquipmentFamilyId) {
    return this.families[id];
  },

  getSubCategory(familyId: EquipmentFamilyId, subCategoryId: string) {
    const family = this.families[familyId];
    if (!family) return undefined;
    return family.categories.find(cat => cat.id === subCategoryId);
  },

  // Problems
  getAllProblems() {
    return ALL_PROBLEMS;
  },

  getProblemsForCategory(categoryId: string) {
    return ALL_PROBLEMS.filter(p => p.categoryId === categoryId);
  },

  getProblemById(problemId: string) {
    return ALL_PROBLEMS.find(p => p.id === problemId);
  },

  getProblemsBySeverity(severity: ProblemSeverity) {
    return ALL_PROBLEMS.filter(p => p.severity === severity);
  },

  // Diagnostic
  getDiagnosticNode(nodeId: string) {
    return ALL_DIAGNOSTIC_NODES[nodeId];
  },

  startDiagnostic(problemId: string) {
    const problem = this.getProblemById(problemId);
    if (!problem?.diagnosticTree) return undefined;
    return problem.diagnosticTree;
  },

  // Staffing
  getStaffingProfiles() {
    return STAFFING_KNOWLEDGE_BASE.profiles;
  },

  getStaffingProfileById(id: string) {
    return STAFFING_KNOWLEDGE_BASE.getProfileById(id);
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get equipment categories for a family that match a legacy EquipmentCategory
 */
export function mapLegacyCategoryToFamily(legacyCategory: string): EquipmentFamilyId | null {
  const mapping: Record<string, EquipmentFamilyId> = {
    // Cold
    'FRIDGE': 'COLD',
    'FREEZER': 'COLD',
    'COLD_ROOM': 'COLD',
    'ICE_MACHINE': 'COLD',
    // Hot
    'OVEN': 'HOT',
    'COOKING': 'HOT',
    // Beverage
    'COFFEE_MACHINE': 'BEVERAGE',
    'BEER_TAP': 'BEVERAGE',
    // Hygiene
    'DISHWASHER': 'HYGIENE',
    'VENTILATION': 'HYGIENE',
    // Other
    'OTHER': 'BUILDING'
  };

  return mapping[legacyCategory] || null;
}

/**
 * Get all sub-categories for a family
 */
export function getSubCategoriesForFamily(familyId: EquipmentFamilyId): EquipmentSubCategory[] {
  const family = KnowledgeBase.getFamily(familyId);
  return family?.categories || [];
}

/**
 * Get problems for a legacy equipment category
 */
export function getProblemsForLegacyCategory(legacyCategory: string): DiagnosticProblem[] {
  // Map legacy category to our sub-categories
  const subCategoryMapping: Record<string, string[]> = {
    'FRIDGE': ['cold-positive'],
    'FREEZER': ['cold-negative'],
    'COLD_ROOM': ['cold-positive', 'cold-negative'],
    'ICE_MACHINE': ['cold-ice'],
    'OVEN': ['hot-vertical'],
    'COOKING': ['hot-horizontal'],
    'COFFEE_MACHINE': ['beverage-coffee'],
    'BEER_TAP': ['beverage-beer'],
    'DISHWASHER': ['hygiene-dishwasher'],
    'VENTILATION': ['hygiene-ventilation'],
    'OTHER': []
  };

  const subCategories = subCategoryMapping[legacyCategory] || [];
  return ALL_PROBLEMS.filter(p => subCategories.includes(p.categoryId));
}

/**
 * Calculate estimated cost based on problem and equipment age
 */
export function estimateRepairCost(
  problem: DiagnosticProblem,
  equipmentAge?: number, // years
  previousRepairs?: number
): { min: number; max: number; recommendation?: string } {
  let multiplier = 1;
  let recommendation: string | undefined;

  // Adjust based on equipment age
  if (equipmentAge) {
    if (equipmentAge > 10) {
      multiplier = 1.3; // Older equipment = harder to find parts
      recommendation = 'Équipement vieillissant - Envisager le remplacement';
    } else if (equipmentAge > 7) {
      multiplier = 1.15;
    }
  }

  // Adjust based on repair history
  if (previousRepairs && previousRepairs > 3) {
    multiplier *= 1.1;
    recommendation = recommendation || 'Pannes récurrentes - Diagnostic approfondi recommandé';
  }

  return {
    min: Math.round(problem.priceRange.min * multiplier),
    max: Math.round(problem.priceRange.max * multiplier),
    recommendation
  };
}

/**
 * Get urgency score for prioritization (0-100)
 */
export function getUrgencyScore(problem: DiagnosticProblem): number {
  const severityScores: Record<ProblemSeverity, number> = {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25
  };

  let score = severityScores[problem.severity];

  // Boost for safety hazards
  if (problem.safetyHazards && problem.safetyHazards.length > 0) {
    score = Math.min(100, score + 15);
  }

  // Boost for regulatory implications
  if (problem.regulatoryImplications && problem.regulatoryImplications.length > 0) {
    score = Math.min(100, score + 10);
  }

  return score;
}

/**
 * Get matching technician skills for a problem
 */
export function getRequiredSkillsForProblem(problem: DiagnosticProblem): {
  required: string[];
  certifications: string[];
  preferred: string[];
} {
  return {
    required: problem.requiredSkills,
    certifications: problem.requiredCertifications || [],
    preferred: [] // Could be expanded based on root causes
  };
}

// ============================================================================
// CATEGORY ICONS (for UI)
// ============================================================================

export const FAMILY_ICONS: Record<EquipmentFamilyId, string> = {
  COLD: 'Snowflake',
  HOT: 'Flame',
  BEVERAGE: 'Coffee',
  HYGIENE: 'Sparkles',
  TECH_AV: 'Monitor',
  BUILDING: 'Building2',
  STAFFING: 'Users'
};

export const FAMILY_COLORS: Record<EquipmentFamilyId, string> = {
  COLD: 'from-cyan-500 to-blue-600',
  HOT: 'from-orange-500 to-red-600',
  BEVERAGE: 'from-amber-500 to-orange-600',
  HYGIENE: 'from-emerald-500 to-teal-600',
  TECH_AV: 'from-blue-500 to-indigo-600',
  BUILDING: 'from-gray-500 to-slate-600',
  STAFFING: 'from-purple-500 to-pink-600'
};

// ============================================================================
// MISSION TYPE MAPPING
// ============================================================================

export const MISSION_CATEGORY_MAPPING = {
  MAINTENANCE: ['COLD', 'HOT', 'BEVERAGE', 'HYGIENE'] as EquipmentFamilyId[],
  TECH: ['TECH_AV'] as EquipmentFamilyId[],
  BUILDING: ['BUILDING'] as EquipmentFamilyId[],
  STAFFING: ['STAFFING'] as EquipmentFamilyId[]
};

export type MissionMainCategory = keyof typeof MISSION_CATEGORY_MAPPING;

export function getMissionCategoryForFamily(familyId: EquipmentFamilyId): MissionMainCategory {
  for (const [category, families] of Object.entries(MISSION_CATEGORY_MAPPING)) {
    if (families.includes(familyId)) {
      return category as MissionMainCategory;
    }
  }
  return 'MAINTENANCE';
}
