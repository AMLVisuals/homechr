// ============================================================================
// KNOWLEDGE BASE - CHAUD (Cooking & Heating)
// ============================================================================
// Taxonomie et diagnostic pour équipements de cuisson
// Distinction critique GAZ vs ÉLECTRIQUE pour habilitations technicien

import type {
  EquipmentFamily,
  EquipmentSubCategory,
  DiagnosticProblem,
  DiagnosticNode,
  TechnicalSpecification,
} from './types';

// ============================================================================
// HOT FAMILY DEFINITION
// ============================================================================

export const HOT_FAMILY: EquipmentFamily = {
  id: 'HOT',
  label: 'Chaud',
  description: 'Équipements de cuisson et maintien en température',
  icon: 'Flame',
  color: 'from-orange-500 to-red-600',
  categories: [],
  commonSkills: ['cuisson-professionnelle', 'diagnostic-thermique', 'électricité-puissance'],
  riskLevel: 'HIGH',
  regulatoryRequirements: ['Qualigaz (si gaz)', 'Habilitation électrique BR/B2V']
};

// ============================================================================
// TECHNICAL SPECIFICATIONS
// ============================================================================

export const HOT_SPECIFICATIONS_ELECTRIC: TechnicalSpecification[] = [
  {
    key: 'energyType',
    label: 'Type d\'énergie',
    type: 'select',
    options: ['Électrique Monophasé (230V)', 'Électrique Triphasé (400V)'],
    required: true
  },
  {
    key: 'power',
    label: 'Puissance totale',
    type: 'number',
    unit: 'kW',
    required: true
  },
  {
    key: 'amperage',
    label: 'Intensité',
    type: 'number',
    unit: 'A'
  },
  {
    key: 'maxTemp',
    label: 'Température max',
    type: 'number',
    unit: '°C'
  }
];

export const HOT_SPECIFICATIONS_GAS: TechnicalSpecification[] = [
  {
    key: 'energyType',
    label: 'Type d\'énergie',
    type: 'select',
    options: ['Gaz Naturel (Ville)', 'Gaz Propane (GPL)', 'Gaz Butane'],
    required: true
  },
  {
    key: 'power',
    label: 'Puissance thermique',
    type: 'number',
    unit: 'kW',
    required: true
  },
  {
    key: 'injectorSize',
    label: 'Taille injecteurs',
    type: 'text',
    helpText: 'Différent selon gaz naturel ou propane'
  },
  {
    key: 'hasSecurityValve',
    label: 'Robinet de sécurité',
    type: 'boolean',
    helpText: 'Vanne coup de poing obligatoire'
  }
];

export const HOT_SPECIFICATIONS_COMBI: TechnicalSpecification[] = [
  ...HOT_SPECIFICATIONS_ELECTRIC,
  {
    key: 'waterConnection',
    label: 'Raccordement eau',
    type: 'boolean',
    required: true,
    helpText: 'Eau pour génération vapeur'
  },
  {
    key: 'drainConnection',
    label: 'Évacuation',
    type: 'boolean',
    required: true
  },
  {
    key: 'waterHardness',
    label: 'Dureté eau (TH)',
    type: 'number',
    unit: '°f',
    helpText: 'Critique pour entartrage - Adoucisseur recommandé si > 15°f'
  },
  {
    key: 'hasWaterSoftener',
    label: 'Adoucisseur installé',
    type: 'boolean'
  }
];

// ============================================================================
// SUB-CATEGORIES
// ============================================================================

