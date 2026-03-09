import { PricingModel } from './pricingRules';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'time' | 'checkbox' | 'radio' | 'textarea' | 'multiselect';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  suffix?: string;
  conditional?: { field: string; value: string }; // Show only if another field has value
}

export interface MissionDefinition {
  id: string;
  label: string;
  tags: string[];
  formFields: FormField[];
  pricingModel: PricingModel;
}

export const MISSIONS: Record<string, MissionDefinition> = {
  // --- STAFFING ---
  'waiter': {
    id: 'waiter',
    label: 'Serveur / Limonadier',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Absence imprévue", "Maladie", "Défection", "Rush inattendu", "Banquet", "Mariage", "Anglais requis", "Terrasse"],
    formFields: [
      { id: 'establishmentType', label: "Type d'établissement", type: 'select', options: ['Restaurant Gastronomique', 'Brasserie', 'Café', 'Traiteur'], required: true },
      { id: 'experienceLevel', label: "Niveau requis", type: 'select', options: ['Débutant', 'Confirmé', 'Expert'], required: true },
      { id: 'languages', label: "Langues obligatoires", type: 'multiselect', options: ['Anglais', 'Espagnol', 'Italien', 'Allemand', 'Russe'] },
      { id: 'outfit', label: "Tenue exigée", type: 'radio', options: ['Fournie', 'Personnelle'], required: true },
      { id: 'skills', label: "Compétences", type: 'multiselect', options: ['Vente', 'Sommellerie base', 'Logiciel caisse', 'Découpe'] }
    ]
  },
  'chef_rang': {
    id: 'chef_rang',
    label: 'Chef de Rang',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Chef de rang absent", "Événement VIP", "Service important", "Gestion salle", "Formation équipe"],
    formFields: [
      { id: 'establishmentType', label: "Type d'établissement", type: 'select', options: ['Restaurant Étoilé', 'Hôtel 5*', 'Premium'], required: true },
      { id: 'yearsExperience', label: "Années d'expérience", type: 'number', suffix: 'ans', required: true },
      { id: 'languages', label: "Langues étrangères", type: 'multiselect', options: ['Anglais', 'Espagnol', 'Arabe', 'Chinois'] },
      { id: 'wineKnowledge', label: "Connaissance Vins", type: 'select', options: ['Basique', 'Intermédiaire', 'Avancé (Sommelier)'] }
    ]
  },
  'barman': {
    id: 'barman',
    label: 'Barman / Mixologue',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Barman absent", "Cocktail party", "Mixologue expert", "Création signature", "Lancement produit"],
    formFields: [
      { id: 'expertise', label: "Niveau d'expertise", type: 'select', options: ['Standard', 'Mixologue', 'Expert Flair'], required: true },
      { id: 'equipment', label: "Matériel sur place", type: 'radio', options: ['Bar complet', 'Partiel', 'Rien (Apporter matériel)'], required: true },
      { id: 'creation', label: "Besoin de création signature", type: 'checkbox' },
      { id: 'ingredients', label: "Ingrédients", type: 'radio', options: ['Fournis', 'A acheter par le barman'] }
    ]
  },
  'sommelier': {
    id: 'sommelier',
    label: 'Sommelier',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Dégustation", "Accords mets-vins", "Conseil achat", "Formation équipe", "Dîner VIP"],
    formFields: [
      { id: 'missionType', label: "Type de mission", type: 'select', options: ['Service', 'Conseil Achat', 'Formation', 'Masterclass'], required: true },
      { id: 'expertise', label: "Certification", type: 'select', options: ['Junior', 'Senior', 'Master Sommelier'] },
      { id: 'regions', label: "Spécialité régionale", type: 'text', placeholder: "Ex: Bourgogne, Bordeaux..." }
    ]
  },
  'cook': {
    id: 'cook',
    label: 'Cuisinier',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Cuisinier absent", "Remplacement urgence", "Chef de partie", "Pâtissier", "Banquet"],
    formFields: [
      { id: 'role', label: "Poste", type: 'select', options: ['Commis', 'Chef de Partie', 'Second', 'Chef de Cuisine', 'Pâtissier'], required: true },
      { id: 'cuisineType', label: "Type de cuisine", type: 'select', options: ['Française Trad.', 'Gastronomique', 'Italienne', 'Asiatique', 'Burger/Street'], required: true },
      { id: 'knives', label: "Doit apporter ses couteaux", type: 'checkbox' }
    ]
  },
  'dishwasher': {
    id: 'dishwasher',
    label: 'Plongeur',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Plongeur absent", "Urgence", "Rush imprévu", "Grosse plonge", "Machine en panne"],
    formFields: [
      { id: 'volume', label: "Volume estimé", type: 'select', options: ['Normal', 'Intense', 'Très Intense (Banquet)'], required: true },
      { id: 'equipment', label: "Équipement", type: 'select', options: ['Plonge capot', 'Tunnel de lavage', 'Plonge manuelle'] }
    ]
  },
  'hostess': {
    id: 'hostess',
    label: 'Hôte / Hôtesse',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Accueil absent", "Événement VIP", "Gestion vestiaire", "Placement", "Réservations"],
    formFields: [
      { id: 'languages', label: "Langues requises", type: 'multiselect', options: ['Anglais', 'Français', 'Espagnol'] },
      { id: 'software', label: "Logiciel réservation", type: 'select', options: ['Aucun', 'Zenchef', 'TheFork', 'SevenRooms'] },
      { id: 'dresscode', label: "Dress Code", type: 'text', placeholder: "Ex: Robe noire, Tenue de ville..." }
    ]
  },
  'security': {
    id: 'security',
    label: 'Sécurité / Videur',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Sécurité soirée", "Contrôle d'accès", "Filtrage", "Protection VIP", "Conflit"],
    formFields: [
      { id: 'role', label: "Type de poste", type: 'select', options: ['Agent d\'accueil (Filtrage)', 'Surveillance salle', 'Sécurité Incendie (SSIAP)', 'Garde du corps'], required: true },
      { id: 'crowd', label: "Affluence attendue", type: 'number', suffix: 'pers.' },
      { id: 'equipment', label: "Matériel fourni", type: 'multiselect', options: ['Radio', 'Oreillette', 'Détecteur métaux'] }
    ]
  },

  'dj': {
    id: 'dj',
    label: 'DJ',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Soirée à thème", "Brunch DJ", "Événement privé", "Nouvel An", "Opening", "Fermeture de saison", "Anniversaire"],
    formFields: [
      { id: 'eventType', label: "Type d'événement", type: 'select', options: ['Soirée Club', 'Brunch / Afterwork', 'Mariage / Privé', 'Événement corporate', 'Festival / Plein air'], required: true },
      { id: 'musicStyle', label: "Style musical", type: 'multiselect', options: ['House / Deep', 'Techno', 'Hip-Hop / RnB', 'Disco / Funk', 'Années 80-90', 'Latino', 'Variété / Ambiance', 'Électro généraliste'] },
      { id: 'equipment', label: "Matériel sur place", type: 'radio', options: ['Cabine DJ complète', 'Partiel (préciser)', 'Rien (DJ apporte tout)'], required: true },
      { id: 'duration', label: "Durée du set", type: 'select', options: ['2h', '3h', '4h', '5h+'] },
      { id: 'guests', label: "Nombre de convives attendus", type: 'number', suffix: 'pers.' }
    ]
  },
  'aide_menagere': {
    id: 'aide_menagere',
    label: 'Agent d\'entretien',
    pricingModel: 'STAFFING_HOURLY',
    tags: ["Ménage quotidien", "Nettoyage en profondeur", "Après événement", "Remise en état", "Vitres", "Désinfection"],
    formFields: [
      { id: 'cleaningType', label: "Type de prestation", type: 'select', options: ['Entretien quotidien', 'Nettoyage en profondeur', 'Remise en état après événement', 'Vitres / Surfaces vitrées', 'Désinfection sanitaire'], required: true },
      { id: 'areas', label: "Zones à nettoyer", type: 'multiselect', options: ['Salle / Restaurant', 'Cuisine', 'Toilettes / Sanitaires', 'Terrasse', 'Bureaux / Réserve', 'Chambres (hôtel)'] },
      { id: 'surface', label: "Surface approximative", type: 'number', suffix: 'm²' },
      { id: 'equipment', label: "Matériel de nettoyage", type: 'radio', options: ['Fourni sur place', 'À apporter par le prestataire'], required: true },
      { id: 'frequency', label: "Fréquence souhaitée", type: 'select', options: ['Ponctuel (une fois)', 'Quotidien', 'Hebdomadaire', 'Mensuel'] }
    ]
  },

  // --- MAINTENANCE ---
  'cold': {
    id: 'cold',
    label: 'Froid (Frigo/Chambre froide)',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Ne refroidit plus", "Fuite d'eau", "Givre excessif", "Bruit anormal", "Panne totale", "Code erreur"],
    formFields: [
      { id: 'equipmentType', label: "Type d'équipement", type: 'select', options: ['Chambre Froide Positive', 'Chambre Froide Négative', 'Armoire Réfrigérée', 'Machine à Glaçons', 'Saladette'], required: true },
      { id: 'brand', label: "Marque (si connue)", type: 'text' },
      { id: 'access', label: "Accessibilité", type: 'select', options: ['Facile (RDC)', 'Difficile (Cave/Etage)', 'Besoin escabeau'] },
      { id: 'risk', label: "Risque Stock", type: 'radio', options: ['Aucun', 'Marchandise en danger'], required: true }
    ]
  },
  'hot': {
    id: 'hot',
    label: 'Chaud (Four/Piano)',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Ne chauffe plus", "Problème gaz", "Flamme jaune", "Porte bloquée", "Minuterie HS"],
    formFields: [
      { id: 'equipmentType', label: "Type d'équipement", type: 'select', options: ['Four Mixte', 'Piano Gaz', 'Friteuse', 'Salamandre', 'Plancha'], required: true },
      { id: 'energy', label: "Énergie", type: 'radio', options: ['Gaz', 'Électrique'], required: true },
      { id: 'brand', label: "Marque", type: 'text' }
    ]
  },
  'plumbing': {
    id: 'plumbing',
    label: 'Plomberie',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Fuite d'eau", "Canalisation bouchée", "Plus d'eau chaude", "Odeur égout", "Bac à graisse"],
    formFields: [
      { id: 'problemType', label: "Type de problème", type: 'select', options: ['Fuite', 'Bouchon', 'Chauffe-eau', 'Robinetterie'], required: true },
      { id: 'location', label: "Localisation", type: 'select', options: ['Cuisine', 'Bar', 'Toilettes Clients', 'Vestiaires'] },
      { id: 'urgency_flood', label: "Niveau inondation", type: 'select', options: ['Goutte à goutte', 'Flaque', 'Inondation majeure'] }
    ]
  },
  'elec': {
    id: 'elec',
    label: 'Électricien',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Coupure courant", "Disjoncteur saute", "Prise HS", "Odeur brûlé", "Lumière clignote"],
    formFields: [
      { id: 'scope', label: "Étendue", type: 'select', options: ['Tout l\'établissement', 'Une zone', 'Un seul appareil'], required: true },
      { id: 'installation', label: "Type installation", type: 'select', options: ['Monophasé (Classique)', 'Triphasé (Industriel)', 'Je ne sais pas'] }
    ]
  },
  'coffee': {
    id: 'coffee',
    label: 'Machine à Café',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Pas de pression", "Fuite", "Café froid", "Goût brûlé", "Erreur affichage"],
    formFields: [
      { id: 'machineType', label: "Type machine", type: 'select', options: ['Expresso Traditionnelle (Bras)', 'Automatique (Grains)', 'Filtre'], required: true },
      { id: 'groups', label: "Nombre de groupes", type: 'select', options: ['1', '2', '3', '4'] },
      { id: 'maintenance', label: "Dernier entretien", type: 'select', options: ['< 6 mois', '> 6 mois', 'Jamais'] }
    ]
  },
  'beer': {
    id: 'beer',
    label: 'Pompe à Bière',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Trop de mousse", "Pas de débit", "Bière chaude", "Fuite gaz", "Nettoyage requis"],
    formFields: [
      { id: 'lines', label: "Nombre de becs", type: 'number', required: true },
      { id: 'cooling', label: "Système froid", type: 'select', options: ['Sous comptoir', 'Groupe déporté (Cave)', 'Je ne sais pas'] }
    ]
  },

  // --- TECH ---
  'sound': {
    id: 'sound',
    label: 'Ingénieur Son',
    pricingModel: 'MAINTENANCE_FIXED', // Can be mixed but often fixed for intervention
    tags: ["Larsen", "Micro coupé", "Son saturé", "Installation DJ", "Réglage limiteur"],
    formFields: [
      { id: 'eventType', label: "Contexte", type: 'select', options: ['Dépannage Urgence', 'Installation Événement', 'Réglage Système'], required: true },
      { id: 'equipment', label: "Matériel en place", type: 'text', placeholder: "Marque enceintes, table mixage..." }
    ]
  },
  'light': {
    id: 'light',
    label: 'Ingénieur Lumière',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Projecteur HS", "Programmation DMX", "Ambiance", "Noir complet", "Installation"],
    formFields: [
      { id: 'system', label: "Système", type: 'select', options: ['DMX', 'Analogique', 'Domotique', 'Autonome'] },
      { id: 'fixtures', label: "Nombre projecteurs approx", type: 'number' }
    ]
  },
  'video': {
    id: 'video',
    label: 'Technicien Vidéo',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Vidéoprojecteur HS", "Pas de signal", "Écran noir", "Match ce soir", "Son mais pas image"],
    formFields: [
      { id: 'device', label: "Appareil", type: 'select', options: ['Vidéoprojecteur', 'TV / Écran', 'Mur LED', 'Matrice Vidéo'] },
      { id: 'source', label: "Source", type: 'select', options: ['Box TV', 'Ordinateur', 'Apple TV/Chromecast', 'Satellite'] }
    ]
  },
  'pos': {
    id: 'pos',
    label: 'Installateur POS',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Caisse bloquée", "Imprimante ticket HS", "TPE connexion", "Tiroir caisse", "Logiciel planté"],
    formFields: [
      { id: 'software', label: "Logiciel de caisse", type: 'select', options: ['Tiller/SumUp', 'Zelty', 'Lightspeed', 'L\'Addition', 'Micros', 'Autre'], required: true },
      { id: 'hardware', label: "Matériel en panne", type: 'multiselect', options: ['iPad/Tablette', 'Imprimante Cuisine', 'TPE', 'Routeur Caisse'] }
    ]
  },
  'network': {
    id: 'network',
    label: 'Réseau / WiFi',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["WiFi lent", "Coupures", "Pas d'internet", "Portail captif", "Caméras HS"],
    formFields: [
      { id: 'isp', label: "Opérateur", type: 'select', options: ['Orange', 'SFR', 'Bouygues', 'Free', 'Autre'] },
      { id: 'area', label: "Surface à couvrir", type: 'number', suffix: 'm²' },
      { id: 'users', label: "Nombre utilisateurs simultanés", type: 'number' }
    ]
  },

  // --- DESIGN / PROJECT ---
  'architect': {
    id: 'architect',
    label: "Architecte d'intérieur",
    pricingModel: 'PROJECT_VISIT',
    tags: ["Rénovation complète", "Mise aux normes", "Extension", "Cuisine ouverte", "Façade"],
    formFields: [
      { id: 'projectType', label: "Type de projet", type: 'select', options: ['Rénovation Complète', 'Réaménagement partiel', 'Mise aux normes', 'Extension'], required: true },
      { id: 'surface', label: "Surface concernée", type: 'number', suffix: 'm²', required: true },
      { id: 'budget', label: "Budget estimé", type: 'select', options: ['< 10k€', '10k-50k€', '50k-100k€', '> 100k€'] },
      { id: 'style', label: "Style recherché", type: 'select', options: ['Moderne/Indus', 'Classique/Chic', 'Bohème', 'Minimaliste'] }
    ]
  },
  'decorator': {
    id: 'decorator',
    label: 'Décorateur',
    pricingModel: 'PROJECT_VISIT',
    tags: ["Changement ambiance", "Mobilier", "Luminaires", "Végétalisation", "Arts de la table"],
    formFields: [
      { id: 'scope', label: "Périmètre", type: 'select', options: ['Conseil Couleur/Matière', 'Shopping Mobilier', 'Scénographie complète'], required: true },
      { id: 'surface', label: "Surface", type: 'number', suffix: 'm²' }
    ]
  },
  'painter': {
    id: 'painter',
    label: 'Peintre',
    pricingModel: 'PROJECT_VISIT', // Visit for quote
    tags: ["Peinture salle", "Cuisine normes", "Retouches", "Dégât des eaux", "Façade"],
    formFields: [
      { id: 'surface', label: "Surface à peindre (approx)", type: 'number', suffix: 'm²', required: true },
      { id: 'condition', label: "État des murs", type: 'select', options: ['Bon état', 'À enduire', 'Dégât des eaux', 'Brut'] },
      { id: 'height', label: "Hauteur sous plafond", type: 'select', options: ['Standard (<2.5m)', 'Haut (>3m)', 'Très haut (Échafaudage)'] }
    ]
  },
  'carpenter': {
    id: 'carpenter',
    label: 'Menuisier',
    pricingModel: 'PROJECT_VISIT',
    tags: ["Bar sur mesure", "Banquettes", "Terrasse bois", "Placards", "Réparation porte"],
    formFields: [
      { id: 'project', label: "Projet", type: 'select', options: ['Mobilier sur mesure', 'Agencement Bar', 'Terrasse', 'Réparation'], required: true },
      { id: 'material', label: "Matériau souhaité", type: 'text', placeholder: "Chêne, Contreplaqué, Exotique..." }
    ]
  },

  // DEFAULT FALLBACK
  'default': {
    id: 'default',
    label: 'Expert',
    pricingModel: 'MAINTENANCE_FIXED',
    tags: ["Problème technique", "Besoin urgent", "Devis"],
    formFields: [
      { id: 'description', label: "Description du besoin", type: 'textarea', required: true }
    ]
  }
};

export const getMissionConfig = (subCategoryId: string): MissionDefinition => {
  return MISSIONS[subCategoryId] || MISSIONS['default'];
};
