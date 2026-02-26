import React from 'react';
import {
  Refrigerator,
  Snowflake,
  Flame,
  Coffee,
  Wind,
  Beer,
  UtensilsCrossed,
  Warehouse,
  Sparkles,
  Wrench,
  Mic,
  Lightbulb,
  Video,
  Monitor,
  Wifi,
} from 'lucide-react';
import type { EquipmentCategory } from '@/types/equipment';

export interface CategoryOption {
  id: EquipmentCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconComponent: React.ElementType;
  color: string;
}

export const EQUIPMENT_CATEGORIES_DETAILS: CategoryOption[] = [
  {
    id: 'FRIDGE',
    label: 'Réfrigérateur',
    description: 'Frigo, vitrine réfrigérée',
    icon: <Refrigerator className="w-5 h-5" />,
    iconComponent: Refrigerator,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'FREEZER',
    label: 'Congélateur',
    description: 'Congélateur, surgélateur',
    icon: <Snowflake className="w-5 h-5" />,
    iconComponent: Snowflake,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'COLD_ROOM',
    label: 'Chambre froide',
    description: 'Chambre froide positive/négative',
    icon: <Warehouse className="w-5 h-5" />,
    iconComponent: Warehouse,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'COFFEE_MACHINE',
    label: 'Machine à café',
    description: 'Expresso, moulin',
    icon: <Coffee className="w-5 h-5" />,
    iconComponent: Coffee,
    color: 'from-amber-600 to-orange-600',
  },
  {
    id: 'OVEN',
    label: 'Four',
    description: 'Four professionnel, combi',
    icon: <Flame className="w-5 h-5" />,
    iconComponent: Flame,
    color: 'from-orange-500 to-red-500',
  },
  {
    id: 'DISHWASHER',
    label: 'Lave-vaisselle',
    description: 'Lave-vaisselle pro, tunnel',
    icon: <Sparkles className="w-5 h-5" />,
    iconComponent: Sparkles,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'ICE_MACHINE',
    label: 'Machine à glaçons',
    description: 'Producteur de glaçons',
    icon: <Snowflake className="w-5 h-5" />,
    iconComponent: Snowflake,
    color: 'from-sky-400 to-cyan-400',
  },
  {
    id: 'BEER_TAP',
    label: 'Tireuse à bière',
    description: 'Système de tirage pression',
    icon: <Beer className="w-5 h-5" />,
    iconComponent: Beer,
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'VENTILATION',
    label: 'Ventilation/Hotte',
    description: 'Hotte, VMC, climatisation',
    icon: <Wind className="w-5 h-5" />,
    iconComponent: Wind,
    color: 'from-gray-400 to-gray-500',
  },
  {
    id: 'COOKING',
    label: 'Équipement cuisson',
    description: 'Plaque, friteuse, grill',
    icon: <UtensilsCrossed className="w-5 h-5" />,
    iconComponent: UtensilsCrossed,
    color: 'from-red-500 to-pink-500',
  },
  {
    id: 'AUDIO',
    label: 'Audio / Son',
    description: 'Enceintes, amplis, DJ',
    icon: <Mic className="w-5 h-5" />,
    iconComponent: Mic,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'LIGHTING',
    label: 'Éclairage',
    description: 'Projecteurs, lumières',
    icon: <Lightbulb className="w-5 h-5" />,
    iconComponent: Lightbulb,
    color: 'from-yellow-400 to-orange-400',
  },
  {
    id: 'VIDEO',
    label: 'Vidéo',
    description: 'Projecteurs, caméras',
    icon: <Video className="w-5 h-5" />,
    iconComponent: Video,
    color: 'from-blue-400 to-indigo-400',
  },
  {
    id: 'POS',
    label: 'Caisse / TPE',
    description: 'Systèmes de caisse',
    icon: <Monitor className="w-5 h-5" />,
    iconComponent: Monitor,
    color: 'from-green-400 to-emerald-400',
  },
  {
    id: 'NETWORK',
    label: 'Réseau / WiFi',
    description: 'Bornes WiFi, routeurs',
    icon: <Wifi className="w-5 h-5" />,
    iconComponent: Wifi,
    color: 'from-cyan-400 to-blue-400',
  },
  {
    id: 'SCREEN',
    label: 'Écrans',
    description: 'Affichage dynamique',
    icon: <Monitor className="w-5 h-5" />,
    iconComponent: Monitor,
    color: 'from-indigo-400 to-purple-400',
  },
  {
    id: 'OTHER',
    label: 'Autre',
    description: 'Équipement non listé',
    icon: <Wrench className="w-5 h-5" />,
    iconComponent: Wrench,
    color: 'from-gray-500 to-gray-600',
  },
];
