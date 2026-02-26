
export type PricingCategory = 'COOLING' | 'PLUMBING' | 'ELEC' | 'KITCHEN' | 'COFFEE' | 'STAFF' | 'DEFAULT';

export const PRICING_MATRIX: Record<PricingCategory, number> = {
  'COOLING': 125,
  'PLUMBING': 105,
  'ELEC': 110,
  'KITCHEN': 115,
  'COFFEE': 100,
  'STAFF': 120, // 30€ * 4h minimum
  'DEFAULT': 90
};

export interface PricingOptions {
  isNightOrWeekend: boolean;
  isUrgent: boolean;
}

export interface PriceBreakdown {
  base: number;
  travel: number;
  labor: number;
  platformFee: number;
  nightSurcharge: number;
  urgencyFee: number;
  totalHT: number;
  vat: number;
  totalTTC: number;
}

export const calculatePrice = (category: string, options: PricingOptions): PriceBreakdown => {
  // Map category ID/Label to PricingCategory
  let pricingKey: PricingCategory = 'DEFAULT';
  const normalizedCat = category.toUpperCase();
  
  if (normalizedCat.includes('FROID') || normalizedCat.includes('COOLING')) pricingKey = 'COOLING';
  else if (normalizedCat.includes('PLOMB') || normalizedCat.includes('PLUMBING')) pricingKey = 'PLUMBING';
  else if (normalizedCat.includes('ELEC')) pricingKey = 'ELEC';
  else if (normalizedCat.includes('CUISSON') || normalizedCat.includes('KITCHEN') || normalizedCat.includes('CHAUD')) pricingKey = 'KITCHEN';
  else if (normalizedCat.includes('CAFÉ') || normalizedCat.includes('BAR') || normalizedCat.includes('COFFEE')) pricingKey = 'COFFEE';
  else if (
    normalizedCat.includes('STAFF') || 
    normalizedCat.includes('SERVICE') || 
    normalizedCat.includes('SERVEUR') || 
    normalizedCat.includes('CUISINIER') || 
    normalizedCat.includes('PLONGEUR') ||
    normalizedCat.includes('BARMAN') ||
    normalizedCat.includes('HÔTE') ||
    normalizedCat.includes('SÉCURITÉ')
  ) pricingKey = 'STAFF';

  const basePrice = PRICING_MATRIX[pricingKey];
  
  // Fixed costs
  const travelCost = 50;
  const platformFee = 15;
  
  // Calculate multipliers
  let multiplier = 1;
  if (options.isNightOrWeekend) multiplier = 1.5;

  // Calculate Base Total (Base * Multiplier)
  // Logic adjustment: usually multiplier applies to labor + travel, but let's follow user spec:
  // "Si heure actuelle > 20h ... Appliquer multiplicateur x1.5" -> Assuming on the base package.
  
  let currentTotal = basePrice * multiplier;
  
  // Add Urgency Fee (Fixed addition)
  const urgencyFee = options.isUrgent ? 30 : 0;
  currentTotal += urgencyFee;

  // Breakdown for display
  // We need to reverse engineer the "Labor" part since Base = Travel + Labor roughly, 
  // but the user spec says: "Le Détail... Déplacement: 50€, Main d'œuvre: [Reste]"
  // And the multiplier applies to the total base usually.
  // Let's refine: 
  // Base Package (e.g. 125) = Travel (50) + Labor (75)
  // If Night (x1.5): New Total = 125 * 1.5 = 187.5
  // Surcharge = 62.5
  
  const totalHT = currentTotal;
  const nightSurcharge = options.isNightOrWeekend ? (basePrice * 0.5) : 0; // Simple calc for display
  
  // Recalculate strict breakdown for the receipt
  // Base Labor = Base Price - Travel - Platform Fee (If platform fee is included in base? 
  // User says: "Comprendre ce prix... Déplacement 50, MO [Reste], Frais Service 15". 
  // Usually Platform Fee is ON TOP or INSIDE. Let's assume INSIDE for "Forfait" simplicity, or ON TOP?
  // User says "Forfait d'Intervention (Déplacement + 1h MO)". 
  // And "Frais de Service (Platform) : 15€" listed in breakdown.
  // Let's assume The Base Price (e.g. 125) includes Travel + Labor. 
  // And Platform Fee is added on top? Or included?
  // "Le montant total doit mettre à jour le bouton... 125€". So 125 is the Total user pays (HT).
  // So 125 = Travel(50) + Labor(X) + Fee(15). -> Labor = 125 - 65 = 60.
  
  const laborCost = basePrice - travelCost - platformFee;
  
  return {
    base: basePrice,
    travel: travelCost,
    labor: laborCost,
    platformFee: platformFee,
    nightSurcharge: nightSurcharge,
    urgencyFee: urgencyFee,
    totalHT: Math.floor(totalHT), // Floor for clean display
    vat: Math.floor(totalHT * 0.2), // 20% VAT
    totalTTC: Math.floor(totalHT * 1.2)
  };
};
