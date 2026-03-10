import {
  Users, Wrench, Building2
} from 'lucide-react';

export type CategoryId = 'PERSONNEL' | 'TECHNICIENS' | 'BATIMENTS' | 'STAFFING' | 'TECH' | 'MAINTENANCE';

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

export const COMING_SOON_CATEGORIES: CategoryId[] = ['BATIMENTS'];

export const CATEGORIES: Category[] = [
  {
    id: 'PERSONNEL',
    label: 'Personnel / Extra',
    description: 'Renforts salle et cuisine',
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
      // Froid & Climatisation
      { id: 'tech_froid', label: 'Technicien Froid', group: 'Froid & Climatisation' },
      { id: 'tech_ventilation', label: 'Technicien Ventilation / CVC', group: 'Froid & Climatisation' },
      // Cuisson & Chaud
      { id: 'tech_chaud', label: 'Technicien Chaud', group: 'Cuisson & Chaud' },
      // Équipement cuisine
      { id: 'tech_lave_vaisselle', label: 'Technicien Lave-vaisselle', group: 'Équipement cuisine' },
      { id: 'tech_cafe', label: 'Technicien Machine à Café', group: 'Équipement cuisine' },
      { id: 'tech_biere', label: 'Technicien Pompe à Bière', group: 'Équipement cuisine' },
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
    description: 'Rénovation et construction',
    icon: Building2,
    services: [
      { id: 'architecte_interieur', label: 'Architecte d\'intérieur' },
      { id: 'architecte', label: 'Architecte' },
      { id: 'menuisier', label: 'Menuisier' },
      { id: 'peintre', label: 'Peintre' },
      { id: 'platrier', label: 'Plâtrier' },
      { id: 'carreleur', label: 'Carreleur' },
      { id: 'macon', label: 'Maçon' },
      { id: 'installateur_clim', label: 'Installateur climatisation' },
      { id: 'installateur_vmc', label: 'Installateur VMC' },
      { id: 'installateur_plomberie', label: 'Installateur plomberie' },
      { id: 'installateur_electricite', label: 'Installateur électricité' },
      { id: 'decorateur', label: 'Décorateur' },
      { id: 'paysagiste', label: 'Paysagiste' },
      { id: 'menuisier_metal', label: 'Menuisier métallier' },
    ]
  }
];
