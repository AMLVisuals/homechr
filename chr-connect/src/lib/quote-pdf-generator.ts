// ============================================================================
// QUOTE PDF GENERATOR
// ============================================================================
// Générateur de PDF professionnel pour les devis ConnectCHR
// Utilise jsPDF pour la génération côté client

import type { FinalQuote } from '@/components/provider/QuoteBuilderUltimate';

// ============================================================================
// TYPES
// ============================================================================

export interface PDFGeneratorOptions {
  includeAnalysis?: boolean;
  includeTrustScore?: boolean;
  watermark?: boolean;
  language?: 'fr' | 'en';
  logo?: string; // Base64 encoded logo
}

export interface PDFColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  text: string;
  textLight: string;
  border: string;
  background: string;
}

// ============================================================================
// DEFAULT COLORS
// ============================================================================

const DEFAULT_COLORS: PDFColors = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#1e293b',
  textLight: '#64748b',
  border: '#e2e8f0',
  background: '#f8fafc',
};

// ============================================================================
// PDF STRUCTURE (For React PDF / Server-side generation)
// ============================================================================

export interface QuotePDFData {
  quote: FinalQuote;
  options: PDFGeneratorOptions;
}

// ============================================================================
// FORMAT HELPERS
// ============================================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ============================================================================
// TRUST LEVEL HELPERS
// ============================================================================

export function getTrustLevelInfo(level: string): { label: string; color: string; emoji: string } {
  switch (level) {
    case 'EXCELLENT':
      return { label: 'Excellent', color: DEFAULT_COLORS.success, emoji: '★★★★★' };
    case 'GOOD':
      return { label: 'Bon', color: '#84cc16', emoji: '★★★★☆' };
    case 'FAIR':
      return { label: 'Correct', color: DEFAULT_COLORS.warning, emoji: '★★★☆☆' };
    case 'HIGH':
      return { label: 'Élevé', color: '#f97316', emoji: '★★☆☆☆' };
    case 'SUSPICIOUS':
      return { label: 'Suspect', color: DEFAULT_COLORS.danger, emoji: '★☆☆☆☆' };
    default:
      return { label: 'Non évalué', color: DEFAULT_COLORS.secondary, emoji: '☆☆☆☆☆' };
  }
}

// ============================================================================
// HTML TEMPLATE FOR PDF (Using html2pdf or similar)
// ============================================================================

