// ============================================================================
// KNOWLEDGE BASE - STAFFING (Ressources Humaines)
// ============================================================================
// Profils métiers dynamiques avec critères de matching spécifiques
// Formulaires adaptatifs selon le poste

import type {
  EquipmentFamily,
  StaffingProfile,
  StaffingCategory,
  HardSkill,
  SoftSkill,
  MatchingCriterion,
} from './types';

// ============================================================================
// STAFFING FAMILY DEFINITION
// ============================================================================

export const STAFFING_FAMILY: EquipmentFamily = {
  id: 'STAFFING',
  label: 'Staffing & Service',
  description: 'Recrutement et extras pour salle, cuisine et bar',
  icon: 'Users',
  color: 'from-purple-500 to-pink-600',
  categories: [],
  commonSkills: ['service-client', 'travail-equipe', 'resistance-stress'],
  riskLevel: 'LOW',
  regulatoryRequirements: ['Contrat de travail', 'Déclaration URSSAF']
};

// ============================================================================
// STAFFING PROFILES - Profils Métiers Complets
// ============================================================================

// --------------------------------------------------------------------------
// SERVICE / SALLE
// --------------------------------------------------------------------------

export const PROFILE_SERVEUR: StaffingProfile = {
  id: 'staff-serveur',
  category: 'SERVICE',
  role: 'Serveur / Serveuse',
  description: 'Service en salle, prise de commandes, encaissement',
  icon: 'User',
  hardSkills: [
    {
      id: 'hs-port-assiettes',
      label: 'Port d\'assiettes',
      description: 'Capacité à porter 3 assiettes ou plus',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-port-plateau',
      label: 'Port de plateau',
      description: 'Service au plateau pour boissons',
      weight: 0.7,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-pda',
      label: 'Maîtrise PDA/Caisse',
      description: 'Utilisation des systèmes de prise de commande électronique',
      weight: 0.6,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-encaissement',
      label: 'Encaissement',
      description: 'Gestion du paiement client et rendu de monnaie',
      weight: 0.5,
      verificationMethod: 'SELF_DECLARED'
    }
  ],
  softSkills: [
    {
      id: 'ss-sourire',
      label: 'Sens du service',
      description: 'Accueil chaleureux et attitude positive',
      weight: 0.9
    },
    {
      id: 'ss-stress',
      label: 'Résistance au stress',
      description: 'Capacité à gérer le rush service',
      weight: 0.8
    },
    {
      id: 'ss-equipe',
      label: 'Travail en équipe',
      description: 'Collaboration avec cuisine et collègues',
      weight: 0.7
    }
  ],
  hourlyRateRange: { min: 12, max: 18 },
  typicalShiftDuration: 6,
  languageRequirements: ['Français courant'],
  matchingCriteria: [
    { criterionId: 'disponibilite', label: 'Disponibilité immédiate', weight: 0.4, type: 'BOOLEAN' },
    { criterionId: 'experience', label: 'Années d\'expérience', weight: 0.3, type: 'SCALE' },
    { criterionId: 'langues', label: 'Langues parlées', weight: 0.2, type: 'MATCH' },
    { criterionId: 'rating', label: 'Note moyenne', weight: 0.1, type: 'SCALE' }
  ]
};