export const HOT_VERTICAL: EquipmentSubCategory = {
  id: 'hot-vertical',
  familyId: 'HOT',
  label: 'Cuisson Verticale (Fours)',
  description: 'Fours professionnels tous types',
  icon: 'Flame',
  equipmentTypes: [
    {
      id: 'four-mixte',
      label: 'Four Mixte (Combi)',
      description: 'Four vapeur/convection multifonction - Le cœur de la cuisine moderne',
      brands: ['Rational', 'Convotherm (Welbilt)', 'Unox', 'FAGOR', 'Hobart', 'Electrolux'],
      specifications: HOT_SPECIFICATIONS_COMBI,
      commonProblems: ['hot-no-steam', 'hot-scale', 'hot-sensor', 'hot-door', 'hot-no-heat'],
      maintenanceInterval: 30, // Détartrage mensuel recommandé
      avgLifespan: 10,
      priceRangeNew: { min: 8000, max: 45000 }
    },
    {
      id: 'four-convection',
      label: 'Four à Convection (Air pulsé)',
      description: 'Four électrique à air pulsé sans vapeur',
      brands: ['Unox', 'SMEG', 'Hobart', 'Electrolux'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-temp-wrong', 'hot-fan', 'hot-door'],
      maintenanceInterval: 90,
      avgLifespan: 12
    },
    {
      id: 'four-pizza',
      label: 'Four à Pizza',
      description: 'Four à sole réfractaire pour pizza',
      brands: ['Moretti Forni', 'Cuppone', 'GAM', 'OEM', 'Zanolli'],
      specifications: [...HOT_SPECIFICATIONS_ELECTRIC, {
        key: 'soleType',
        label: 'Type de sole',
        type: 'select',
        options: ['Réfractaire', 'Acier', 'Pierre de lave']
      }, {
        key: 'chambers',
        label: 'Nombre de chambres',
        type: 'select',
        options: ['1', '2', '3', '4']
      }],
      commonProblems: ['hot-no-heat', 'hot-temp-wrong', 'hot-sole-cracked', 'hot-door'],
      maintenanceInterval: 180,
      avgLifespan: 15
    },
    {
      id: 'four-micro-ondes',
      label: 'Four Micro-ondes Pro',
      description: 'Micro-ondes professionnel haute puissance',
      brands: ['Menumaster', 'Panasonic', 'Sharp', 'Samsung'],
      specifications: [{
        key: 'power',
        label: 'Puissance',
        type: 'select',
        options: ['1000W', '1400W', '1800W', '2100W', '3000W'],
        required: true
      }],
      commonProblems: ['hot-no-heat', 'hot-sparks', 'hot-turntable', 'hot-door-switch'],
      maintenanceInterval: 365,
      avgLifespan: 5
    },
    {
      id: 'salamandre',
      label: 'Salamandre',
      description: 'Grill à plafond radiant pour gratinage',
      brands: ['Hatco', 'Bartscher', 'Lincat', 'Roller Grill'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-element', 'hot-thermostat'],
      maintenanceInterval: 180,
      avgLifespan: 10
    }
  ],
  requiredCertifications: ['Habilitation électrique BR']
};

export const HOT_HORIZONTAL: EquipmentSubCategory = {
  id: 'hot-horizontal',
  familyId: 'HOT',
  label: 'Cuisson Horizontale',
  description: 'Pianos, planchas, sauteuses',
  icon: 'Utensils',
  equipmentTypes: [
    {
      id: 'piano-gaz',
      label: 'Piano de cuisson (Gaz)',
      description: 'Fourneau professionnel à gaz',
      brands: ['Bonnet', 'Capic', 'Charvet', 'MBM', 'Ambassade'],
      specifications: HOT_SPECIFICATIONS_GAS,
      commonProblems: ['hot-gas-no-ignite', 'hot-gas-flame-yellow', 'hot-thermocouple', 'hot-burner-blocked'],
      maintenanceInterval: 365,
      avgLifespan: 20,
      priceRangeNew: { min: 5000, max: 30000 }
    },
    {
      id: 'piano-induction',
      label: 'Piano de cuisson (Induction)',
      description: 'Fourneau professionnel à induction',
      brands: ['Bonnet', 'Adventys', 'Capic', 'Electrolux'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-induction-error', 'hot-no-heat', 'hot-filter-dirty', 'hot-pan-detect'],
      maintenanceInterval: 90,
      avgLifespan: 12
    },
    {
      id: 'plancha-chrome',
      label: 'Plancha / Fry-top (Chrome)',
      description: 'Plaque de cuisson chromée lisse',
      brands: ['Roller Grill', 'EuroChef', 'Krampouz', 'Nayati'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-temp-wrong', 'hot-surface-damaged', 'hot-thermostat'],
      maintenanceInterval: 90,
      avgLifespan: 10
    },
    {
      id: 'plancha-acier',
      label: 'Plancha (Acier)',
      description: 'Plaque de cuisson en acier rainuré ou lisse',
      brands: ['Roller Grill', 'Simogas', 'Krampouz'],
      specifications: [...HOT_SPECIFICATIONS_ELECTRIC, ...HOT_SPECIFICATIONS_GAS.slice(0, 2)],
      commonProblems: ['hot-no-heat', 'hot-rust', 'hot-temp-wrong'],
      maintenanceInterval: 90,
      avgLifespan: 12
    },
    {
      id: 'sauteuse',
      label: 'Sauteuse basculante',
      description: 'Grande sauteuse avec système de basculement',
      brands: ['Bonnet', 'MKN', 'Electrolux', 'Capic'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-tilt-motor', 'hot-thermostat'],
      maintenanceInterval: 180,
      avgLifespan: 15
    },
    {
      id: 'marmite',
      label: 'Marmite chauffe-directe',
      description: 'Grande marmite de cuisson',
      brands: ['Bonnet', 'MKN', 'Electrolux'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-thermostat', 'hot-valve'],
      maintenanceInterval: 180,
      avgLifespan: 15
    },
    {
      id: 'wok-induction',
      label: 'Wok à induction',
      description: 'Station wok haute puissance',
      brands: ['Adventys', 'Garland', 'Vollrath'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-induction-error', 'hot-no-heat', 'hot-filter-dirty'],
      maintenanceInterval: 60,
      avgLifespan: 8
    }
  ],
  requiredCertifications: ['Qualigaz (si gaz)', 'Habilitation électrique']
};

export const HOT_FRYERS: EquipmentSubCategory = {
  id: 'hot-fryers',
  familyId: 'HOT',
  label: 'Fritures & Bains',
  description: 'Friteuses, cuiseurs à pâtes, bains-marie',
  icon: 'Flame',
  equipmentTypes: [
    {
      id: 'friteuse-electrique',
      label: 'Friteuse (Électrique)',
      description: 'Friteuse professionnelle électrique',
      brands: ['Frifri', 'Valentine', 'Henny Penny', 'Pitco', 'Frymaster'],
      specifications: [...HOT_SPECIFICATIONS_ELECTRIC, {
        key: 'tankCapacity',
        label: 'Capacité cuve',
        type: 'number',
        unit: 'L'
      }, {
        key: 'hasOilFiltration',
        label: 'Filtration huile intégrée',
        type: 'boolean'
      }],
      commonProblems: ['hot-no-heat', 'hot-thermostat', 'hot-element-burnt', 'hot-oil-smoke'],
      maintenanceInterval: 30, // Filtration huile fréquente
      avgLifespan: 8
    },
    {
      id: 'friteuse-gaz',
      label: 'Friteuse (Gaz)',
      description: 'Friteuse professionnelle à gaz',
      brands: ['Frifri', 'Valentine', 'Pitco'],
      specifications: [...HOT_SPECIFICATIONS_GAS, {
        key: 'tankCapacity',
        label: 'Capacité cuve',
        type: 'number',
        unit: 'L'
      }],
      commonProblems: ['hot-gas-no-ignite', 'hot-thermocouple', 'hot-pilot-out', 'hot-oil-smoke'],
      maintenanceInterval: 30,
      avgLifespan: 10
    },
    {
      id: 'cuiseur-pates',
      label: 'Cuiseur à pâtes',
      description: 'Cuiseur électrique pour pâtes et légumes',
      brands: ['Giorik', 'Electrolux', 'MBM', 'Zanussi'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-scale', 'hot-drain-blocked'],
      maintenanceInterval: 90,
      avgLifespan: 10
    },
    {
      id: 'bain-marie',
      label: 'Bain-marie',
      description: 'Maintien en température par eau chaude',
      brands: ['Roller Grill', 'Hatco', 'Lincat'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-scale', 'hot-thermostat', 'hot-leak'],
      maintenanceInterval: 90,
      avgLifespan: 12
    }
  ]
};

export const HOT_HOLDING: EquipmentSubCategory = {
  id: 'hot-holding',
  familyId: 'HOT',
  label: 'Maintien Chaud',
  description: 'Équipements de maintien en température',
  icon: 'ThermometerSun',
  equipmentTypes: [
    {
      id: 'passe-plat',
      label: 'Passe-plat chauffant',
      description: 'Bridge chauffant entre cuisine et salle',
      brands: ['Hatco', 'Alto-Shaam', 'Lincat', 'Roller Grill'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-element', 'hot-lamp-burnt'],
      maintenanceInterval: 180,
      avgLifespan: 10
    },
    {
      id: 'lampe-chauffante',
      label: 'Lampe chauffante',
      description: 'Lampe infrarouge pour maintien',
      brands: ['Hatco', 'Nemco', 'Bartscher'],
      specifications: [{
        key: 'lampType',
        label: 'Type lampe',
        type: 'select',
        options: ['Infrarouge', 'Halogène', 'Céramique']
      }],
      commonProblems: ['hot-lamp-burnt', 'hot-no-heat'],
      maintenanceInterval: 365,
      avgLifespan: 8
    },
    {
      id: 'armoire-chaude',
      label: 'Armoire de maintien',
      description: 'Armoire chauffante pour assiettes ou plats',
      brands: ['Alto-Shaam', 'Hatco', 'Lincat', 'Henny Penny'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-temp-wrong', 'hot-door', 'hot-humidity'],
      maintenanceInterval: 180,
      avgLifespan: 12
    },
    {
      id: 'chauffe-assiettes',
      label: 'Chauffe-assiettes',
      description: 'Distributeur d\'assiettes chauffées',
      brands: ['Rieber', 'Metro', 'Bartscher'],
      specifications: HOT_SPECIFICATIONS_ELECTRIC,
      commonProblems: ['hot-no-heat', 'hot-element', 'hot-thermostat'],
      maintenanceInterval: 365,
      avgLifespan: 15
    }
  ]
};

export const HOT_PREPARATION: EquipmentSubCategory = {
  id: 'hot-preparation',
  familyId: 'HOT',
  label: 'Préparation Motorisée',
  description: 'Robots, mixeurs, trancheuses',
  icon: 'Cog',
  equipmentTypes: [
    {
      id: 'robot-coupe',
      label: 'Robot-Coupe / Cutter',
      description: 'Robot multifonction professionnel',
      brands: ['Robot Coupe', 'Dito Sama', 'Hobart'],
      specifications: [{
        key: 'bowlCapacity',
        label: 'Capacité cuve',
        type: 'number',
        unit: 'L'
      }, {
        key: 'power',
        label: 'Puissance moteur',
        type: 'number',
        unit: 'W'
      }],
      commonProblems: ['prep-motor', 'prep-blade', 'prep-safety', 'prep-bearing'],
      maintenanceInterval: 180,
      avgLifespan: 10
    },
    {
      id: 'mixeur-plongeant',
      label: 'Mixeur plongeant',
      description: 'Mixeur à main professionnel',
      brands: ['Robot Coupe', 'Dynamic', 'Waring'],
      specifications: [{
        key: 'power',
        label: 'Puissance',
        type: 'number',
        unit: 'W'
      }, {
        key: 'shaftLength',
        label: 'Longueur bras',
        type: 'number',
        unit: 'cm'
      }],
      commonProblems: ['prep-motor', 'prep-blade', 'prep-seal'],
      maintenanceInterval: 180,
      avgLifespan: 5
    },
    {
      id: 'batteur-melangeur',
      label: 'Batteur mélangeur',
      description: 'Batteur planétaire professionnel',
      brands: ['Hobart', 'KitchenAid Pro', 'Sammic', 'Electrolux'],
      specifications: [{
        key: 'bowlCapacity',
        label: 'Capacité cuve',
        type: 'number',
        unit: 'L'
      }],
      commonProblems: ['prep-motor', 'prep-gearbox', 'prep-safety', 'prep-bowl'],
      maintenanceInterval: 180,
      avgLifespan: 15
    },
    {
      id: 'trancheuse',
      label: 'Trancheuse à jambon',
      description: 'Trancheuse professionnelle',
      brands: ['Berkel', 'Bizerba', 'Sirman', 'RGV'],
      specifications: [{
        key: 'bladeSize',
        label: 'Diamètre lame',
        type: 'select',
        options: ['250mm', '300mm', '350mm', '370mm']
      }],
      commonProblems: ['prep-motor', 'prep-blade-dull', 'prep-safety', 'prep-belt'],
      maintenanceInterval: 90,
      avgLifespan: 15
    },
    {
      id: 'sous-vide',
      label: 'Machine sous-vide',
      description: 'Emballeuse sous-vide à cloche ou aspiration',
      brands: ['Henkelman', 'Orved', 'Multivac', 'Besser Vacuum'],
      specifications: [{
        key: 'type',
        label: 'Type',
        type: 'select',
        options: ['À cloche', 'Aspiration externe']
      }, {
        key: 'barSize',
        label: 'Longueur de soudure',
        type: 'number',
        unit: 'mm'
      }],
      commonProblems: ['prep-pump', 'prep-seal-bar', 'prep-lid-seal'],
      maintenanceInterval: 180,
      avgLifespan: 10
    }
  ]
};

// ============================================================================
// DIAGNOSTIC PROBLEMS
// ============================================================================

export const HOT_PROBLEMS: DiagnosticProblem[] = [
  // --------------------------------------------------------------------------
  // PROBLÈMES ÉQUIPEMENTS GAZ
  // --------------------------------------------------------------------------
  {
    id: 'hot-gas-no-ignite',
    categoryId: 'hot-horizontal',
    label: 'Ne s\'allume pas (Gaz)',
    description: 'Le brûleur gaz ne s\'allume pas ou la flamme ne tient pas',
    severity: 'HIGH',
    type: 'GAS',
    symptoms: [
      {
        id: 'sym-no-flame',
        description: 'Pas de flamme quand on tourne le bouton',
        userQuestion: 'La flamme apparaît-elle quand vous appuyez/tournez le bouton ?',
        observationType: 'VISUAL'
      },
      {
        id: 'sym-flame-dies',
        description: 'Flamme s\'éteint quand on relâche',
        userQuestion: 'La flamme tient-elle quand vous relâchez le bouton ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-thermocouple',
        description: 'Thermocouple défectueux ou mal positionné',
        probability: 0.45,
        diagnosticClues: ['Flamme s\'éteint au relâchement', 'Thermocouple noirci ou tordu'],
        requiredParts: ['Thermocouple'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-igniter',
        description: 'Allumeur piezo ou électronique HS',
        probability: 0.25,
        diagnosticClues: ['Pas d\'étincelle', 'Clic sans étincelle'],
        requiredParts: ['Allumeur', 'Bougie'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-gas-supply',
        description: 'Alimentation gaz coupée',
        probability: 0.15,
        diagnosticClues: ['Vanne fermée', 'Coupure générale'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-injector-blocked',
        description: 'Injecteur bouché',
        probability: 0.15,
        diagnosticClues: ['Flamme faible', 'Flamme jaune', 'Débordements liquides précédents'],
        repairComplexity: 'MODERATE'
      }
    ],
    diagnosticTree: {
      id: 'dt-gas-1',
      type: 'QUESTION',
      content: 'La flamme apparaît-elle du tout quand vous appuyez sur le bouton ?',
      answers: [
        {
          id: 'ans-no-flame',
          text: 'Non, aucune flamme',
          nextNodeId: 'dt-gas-no-spark'
        },
        {
          id: 'ans-flame-dies',
          text: 'Oui mais elle s\'éteint quand je relâche',
          nextNodeId: 'dt-gas-thermocouple'
        }
      ]
    },
    immediateActions: [
      'Vérifier que le robinet gaz général est ouvert',
      'Vérifier le robinet de sécurité (coup de poing)',
      'Nettoyer le brûleur si encrassé'
    ],
    professionalActions: [
      'Remplacement thermocouple',
      'Nettoyage/remplacement injecteurs',
      'Vérification circuit gaz'
    ],
    estimatedResponseTime: '4-12h',
    priceRange: { min: 120, max: 350 },
    requiredSkills: ['gaz-professionnel', 'cuisson-pro'],
    requiredCertifications: ['Qualigaz PG'],
    safetyHazards: ['Risque fuite de gaz', 'Ne pas forcer l\'allumage']
  },
  {
    id: 'hot-gas-flame-yellow',
    categoryId: 'hot-horizontal',
    label: 'Flamme jaune / noircit les casseroles',
    description: 'Flamme anormale, jaune au lieu de bleue, dépôts de suie',
    severity: 'MEDIUM',
    type: 'GAS',
    symptoms: [
      {
        id: 'sym-yellow-flame',
        description: 'Flamme jaune/orange au lieu de bleue',
        userQuestion: 'La flamme est-elle jaune/orange plutôt que bleue ?',
        observationType: 'VISUAL'
      },
      {
        id: 'sym-soot',
        description: 'Dépôts noirs sur les casseroles',
        userQuestion: 'Vos casseroles noircissent-elles anormalement ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-air-ratio',
        description: 'Mauvais réglage air primaire',
        probability: 0.50,
        diagnosticClues: ['Bague d\'air mal positionnée', 'Brûleur déréglé'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-injector-dirty',
        description: 'Injecteur partiellement bouché',
        probability: 0.30,
        diagnosticClues: ['Flamme irrégulière', 'Débordements précédents'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-burner-dirty',
        description: 'Brûleur encrassé',
        probability: 0.20,
        diagnosticClues: ['Dépôts visibles', 'Flammes inégales'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Nettoyer le brûleur et les orifices',
      'Vérifier qu\'aucun débordement n\'a bouché les trous'
    ],
    professionalActions: [
      'Réglage du débit d\'air primaire',
      'Nettoyage/remplacement injecteurs',
      'Contrôle pression gaz'
    ],
    estimatedResponseTime: '24-48h',
    priceRange: { min: 100, max: 250 },
    requiredSkills: ['gaz-professionnel'],
    requiredCertifications: ['Qualigaz']
  },
  {
    id: 'hot-thermocouple',
    categoryId: 'hot-horizontal',
    label: 'Thermocouple défaillant',
    description: 'La sécurité gaz ne maintient pas la flamme',
    severity: 'HIGH',
    type: 'GAS',
    symptoms: [
      {
        id: 'sym-flame-release',
        description: 'Flamme s\'éteint au relâchement',
        userQuestion: 'Devez-vous maintenir le bouton enfoncé en permanence ?',
        observationType: 'FUNCTIONAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-thermocouple-worn',
        description: 'Thermocouple usé',
        probability: 0.70,
        diagnosticClues: ['Pointe noircie', 'Temps de chauffe long'],
        requiredParts: ['Thermocouple'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-thermocouple-position',
        description: 'Thermocouple mal positionné',
        probability: 0.30,
        diagnosticClues: ['Thermocouple tordu', 'Pas dans la flamme'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Nettoyer la pointe du thermocouple (papier de verre fin)',
      'Vérifier qu\'il est bien dans la flamme'
    ],
    professionalActions: [
      'Remplacement thermocouple',
      'Repositionnement correct'
    ],
    estimatedResponseTime: '4-12h',
    priceRange: { min: 80, max: 180 },
    requiredSkills: ['gaz-professionnel'],
    requiredCertifications: ['Qualigaz']
  },
  // --------------------------------------------------------------------------
  // PROBLÈMES ÉQUIPEMENTS ÉLECTRIQUES
  // --------------------------------------------------------------------------
  {
    id: 'hot-no-heat',
    categoryId: 'hot-vertical',
    label: 'Ne chauffe plus',
    description: 'L\'appareil ne produit plus de chaleur',
    severity: 'HIGH',
    type: 'ELECTRICAL',
    symptoms: [
      {
        id: 'sym-cold',
        description: 'Appareil reste froid',
        userQuestion: 'L\'appareil reste-t-il froid même après 15-20 minutes ?',
        observationType: 'TACTILE'
      },
      {
        id: 'sym-display',
        description: 'Affichage fonctionne',
        userQuestion: 'L\'écran/voyants s\'allument-ils ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-element-burnt',
        description: 'Résistance grillée',
        probability: 0.35,
        diagnosticClues: ['Résistance visible noircie', 'Odeur de brûlé précédente'],
        requiredParts: ['Résistance(s)'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-thermostat-elec',
        description: 'Thermostat/Carte défaillante',
        probability: 0.30,
        diagnosticClues: ['Pas de commande envoyée', 'Température affichée erronée'],
        requiredParts: ['Thermostat', 'Carte électronique'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-power-elec',
        description: 'Problème alimentation',
        probability: 0.20,
        diagnosticClues: ['Disjoncteur déclenché', 'Fusible HS'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-phase-missing',
        description: 'Phase manquante (triphasé)',
        probability: 0.15,
        diagnosticClues: ['Chauffe partiellement', 'Une zone sur 3 fonctionne'],
        repairComplexity: 'SIMPLE'
      }
    ],
    diagnosticTree: {
      id: 'dt-no-heat-1',
      type: 'QUESTION',
      content: 'L\'appareil s\'allume-t-il ? (Écran, voyants)',
      answers: [
        {
          id: 'ans-no-power',
          text: 'Non, rien ne s\'allume',
          nextNodeId: 'dt-no-heat-power'
        },
        {
          id: 'ans-lights-on',
          text: 'Oui, les voyants sont allumés',
          nextNodeId: 'dt-no-heat-element'
        }
      ]
    },
    immediateActions: [
      'Vérifier le disjoncteur au tableau',
      'Vérifier les 3 fusibles si triphasé',
      'Ne pas utiliser l\'appareil si odeur de brûlé'
    ],
    professionalActions: [
      'Test des résistances à l\'ohmmètre',
      'Vérification alimentation triphasée',
      'Remplacement résistance/carte'
    ],
    estimatedResponseTime: '4-12h',
    priceRange: { min: 150, max: 600 },
    requiredSkills: ['électricité-puissance', 'cuisson-pro'],
    requiredCertifications: ['Habilitation électrique BR/B2V'],
    safetyHazards: ['Risque électrique - Ne pas intervenir sous tension']
  },
  {
    id: 'hot-temp-wrong',
    categoryId: 'hot-vertical',
    label: 'Température incorrecte',
    description: 'L\'appareil ne maintient pas la bonne température',
    severity: 'MEDIUM',
    type: 'CONTROL',
    symptoms: [
      {
        id: 'sym-temp-diff',
        description: 'Écart entre consigne et réalité',
        userQuestion: 'Y a-t-il un écart important entre la température réglée et réelle ?',
        observationType: 'FUNCTIONAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-sensor',
        description: 'Sonde de température défectueuse',
        probability: 0.40,
        diagnosticClues: ['Affichage erratique', 'Température impossible'],
        requiredParts: ['Sonde température'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-thermostat-drift',
        description: 'Thermostat déréglé',
        probability: 0.35,
        diagnosticClues: ['Écart constant', 'Dérive progressive'],
        requiredParts: ['Thermostat'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-element-partial',
        description: 'Résistance partiellement HS',
        probability: 0.25,
        diagnosticClues: ['Chauffe lentement', 'N\'atteint pas la consigne'],
        requiredParts: ['Résistance'],
        repairComplexity: 'MODERATE'
      }
    ],
    immediateActions: [
      'Vérifier avec un thermomètre externe',
      'Recalibrer si fonction disponible'
    ],
    professionalActions: [
      'Calibration thermostat',
      'Remplacement sonde',
      'Test résistances'
    ],
    estimatedResponseTime: '24-48h',
    priceRange: { min: 120, max: 400 },
    requiredSkills: ['cuisson-pro']
  },
  // --------------------------------------------------------------------------
  // PROBLÈMES FOURS MIXTES / VAPEUR (Spécifique)
  // --------------------------------------------------------------------------
  {
    id: 'hot-no-steam',
    categoryId: 'hot-vertical',
    label: 'Pas de vapeur / Erreur chaudière',
    description: 'Le four ne produit plus de vapeur ou affiche une erreur chaudière',
    severity: 'HIGH',
    type: 'CLEANING',
    symptoms: [
      {
        id: 'sym-no-steam',
        description: 'Absence de vapeur en mode vapeur',
        userQuestion: 'La vapeur sort-elle en mode vapeur ?',
        observationType: 'VISUAL'
      },
      {
        id: 'sym-error-boiler',
        description: 'Code erreur chaudière',
        userQuestion: 'Voyez-vous un code erreur lié à l\'eau ou la chaudière ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-scale-boiler',
        description: 'Chaudière entartrée (cause #1)',
        probability: 0.50,
        diagnosticClues: ['Dépôts blancs', 'Eau dure', 'Détartrages négligés'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-level-sensor',
        description: 'Sonde de niveau entartrée',
        probability: 0.25,
        diagnosticClues: ['Erreur niveau eau', 'Faux niveau'],
        requiredParts: ['Sonde niveau'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-water-supply-steam',
        description: 'Alimentation eau coupée',
        probability: 0.15,
        diagnosticClues: ['Vanne fermée', 'Filtre bouché'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-heating-element-steam',
        description: 'Résistance chaudière HS',
        probability: 0.10,
        diagnosticClues: ['Chaudière froide', 'Pas de bruit de chauffe'],
        requiredParts: ['Résistance chaudière'],
        repairComplexity: 'COMPLEX'
      }
    ],
    diagnosticTree: {
      id: 'dt-steam-1',
      type: 'QUESTION',
      content: 'Quand avez-vous fait le dernier détartrage ?',
      helpText: 'Le détartrage devrait être fait tous les mois en eau dure',
      answers: [
        {
          id: 'ans-never',
          text: 'Jamais ou > 3 mois',
          nextNodeId: 'dt-steam-scale'
        },
        {
          id: 'ans-recent',
          text: 'Moins d\'un mois',
          nextNodeId: 'dt-steam-water'
        }
      ]
    },
    immediateActions: [
      'Vérifier l\'arrivée d\'eau',
      'Lancer un cycle de détartrage automatique si disponible',
      'Utiliser le four en mode convection en attendant'
    ],
    professionalActions: [
      'Détartrage professionnel complet',
      'Remplacement sonde niveau',
      'Nettoyage générateur vapeur'
    ],
    estimatedResponseTime: '4-24h',
    priceRange: { min: 200, max: 600 },
    requiredSkills: ['four-mixte', 'cuisson-pro'],
    regulatoryImplications: ['Four mixte = cœur de cuisine - Impact service fort']
  },
  {
    id: 'hot-scale',
    categoryId: 'hot-vertical',
    label: 'Entartrage sévère',
    description: 'Dépôts de calcaire importants affectant le fonctionnement',
    severity: 'MEDIUM',
    type: 'CLEANING',
    symptoms: [
      {
        id: 'sym-white-deposits',
        description: 'Dépôts blancs visibles',
        userQuestion: 'Voyez-vous des dépôts blancs/gris dans le four ?',
        observationType: 'VISUAL'
      },
      {
        id: 'sym-slow-steam',
        description: 'Production vapeur ralentie',
        userQuestion: 'La vapeur met-elle plus de temps à arriver ?',
        observationType: 'FUNCTIONAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-hard-water',
        description: 'Eau trop dure sans adoucisseur',
        probability: 0.70,
        diagnosticClues: ['TH > 15°f', 'Pas d\'adoucisseur'],
        requiredParts: ['Adoucisseur eau'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-neglected-descale',
        description: 'Détartrages non effectués',
        probability: 0.30,
        diagnosticClues: ['Carnet non à jour', 'Produit non commandé'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Lancer cycle de détartrage automatique',
      'Commander du produit détartrant adapté à la marque'
    ],
    professionalActions: [
      'Détartrage manuel complet',
      'Installation adoucisseur',
      'Réglage TH adoucisseur'
    ],
    estimatedResponseTime: '24-48h',
    priceRange: { min: 150, max: 400 },
    requiredSkills: ['four-mixte']
  },
  // --------------------------------------------------------------------------
  // PROBLÈMES INDUCTION
  // --------------------------------------------------------------------------
  {
    id: 'hot-induction-error',
    categoryId: 'hot-horizontal',
    label: 'Erreur induction',
    description: 'La plaque induction affiche un code erreur',
    severity: 'HIGH',
    type: 'CONTROL',
    symptoms: [
      {
        id: 'sym-error-code',
        description: 'Code erreur affiché',
        userQuestion: 'Quel code erreur voyez-vous ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-overheat-induction',
        description: 'Surchauffe module (ventilation)',
        probability: 0.40,
        diagnosticClues: ['Erreur E6/E8', 'Filtre encrassé', 'Arrêt après usage intensif'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-igbt-failure',
        description: 'Module IGBT défaillant',
        probability: 0.30,
        diagnosticClues: ['Erreur permanente', 'Pas de chauffe du tout'],
        requiredParts: ['Module IGBT', 'Carte puissance'],
        repairComplexity: 'COMPLEX'
      },
      {
        id: 'rc-sensor-induction',
        description: 'Sonde température HS',
        probability: 0.20,
        diagnosticClues: ['Erreur sonde', 'Température erronée'],
        requiredParts: ['Sonde'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-power-supply-ind',
        description: 'Alimentation insuffisante',
        probability: 0.10,
        diagnosticClues: ['Erreur alimentation', 'Chute de tension'],
        repairComplexity: 'MODERATE'
      }
    ],
    immediateActions: [
      'Nettoyer le filtre à air (sous/derrière l\'appareil)',
      'Laisser refroidir 15 min et réessayer',
      'Noter le code erreur exact'
    ],
    professionalActions: [
      'Diagnostic code erreur',
      'Remplacement module si nécessaire',
      'Nettoyage complet ventilation'
    ],
    estimatedResponseTime: '4-24h',
    priceRange: { min: 200, max: 800 },
    requiredSkills: ['induction-pro', 'électricité-puissance'],
    requiredCertifications: ['Habilitation électrique']
  },
  {
    id: 'hot-filter-dirty',
    categoryId: 'hot-horizontal',
    label: 'Filtre à air encrassé',
    description: 'Le filtre de ventilation est obstrué, provoquant des mises en sécurité',
    severity: 'LOW',
    type: 'CLEANING',
    symptoms: [
      {
        id: 'sym-shutdown',
        description: 'Arrêts intempestifs',
        userQuestion: 'L\'appareil s\'arrête-t-il de lui-même en cours d\'utilisation ?',
        observationType: 'FUNCTIONAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-filter-clogged',
        description: 'Filtre bouché par poussière/graisse',
        probability: 0.90,
        diagnosticClues: ['Filtre noir', 'Airflow réduit'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Retirer et nettoyer le filtre (eau savonneuse)',
      'Aspirer les grilles de ventilation',
      'Laisser sécher complètement avant remise en place'
    ],
    professionalActions: [
      'Nettoyage complet ventilation',
      'Remplacement filtre si endommagé'
    ],
    estimatedResponseTime: '48-72h',
    priceRange: { min: 50, max: 150 },
    requiredSkills: ['induction-pro']
  },
  // --------------------------------------------------------------------------
  // PROBLÈMES PRÉPARATION
  // --------------------------------------------------------------------------
  {
    id: 'prep-motor',
    categoryId: 'hot-preparation',
    label: 'Moteur en panne',
    description: 'Le moteur ne démarre pas ou fait un bruit anormal',
    severity: 'HIGH',
    type: 'MECHANICAL',
    symptoms: [
      {
        id: 'sym-no-start',
        description: 'Moteur ne démarre pas',
        userQuestion: 'Le moteur démarre-t-il quand vous appuyez sur le bouton ?',
        observationType: 'AUDITORY'
      },
      {
        id: 'sym-motor-noise',
        description: 'Bruit anormal du moteur',
        userQuestion: 'Entendez-vous un bruit inhabituel (grincement, claquement) ?',
        observationType: 'AUDITORY'
      }
    ],
    rootCauses: [
      {
        id: 'rc-safety-switch',
        description: 'Sécurité non enclenchée (couvercle mal mis)',
        probability: 0.35,
        diagnosticClues: ['Couvercle mal positionné', 'Sécurité active'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-motor-burnt',
        description: 'Moteur grillé',
        probability: 0.30,
        diagnosticClues: ['Odeur de brûlé', 'Moteur chaud', 'Surcharge'],
        requiredParts: ['Moteur'],
        repairComplexity: 'COMPLEX'
      },
      {
        id: 'rc-capacitor',
        description: 'Condensateur de démarrage HS',
        probability: 0.20,
        diagnosticClues: ['Bourdonnement sans démarrage', 'Démarre si aidé à la main'],
        requiredParts: ['Condensateur'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-switch-broken',
        description: 'Interrupteur défaillant',
        probability: 0.15,
        diagnosticClues: ['Pas de réaction au bouton', 'Contact intermittent'],
        requiredParts: ['Interrupteur'],
        repairComplexity: 'MODERATE'
      }
    ],
    immediateActions: [
      'Vérifier que le couvercle/bol est bien positionné',
      'Vérifier les sécurités (micro-switches)',
      'Ne pas forcer si odeur de brûlé'
    ],
    professionalActions: [
      'Test moteur et condensateur',
      'Remplacement si nécessaire',
      'Vérification circuit électrique'
    ],
    estimatedResponseTime: '24-48h',
    priceRange: { min: 150, max: 500 },
    requiredSkills: ['électromécanique']
  },
  {
    id: 'prep-blade',
    categoryId: 'hot-preparation',
    label: 'Lame émoussée ou endommagée',
    description: 'La lame ne coupe plus correctement',
    severity: 'LOW',
    type: 'CONSUMABLE',
    symptoms: [
      {
        id: 'sym-bad-cut',
        description: 'Coupe de mauvaise qualité',
        userQuestion: 'Les aliments sont-ils mal coupés, écrasés au lieu de tranchés ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-blade-dull',
        description: 'Lame émoussée par l\'usure',
        probability: 0.80,
        diagnosticClues: ['Usage intensif', 'Aliments durs coupés'],
        requiredParts: ['Lame', 'Affûtage'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-blade-damaged',
        description: 'Lame ébréchée ou déformée',
        probability: 0.20,
        diagnosticClues: ['Choc visible', 'Dents manquantes'],
        requiredParts: ['Lame'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Inspecter la lame visuellement',
      'Utiliser le système d\'affûtage intégré si disponible'
    ],
    professionalActions: [
      'Affûtage professionnel',
      'Remplacement lame'
    ],
    estimatedResponseTime: '48-72h',
    priceRange: { min: 50, max: 200 },
    requiredSkills: ['maintenance-générale']
  }
];

// ============================================================================
// DIAGNOSTIC NODES SUPPLÉMENTAIRES
// ============================================================================

export const HOT_DIAGNOSTIC_NODES: Record<string, DiagnosticNode> = {
  'dt-gas-no-spark': {
    id: 'dt-gas-no-spark',
    type: 'QUESTION',
    content: 'Entendez-vous un "clic" quand vous appuyez sur le bouton ?',
    helpText: 'Le clic est le bruit de l\'allumeur piezo',
    answers: [
      {
        id: 'ans-no-click',
        text: 'Non, pas de clic',
        nextNodeId: 'dt-gas-igniter'
      },
      {
        id: 'ans-click-no-spark',
        text: 'Oui clic mais pas d\'étincelle',
        nextNodeId: 'dt-gas-electrode'
      }
    ]
  },
  'dt-gas-thermocouple': {
    id: 'dt-gas-thermocouple',
    type: 'CONCLUSION',
    content: 'Thermocouple probablement défaillant',
    concludedProblemId: 'hot-thermocouple',
    confidence: 0.85,
    suggestedAction: 'Le thermocouple ne détecte pas la flamme. Nettoyage ou remplacement nécessaire.'
  },
  'dt-gas-igniter': {
    id: 'dt-gas-igniter',
    type: 'CONCLUSION',
    content: 'Allumeur piezo défaillant ou pile à remplacer',
    concludedProblemId: 'hot-gas-no-ignite',
    confidence: 0.7,
    suggestedAction: 'Vérifier pile si allumeur à pile. Sinon, allumeur piezo à remplacer.'
  },
  'dt-gas-electrode': {
    id: 'dt-gas-electrode',
    type: 'CONCLUSION',
    content: 'Électrode d\'allumage défaillante ou mal positionnée',
    concludedProblemId: 'hot-gas-no-ignite',
    confidence: 0.75,
    suggestedAction: 'L\'étincelle ne se produit pas correctement. Électrode à nettoyer/repositionner ou remplacer.'
  },
  'dt-no-heat-power': {
    id: 'dt-no-heat-power',
    type: 'ACTION',
    content: 'Vérifiez l\'alimentation électrique',
    suggestedAction: 'Vérifiez le disjoncteur dédié au tableau électrique. Pour du triphasé, vérifiez les 3 fusibles.'
  },
  'dt-no-heat-element': {
    id: 'dt-no-heat-element',
    type: 'CONCLUSION',
    content: 'Probable panne de résistance ou thermostat',
    concludedProblemId: 'hot-no-heat',
    confidence: 0.8,
    suggestedAction: 'L\'appareil reçoit le courant mais ne chauffe pas. Résistance grillée ou thermostat défaillant.'
  },
  'dt-steam-scale': {
    id: 'dt-steam-scale',
    type: 'CONCLUSION',
    content: 'Entartrage probable du générateur vapeur',
    concludedProblemId: 'hot-no-steam',
    confidence: 0.9,
    suggestedAction: '70% des pannes vapeur viennent du calcaire. Lancer un détartrage immédiatement.'
  },
  'dt-steam-water': {
    id: 'dt-steam-water',
    type: 'QUESTION',
    content: 'L\'arrivée d\'eau est-elle ouverte ? Le filtre est-il propre ?',
    answers: [
      {
        id: 'ans-water-ok',
        text: 'Oui, eau OK',
        nextNodeId: 'dt-steam-sensor'
      },
      {
        id: 'ans-water-closed',
        text: 'Vanne fermée / Filtre bouché',
        nextNodeId: 'dt-steam-water-fix'
      }
    ]
  },
  'dt-steam-sensor': {
    id: 'dt-steam-sensor',
    type: 'CONCLUSION',
    content: 'Possible panne de sonde de niveau ou résistance',
    concludedProblemId: 'hot-no-steam',
    confidence: 0.7,
    suggestedAction: 'Sonde de niveau entartrée ou résistance chaudière. Intervention technicien nécessaire.'
  },
  'dt-steam-water-fix': {
    id: 'dt-steam-water-fix',
    type: 'ACTION',
    content: 'Ouvrir la vanne d\'eau et/ou nettoyer le filtre',
    suggestedAction: 'Problème d\'alimentation eau résolu. Le four devrait fonctionner.'
  }
};

// ============================================================================
// ASSEMBLE FAMILY
// ============================================================================

HOT_FAMILY.categories = [
  HOT_VERTICAL,
  HOT_HORIZONTAL,
  HOT_FRYERS,
  HOT_HOLDING,
  HOT_PREPARATION
];

export const HOT_KNOWLEDGE_BASE = {
  family: HOT_FAMILY,
  specifications: {
    electric: HOT_SPECIFICATIONS_ELECTRIC,
    gas: HOT_SPECIFICATIONS_GAS,
    combi: HOT_SPECIFICATIONS_COMBI
  },
  problems: HOT_PROBLEMS,
  diagnosticNodes: HOT_DIAGNOSTIC_NODES
};