export function generateQuoteHTML(quote: FinalQuote, options: PDFGeneratorOptions = {}): string {
  const trustInfo = getTrustLevelInfo(quote.trustLevel);
  const showTrustScore = options.includeTrustScore !== false;
  const showAnalysis = options.includeAnalysis !== false;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Devis ${quote.reference}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.5;
      color: ${DEFAULT_COLORS.text};
      background: white;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm;
      margin: 0 auto;
      background: white;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 15px;
      border-bottom: 2px solid ${DEFAULT_COLORS.primary};
      margin-bottom: 20px;
    }

    .logo-section {
      flex: 1;
    }

    .logo {
      font-size: 24pt;
      font-weight: bold;
      color: ${DEFAULT_COLORS.primary};
    }

    .logo-subtitle {
      font-size: 8pt;
      color: ${DEFAULT_COLORS.textLight};
      margin-top: 2px;
    }

    .quote-info {
      text-align: right;
    }

    .quote-reference {
      font-size: 14pt;
      font-weight: bold;
      color: ${DEFAULT_COLORS.primary};
    }

    .quote-date {
      font-size: 9pt;
      color: ${DEFAULT_COLORS.textLight};
      margin-top: 5px;
    }

    .parties {
      display: flex;
      justify-content: space-between;
      gap: 30px;
      margin-bottom: 25px;
    }

    .party {
      flex: 1;
      padding: 15px;
      background: ${DEFAULT_COLORS.background};
      border-radius: 8px;
      border: 1px solid ${DEFAULT_COLORS.border};
    }

    .party-title {
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
      color: ${DEFAULT_COLORS.textLight};
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .party-name {
      font-size: 12pt;
      font-weight: bold;
      color: ${DEFAULT_COLORS.text};
      margin-bottom: 5px;
    }

    .party-detail {
      font-size: 9pt;
      color: ${DEFAULT_COLORS.textLight};
      margin-top: 2px;
    }

    .trust-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 15px;
      background: linear-gradient(135deg, ${trustInfo.color}15, ${trustInfo.color}08);
      border: 1px solid ${trustInfo.color}40;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .trust-score {
      font-size: 18pt;
      font-weight: bold;
      color: ${trustInfo.color};
    }

    .trust-label {
      font-size: 9pt;
      color: ${DEFAULT_COLORS.textLight};
    }

    .trust-stars {
      font-size: 12pt;
      color: ${trustInfo.color};
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }

    .items-table th {
      background: ${DEFAULT_COLORS.primary};
      color: white;
      padding: 10px 8px;
      text-align: left;
      font-size: 8pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    .items-table th:first-child {
      border-radius: 6px 0 0 0;
    }

    .items-table th:last-child {
      border-radius: 0 6px 0 0;
      text-align: right;
    }

    .items-table td {
      padding: 10px 8px;
      border-bottom: 1px solid ${DEFAULT_COLORS.border};
      font-size: 9pt;
    }

    .items-table tr:nth-child(even) {
      background: ${DEFAULT_COLORS.background};
    }

    .item-type {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: bold;
      text-transform: uppercase;
    }

    .item-type.PART { background: #dbeafe; color: #1d4ed8; }
    .item-type.LABOR { background: #fef3c7; color: #92400e; }
    .item-type.TRAVEL { background: #d1fae5; color: #065f46; }
    .item-type.OTHER { background: #f3e8ff; color: #7c3aed; }

    .item-description {
      font-weight: 500;
    }

    .item-reference {
      font-size: 8pt;
      color: ${DEFAULT_COLORS.textLight};
      margin-top: 2px;
    }

    .item-price {
      text-align: right;
      font-weight: 500;
    }

    .ai-verified {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 7pt;
      color: ${DEFAULT_COLORS.success};
      margin-left: 5px;
    }

    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 25px;
    }

    .totals-table {
      width: 250px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 9pt;
    }

    .totals-row.separator {
      border-top: 1px solid ${DEFAULT_COLORS.border};
      margin-top: 5px;
      padding-top: 10px;
    }

    .totals-row.total {
      font-size: 14pt;
      font-weight: bold;
      color: ${DEFAULT_COLORS.primary};
      border-top: 2px solid ${DEFAULT_COLORS.primary};
      margin-top: 5px;
      padding-top: 10px;
    }

    .terms-section {
      padding: 15px;
      background: ${DEFAULT_COLORS.background};
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .terms-title {
      font-size: 10pt;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .terms-content {
      font-size: 8pt;
      color: ${DEFAULT_COLORS.textLight};
    }

    .signature-section {
      margin-top: 30px;
      padding: 20px;
      border: 2px solid ${DEFAULT_COLORS.success};
      border-radius: 8px;
      background: ${DEFAULT_COLORS.success}08;
    }

    .signature-title {
      font-size: 10pt;
      font-weight: bold;
      color: ${DEFAULT_COLORS.success};
      margin-bottom: 15px;
    }

    .signature-grid {
      display: flex;
      justify-content: space-between;
      gap: 30px;
    }

    .signature-info {
      flex: 1;
    }

    .signature-label {
      font-size: 8pt;
      color: ${DEFAULT_COLORS.textLight};
      margin-bottom: 3px;
    }

    .signature-value {
      font-size: 9pt;
      font-weight: 500;
    }

    .signature-image {
      width: 150px;
      height: 60px;
      border: 1px solid ${DEFAULT_COLORS.border};
      border-radius: 4px;
      background: white;
    }

    .signature-image img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      background: ${DEFAULT_COLORS.success};
      color: white;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: bold;
    }

    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid ${DEFAULT_COLORS.border};
      text-align: center;
      font-size: 7pt;
      color: ${DEFAULT_COLORS.textLight};
    }

    .footer-logo {
      font-weight: bold;
      color: ${DEFAULT_COLORS.primary};
    }

    .validity {
      padding: 10px 15px;
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      border-radius: 0 4px 4px 0;
      margin-bottom: 20px;
      font-size: 9pt;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page {
        padding: 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="logo">ConnectCHR</div>
        <div class="logo-subtitle">Plateforme HORECA de confiance</div>
      </div>
      <div class="quote-info">
        <div class="quote-reference">DEVIS ${quote.reference}</div>
        <div class="quote-date">
          Créé le ${formatDate(quote.createdAt)}<br>
          Valide jusqu'au ${formatDate(quote.validUntil)}
        </div>
      </div>
    </div>

    <!-- Parties -->
    <div class="parties">
      <div class="party">
        <div class="party-title">Prestataire</div>
        <div class="party-name">${quote.provider.name}</div>
        ${quote.provider.siret ? `<div class="party-detail">SIRET: ${quote.provider.siret}</div>` : ''}
        ${quote.provider.address ? `<div class="party-detail">${quote.provider.address}</div>` : ''}
        ${quote.provider.phone ? `<div class="party-detail">Tel: ${quote.provider.phone}</div>` : ''}
        ${quote.provider.email ? `<div class="party-detail">${quote.provider.email}</div>` : ''}
      </div>
      <div class="party">
        <div class="party-title">Client</div>
        <div class="party-name">${quote.client.name}</div>
        <div class="party-detail" style="font-weight: 500;">${quote.client.establishmentName}</div>
        ${quote.client.siret ? `<div class="party-detail">SIRET: ${quote.client.siret}</div>` : ''}
        ${quote.client.establishmentAddress ? `<div class="party-detail">${quote.client.establishmentAddress}</div>` : ''}
        ${quote.client.phone ? `<div class="party-detail">Tel: ${quote.client.phone}</div>` : ''}
      </div>
    </div>

    ${showTrustScore ? `
    <!-- Trust Score -->
    <div class="trust-badge">
      <div class="trust-score">${quote.trustScore}/100</div>
      <div>
        <div class="trust-stars">${trustInfo.emoji}</div>
        <div class="trust-label">Score de confiance: ${trustInfo.label}</div>
      </div>
    </div>
    ` : ''}

    <!-- Validity Notice -->
    <div class="validity">
      <strong>Validité:</strong> Ce devis est valable jusqu'au ${formatDate(quote.validUntil)}.
      Passé cette date, les prix peuvent être révisés.
    </div>

    <!-- Items Table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 40%">Description</th>
          <th style="width: 10%">Qté</th>
          <th style="width: 15%">PU HT</th>
          <th style="width: 10%">TVA</th>
          <th style="width: 10%">Remise</th>
          <th style="width: 15%">Total HT</th>
        </tr>
      </thead>
      <tbody>
        ${quote.items.map(item => {
          const lineTotal = item.quantity * item.unitPriceHT * (1 - (item.discount || 0) / 100);
          return `
          <tr>
            <td>
              <span class="item-type ${item.type}">${item.type === 'PART' ? 'Pièce' : item.type === 'LABOR' ? 'M.O.' : item.type === 'TRAVEL' ? 'Dépl.' : 'Autre'}</span>
              <div class="item-description">${item.description}</div>
              ${item.reference ? `<div class="item-reference">Réf: ${item.reference} ${item.brand ? `| ${item.brand}` : ''}</div>` : ''}
              ${item.aiVerified ? '<span class="ai-verified">✓ Vérifié IA</span>' : ''}
            </td>
            <td>${item.quantity} ${item.unit}</td>
            <td>${formatCurrency(item.unitPriceHT)}</td>
            <td>${(item.tvaRate * 100).toFixed(0)}%</td>
            <td>${item.discount ? `-${item.discount}%` : '-'}</td>
            <td class="item-price">${formatCurrency(lineTotal)}</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals">
      <div class="totals-table">
        <div class="totals-row">
          <span>Sous-total HT</span>
          <span>${formatCurrency(quote.subtotalHT)}</span>
        </div>
        ${quote.globalDiscount > 0 ? `
        <div class="totals-row">
          <span>Remise globale</span>
          <span>-${formatCurrency(quote.subtotalHT - quote.subtotalAfterDiscount)}</span>
        </div>
        ` : ''}
        <div class="totals-row separator">
          <span>Total HT</span>
          <span>${formatCurrency(quote.subtotalAfterDiscount)}</span>
        </div>
        <div class="totals-row">
          <span>TVA</span>
          <span>${formatCurrency(quote.totalTVA)}</span>
        </div>
        <div class="totals-row total">
          <span>TOTAL TTC</span>
          <span>${formatCurrency(quote.totalTTC)}</span>
        </div>
        ${quote.deposit ? `
        <div class="totals-row">
          <span>Acompte (${quote.depositPercent}%)</span>
          <span>${formatCurrency(quote.deposit)}</span>
        </div>
        ` : ''}
      </div>
    </div>

    <!-- Terms -->
    <div class="terms-section">
      <div class="terms-title">Conditions de paiement</div>
      <div class="terms-content">
        ${quote.paymentTerms}
        ${quote.publicNotes ? `<br><br><strong>Notes:</strong> ${quote.publicNotes}` : ''}
      </div>
    </div>

    ${quote.signature.signed ? `
    <!-- Signature -->
    <div class="signature-section">
      <div class="signature-title">✓ Devis signé électroniquement</div>
      <div class="signature-grid">
        <div class="signature-info">
          <div class="signature-label">Signé par</div>
          <div class="signature-value">${quote.signature.signedBy || quote.client.name}</div>

          <div class="signature-label" style="margin-top: 10px;">Date de signature</div>
          <div class="signature-value">${quote.signature.signedAt ? formatDateTime(quote.signature.signedAt) : '-'}</div>

          ${quote.signature.phoneVerified ? `
          <div style="margin-top: 10px;">
            <div class="verified-badge">✓ Vérifié par SMS</div>
          </div>
          ` : ''}
        </div>
        ${quote.signature.signatureImage ? `
        <div class="signature-image">
          <img src="${quote.signature.signatureImage}" alt="Signature" />
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">ConnectCHR</div>
      <p>Document généré automatiquement - Valeur juridique selon conditions générales</p>
      <p>www.home-chr.fr | contact@home-chr.fr</p>
    </div>
  </div>
</body>
</html>
`;
}

// ============================================================================
// PRINT FUNCTION
// ============================================================================

export function printQuote(quote: FinalQuote, options?: PDFGeneratorOptions): void {
  const html = generateQuoteHTML(quote, options);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

// ============================================================================
// DOWNLOAD AS HTML (pour conversion PDF ultérieure)
// ============================================================================

export function downloadQuoteHTML(quote: FinalQuote, options?: PDFGeneratorOptions): void {
  const html = generateQuoteHTML(quote, options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `Devis_${quote.reference}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// EXPORT DATA AS JSON
// ============================================================================

export function exportQuoteJSON(quote: FinalQuote): void {
  const json = JSON.stringify(quote, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `Devis_${quote.reference}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