export const PROFILE_CHEF_RANG: StaffingProfile = {
  id: 'staff-chef-rang',
  category: 'SERVICE',
  role: 'Chef de Rang',
  description: 'Responsable d\'un carré, coordination service, vente additionnelle',
  icon: 'UserCheck',
  hardSkills: [
    {
      id: 'hs-gestion-carre',
      label: 'Gestion de carré',
      description: 'Organisation et suivi d\'un rang de tables',
      weight: 0.9,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-upselling',
      label: 'Vente additionnelle',
      description: 'Technique d\'upselling (apéritifs, desserts, cafés)',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-coordination',
      label: 'Coordination équipe',
      description: 'Capacité à diriger des commis/runners',
      weight: 0.7,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-connaissance-carte',
      label: 'Connaissance carte',
      description: 'Maîtrise de la carte et des accords',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-decoupe-flambage',
      label: 'Découpe & Flambage',
      description: 'Service de plats découpés/flambés en salle',
      weight: 0.5,
      verificationMethod: 'SELF_DECLARED'
    }
  ],
  softSkills: [
    {
      id: 'ss-leadership',
      label: 'Leadership',
      description: 'Capacité à mener une équipe',
      weight: 0.9
    },
    {
      id: 'ss-anticipation',
      label: 'Anticipation',
      description: 'Prévoir les besoins des clients et de l\'équipe',
      weight: 0.8
    },
    {
      id: 'ss-gestion-plaintes',
      label: 'Gestion des plaintes',
      description: 'Résolution diplomatique des problèmes',
      weight: 0.8
    }
  ],
  hourlyRateRange: { min: 15, max: 25 },
  typicalShiftDuration: 7,
  preferredExperience: '3+ ans en service',
  languageRequirements: ['Français courant', 'Anglais professionnel'],
  matchingCriteria: [
    { criterionId: 'experience', label: 'Années d\'expérience', weight: 0.35, type: 'SCALE' },
    { criterionId: 'etablissements', label: 'Type d\'établissements', weight: 0.25, type: 'MATCH' },
    { criterionId: 'rating', label: 'Note moyenne', weight: 0.25, type: 'SCALE' },
    { criterionId: 'disponibilite', label: 'Disponibilité', weight: 0.15, type: 'BOOLEAN' }
  ]
};

export const PROFILE_MAITRE_HOTEL: StaffingProfile = {
  id: 'staff-maitre-hotel',
  category: 'MANAGEMENT',
  role: 'Maître d\'Hôtel',
  description: 'Direction du service salle, accueil VIP, gestion des réservations',
  icon: 'Crown',
  hardSkills: [
    {
      id: 'hs-management-salle',
      label: 'Management de salle',
      description: 'Coordination de l\'ensemble du service',
      weight: 0.95,
      verificationMethod: 'CERTIFICATION'
    },
    {
      id: 'hs-planning',
      label: 'Gestion planning',
      description: 'Organisation des rotations et affectations',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-resa',
      label: 'Gestion réservations',
      description: 'Optimisation du plan de salle',
      weight: 0.7,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-protocole',
      label: 'Protocole & Étiquette',
      description: 'Codes du service haut de gamme',
      weight: 0.9,
      verificationMethod: 'SELF_DECLARED'
    }
  ],
  softSkills: [
    {
      id: 'ss-representation',
      label: 'Représentation',
      description: 'Image de marque de l\'établissement',
      weight: 0.95
    },
    {
      id: 'ss-discretion',
      label: 'Discrétion',
      description: 'Confidentialité clients VIP',
      weight: 0.9
    }
  ],
  hourlyRateRange: { min: 25, max: 45 },
  typicalShiftDuration: 8,
  preferredExperience: '5+ ans en management de salle',
  requiredCertifications: ['Formation Management Hôtelier'],
  languageRequirements: ['Français parfait', 'Anglais courant', 'Autre langue appréciée'],
  matchingCriteria: [
    { criterionId: 'experience', label: 'Années management', weight: 0.4, type: 'SCALE' },
    { criterionId: 'references', label: 'Établissements de référence', weight: 0.3, type: 'MATCH' },
    { criterionId: 'rating', label: 'Réputation', weight: 0.2, type: 'SCALE' },
    { criterionId: 'langues', label: 'Langues', weight: 0.1, type: 'MATCH' }
  ]
};

