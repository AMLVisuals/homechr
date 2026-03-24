// ============================================================================
// AI SERVICE MOCK - Simulated Gemini OCR for Equipment Scanning
// Replace this file with real API integration in production
// ============================================================================

import type { MachinePartial } from '@/types/schema';
import type { OCRResult } from '@/types/equipment';

// Local type for mock database categories
type MockEquipmentCategory =
  | 'FRIDGE' | 'FREEZER' | 'COFFEE_MACHINE' | 'OVEN' | 'DISHWASHER'
  | 'ICE_MACHINE' | 'BEER_TAP' | 'COLD_ROOM' | 'VENTILATION' | 'COOKING' | 'OTHER';

// Simulated brand/model database for realistic mock responses
const EQUIPMENT_DATABASE: Record<MockEquipmentCategory, { brands: string[]; models: Record<string, string[]> }> = {
  FRIDGE: {
    brands: ['Hoshizaki', 'Liebherr', 'Foster', 'Williams', 'True', 'Electrolux'],
    models: {
      'Hoshizaki': ['IM-240', 'IM-500', 'HR-78MA', 'CR3S-FS'],
      'Liebherr': ['FKvsl 5413', 'GKv 5710', 'FKDv 4523'],
      'Foster': ['EP700H', 'EP1440L', 'EPCP2/2H'],
      'Williams': ['HJ1SA', 'HJ2SA', 'LJ1SA'],
      'True': ['T-23', 'T-49', 'TWT-48'],
      'Electrolux': ['ecostore', 'ecostoreHP', 'RE4142FFR'],
    },
  },
  FREEZER: {
    brands: ['Hoshizaki', 'Foster', 'Williams', 'True', 'Irinox'],
    models: {
      'Hoshizaki': ['FH1-AAC', 'FH2-AAC', 'UF1A'],
      'Foster': ['EP700L', 'EP1440L', 'EPREM1500L'],
      'Williams': ['LA400', 'LA500', 'LJ1LA'],
      'True': ['T-23F', 'T-49F', 'TWT-48F'],
      'Irinox': ['MF 70.2', 'MF 100.2', 'MF 130.2'],
    },
  },
  COFFEE_MACHINE: {
    brands: ['La Marzocco', 'Nuova Simonelli', 'Victoria Arduino', 'La Cimbali', 'Sanremo'],
    models: {
      'La Marzocco': ['Linea PB', 'GB5', 'Strada', 'Linea Mini'],
      'Nuova Simonelli': ['Aurelia Wave', 'Appia Life', 'Oscar II'],
      'Victoria Arduino': ['Eagle One', 'Black Eagle', 'Athena'],
      'La Cimbali': ['M100', 'M34', 'S30'],
      'Sanremo': ['Cafe Racer', 'Opera', 'Zoe'],
    },
  },
  OVEN: {
    brands: ['Rational', 'Convotherm', 'Unox', 'Lainox', 'Hobart'],
    models: {
      'Rational': ['iCombi Pro 6-1/1', 'iCombi Pro 10-1/1', 'SCC 62'],
      'Convotherm': ['C4eT 6.10', 'C4eT 10.20', 'maxx pro'],
      'Unox': ['XEVC-0511-EPR', 'XEVC-1011-EPR', 'BAKERLUX'],
      'Lainox': ['ORACLE', 'SAPIENS', 'NABOO'],
      'Hobart': ['OPUS', 'ECOLINE', 'PROFI'],
    },
  },
  DISHWASHER: {
    brands: ['Winterhalter', 'Hobart', 'Meiko', 'Electrolux', 'Fagor'],
    models: {
      'Winterhalter': ['UC-L', 'UC-M', 'PT-500', 'MTR'],
      'Hobart': ['ECOMAX 502', 'ECOMAX 612', 'AM15'],
      'Meiko': ['M-iClean U', 'M-iClean H', 'UPster K'],
      'Electrolux': ['green&clean', 'HSPPDD', 'NHTG'],
      'Fagor': ['CO-500', 'AD-48', 'FI-48'],
    },
  },
  ICE_MACHINE: {
    brands: ['Hoshizaki', 'Scotsman', 'Brema', 'Manitowoc', 'Ice-O-Matic'],
    models: {
      'Hoshizaki': ['IM-240', 'FM-480', 'KM-100B'],
      'Scotsman': ['MV 456', 'MV 806', 'NW 308'],
      'Brema': ['CB 316', 'CB 640', 'VM 900'],
      'Manitowoc': ['UDE 0065A', 'UYF 0140A', 'IYT 0500A'],
      'Ice-O-Matic': ['ICE0250', 'ICE0500', 'ICE1006'],
    },
  },
  BEER_TAP: {
    brands: ['Lindr', 'Angram', 'Cornelius', 'Micro Matic', 'Celli'],
    models: {
      'Lindr': ['PYGMY 25/K', 'KONTAKT 40/K', 'AS-110'],
      'Angram': ['CQ', 'PlusTap', 'Quadrant'],
      'Cornelius': ['Dispenser Pro', 'Dispenser Elite', 'Arctic Blast'],
      'Micro Matic': ['Pro-Line', 'MarQue', 'TurboTap'],
      'Celli': ['Python', 'Cobra', 'Blade'],
    },
  },
  COLD_ROOM: {
    brands: ['Dagard', 'Viessmann', 'Coldkit', 'MTH', 'Profroid'],
    models: {
      'Dagard': ['Modular 80', 'Modular 100', 'Premium'],
      'Viessmann': ['TECTO', 'TECTO WMR', 'Classic'],
      'Coldkit': ['Pro Series', 'Standard', 'Industrial'],
      'MTH': ['Climatic', 'Polar', 'Artic'],
      'Profroid': ['Chambre Pro', 'Surgélation', 'Multi-Temp'],
    },
  },
  VENTILATION: {
    brands: ['Halton', 'Airvent', 'Cooke', 'Reven', 'System Air'],
    models: {
      'Halton': ['Capture Jet', 'KVI', 'Marvel'],
      'Airvent': ['Pro Hood', 'Restaurant', 'Commercial'],
      'Cooke': ['Canopy', 'Island', 'Low Profile'],
      'Reven': ['X-Cyclone', 'Turbo', 'Classic'],
      'System Air': ['KBR', 'KBT', 'ETAMASTER'],
    },
  },
  COOKING: {
    brands: ['Bonnet', 'Electrolux', 'Zanussi', 'Mareno', 'MKN'],
    models: {
      'Bonnet': ['Maestro', 'Advancia Plus', 'Optima'],
      'Electrolux': ['900XP', '700XP', 'thermaline'],
      'Zanussi': ['EVO900', 'EVO700', 'Modular'],
      'Mareno': ['Star 90', 'Star 70', 'Star 65'],
      'MKN': ['FlexiChef', 'SpaceCombi', 'FlexiPan'],
    },
  },
  OTHER: {
    brands: ['Generic', 'Unknown'],
    models: {
      'Generic': ['Model A', 'Model B'],
      'Unknown': ['Unknown Model'],
    },
  },
};

