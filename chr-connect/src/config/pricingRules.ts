
export type PricingModel = 'MAINTENANCE_FIXED' | 'STAFFING_HOURLY' | 'PROJECT_VISIT';

export interface JobPricing {
  id: string;
  label: string;
  model: PricingModel;
  baseRate: number;
  minHours?: number;
  travelIncluded: boolean;
}

export const PRICING_RULES: Record<string, JobPricing> = {
  // MAINTENANCE
  'cold': { id: 'cold', label: 'Frigoriste', model: 'MAINTENANCE_FIXED', baseRate: 125, travelIncluded: false },
  'hot': { id: 'hot', label: 'Cuisiniste', model: 'MAINTENANCE_FIXED', baseRate: 115, travelIncluded: false },
  'plumbing': { id: 'plumbing', label: 'Plombier', model: 'MAINTENANCE_FIXED', baseRate: 105, travelIncluded: false },
  'elec': { id: 'elec', label: 'Électricien', model: 'MAINTENANCE_FIXED', baseRate: 110, travelIncluded: false },
  'coffee': { id: 'coffee', label: 'Expert Café', model: 'MAINTENANCE_FIXED', baseRate: 100, travelIncluded: false },
  'beer': { id: 'beer', label: 'Tireuse Pression', model: 'MAINTENANCE_FIXED', baseRate: 100, travelIncluded: false },
  
  // STAFFING
  'waiter': { id: 'waiter', label: 'Serveur / Limonadier', model: 'STAFFING_HOURLY', baseRate: 28, minHours: 4, travelIncluded: true },
  'chef_rang': { id: 'chef_rang', label: 'Chef de Rang', model: 'STAFFING_HOURLY', baseRate: 32, minHours: 4, travelIncluded: true },
  'barman': { id: 'barman', label: 'Barman / Mixologue', model: 'STAFFING_HOURLY', baseRate: 30, minHours: 4, travelIncluded: true },
  'sommelier': { id: 'sommelier', label: 'Sommelier', model: 'STAFFING_HOURLY', baseRate: 35, minHours: 4, travelIncluded: true },
  'cook': { id: 'cook', label: 'Cuisinier', model: 'STAFFING_HOURLY', baseRate: 30, minHours: 5, travelIncluded: true },
  'dishwasher': { id: 'dishwasher', label: 'Plongeur', model: 'STAFFING_HOURLY', baseRate: 24, minHours: 4, travelIncluded: true },
  'hostess': { id: 'hostess', label: 'Hôte / Hôtesse', model: 'STAFFING_HOURLY', baseRate: 26, minHours: 4, travelIncluded: true },
  'security': { id: 'security', label: 'Agent de Sécurité', model: 'STAFFING_HOURLY', baseRate: 28, minHours: 5, travelIncluded: true },
  
  // TECH (Mixed)
  'sound': { id: 'sound', label: 'Ingénieur Son', model: 'MAINTENANCE_FIXED', baseRate: 140, travelIncluded: false }, // Assuming Repair context primarily
  'light': { id: 'light', label: 'Ingénieur Lumière', model: 'MAINTENANCE_FIXED', baseRate: 140, travelIncluded: false },
  'video': { id: 'video', label: 'Technicien Vidéo', model: 'MAINTENANCE_FIXED', baseRate: 130, travelIncluded: false },
  'pos': { id: 'pos', label: 'Installateur POS', model: 'MAINTENANCE_FIXED', baseRate: 120, travelIncluded: false },
  'network': { id: 'network', label: 'Technicien Réseau', model: 'MAINTENANCE_FIXED', baseRate: 120, travelIncluded: false },

  // PROJECT / DESIGN
  'architect': { id: 'architect', label: "Architecte d'intérieur", model: 'PROJECT_VISIT', baseRate: 150, travelIncluded: true },
  'decorator': { id: 'decorator', label: 'Décorateur', model: 'PROJECT_VISIT', baseRate: 120, travelIncluded: true },
  'painter': { id: 'painter', label: 'Peintre', model: 'PROJECT_VISIT', baseRate: 80, travelIncluded: true }, // Quote visit
  'carpenter': { id: 'carpenter', label: 'Menuisier', model: 'PROJECT_VISIT', baseRate: 90, travelIncluded: true }, // Quote visit
  
  // DEFAULT
  'DEFAULT': { id: 'default', label: 'Expert', model: 'MAINTENANCE_FIXED', baseRate: 100, travelIncluded: false }
};

export const getJobPricing = (subCategoryId: string): JobPricing => {
  return PRICING_RULES[subCategoryId] || PRICING_RULES['DEFAULT'];
};