export const PROFILE_RUNNER: StaffingProfile = {
  id: 'staff-runner',
  category: 'SERVICE',
  role: 'Runner / Commis de salle',
  description: 'Envoi des plats, débarrassage, support aux chefs de rang',
  icon: 'Zap',
  hardSkills: [
    {
      id: 'hs-rapidite',
      label: 'Rapidité d\'exécution',
      description: 'Efficacité dans l\'envoi et le débarrassage',
      weight: 0.9,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-organisation',
      label: 'Organisation',
      description: 'Gestion des priorités d\'envoi',
      weight: 0.7,
      verificationMethod: 'SELF_DECLARED'
    }
  ],
  softSkills: [
    {
      id: 'ss-endurance',
      label: 'Endurance physique',
      description: 'Capacité à rester debout et actif longtemps',
      weight: 0.9
    },
    {
      id: 'ss-reactivite',
      label: 'Réactivité',
      description: 'Réponse rapide aux demandes',
      weight: 0.8
    }
  ],
  hourlyRateRange: { min: 11, max: 14 },
  typicalShiftDuration: 5,
  matchingCriteria: [
    { criterionId: 'disponibilite', label: 'Disponibilité immédiate', weight: 0.5, type: 'BOOLEAN' },
    { criterionId: 'endurance', label: 'Condition physique', weight: 0.3, type: 'BOOLEAN' },
    { criterionId: 'experience', label: 'Expérience', weight: 0.2, type: 'SCALE' }
  ]
};

// --------------------------------------------------------------------------
// BAR
// --------------------------------------------------------------------------

export const PROFILE_BARMAN: StaffingProfile = {
  id: 'staff-barman',
  category: 'BAR',
  role: 'Barman / Barmaid',
  description: 'Préparation des boissons et cocktails, service au bar',
  icon: 'Wine',
  hardSkills: [
    {
      id: 'hs-cocktails-classiques',
      label: 'Cocktails classiques IBA',
      description: 'Maîtrise des cocktails internationaux standards',
      weight: 0.85,
      verificationMethod: 'TEST'
    },
    {
      id: 'hs-techniques-bar',
      label: 'Techniques de bar',
      description: 'Shaking, stirring, muddling, layering',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-free-pour',
      label: 'Free pouring',
      description: 'Versage libre précis sans jigger',
      weight: 0.6,
      verificationMethod: 'TEST'
    },
    {
      id: 'hs-connaissance-spiritueux',
      label: 'Connaissance spiritueux',
      description: 'Gamme des alcools, marques, caractéristiques',
      weight: 0.75,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-cafe',
      label: 'Préparation café',
      description: 'Maîtrise machine expresso et latte art',
      weight: 0.5,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-biere',
      label: 'Tirage pression',
      description: 'Changement de fûts, nettoyage tireuse',
      weight: 0.4,
      verificationMethod: 'SELF_DECLARED'
    }
  ],
  softSkills: [
    {
      id: 'ss-contact-client',
      label: 'Relationnel client',
      description: 'Conversation, écoute, fidélisation',
      weight: 0.9
    },
    {
      id: 'ss-showmanship',
      label: 'Showmanship',
      description: 'Mise en scène et présentation',
      weight: 0.6
    },
    {
      id: 'ss-rapidite-bar',
      label: 'Rapidité d\'envoi',
      description: 'Nombre de cocktails par heure',
      weight: 0.8
    }
  ],
  hourlyRateRange: { min: 14, max: 25 },
  typicalShiftDuration: 7,
  preferredExperience: '2+ ans en bar',
  matchingCriteria: [
    { criterionId: 'cocktails', label: 'Répertoire cocktails', weight: 0.3, type: 'SCALE' },
    { criterionId: 'vitesse', label: 'Vitesse d\'envoi', weight: 0.25, type: 'SCALE' },
    { criterionId: 'experience', label: 'Expérience bar', weight: 0.25, type: 'SCALE' },
    { criterionId: 'disponibilite', label: 'Disponibilité soirée', weight: 0.2, type: 'BOOLEAN' }
  ]
};

