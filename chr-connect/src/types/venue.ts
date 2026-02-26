export interface VenuePhoto {
  id: string;
  url: string;
  type: 'FACADE' | 'DINING_ROOM' | 'KITCHEN' | 'BAR' | 'ACCESS' | 'ELECTRICAL_PANEL' | 'OTHER';
  caption?: string;
  uploadedAt: string;
}

export interface VenueAccess {
  digicode?: string;
  contactName?: string;
  phone?: string;
  instructions?: string;
  wifiSSID?: string;
  wifiPassword?: string;
}

export interface VenueTechnical {
  elecType: 'MONO' | 'TRI' | 'UNKNOWN';
  gasType: 'TOWN' | 'BOTTLE' | 'NONE';
  hasFreightElevator: boolean;
  hasElevator: boolean;
  deliveryAccess: 'STREET' | 'COURTYARD' | 'BACKDOOR';
  kitchenType?: 'OPEN' | 'CLOSED' | 'SEMI_OPEN';
  hasVentilation: boolean;
  hasAirConditioning: boolean;
}

export interface VenueEquipment {
  posSystem?: string;
  hasTerrace?: boolean;
  hasPrivateRooms?: boolean;
  hasBar?: boolean;
}

export interface VenueOpeningHours {
  [key: string]: { // monday, tuesday, etc.
    open: string;
    close: string;
    closed: boolean;
  };
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city: string;
  zipCode: string;
  category: string;
  
  // Media
  photoUrl?: string; // Kept for backward compatibility (main image)
  photos: VenuePhoto[];
  
  // Google Data
  googlePlaceId?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: 1 | 2 | 3 | 4;
  
  // Detailed Info
  capacity?: number;
  surface?: number;
  teamSize?: number;
  concept?: string;
  
  // Sections
  access?: VenueAccess;
  technical?: VenueTechnical;
  equipment?: VenueEquipment;
  openingHours?: VenueOpeningHours;
  
  // Meta
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastVerified?: string;
}

export interface VenueFormData extends Partial<Venue> {
  id?: string;
}
