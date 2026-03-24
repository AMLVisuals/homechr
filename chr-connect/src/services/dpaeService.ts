import { DPAEDeclaration } from '@/types/dpae';

/**
 * Mock DPAE Service
 * In production, this would call the URSSAF API (net-entreprises)
 * via machine-to-machine auth (XML format).
 */

export async function submitDPAE(declaration: DPAEDeclaration): Promise<{
  success: boolean;
  reference?: string;
  error?: string;
}> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 2000));

  // Mock: 95% success rate
  if (Math.random() > 0.95) {
    return {
      success: false,
      error: 'Erreur URSSAF: Numéro de sécurité sociale invalide',
    };
  }

  return {
    success: true,
    reference: `DPAE-${Date.now().toString(36).toUpperCase()}`,
  };
}

export function generateContractHTML(declaration: DPAEDeclaration): string {
  const trialDays = Math.min(
    14,
    Math.ceil(
      (new Date(declaration.endDate).getTime() - new Date(declaration.startDate).getTime()) /
        (1000 * 60 * 60 * 24 * 7)
    )
  );

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Contrat CDD d'usage - ${declaration.employeeFirstName} ${declaration.employeeLastName}</title>
  <style>
    body { font-family: 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a1a; line-height: 1.6; }
    h1 { text-align: center; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 16px; }
    h2 { color: #1e3a5f; margin-top: 32px; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0; }
    .party { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #1e3a5f; }
    .party h3 { margin: 0 0 12px 0; color: #1e3a5f; font-size: 14px; }
    .party p { margin: 4px 0; font-size: 13px; }
    .article { margin: 16px 0; padding: 12px 0; border-bottom: 1px solid #eee; }
    .article-title { font-weight: bold; color: #1e3a5f; }
    .signature { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px; }
    .sig-block { border-top: 1px solid #ccc; padding-top: 16px; text-align: center; }
    .sig-block p { margin: 4px 0; font-size: 13px; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #888; }
  </style>
</head>
<body>
  <h1>CONTRAT DE TRAVAIL À DURÉE DÉTERMINÉE D'USAGE</h1>
  <p style="text-align:center;color:#666;font-size:13px;">
    Conformément aux articles L.1242-2 et D.1242-1 du Code du travail
  </p>

  <h2>Identification des parties</h2>
  <div class="parties">
    <div class="party">
      <h3>EMPLOYEUR</h3>
      <p><strong>${declaration.employerName}</strong></p>
      <p>SIRET : ${declaration.employerSiret}</p>
      <p>Code APE : ${declaration.employerAPE}</p>
      <p>${declaration.employerAddress}</p>
    </div>
    <div class="party">
      <h3>SALARIÉ(E)</h3>
      <p><strong>${declaration.employeeFirstName} ${declaration.employeeLastName}</strong></p>
      <p>Né(e) le : ${declaration.employeeBirthDate}</p>
      <p>N° SS : ${declaration.employeeSSN}</p>
      <p>Nationalité : ${declaration.employeeNationality}</p>
    </div>
  </div>

  <h2>Clauses du contrat</h2>

  <div class="article">
    <p class="article-title">Article 1 — Motif du recours</p>
    <p>Le présent contrat est conclu pour faire face à un surcroît temporaire d'activité lié à l'activité de l'établissement, conformément à l'usage constant du secteur de l'Hôtellerie-Restauration.</p>
  </div>

  <div class="article">
    <p class="article-title">Article 2 — Poste et classification</p>
    <p>Le/La salarié(e) est engagé(e) en qualité de <strong>${declaration.jobTitle}</strong>.</p>
    <p>Convention collective applicable : ${declaration.collectiveAgreement}.</p>
  </div>

  <div class="article">
    <p class="article-title">Article 3 — Durée du contrat</p>
    <p>Date de début : <strong>${declaration.startDate}</strong></p>
    <p>Date de fin : <strong>${declaration.endDate}</strong></p>
    <p>Horaires de travail : ${declaration.workHours}</p>
  </div>

  <div class="article">
    <p class="article-title">Article 4 — Rémunération</p>
    <p>Taux horaire brut : <strong>${declaration.hourlyRate.toFixed(2)} €</strong></p>
    <p>Le salaire sera versé à la fin de la période contractuelle.</p>
  </div>

  <div class="article">
    <p class="article-title">Article 5 — Période d'essai</p>
    <p>La période d'essai est fixée à <strong>${trialDays} jour(s)</strong> (1 jour par semaine de contrat, maximum 2 semaines).</p>
  </div>

  <div class="article">
    <p class="article-title">Article 6 — Convention collective</p>
    <p>Le présent contrat est régi par la Convention Collective Nationale des Hôtels, Cafés, Restaurants (HCR) — IDCC 1979.</p>
  </div>

  <div class="article">
    <p class="article-title">Article 7 — Fin du contrat</p>
    <p>Le contrat prendra fin automatiquement à la date prévue. Une indemnité de fin de contrat (prime de précarité) de 10% sera versée conformément à la réglementation en vigueur.</p>
  </div>

  <h2>Signatures</h2>
  <div class="signature">
    <div class="sig-block">
      <p><strong>L'Employeur</strong></p>
      <p>${declaration.employerName}</p>
      <p style="margin-top:48px;font-style:italic">Signature précédée de la mention "Lu et approuvé"</p>
    </div>
    <div class="sig-block">
      <p><strong>Le/La Salarié(e)</strong></p>
      <p>${declaration.employeeFirstName} ${declaration.employeeLastName}</p>
      <p style="margin-top:48px;font-style:italic">Signature précédée de la mention "Lu et approuvé"</p>
    </div>
  </div>

  <div class="footer">
    <p>Contrat généré par Home CHR — ${new Date().toLocaleDateString('fr-FR')}</p>
    <p>Ce document a valeur de contrat de travail une fois signé par les deux parties.</p>
  </div>
</body>
</html>`;
}
