// ============================================================================
// FACTUR-X GENERATOR — Facturation électronique conforme
// ============================================================================
// Génère des factures au format Factur-X (profil MINIMUM/BASIC)
// Factur-X = PDF/A-3 + XML CII (Cross Industry Invoice) embarqué
// Norme obligatoire en France à partir de septembre 2026
// ============================================================================

import type { Invoice, QuoteItem, TVARate } from '@/types/unified';
import { TVA_RATES } from '@/types/unified';

// ============================================================================
// TYPES
// ============================================================================

export interface FacturXParty {
  name: string;
  siret?: string;
  tvaIntracom?: string; // FR + 2 chiffres clé + SIREN
  address: string;
  postalCode: string;
  city: string;
  country?: string; // ISO 3166-1 alpha-2, default 'FR'
  email?: string;
  phone?: string;
}

export interface FacturXData {
  invoice: Invoice;
  seller: FacturXParty;
  buyer: FacturXParty;
  establishmentName?: string;
  missionDescription?: string;
  paymentTermsNote?: string;
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateISO(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0].replace(/-/g, '');
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function tvaRatePercent(rate: TVARate): number {
  return TVA_RATES[rate] * 100;
}

// ============================================================================
// FACTUR-X XML GENERATION (Profil MINIMUM)
// ============================================================================

export function generateFacturXML(data: FacturXData): string {
  const { invoice, seller, buyer } = data;

  // Group items by TVA rate for tax breakdown
  const tvaGroups = new Map<TVARate, { baseHT: number; tvaAmount: number }>();
  for (const item of invoice.items) {
    const existing = tvaGroups.get(item.tvaRate) || { baseHT: 0, tvaAmount: 0 };
    existing.baseHT += item.totalHT;
    existing.tvaAmount += item.totalHT * TVA_RATES[item.tvaRate];
    tvaGroups.set(item.tvaRate, existing);
  }

  const taxLines = Array.from(tvaGroups.entries())
    .map(([rate, { baseHT, tvaAmount }]) => `
        <ram:ApplicableTradeTax>
          <ram:CalculatedAmount>${tvaAmount.toFixed(2)}</ram:CalculatedAmount>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:BasisAmount>${baseHT.toFixed(2)}</ram:BasisAmount>
          <ram:CategoryCode>S</ram:CategoryCode>
          <ram:RateApplicablePercent>${tvaRatePercent(rate).toFixed(2)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>`)
    .join('');

  const itemLines = invoice.items
    .map((item, index) => `
      <ram:IncludedSupplyChainTradeLineItem>
        <ram:AssociatedDocumentLineDocument>
          <ram:LineID>${index + 1}</ram:LineID>
        </ram:AssociatedDocumentLineDocument>
        <ram:SpecifiedTradeProduct>
          <ram:Name>${escapeXml(item.description)}</ram:Name>
        </ram:SpecifiedTradeProduct>
        <ram:SpecifiedLineTradeAgreement>
          <ram:NetPriceProductTradePrice>
            <ram:ChargeAmount>${item.unitPriceHT.toFixed(2)}</ram:ChargeAmount>
          </ram:NetPriceProductTradePrice>
        </ram:SpecifiedLineTradeAgreement>
        <ram:SpecifiedLineTradeDelivery>
          <ram:BilledQuantity unitCode="${item.unit === 'h' ? 'HUR' : 'C62'}">${item.quantity}</ram:BilledQuantity>
        </ram:SpecifiedLineTradeDelivery>
        <ram:SpecifiedLineTradeSettlement>
          <ram:ApplicableTradeTax>
            <ram:TypeCode>VAT</ram:TypeCode>
            <ram:CategoryCode>S</ram:CategoryCode>
            <ram:RateApplicablePercent>${tvaRatePercent(item.tvaRate).toFixed(2)}</ram:RateApplicablePercent>
          </ram:ApplicableTradeTax>
          <ram:SpecifiedTradeSettlementLineMonetarySummation>
            <ram:LineTotalAmount>${item.totalHT.toFixed(2)}</ram:LineTotalAmount>
          </ram:SpecifiedTradeSettlementLineMonetarySummation>
        </ram:SpecifiedLineTradeSettlement>
      </ram:IncludedSupplyChainTradeLineItem>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100">

  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:factur-x.eu:1p0:basicwl</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <rsm:ExchangedDocument>
    <ram:ID>${escapeXml(invoice.reference)}</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${formatDateISO(invoice.createdAt)}</udt:DateTimeString>
    </ram:IssueDateTime>
  </rsm:ExchangedDocument>

  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty>
        <ram:Name>${escapeXml(seller.name)}</ram:Name>
        ${seller.siret ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${seller.siret}</ram:ID></ram:SpecifiedLegalOrganization>` : ''}
        ${seller.tvaIntracom ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${seller.tvaIntracom}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(seller.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(seller.address)}</ram:LineOne>
          <ram:CityName>${escapeXml(seller.city)}</ram:CityName>
          <ram:CountryID>${seller.country || 'FR'}</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:SellerTradeParty>

      <ram:BuyerTradeParty>
        <ram:Name>${escapeXml(buyer.name)}</ram:Name>
        ${buyer.siret ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${buyer.siret}</ram:ID></ram:SpecifiedLegalOrganization>` : ''}
        ${buyer.tvaIntracom ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${buyer.tvaIntracom}</ram:ID></ram:SpecifiedTaxRegistration>` : ''}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${escapeXml(buyer.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${escapeXml(buyer.address)}</ram:LineOne>
          <ram:CityName>${escapeXml(buyer.city)}</ram:CityName>
          <ram:CountryID>${buyer.country || 'FR'}</ram:CountryID>
        </ram:PostalTradeAddress>
      </ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>

    <ram:ApplicableHeaderTradeDelivery/>

    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>
      <ram:SpecifiedTradePaymentTerms>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${formatDateISO(invoice.paymentDueDate)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>
      ${taxLines}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${invoice.subtotalHT.toFixed(2)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${invoice.subtotalHT.toFixed(2)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="EUR">${invoice.totalTVA.toFixed(2)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${invoice.totalTTC.toFixed(2)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${invoice.totalTTC.toFixed(2)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
    ${itemLines}
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

// ============================================================================
// INVOICE HTML GENERATION (template PDF-ready)
// ============================================================================

const COLORS = {
  primary: '#3b82f6',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  background: '#f8fafc',
  success: '#22c55e',
};

function itemTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    LABOR: 'M.O.',
    PART: 'Pièce',
    TRAVEL: 'Dépl.',
    DIAGNOSTIC: 'Diag.',
    EMERGENCY_FEE: 'Urgence',
    OTHER: 'Autre',
  };
  return labels[type] || type;
}

export function generateInvoiceHTML(data: FacturXData): string {
  const { invoice, seller, buyer, establishmentName, missionDescription } = data;

  // TVA breakdown
  const tvaGroups = new Map<TVARate, { baseHT: number; tvaAmount: number }>();
  for (const item of invoice.items) {
    const existing = tvaGroups.get(item.tvaRate) || { baseHT: 0, tvaAmount: 0 };
    existing.baseHT += item.totalHT;
    existing.tvaAmount += item.totalHT * TVA_RATES[item.tvaRate];
    tvaGroups.set(item.tvaRate, existing);
  }

  const tvaBreakdownHTML = Array.from(tvaGroups.entries())
    .map(([rate, { baseHT, tvaAmount }]) => `
      <div class="totals-row">
        <span>TVA ${tvaRatePercent(rate)}% (base ${formatCurrency(baseHT)})</span>
        <span>${formatCurrency(tvaAmount)}</span>
      </div>
    `)
    .join('');

  const statusLabels: Record<string, { label: string; color: string }> = {
    DRAFT: { label: 'Brouillon', color: '#94a3b8' },
    SENT: { label: 'Envoyée', color: '#3b82f6' },
    PAID: { label: 'Payée', color: '#22c55e' },
    OVERDUE: { label: 'En retard', color: '#ef4444' },
    CANCELLED: { label: 'Annulée', color: '#94a3b8' },
    REFUNDED: { label: 'Remboursée', color: '#f59e0b' },
  };
  const status = statusLabels[invoice.status] || statusLabels.DRAFT;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.reference}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10pt; line-height: 1.5; color: ${COLORS.text}; background: white; }
    .page { width: 210mm; min-height: 297mm; padding: 15mm; margin: 0 auto; background: white; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 15px; border-bottom: 2px solid ${COLORS.primary}; margin-bottom: 20px; }
    .logo { font-size: 24pt; font-weight: bold; color: ${COLORS.primary}; }
    .logo-subtitle { font-size: 8pt; color: ${COLORS.textLight}; margin-top: 2px; }
    .invoice-info { text-align: right; }
    .invoice-reference { font-size: 14pt; font-weight: bold; color: ${COLORS.primary}; }
    .invoice-date { font-size: 9pt; color: ${COLORS.textLight}; margin-top: 5px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 8pt; font-weight: bold; color: white; background: ${status.color}; margin-top: 8px; }
    .facturx-badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 6px; font-size: 7pt; font-weight: bold; color: ${COLORS.success}; background: ${COLORS.success}10; border: 1px solid ${COLORS.success}30; margin-top: 8px; margin-left: 6px; }
    .parties { display: flex; justify-content: space-between; gap: 30px; margin-bottom: 25px; }
    .party { flex: 1; padding: 15px; background: ${COLORS.background}; border-radius: 8px; border: 1px solid ${COLORS.border}; }
    .party-title { font-size: 8pt; font-weight: bold; text-transform: uppercase; color: ${COLORS.textLight}; margin-bottom: 8px; letter-spacing: 0.5px; }
    .party-name { font-size: 12pt; font-weight: bold; color: ${COLORS.text}; margin-bottom: 5px; }
    .party-detail { font-size: 9pt; color: ${COLORS.textLight}; margin-top: 2px; }
    .mission-info { padding: 10px 15px; background: #eff6ff; border-left: 4px solid ${COLORS.primary}; border-radius: 0 4px 4px 0; margin-bottom: 20px; font-size: 9pt; }
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table th { background: ${COLORS.primary}; color: white; padding: 10px 8px; text-align: left; font-size: 8pt; font-weight: bold; text-transform: uppercase; }
    .items-table th:first-child { border-radius: 6px 0 0 0; }
    .items-table th:last-child { border-radius: 0 6px 0 0; text-align: right; }
    .items-table td { padding: 10px 8px; border-bottom: 1px solid ${COLORS.border}; font-size: 9pt; }
    .items-table tr:nth-child(even) { background: ${COLORS.background}; }
    .item-type { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 7pt; font-weight: bold; text-transform: uppercase; background: #dbeafe; color: #1d4ed8; }
    .item-description { font-weight: 500; }
    .item-price { text-align: right; font-weight: 500; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 25px; }
    .totals-table { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 9pt; }
    .totals-row.separator { border-top: 1px solid ${COLORS.border}; margin-top: 5px; padding-top: 10px; }
    .totals-row.total { font-size: 14pt; font-weight: bold; color: ${COLORS.primary}; border-top: 2px solid ${COLORS.primary}; margin-top: 5px; padding-top: 10px; }
    .payment-info { padding: 15px; background: ${COLORS.background}; border-radius: 8px; margin-bottom: 20px; }
    .payment-title { font-size: 10pt; font-weight: bold; margin-bottom: 8px; }
    .payment-detail { font-size: 9pt; color: ${COLORS.textLight}; margin-top: 3px; }
    .legal-section { margin-top: 20px; padding: 12px 15px; background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; font-size: 7.5pt; color: #92400e; }
    .legal-title { font-weight: bold; margin-bottom: 4px; }
    .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid ${COLORS.border}; text-align: center; font-size: 7pt; color: ${COLORS.textLight}; }
    .footer-logo { font-weight: bold; color: ${COLORS.primary}; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { padding: 10mm; } }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="logo">ConnectCHR</div>
        <div class="logo-subtitle">Plateforme HORECA de confiance</div>
      </div>
      <div class="invoice-info">
        <div class="invoice-reference">FACTURE ${invoice.reference}</div>
        <div class="invoice-date">
          Date : ${formatDate(invoice.createdAt)}<br>
          Échéance : ${formatDate(invoice.paymentDueDate)}
        </div>
        <div>
          <span class="status-badge">${status.label}</span>
          <span class="facturx-badge">&#10003; Factur-X conforme</span>
        </div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party">
        <div class="party-title">Émetteur</div>
        <div class="party-name">${seller.name}</div>
        ${seller.siret ? `<div class="party-detail">SIRET : ${seller.siret}</div>` : ''}
        ${seller.tvaIntracom ? `<div class="party-detail">TVA Intracom : ${seller.tvaIntracom}</div>` : ''}
        <div class="party-detail">${seller.address}</div>
        <div class="party-detail">${seller.postalCode} ${seller.city}</div>
        ${seller.email ? `<div class="party-detail">${seller.email}</div>` : ''}
      </div>
      <div class="party">
        <div class="party-title">Destinataire</div>
        <div class="party-name">${buyer.name}</div>
        ${establishmentName ? `<div class="party-detail" style="font-weight:500">${establishmentName}</div>` : ''}
        ${buyer.siret ? `<div class="party-detail">SIRET : ${buyer.siret}</div>` : ''}
        <div class="party-detail">${buyer.address}</div>
        <div class="party-detail">${buyer.postalCode} ${buyer.city}</div>
      </div>
    </div>

    ${missionDescription ? `
    <div class="mission-info">
      <strong>Objet :</strong> ${missionDescription}
    </div>
    ` : ''}

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width:40%">Description</th>
          <th style="width:10%">Qté</th>
          <th style="width:15%">PU HT</th>
          <th style="width:10%">TVA</th>
          <th style="width:15%">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map(item => `
        <tr>
          <td>
            <span class="item-type">${itemTypeLabel(item.type)}</span>
            <div class="item-description">${item.description}</div>
            ${item.reference ? `<div style="font-size:8pt;color:${COLORS.textLight};margin-top:2px">Réf : ${item.reference}</div>` : ''}
          </td>
          <td>${item.quantity} ${item.unit}</td>
          <td>${formatCurrency(item.unitPriceHT)}</td>
          <td>${tvaRatePercent(item.tvaRate)}%</td>
          <td class="item-price">${formatCurrency(item.totalHT)}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-table">
        <div class="totals-row">
          <span>Total HT</span>
          <span>${formatCurrency(invoice.subtotalHT)}</span>
        </div>
        ${tvaBreakdownHTML}
        <div class="totals-row separator">
          <span>Total TVA</span>
          <span>${formatCurrency(invoice.totalTVA)}</span>
        </div>
        <div class="totals-row total">
          <span>TOTAL TTC</span>
          <span>${formatCurrency(invoice.totalTTC)}</span>
        </div>
      </div>
    </div>

    <!-- Payment Info -->
    <div class="payment-info">
      <div class="payment-title">Conditions de paiement</div>
      <div class="payment-detail">Échéance : ${formatDate(invoice.paymentDueDate)}</div>
      ${invoice.paymentMethod ? `<div class="payment-detail">Mode de règlement : ${
        { CARD: 'Carte bancaire', TRANSFER: 'Virement', CHECK: 'Chèque', CASH: 'Espèces' }[invoice.paymentMethod]
      }</div>` : ''}
      ${invoice.paidAt ? `<div class="payment-detail" style="color:${COLORS.success};font-weight:bold">Payée le ${formatDate(invoice.paidAt)}</div>` : ''}
      ${data.paymentTermsNote ? `<div class="payment-detail">${data.paymentTermsNote}</div>` : ''}
    </div>

    <!-- Legal Mentions -->
    <div class="legal-section">
      <div class="legal-title">Mentions légales</div>
      En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée,
      ainsi qu'une indemnité forfaitaire de 40€ pour frais de recouvrement (Art. L.441-10 du Code de commerce).
      Pas d'escompte en cas de paiement anticipé.
      <br><br>
      <strong>Factur-X :</strong> Cette facture est conforme au format Factur-X (profil Basic WL).
      Le fichier XML structuré est embarqué dans le document pour traitement automatisé.
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">ConnectCHR</div>
      <p>Facture électronique générée automatiquement — Factur-X conforme</p>
      <p>www.home-chr.fr | contact@home-chr.fr</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// DOWNLOAD FUNCTIONS
// ============================================================================

/** Download Factur-X XML file */
export function downloadFacturXML(data: FacturXData): void {
  const xml = generateFacturXML(data);
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.invoice.reference}_facturx.xml`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Download invoice HTML (PDF-ready for print) */
export function downloadInvoiceHTML(data: FacturXData): void {
  const html = generateInvoiceHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.invoice.reference}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Open invoice in new tab for printing as PDF */
export function printInvoice(data: FacturXData): void {
  const html = generateInvoiceHTML(data);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/** Export invoice data as JSON */
export function exportInvoiceJSON(data: FacturXData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${data.invoice.reference}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// MOCK DATA HELPER — Creates a demo invoice for testing
// ============================================================================

export function createMockFacturXData(): FacturXData {
  const invoice: Invoice = {
    id: 'inv_demo_001',
    quoteId: 'quote_demo_001',
    missionId: 'mission_demo_001',
    reference: 'FAC-2026-00042',
    items: [
      {
        id: 'item_1',
        type: 'LABOR',
        description: 'Intervention technicien frigoriste — diagnostic + réparation',
        quantity: 2.5,
        unit: 'h',
        unitPriceHT: 65,
        tvaRate: 'REDUCED',
        totalHT: 162.5,
        totalTTC: 178.75,
      },
      {
        id: 'item_2',
        type: 'PART',
        reference: 'COMP-R404A-500',
        description: 'Compresseur R404A remplacement',
        quantity: 1,
        unit: 'unité',
        unitPriceHT: 320,
        tvaRate: 'STANDARD',
        totalHT: 320,
        totalTTC: 384,
      },
      {
        id: 'item_3',
        type: 'TRAVEL',
        description: 'Déplacement Zone Intermédiaire (18km)',
        quantity: 1,
        unit: 'forfait',
        unitPriceHT: 57,
        tvaRate: 'STANDARD',
        totalHT: 57,
        totalTTC: 68.4,
      },
    ],
    subtotalHT: 539.5,
    totalTVA: 91.65,
    totalTTC: 631.15,
    status: 'SENT',
    paymentDueDate: '2026-04-17T00:00:00Z',
    platformFeeAmount: 0,
    providerNetAmount: 539.5,
    createdAt: '2026-03-17T10:00:00Z',
  };

  const seller: FacturXParty = {
    name: 'FroidPro Services SARL',
    siret: '84726193400012',
    tvaIntracom: 'FR32847261934',
    address: '12 rue des Artisans',
    postalCode: '75011',
    city: 'Paris',
    email: 'contact@froidpro.fr',
    phone: '01 42 00 00 00',
  };

  const buyer: FacturXParty = {
    name: 'Le Bistrot du Marché SAS',
    siret: '91234567800019',
    tvaIntracom: 'FR45912345678',
    address: '45 avenue de la République',
    postalCode: '75003',
    city: 'Paris',
  };

  return {
    invoice,
    seller,
    buyer,
    establishmentName: 'Le Bistrot du Marché — Terrasse République',
    missionDescription: 'Réparation chambre froide positive — remplacement compresseur',
    paymentTermsNote: 'Paiement à 30 jours à réception de facture. Virement bancaire préféré.',
  };
}
