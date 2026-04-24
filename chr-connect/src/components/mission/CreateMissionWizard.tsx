'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ConnectedVenueCard from '@/components/venues/ConnectedVenueCard';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ArrowLeft,
  Wrench,
  User,
  Monitor,
  Ruler,
  Thermometer,
  Utensils,
  Zap,
  Coffee,
  Beer,
  Mic,
  Lightbulb,
  Wifi,
  PenTool,
  PaintBucket,
  Hammer,
  Martini,
  Wine,
  ChefHat,
  Shield,
  ShieldCheck,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  Send,
  Check,
  Users,
  MapPin,
  Snowflake,
  Flame,
  Building2,
  Euro,
  Image as ImageIcon,
  Video,
  Play,
  Trash2,
  Camera,
  Upload,
  Crown,
  CreditCard,
  ChevronDown,
  Music,
  SprayCan,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { COMING_SOON_CATEGORIES } from '@/data/categories';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import {
  getProblemsForCategory,
  SEVERITY_CONFIG,
  STAFFING_NEEDS,
  type EquipmentProblem,
  type StaffingNeed,
} from '@/lib/equipmentProblems';
import type { Equipment, EquipmentCategory, EquipmentDocument, ImageAnnotation } from '@/types/equipment';
import { AddEquipmentModal } from '@/components/establishment/AddEquipmentModal';
import { EquipmentDetailsModal } from '@/components/equipment/EquipmentDetailsModal';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import { MediaCaptureModal, type CaptureMode } from '@/components/shared/MediaCaptureModal';
import { APP_CONFIG } from '@/config/appConfig';

// ============================================================================
// TYPES
// ============================================================================

interface CreateMissionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: CategoryId;
  defaultDate?: string;
}

type WizardStep =
  | 'category'
  | 'subcategory'
  | 'mission-type-selection'
  | 'asset-selection'
  | 'problem-selection'
  | 'details'
  | 'staffing-config'
  | 'summary'
  | 'payment'
  | 'success';

export type CategoryId = 'PERSONNEL' | 'TECHNICIENS' | 'BATIMENTS' | 'JURIDIQUE' | 'STAFFING' | 'TECH' | 'MAINTENANCE';

interface CategoryDef {
  id: CategoryId;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  subCategories: SubCategoryDef[];
}

interface SubCategoryDef {
  id: string;
  label: string;
  icon: React.ElementType;
  group?: string;
  equipmentCategories?: EquipmentCategory[];
}

// ============================================================================
// GROUP COLORS (gradients for subcategory buttons)
// ============================================================================

const GROUP_COLORS: Record<string, string> = {
  // PERSONNEL
  'Salle': 'from-purple-500 to-pink-500',
  'Bar': 'from-amber-500 to-yellow-500',
  'Cuisine': 'from-orange-500 to-red-500',
  'Accueil & Hôtellerie': 'from-emerald-500 to-teal-500',
  'Sécurité': 'from-slate-500 to-zinc-600',
  'Animation': 'from-fuchsia-500 to-purple-600',
  'Entretien': 'from-cyan-500 to-blue-500',
  // TECHNICIENS
  'Froid & Climatisation': 'from-sky-500 to-blue-600',
  'Cuisson & Chaud': 'from-orange-500 to-red-500',
  'Équipement cuisine': 'from-emerald-500 to-teal-500',
  'Électricité & Plomberie': 'from-yellow-500 to-amber-600',
  'Caisse & IT': 'from-violet-500 to-purple-600',
  'Événementiel / AV': 'from-pink-500 to-rose-600',
};

// ============================================================================
// CATEGORY DEFINITIONS WITH EQUIPMENT MAPPING
// ============================================================================

const CATEGORIES: CategoryDef[] = [
  {
    id: 'PERSONNEL',
    label: 'Personnel / Extra',
    description: 'Renforts salle et cuisine',
    icon: Users,
    color: 'from-purple-500 to-pink-500',
    subCategories: [
      // Salle
      { id: 'serveur', label: 'Serveur / Limonadier', icon: User, group: 'Salle' },
      { id: 'chef_rang', label: 'Chef de Rang / Maître d\'hôtel', icon: User, group: 'Salle' },
      { id: 'commis_salle', label: 'Commis de salle', icon: User, group: 'Salle' },
      { id: 'manager_salle', label: 'Manager de salle', icon: User, group: 'Salle' },
      // Bar
      { id: 'barman', label: 'Barman / Mixologue', icon: Martini, group: 'Bar' },
      { id: 'sommelier', label: 'Sommelier / Caviste', icon: Wine, group: 'Bar' },
      // Cuisine
      { id: 'chef_cuisine', label: 'Chef de Cuisine', icon: ChefHat, group: 'Cuisine' },
      { id: 'chef_partie', label: 'Chef de Partie', icon: ChefHat, group: 'Cuisine' },
      { id: 'cuisinier', label: 'Cuisinier', icon: ChefHat, group: 'Cuisine' },
      { id: 'patissier', label: 'Pâtissier', icon: ChefHat, group: 'Cuisine' },
      { id: 'boulanger', label: 'Boulanger', icon: ChefHat, group: 'Cuisine' },
      { id: 'plongeur', label: 'Plongeur', icon: Utensils, group: 'Cuisine' },
      // Accueil & Hôtellerie
      { id: 'hotesse', label: 'Hôte / Hôtesse d\'accueil', icon: User, group: 'Accueil & Hôtellerie' },
      { id: 'gouvernante', label: 'Gouvernante / Femme de chambre', icon: User, group: 'Accueil & Hôtellerie' },
      { id: 'groom', label: 'Groom / Valet', icon: User, group: 'Accueil & Hôtellerie' },
      // Sécurité
      { id: 'securite', label: 'Sécurité / Videur', icon: Shield, group: 'Sécurité' },
      // Animation
      { id: 'dj', label: 'DJ', icon: Music, group: 'Animation' },
      // Entretien
      { id: 'aide_menagere', label: 'Agent d\'entretien', icon: SprayCan, group: 'Entretien' },
    ]
  },
  {
    id: 'TECHNICIENS',
    label: 'Techniciens',
    description: 'Maintenance et équipements',
    icon: Wrench,
    color: 'from-orange-500 to-red-500',
    subCategories: [
      // Froid & Climatisation
      { id: 'tech_froid', label: 'Technicien Froid', icon: Snowflake, group: 'Froid & Climatisation' },
      { id: 'tech_ventilation', label: 'Technicien Ventilation / CVC', icon: Wrench, group: 'Froid & Climatisation' },
      // Cuisson & Chaud
      { id: 'tech_chaud', label: 'Technicien Chaud', icon: Flame, group: 'Cuisson & Chaud' },
      // Équipement cuisine
      { id: 'tech_lave_vaisselle', label: 'Technicien Lave-vaisselle', icon: Utensils, group: 'Équipement cuisine' },
      { id: 'tech_cafe', label: 'Technicien Machine à Café', icon: Coffee, group: 'Équipement cuisine' },
      { id: 'tech_biere', label: 'Technicien Pompe à Bière', icon: Beer, group: 'Équipement cuisine' },
      // Électricité & Plomberie
      { id: 'electricien', label: 'Électricien', icon: Zap, group: 'Électricité & Plomberie' },
      { id: 'plombier', label: 'Plombier', icon: Wrench, group: 'Électricité & Plomberie' },
      // Caisse & IT
      { id: 'tech_pos', label: 'Technicien Caisse / POS', icon: Monitor, group: 'Caisse & IT' },
      { id: 'tech_reseau', label: 'Technicien Réseau / WiFi', icon: Wifi, group: 'Caisse & IT' },
      // Événementiel / AV
      { id: 'ingenieur_son', label: 'Ingénieur Son', icon: Mic, group: 'Événementiel / AV' },
      { id: 'ingenieur_lumiere', label: 'Ingénieur Lumière', icon: Lightbulb, group: 'Événementiel / AV' },
      { id: 'tech_video', label: 'Technicien Vidéo', icon: Video, group: 'Événementiel / AV' },
    ]
  },
  {
    id: 'BATIMENTS',
    label: 'Bâtiments',
    description: 'Rénovation et construction',
    icon: Building2,
    color: 'from-emerald-500 to-teal-500',
    subCategories: [
      { id: 'architecte_interieur', label: 'Architecte d\'intérieur', icon: Ruler },
      { id: 'architecte', label: 'Architecte', icon: Ruler },
      { id: 'menuisier', label: 'Menuisier', icon: Hammer },
      { id: 'peintre', label: 'Peintre', icon: PaintBucket },
      { id: 'platrier', label: 'Plâtrier', icon: Hammer },
      { id: 'carreleur', label: 'Carreleur', icon: Hammer },
      { id: 'macon', label: 'Maçon', icon: Hammer },
      { id: 'installateur_clim', label: 'Installateur climatisation', icon: Thermometer },
      { id: 'installateur_vmc', label: 'Installateur VMC', icon: Wrench },
      { id: 'installateur_plomberie', label: 'Installateur plomberie', icon: Wrench },
      { id: 'installateur_electricite', label: 'Installateur électricité', icon: Zap },
      { id: 'decorateur', label: 'Décorateur', icon: PenTool },
      { id: 'paysagiste', label: 'Paysagiste', icon: Hammer },
      { id: 'menuisier_metal', label: 'Menuisier métallier', icon: Hammer },
    ]
  },
];

