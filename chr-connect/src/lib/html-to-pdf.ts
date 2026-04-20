import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface HtmlToPdfOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  marginMm?: number;
}

/**
 * Convertit une chaîne HTML en Blob PDF (A4 par défaut).
 * Utilise html2canvas (pour rendre le DOM) + jsPDF (pour créer le PDF).
 */
export async function htmlToPdfBlob(html: string, opts: HtmlToPdfOptions = {}): Promise<Blob> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // A4 width at 96 DPI
  container.style.background = '#ffffff';
  container.style.color = '#000000';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF({
      orientation: opts.orientation || 'portrait',
      unit: 'mm',
      format: opts.format || 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = opts.marginMm ?? 10;
    const usableWidth = pageWidth - margin * 2;
    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/png');

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    } else {
      // Split en plusieurs pages
      let y = 0;
      const pageUsableHeight = pageHeight - margin * 2;
      while (y < imgHeight) {
        if (y > 0) pdf.addPage();
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          margin - y,
          imgWidth,
          imgHeight
        );
        y += pageUsableHeight;
      }
    }

    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Convertit un Blob en string base64 (pour envoi API).
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Conversion base64 échouée'));
        return;
      }
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function htmlToPdfBase64(html: string, opts?: HtmlToPdfOptions): Promise<string> {
  const blob = await htmlToPdfBlob(html, opts);
  return blobToBase64(blob);
}
