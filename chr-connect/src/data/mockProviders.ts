import { ProviderProfile } from '@/types/provider';

export const MOCK_PROVIDERS: ProviderProfile[] = [
  {
    id: '1',
    firstName: 'Jean-Marc',
    lastName: 'Dupont',
    title: 'Chef de Partie Expert',
    bio: "Passionné par la cuisine française depuis 10 ans, je recherche des défis stimulants dans des établissements exigeants. Maîtrise parfaite des techniques de cuisson, des sauces et de la gestion de ligne. Rigoureux, organisé et doté d'un excellent esprit d'équipe.",
    avatarUrl: 'https://i.pravatar.cc/150?u=jeanmarc',
    location: {
      city: 'Paris 8ème',
    },
    stats: {
      rating: 4.9,
      missionsCompleted: 47,
      responseRate: 98,
      onTimeRate: 100
    },
    skills: ['Cuisson Viandes', 'Sauces', 'Pâtisserie', 'Gestion Stocks', 'HACCP'],
    certifications: [
      {
        id: 'c1',
        name: 'HACCP',
        issuer: 'Hygiène Pro',
        dateObtained: '2023-01-15',
        expiryDate: '2026-01-15',
        isVerified: true
      }
    ],
    portfolio: [
      {
        id: 'p1',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
        title: 'Filet de Bœuf Rossini',
        description: 'Service du soir au Fouquet\'s'
      },
      {
        id: 'p2',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
        title: 'Dressage Signature',
        description: 'Création automne 2023'
      }
    ],
    experiences: [
      {
        id: 'e1',
        role: 'Chef de Partie',
        company: 'Le Fouquet\'s',
        startDate: '2020-03',
        endDate: '2023-06',
        description: 'Responsable du poste chaud, gestion de 3 commis.'
      }
    ],
    reviews: [
      {
        id: 'r1',
        author: 'Marie L.',
        rating: 5,
        comment: 'Excellent travail, très pro et ponctuel. Je recommande !',
        date: '2024-02-10',
        missionTitle: 'Remplacement Chef de Partie'
      },
      {
        id: 'r2',
        author: 'Pierre D.',
        rating: 4,
        comment: 'Très bonne technique, s\'adapte vite.',
        date: '2024-01-05',
        missionTitle: 'Extra Soirée Gala'
      }
    ],
    languages: ['Français', 'Anglais'],
    badges: ['GOLD', 'VERIFIED', 'TOP_RATED'],
    preferences: {
      radius: 20,
      minHourlyRate: 25,
      availabilityBadges: ['Matin', 'Soir']
    },
    availability: {
      isAvailable: true,
      nextSlot: 'Aujourd\'hui 18h'
    },
    employmentCategory: 'EXTRA_EMPLOYEE',
    complianceStatus: 'VERIFIED',
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Connor',
    title: 'Frigoriste Certifiée',
    bio: "Spécialiste des systèmes de réfrigération commerciale. Intervention rapide et diagnostic précis. Je possède tout mon matériel de détection et réparation.",
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah',
    location: {
      city: 'Paris 11ème',
    },
    stats: {
      rating: 4.8,
      missionsCompleted: 123,
      responseRate: 95,
      onTimeRate: 98
    },
    skills: ['Chambres Froides', 'Climatisation', 'Fluides Frigorigènes', 'Électricité'],
    certifications: [
      {
        id: 'c2',
        name: 'Attestation Capacité Fluides',
        issuer: 'Bureau Veritas',
        dateObtained: '2022-05-20',
        isVerified: true
      },
      {
        id: 'c3',
        name: 'Habilitation Électrique BR',
        issuer: 'ElecForm',
        dateObtained: '2023-09-10',
        isVerified: true
      }
    ],
    portfolio: [
      {
        id: 'p3',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
        title: 'Installation Chambre Froide',
        description: 'Montage complet pour boucherie'
      }
    ],
    experiences: [
      {
        id: 'e2',
        role: 'Technicienne Froid',
        company: 'Froid Express',
        startDate: '2018-01',
        endDate: '2021-12',
        description: 'Maintenance préventive et curative sur sites industriels.'
      }
    ],
    reviews: [
      {
        id: 'r3',
        author: 'Brasserie des Arts',
        rating: 5,
        comment: 'A sauvé notre service du samedi soir ! Intervention en 30min.',
        date: '2024-03-01',
        missionTitle: 'Panne Chambre Froide'
      }
    ],
    languages: ['Français'],
    badges: ['VERIFIED'],
    preferences: {
      radius: 30,
      minHourlyRate: 45,
      availabilityBadges: ['Matin', 'Après-midi']
    },
    availability: {
      isAvailable: true,
      nextSlot: 'Demain 08h'
    },
    employmentCategory: 'FREELANCE_TECHNICIAN',
    complianceStatus: 'VERIFIED',
    siretNumber: '84312345600012',
    kbisVerifiedAt: '2026-02-15',
    urssafVerifiedAt: '2026-01-20',
  },
  {
    id: '3',
    firstName: 'Lucas',
    lastName: 'Petit',
    title: 'Barman Mixologue',
    bio: "Créateur de cocktails et animateur de soirée. Je transforme votre bar en véritable lieu d'expérience. Rapide, propre et toujours souriant.",
    avatarUrl: 'https://i.pravatar.cc/150?u=lucas',
    location: {
      city: 'Paris 4ème',
    },
    stats: {
      rating: 4.7,
      missionsCompleted: 35,
      responseRate: 90,
      onTimeRate: 95
    },
    skills: ['Cocktails Création', 'Flair Bartending', 'Gestion Bar', 'Service Salle'],
    certifications: [],
    portfolio: [
      {
        id: 'p4',
        type: 'IMAGE',
        url: 'https://images.unsplash.com/photo-1514362545857-3bc16549766b?auto=format&fit=crop&w=800&q=80',
        title: 'Cocktail Signature',
        description: 'Le Blue Lagoon revisité'
      }
    ],
    experiences: [],
    reviews: [],
    languages: ['Français', 'Espagnol', 'Anglais'],
    badges: ['NEW'],
    preferences: {
      radius: 10,
      minHourlyRate: 18,
      availabilityBadges: ['Soir', 'Nuit']
    },
    availability: {
      isAvailable: false,
      nextSlot: 'Dans 2 jours'
    },
    employmentCategory: 'EXTRA_EMPLOYEE',
    complianceStatus: 'VERIFIED',
  }
];
