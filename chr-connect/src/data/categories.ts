import {
  Users, Wrench, Building2, Armchair
} from 'lucide-react';

export type CategoryId = 'PERSONNEL' | 'TECHNICIENS' | 'BATIMENTS' | 'MOBILIER' | 'STAFFING' | 'TECH' | 'MAINTENANCE';

export interface Service {
  id: string;
  label: string;
  group?: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  description: string;
  icon: any;
  services: Service[];
}

// MOBILIER n'est pas encore dispo (carte "À venir" sur l'accueil).
// BATIMENTS est désormais actif (réutilise le flow Techniciens).
export const COMING_SOON_CATEGORIES: CategoryId[] = ['MOBILIER'];

export const CATEGORIES: Category[] = [
  {
    id: 'PERSONNEL',
    label: 'Personnel',
    description: 'Renfort intérim · Auto-entrepreneur',
    icon: Users,
    services: [
      // Salle
      { id: 'serveur', label: 'Serveur / Limonadier', group: 'Salle' },
      { id: 'chef_rang', label: 'Chef de Rang / Maître d\'hôtel', group: 'Salle' },
      { id: 'commis_salle', label: 'Commis de salle', group: 'Salle' },
      { id: 'manager_salle', label: 'Manager de salle', group: 'Salle' },
      // Bar
      { id: 'barman', label: 'Barman / Mixologue', group: 'Bar' },
      { id: 'sommelier', label: 'Sommelier / Caviste', group: 'Bar' },
      // Cuisine
      { id: 'chef_cuisine', label: 'Chef de Cuisine', group: 'Cuisine' },
      { id: 'chef_partie', label: 'Chef de Partie', group: 'Cuisine' },
      { id: 'cuisinier', label: 'Cuisinier', group: 'Cuisine' },
      { id: 'patissier', label: 'Pâtissier', group: 'Cuisine' },
      { id: 'boulanger', label: 'Boulanger', group: 'Cuisine' },
      { id: 'plongeur', label: 'Plongeur', group: 'Cuisine' },
      // Accueil & Hôtellerie
      { id: 'hotesse', label: 'Hôte / Hôtesse d\'accueil', group: 'Accueil & Hôtellerie' },
      { id: 'gouvernante', label: 'Gouvernante / Femme de chambre', group: 'Accueil & Hôtellerie' },
      { id: 'groom', label: 'Groom / Valet', group: 'Accueil & Hôtellerie' },
      // Sécurité
      { id: 'securite', label: 'Sécurité / Videur', group: 'Sécurité' },
      // Animation
      { id: 'dj', label: 'DJ', group: 'Animation' },
      // Entretien
      { id: 'aide_menagere', label: 'Agent d\'entretien', group: 'Entretien' },
    ]
  },
  {
    id: 'TECHNICIENS',
    label: 'Techniciens',
    description: 'Maintenance et équipements',
    icon: Wrench,
    services: [
      // Café & Bière (prioritaire — onglet en premier)
      { id: 'tech_cafe', label: 'Technicien Machine à Café', group: 'Café & Bière' },
      { id: 'tech_biere', label: 'Technicien Pompe à Bière', group: 'Café & Bière' },
      // Froid & Climatisation
      { id: 'tech_froid', label: 'Technicien Froid', group: 'Froid & Climatisation' },
      { id: 'tech_ventilation', label: 'Technicien Ventilation / CVC', group: 'Froid & Climatisation' },
      // Cuisson & Chaud
      { id: 'tech_chaud', label: 'Technicien Chaud', group: 'Cuisson & Chaud' },
      // Équipement cuisine
      { id: 'tech_lave_vaisselle', label: 'Technicien Lave-vaisselle', group: 'Équipement cuisine' },
      // Électricité & Plomberie
      { id: 'electricien', label: 'Électricien', group: 'Électricité & Plomberie' },
      { id: 'plombier', label: 'Plombier', group: 'Électricité & Plomberie' },
      // Caisse & IT
      { id: 'tech_pos', label: 'Technicien Caisse / POS', group: 'Caisse & IT' },
      { id: 'tech_reseau', label: 'Technicien Réseau / WiFi', group: 'Caisse & IT' },
      // Événementiel / AV
      { id: 'ingenieur_son', label: 'Ingénieur Son', group: 'Événementiel / AV' },
      { id: 'ingenieur_lumiere', label: 'Ingénieur Lumière', group: 'Événementiel / AV' },
      { id: 'tech_video', label: 'Technicien Vidéo', group: 'Événementiel / AV' },
    ]
  },
  {
    id: 'BATIMENTS',
    label: 'Bâtiments',
    description: 'Rénovation · Construction · Travaux spécifiques CHR',
    icon: Building2,
    services: [
      // Rénovation
      { id: 'peintre', label: 'Peintre', group: 'Rénovation' },
      { id: 'platrier', label: 'Plâtrier', group: 'Rénovation' },
      { id: 'carreleur', label: 'Carreleur', group: 'Rénovation' },
      { id: 'decorateur', label: 'Décorateur', group: 'Rénovation' },
      { id: 'menuisier', label: 'Menuisier', group: 'Rénovation' },
      { id: 'menuisier_metal', label: 'Menuisier métallier', group: 'Rénovation' },
      // Construction
      { id: 'architecte', label: 'Architecte', group: 'Construction' },
      { id: 'architecte_interieur', label: 'Architecte d\'intérieur', group: 'Construction' },
      { id: 'macon', label: 'Maçon', group: 'Construction' },
      { id: 'paysagiste', label: 'Paysagiste', group: 'Construction' },
      // Travaux spécifiques CHR
      { id: 'cuisine_pro', label: 'Installateur cuisine professionnelle', group: 'Travaux CHR' },
      { id: 'mise_aux_normes', label: 'Mise aux normes HACCP / ERP', group: 'Travaux CHR' },
      { id: 'terrasse', label: 'Aménagement de terrasse', group: 'Travaux CHR' },
      // Installations techniques
      { id: 'installateur_clim', label: 'Installateur climatisation', group: 'Installations techniques' },
      { id: 'installateur_vmc', label: 'Installateur VMC', group: 'Installations techniques' },
      { id: 'installateur_plomberie', label: 'Installateur plomberie', group: 'Installations techniques' },
      { id: 'installateur_electricite', label: 'Installateur électricité', group: 'Installations techniques' },
    ]
  },
  {
    id: 'MOBILIER',
    label: 'Mobilier CHR',
    description: 'Achat, livraison et installation de mobilier professionnel',
    icon: Armchair,
    services: [
      // Mobilier intérieur
      { id: 'tables_chaises', label: 'Tables & chaises', group: 'Mobilier intérieur' },
      { id: 'banquettes', label: 'Banquettes', group: 'Mobilier intérieur' },
      { id: 'comptoirs', label: 'Comptoirs de bar', group: 'Mobilier intérieur' },
      // Mobilier extérieur
      { id: 'terrasse_mobilier', label: 'Mobilier de terrasse', group: 'Mobilier extérieur' },
      // Équipement spécifique
      { id: 'vitrines_refrigerees', label: 'Vitrines réfrigérées', group: 'Équipement spécifique' },
      { id: 'meubles_bar', label: 'Meubles de bar', group: 'Équipement spécifique' },
      { id: 'luminaires', label: 'Luminaires & déco lumière', group: 'Équipement spécifique' },
      // Occasion / reconditionné
      { id: 'mobilier_occasion', label: 'Mobilier d\'occasion / reconditionné', group: 'Occasion' },
    ]
  }
];