// Simulated serial number patterns
const SERIAL_PATTERNS = [
  () => `L${Math.floor(Math.random() * 900000 + 100000)}`,
  () => `SN${Math.floor(Math.random() * 9000000 + 1000000)}`,
  () => `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 90000 + 10000)}`,
  () => `${new Date().getFullYear() - Math.floor(Math.random() * 5)}-${Math.floor(Math.random() * 9000 + 1000)}`,
];

// Simulated voltage values
const VOLTAGES = ['220V', '230V', '240V', '380V', '400V'];
const POWERS = ['1.5kW', '2.0kW', '2.5kW', '3.0kW', '4.0kW', '5.5kW', '7.5kW', '11kW'];

/**
 * Simulates AI-powered OCR scanning of equipment nameplate
 * @param _image - The image file (not used in mock)
 * @returns Promise<OCRResult> - Simulated OCR results
 */
export async function scanPlate(_image: File): Promise<OCRResult> {
  // Simulate realistic processing time (2-3.5 seconds)
  const processingTime = 2000 + Math.random() * 1500;
  await new Promise(resolve => setTimeout(resolve, processingTime));

  // 85% success rate for realistic simulation
  const isSuccess = Math.random() > 0.15;

  if (!isSuccess) {
    return {
      success: false,
      confidence: Math.random() * 0.3, // Low confidence on failure
      rawText: 'Unable to parse text from image. Please ensure the nameplate is clearly visible.',
      suggestions: {
        brand: ['Hoshizaki', 'Liebherr', 'Foster'],
        model: [],
      },
    };
  }

  // Pick a random category and brand
  const categories = Object.keys(EQUIPMENT_DATABASE) as MockEquipmentCategory[];
  const category = categories[Math.floor(Math.random() * (categories.length - 1))]; // Exclude OTHER
  const categoryData = EQUIPMENT_DATABASE[category];
  const brand = categoryData.brands[Math.floor(Math.random() * categoryData.brands.length)];
  const models = categoryData.models[brand] || ['Unknown'];
  const model = models[Math.floor(Math.random() * models.length)];

  // Generate other details
  const serialNumber = SERIAL_PATTERNS[Math.floor(Math.random() * SERIAL_PATTERNS.length)]();
  const voltage = VOLTAGES[Math.floor(Math.random() * VOLTAGES.length)];
  const power = POWERS[Math.floor(Math.random() * POWERS.length)];

  // Simulate partial reads (sometimes miss a field)
  const confidence = 0.75 + Math.random() * 0.25; // 75-100%
  const hasSerial = Math.random() > 0.1; // 90% chance to read serial
  const hasVoltage = Math.random() > 0.2; // 80% chance to read voltage
  const hasPower = Math.random() > 0.3; // 70% chance to read power

  return {
    success: true,
    confidence,
    brand,
    model,
    serialNumber: hasSerial ? serialNumber : undefined,
    voltage: hasVoltage ? voltage : undefined,
    power: hasPower ? power : undefined,
    rawText: `${brand}\n${model}\nS/N: ${serialNumber}\n${voltage} ${power}`,
  };
}

