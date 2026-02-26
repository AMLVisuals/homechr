import React from 'react';

// Définit une option de filtre individuelle (ex: "Panne", "Urgent")
export interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode; // Icône Lucide React
  value: string | boolean;
}

// Définit un groupe de filtres (ex: "Type d'intervention")
export interface FilterCategory {
  id: string;
  label: string;
  options: FilterOption[];
  isMultiSelect?: boolean; // Peut-on sélectionner plusieurs options dans cette catégorie ?
}

// Configuration complète des filtres pour un métier donné
export interface JobFilterConfig {
  jobId: string; // ex: 'frigorist', 'cook', 'architect'
  categories: FilterCategory[];
}

// État des filtres actifs sélectionnés par l'utilisateur
export interface ActiveFilters {
  [categoryId: string]: string | string[] | boolean; // ex: { interventionType: ['panne', 'maintenance'], urgent: true }
}
