// ============================================================================
// KNOWLEDGE BASE - FROID (Cold Storage)
// ============================================================================
// Taxonomie exhaustive et arbres de diagnostic pour les équipements de froid
// Basé sur les spécifications OCOA pour l'IA contextuelle

import type {
  EquipmentFamily,
  EquipmentSubCategory,
  DiagnosticProblem,
  DiagnosticNode,
  TechnicalSpecification,
} from './types';

// ============================================================================
// COLD FAMILY DEFINITION
// ============================================================================

export const COLD_FAMILY: EquipmentFamily = {
  id: 'COLD',
  label: 'Froid',
  description: 'Équipements de réfrigération et congélation - Critique pour la chaîne du froid HACCP',
  icon: 'Snowflake',
  color: 'from-cyan-500 to-blue-600',
  categories: [], // Filled below
  commonSkills: ['froid-commercial', 'diagnostic-thermique', 'manipulation-fluides'],
  riskLevel: 'CRITICAL',
  regulatoryRequirements: ['HACCP', 'Attestation Fluides Frigorigènes']
};

// ============================================================================
// TECHNICAL SPECIFICATIONS - Champs requis pour équipements froid
// ============================================================================

export const COLD_SPECIFICATIONS: TechnicalSpecification[] = [
  {
    key: 'compressorLocation',
    label: 'Type de groupe',
    type: 'select',
    options: ['Logé (intégré)', 'À distance (déporté)'],
    required: true,
    helpText: 'Logé = moteur dans l\'appareil. À distance = moteur sur toit/cave'
  },
  {
    key: 'coolingType',
    label: 'Type de condensation',
    type: 'select',
    options: ['À air', 'À eau'],
    required: true,
    helpText: 'À eau nécessite une arrivée d\'eau - vérifier en cas de panne'
  },
  {
    key: 'refrigerant',
    label: 'Fluide frigorigène',
    type: 'select',
    options: ['R134a', 'R290 (Propane)', 'R404A', 'R452A', 'R600a', 'R32', 'Autre'],
    required: true,
    helpText: 'R290 inflammable - précautions sécurité. R404A interdit maintenance lourde'
  },
  {
    key: 'temperatureRange',
    label: 'Plage de température',
    type: 'text',
    unit: '°C',
    helpText: 'Ex: +2°C à +8°C pour positif, -18°C à -24°C pour négatif'
  },
  {
    key: 'defrostType',
    label: 'Type de dégivrage',
    type: 'select',
    options: ['Naturel', 'Électrique', 'Gaz chaud'],
    helpText: 'Électrique = résistances, peut tomber en panne'
  },
  {
    key: 'voltage',
    label: 'Tension',
    type: 'select',
    options: ['230V Mono', '400V Tri'],
    required: true
  },
  {
    key: 'power',
    label: 'Puissance',
    type: 'number',
    unit: 'kW'
  },
  {
    key: 'capacity',
    label: 'Capacité',
    type: 'text',
    unit: 'L ou m³',
    helpText: 'Volume utile de stockage'
  }
];

// ============================================================================
// SUB-CATEGORIES - Froid Positif, Négatif, Production Glace, Rapide
// ============================================================================