export const PROFILE_MIXOLOGUE: StaffingProfile = {
  id: 'staff-mixologue',
  category: 'BAR',
  role: 'Mixologue / Head Bartender',
  description: 'Création de cocktails signatures, direction de bar',
  icon: 'Sparkles',
  hardSkills: [
    {
      id: 'hs-creation',
      label: 'Création signature',
      description: 'Développement de recettes originales',
      weight: 0.95,
      verificationMethod: 'TEST'
    },
    {
      id: 'hs-infusions',
      label: 'Infusions & Sirops maison',
      description: 'Préparation de produits faits maison',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-costing',
      label: 'Costing & Pricing',
      description: 'Calcul des coûts et prix de vente',
      weight: 0.7,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-formation',
      label: 'Formation équipe',
      description: 'Transmission des recettes et techniques',
      weight: 0.6,
      verificationMethod: 'SELF_DECLARED'
    }
  ],
  softSkills: [
    {
      id: 'ss-creativite',
      label: 'Créativité',
      description: 'Innovation et recherche gustative',
      weight: 0.95
    },
    {
      id: 'ss-tendances',
      label: 'Veille tendances',
      description: 'Suivi des nouvelles techniques et produits',
      weight: 0.7
    }
  ],
  hourlyRateRange: { min: 20, max: 40 },
  typicalShiftDuration: 8,
  preferredExperience: '5+ ans en bartending',
  requiredCertifications: ['Formation bartending avancée'],
  matchingCriteria: [
    { criterionId: 'portfolio', label: 'Portfolio créations', weight: 0.35, type: 'MATCH' },
    { criterionId: 'experience', label: 'Expérience', weight: 0.3, type: 'SCALE' },
    { criterionId: 'references', label: 'Établissements', weight: 0.25, type: 'MATCH' },
    { criterionId: 'rating', label: 'Réputation', weight: 0.1, type: 'SCALE' }
  ]
};

export const PROFILE_SOMMELIER: StaffingProfile = {
  id: 'staff-sommelier',
  category: 'BAR',
  role: 'Sommelier',
  description: 'Conseil vin, gestion de cave, accords mets-vins',
  icon: 'Wine',
  hardSkills: [
    {
      id: 'hs-connaissance-vin',
      label: 'Connaissance œnologique',
      description: 'Régions, cépages, millésimes, producteurs',
      weight: 0.95,
      verificationMethod: 'CERTIFICATION'
    },
    {
      id: 'hs-accords',
      label: 'Accords mets-vins',
      description: 'Maîtrise des associations gustatives',
      weight: 0.9,
      verificationMethod: 'TEST'
    },
    {
      id: 'hs-service-vin',
      label: 'Service du vin',
      description: 'Décantage, température, verrerie',
      weight: 0.85,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-gestion-cave',
      label: 'Gestion de cave',
      description: 'Inventaire, rotation, achats',
      weight: 0.7,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-degustation',
      label: 'Dégustation à l\'aveugle',
      description: 'Identification cépages et appellations',
      weight: 0.6,
      verificationMethod: 'TEST'
    }
  ],
  softSkills: [
    {
      id: 'ss-pedagogie',
      label: 'Pédagogie',
      description: 'Explication accessible sans jargon',
      weight: 0.8
    },
    {
      id: 'ss-ecoute-client',
      label: 'Écoute client',
      description: 'Comprendre les préférences non exprimées',
      weight: 0.9
    },
    {
      id: 'ss-vente',
      label: 'Sens commercial',
      description: 'Valorisation de la cave, vente au verre',
      weight: 0.7
    }
  ],
  hourlyRateRange: { min: 18, max: 35 },
  typicalShiftDuration: 6,
  preferredExperience: '3+ ans en sommellerie',
  requiredCertifications: ['Brevet Professionnel Sommelier', 'WSET'],
  languageRequirements: ['Français', 'Anglais viticole'],
  matchingCriteria: [
    { criterionId: 'certifications', label: 'Certifications', weight: 0.35, type: 'MATCH' },
    { criterionId: 'experience', label: 'Expérience', weight: 0.3, type: 'SCALE' },
    { criterionId: 'specialites', label: 'Spécialités régionales', weight: 0.2, type: 'MATCH' },
    { criterionId: 'langues', label: 'Langues', weight: 0.15, type: 'MATCH' }
  ]
};

// --------------------------------------------------------------------------
// CUISINE
// --------------------------------------------------------------------------