// ============================================================================
// EQUIPMENT CATEGORY ICONS
// ============================================================================

const EQUIPMENT_ICONS: Record<EquipmentCategory, React.ElementType> = {
  FRIDGE: Snowflake,
  FREEZER: Snowflake,
  COLD_ROOM: Building2,
  COFFEE_MACHINE: Coffee,
  OVEN: Flame,
  DISHWASHER: Utensils,
  ICE_MACHINE: Snowflake,
  BEER_TAP: Beer,
  VENTILATION: Wrench,
  COOKING: Flame,
  AUDIO: Mic,
  LIGHTING: Lightbulb,
  VIDEO: Video,
  POS: Monitor,
  NETWORK: Wifi,
  SCREEN: Monitor,
  OTHER: Wrench,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

import { useCalendarStore } from '@/store/calendarStore';

export function CreateMissionWizard({ isOpen, onClose, defaultCategory, defaultDate }: CreateMissionWizardProps) {
  const { currentEstablishment, establishments, setCurrentEstablishmentId, equipment } = useEstablishment();
  const { syncAddMission } = useMissionsStore();
  const { syncAddEvent } = useCalendarStore();
  const { reportFault } = useEquipmentStore();
  const isPremium = useStore((s) => s.isPremium);
  const { user, profile } = useAuth();

  // Portal mount guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Wizard State
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [step, setStep] = useState<WizardStep>(() => {
    if (defaultCategory) {
      const category = CATEGORIES.find(c => c.id === defaultCategory);
      if (category) return 'subcategory';
    }
    return 'category';
  });

  const [selectedCategory, setSelectedCategory] = useState<CategoryDef | null>(() => {
    if (defaultCategory) {
      return CATEGORIES.find(c => c.id === defaultCategory) || null;
    }
    return null;
  });

  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategoryDef | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<EquipmentProblem | null>(null);
  const [selectedStaffingRole, setSelectedStaffingRole] = useState<StaffingNeed | null>(null);
  const [description, setDescription] = useState('');
  
  // Media state (Photos & Videos)
  const [media, setMedia] = useState<{ type: 'image' | 'video' | 'audio', url: string, file?: File, annotations?: ImageAnnotation[] }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Annotation state
  const [annotatorOpen, setAnnotatorOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState<number | null>(null);

  // Capture state
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('PHOTO');
  
  // Add Media Modal state
  const [addMediaModalOpen, setAddMediaModalOpen] = useState(false);
  
  // Equipment Details Modal state
  const [showEquipmentDetails, setShowEquipmentDetails] = useState(false);

  const handleSeverityCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedProblem) return;
    const severities: EquipmentProblem['severity'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const currentIndex = severities.indexOf(selectedProblem.severity);
    const nextIndex = (currentIndex + 1) % severities.length;
    setSelectedProblem({ ...selectedProblem, severity: severities[nextIndex] });
  };

  const openCapture = (mode: CaptureMode) => {
    setCaptureMode(mode);
    setCaptureModalOpen(true);
    setAddMediaModalOpen(false); // Close the selection modal
  };

  const handleCapture = (file: File, type: 'image' | 'video' | 'audio') => {
    const newMedia = {
      type,
      url: URL.createObjectURL(file),
      file
    };
    setMedia(prev => [...prev, newMedia]);
  };

  // Computed selected document for DocumentViewer
  const selectedDocument = useMemo(() => {
    if (currentMediaIndex === null || !media[currentMediaIndex]) return null;
    const item = media[currentMediaIndex];
    
    // Create a temporary EquipmentDocument from the media item
    return {
      id: `media-${currentMediaIndex}`,
      name: item.file?.name || `Media ${currentMediaIndex + 1}`,
      url: item.url,
      type: 'OTHER', // Default type
      uploadedAt: new Date().toISOString(),
      annotations: item.annotations,
      file: item.file,
      mimeType: item.type === 'video' ? 'video/mp4' : item.type === 'audio' ? 'audio/mp3' : 'image/jpeg'
    } as EquipmentDocument;
  }, [currentMediaIndex, media]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPayingRelationFee, setIsPayingRelationFee] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Staffing specific state
  const [staffingDate, setStaffingDate] = useState(defaultDate || '');
  const [staffingTime, setStaffingTime] = useState('');
  const [staffingDuration, setStaffingDuration] = useState('4');
  const [staffingCount, setStaffingCount] = useState('1');

  // Service specific state (Tech/Design)
  const [servicePrice, setServicePrice] = useState('');
  
  // Event Context State
  const [eventType, setEventType] = useState('Autre');
  const [customEventType, setCustomEventType] = useState('');
  const [isCustomEventType, setIsCustomEventType] = useState(false);
  const [equipmentProvided, setEquipmentProvided] = useState(false);
  
  // Load saved event types from localStorage
  const [savedEventTypes, setSavedEventTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('chr_connect_custom_event_types');
      if (!saved) return [];
      const parsed: string[] = JSON.parse(saved);
      return parsed.filter(t => t.trim() !== '');
    } catch {
      return [];
    }
  });

  // Default event types
  const DEFAULT_EVENT_TYPES = [
    'Soirée / Event',
    'Concert / Live',
    'Conférence / Séminaire',
    'Mariage / Privé',
    'Installation Fixe'
  ];

  // Handle Event Type Change
  const handleEventTypeChange = (value: string) => {
    if (value === 'custom_new') {
      setIsCustomEventType(true);
      setEventType('');
    } else {
      setIsCustomEventType(false);
      setEventType(value);
    }
  };

  // Save custom event type
  const saveCustomEventType = () => {
    if (customEventType.trim()) {
      const newType = customEventType.trim();
      if (!savedEventTypes.includes(newType) && !DEFAULT_EVENT_TYPES.includes(newType)) {
        const newSaved = [...savedEventTypes, newType];
        setSavedEventTypes(newSaved);
        localStorage.setItem('chr_connect_custom_event_types', JSON.stringify(newSaved));
      }
      setEventType(newType);
      setIsCustomEventType(false);
      setCustomEventType('');
    }
  };

  // Handle File Upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newMedia = Array.from(files).map(file => {
      let type: 'image' | 'video' | 'audio' = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      
      return {
        type,
        url: URL.createObjectURL(file),
        file
      };
    });

    setMedia(prev => [...prev, ...newMedia]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Document Save (Annotations)
  const handleSaveDocument = (updatedDoc: EquipmentDocument) => {
    if (currentMediaIndex !== null && updatedDoc.annotations) {
      setMedia(prev => prev.map((item, idx) => 
        idx === currentMediaIndex 
          ? { ...item, annotations: updatedDoc.annotations } 
          : item
      ));
    }
  };

  // Handle Remove Media
  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Add Equipment Modal state
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [pendingEquipmentCategory, setPendingEquipmentCategory] = useState<EquipmentCategory | null>(null);

  // Filter equipment based on selected subcategory
  const filteredEquipment = useMemo(() => {
    if (!selectedSubCategory?.equipmentCategories) return [];

    return equipment.filter(eq => {
      // Filter by equipment category
      if (!selectedSubCategory.equipmentCategories!.includes(eq.category)) return false;

      // Filter by search query
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        const matchesBrand = eq.brand.toLowerCase().includes(search);
        const matchesModel = eq.model.toLowerCase().includes(search);
        const matchesNickname = eq.nickname?.toLowerCase().includes(search);
        const matchesLocation = eq.location.toLowerCase().includes(search);
        if (!matchesBrand && !matchesModel && !matchesNickname && !matchesLocation) return false;
      }

      return true;
    });
  }, [equipment, selectedSubCategory, searchQuery]);

  // Get problems for selected equipment
  const problems = useMemo(() => {
    if (!selectedEquipment) return [];
    return getProblemsForCategory(selectedEquipment.category);
  }, [selectedEquipment]);

  // Get staffing roles based on subcategory - Direct match via subcategoryId
  const staffingRoles = useMemo(() => {
    if (!selectedSubCategory || selectedCategory?.id !== 'PERSONNEL') return [];

    // Direct match: subcategoryId in STAFFING_NEEDS matches wizard's subCategory.id
    return STAFFING_NEEDS.filter(need => need.subcategoryId === selectedSubCategory.id);
  }, [selectedSubCategory, selectedCategory]);

  // Navigation handlers
  const handleCategorySelect = (category: CategoryDef) => {
    setSelectedCategory(category);
    setStep('subcategory');
  };

  const handleSubCategorySelect = (subCategory: SubCategoryDef) => {
    setSelectedSubCategory(subCategory);

    if (selectedCategory?.id === 'PERSONNEL') {
      // Auto-select role if there is a direct 1-to-1 mapping
      const roles = STAFFING_NEEDS.filter(need => need.subcategoryId === subCategory.id);
      if (roles.length === 1) {
         setSelectedStaffingRole(roles[0]);
         const avgRate = Math.round((roles[0].hourlyRate.min + roles[0].hourlyRate.max) / 2);
         setServicePrice(avgRate.toString());
      }
      
      // Staffing flow - go to staffing config
      setStep('staffing-config');
    } else if (selectedCategory?.id === 'TECHNICIENS') {
      // Tech flow - go directly to details (simplified)
      setStep('details');
    } else if (subCategory.equipmentCategories && subCategory.equipmentCategories.length > 0) {
      // Has equipment mapping - go to asset selection
      setStep('asset-selection');
    } else {
      // No equipment (DESIGN) - go directly to details
      setStep('details');
    }
  };

  const handleEquipmentSelect = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setStep('problem-selection');
  };

  const handleProblemSelect = (problem: EquipmentProblem) => {
    setSelectedProblem(problem);
    setStep('details');
  };

  const handleStaffingRoleSelect = (role: StaffingNeed) => {
    setSelectedStaffingRole(role);
    const avgRate = Math.round((role.hourlyRate.min + role.hourlyRate.max) / 2);
    setServicePrice(avgRate.toString());
  };

  // Handler when a new equipment is added from the modal
  const handleEquipmentAdded = (newEquipment: Equipment) => {
    // Select the newly created equipment and continue to problem selection
    setSelectedEquipment(newEquipment);
    setShowAddEquipmentModal(false);
    setPendingEquipmentCategory(null);
    setStep('problem-selection');
  };

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      if (defaultDate) {
        setStaffingDate(defaultDate);
      }
      
      if (defaultCategory) {
        const category = CATEGORIES.find(c => c.id === defaultCategory);
        if (category) {
          setSelectedCategory(category);
          setStep('subcategory');
        } else {
           setSelectedCategory(null);
           setStep('category');
        }
      } else {
        setSelectedCategory(null);
        setStep('category');
      }

      setSelectedSubCategory(null);
      setSelectedEquipment(null);
      setSelectedProblem(null);
      setSelectedStaffingRole(null);
      setDescription('');
      setMedia([]);
      setServicePrice('');
      setEventType('Autre');
      setIsCustomEventType(false);
      setCustomEventType('');
      setEquipmentProvided(false);
      setStaffingDuration('4');
      setStaffingCount('1');
      setStaffingTime('');
      // If defaultDate is not provided, clear staffingDate? 
      // Better to keep it if defaultDate is provided, otherwise clear.
      if (!defaultDate) setStaffingDate('');
    }
  }, [isOpen, defaultCategory, defaultDate]);

  const handleBack = () => {
    switch (step) {
      case 'subcategory':
        if (defaultCategory) {
          onClose();
        } else {
          setStep('category');
          setSelectedCategory(null);
        }
        break;
      case 'mission-type-selection':
        setStep('subcategory');
        setSelectedSubCategory(null);
        break;
      case 'asset-selection':
        if (selectedCategory?.id === 'TECHNICIENS') {
          setStep('mission-type-selection');
        } else {
          setStep('subcategory');
          setSelectedSubCategory(null);
        }
        setSearchQuery('');
        break;
      case 'problem-selection':
        setStep('asset-selection');
        setSelectedEquipment(null);
        break;
      case 'details':
        if (selectedEquipment) {
          setStep('problem-selection');
          setSelectedProblem(null);
        } else {
          setStep('subcategory');
          setSelectedSubCategory(null);
        }
        break;
      case 'staffing-config':
        setStep('subcategory');
        setSelectedSubCategory(null);
        setSelectedStaffingRole(null);
        break;
      case 'summary':
        if (selectedCategory?.id === 'PERSONNEL') {
          setStep('staffing-config');
        } else if (selectedCategory?.id === 'TECHNICIENS') {
          setStep('details');
        } else {
          setStep('details');
        }
        break;
      case 'payment':
        setStep('summary');
        break;
    }
  };

  const handleContinueToSummary = () => {
    setStep('summary');
  };

  const handleSubmit = async () => {
    // Avant : if (!currentEstablishment) return;  -> click silencieux si venue
    // pas encore chargé depuis Supabase. On affiche l'erreur à l'utilisateur.
    if (!currentEstablishment) {
      setSubmitError('Aucun établissement sélectionné. Retournez à l\'écran précédent et sélectionnez un établissement.');
      return;
    }
    const patronId = profile?.id || user?.id;
    if (!patronId) {
      setSubmitError('Session expirée. Reconnectez-vous pour publier la mission.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    
    // Prepare photos/media
    const photos = media.map(m => m.url);
    const mediaData = media; // Store full media with annotations

    try {
      // Create mission based on type
      const missionId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `mission_${Date.now()}`;
      let createdMission: any = null;

      if (selectedCategory?.id === 'PERSONNEL' && selectedStaffingRole) {
        // Staffing mission
        // Use user-defined servicePrice if available, otherwise fallback to average
        const rate = servicePrice ? parseFloat(servicePrice) : (selectedStaffingRole.hourlyRate.min + selectedStaffingRole.hourlyRate.max) / 2;
        
        createdMission = {
          id: missionId,
          patronId,
          title: `${selectedStaffingRole.role} - ${staffingCount} personne(s)`,
          venue: currentEstablishment.name,
          venueId: currentEstablishment.id,
          type: 'staff' as const,
          price: `${(parseFloat(staffingDuration) * rate * parseInt(staffingCount)).toFixed(0)}€ est.`,
          urgent: selectedStaffingRole.urgency === 'emergency',
          description: description || `Besoin de ${staffingCount} ${selectedStaffingRole.role.toLowerCase()} pour ${staffingDuration}h`,
          status: 'SEARCHING' as const,
          location: { lat: 48.8566, lng: 2.3522 },
          category: 'STAFFING' as const,
          date: new Date().toISOString(),
        };

        await syncAddMission(createdMission);
      } else if (selectedEquipment && selectedProblem) {
        // Equipment mission
        reportFault(selectedEquipment.id, selectedProblem.id, description || selectedProblem.label);

        const missionDate = new Date().toISOString();

        createdMission = {
          id: missionId,
          patronId,
          title: `${selectedProblem.label} - ${selectedEquipment.brand} ${selectedEquipment.model}`,
          venue: currentEstablishment.name,
          venueId: currentEstablishment.id,
          type: selectedSubCategory?.id as any || 'cold',
          price: `${selectedProblem.priceRange.min}€ - ${selectedProblem.priceRange.max}€`,
          urgent: selectedProblem.severity === 'CRITICAL' || selectedProblem.severity === 'HIGH',
          description: description || selectedProblem.description,
          status: 'SEARCHING' as const,
          location: { lat: 48.8566, lng: 2.3522 },
          photos,
          mediaData,
          skills: selectedProblem.requiredSkills,
          equipmentId: selectedEquipment.id,
          attributes: {
            equipment: [selectedEquipment.category.toLowerCase()],
            machineType: selectedEquipment.model,
          },
          date: missionDate,
        };

        await syncAddMission(createdMission);
      } else {
        // Generic mission (TECH, DESIGN)
        let price = 'Sur devis';
        let date: string | undefined = undefined;

        // Handle Tech Service specific fields
        if (selectedCategory?.id === 'TECHNICIENS' && !selectedEquipment) {
          if (servicePrice) {
            if (staffingDuration && parseFloat(staffingDuration) > 0) {
              const total = parseInt(servicePrice) * parseFloat(staffingDuration);
              price = `${total}€ est. (${servicePrice}€/h)`;
            } else {
              price = `${servicePrice}€`;
            }
          }
        }
        date = new Date().toISOString();

        createdMission = {
          id: missionId,
          patronId,
          title: `${selectedSubCategory?.label || 'Mission'} - ${currentEstablishment.name}`,
          venue: currentEstablishment.name,
          venueId: currentEstablishment.id,
          type: selectedSubCategory?.id as any || 'other',
          price,
          urgent: false,
          description,
          status: 'SEARCHING' as const,
          location: { lat: 48.8566, lng: 2.3522 },
          category: selectedCategory?.id as any,
          date,
          photos,
          mediaData,
        };

        await syncAddMission(createdMission);
      }

      // Add relation fee info
      if (createdMission) {
        if (isPremium) {
          createdMission.paidRelationFee = false;
          createdMission.relationFeeAmount = 0;
        } else {
          createdMission.paidRelationFee = true;
          createdMission.relationFeeAmount = 20;
        }
      }

      // Add to Calendar
      if (createdMission) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 5);

        let eventType: any = 'OTHER';
        if (selectedCategory?.id === 'PERSONNEL') eventType = 'STAFFING';
        else if (selectedCategory?.id === 'MAINTENANCE') eventType = 'MAINTENANCE';
        else if (selectedCategory?.id === 'TECHNICIENS') eventType = 'EVENT';

        syncAddEvent({
          title: createdMission.title,
          date: dateStr,
          time: timeStr,
          type: eventType,
          description: createdMission.description,
          venueId: currentEstablishment.id,
          location: currentEstablishment.name,
          missionId: createdMission.id,
        });
      }

      setStep('success');
    } catch (error: any) {
      console.error('Failed to create mission:', error);
      setSubmitError(error?.message || 'La création de la mission a échoué. Réessayez ou contactez le support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate progress
  const getProgressInfo = () => {
    let steps: WizardStep[] = [];

    if (selectedCategory?.id === 'PERSONNEL') {
      steps = ['category', 'subcategory', 'staffing-config', 'summary'];
    } else if (selectedCategory?.id === 'TECHNICIENS') {
      steps = ['category', 'subcategory', 'details', 'summary'];
    } else if (selectedSubCategory?.equipmentCategories) {
      steps = ['category', 'subcategory', 'asset-selection', 'problem-selection', 'details', 'summary'];
    } else {
      steps = ['category', 'subcategory', 'details', 'summary'];
    }

    // Include payment step for free users
    if (!isPremium) {
      steps = [...steps, 'payment'];
    }

    if (defaultCategory) {
      steps = steps.filter(s => s !== 'category');
    }

    const currentIndex = steps.indexOf(step);
    const safeIndex = Math.max(0, currentIndex);
    return {
      progress: safeIndex / (steps.length - 1),
      currentStep: safeIndex + 1,
      totalSteps: steps.length,
    };
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-[var(--bg-app)] flex flex-col"
    >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {step !== 'category' && step !== 'success' && (
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-[var(--text-primary)]">
                {step === 'category' && 'Nouvelle Demande'}
                {step === 'subcategory' && selectedCategory?.label}
                {step === 'asset-selection' && 'Sélectionnez l\'équipement'}
                {step === 'problem-selection' && 'Quel est le problème ?'}
                {step === 'details' && (selectedCategory?.id === 'TECHNICIENS' && !selectedEquipment ? 'Votre demande' : 'Détails supplémentaires')}
                {step === 'staffing-config' && 'Configuration du staffing'}
                {step === 'summary' && 'Récapitulatif'}
                {step === 'payment' && 'Paiement'}
                {step === 'success' && 'Demande envoyée !'}
              </h1>
              {currentEstablishment && step !== 'success' && (
                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {currentEstablishment.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        {step !== 'success' && (() => {
          const { progress, currentStep, totalSteps } = getProgressInfo();
          const gradientColor = selectedCategory?.id === 'TECHNICIENS'
            ? 'from-orange-500 to-red-500'
            : selectedCategory?.id === 'PERSONNEL'
              ? 'from-purple-500 to-pink-500'
              : 'from-blue-500 to-purple-500';
          return (
            <div className="px-4 pt-4">
              <div className="h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${gradientColor} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-xs text-[var(--text-muted)] text-right mt-1.5">
                {`\u00C9tape ${currentStep} sur ${totalSteps}`}
              </p>
            </div>
          );
        })()}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {/* STEP: Category Selection */}
            {step === 'category' && (
              <motion.div
                key="category"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isComingSoon = COMING_SOON_CATEGORIES.includes(cat.id as any);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => !isComingSoon && handleCategorySelect(cat)}
                      className={cn(
                        "relative flex items-start gap-4 p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] transition-all group text-left",
                        isComingSoon ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--bg-active)] hover:border-[var(--border-strong)]"
                      )}
                    >
                      {isComingSoon && (
                        <span className="absolute top-2 right-2 text-[9px] md:text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full z-10">
                          Bientôt disponible
                        </span>
                      )}
                      <div className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br',
                        cat.color
                      )}>
                        <Icon className="w-7 h-7 text-[var(--text-primary)]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{cat.label}</h3>
                        <p className="text-sm text-[var(--text-muted)]">{cat.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors self-center" />
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* STEP: SubCategory Selection */}
            {step === 'subcategory' && selectedCategory && (() => {
              // Group subcategories by group field
              const hasGroups = selectedCategory.subCategories.some(s => s.group);
              if (hasGroups) {
                const groups: { name: string; items: SubCategoryDef[] }[] = [];
                selectedCategory.subCategories.forEach((sub) => {
                  const groupName = sub.group || 'Autre';
                  const existing = groups.find(g => g.name === groupName);
                  if (existing) existing.items.push(sub);
                  else groups.push({ name: groupName, items: [sub] });
                });
                return (
                  <motion.div
                    key="subcategory"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {groups.map((group, gi) => {
                      const gradient = GROUP_COLORS[group.name];
                      return (
                      <div key={group.name}>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 px-1">{group.name}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {group.items.map((sub) => {
                            const Icon = sub.icon;
                            return gradient ? (
                              <button
                                key={sub.id}
                                onClick={() => handleSubCategorySelect(sub)}
                                className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-br ${gradient} text-left overflow-hidden active:opacity-80 transition-opacity`}
                              >
                                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-sm font-medium text-white leading-tight">{sub.label}</span>
                              </button>
                            ) : (
                              <button
                                key={sub.id}
                                onClick={() => handleSubCategorySelect(sub)}
                                className="flex items-center gap-3 p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-active)] hover:border-[var(--border-strong)] overflow-hidden transition-colors text-left"
                              >
                                <div className="w-9 h-9 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center shrink-0">
                                  <Icon className="w-5 h-5 text-[var(--text-primary)]" />
                                </div>
                                <span className="text-sm font-medium text-[var(--text-primary)] leading-tight">{sub.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      );
                    })}
                  </motion.div>
                );
              }
              // Fallback: flat grid for categories without groups
              return (
                <motion.div
                  key="subcategory"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-2 md:grid-cols-3 gap-3"
                >
                  {selectedCategory.subCategories.map((sub) => {
                    const Icon = sub.icon;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubCategorySelect(sub)}
                        className="flex flex-col items-center justify-center gap-3 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-active)] hover:border-[var(--border-strong)] transition-all h-32"
                      >
                        <Icon className="w-8 h-8 text-[var(--text-primary)]" />
                        <span className="text-sm font-medium text-[var(--text-primary)] text-center">{sub.label}</span>
                      </button>
                    );
                  })}
                </motion.div>
              );
            })()}

            {/* STEP: Mission Type Selection (Tech only) */}
            {step === 'mission-type-selection' && (
              <motion.div
                key="mission-type-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <button
                  onClick={() => setStep('asset-selection')}
                  className="flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-active)] hover:border-blue-500/50 transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wrench className="w-8 h-8 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Intervention sur Équipement</h3>
                    <p className="text-[var(--text-muted)]">
                      Réparation, installation ou maintenance sur un équipement spécifique de votre inventaire.
                    </p>
                  </div>
                  <div className="mt-4 px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Sélection d'inventaire
                  </div>
                </button>

                <button
                  onClick={() => setStep('details')}
                  className="flex flex-col items-center text-center gap-4 p-8 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-active)] hover:border-purple-500/50 transition-all group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Prestation de Service</h3>
                    <p className="text-[var(--text-muted)]">
                      Demande de prestation sans équipement spécifique (DJ, Ingénieur son, Régisseur, etc.).
                    </p>
                  </div>
                  <div className="mt-4 px-4 py-2 rounded-full bg-purple-500/10 text-purple-400 text-sm font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Détails personnalisés
                  </div>
                </button>
              </motion.div>
            )}

            {/* STEP: Asset Selection */}
            {step === 'asset-selection' && (
              <motion.div
                key="asset-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Rechercher un équipement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Equipment Grid */}
                {filteredEquipment.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] flex items-center justify-center mx-auto mb-4">
                      <Wrench className="w-8 h-8 text-[var(--text-muted)]" />
                    </div>
                    <h3 className="text-[var(--text-primary)] font-medium mb-2">
                      Aucun équipement trouvé
                    </h3>
                    <p className="text-[var(--text-muted)] text-sm mb-4">
                      Aucun équipement de cette catégorie dans votre garage
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredEquipment.map((eq) => {
                      const Icon = EQUIPMENT_ICONS[eq.category];
                      return (
                        <button
                          key={eq.id}
                          onClick={() => handleEquipmentSelect(eq)}
                          className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-active)] hover:border-blue-500/30 transition-all text-left group"
                        >
                          {eq.photos.length > 0 ? (
                            <img
                              src={eq.photos[0].url}
                              alt={eq.brand}
                              className="w-16 h-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-[var(--bg-active)] flex items-center justify-center">
                              <Icon className="w-8 h-8 text-[var(--text-muted)]" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] font-medium truncate">
                              {eq.nickname || `${eq.brand} ${eq.model}`}
                            </p>
                            <p className="text-[var(--text-muted)] text-sm truncate">
                              {eq.brand} {eq.model}
                            </p>
                            <p className="text-[var(--text-muted)] text-xs flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {eq.location}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fallback Option - Open Add Equipment Modal */}
                <button
                  onClick={() => {
                    // Get the first equipment category for this subcategory
                    const defaultCat = selectedSubCategory?.equipmentCategories?.[0] || null;
                    setPendingEquipmentCategory(defaultCat);
                    setShowAddEquipmentModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-green-500/30 hover:border-green-500/50 bg-green-500/5 hover:bg-green-500/10 transition-colors text-green-400 hover:text-green-300"
                >
                  <Plus className="w-5 h-5" />
                  <span>Ajouter un nouvel équipement au garage</span>
                </button>
              </motion.div>
            )}

            {/* STEP: Problem Selection */}
            {step === 'problem-selection' && selectedEquipment && (
              <motion.div
                key="problem-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Selected Equipment Summary */}
                <div className="bg-[var(--bg-card)] rounded-xl p-4 flex items-center gap-4 border border-[var(--border)]">
                  {selectedEquipment.photos.length > 0 ? (
                    <img
                      src={selectedEquipment.photos[0].url}
                      alt={selectedEquipment.brand}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[var(--bg-active)] flex items-center justify-center">
                      <Wrench className="w-7 h-7 text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div>
                    <p className="text-[var(--text-primary)] font-medium">
                      {selectedEquipment.nickname || `${selectedEquipment.brand} ${selectedEquipment.model}`}
                    </p>
                    <p className="text-[var(--text-muted)] text-sm">{selectedEquipment.location}</p>
                  </div>
                </div>

                {/* Problems Grid */}
                <div className="space-y-3">
                  {problems.map((problem) => {
                    const severityConfig = SEVERITY_CONFIG[problem.severity];
                    const isSelected = selectedProblem?.id === problem.id;

                    return (
                      <button
                        key={problem.id}
                        onClick={() => handleProblemSelect(problem)}
                        className={cn(
                          'w-full p-4 rounded-xl border text-left transition-all',
                          isSelected
                            ? `${severityConfig.bgColor} ${severityConfig.borderColor}`
                            : 'bg-[var(--bg-card)] border-[var(--border)] hover:bg-[var(--bg-active)]'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                              severityConfig.bgColor
                            )}>
                              <AlertTriangle className={cn('w-5 h-5', severityConfig.color)} />
                            </div>
                            <div>
                              <p className="text-[var(--text-primary)] font-medium">
                                {problem.id === 'other' ? 'Autre problème' : problem.label}
                              </p>
                              {problem.description && (
                                <p className="text-[var(--text-muted)] text-sm mt-0.5">{problem.description}</p>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className={cn(
                                  'text-xs px-2 py-0.5 rounded-full border',
                                  severityConfig.bgColor,
                                  severityConfig.color,
                                  severityConfig.borderColor
                                )}>
                                  {severityConfig.label}
                                </span>
                                <span className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {problem.estimatedResponseTime}
                                </span>
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className={cn('w-5 h-5 flex-shrink-0', severityConfig.color)} />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP: Details */}
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Problem Summary (if selected) */}
                {selectedProblem && (
                  <div className={cn(
                    'rounded-xl p-4 border',
                    SEVERITY_CONFIG[selectedProblem.severity].bgColor,
                    SEVERITY_CONFIG[selectedProblem.severity].borderColor
                  )}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={cn('w-6 h-6', SEVERITY_CONFIG[selectedProblem.severity].color)} />
                      <div>
                        <p className="text-[var(--text-primary)] font-medium">{selectedProblem.label}</p>
                        <p className="text-[var(--text-muted)] text-sm">
                          {selectedProblem.id === 'other' 
                            ? selectedProblem.estimatedResponseTime
                            : `Intervention estimée: ${selectedProblem.estimatedResponseTime}`
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Service Mission Details (Tech) — simplified like Personnel */}
                {selectedCategory?.id === 'TECHNICIENS' && !selectedEquipment && (
                  <>
                    {/* Selected subcategory summary card */}
                    {selectedSubCategory && (
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-orange-500/20 border border-orange-500/50">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                          {(() => { const Icon = selectedSubCategory.icon; return <Icon className="w-6 h-6 text-white" />; })()}
                        </div>
                        <div className="flex-1">
                          <p className="text-[var(--text-primary)] font-medium">{selectedSubCategory.label}</p>
                          <p className="text-[var(--text-muted)] text-sm">Intervention technique</p>
                        </div>
                        <Check className="w-5 h-5 text-orange-400" />
                      </div>
                    )}

                    {/* Establishment selector */}
                    <div className="space-y-2">
                      <label className="block text-[var(--text-primary)] font-medium">Établissement concerné</label>
                      <div className="relative">
                        <button
                          onClick={() => setShowVenueDropdown(!showVenueDropdown)}
                          className="w-full flex items-center gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-left hover:border-orange-500/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] font-medium truncate">{currentEstablishment?.name || 'Sélectionner'}</p>
                            {currentEstablishment?.address && (
                              <p className="text-[var(--text-muted)] text-xs truncate">{currentEstablishment.address}</p>
                            )}
                          </div>
                          {establishments.length > 1 && (
                            <ChevronDown className={cn("w-5 h-5 text-[var(--text-muted)] transition-transform", showVenueDropdown && "rotate-180")} />
                          )}
                        </button>
                        {showVenueDropdown && establishments.length > 1 && (
                          <>
                            <div className="fixed inset-0 z-[10]" onClick={() => setShowVenueDropdown(false)} />
                            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl shadow-2xl z-[11] overflow-hidden max-h-48 overflow-y-auto">
                              {establishments.map((venue) => (
                                <button
                                  key={venue.id}
                                  onClick={() => {
                                    setCurrentEstablishmentId(venue.id);
                                    setShowVenueDropdown(false);
                                  }}
                                  className={cn(
                                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                                    venue.id === currentEstablishment?.id
                                      ? 'bg-orange-500/10 text-[var(--text-primary)]'
                                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                                  )}
                                >
                                  <Building2 className="w-4 h-4 flex-shrink-0" />
                                  <span className="text-sm font-medium truncate">{venue.name}</span>
                                  {venue.id === currentEstablishment?.id && (
                                    <Check className="w-4 h-4 text-orange-500 ml-auto flex-shrink-0" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Problem Description — the main input */}
                    <div className="space-y-3">
                      <label className="block text-[var(--text-primary)] font-medium">
                        Décrivez votre problème <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={
                          selectedSubCategory?.id === 'plombier' ? "Ex: J'ai une fuite d'eau sous l'évier de la cuisine, je ne sais pas d'où ça vient..." :
                          selectedSubCategory?.id === 'electricien' ? "Ex: Plusieurs prises ne fonctionnent plus dans la salle, les plombs sautent..." :
                          selectedSubCategory?.id === 'tech_froid' ? "Ex: La chambre froide ne descend plus en température depuis ce matin..." :
                          selectedSubCategory?.id === 'tech_chaud' ? "Ex: Le four ne chauffe plus correctement, la résistance semble HS..." :
                          selectedSubCategory?.id === 'tech_cafe' ? "Ex: La machine à café fait un bruit anormal et ne produit plus de vapeur..." :
                          selectedSubCategory?.id === 'tech_lave_vaisselle' ? "Ex: Le lave-vaisselle ne vidange plus, l'eau stagne au fond..." :
                          selectedSubCategory?.id === 'tech_biere' ? "Ex: La pression de la tireuse est trop faible, la bière mousse beaucoup..." :
                          "Décrivez votre problème le plus précisément possible..."
                        }
                        rows={4}
                        className="w-full p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-orange-500/50"
                      />
                    </div>

                  </>
                )}

                {/* Media Upload (Photos & Videos) */}
                <div className="relative z-0">
                  <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">Photos, Vidéos et Audios de l'espace / scène (Optionnel)</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="image/*,video/*,audio/*"
                    onChange={handleFileUpload}
                  />
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {/* Unified Add Button */}
                    <button 
                      onClick={() => {
                        setAddMediaModalOpen(true);
                      }}
                      className="flex-shrink-0 w-24 h-24 rounded-xl border border-dashed border-[var(--border-strong)] hover:border-[var(--border-strong)] bg-[var(--bg-card)] hover:bg-[var(--bg-active)] flex flex-col items-center justify-center gap-2 transition-all group"
                      title="Ajouter un média"
                    >
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-active)] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-4 h-4 text-[var(--text-muted)]" />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] group-hover:text-[var(--text-muted)]">Ajouter</span>
                    </button>
                    {/* Media Preview List */}
                    {media.map((item, idx) => (
                      <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-[var(--border)] group bg-[var(--bg-sidebar)]">
                        {/* Media type-specific previews */}
                        {item.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-[var(--bg-sidebar)]">
                            <Video className="w-8 h-8 text-[var(--text-muted)]" />
                          </div>
                        ) : item.type === 'audio' ? (
                          <div className="w-full h-full flex items-center justify-center bg-[var(--bg-sidebar)]">
                            <Mic className="w-8 h-8 text-[var(--text-muted)]" />
                          </div>
                        ) : (
                          <img 
                            src={item.url} 
                            alt={`Media ${idx + 1}`}
                            className="w-full h-full object-cover" 
                          />
                        )}
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button 
                            onClick={() => {
                              setCurrentMediaIndex(idx);
                              setAnnotatorOpen(true);
                            }}
                            className="p-1.5 bg-[var(--bg-active)] hover:bg-[var(--bg-elevated)] rounded-lg text-[var(--text-primary)] transition-colors"
                            title={item.type === 'video' ? "Voir" : item.type === 'audio' ? "Écouter" : "Voir et Annoter"}
                          >
                            {item.type === 'audio' ? <Mic className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={() => removeMedia(idx)}
                            className="p-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Formats acceptés : JPG, PNG, MP4, MP3, WAV, M4A. Max 50Mo.
                  </p>
                </div>

                {/* Description (only for equipment-based flow, Tech service has its own) */}
                {!(selectedCategory?.id === 'TECHNICIENS' && !selectedEquipment) && (
                <div>
                  <label className="block text-[var(--text-primary)] font-medium mb-2">
                    Description {(!selectedProblem || selectedProblem.id === 'other') && <span className="text-red-400">*</span>}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={
                      !selectedProblem
                        ? "Décrivez votre besoin en détail..."
                        : selectedProblem.id === 'other'
                          ? "Veuillez décrire le problème rencontré..."
                          : "Ajoutez des détails supplémentaires (optionnel)..."
                    }
                    rows={4}
                    className="w-full p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                )}

                {/* Price Estimate */}
                {selectedProblem && (
                  <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Estimation</span>
                      <span className="text-[var(--text-primary)] font-semibold text-lg">
                        {selectedProblem.priceRange.min}€ - {selectedProblem.priceRange.max}€
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP: Staffing Config */}
            {step === 'staffing-config' && (
              <motion.div
                key="staffing-config"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Establishment selector */}
                <div className="space-y-2">
                  <label className="block text-[var(--text-primary)] font-medium">Établissement concerné</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowVenueDropdown(!showVenueDropdown)}
                      className="w-full flex items-center gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-left hover:border-purple-500/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-primary)] font-medium truncate">{currentEstablishment?.name || 'Sélectionner'}</p>
                        {currentEstablishment?.address && (
                          <p className="text-[var(--text-muted)] text-xs truncate">{currentEstablishment.address}</p>
                        )}
                      </div>
                      {establishments.length > 1 && (
                        <ChevronDown className={cn("w-5 h-5 text-[var(--text-muted)] transition-transform", showVenueDropdown && "rotate-180")} />
                      )}
                    </button>
                    {showVenueDropdown && establishments.length > 1 && (
                      <>
                        <div className="fixed inset-0 z-[10]" onClick={() => setShowVenueDropdown(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl shadow-2xl z-[11] overflow-hidden max-h-48 overflow-y-auto">
                          {establishments.map((venue) => (
                            <button
                              key={venue.id}
                              onClick={() => {
                                setCurrentEstablishmentId(venue.id);
                                setShowVenueDropdown(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                                venue.id === currentEstablishment?.id
                                  ? 'bg-purple-500/10 text-[var(--text-primary)]'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                              )}
                            >
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{venue.name}</span>
                              {venue.id === currentEstablishment?.id && (
                                <Check className="w-4 h-4 text-purple-500 ml-auto flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-[var(--text-primary)] font-medium mb-3">
                    Type de poste
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {(staffingRoles.length > 0 ? staffingRoles : STAFFING_NEEDS.slice(0, 4)).map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleStaffingRoleSelect(role)}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                          selectedStaffingRole?.id === role.id
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-[var(--bg-card)] border-[var(--border)] hover:bg-[var(--bg-active)]'
                        )}
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Users className="w-6 h-6 text-[var(--text-primary)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[var(--text-primary)] font-medium">{role.role}</p>
                          <p className="text-[var(--text-muted)] text-sm">{role.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[var(--text-primary)] font-semibold">{role.hourlyRate.min}-{role.hourlyRate.max}€/h</p>
                        </div>
                        {selectedStaffingRole?.id === role.id && (
                          <Check className="w-5 h-5 text-purple-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DETAILS FORM */}
                <div className="space-y-6 bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
                    <h3 className="text-[var(--text-primary)] font-medium flex items-center gap-2 border-b border-[var(--border)] pb-3">
                      <Clock className="w-5 h-5 text-purple-400" />
                      Détails de la prestation
                    </h3>

                    {/* Duration, People & Rate */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Duration & People Column */}
                      <div className="space-y-6">
                        {/* Duration */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <label className="text-[var(--text-secondary)] text-sm font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-400" />
                                Durée estimée
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0.5"
                                  step="0.5"
                                  value={staffingDuration}
                                  onChange={(e) => setStaffingDuration(e.target.value)}
                                  className="w-16 p-1 text-right bg-transparent border-b border-[var(--border-strong)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-blue-500"
                                />
                                <span className="text-sm font-normal text-[var(--text-muted)]">h</span>
                              </div>
                            </div>
                            <div className="relative pt-1">
                              <input
                                type="range"
                                min="1"
                                max="12"
                                step="0.5"
                                value={staffingDuration}
                                onChange={(e) => setStaffingDuration(e.target.value)}
                                className="w-full h-2 bg-[var(--bg-active)] rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                              />
                              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-2 font-medium uppercase tracking-wider">
                                <span>1h</span>
                                <span>4h</span>
                                <span>8h</span>
                                <span>12h</span>
                              </div>
                            </div>
                        </div>

                        {/* Number of People */}
                        <div>
                           <label className="text-[var(--text-secondary)] text-sm font-medium flex items-center gap-2 mb-2">
                              <Users className="w-4 h-4 text-green-400" />
                              Nombre de personnes
                           </label>
                           <div className="relative">
                              <select
                                value={staffingCount}
                                onChange={(e) => setStaffingCount(e.target.value)}
                                className="w-full p-3 bg-[var(--bg-active)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-green-500/50 appearance-none"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                  <option key={n} value={n} className="bg-[var(--bg-hover)]">{n} personne{n > 1 ? 's' : ''}</option>
                                ))}
                              </select>
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                 <ChevronRight className="w-4 h-4 text-[var(--text-muted)] rotate-90" />
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Hourly Rate */}
                      <div className="space-y-4">
                         <div className="flex justify-between items-end">
                          <label className="text-[var(--text-secondary)] text-sm font-medium flex items-center gap-2">
                            <Euro className="w-4 h-4 text-purple-400" />
                            Taux horaire
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={servicePrice || '0'}
                              onChange={(e) => setServicePrice(e.target.value)}
                              className="w-16 p-1 text-right bg-transparent border-b border-[var(--border-strong)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-purple-500"
                            />
                            <span className="text-sm font-normal text-[var(--text-muted)]">€/h</span>
                          </div>
                        </div>
                        <div className="relative pt-1">
                          <input
                            type="range"
                            min="15"
                            max="100"
                            step="1"
                            value={servicePrice || '0'}
                            onChange={(e) => setServicePrice(e.target.value)}
                            className="w-full h-2 bg-[var(--bg-active)] rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                          />
                          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-2 font-medium uppercase tracking-wider">
                            <span>15€</span>
                            <span>40€</span>
                            <span>70€</span>
                            <span>100€+</span>
                          </div>
                        </div>
                        {selectedStaffingRole && (
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                                Fourchette conseillée pour {selectedStaffingRole.role}: <span className="text-purple-400">{selectedStaffingRole.hourlyRate.min}-{selectedStaffingRole.hourlyRate.max}€/h</span>
                            </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Total Calculation Display */}
                    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-[var(--border)] flex items-center justify-between">
                      <div>
                        <span className="text-[var(--text-muted)] text-sm font-medium">Total estimé</span>
                        <p className="text-[var(--text-muted)] text-xs mt-1">
                          {staffingCount} pers. × {staffingDuration}h × {servicePrice || 0}€/h
                        </p>
                      </div>
                      <div className="text-right">
                         <span className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                            {(parseFloat(staffingCount) * parseFloat(staffingDuration || '0') * parseFloat(servicePrice || '0')).toFixed(0)}€
                         </span>
                      </div>
                    </div>
                    
                    {/* Mission Context Section */}
                    <div className="pt-4 border-t border-[var(--border)] space-y-6">
                       <h4 className="text-[var(--text-primary)] font-medium flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-400" />
                          Contexte de la mission
                       </h4>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                          {/* Event Type */}
                          <div>
                             <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">Type d'événement</label>
                             {!isCustomEventType ? (
                               <select 
                                  value={eventType}
                                  onChange={(e) => handleEventTypeChange(e.target.value)}
                                  className="w-full p-3 bg-[var(--bg-active)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50 appearance-none"
                               >
                                  <option className="bg-[var(--bg-hover)]" disabled value="">Sélectionner un type...</option>
                                  {DEFAULT_EVENT_TYPES.map(type => (
                                    <option key={type} className="bg-[var(--bg-hover)]" value={type}>{type}</option>
                                  ))}
                                  {savedEventTypes.length > 0 && (
                                    <optgroup label="Vos types personnalisés" className="bg-[var(--bg-hover)] text-[var(--text-muted)]">
                                      {savedEventTypes.map((type, i) => (
                                        <option key={`saved-${i}-${type}`} className="bg-[var(--bg-hover)] text-[var(--text-primary)]" value={type}>{type}</option>
                                      ))}
                                    </optgroup>
                                  )}
                                  <option className="bg-[var(--bg-hover)] font-medium text-blue-400" value="custom_new">+ Autre / Nouveau...</option>
                               </select>
                             ) : (
                               <div className="flex gap-2">
                                 <input
                                   type="text"
                                   value={customEventType}
                                   onChange={(e) => setCustomEventType(e.target.value)}
                                   placeholder="Ex: Festival, Vernissage..."
                                   autoFocus
                                   className="flex-1 p-3 bg-[var(--bg-active)] border border-blue-500/50 rounded-xl text-[var(--text-primary)] focus:outline-none"
                                   onKeyDown={(e) => {
                                     if (e.key === 'Enter') {
                                       e.preventDefault();
                                       saveCustomEventType();
                                     }
                                   }}
                                 />
                                 <button
                                   onClick={saveCustomEventType}
                                   disabled={!customEventType.trim()}
                                   className="px-4 bg-blue-500 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                                 >
                                   OK
                                 </button>
                                 <button
                                   onClick={() => setIsCustomEventType(false)}
                                   className="px-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors"
                                 >
                                   Annuler
                                 </button>
                               </div>
                             )}
                          </div>
                          
                          {/* Notes */}
                          <div>
                             <label className="block text-[var(--text-secondary)] text-sm font-medium mb-2">Notes</label>
                             <textarea
                               value={description}
                               onChange={(e) => setDescription(e.target.value)}
                               placeholder="Dress code, instructions..."
                               rows={1}
                               className="w-full p-3 bg-[var(--bg-active)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-purple-500/50 min-h-[50px]"
                             />
                          </div>
                       </div>
                    </div>
                </div>
              </motion.div>
            )}

            {/* STEP: Summary */}
            {step === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Mission Preview Card */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden relative group">
                  {/* Decorative Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5 opacity-50" />
                  
                  {/* Header Section */}
                  <div className="relative p-6 border-b border-[var(--border)]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        {/* Icon/Avatar */}
                        <div className={cn(
                          "w-16 h-16 rounded-2xl flex items-center justify-center border border-[var(--border)] shadow-lg flex-shrink-0",
                          selectedCategory?.id === 'PERSONNEL' 
                            ? "bg-gradient-to-br from-purple-500/20 to-pink-500/20" 
                            : "bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
                        )}>
                          {selectedCategory?.id === 'PERSONNEL' ? (
                            <Users className={cn("w-8 h-8", selectedCategory?.id === 'PERSONNEL' ? "text-purple-400" : "text-blue-400")} />
                          ) : (
                            <Wrench className="w-8 h-8 text-blue-400" />
                          )}
                        </div>

                        {/* Title & Category */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                              "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border",
                              selectedCategory?.id === 'PERSONNEL' 
                                ? "bg-purple-500/10 border-purple-500/20 text-purple-300" 
                                : "bg-blue-500/10 border-blue-500/20 text-blue-300"
                            )}>
                              {selectedCategory?.label || 'Mission'}
                            </span>
                            {selectedProblem && (
                              <button 
                                onClick={handleSeverityCycle}
                                className={cn(
                                  "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border hover:scale-105 transition-transform cursor-pointer",
                                  SEVERITY_CONFIG[selectedProblem.severity].color
                                )}
                                title="Cliquer pour changer la gravité"
                              >
                                {SEVERITY_CONFIG[selectedProblem.severity].label}
                              </button>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                            {selectedProblem 
                              ? selectedProblem.label 
                              : selectedStaffingRole 
                                ? selectedStaffingRole.role 
                                : selectedSubCategory?.label || "Mission personnalisée"}
                          </h3>
                          <p className="text-[var(--text-muted)] text-sm">
                            {selectedCategory?.id === 'PERSONNEL' 
                              ? "Renfort d'équipe" 
                              : selectedEquipment 
                                ? `Intervention sur ${selectedEquipment.brand} ${selectedEquipment.model}`
                                : "Service technique"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Section */}
                  <div className="relative p-6 space-y-6">
                    {/* Location & Equipment Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Location Card */}
                      <div className="h-full">
                        <ConnectedVenueCard
                          venueId={currentEstablishment?.id || ''}
                          compact
                          className="h-full min-h-[100px]"
                        />
                      </div>

                      {/* Equipment Card (if applicable) */}
                      {selectedEquipment && (
                        <button 
                          onClick={() => setShowEquipmentDetails(true)}
                          className="w-full h-full min-h-[100px] text-left p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:bg-[var(--bg-active)] hover:border-[var(--border-strong)] transition-all cursor-pointer group/card flex flex-col justify-center relative overflow-hidden"
                        >
                          <div className="flex gap-4 items-center relative z-10">
                            <div className="relative overflow-hidden bg-[var(--bg-active)] flex-shrink-0 w-12 h-12 rounded-lg border border-[var(--border)]">
                              {selectedEquipment.photos?.[0]?.url ? (
                                <img src={selectedEquipment.photos[0].url} alt={selectedEquipment.brand} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Monitor className="w-6 h-6 text-[var(--text-muted)]" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-[var(--text-primary)] truncate text-sm">{selectedEquipment.brand} {selectedEquipment.model}</h3>
                              <p className="text-[var(--text-muted)] text-xs truncate mb-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {selectedEquipment.location}
                              </p>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>

                    {/* Duration (Staffing OR Tech Service) */}
                    {(selectedCategory?.id === 'PERSONNEL' || (selectedCategory?.id === 'TECHNICIENS' && !selectedEquipment)) && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] flex items-center justify-center flex-shrink-0">
                            <Zap className="w-4 h-4 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-muted)] mb-0.5">Disponibilité</p>
                            <p className="text-[var(--text-primary)] font-medium">Maintenant</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--bg-card)] flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-muted)] mb-0.5">Durée</p>
                            <p className="text-[var(--text-primary)] font-medium">{staffingDuration}h</p>
                            {selectedCategory?.id === 'PERSONNEL' && (
                              <p className="text-[var(--text-muted)] text-sm">x{staffingCount} personne{parseInt(staffingCount) > 1 ? 's' : ''}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mission Context (Event Type, Equipment Provided) */}
                    {(eventType || equipmentProvided) && (selectedCategory?.id === 'TECHNICIENS' && !selectedEquipment) && (
                      <div className="flex flex-wrap gap-2">
                         {eventType && (
                           <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium flex items-center gap-1.5">
                             <Zap className="w-3 h-3" />
                             {isCustomEventType ? customEventType : eventType}
                           </span>
                         )}
                         <span className={cn(
                           "px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5",
                           equipmentProvided 
                             ? "bg-green-500/10 border-green-500/20 text-green-300"
                             : "bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]"
                         )}>
                           <Check className={cn("w-3 h-3", !equipmentProvided && "opacity-0")} />
                           {equipmentProvided ? "Matériel fourni" : "Matériel non fourni"}
                         </span>
                      </div>
                    )}

                    {/* Problem Description */}
                    {(description || selectedProblem) && (
                      <div className="p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)]">
                        <p className="text-sm font-medium text-[var(--text-muted)] mb-2">
                          {selectedCategory?.id === 'PERSONNEL' ? 'Instructions & Notes' : 'Description du problème'}
                        </p>
                        {selectedProblem && (
                          <div className="mb-2 pb-2 border-b border-[var(--border)]">
                            <span className="text-[var(--text-primary)] font-medium block">{selectedProblem.label}</span>
                          </div>
                        )}
                        {description ? (
                          <p className="text-[var(--text-secondary)] text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
                        ) : (
                          <p className="text-[var(--text-muted)] text-sm italic">Aucune note supplémentaire</p>
                        )}
                      </div>
                    )}

                    {/* Media Preview */}
                    {media.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-[var(--text-muted)] mb-3">Photos jointes</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {media.map((item, i) => (
                            <button 
                              key={i} 
                              onClick={() => {
                                setCurrentMediaIndex(i);
                                setAnnotatorOpen(true);
                              }}
                              className="relative w-20 h-20 rounded-lg overflow-hidden border border-[var(--border)] flex-shrink-0 hover:opacity-80 transition-opacity"
                            >
                              {item.type === 'image' ? (
                                <img src={item.url} alt={`Preuve ${i + 1}`} className="w-full h-full object-cover" />
                              ) : item.type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center bg-black/50">
                                  <Video className="w-6 h-6 text-[var(--text-muted)]" />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-black/50">
                                  <Mic className="w-6 h-6 text-[var(--text-muted)]" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Estimate (Subtle) */}
                    <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                           <ShieldCheck className="w-3 h-3 text-green-400" />
                         </div>
                         <span className="text-xs text-green-400 font-medium">Mission vérifiée</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-medium mb-0.5">Budget Estimé</p>
                        <p className="text-[var(--text-primary)] font-bold text-lg">
                           {selectedProblem
                            ? `${selectedProblem.priceRange.min}€ - ${selectedProblem.priceRange.max}€`
                            : selectedStaffingRole
                              ? `${(parseFloat(staffingDuration) * parseFloat(servicePrice || '0') * parseInt(staffingCount)).toFixed(0)}€`
                              : (selectedCategory?.id === 'TECHNICIENS' && !selectedEquipment && servicePrice)
                                ? `${(parseFloat(staffingDuration || '0') * parseFloat(servicePrice || '0')).toFixed(0)}€`
                                : 'Sur devis'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-xs text-[var(--text-muted)] max-w-xs mx-auto">
                  En publiant cette mission, elle sera visible par notre réseau de prestataires qualifiés.
                </p>
              </motion.div>
            )}

            {/* STEP: Payment (free users only) */}
            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Mission recap */}
                <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      selectedCategory?.id === 'PERSONNEL'
                        ? "bg-purple-500/20"
                        : "bg-blue-500/20"
                    )}>
                      {selectedCategory?.icon && <selectedCategory.icon className={cn("w-6 h-6", selectedCategory?.id === 'PERSONNEL' ? "text-purple-400" : "text-blue-400")} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">
                        {selectedProblem?.label || selectedStaffingRole?.role || selectedSubCategory?.label || 'Mission'}
                      </h3>
                      <p className="text-sm text-[var(--text-muted)]">{currentEstablishment?.name}</p>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--text-secondary)]">Frais de mise en relation</span>
                      <span className="text-lg font-bold text-[var(--text-primary)]">{APP_CONFIG.MISSION_FEE.toFixed(2).replace('.', ',')} €</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      Ce frais unique couvre la recherche et la mise en relation avec un prestataire qualifié pour cette mission.
                    </p>
                  </div>
                </div>

                {submitError && (
                  <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">
                    {submitError}
                  </div>
                )}

                {/* Pay button */}
                <button
                  onClick={async () => {
                    setIsPayingRelationFee(true);
                    // Simulate payment delay
                    await new Promise(r => setTimeout(r, 1500));
                    setIsPayingRelationFee(false);
                    await handleSubmit();
                  }}
                  disabled={isPayingRelationFee || isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isPayingRelationFee || isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-[var(--border-strong)] border-t-white rounded-full"
                      />
                      {isPayingRelationFee ? 'Paiement en cours...' : 'Publication...'}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Payer {APP_CONFIG.MISSION_FEE}€ et publier la mission
                    </>
                  )}
                </button>

                {/* Premium CTA */}
                <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">Passez au Premium</h4>
                      <p className="text-sm text-amber-400 font-medium">{APP_CONFIG.PREMIUM_MONTHLY_PRICE}€/mois</p>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    Missions illimitées sans frais de mise en relation + DPAE, fiches de paie, gestion de stock et plus encore.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      // Navigate to premium tab - user preference handled externally
                    }}
                    className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    En savoir plus →
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                  Demande envoyée !
                </h3>
                <p className="text-[var(--text-muted)] mb-8 max-w-sm mx-auto">
                  Nous recherchons les meilleurs experts disponibles. Vous recevrez une notification dès qu'un professionnel acceptera votre mission.
                </p>

                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  Retour au tableau de bord
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step !== 'category' && step !== 'success' && step !== 'payment' && (
          <div className="p-4 border-t border-[var(--border)] max-w-2xl mx-auto w-full">
            {step === 'details' && (
              <button
                onClick={handleContinueToSummary}
                disabled={
                  selectedCategory?.id === 'TECHNICIENS' && !selectedEquipment
                    ? !description.trim()
                    : (!selectedProblem && !description.trim() && !selectedEquipment) ||
                      (selectedProblem?.id === 'other' && !description.trim())
                }
                className={cn(
                  'w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                  selectedCategory?.id === 'TECHNICIENS' && !selectedEquipment
                    ? description.trim()
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-500/25'
                      : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                    : ((selectedProblem || description.trim() || selectedCategory?.id !== 'MAINTENANCE') && !(selectedProblem?.id === 'other' && !description.trim()))
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
                      : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                )}
              >
                Continuer
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {step === 'staffing-config' && (
              <button
                onClick={handleContinueToSummary}
                disabled={!selectedStaffingRole}
                className={cn(
                  'w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                  selectedStaffingRole
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25'
                    : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                )}
              >
                Continuer
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {step === 'summary' && submitError && (
              <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">
                {submitError}
              </div>
            )}

            {step === 'summary' && (
              isPremium ? (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-5 h-5 border-2 border-[var(--border-strong)] border-t-white rounded-full"
                      />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Lancer la recherche
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => setStep('payment')}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Continuer vers le paiement
                </button>
              )
            )}
          </div>
        )}

      {/* Add Equipment Modal - Opens when user clicks "Je ne trouve pas mon équipement" */}
      <AddEquipmentModal
        isOpen={showAddEquipmentModal}
        onClose={() => {
          setShowAddEquipmentModal(false);
          setPendingEquipmentCategory(null);
        }}
        onSuccess={handleEquipmentAdded}
        defaultCategory={pendingEquipmentCategory || undefined}
      />
      {/* Document Viewer (replaces Image Annotator) */}
      <DocumentViewer
        document={selectedDocument}
        isOpen={annotatorOpen}
        onClose={() => setAnnotatorOpen(false)}
        onSave={handleSaveDocument}
        readonly={currentMediaIndex !== null && (media[currentMediaIndex]?.type === 'video' || media[currentMediaIndex]?.type === 'audio')}
      />

      {/* Equipment Details Modal */}
      {selectedEquipment && (
        <EquipmentDetailsModal
          isOpen={showEquipmentDetails}
          onClose={() => setShowEquipmentDetails(false)}
          equipment={selectedEquipment}
        />
      )}

      {/* Add Media Modal (Selection) */}
      <AnimatePresence>
        {addMediaModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddMediaModalOpen(false)}
              className="absolute inset-0 bg-black/90"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-xs shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setAddMediaModalOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-[var(--bg-active)] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>

              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 text-center">
                Ajouter un média
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openCapture('PHOTO')}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Camera className="w-6 h-6 text-blue-400" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Photo</span>
                </button>

                <button
                  onClick={() => openCapture('VIDEO')}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Video className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Vidéo</span>
                </button>

                <button
                  onClick={() => openCapture('AUDIO')}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mic className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Audio</span>
                </button>

                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setAddMediaModalOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[var(--bg-card)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-2xl transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-green-400" />
                  </div>
                  <span className="text-[var(--text-primary)] font-medium text-sm">Importer</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Media Capture Modal */}
      <MediaCaptureModal
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        onCapture={handleCapture}
        initialMode={captureMode}
      />
    </motion.div>,
    document.body
  );
}
