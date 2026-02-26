import type { EquipmentCategory } from '@/types/equipment';

// ============================================================================
// EQUIPMENT PROBLEMS - LA BASE DE CONNAISSANCE
// ============================================================================
// Cette base de connaissance lie les problèmes aux catégories d'équipements.
// La sévérité est DÉDUITE automatiquement - l'utilisateur n'a pas à la choisir.
// ============================================================================

export type ProblemSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EquipmentProblem {
  id: string;
  label: string;
  description: string;
  severity: ProblemSeverity;
  // Estimated response time based on severity
  estimatedResponseTime: string;
  // Skills required for this problem
  requiredSkills: string[];
  // Suggested price range
  priceRange: { min: number; max: number };
  // Icon hint for UI
  iconHint?: 'temperature' | 'leak' | 'noise' | 'power' | 'error' | 'smell' | 'mechanical';
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
}> = {
  LOW: {
    label: 'Faible',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/40',
    responseTime: '48-72h',
    priority: 1,
  },
  MEDIUM: {
    label: 'Moyen',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/40',
    responseTime: '24-48h',
    priority: 2,
  },
  HIGH: {
    label: 'Élevé',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/40',
    responseTime: '4-12h',
    priority: 3,
  },
  CRITICAL: {
    label: 'Critique',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/40',
    responseTime: '< 2h',
    priority: 4,
  },
};

// ============================================================================
// PROBLEMS DATABASE BY EQUIPMENT CATEGORY
// ============================================================================