export const PROFILE_CHEF_PARTIE: StaffingProfile = {
  id: 'staff-chef-partie',
  category: 'CUISINE',
  role: 'Chef de Partie',
  description: 'Responsable d\'un poste en cuisine (chaud, froid, pâtisserie...)',
  icon: 'ChefHat',
  hardSkills: [
    {
      id: 'hs-poste',
      label: 'Maîtrise du poste',
      description: 'Autonomie complète sur un poste de travail',
      weight: 0.95,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-envoi',
      label: 'Gestion de l\'envoi',
      description: 'Coordination du dressage et timing',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-mise-place',
      label: 'Mise en place',
      description: 'Préparation et organisation du poste',
      weight: 0.85,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-haccp',
      label: 'Normes HACCP',
      description: 'Application des règles d\'hygiène',
      weight: 0.9,
      verificationMethod: 'CERTIFICATION'
    }
  ],
  softSkills: [
    {
      id: 'ss-rigueur',
      label: 'Rigueur',
      description: 'Précision et constance',
      weight: 0.9
    },
    {
      id: 'ss-rapidite-cuisine',
      label: 'Rapidité',
      description: 'Vitesse d\'exécution sans sacrifier la qualité',
      weight: 0.85
    },
    {
      id: 'ss-resistance-chaleur',
      label: 'Résistance',
      description: 'Travail en conditions difficiles',
      weight: 0.8
    }
  ],
  hourlyRateRange: { min: 14, max: 22 },
  typicalShiftDuration: 8,
  preferredExperience: '2+ ans en cuisine professionnelle',
  requiredCertifications: ['HACCP'],
  matchingCriteria: [
    { criterionId: 'specialite', label: 'Spécialité poste', weight: 0.35, type: 'MATCH' },
    { criterionId: 'experience', label: 'Expérience', weight: 0.3, type: 'SCALE' },
    { criterionId: 'disponibilite', label: 'Disponibilité', weight: 0.2, type: 'BOOLEAN' },
    { criterionId: 'rating', label: 'Évaluations', weight: 0.15, type: 'SCALE' }
  ]
};

export const PROFILE_COMMIS: StaffingProfile = {
  id: 'staff-commis',
  category: 'CUISINE',
  role: 'Commis de cuisine',
  description: 'Préparation sous la direction d\'un chef de partie',
  icon: 'ChefHat',
  hardSkills: [
    {
      id: 'hs-decoupe',
      label: 'Découpe & Taillage',
      description: 'Techniques de base de découpe',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-cuissons-base',
      label: 'Cuissons de base',
      description: 'Maîtrise des cuissons fondamentales',
      weight: 0.7,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-organisation-poste',
      label: 'Organisation du poste',
      description: 'Rangement, propreté, mise en place',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    }
  ],
  softSkills: [
    {
      id: 'ss-ecoute',
      label: 'Écoute des consignes',
      description: 'Exécution précise des instructions',
      weight: 0.9
    },
    {
      id: 'ss-apprentissage',
      label: 'Capacité d\'apprentissage',
      description: 'Progression et adaptabilité',
      weight: 0.8
    }
  ],
  hourlyRateRange: { min: 11, max: 15 },
  typicalShiftDuration: 8,
  matchingCriteria: [
    { criterionId: 'disponibilite', label: 'Disponibilité', weight: 0.4, type: 'BOOLEAN' },
    { criterionId: 'motivation', label: 'Motivation', weight: 0.3, type: 'SCALE' },
    { criterionId: 'experience', label: 'Expérience', weight: 0.2, type: 'SCALE' },
    { criterionId: 'proximite', label: 'Proximité géographique', weight: 0.1, type: 'SCALE' }
  ]
};

export const PROFILE_PLONGEUR: StaffingProfile = {
  id: 'staff-plongeur',
  category: 'CUISINE',
  role: 'Plongeur / Steward',
  description: 'Plonge, entretien cuisine, gestion déchets',
  icon: 'Droplet',
  hardSkills: [
    {
      id: 'hs-machine-plonge',
      label: 'Machine à plonge',
      description: 'Utilisation lave-vaisselle / lave-batterie pro',
      weight: 0.8,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-produits',
      label: 'Dosage produits',
      description: 'Détergent, rinçage, désinfection',
      weight: 0.7,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-tri-dechets',
      label: 'Tri des déchets',
      description: 'Respect du protocole de tri',
      weight: 0.6,
      verificationMethod: 'SELF_DECLARED'
    }
  ],
  softSkills: [
    {
      id: 'ss-endurance-plonge',
      label: 'Endurance physique',
      description: 'Port de charges, station debout prolongée',
      weight: 0.95
    },
    {
      id: 'ss-rapidite-plonge',
      label: 'Rapidité',
      description: 'Rotation rapide de la vaisselle',
      weight: 0.85
    },
    {
      id: 'ss-discretion-plonge',
      label: 'Fiabilité',
      description: 'Présence et régularité',
      weight: 0.8
    }
  ],
  hourlyRateRange: { min: 11, max: 13 },
  typicalShiftDuration: 6,
  matchingCriteria: [
    { criterionId: 'disponibilite', label: 'Disponibilité immédiate', weight: 0.5, type: 'BOOLEAN' },
    { criterionId: 'horaires', label: 'Horaires tardifs OK', weight: 0.3, type: 'BOOLEAN' },
    { criterionId: 'experience', label: 'Expérience', weight: 0.1, type: 'SCALE' },
    { criterionId: 'proximite', label: 'Proximité', weight: 0.1, type: 'SCALE' }
  ]
};