export const COLD_POSITIVE: EquipmentSubCategory = {
  id: 'cold-positive',
  familyId: 'COLD',
  label: 'Froid Positif (Stockage)',
  description: 'Réfrigération entre +2°C et +8°C pour conservation courte durée',
  icon: 'Thermometer',
  equipmentTypes: [
    {
      id: 'armoire-refrigeree',
      label: 'Armoire réfrigérée',
      description: 'Armoire simple ou double porte pour stockage cuisine/bar',
      brands: ['Liebherr', 'Hoshizaki', 'True', 'Foster', 'Electrolux'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-cooling', 'cold-temp-high', 'cold-frost-excess', 'cold-leak', 'cold-noise', 'cold-door-seal'],
      maintenanceInterval: 180,
      avgLifespan: 10,
      priceRangeNew: { min: 1500, max: 8000 }
    },
    {
      id: 'chambre-froide-positive',
      label: 'Chambre froide positive',
      description: 'Chambre de stockage monobloc ou bibloc',
      brands: ['Dagard', 'Isocab', 'Coldkit', 'Viessmann'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-cooling', 'cold-temp-high', 'cold-door-issue', 'cold-condensation', 'cold-evaporator'],
      maintenanceInterval: 90,
      avgLifespan: 15,
      priceRangeNew: { min: 5000, max: 25000 }
    },
    {
      id: 'saladette',
      label: 'Saladette / Table réfrigérée',
      description: 'Table de travail réfrigérée avec bacs GN',
      brands: ['True', 'Infrico', 'Coreco', 'Tefcold'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-cooling', 'cold-temp-high', 'cold-leak', 'cold-door-seal'],
      maintenanceInterval: 180,
      avgLifespan: 8
    },
    {
      id: 'vitrine-boissons',
      label: 'Vitrine à boissons',
      description: 'Vitrine réfrigérée verticale pour bouteilles',
      brands: ['Liebherr', 'Tefcold', 'True', 'Polar'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-cooling', 'cold-light', 'cold-door-seal', 'cold-noise'],
      maintenanceInterval: 180,
      avgLifespan: 8
    },
    {
      id: 'cave-vin',
      label: 'Cave à vin',
      description: 'Cave mono ou multi-températures pour conservation vin',
      brands: ['EuroCave', 'Liebherr', 'Climadiff', 'La Sommelière'],
      specifications: [...COLD_SPECIFICATIONS, {
        key: 'zones',
        label: 'Nombre de zones',
        type: 'select',
        options: ['1 zone', '2 zones', '3 zones'],
        helpText: 'Multi-zones pour différents types de vins'
      }],
      commonProblems: ['cold-temp-high', 'cold-humidity', 'cold-vibration', 'cold-noise'],
      maintenanceInterval: 365,
      avgLifespan: 15
    },
    {
      id: 'arriere-bar',
      label: 'Arrière-bar réfrigéré',
      description: 'Meuble réfrigéré sous comptoir de bar',
      brands: ['True', 'Gamko', 'Infrico', 'Coreco'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-cooling', 'cold-leak', 'cold-door-seal'],
      maintenanceInterval: 180,
      avgLifespan: 8
    }
  ],
  requiredCertifications: ['Attestation Fluides Frigorigènes Catégorie I']
};

export const COLD_NEGATIVE: EquipmentSubCategory = {
  id: 'cold-negative',
  familyId: 'COLD',
  label: 'Froid Négatif (Conservation)',
  description: 'Congélation entre -18°C et -24°C pour conservation longue durée',
  icon: 'Snowflake',
  equipmentTypes: [
    {
      id: 'armoire-negative',
      label: 'Armoire négative',
      description: 'Congélateur armoire professionnel',
      brands: ['Liebherr', 'Hoshizaki', 'True', 'Foster'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-freeze', 'cold-temp-unstable', 'cold-ice-buildup', 'cold-compressor', 'cold-alarm'],
      maintenanceInterval: 180,
      avgLifespan: 10
    },
    {
      id: 'congelateur-coffre',
      label: 'Congélateur coffre (Bahut)',
      description: 'Congélateur horizontal grande capacité',
      brands: ['Liebherr', 'Elcold', 'Derby', 'Tefcold'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-freeze', 'cold-ice-buildup', 'cold-seal', 'cold-thermostat'],
      maintenanceInterval: 180,
      avgLifespan: 12
    },
    {
      id: 'chambre-froide-negative',
      label: 'Chambre froide négative',
      description: 'Chambre de stockage surgélation',
      brands: ['Dagard', 'Isocab', 'Coldkit'],
      specifications: [...COLD_SPECIFICATIONS, {
        key: 'heatingCord',
        label: 'Cordon chauffant porte',
        type: 'boolean',
        helpText: 'Résistance pour éviter le gel des joints'
      }],
      commonProblems: ['cold-no-freeze', 'cold-door-frozen', 'cold-evaporator', 'cold-alarm'],
      maintenanceInterval: 90,
      avgLifespan: 15
    },
    {
      id: 'conservateur-glaces',
      label: 'Conservateur à glaces',
      description: 'Congélateur vitrine pour crèmes glacées',
      brands: ['ISA', 'Framec', 'Tecfrigo', 'Liebherr'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-temp-high', 'cold-frost-excess', 'cold-light', 'cold-door-seal'],
      maintenanceInterval: 180,
      avgLifespan: 10
    }
  ],
  requiredCertifications: ['Attestation Fluides Frigorigènes Catégorie I']
};

export const COLD_ICE_PRODUCTION: EquipmentSubCategory = {
  id: 'cold-ice',
  familyId: 'COLD',
  label: 'Production de Glace',
  description: 'Machines à glaçons et glace pilée',
  icon: 'Snowflake',
  equipmentTypes: [
    {
      id: 'machine-glacons-cubes',
      label: 'Machine à glaçons (Cubes)',
      description: 'Producteur de glaçons cubes pleins ou creux',
      brands: ['Hoshizaki', 'Scotsman', 'Manitowoc', 'Brema', 'Ice-O-Matic'],
      specifications: [...COLD_SPECIFICATIONS, {
        key: 'iceType',
        label: 'Type de glaçons',
        type: 'select',
        options: ['Cubes pleins', 'Cubes creux', 'Demi-cubes'],
      }, {
        key: 'productionCapacity',
        label: 'Production',
        type: 'number',
        unit: 'kg/24h'
      }, {
        key: 'storageCapacity',
        label: 'Réserve',
        type: 'number',
        unit: 'kg'
      }],
      commonProblems: ['ice-no-production', 'ice-slow', 'ice-cloudy', 'ice-leak', 'ice-dirty'],
      maintenanceInterval: 90,
      avgLifespan: 8
    },
    {
      id: 'machine-glace-pilee',
      label: 'Machine à glace pilée',
      description: 'Producteur de glace pilée / paillettes',
      brands: ['Hoshizaki', 'Scotsman', 'Brema'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['ice-no-production', 'ice-texture', 'ice-leak'],
      maintenanceInterval: 90,
      avgLifespan: 8
    },
    {
      id: 'machine-ecailles',
      label: 'Machine à écailles',
      description: 'Glace en écailles pour poissonnerie / fruits de mer',
      brands: ['Scotsman', 'Hoshizaki', 'Maja', 'Ziegra'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['ice-no-production', 'ice-slow', 'ice-leak'],
      maintenanceInterval: 60,
      avgLifespan: 10
    }
  ],
  requiredCertifications: ['Attestation Fluides Frigorigènes']
};

export const COLD_RAPID: EquipmentSubCategory = {
  id: 'cold-rapid',
  familyId: 'COLD',
  label: 'Froid Rapide',
  description: 'Cellules de refroidissement et surgélation rapide',
  icon: 'Zap',
  equipmentTypes: [
    {
      id: 'cellule-refroidissement',
      label: 'Cellule de refroidissement (Blast Chiller)',
      description: 'Refroidissement rapide de +65°C à +3°C',
      brands: ['Irinox', 'Electrolux', 'Rational', 'Alto-Shaam', 'Tecnomac'],
      specifications: [...COLD_SPECIFICATIONS, {
        key: 'capacity',
        label: 'Capacité',
        type: 'text',
        unit: 'kg ou niveaux GN'
      }, {
        key: 'hasCoreSensor',
        label: 'Sonde à cœur',
        type: 'boolean',
        required: true,
        helpText: 'Obligatoire pour HACCP - mesure température interne'
      }],
      commonProblems: ['cold-no-cooling', 'cold-sensor', 'cold-compressor', 'cold-door-seal'],
      maintenanceInterval: 90,
      avgLifespan: 12
    },
    {
      id: 'surgelateur',
      label: 'Surgélateur rapide',
      description: 'Descente en température ultra-rapide à -40°C',
      brands: ['Irinox', 'Tecnomac', 'Friginox'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-freeze', 'cold-temp-unstable', 'cold-sensor'],
      maintenanceInterval: 90,
      avgLifespan: 12
    }
  ],
  requiredCertifications: ['Attestation Fluides Frigorigènes Catégorie I']
};

export const COLD_SPECIALTY: EquipmentSubCategory = {
  id: 'cold-specialty',
  familyId: 'COLD',
  label: 'Froid Spécifique',
  description: 'Équipements spécialisés avec refroidissement intégré',
  icon: 'Coffee',
  equipmentTypes: [
    {
      id: 'sorbetiere',
      label: 'Sorbetière / Turbine à glace',
      description: 'Machine à glace artisanale',
      brands: ['Carpigiani', 'Bravo', 'Nemox', 'Electrolux'],
      specifications: [...COLD_SPECIFICATIONS, {
        key: 'bowlCapacity',
        label: 'Capacité cuve',
        type: 'number',
        unit: 'L'
      }],
      commonProblems: ['ice-texture', 'cold-no-cooling', 'cold-motor', 'cold-hygiene'],
      maintenanceInterval: 30, // Nettoyage fréquent
      avgLifespan: 10
    },
    {
      id: 'machine-chantilly',
      label: 'Machine à Chantilly',
      description: 'Distributeur de crème chantilly réfrigéré',
      brands: ['Sanomat', 'Mussana', 'Robot Coupe'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-cooling', 'cold-hygiene', 'cold-motor'],
      maintenanceInterval: 7, // Nettoyage quotidien/hebdo
      avgLifespan: 8
    },
    {
      id: 'distributeur-granita',
      label: 'Machine à Granita',
      description: 'Distributeur de boissons glacées',
      brands: ['Ugolini', 'SPM', 'GBG', 'Elmeco'],
      specifications: COLD_SPECIFICATIONS,
      commonProblems: ['cold-no-cooling', 'cold-motor', 'cold-hygiene', 'cold-leak'],
      maintenanceInterval: 7,
      avgLifespan: 6
    }
  ]
};

// ============================================================================
// DIAGNOSTIC PROBLEMS - Problèmes avec arbres de diagnostic
// ============================================================================

export const COLD_PROBLEMS: DiagnosticProblem[] = [
  // --------------------------------------------------------------------------
  // PROBLÈMES DE TEMPÉRATURE
  // --------------------------------------------------------------------------
  {
    id: 'cold-no-cooling',
    categoryId: 'cold-positive',
    label: 'Ne refroidit plus du tout',
    description: 'L\'équipement ne produit plus de froid, température ambiante à l\'intérieur',
    severity: 'CRITICAL',
    type: 'REFRIGERANT',
    symptoms: [
      {
        id: 'sym-temp-ambient',
        description: 'Température intérieure proche de l\'ambiante',
        userQuestion: 'L\'intérieur est-il à température ambiante (tiède) ?',
        observationType: 'TACTILE'
      },
      {
        id: 'sym-compressor-silent',
        description: 'Aucun bruit de compresseur',
        userQuestion: 'Entendez-vous le moteur (compresseur) tourner ?',
        observationType: 'AUDITORY'
      }
    ],
    rootCauses: [
      {
        id: 'rc-power',
        description: 'Problème d\'alimentation électrique',
        probability: 0.25,
        diagnosticClues: ['Appareil éteint', 'Pas de lumière intérieure', 'Disjoncteur déclenché'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-thermostat',
        description: 'Thermostat défaillant',
        probability: 0.20,
        diagnosticClues: ['Compresseur ne démarre jamais', 'Réglage sans effet'],
        requiredParts: ['Thermostat'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-compressor',
        description: 'Compresseur HS',
        probability: 0.25,
        diagnosticClues: ['Clics répétés au démarrage', 'Bourdonnement puis arrêt'],
        requiredParts: ['Compresseur', 'Condensateur démarrage'],
        repairComplexity: 'COMPLEX'
      },
      {
        id: 'rc-refrigerant-leak',
        description: 'Fuite de gaz frigorigène',
        probability: 0.30,
        diagnosticClues: ['Compresseur tourne en continu', 'Évaporateur pas froid', 'Traces d\'huile'],
        requiredParts: ['Gaz frigorigène', 'Brasure'],
        repairComplexity: 'SPECIALIST'
      }
    ],
    diagnosticTree: {
      id: 'dt-no-cooling-1',
      type: 'QUESTION',
      content: 'L\'appareil est-il allumé ? (Voyant lumineux, lumière intérieure)',
      answers: [
        {
          id: 'ans-not-lit',
          text: 'Non, tout est éteint',
          nextNodeId: 'dt-no-cooling-power'
        },
        {
          id: 'ans-lit',
          text: 'Oui, il y a de la lumière',
          nextNodeId: 'dt-no-cooling-motor'
        }
      ]
    },
    immediateActions: [
      'Vérifier que la prise est bien branchée',
      'Vérifier le disjoncteur au tableau électrique',
      'Transférer les denrées périssables dans un autre frigo'
    ],
    professionalActions: [
      'Diagnostic complet du circuit frigorifique',
      'Test du compresseur et des composants électriques',
      'Recherche de fuite si nécessaire'
    ],
    estimatedResponseTime: '< 4h',
    priceRange: { min: 150, max: 800 },
    estimatedDowntime: '2-8h selon panne',
    requiredSkills: ['froid-commercial', 'diagnostic-electrique'],
    requiredCertifications: ['Attestation Fluides Frigorigènes'],
    safetyHazards: ['Risque électrique', 'Gaz sous pression'],
    regulatoryImplications: ['Chaîne du froid HACCP rompue - relevé obligatoire']
  },
  {
    id: 'cold-temp-high',
    categoryId: 'cold-positive',
    label: 'Température trop élevée',
    description: 'L\'appareil refroidit mais pas assez, température au-dessus de la consigne',
    severity: 'HIGH',
    type: 'THERMAL',
    symptoms: [
      {
        id: 'sym-temp-above',
        description: 'Température 2-5°C au-dessus de la consigne',
        userQuestion: 'Quelle température affiche le thermomètre ?',
        observationType: 'VISUAL'
      },
      {
        id: 'sym-compressor-continuous',
        description: 'Compresseur tourne en permanence',
        userQuestion: 'Le moteur tourne-t-il sans jamais s\'arrêter ?',
        observationType: 'AUDITORY'
      }
    ],
    rootCauses: [
      {
        id: 'rc-condenser-dirty',
        description: 'Condenseur encrassé (cause #1 en restauration)',
        probability: 0.40,
        diagnosticClues: ['Arrière/dessus très chaud', 'Poussière/graisse visible sur grilles'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-fan-evaporator',
        description: 'Ventilateur évaporateur en panne',
        probability: 0.20,
        diagnosticClues: ['Pas de circulation d\'air', 'Ventilateur immobile ou bruyant'],
        requiredParts: ['Moteur ventilateur'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-door-seal',
        description: 'Joint de porte usé ou mal positionné',
        probability: 0.20,
        diagnosticClues: ['Givre autour de la porte', 'Porte ne ferme pas bien'],
        requiredParts: ['Joint de porte'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-low-refrigerant',
        description: 'Manque de gaz (fuite légère)',
        probability: 0.20,
        diagnosticClues: ['Évaporateur partiellement givré', 'Performance dégradée progressivement'],
        repairComplexity: 'SPECIALIST'
      }
    ],
    diagnosticTree: {
      id: 'dt-temp-high-1',
      type: 'QUESTION',
      content: 'L\'arrière ou le dessus de la machine est-il très chaud ou poussiéreux ?',
      helpText: 'Le condenseur (grille à l\'arrière) doit évacuer la chaleur',
      answers: [
        {
          id: 'ans-dusty',
          text: 'Oui, c\'est très chaud et/ou poussiéreux',
          nextNodeId: 'dt-temp-high-condenser'
        },
        {
          id: 'ans-clean',
          text: 'Non, c\'est propre et pas excessivement chaud',
          nextNodeId: 'dt-temp-high-fan'
        }
      ]
    },
    immediateActions: [
      'Nettoyer le condenseur (aspirateur + brosse)',
      'Vérifier que rien ne bloque l\'aération arrière',
      'Vérifier l\'état du joint de porte'
    ],
    professionalActions: [
      'Contrôle du circuit frigorifique',
      'Vérification des pressions HP/BP',
      'Remplacement ventilateur si nécessaire'
    ],
    estimatedResponseTime: '4-12h',
    priceRange: { min: 80, max: 400 },
    requiredSkills: ['froid-commercial', 'diagnostic-thermique'],
    regulatoryImplications: ['Relevé température HACCP']
  },
  {
    id: 'cold-frost-excess',
    categoryId: 'cold-positive',
    label: 'Givre excessif',
    description: 'Formation anormale de givre sur l\'évaporateur ou les parois',
    severity: 'MEDIUM',
    type: 'THERMAL',
    symptoms: [
      {
        id: 'sym-frost-visible',
        description: 'Couche de givre épaisse visible',
        userQuestion: 'Voyez-vous une couche de givre blanche épaisse à l\'intérieur ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-door-seal-frost',
        description: 'Entrée d\'air humide (joint défectueux)',
        probability: 0.40,
        diagnosticClues: ['Givre concentré autour de la porte', 'Joint sec ou déchiré'],
        requiredParts: ['Joint de porte'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-defrost-failure',
        description: 'Système de dégivrage en panne',
        probability: 0.35,
        diagnosticClues: ['Résistance de dégivrage froide', 'Timer bloqué', 'Évaporateur bloc de glace'],
        requiredParts: ['Résistance dégivrage', 'Timer', 'Klixon'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-door-open',
        description: 'Porte ouverte trop souvent/longtemps',
        probability: 0.25,
        diagnosticClues: ['Usure excessive joint', 'Service intense'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Vérifier l\'état du joint de porte (test du billet)',
      'Limiter les ouvertures de porte',
      'Dégivrer manuellement si bloc de glace'
    ],
    professionalActions: [
      'Contrôle circuit de dégivrage',
      'Remplacement résistance/timer si nécessaire',
      'Remplacement joint de porte'
    ],
    estimatedResponseTime: '24-48h',
    priceRange: { min: 100, max: 300 },
    requiredSkills: ['froid-commercial']
  },
  {
    id: 'cold-leak',
    categoryId: 'cold-positive',
    label: 'Fuite d\'eau',
    description: 'Eau au sol ou à l\'intérieur de l\'appareil',
    severity: 'MEDIUM',
    type: 'HYDRAULIC',
    symptoms: [
      {
        id: 'sym-water-floor',
        description: 'Flaque d\'eau sous ou autour de l\'appareil',
        userQuestion: 'Y a-t-il de l\'eau au sol sous ou devant l\'appareil ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-drain-blocked',
        description: 'Écoulement de dégivrage bouché',
        probability: 0.50,
        diagnosticClues: ['Eau dans le fond du frigo', 'Goulotte pleine', 'Résidus alimentaires'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-drip-tray',
        description: 'Bac de ré-évaporation plein ou résistance HS',
        probability: 0.30,
        diagnosticClues: ['Eau sous l\'appareil (arrière)', 'Bac déborde'],
        requiredParts: ['Résistance bac'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-condensation',
        description: 'Condensation excessive (humidité ambiante)',
        probability: 0.20,
        diagnosticClues: ['Cuisine très humide', 'Gouttelettes sur carrosserie'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Nettoyer la goulotte d\'écoulement avec un fil souple',
      'Vider le bac de récupération si accessible',
      'Éponger l\'eau pour éviter les chutes'
    ],
    professionalActions: [
      'Débouchage professionnel de l\'évacuation',
      'Vérification du bac de ré-évaporation',
      'Remplacement résistance bac si nécessaire'
    ],
    estimatedResponseTime: '24-48h',
    priceRange: { min: 80, max: 200 },
    requiredSkills: ['froid-commercial']
  },
  {
    id: 'cold-noise',
    categoryId: 'cold-positive',
    label: 'Bruit anormal',
    description: 'Bruits inhabituels : claquements, vibrations, grincements',
    severity: 'LOW',
    type: 'MECHANICAL',
    symptoms: [
      {
        id: 'sym-noise',
        description: 'Bruit nouveau ou anormal',
        userQuestion: 'Quel type de bruit entendez-vous ?',
        observationType: 'AUDITORY'
      }
    ],
    rootCauses: [
      {
        id: 'rc-fan-motor',
        description: 'Roulement ventilateur usé',
        probability: 0.35,
        diagnosticClues: ['Grincement continu', 'Bruit qui varie avec le ventilateur'],
        requiredParts: ['Moteur ventilateur'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-compressor-mount',
        description: 'Silent bloc compresseur usé',
        probability: 0.25,
        diagnosticClues: ['Vibrations transmises au sol', 'Bruit intermittent'],
        requiredParts: ['Silent blocs'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-positioning',
        description: 'Appareil mal calé',
        probability: 0.25,
        diagnosticClues: ['Vibrations', 'Appareil pas de niveau'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-expansion-valve',
        description: 'Détendeur qui siffle',
        probability: 0.15,
        diagnosticClues: ['Sifflement aigu', 'Bruit de gaz'],
        repairComplexity: 'SPECIALIST'
      }
    ],
    immediateActions: [
      'Vérifier que l\'appareil est de niveau',
      'Vérifier que rien ne touche les grilles/ventilateurs',
      'Éloigner l\'appareil du mur si contact'
    ],
    professionalActions: [
      'Remplacement ventilateur/moteur',
      'Remplacement silent blocs',
      'Diagnostic circuit frigorifique si sifflement'
    ],
    estimatedResponseTime: '48-72h',
    priceRange: { min: 100, max: 350 },
    requiredSkills: ['froid-commercial']
  },
  {
    id: 'cold-door-seal',
    categoryId: 'cold-positive',
    label: 'Joint de porte défectueux',
    description: 'Joint usé, déchiré ou qui ne maintient plus l\'étanchéité',
    severity: 'LOW',
    type: 'CONSUMABLE',
    symptoms: [
      {
        id: 'sym-seal-damage',
        description: 'Joint visible endommagé',
        userQuestion: 'Le joint est-il déchiré, sec ou déformé ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-seal-worn',
        description: 'Usure normale du joint',
        probability: 0.60,
        diagnosticClues: ['Joint sec, dur, fissuré', 'Perte d\'élasticité'],
        requiredParts: ['Joint de porte'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-seal-damaged',
        description: 'Joint déchiré (choc, manipulation)',
        probability: 0.40,
        diagnosticClues: ['Déchirure visible', 'Partie manquante'],
        requiredParts: ['Joint de porte'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Nettoyer le joint à l\'eau savonneuse',
      'Sécher le joint pour redonner de la souplesse',
      'Vérifier l\'alignement de la porte'
    ],
    professionalActions: [
      'Remplacement du joint',
      'Réglage des charnières si nécessaire'
    ],
    estimatedResponseTime: '48-72h',
    priceRange: { min: 80, max: 200 },
    requiredSkills: ['froid-commercial']
  },
  // --------------------------------------------------------------------------
  // PROBLÈMES FROID NÉGATIF SPÉCIFIQUES
  // --------------------------------------------------------------------------
  {
    id: 'cold-no-freeze',
    categoryId: 'cold-negative',
    label: 'Ne congèle plus',
    description: 'Le congélateur ne descend plus en température négative',
    severity: 'CRITICAL',
    type: 'REFRIGERANT',
    symptoms: [
      {
        id: 'sym-temp-positive',
        description: 'Température au-dessus de 0°C',
        userQuestion: 'Le thermomètre indique-t-il une température positive ?',
        observationType: 'VISUAL'
      },
      {
        id: 'sym-products-thawing',
        description: 'Produits qui décongèlent',
        userQuestion: 'Les produits surgelés sont-ils en train de décongeler ?',
        observationType: 'TACTILE'
      }
    ],
    rootCauses: [
      {
        id: 'rc-compressor-neg',
        description: 'Compresseur défaillant',
        probability: 0.35,
        diagnosticClues: ['Pas de bruit moteur', 'Déclenchement thermique'],
        requiredParts: ['Compresseur', 'Relais'],
        repairComplexity: 'COMPLEX'
      },
      {
        id: 'rc-refrigerant-leak-neg',
        description: 'Fuite de gaz importante',
        probability: 0.35,
        diagnosticClues: ['Compresseur tourne mais pas de froid', 'Évaporateur tiède'],
        repairComplexity: 'SPECIALIST'
      },
      {
        id: 'rc-thermostat-neg',
        description: 'Thermostat bloqué',
        probability: 0.20,
        diagnosticClues: ['Compresseur ne démarre jamais'],
        requiredParts: ['Thermostat'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-power-neg',
        description: 'Alimentation électrique',
        probability: 0.10,
        diagnosticClues: ['Appareil éteint', 'Disjoncteur'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Transférer immédiatement les produits dans un autre congélateur',
      'NE PAS recongeler les produits décongelés',
      'Relever les températures pour traçabilité HACCP'
    ],
    professionalActions: [
      'Diagnostic complet circuit',
      'Réparation ou remplacement compresseur',
      'Recharge gaz si fuite'
    ],
    estimatedResponseTime: '< 4h',
    priceRange: { min: 200, max: 1200 },
    requiredSkills: ['froid-commercial', 'froid-negatif'],
    requiredCertifications: ['Attestation Fluides Frigorigènes'],
    safetyHazards: ['Perte de stock', 'Risque sanitaire'],
    regulatoryImplications: ['HACCP - Produits à détruire si T > -15°C pendant > 2h']
  },
  {
    id: 'cold-ice-buildup',
    categoryId: 'cold-negative',
    label: 'Accumulation de glace excessive',
    description: 'Formation de glace épaisse sur l\'évaporateur ou les parois',
    severity: 'MEDIUM',
    type: 'THERMAL',
    symptoms: [
      {
        id: 'sym-ice-thick',
        description: 'Couche de glace > 5mm',
        userQuestion: 'La couche de glace fait-elle plus d\'un demi-centimètre ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-defrost-neg',
        description: 'Dégivrage automatique en panne',
        probability: 0.50,
        diagnosticClues: ['Résistance ne chauffe pas', 'Timer bloqué', 'Évaporateur = bloc de glace'],
        requiredParts: ['Résistance', 'Timer', 'Klixon fin de dégivrage'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-door-neg',
        description: 'Porte mal fermée ou joint usé',
        probability: 0.30,
        diagnosticClues: ['Givre surtout autour de la porte', 'Porte difficile à fermer'],
        requiredParts: ['Joint'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-overload',
        description: 'Surcharge ou mauvais rangement',
        probability: 0.20,
        diagnosticClues: ['Circulation d\'air bloquée', 'Produits contre l\'évaporateur'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Dégivrage manuel si glace bloque le fonctionnement',
      'Vérifier la fermeture correcte de la porte',
      'Réorganiser le rangement pour circulation d\'air'
    ],
    professionalActions: [
      'Contrôle circuit de dégivrage',
      'Remplacement composants défaillants',
      'Remplacement joint'
    ],
    estimatedResponseTime: '24-48h',
    priceRange: { min: 150, max: 400 },
    requiredSkills: ['froid-commercial']
  },
  // --------------------------------------------------------------------------
  // PROBLÈMES MACHINES À GLAÇONS
  // --------------------------------------------------------------------------
  {
    id: 'ice-no-production',
    categoryId: 'cold-ice',
    label: 'Plus de production de glaçons',
    description: 'La machine ne produit plus de glaçons',
    severity: 'HIGH',
    type: 'REFRIGERANT',
    symptoms: [
      {
        id: 'sym-no-ice',
        description: 'Bac à glaçons vide',
        userQuestion: 'Le bac à glaçons est-il vide depuis plusieurs heures ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-water-supply',
        description: 'Alimentation en eau coupée',
        probability: 0.30,
        diagnosticClues: ['Pas d\'eau dans la cuve', 'Vanne fermée', 'Filtre bouché'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-pump-ice',
        description: 'Pompe de circulation HS',
        probability: 0.25,
        diagnosticClues: ['Pas de bruit de pompe', 'Eau stagnante'],
        requiredParts: ['Pompe'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-evap-ice',
        description: 'Évaporateur entartré ou bouché',
        probability: 0.25,
        diagnosticClues: ['Eau dure', 'Dépôt blanc visible', 'Production lente avant arrêt'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-refrigerant-ice',
        description: 'Problème frigorifique',
        probability: 0.20,
        diagnosticClues: ['Compresseur silencieux', 'Évaporateur tiède'],
        repairComplexity: 'SPECIALIST'
      }
    ],
    immediateActions: [
      'Vérifier l\'arrivée d\'eau (vanne ouverte ?)',
      'Vérifier le filtre à eau',
      'Écouter si la pompe fonctionne'
    ],
    professionalActions: [
      'Détartrage complet',
      'Remplacement pompe',
      'Diagnostic circuit frigorifique'
    ],
    estimatedResponseTime: '4-12h',
    priceRange: { min: 150, max: 500 },
    requiredSkills: ['froid-commercial', 'machine-glace']
  },
  {
    id: 'ice-slow',
    categoryId: 'cold-ice',
    label: 'Production lente',
    description: 'La machine produit moins de glaçons que d\'habitude',
    severity: 'MEDIUM',
    type: 'THERMAL',
    symptoms: [
      {
        id: 'sym-slow-production',
        description: 'Production réduite',
        userQuestion: 'La production a-t-elle diminué de plus de 30% ?',
        observationType: 'FUNCTIONAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-condenser-ice',
        description: 'Condenseur encrassé',
        probability: 0.40,
        diagnosticClues: ['Condenseur poussiéreux', 'Machine chaude'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-scale-ice',
        description: 'Entartrage évaporateur',
        probability: 0.35,
        diagnosticClues: ['Eau dure', 'Dépôts blancs'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-ambient-temp',
        description: 'Température ambiante élevée',
        probability: 0.15,
        diagnosticClues: ['Cuisine très chaude', 'Été'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-low-water-pressure',
        description: 'Pression d\'eau insuffisante',
        probability: 0.10,
        diagnosticClues: ['Remplissage lent', 'Autres robinets faibles'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Nettoyer le condenseur',
      'Vérifier l\'aération autour de la machine',
      'Lancer un cycle de nettoyage si disponible'
    ],
    professionalActions: [
      'Détartrage complet',
      'Nettoyage circuit eau',
      'Vérification pressions frigorifiques'
    ],
    estimatedResponseTime: '24-48h',
    priceRange: { min: 100, max: 300 },
    requiredSkills: ['froid-commercial', 'machine-glace']
  },
  {
    id: 'ice-cloudy',
    categoryId: 'cold-ice',
    label: 'Glaçons troubles ou blancs',
    description: 'Les glaçons ne sont pas transparents, aspect laiteux',
    severity: 'LOW',
    type: 'CLEANING',
    symptoms: [
      {
        id: 'sym-cloudy',
        description: 'Glaçons opaques',
        userQuestion: 'Les glaçons sont-ils blancs ou troubles au lieu d\'être transparents ?',
        observationType: 'VISUAL'
      }
    ],
    rootCauses: [
      {
        id: 'rc-minerals',
        description: 'Eau trop minéralisée (calcaire)',
        probability: 0.60,
        diagnosticClues: ['Eau dure', 'Pas de filtre ou filtre saturé'],
        requiredParts: ['Filtre à eau', 'Adoucisseur'],
        repairComplexity: 'SIMPLE'
      },
      {
        id: 'rc-air-bubbles',
        description: 'Air emprisonné (circulation insuffisante)',
        probability: 0.25,
        diagnosticClues: ['Pompe faible', 'Bulles visibles'],
        repairComplexity: 'MODERATE'
      },
      {
        id: 'rc-dirty-machine',
        description: 'Machine encrassée',
        probability: 0.15,
        diagnosticClues: ['Nettoyage négligé', 'Algues/moisissures'],
        repairComplexity: 'SIMPLE'
      }
    ],
    immediateActions: [
      'Remplacer le filtre à eau',
      'Lancer un cycle de nettoyage',
      'Vider et rincer le bac'
    ],
    professionalActions: [
      'Installation adoucisseur',
      'Nettoyage complet circuit',
      'Vérification pompe circulation'
    ],
    estimatedResponseTime: '48-72h',
    priceRange: { min: 80, max: 250 },
    requiredSkills: ['machine-glace']
  }
];

// ============================================================================
// ADDITIONAL DIAGNOSTIC NODES (Arbres complets)
// ============================================================================

export const COLD_DIAGNOSTIC_NODES: Record<string, DiagnosticNode> = {
  'dt-no-cooling-power': {
    id: 'dt-no-cooling-power',
    type: 'ACTION',
    content: 'Vérifiez l\'alimentation électrique',
    helpText: 'Regardez si le disjoncteur dédié au frigo est enclenché au tableau électrique',
    suggestedAction: 'Réenclencher le disjoncteur. Si ça redisjoncte immédiatement, ne pas insister - problème électrique grave.'
  },
  'dt-no-cooling-motor': {
    id: 'dt-no-cooling-motor',
    type: 'QUESTION',
    content: 'Entendez-vous le compresseur (moteur) tourner ?',
    helpText: 'C\'est un bourdonnement grave venant de l\'arrière ou du dessous',
    answers: [
      {
        id: 'ans-motor-silent',
        text: 'Non, silence complet',
        nextNodeId: 'dt-no-cooling-thermostat'
      },
      {
        id: 'ans-motor-clicking',
        text: 'J\'entends des "clics" répétés',
        nextNodeId: 'dt-no-cooling-compressor-start'
      },
      {
        id: 'ans-motor-running',
        text: 'Oui, le moteur tourne',
        nextNodeId: 'dt-no-cooling-gas'
      }
    ]
  },
  'dt-no-cooling-thermostat': {
    id: 'dt-no-cooling-thermostat',
    type: 'CONCLUSION',
    content: 'Probable panne du thermostat ou de la carte électronique',
    concludedProblemId: 'cold-no-cooling',
    confidence: 0.7,
    suggestedAction: 'Le compresseur ne reçoit pas l\'ordre de démarrer. Intervention technicien nécessaire.'
  },
  'dt-no-cooling-compressor-start': {
    id: 'dt-no-cooling-compressor-start',
    type: 'CONCLUSION',
    content: 'Le compresseur n\'arrive pas à démarrer (klixon ou condensateur)',
    concludedProblemId: 'cold-no-cooling',
    confidence: 0.8,
    suggestedAction: 'Le klixon (sécurité thermique) coupe le compresseur. Peut être dû à un condensateur de démarrage HS ou compresseur grippé. Intervention urgente.'
  },
  'dt-no-cooling-gas': {
    id: 'dt-no-cooling-gas',
    type: 'CONCLUSION',
    content: 'Probable manque de gaz frigorigène (fuite)',
    concludedProblemId: 'cold-no-cooling',
    confidence: 0.75,
    suggestedAction: 'Le compresseur tourne mais ne fait pas de froid = circuit frigorifique vide. Recherche de fuite et recharge nécessaires.'
  },
  'dt-temp-high-condenser': {
    id: 'dt-temp-high-condenser',
    type: 'ACTION',
    content: 'Condenseur encrassé - Nettoyage nécessaire',
    helpText: 'C\'est la cause #1 des pannes de froid en restauration !',
    suggestedAction: 'Aspirez la poussière et graisse sur les ailettes du condenseur (grille arrière). Cela résout souvent le problème immédiatement.'
  },
  'dt-temp-high-fan': {
    id: 'dt-temp-high-fan',
    type: 'QUESTION',
    content: 'Le ventilateur intérieur (évaporateur) tourne-t-il ?',
    helpText: 'Ouvrez la porte et regardez si le ventilateur brasse l\'air',
    answers: [
      {
        id: 'ans-fan-stopped',
        text: 'Non, le ventilateur est arrêté',
        nextNodeId: 'dt-temp-high-fan-broken'
      },
      {
        id: 'ans-fan-running',
        text: 'Oui, il tourne normalement',
        nextNodeId: 'dt-temp-high-seal'
      }
    ]
  },
  'dt-temp-high-fan-broken': {
    id: 'dt-temp-high-fan-broken',
    type: 'CONCLUSION',
    content: 'Ventilateur évaporateur en panne',
    concludedProblemId: 'cold-temp-high',
    confidence: 0.85,
    suggestedAction: 'Sans ventilateur, l\'air froid ne circule pas. Moteur de ventilateur à remplacer.'
  },
  'dt-temp-high-seal': {
    id: 'dt-temp-high-seal',
    type: 'QUESTION',
    content: 'Le joint de porte est-il en bon état ?',
    helpText: 'Test du billet : placez un billet entre le joint et le cadre. S\'il tombe, le joint ne fait plus son travail.',
    answers: [
      {
        id: 'ans-seal-bad',
        text: 'Non, le joint est usé/déchiré ou le billet tombe',
        nextNodeId: 'dt-temp-high-seal-replace'
      },
      {
        id: 'ans-seal-good',
        text: 'Oui, le joint est correct',
        nextNodeId: 'dt-temp-high-refrigerant'
      }
    ]
  },
  'dt-temp-high-seal-replace': {
    id: 'dt-temp-high-seal-replace',
    type: 'CONCLUSION',
    content: 'Joint de porte à remplacer',
    concludedProblemId: 'cold-door-seal',
    confidence: 0.9,
    suggestedAction: 'L\'entrée d\'air chaud empêche l\'appareil de maintenir la température. Remplacement du joint nécessaire.'
  },
  'dt-temp-high-refrigerant': {
    id: 'dt-temp-high-refrigerant',
    type: 'CONCLUSION',
    content: 'Possible manque de gaz ou problème thermodynamique',
    concludedProblemId: 'cold-temp-high',
    confidence: 0.7,
    suggestedAction: 'Si condenseur propre, ventilateur OK, et joint OK : probable fuite légère de gaz. Intervention technicien frigoriste.'
  }
};

// ============================================================================
// EXPORT COMPLETE COLD CATEGORY
// ============================================================================

// Assemble the complete family with all subcategories
COLD_FAMILY.categories = [
  COLD_POSITIVE,
  COLD_NEGATIVE,
  COLD_ICE_PRODUCTION,
  COLD_RAPID,
  COLD_SPECIALTY
];

export const COLD_KNOWLEDGE_BASE = {
  family: COLD_FAMILY,
  specifications: COLD_SPECIFICATIONS,
  problems: COLD_PROBLEMS,
  diagnosticNodes: COLD_DIAGNOSTIC_NODES
};