export const EQUIPMENT_PROBLEMS: Record<EquipmentCategory, EquipmentProblem[]> = {
  // =========================================================================
  // FROID POSITIF - Réfrigérateurs
  // =========================================================================
  FRIDGE: [
    {
      id: 'fridge-no-cooling',
      label: 'Ne refroidit plus',
      description: 'L\'appareil ne maintient plus la température. Risque pour les denrées.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['froid-commercial', 'diagnostic'],
      priceRange: { min: 150, max: 400 },
      iconHint: 'temperature',
    },
    {
      id: 'fridge-temp-high',
      label: 'Température trop haute',
      description: 'La température dépasse les normes HACCP (+7°C).',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['froid-commercial', 'regulation'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'temperature',
    },
    {
      id: 'fridge-leak',
      label: 'Fuite d\'eau',
      description: 'Accumulation d\'eau sous ou autour de l\'appareil.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['froid-commercial', 'plomberie'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'leak',
    },
    {
      id: 'fridge-frost',
      label: 'Givre excessif',
      description: 'Formation de givre importante réduisant l\'efficacité.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['froid-commercial'],
      priceRange: { min: 80, max: 180 },
      iconHint: 'temperature',
    },
    {
      id: 'fridge-noise',
      label: 'Bruit anormal',
      description: 'Compresseur bruyant, vibrations ou claquements.',
      severity: 'LOW',
      estimatedResponseTime: '48-72h',
      requiredSkills: ['froid-commercial', 'diagnostic'],
      priceRange: { min: 60, max: 150 },
      iconHint: 'noise',
    },
    {
      id: 'fridge-door-seal',
      label: 'Joint de porte défectueux',
      description: 'Le joint ne ferme plus correctement, perte de froid.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['froid-commercial'],
      priceRange: { min: 50, max: 120 },
      iconHint: 'mechanical',
    },
  ],

  // =========================================================================
  // FROID NÉGATIF - Congélateurs
  // =========================================================================
  FREEZER: [
    {
      id: 'freezer-no-freeze',
      label: 'Ne congèle plus',
      description: 'Température positive. Risque de perte totale des stocks.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['froid-commercial', 'froid-negatif'],
      priceRange: { min: 200, max: 500 },
      iconHint: 'temperature',
    },
    {
      id: 'freezer-temp-unstable',
      label: 'Température instable',
      description: 'Variations de température importantes (-18°C non maintenu).',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['froid-commercial', 'regulation'],
      priceRange: { min: 120, max: 300 },
      iconHint: 'temperature',
    },
    {
      id: 'freezer-ice-buildup',
      label: 'Accumulation de glace',
      description: 'Formation excessive de glace sur les parois.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['froid-commercial'],
      priceRange: { min: 80, max: 180 },
      iconHint: 'temperature',
    },
    {
      id: 'freezer-compressor',
      label: 'Problème compresseur',
      description: 'Compresseur qui ne démarre pas ou s\'arrête.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['froid-commercial', 'electricite'],
      priceRange: { min: 250, max: 600 },
      iconHint: 'mechanical',
    },
    {
      id: 'freezer-alarm',
      label: 'Alarme température',
      description: 'Alarme haute température déclenchée.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['froid-commercial', 'diagnostic'],
      priceRange: { min: 100, max: 200 },
      iconHint: 'error',
    },
  ],

  // =========================================================================
  // CHAMBRES FROIDES
  // =========================================================================
  COLD_ROOM: [
    {
      id: 'coldroom-temp-high',
      label: 'Température trop haute',
      description: 'Chambre froide hors norme. Risque sanitaire immédiat.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['froid-commercial', 'chambre-froide'],
      priceRange: { min: 200, max: 500 },
      iconHint: 'temperature',
    },
    {
      id: 'coldroom-door',
      label: 'Problème de porte',
      description: 'Porte qui ne ferme plus, joint défectueux.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['froid-commercial', 'serrurerie'],
      priceRange: { min: 150, max: 350 },
      iconHint: 'mechanical',
    },
    {
      id: 'coldroom-condensation',
      label: 'Condensation excessive',
      description: 'Humidité et condensation importantes dans la chambre.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['froid-commercial'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'leak',
    },
    {
      id: 'coldroom-alarm',
      label: 'Alarme déclenchée',
      description: 'Système d\'alarme température activé.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['froid-commercial', 'diagnostic'],
      priceRange: { min: 100, max: 200 },
      iconHint: 'error',
    },
    {
      id: 'coldroom-evaporator',
      label: 'Évaporateur givré',
      description: 'Bloc de glace sur l\'évaporateur, circulation d\'air réduite.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['froid-commercial', 'chambre-froide'],
      priceRange: { min: 150, max: 300 },
      iconHint: 'temperature',
    },
  ],

  // =========================================================================
  // MACHINES À CAFÉ
  // =========================================================================
  COFFEE_MACHINE: [
    {
      id: 'coffee-no-coffee',
      label: 'Ne fait plus de café',
      description: 'La machine ne produit plus de café. Service impacté.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['machine-cafe', 'diagnostic'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'error',
    },
    {
      id: 'coffee-no-pressure',
      label: 'Pas de pression',
      description: 'Pression insuffisante, café aqueux.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['machine-cafe'],
      priceRange: { min: 80, max: 180 },
      iconHint: 'mechanical',
    },
    {
      id: 'coffee-water-leak',
      label: 'Fuite d\'eau',
      description: 'Fuite au niveau de la machine ou des raccords.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['machine-cafe', 'plomberie'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'leak',
    },
    {
      id: 'coffee-grinder',
      label: 'Moulin bloqué',
      description: 'Le broyeur ne fonctionne plus ou fait un bruit anormal.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['machine-cafe'],
      priceRange: { min: 100, max: 220 },
      iconHint: 'mechanical',
    },
    {
      id: 'coffee-steam',
      label: 'Problème vapeur',
      description: 'Buse vapeur défaillante ou pas de pression vapeur.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['machine-cafe'],
      priceRange: { min: 80, max: 180 },
      iconHint: 'mechanical',
    },
    {
      id: 'coffee-descaling',
      label: 'Détartrage nécessaire',
      description: 'Indicateur de détartrage allumé ou café au goût altéré.',
      severity: 'LOW',
      estimatedResponseTime: '48-72h',
      requiredSkills: ['machine-cafe'],
      priceRange: { min: 60, max: 120 },
      iconHint: 'error',
    },
    {
      id: 'coffee-cold',
      label: 'Café tiède',
      description: 'Le café sort à température insuffisante.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['machine-cafe', 'diagnostic'],
      priceRange: { min: 80, max: 180 },
      iconHint: 'temperature',
    },
  ],

  // =========================================================================
  // FOURS
  // =========================================================================
  OVEN: [
    {
      id: 'oven-no-heat',
      label: 'Ne chauffe plus',
      description: 'Four froid. Production impossible.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['four-professionnel', 'electricite'],
      priceRange: { min: 150, max: 400 },
      iconHint: 'temperature',
    },
    {
      id: 'oven-temp-wrong',
      label: 'Température incorrecte',
      description: 'Four qui ne monte pas en température ou surchauffe.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['four-professionnel', 'regulation'],
      priceRange: { min: 120, max: 300 },
      iconHint: 'temperature',
    },
    {
      id: 'oven-door',
      label: 'Problème de porte',
      description: 'Porte qui ne ferme plus correctement, joint usé.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['four-professionnel'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'mechanical',
    },
    {
      id: 'oven-fan',
      label: 'Ventilateur défaillant',
      description: 'Ventilateur de chaleur tournante HS ou bruyant.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['four-professionnel', 'electricite'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'mechanical',
    },
    {
      id: 'oven-steam',
      label: 'Système vapeur HS',
      description: 'Plus de vapeur ou fuite du système vapeur.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['four-professionnel', 'plomberie'],
      priceRange: { min: 150, max: 350 },
      iconHint: 'leak',
    },
    {
      id: 'oven-gas-smell',
      label: 'Odeur de gaz',
      description: 'Odeur de gaz détectée. URGENCE SÉCURITÉ.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 1h',
      requiredSkills: ['four-professionnel', 'gaz'],
      priceRange: { min: 100, max: 300 },
      iconHint: 'smell',
    },
  ],

  // =========================================================================
  // LAVE-VAISSELLE
  // =========================================================================
  DISHWASHER: [
    {
      id: 'dishwasher-no-wash',
      label: 'Ne lave plus',
      description: 'La machine ne démarre pas ou cycle incomplet.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['lave-vaisselle', 'diagnostic'],
      priceRange: { min: 150, max: 350 },
      iconHint: 'error',
    },
    {
      id: 'dishwasher-no-drain',
      label: 'Ne vidange pas',
      description: 'Eau stagnante dans la cuve après le cycle.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['lave-vaisselle', 'plomberie'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'leak',
    },
    {
      id: 'dishwasher-water-leak',
      label: 'Fuite d\'eau',
      description: 'Fuite pendant le fonctionnement.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['lave-vaisselle', 'plomberie'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'leak',
    },
    {
      id: 'dishwasher-bad-smell',
      label: 'Mauvaises odeurs',
      description: 'Odeurs désagréables malgré le nettoyage.',
      severity: 'LOW',
      estimatedResponseTime: '48-72h',
      requiredSkills: ['lave-vaisselle'],
      priceRange: { min: 60, max: 120 },
      iconHint: 'smell',
    },
    {
      id: 'dishwasher-detergent',
      label: 'Problème doseur produit',
      description: 'Doseur de détergent ou de rinçage défaillant.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['lave-vaisselle'],
      priceRange: { min: 80, max: 180 },
      iconHint: 'mechanical',
    },
    {
      id: 'dishwasher-no-hot',
      label: 'Eau pas assez chaude',
      description: 'Température de lavage insuffisante.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['lave-vaisselle', 'electricite'],
      priceRange: { min: 120, max: 280 },
      iconHint: 'temperature',
    },
  ],

  // =========================================================================
  // MACHINES À GLAÇONS
  // =========================================================================
  ICE_MACHINE: [
    {
      id: 'ice-no-ice',
      label: 'Ne produit plus de glaçons',
      description: 'Production de glace arrêtée. Service bar impacté.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['froid-commercial', 'machine-glacon'],
      priceRange: { min: 150, max: 350 },
      iconHint: 'temperature',
    },
    {
      id: 'ice-slow-production',
      label: 'Production lente',
      description: 'Quantité de glaçons produite insuffisante.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['froid-commercial', 'machine-glacon'],
      priceRange: { min: 100, max: 220 },
      iconHint: 'mechanical',
    },
    {
      id: 'ice-cloudy',
      label: 'Glaçons troubles',
      description: 'Glaçons opaques ou avec mauvais goût.',
      severity: 'LOW',
      estimatedResponseTime: '48-72h',
      requiredSkills: ['machine-glacon', 'filtration'],
      priceRange: { min: 60, max: 150 },
      iconHint: 'error',
    },
    {
      id: 'ice-water-leak',
      label: 'Fuite d\'eau',
      description: 'Fuite au niveau de la machine ou du bac.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['froid-commercial', 'plomberie'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'leak',
    },
  ],

  // =========================================================================
  // TIREUSES À BIÈRE
  // =========================================================================
  BEER_TAP: [
    {
      id: 'beer-no-beer',
      label: 'Ne tire plus de bière',
      description: 'Aucune bière ne sort. Service bar bloqué.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['tireuse-biere', 'diagnostic'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'error',
    },
    {
      id: 'beer-foam',
      label: 'Trop de mousse',
      description: 'Excès de mousse, perte de produit.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['tireuse-biere'],
      priceRange: { min: 80, max: 180 },
      iconHint: 'mechanical',
    },
    {
      id: 'beer-flat',
      label: 'Bière plate',
      description: 'Bière sans bulles, problème de CO2.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['tireuse-biere', 'gaz'],
      priceRange: { min: 80, max: 180 },
      iconHint: 'mechanical',
    },
    {
      id: 'beer-temp',
      label: 'Température incorrecte',
      description: 'Bière trop chaude ou trop froide.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['tireuse-biere', 'froid-commercial'],
      priceRange: { min: 100, max: 220 },
      iconHint: 'temperature',
    },
    {
      id: 'beer-leak',
      label: 'Fuite CO2/bière',
      description: 'Fuite de gaz ou de bière dans le système.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['tireuse-biere'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'leak',
    },
  ],

  // =========================================================================
  // VENTILATION / HOTTES
  // =========================================================================
  VENTILATION: [
    {
      id: 'vent-no-suction',
      label: 'Plus d\'aspiration',
      description: 'Hotte qui n\'aspire plus. Non-conformité hygiène.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['ventilation', 'electricite'],
      priceRange: { min: 150, max: 400 },
      iconHint: 'mechanical',
    },
    {
      id: 'vent-noise',
      label: 'Bruit excessif',
      description: 'Moteur bruyant, roulement usé.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['ventilation'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'noise',
    },
    {
      id: 'vent-vibration',
      label: 'Vibrations anormales',
      description: 'Tremblements, fixation desserrée.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['ventilation'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'noise',
    },
    {
      id: 'vent-grease',
      label: 'Accumulation de graisse',
      description: 'Filtres saturés, risque incendie.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['ventilation', 'nettoyage-industriel'],
      priceRange: { min: 150, max: 350 },
      iconHint: 'smell',
    },
  ],

  // =========================================================================
  // ÉQUIPEMENTS DE CUISSON
  // =========================================================================
  COOKING: [
    {
      id: 'cooking-no-heat',
      label: 'Ne chauffe plus',
      description: 'Plaque/friteuse froide. Production bloquée.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['cuisson-professionnelle', 'electricite'],
      priceRange: { min: 150, max: 400 },
      iconHint: 'temperature',
    },
    {
      id: 'cooking-uneven',
      label: 'Chaleur inégale',
      description: 'Points chauds/froids sur la surface.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['cuisson-professionnelle'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'temperature',
    },
    {
      id: 'cooking-thermostat',
      label: 'Thermostat défaillant',
      description: 'Impossible de régler la température.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['cuisson-professionnelle', 'electricite'],
      priceRange: { min: 120, max: 280 },
      iconHint: 'error',
    },
    {
      id: 'cooking-gas',
      label: 'Problème gaz',
      description: 'Odeur de gaz, flamme irrégulière. URGENCE.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 1h',
      requiredSkills: ['cuisson-professionnelle', 'gaz'],
      priceRange: { min: 100, max: 300 },
      iconHint: 'smell',
    },
  ],

  // =========================================================================
  // AUTRES ÉQUIPEMENTS
  // =========================================================================
  OTHER: [
    {
      id: 'other-not-working',
      label: 'Ne fonctionne plus',
      description: 'L\'équipement est totalement inopérant.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['diagnostic', 'polyvalent'],
      priceRange: { min: 100, max: 300 },
      iconHint: 'error',
    },
    {
      id: 'other-noise',
      label: 'Bruit anormal',
      description: 'Sons inhabituels pendant le fonctionnement.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['diagnostic'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'noise',
    },
    {
      id: 'other-leak',
      label: 'Fuite',
      description: 'Fuite d\'eau, huile ou autre liquide.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['diagnostic', 'plomberie'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'leak',
    },
    {
      id: 'other-electrical',
      label: 'Problème électrique',
      description: 'Disjonction, étincelles, odeur de brûlé.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['electricite', 'diagnostic'],
      priceRange: { min: 100, max: 300 },
      iconHint: 'power',
    },
  ],

  // =========================================================================
  // AUDIO
  // =========================================================================
  AUDIO: [
    {
      id: 'audio-no-sound',
      label: 'Pas de son',
      description: 'Aucun son ne sort des enceintes.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 4h',
      requiredSkills: ['audio', 'cablage'],
      priceRange: { min: 100, max: 300 },
      iconHint: 'error',
    },
    {
      id: 'audio-distortion',
      label: 'Son distordu / Grésillements',
      description: 'Mauvaise qualité audio, bruits parasites.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['audio'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'noise',
    },
    {
      id: 'audio-connection',
      label: 'Problème de connexion',
      description: 'Impossible de connecter une source (Bluetooth, filaire).',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['audio', 'reseau'],
      priceRange: { min: 60, max: 150 },
      iconHint: 'error',
    },
  ],

  // =========================================================================
  // LIGHTING
  // =========================================================================
  LIGHTING: [
    {
      id: 'lighting-off',
      label: 'Ne s\'allume plus',
      description: 'Projecteur ou système d\'éclairage HS.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['electricite', 'eclairage'],
      priceRange: { min: 80, max: 250 },
      iconHint: 'power',
    },
    {
      id: 'lighting-flicker',
      label: 'Scintillement / Clignotement',
      description: 'Lumière instable ou clignotante.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['electricite'],
      priceRange: { min: 60, max: 180 },
      iconHint: 'power',
    },
    {
      id: 'lighting-control',
      label: 'Problème de contrôle (DMX)',
      description: 'Impossible de piloter l\'éclairage.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['eclairage', 'programmation'],
      priceRange: { min: 100, max: 300 },
      iconHint: 'error',
    },
  ],

  // =========================================================================
  // VIDEO
  // =========================================================================
  VIDEO: [
    {
      id: 'video-no-signal',
      label: 'Pas de signal vidéo',
      description: 'Écran noir ou "No Signal".',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 4h',
      requiredSkills: ['video', 'cablage'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'error',
    },
    {
      id: 'video-quality',
      label: 'Image dégradée',
      description: 'Couleurs fausses, image floue ou artefacts.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['video'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'error',
    },
  ],

  // =========================================================================
  // POS (Point of Sale)
  // =========================================================================
  POS: [
    {
      id: 'pos-offline',
      label: 'Caisse hors ligne',
      description: 'Impossible d\'encaisser ou d\'envoyer des commandes.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['informatique', 'reseau'],
      priceRange: { min: 150, max: 350 },
      iconHint: 'error',
    },
    {
      id: 'pos-printer',
      label: 'Imprimante tickets HS',
      description: 'N\'imprime plus les tickets ou les bons.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['informatique'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'mechanical',
    },
    {
      id: 'pos-payment',
      label: 'TPE en panne',
      description: 'Terminal de paiement inutilisable.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['banque', 'informatique'],
      priceRange: { min: 100, max: 250 },
      iconHint: 'error',
    },
  ],

  // =========================================================================
  // NETWORK
  // =========================================================================
  NETWORK: [
    {
      id: 'network-wifi',
      label: 'Problème WiFi',
      description: 'Pas de connexion ou connexion lente.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['reseau'],
      priceRange: { min: 100, max: 300 },
      iconHint: 'error',
    },
    {
      id: 'network-internet',
      label: 'Coupure Internet',
      description: 'Plus d\'accès internet dans l\'établissement.',
      severity: 'CRITICAL',
      estimatedResponseTime: '< 2h',
      requiredSkills: ['reseau', 'fai'],
      priceRange: { min: 120, max: 300 },
      iconHint: 'error',
    },
  ],

  // =========================================================================
  // SCREEN
  // =========================================================================
  SCREEN: [
    {
      id: 'screen-black',
      label: 'Écran noir',
      description: 'L\'écran ne s\'allume pas.',
      severity: 'HIGH',
      estimatedResponseTime: '4-12h',
      requiredSkills: ['video', 'electricite'],
      priceRange: { min: 100, max: 300 },
      iconHint: 'power',
    },
    {
      id: 'screen-content',
      label: 'Problème d\'affichage',
      description: 'Contenu figé ou incorrect.',
      severity: 'MEDIUM',
      estimatedResponseTime: '24-48h',
      requiredSkills: ['informatique', 'video'],
      priceRange: { min: 80, max: 200 },
      iconHint: 'error',
    },
  ],
};

// ============================================================================
// STAFFING PROFILES - Base de données complète des postes CHR
// ============================================================================
// Chaque poste est lié à une sous-catégorie du wizard
// ============================================================================

export interface StaffingNeed {
  id: string;
  subcategoryId: string;           // Lien avec la sous-catégorie du wizard
  role: string;
  description: string;
  urgency: 'planned' | 'urgent' | 'emergency';
  typicalDuration: string;
  hourlyRate: { min: number; max: number };
  requiredSkills?: string[];       // Compétences requises
  requiredCertifications?: string[]; // Certifications obligatoires
  dressCode?: string;              // Tenue attendue
}

export const STAFFING_NEEDS: StaffingNeed[] = [
  // ============================================================================
  // SALLE - Service
  // ============================================================================
  {
    id: 'SERVEUR',
    subcategoryId: 'serveur',
    role: 'Serveur / Runner',
    description: 'Service en salle, prise de commandes, encaissement.',
    urgency: 'planned',
    typicalDuration: '6-8h',
    hourlyRate: { min: 12, max: 18 },
    requiredSkills: ['Prise de commande', 'Service à l\'assiette', 'Encaissement'],
    dressCode: 'Chemise noire + pantalon noir',
  },
  {
    id: 'CHEF_RANG',
    subcategoryId: 'chef_rang',
    role: 'Chef de Rang',
    description: 'Responsable d\'un rang de tables, coordination des commis.',
    urgency: 'planned',
    typicalDuration: '7-9h',
    hourlyRate: { min: 15, max: 22 },
    requiredSkills: ['Management d\'équipe', 'Service gastronomique', 'Gestion de rang'],
    dressCode: 'Costume ou tenue établissement',
  },
  {
    id: 'MAITRE_HOTEL',
    subcategoryId: 'maitre_hotel',
    role: 'Maître d\'Hôtel',
    description: 'Direction du service salle, accueil VIP, coordination générale.',
    urgency: 'planned',
    typicalDuration: '8-10h',
    hourlyRate: { min: 22, max: 35 },
    requiredSkills: ['Leadership', 'Protocole', 'Gestion de conflits', 'Langues étrangères'],
    dressCode: 'Costume impeccable',
  },
  {
    id: 'HOTESSE',
    subcategoryId: 'hotesse',
    role: 'Hôte / Hôtesse d\'accueil',
    description: 'Accueil clients, gestion des réservations, vestiaire.',
    urgency: 'planned',
    typicalDuration: '5-7h',
    hourlyRate: { min: 13, max: 18 },
    requiredSkills: ['Accueil client', 'Gestion planning', 'Présentation soignée'],
    dressCode: 'Tenue élégante',
  },

  // ============================================================================
  // BAR
  // ============================================================================
  {
    id: 'BARMAN',
    subcategoryId: 'barman',
    role: 'Barman / Barmaid',
    description: 'Service au bar, préparation boissons, encaissement.',
    urgency: 'planned',
    typicalDuration: '6-8h',
    hourlyRate: { min: 14, max: 20 },
    requiredSkills: ['Service bar', 'Connaissance boissons', 'Rapidité'],
    dressCode: 'Chemise + tablier',
  },
  {
    id: 'MIXOLOGUE',
    subcategoryId: 'mixologue',
    role: 'Mixologue / Bartender cocktails',
    description: 'Création et préparation de cocktails, carte des boissons.',
    urgency: 'planned',
    typicalDuration: '6-9h',
    hourlyRate: { min: 18, max: 28 },
    requiredSkills: ['Cocktails classiques IBA', 'Création cocktails', 'Flair bartending'],
    dressCode: 'Chemise + gilet ou style établissement',
  },
  {
    id: 'SOMMELIER',
    subcategoryId: 'sommelier',
    role: 'Sommelier',
    description: 'Conseil vins, service du vin, gestion cave.',
    urgency: 'planned',
    typicalDuration: '6-8h',
    hourlyRate: { min: 20, max: 35 },
    requiredSkills: ['Œnologie', 'Accords mets-vins', 'Dégustation'],
    requiredCertifications: ['WSET ou équivalent apprécié'],
    dressCode: 'Costume + grappe',
  },
  {
    id: 'BARISTA',
    subcategoryId: 'barista',
    role: 'Barista',
    description: 'Préparation cafés, latte art, service comptoir.',
    urgency: 'planned',
    typicalDuration: '5-8h',
    hourlyRate: { min: 12, max: 18 },
    requiredSkills: ['Extraction espresso', 'Latte art', 'Entretien machine'],
    dressCode: 'Tablier + tenue casual',
  },

  // ============================================================================
  // CUISINE
  // ============================================================================
  {
    id: 'CHEF_CUISINE',
    subcategoryId: 'chef_cuisine',
    role: 'Chef de Cuisine',
    description: 'Direction de la cuisine, création menu, gestion équipe.',
    urgency: 'urgent',
    typicalDuration: '10-12h',
    hourlyRate: { min: 30, max: 50 },
    requiredSkills: ['Cuisine gastronomique', 'Management', 'Gestion coûts', 'HACCP'],
    dressCode: 'Veste de chef blanche',
  },
  {
    id: 'SECOND_CUISINE',
    subcategoryId: 'second_cuisine',
    role: 'Second de Cuisine',
    description: 'Bras droit du chef, remplacement, coordination.',
    urgency: 'urgent',
    typicalDuration: '9-11h',
    hourlyRate: { min: 22, max: 35 },
    requiredSkills: ['Toutes techniques cuisson', 'Coordination', 'Mise en place'],
    dressCode: 'Veste de chef',
  },
  {
    id: 'CHEF_PARTIE',
    subcategoryId: 'chef_partie',
    role: 'Chef de Partie',
    description: 'Responsable d\'un poste spécifique (saucier, poissonnier, etc.).',
    urgency: 'planned',
    typicalDuration: '8-10h',
    hourlyRate: { min: 18, max: 28 },
    requiredSkills: ['Spécialité du poste', 'Autonomie', 'Rapidité'],
    dressCode: 'Veste de chef',
  },
  {
    id: 'COMMIS',
    subcategoryId: 'commis',
    role: 'Commis de Cuisine',
    description: 'Aide en cuisine, mise en place, préparations de base.',
    urgency: 'planned',
    typicalDuration: '7-9h',
    hourlyRate: { min: 12, max: 16 },
    requiredSkills: ['Bases culinaires', 'Taillage légumes', 'Hygiène'],
    dressCode: 'Veste de cuisine',
  },
  {
    id: 'PATISSIER',
    subcategoryId: 'patissier',
    role: 'Pâtissier',
    description: 'Création et préparation des desserts.',
    urgency: 'planned',
    typicalDuration: '8-10h',
    hourlyRate: { min: 16, max: 26 },
    requiredSkills: ['Pâtisserie', 'Dressage', 'Chocolaterie'],
    dressCode: 'Veste blanche + toque',
  },
  {
    id: 'PIZZAIOLO',
    subcategoryId: 'pizzaiolo',
    role: 'Pizzaïolo',
    description: 'Préparation et cuisson des pizzas au four.',
    urgency: 'planned',
    typicalDuration: '6-9h',
    hourlyRate: { min: 14, max: 22 },
    requiredSkills: ['Pétrissage', 'Façonnage', 'Cuisson four à bois/électrique'],
    dressCode: 'Tablier + tenue cuisine',
  },
  {
    id: 'PLONGEUR',
    subcategoryId: 'plongeur',
    role: 'Plongeur / Aide cuisine',
    description: 'Plonge, nettoyage cuisine, aide ponctuelle.',
    urgency: 'planned',
    typicalDuration: '5-8h',
    hourlyRate: { min: 11, max: 14 },
    requiredSkills: ['Rapidité', 'Organisation', 'Résistance physique'],
    dressCode: 'Tablier + chaussures sécurité',
  },

  // ============================================================================
  // ÉVÉNEMENTIEL
  // ============================================================================
  {
    id: 'EXTRA_TRAITEUR',
    subcategoryId: 'traiteur_extra',
    role: 'Extra Traiteur / Événementiel',
    description: 'Service événementiel, cocktails dînatoires, buffets.',
    urgency: 'planned',
    typicalDuration: '4-8h',
    hourlyRate: { min: 13, max: 20 },
    requiredSkills: ['Service plateau', 'Buffet', 'Adaptabilité'],
    dressCode: 'Noir et blanc classique',
  },
  {
    id: 'VOITURIER',
    subcategoryId: 'voiturier',
    role: 'Voiturier',
    description: 'Accueil véhicules, stationnement, service client.',
    urgency: 'planned',
    typicalDuration: '5-8h',
    hourlyRate: { min: 13, max: 18 },
    requiredSkills: ['Conduite tous véhicules', 'Présentation', 'Discrétion'],
    requiredCertifications: ['Permis B obligatoire'],
    dressCode: 'Costume ou uniforme',
  },
  {
    id: 'VESTIAIRE',
    subcategoryId: 'vestiaire',
    role: 'Agent vestiaire',
    description: 'Gestion vestiaire, accueil, service clientèle.',
    urgency: 'planned',
    typicalDuration: '4-7h',
    hourlyRate: { min: 12, max: 16 },
    requiredSkills: ['Organisation', 'Accueil', 'Gestion effets personnels'],
    dressCode: 'Tenue élégante sombre',
  },

  // ============================================================================
  // SÉCURITÉ
  // ============================================================================
  {
    id: 'AGENT_SECURITE',
    subcategoryId: 'agent_securite',
    role: 'Agent de sécurité / Videur',
    description: 'Contrôle accès, sécurité établissement, gestion conflits.',
    urgency: 'urgent',
    typicalDuration: '6-10h',
    hourlyRate: { min: 15, max: 25 },
    requiredSkills: ['Gestion de conflits', 'Self-défense', 'Sang-froid'],
    requiredCertifications: ['CQP APS obligatoire', 'Carte professionnelle valide'],
    dressCode: 'Costume noir ou tenue établissement',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const OTHER_PROBLEM: EquipmentProblem = {
  id: 'other',
  label: 'Problème non répertorié',
  description: '',
  severity: 'MEDIUM',
  estimatedResponseTime: 'Diagnostic requis',
  requiredSkills: ['diagnostic', 'polyvalent'],
  priceRange: { min: 80, max: 200 },
  iconHint: 'error'
};

/**
 * Get problems for a specific equipment category
 */
export function getProblemsForCategory(category: EquipmentCategory): EquipmentProblem[] {
  const problems = EQUIPMENT_PROBLEMS[category] || [];
  // Add Other problem if not present
  if (problems.some(p => p.id === 'other')) {
    return problems;
  }
  return [...problems, OTHER_PROBLEM];
}

/**
 * Get a specific problem by ID
 */
export function getProblemById(category: EquipmentCategory, problemId: string): EquipmentProblem | undefined {
  const problems = getProblemsForCategory(category);
  return problems.find(p => p.id === problemId);
}

/**
 * Get all critical problems (for alerts)
 */
export function getCriticalProblems(category: EquipmentCategory): EquipmentProblem[] {
  return getProblemsForCategory(category).filter(p => p.severity === 'CRITICAL');
}

/**
 * Calculate estimated price based on problem
 */
export function getEstimatedPrice(problem: EquipmentProblem): string {
  return `${problem.priceRange.min}€ - ${problem.priceRange.max}€`;
}

/**
 * Get mission type from equipment category
 */
export function getMissionTypeFromCategory(category: EquipmentCategory): string {
  const mapping: Record<EquipmentCategory, string> = {
    FRIDGE: 'cold',
    FREEZER: 'cold',
    COLD_ROOM: 'cold',
    COFFEE_MACHINE: 'coffee',
    OVEN: 'hot',
    DISHWASHER: 'plumbing',
    ICE_MACHINE: 'cold',
    BEER_TAP: 'beer',
    VENTILATION: 'hot',
    COOKING: 'hot',
    AUDIO: 'sound',
    LIGHTING: 'light',
    VIDEO: 'video',
    POS: 'pos',
    NETWORK: 'network',
    SCREEN: 'video',
    OTHER: 'cold',
  };
  return mapping[category] || 'cold';
}