// --------------------------------------------------------------------------
// ACCUEIL
// --------------------------------------------------------------------------

export const PROFILE_HOTESSE: StaffingProfile = {
  id: 'staff-hotesse',
  category: 'RECEPTION',
  role: 'Hôte / Hôtesse d\'accueil',
  description: 'Accueil client, gestion des réservations, vestiaire',
  icon: 'Smile',
  hardSkills: [
    {
      id: 'hs-accueil',
      label: 'Techniques d\'accueil',
      description: 'Protocole d\'accueil professionnel',
      weight: 0.9,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-reservation',
      label: 'Logiciel réservation',
      description: 'Maîtrise des outils (TheFork, Zenchef...)',
      weight: 0.7,
      verificationMethod: 'SELF_DECLARED'
    },
    {
      id: 'hs-telephone',
      label: 'Accueil téléphonique',
      description: 'Prise de réservation, renseignements',
      weight: 0.6,
      verificationMethod: 'SELF_DECLARED'
    }
  ],
  softSkills: [
    {
      id: 'ss-presentation',
      label: 'Présentation',
      description: 'Tenue et attitude impeccables',
      weight: 0.95
    },
    {
      id: 'ss-sourire-accueil',
      label: 'Sourire naturel',
      description: 'Chaleur et bienveillance',
      weight: 0.9
    },
    {
      id: 'ss-gestion-attente',
      label: 'Gestion de l\'attente',
      description: 'Patience et communication clients en attente',
      weight: 0.7
    }
  ],
  hourlyRateRange: { min: 12, max: 18 },
  typicalShiftDuration: 5,
  languageRequirements: ['Français parfait', 'Anglais courant'],
  matchingCriteria: [
    { criterionId: 'presentation', label: 'Présentation', weight: 0.35, type: 'SCALE' },
    { criterionId: 'langues', label: 'Langues', weight: 0.25, type: 'MATCH' },
    { criterionId: 'experience', label: 'Expérience accueil', weight: 0.25, type: 'SCALE' },
    { criterionId: 'disponibilite', label: 'Disponibilité', weight: 0.15, type: 'BOOLEAN' }
  ]
};

// --------------------------------------------------------------------------
// SÉCURITÉ
// --------------------------------------------------------------------------

