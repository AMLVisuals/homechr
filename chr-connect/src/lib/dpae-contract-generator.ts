import { DPAEDeclaration } from '@/types/dpae';
import { generateContractHTML } from '@/services/dpaeService';

/**
 * Generate and download a CDD contract as HTML (printable to PDF via browser)
 */
export function downloadContract(declaration: DPAEDeclaration): void {
  const html = generateContractHTML(declaration);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `contrat-cdd-${declaration.employeeLastName}-${declaration.employeeFirstName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open contract in a new window for printing (generates PDF via browser print dialog)
 */
export function printContract(declaration: DPAEDeclaration): void {
  const html = generateContractHTML(declaration);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    // Auto-trigger print after a short delay
    setTimeout(() => win.print(), 500);
  }
}
