import { 
  Users, Wrench, Building2, Calculator, Scale 
} from 'lucide-react';

export type CategoryId = 'PERSONNEL' | 'TECHNICIENS' | 'BATIMENTS' | 'COMPTABILITE' | 'JURIDIQUE' | 'STAFFING' | 'TECH' | 'MAINTENANCE';

export interface Service {
  id: string;
  label: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  description: string;
  icon: any;
  services: Service[];
}

export const COMING_SOON_CATEGORIES: CategoryId[] = ['BATIMENTS', 'COMPTABILITE', 'JURIDIQUE'];

export const CATEGORIES: Category[] = [
  {
    id: 'PERSONNEL',
    label: 'Personnel / Extra',
    description: 'Renforts salle et cuisine',
    icon: Users,
    services: [
      { id: 'serveur', label: 'Serveur / Limonadier' },
      { id: 'chef_rang', label: 'Chef de Rang / Maître d\'hôtel' },
      { id: 'barman', label: 'Barman / Mixologue' },
      { id: 'sommelier', label: 'Sommelier / Caviste' },
      { id: 'hotesse', label: 'Hôte / Hôtesse d\'accueil' },
      { id: 'commis_salle', label: 'Commis de salle' },
      { id: 'groom', label: 'Groom / Valet' },
      { id: 'chef_partie', label: 'Chef de Partie' },
      { id: 'chef_cuisine', label: 'Chef de Cuisine' },
      { id: 'cuisinier', label: 'Cuisinier' },
      { id: 'plongeur', label: 'Plongeur' },
      { id: 'patissier', label: 'Pâtissier' },
      { id: 'boulanger', label: 'Boulanger' },
      { id: 'securite', label: 'Sécurité / Videur' },
      { id: 'manager_salle', label: 'Manager de salle' },
      { id: 'gouvernante', label: 'Gouvernante / Femme de chambre' },
    ]
  },
  {
    id: 'TECHNICIENS',
    label: 'Techniciens',
    description: 'Maintenance et équipements',
    icon: Wrench,
    services: [
      { id: 'tech_froid', label: 'Technicien Froid' },
      { id: 'tech_chaud', label: 'Technicien Chaud' },
      { id: 'tech_ventilation', label: 'Technicien Ventilation / CVC' },
      { id: 'electricien', label: 'Électricien' },
      { id: 'plombier', label: 'Plombier' },
      { id: 'tech_cafe', label: 'Technicien Machine à Café' },
      { id: 'tech_biere', label: 'Technicien Pompe à Bière' },
      { id: 'tech_lave_vaisselle', label: 'Technicien Lave-vaisselle' },
      { id: 'tech_pos', label: 'Technicien Equipement Caisse / POS' },
      { id: 'ingenieur_son', label: 'Ingénieur Son' },
      { id: 'ingenieur_lumiere', label: 'Ingénieur Lumière' },
      { id: 'tech_video', label: 'Technicien Vidéo' },
      { id: 'tech_reseau', label: 'Technicien Réseau / WiFi' },
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
  },
  {
    id: 'COMPTABILITE',
    label: 'Comptabilité',
    description: 'Gestion financière',
    icon: Calculator,
    services: [
      { id: 'comptable', label: 'Comptable' },
      { id: 'expert_comptable', label: 'Expert-comptable' },
      { id: 'aide_comptable', label: 'Aide-comptable' },
      { id: 'controleur_gestion', label: 'Contrôleur de gestion' },
      { id: 'analyste_financier', label: 'Analyste financier' },
      { id: 'responsable_paie', label: 'Responsable paie' },
      { id: 'expert_fiscal', label: 'Expert en optimisation fiscale CHR' },
      { id: 'consultant_stocks', label: 'Consultant en gestion de stocks' },
      { id: 'expert_couts', label: 'Expert en coûts matières' },
      { id: 'expert_rentabilite', label: 'Expert en rentabilité restaurant' },
    ]
  },
  {
    id: 'JURIDIQUE',
    label: 'Juridique',
    description: 'Conseil et conformité',
    icon: Scale,
    services: [
      { id: 'avocat_travail', label: 'Avocat droit du travail' },
      { id: 'juriste_rh', label: 'Juriste RH' },
      { id: 'avocat_societes', label: 'Avocat droit des sociétés' },
      { id: 'notaire', label: 'Notaire' },
      { id: 'avocat_licences', label: 'Avocat spécialisé licences (IV, III, II, I)' },
      { id: 'expert_hygiene', label: 'Expert en hygiène et sécurité alimentaire' },
      { id: 'juriste_haccp', label: 'Juriste en conformité sanitaire (HACCP)' },
      { id: 'expert_assurances', label: 'Expert en assurances professionnelles' },
      { id: 'consultant_pi', label: 'Consultant en propriété intellectuelle' },
    ]
  }
];