export const PROFILE_SECURITE: StaffingProfile = {
  id: 'staff-securite',
  category: 'SECURITY',
  role: 'Agent de sécurité / Videur',
  description: 'Contrôle d\'accès, sécurité des personnes et des biens',
  icon: 'Shield',
  hardSkills: [
    {
      id: 'hs-controle-acces',
      label: 'Contrôle d\'accès',
      description: 'Vérification identité, refus d\'entrée',
      weight: 0.9,
      verificationMethod: 'CERTIFICATION'
    },
    {
      id: 'hs-gestion-conflit',
      label: 'Gestion de conflit',
      description: 'Désescalade et intervention',
      weight: 0.95,
      verificationMethod: 'CERTIFICATION'
    },
    {
      id: 'hs-premiers-secours',
      label: 'Premiers secours',
      description: 'SST ou PSC1',
      weight: 0.7,
      verificationMethod: 'CERTIFICATION'
    }
  ],
  softSkills: [
    {
      id: 'ss-calme',
      label: 'Sang-froid',
      description: 'Maîtrise de soi en toute situation',
      weight: 0.95
    },
    {
      id: 'ss-autorite',
      label: 'Autorité naturelle',
      description: 'Imposer le respect sans agressivité',
      weight: 0.85
    },
    {
      id: 'ss-observation',
      label: 'Sens de l\'observation',
      description: 'Détection des comportements à risque',
      weight: 0.8
    }
  ],
  hourlyRateRange: { min: 15, max: 25 },
  typicalShiftDuration: 8,
  requiredCertifications: ['CQP APS', 'Carte professionnelle CNAPS'],
  matchingCriteria: [
    { criterionId: 'certifications', label: 'Carte pro valide', weight: 0.4, type: 'BOOLEAN' },
    { criterionId: 'experience', label: 'Expérience night', weight: 0.3, type: 'SCALE' },
    { criterionId: 'physique', label: 'Condition physique', weight: 0.2, type: 'SCALE' },
    { criterionId: 'disponibilite', label: 'Nuit/Weekend', weight: 0.1, type: 'BOOLEAN' }
  ]
};

// ============================================================================
// STAFFING CATEGORIES CONFIGURATION
// ============================================================================

export const STAFFING_CATEGORIES: Record<StaffingCategory, {
  label: string;
  description: string;
  icon: string;
  color: string;
  profiles: StaffingProfile[];
}> = {
  SERVICE: {
    label: 'Service en salle',
    description: 'Équipe de salle et service client',
    icon: 'User',
    color: 'from-blue-500 to-cyan-500',
    profiles: [PROFILE_SERVEUR, PROFILE_CHEF_RANG, PROFILE_RUNNER]
  },
  CUISINE: {
    label: 'Cuisine',
    description: 'Brigade de cuisine',
    icon: 'ChefHat',
    color: 'from-orange-500 to-red-500',
    profiles: [PROFILE_CHEF_PARTIE, PROFILE_COMMIS, PROFILE_PLONGEUR]
  },
  BAR: {
    label: 'Bar',
    description: 'Équipe bar et sommeliers',
    icon: 'Wine',
    color: 'from-purple-500 to-pink-500',
    profiles: [PROFILE_BARMAN, PROFILE_MIXOLOGUE, PROFILE_SOMMELIER]
  },
  RECEPTION: {
    label: 'Accueil',
    description: 'Hôtes et accueil client',
    icon: 'Smile',
    color: 'from-green-500 to-emerald-500',
    profiles: [PROFILE_HOTESSE]
  },
  SECURITY: {
    label: 'Sécurité',
    description: 'Agents de sécurité',
    icon: 'Shield',
    color: 'from-gray-600 to-gray-800',
    profiles: [PROFILE_SECURITE]
  },
  MANAGEMENT: {
    label: 'Management',
    description: 'Direction et encadrement',
    icon: 'Crown',
    color: 'from-amber-500 to-yellow-500',
    profiles: [PROFILE_MAITRE_HOTEL]
  }
};

// ============================================================================
// ALL STAFFING PROFILES
// ============================================================================

export const ALL_STAFFING_PROFILES: StaffingProfile[] = [
  PROFILE_SERVEUR,
  PROFILE_CHEF_RANG,
  PROFILE_MAITRE_HOTEL,
  PROFILE_RUNNER,
  PROFILE_BARMAN,
  PROFILE_MIXOLOGUE,
  PROFILE_SOMMELIER,
  PROFILE_CHEF_PARTIE,
  PROFILE_COMMIS,
  PROFILE_PLONGEUR,
  PROFILE_HOTESSE,
  PROFILE_SECURITE
];

// ============================================================================
// EXPORT
// ============================================================================

export const STAFFING_KNOWLEDGE_BASE = {
  family: STAFFING_FAMILY,
  categories: STAFFING_CATEGORIES,
  profiles: ALL_STAFFING_PROFILES,
  getProfileById: (id: string) => ALL_STAFFING_PROFILES.find(p => p.id === id),
  getProfilesByCategory: (category: StaffingCategory) =>
    ALL_STAFFING_PROFILES.filter(p => p.category === category)
};