/**
 * Simulates scanning and returns a partial Machine object
 * Convenience wrapper around scanPlate
 */
export async function scanAndExtract(image: File): Promise<MachinePartial & { confidence: number; success: boolean }> {
  const result = await scanPlate(image);

  if (!result.success) {
    return {
      success: false,
      confidence: result.confidence,
    };
  }

  // Determine category from brand
  let detectedType: MockEquipmentCategory = 'OTHER';
  for (const [cat, data] of Object.entries(EQUIPMENT_DATABASE)) {
    if (data.brands.includes(result.brand || '')) {
      detectedType = cat as MockEquipmentCategory;
      break;
    }
  }

  return {
    success: true,
    confidence: result.confidence,
    type: detectedType,
    brand: result.brand || '',
    model: result.model || '',
    serialNumber: result.serialNumber || '',
    metadata: {
      voltage: result.voltage,
      power: result.power,
    },
  };
}

/**
 * Simulates AI-powered equipment identification from overview photo
 * Uses image recognition to suggest equipment category
 */
export async function identifyEquipment(_image: File): Promise<{
  category: MockEquipmentCategory;
  confidence: number;
  suggestions: MockEquipmentCategory[];
}> {
  await new Promise(resolve => setTimeout(resolve, 1500));

  const categories = Object.keys(EQUIPMENT_DATABASE) as MockEquipmentCategory[];
  const mainCategory = categories[Math.floor(Math.random() * (categories.length - 1))];

  // Generate 2-3 alternative suggestions
  const suggestions = categories
    .filter(c => c !== mainCategory && c !== 'OTHER')
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  return {
    category: mainCategory,
    confidence: 0.7 + Math.random() * 0.25,
    suggestions: [mainCategory, ...suggestions],
  };
}

/**
 * Simulates fetching technical documentation for equipment
 */
export async function fetchDocumentation(brand: string, model: string): Promise<{
  found: boolean;
  documents?: { type: string; url: string; name: string }[];
}> {
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 70% chance of finding docs
  if (Math.random() > 0.3) {
    return {
      found: true,
      documents: [
        {
          type: 'manual',
          name: `${brand} ${model} - Manuel utilisateur.pdf`,
          url: `https://docs.example.com/${brand.toLowerCase()}/${model.toLowerCase()}/manual.pdf`,
        },
        {
          type: 'parts',
          name: `${brand} ${model} - Vue éclatée.pdf`,
          url: `https://docs.example.com/${brand.toLowerCase()}/${model.toLowerCase()}/parts.pdf`,
        },
        {
          type: 'service',
          name: `${brand} ${model} - Guide de maintenance.pdf`,
          url: `https://docs.example.com/${brand.toLowerCase()}/${model.toLowerCase()}/service.pdf`,
        },
      ],
    };
  }

  return { found: false };
}

/**
 * Mock QR code generation (returns a data URL)
 * In production, use a real QR library like 'qrcode'
 */
export function generateQRCodeUrl(equipmentId: string): string {
  // This is a placeholder - in production use qrcode library
  // For now, return a predictable URL that could be used with a QR API
  const qrData = encodeURIComponent(`https://home-chr.app/equipment/${equipmentId}`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
}
