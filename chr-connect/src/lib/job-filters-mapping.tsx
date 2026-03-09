import React from 'react';
import { JobFilterConfig } from '@/types/filters';
import { 
  Wrench, Clock, Flame, Snowflake, ChefHat, Coffee, Music, Video, Lightbulb, Monitor, 
  Droplets, Zap, Beer, Shield, Brush, Ruler, Hammer, Wifi, Sparkles, Sofa, UtensilsCrossed, Wine
} from 'lucide-react';

export const JOB_FILTERS_MAPPING: Record<string, JobFilterConfig> = {
  // ========================================================================
  // 1. MAINTENANCE TECHNIQUE
  // ========================================================================

  // FROID (Frigoriste)
  'cold': {
    jobId: 'cold',
    categories: [
      {
        id: 'interventionType',
        label: 'Type d\'intervention',
        isMultiSelect: true,
        options: [
          { id: 'breakdown', label: 'Panne Urgente', value: 'breakdown', icon: <Flame className="w-4 h-4 text-red-500" /> },
          { id: 'maintenance', label: 'Maintenance', value: 'maintenance', icon: <Wrench className="w-4 h-4 text-blue-500" /> },
          { id: 'installation', label: 'Installation', value: 'installation', icon: <Snowflake className="w-4 h-4 text-cyan-500" /> }
        ]
      },
      {
        id: 'equipment',
        label: 'Équipement',
        isMultiSelect: true,
        options: [
          { id: 'cold_room', label: 'Chambre Froide', value: 'cold_room' },
          { id: 'fridge', label: 'Frigo / Armoire', value: 'fridge' },
          { id: 'icemaker', label: 'Machine à glaçons', value: 'icemaker' }
        ]
      },
      {
        id: 'urgency',
        label: 'Urgence',
        options: [
          { id: 'urgent', label: 'Urgent (< 2h)', value: true, icon: <Clock className="w-4 h-4 text-orange-500" /> }
        ]
      }
    ]
  },

  // CHAUD (Cuisinier / Technicien Chaud ?) - Note: 'hot' was used for Chef in previous context, 
  // but user listed "Chaud (Four/Piano)" under Maintenance and "Cuisinier" under Staffing.
  // I will assume 'hot' corresponds to 'Cuisinier' job profile for now based on previous code, 
  // BUT if this is "Technicien Chaud", it should be separate.
  // However, looking at the user list: "Maintenance Technique > Chaud (Four/Piano)". 
  // Let's create a specific "hot_tech" or reuse 'hot' if it was ambiguous. 
  // Previous 'hot' was definitely Cuisinier (Chef, Sous-chef). 
  // Let's keep 'hot' for Cuisinier and add 'kitchen_tech' or just merge into 'electricity'/'plumbing'?
  // No, "Chaud (Four/Piano)" is a specific technician skill.
  // I will use 'hot_tech' if I can, but I already defined 'hot'. 
  // Let's rename 'hot' to 'cook' for clarity? No, that breaks existing.
  // Let's assume 'hot' is Cuisinier (Staffing) as per previous code.
  // I will add 'kitchen_tech' to MissionType? Or just use 'hot' for tech?
  // The user listed "Cuisinier" under Staffing. And "Chaud" under Maintenance.
  // So I should probably distinguish them. 
  // Let's check my MissionType update... I kept 'hot'.
  // I will use 'hot' for the Kitchen Technician (Maintenance) matching "Chaud".
  // And I will use 'cook' for Cuisinier?
  // Wait, previous code: 'hot' -> Role: Chef, Sous-chef. So 'hot' WAS Cuisinier.
  // I should probably change 'hot' to 'cook' to be clear, and 'hot_tech' for maintenance.
  // But I don't want to break everything.
  // Let's keep 'hot' for Cuisinier (Staffing > Cuisinier).
  // And add 'kitchen_tech' for Maintenance > Chaud?
  // The user list has: "Cuisinier" separately.
  // Let's look at my types again.
  // I have 'cold', 'hot', 'plumbing', 'electricity'...
  // 'hot' is ambiguous.
  // I'll use 'hot' for Cuisinier (Staffing).
  // I need a type for "Chaud (Four/Piano)". Let's call it 'kitchen_maintenance' or generic 'electricity'/'gas'?
  // Actually, often 'cold' guys do 'hot' maintenance too (Cuisinistes).
  // Let's add 'kitchen_tech' to types.
  // Wait, I already submitted types. I can update it again.
  // Let's just use 'electricity' or 'plumbing' for those? No, it's specific.
  // "Grande Cuisine" technician.
  // Let's use 'kitchen_tech' and update types.

  // Update: I will stick to the User's structure.
  // Maintenance: Froid ('cold'), Chaud (I'll map this to 'kitchen_tech' - need to add), Plomberie ('plumbing'), Elec ('electricity'), Cafe ('coffee'), Biere ('beer').
  // Staffing: Serveur ('staff'), Cuisinier ('hot'), Plongeur ('cleaning').
  
  // PLOMBERIE
  'plumbing': {
    jobId: 'plumbing',
    categories: [
      {
        id: 'interventionType',
        label: 'Type',
        isMultiSelect: true,
        options: [
          { id: 'leak', label: 'Fuite', value: 'leak', icon: <Droplets className="w-4 h-4 text-blue-400" /> },
          { id: 'clog', label: 'Débouchage', value: 'clog' },
          { id: 'install', label: 'Installation', value: 'install' }
        ]
      },
      {
        id: 'equipment',
        label: 'Équipement',
        isMultiSelect: true,
        options: [
          { id: 'sink', label: 'Évier/Lavabo', value: 'sink' },
          { id: 'toilet', label: 'WC', value: 'toilet' },
          { id: 'dishwasher', label: 'Lave-vaisselle', value: 'dishwasher' },
          { id: 'grease_trap', label: 'Bac à graisse', value: 'grease_trap' }
        ]
      }
    ]
  },

  // ÉLECTRICITÉ
  'electricity': {
    jobId: 'electricity',
    categories: [
      {
        id: 'interventionType',
        label: 'Type',
        isMultiSelect: true,
        options: [
          { id: 'outage', label: 'Coupure/Panne', value: 'outage', icon: <Zap className="w-4 h-4 text-yellow-500" /> },
          { id: 'compliance', label: 'Mise aux normes', value: 'compliance' },
          { id: 'install', label: 'Installation', value: 'install' }
        ]
      },
      {
        id: 'equipment',
        label: 'Équipement',
        isMultiSelect: true,
        options: [
          { id: 'panel', label: 'Tableau Élec', value: 'panel' },
          { id: 'lighting', label: 'Éclairage', value: 'lighting' },
          { id: 'outlet', label: 'Prises', value: 'outlet' }
        ]
      }
    ]
  },

  // MACHINE À CAFÉ
  'coffee': {
    jobId: 'coffee',
    categories: [
      {
        id: 'interventionType',
        label: 'Type',
        options: [
          { id: 'repair', label: 'Réparation', value: 'repair' },
          { id: 'maintenance', label: 'Entretien', value: 'maintenance' },
          { id: 'adjust', label: 'Réglage', value: 'adjust' }
        ]
      },
      {
        id: 'machineType',
        label: 'Machine',
        options: [
          { id: 'traditional', label: 'Traditionnelle (Perco)', value: 'traditional' },
          { id: 'automatic', label: 'Automatique', value: 'automatic' },
          { id: 'grinder', label: 'Moulin', value: 'grinder' }
        ]
      }
    ]
  },

  // POMPE À BIÈRE
  'beer': {
    jobId: 'beer',
    categories: [
      {
        id: 'interventionType',
        label: 'Type',
        options: [
          { id: 'sanitation', label: 'Sanitation', value: 'sanitation', icon: <Sparkles className="w-4 h-4 text-blue-300" /> },
          { id: 'gas', label: 'Problème Gaz/Pression', value: 'gas' },
          { id: 'cooling', label: 'Refroidissement', value: 'cooling' },
          { id: 'leak', label: 'Fuite', value: 'leak' }
        ]
      }
    ]
  },

  // ========================================================================
  // 2. STAFFING & SERVICE
  // ========================================================================

  // SERVICE EN SALLE (Serveur, Chef de Rang, Barman, Sommelier)
  // Reusing 'staff' for general service
  'staff': {
    jobId: 'staff',
    categories: [
      {
        id: 'role',
        label: 'Poste',
        isMultiSelect: true,
        options: [
          { id: 'waiter', label: 'Serveur / Limonadier', value: 'waiter', icon: <Coffee className="w-4 h-4 text-orange-400" /> },
          { id: 'head_waiter', label: 'Chef de Rang', value: 'head_waiter' },
          { id: 'barman', label: 'Barman / Mixologue', value: 'barman', icon: <Beer className="w-4 h-4 text-yellow-600" /> },
          { id: 'sommelier', label: 'Sommelier', value: 'sommelier', icon: <Wine className="w-4 h-4 text-red-800" /> },
          { id: 'runner', label: 'Runner', value: 'runner' },
          { id: 'host', label: 'Hôte / Hôtesse', value: 'host' }
        ]
      },
      {
        id: 'establishmentType',
        label: 'Ambiance',
        isMultiSelect: true,
        options: [
          { id: 'gastro', label: 'Gastronomique', value: 'gastro' },
          { id: 'brasserie', label: 'Brasserie', value: 'brasserie' },
          { id: 'nightclub', label: 'Club / Bar', value: 'nightclub' },
          { id: 'hotel', label: 'Hôtel', value: 'hotel' }
        ]
      }
    ]
  },

  // CUISINIER (Ex 'hot')
  'hot': {
    jobId: 'hot',
    categories: [
      {
        id: 'role',
        label: 'Poste',
        isMultiSelect: true,
        options: [
          { id: 'chef', label: 'Chef de Cuisine', value: 'chef', icon: <ChefHat className="w-4 h-4 text-yellow-500" /> },
          { id: 'sous_chef', label: 'Sous-Chef', value: 'sous_chef' },
          { id: 'cdp', label: 'Chef de Partie', value: 'cdp' },
          { id: 'commis', label: 'Commis', value: 'commis' }
        ]
      },
      {
        id: 'specialty',
        label: 'Spécialité',
        isMultiSelect: true,
        options: [
          { id: 'french', label: 'Française', value: 'french' },
          { id: 'italian', label: 'Italienne', value: 'italian' },
          { id: 'asian', label: 'Asiatique', value: 'asian' },
          { id: 'bistronomy', label: 'Bistronomie', value: 'bistronomy' }
        ]
      },
      {
        id: 'serviceType',
        label: 'Service',
        options: [
          { id: 'lunch', label: 'Midi', value: 'lunch' },
          { id: 'dinner', label: 'Soir', value: 'dinner' },
          { id: 'continuous', label: 'Continu', value: 'continuous' }
        ]
      }
    ]
  },

  // PLONGE & ENTRETIEN
  'cleaning': {
    jobId: 'cleaning',
    categories: [
      {
        id: 'role',
        label: 'Poste',
        options: [
          { id: 'dishwasher', label: 'Plongeur', value: 'dishwasher', icon: <UtensilsCrossed className="w-4 h-4" /> },
          { id: 'cleaner', label: 'Agent d\'entretien', value: 'cleaner' }
        ]
      }
    ]
  },

  // SÉCURITÉ
  'security': {
    jobId: 'security',
    categories: [
      {
        id: 'role',
        label: 'Poste',
        options: [
          { id: 'bouncer', label: 'Videur / Portier', value: 'bouncer', icon: <Shield className="w-4 h-4" /> },
          { id: 'ssiap', label: 'Agent SSIAP', value: 'ssiap' }
        ]
      },
      {
        id: 'establishmentType',
        label: 'Lieu',
        options: [
          { id: 'nightclub', label: 'Discothèque', value: 'nightclub' },
          { id: 'event', label: 'Événementiel', value: 'event' }
        ]
      }
    ]
  },

  // DJ
  'dj': {
    jobId: 'dj',
    categories: [
      {
        id: 'musicStyle',
        label: 'Style musical',
        isMultiSelect: true,
        options: [
          { id: 'house', label: 'House / Deep', value: 'house', icon: <Music className="w-4 h-4 text-fuchsia-500" /> },
          { id: 'techno', label: 'Techno', value: 'techno' },
          { id: 'hiphop', label: 'Hip-Hop / RnB', value: 'hiphop' },
          { id: 'disco', label: 'Disco / Funk', value: 'disco' },
          { id: 'variete', label: 'Variété / Ambiance', value: 'variete' },
          { id: 'latino', label: 'Latino', value: 'latino' }
        ]
      },
      {
        id: 'eventType',
        label: 'Type d\'événement',
        options: [
          { id: 'club', label: 'Soirée Club', value: 'club' },
          { id: 'brunch', label: 'Brunch / Afterwork', value: 'brunch' },
          { id: 'private', label: 'Privé / Mariage', value: 'private' },
          { id: 'corporate', label: 'Corporate', value: 'corporate' }
        ]
      }
    ]
  },

  // AIDE MÉNAGÈRE
  'aide_menagere': {
    jobId: 'aide_menagere',
    categories: [
      {
        id: 'cleaningType',
        label: 'Type de nettoyage',
        isMultiSelect: true,
        options: [
          { id: 'daily', label: 'Entretien quotidien', value: 'daily', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
          { id: 'deep', label: 'Nettoyage en profondeur', value: 'deep' },
          { id: 'post_event', label: 'Après événement', value: 'post_event' },
          { id: 'windows', label: 'Vitres', value: 'windows' },
          { id: 'sanitary', label: 'Désinfection', value: 'sanitary' }
        ]
      },
      {
        id: 'areas',
        label: 'Zones',
        isMultiSelect: true,
        options: [
          { id: 'dining', label: 'Salle / Restaurant', value: 'dining' },
          { id: 'kitchen', label: 'Cuisine', value: 'kitchen' },
          { id: 'restrooms', label: 'Sanitaires', value: 'restrooms' },
          { id: 'terrace', label: 'Terrasse', value: 'terrace' }
        ]
      }
    ]
  },

  // ========================================================================
  // 3. TECH & AUDIOVISUEL
  // ========================================================================

  'light': {
    jobId: 'light',
    categories: [
      {
        id: 'expertise',
        label: 'Expertise',
        isMultiSelect: true,
        options: [
          { id: 'dmx', label: 'Console DMX', value: 'dmx', icon: <Lightbulb className="w-4 h-4 text-yellow-400" /> },
          { id: 'moving', label: 'Lyres / Motorisés', value: 'moving' },
          { id: 'install', label: 'Installation Fixe', value: 'install' }
        ]
      }
    ]
  },

  'sound': {
    jobId: 'sound',
    categories: [
      {
        id: 'expertise',
        label: 'Expertise',
        isMultiSelect: true,
        options: [
          { id: 'live', label: 'Ingé Son Live', value: 'live', icon: <Music className="w-4 h-4 text-blue-400" /> },
          { id: 'system', label: 'Calibrage Système', value: 'system' },
          { id: 'dj', label: 'Régie DJ', value: 'dj' }
        ]
      }
    ]
  },

  'video': {
    jobId: 'video',
    categories: [
      {
        id: 'expertise',
        label: 'Expertise',
        isMultiSelect: true,
        options: [
          { id: 'led', label: 'Mur LED', value: 'led', icon: <Video className="w-4 h-4 text-red-400" /> },
          { id: 'projection', label: 'Vidéoprojection', value: 'projection' },
          { id: 'content', label: 'Régie Contenu', value: 'content' }
        ]
      }
    ]
  },

  // POS & RÉSEAU
  'pos': {
    jobId: 'pos',
    categories: [
      {
        id: 'expertise',
        label: 'Domaine',
        options: [
          { id: 'pos', label: 'Caisse / TPE', value: 'pos', icon: <Monitor className="w-4 h-4" /> },
          { id: 'network', label: 'Réseau / WiFi', value: 'network', icon: <Wifi className="w-4 h-4" /> }
        ]
      },
      {
        id: 'system',
        label: 'Système',
        isMultiSelect: true,
        options: [
          { id: 'tiller', label: 'Tiller/SumUp', value: 'tiller' },
          { id: 'micros', label: 'Micros', value: 'micros' },
          { id: 'laddition', label: 'L\'Addition', value: 'laddition' },
          { id: 'unifi', label: 'Ubiquiti/Unifi', value: 'unifi' }
        ]
      }
    ]
  },

  'network': { // Alias for POS/Network if user has this role specifically
    jobId: 'network',
    categories: [
       {
        id: 'expertise',
        label: 'Domaine',
        options: [
          { id: 'wifi', label: 'WiFi / Internet', value: 'wifi', icon: <Wifi className="w-4 h-4" /> },
          { id: 'cabling', label: 'Câblage RJ45', value: 'cabling' }
        ]
      }
    ]
  },

  // ========================================================================
  // 4. BÂTIMENT & DESIGN
  // ========================================================================

  'architecture': {
    jobId: 'architecture',
    categories: [
      {
        id: 'interventionType',
        label: 'Type',
        options: [
          { id: 'layout', label: 'Plan / Aménagement', value: 'layout', icon: <Ruler className="w-4 h-4" /> },
          { id: '3d', label: 'Rendu 3D', value: '3d' },
          { id: 'permit', label: 'Dossier Mairie', value: 'permit' }
        ]
      }
    ]
  },

  'decoration': {
    jobId: 'decoration',
    categories: [
      {
        id: 'style',
        label: 'Style',
        isMultiSelect: true,
        options: [
          { id: 'modern', label: 'Moderne / Chic', value: 'modern' },
          { id: 'vintage', label: 'Vintage / Industriel', value: 'vintage' },
          { id: 'cozy', label: 'Cozy / Chaleureux', value: 'cozy' }
        ]
      },
      {
        id: 'expertise',
        label: 'Prestation',
        options: [
          { id: 'sourcing', label: 'Sourcing Mobilier', value: 'sourcing', icon: <Sofa className="w-4 h-4" /> },
          { id: 'staging', label: 'Mise en scène', value: 'staging' }
        ]
      }
    ]
  },

  'painting': {
    jobId: 'painting',
    categories: [
      {
        id: 'surface',
        label: 'Surface',
        isMultiSelect: true,
        options: [
          { id: 'walls', label: 'Murs', value: 'walls', icon: <Brush className="w-4 h-4" /> },
          { id: 'ceiling', label: 'Plafond', value: 'ceiling' },
          { id: 'floor', label: 'Sol / Résine', value: 'floor' }
        ]
      },
      {
        id: 'finish',
        label: 'Finition',
        options: [
          { id: 'matte', label: 'Mat', value: 'matte' },
          { id: 'satin', label: 'Satiné', value: 'satin' },
          { id: 'decorative', label: 'Décoratif (Chaux/Béton)', value: 'decorative' }
        ]
      }
    ]
  },

  'carpentry': {
    jobId: 'carpentry',
    categories: [
      {
        id: 'interventionType',
        label: 'Projet',
        isMultiSelect: true,
        options: [
          { id: 'furniture', label: 'Mobilier Sur Mesure', value: 'furniture', icon: <Hammer className="w-4 h-4" /> },
          { id: 'bar', label: 'Comptoir / Bar', value: 'bar' },
          { id: 'terrace', label: 'Terrasse Bois', value: 'terrace' }
        ]
      }
    ]
  }
};

// Helper to get config safely
export const getJobFilters = (jobId: string): JobFilterConfig | null => {
  return JOB_FILTERS_MAPPING[jobId] || null;
};

