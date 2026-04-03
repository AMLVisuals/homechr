import type {
  Payslip,
  PayslipEntry,
  PayslipFilters,
  PayslipGenerationRequest,
  PayslipGenerationResponse,
  PayslipSummary,
} from '@/types/payslip';

const mockPayslips: Payslip[] = [
  {
    id: 'ps1',
    number: 'BP-2024-001',
    employeeId: 'emp1',
    employeeName: 'Marie Dupont',
    venueId: 'v1',
    period: 'Juin 2024',
    periodType: 'MONTHLY',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    issueDate: '2024-06-15',
    grossAmount: 2100,
    netAmount: 1723,
    taxAmount: 280,
    socialSecurity: 97,
    status: 'PAID',
    type: 'STANDARD',
    hoursWorked: 151.67,
    hourlyRate: 13.84,
    overtimeHours: 0,
    overtimeRate: 0,
    pdfUrl: '#',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  },
  {
    id: 'ps2',
    number: 'BP-2024-002',
    employeeId: 'emp2',
    employeeName: 'Pierre Martin',
    venueId: 'v1',
    period: 'Juin 2024',
    periodType: 'MONTHLY',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    issueDate: '2024-06-15',
    grossAmount: 2350,
    netAmount: 1928,
    taxAmount: 315,
    socialSecurity: 107,
    status: 'PAID',
    type: 'STANDARD',
    hoursWorked: 169.67,
    hourlyRate: 13.84,
    overtimeHours: 8,
    overtimeRate: 17.30,
    pdfUrl: '#',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  },
  {
    id: 'ps3',
    number: 'BP-2024-003',
    employeeId: 'emp3',
    employeeName: 'Sophie Bernard',
    venueId: 'v1',
    period: 'Juin 2024',
    periodType: 'MONTHLY',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    issueDate: '2024-06-15',
    grossAmount: 1950,
    netAmount: 1600,
    taxAmount: 260,
    socialSecurity: 90,
    status: 'PAID',
    type: 'STANDARD',
    hoursWorked: 140.89,
    hourlyRate: 13.84,
    overtimeHours: 0,
    overtimeRate: 0,
    pdfUrl: '#',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  },
  {
    id: 'ps4',
    number: 'BP-2024-004',
    employeeId: 'emp4',
    employeeName: 'Lucas Petit',
    venueId: 'v1',
    period: 'Juin 2024',
    periodType: 'MONTHLY',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    issueDate: '2024-06-15',
    grossAmount: 2450,
    netAmount: 2011,
    taxAmount: 328,
    socialSecurity: 111,
    status: 'PENDING',
    type: 'STANDARD',
    hoursWorked: 176.97,
    hourlyRate: 13.84,
    overtimeHours: 12,
    overtimeRate: 17.30,
    pdfUrl: '#',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-06-15T10:00:00Z',
  },
  {
    id: 'ps5',
    number: 'BP-2024-005',
    employeeId: 'emp1',
    employeeName: 'Marie Dupont',
    venueId: 'v1',
    period: 'Mai 2024',
    periodType: 'MONTHLY',
    startDate: '2024-05-01',
    endDate: '2024-05-31',
    issueDate: '2024-05-15',
    grossAmount: 2100,
    netAmount: 1723,
    taxAmount: 280,
    socialSecurity: 97,
    status: 'PAID',
    type: 'STANDARD',
    hoursWorked: 151.67,
    hourlyRate: 13.84,
    overtimeHours: 0,
    overtimeRate: 0,
    pdfUrl: '#',
    createdAt: '2024-05-15T10:00:00Z',
    updatedAt: '2024-05-15T10:00:00Z',
  },
  {
    id: 'ps6',
    number: 'BP-2024-006',
    employeeId: 'emp2',
    employeeName: 'Pierre Martin',
    venueId: 'v1',
    period: 'Mai 2024',
    periodType: 'MONTHLY',
    startDate: '2024-05-01',
    endDate: '2024-05-31',
    issueDate: '2024-05-15',
    grossAmount: 2200,
    netAmount: 1806,
    taxAmount: 295,
    socialSecurity: 99,
    status: 'PAID',
    type: 'STANDARD',
    hoursWorked: 158.89,
    hourlyRate: 13.84,
    overtimeHours: 4,
    overtimeRate: 17.30,
    pdfUrl: '#',
    createdAt: '2024-05-15T10:00:00Z',
    updatedAt: '2024-05-15T10:00:00Z',
  },
];

const mockPayslipEntries: PayslipEntry[] = [
  {
    id: 'entry1',
    label: 'Heures normales',
    hours: 151.67,
    rate: 13.84,
    amount: 2099.15,
    type: 'WORK',
  },
  {
    id: 'entry2',
    label: 'Heures supplémentaires',
    hours: 8,
    rate: 17.30,
    amount: 138.40,
    type: 'OVERTIME',
  },
  {
    id: 'entry3',
    label: 'Prime de performance',
    hours: undefined,
    rate: 0,
    amount: 100,
    type: 'BONUS',
  },
];

class MockPayslipApiService {
  private payslips: Payslip[] = [];
  private entries: PayslipEntry[] = [];

  private delay(ms: number = 500): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getPayslips(filters?: PayslipFilters): Promise<Payslip[]> {
    await this.delay(300);

    let filtered = [...this.payslips.filter((p) => !p.isDeleted)];

    if (filters) {
      if (filters.employeeId) {
        filtered = filtered.filter((p) => p.employeeId === filters.employeeId);
      }
      if (filters.status) {
        filtered = filtered.filter((p) => p.status === filters.status);
      }
      if (filters.period) {
        filtered = filtered.filter((p) => p.period === filters.period);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.employeeName.toLowerCase().includes(search) ||
            p.number.toLowerCase().includes(search)
        );
      }
    }

    return filtered.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }

  async getPayslipById(id: string): Promise<Payslip> {
    await this.delay(200);
    const payslip = this.payslips.find((p) => p.id === id);
    if (!payslip) {
      throw new Error(`Payslip not found: ${id}`);
    }
    return payslip;
  }

  async getPayslipByNumber(number: string): Promise<Payslip> {
    await this.delay(200);
    const payslip = this.payslips.find((p) => p.number === number);
    if (!payslip) {
      throw new Error(`Payslip not found: ${number}`);
    }
    return payslip;
  }

  async getEmployeePayslips(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Payslip[]> {
    await this.delay(300);
    let filtered = this.payslips.filter((p) => p.employeeId === employeeId && !p.isDeleted);

    if (startDate) {
      filtered = filtered.filter((p) => p.startDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((p) => p.endDate <= endDate);
    }

    return filtered.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }

  async getVenuePayslips(
    venueId: string,
    filters?: PayslipFilters
  ): Promise<Payslip[]> {
    await this.delay(300);
    let filtered = this.payslips.filter((p) => p.venueId === venueId && !p.isDeleted);

    if (filters?.status) {
      filtered = filtered.filter((p) => p.status === filters.status);
    }
    if (filters?.period) {
      filtered = filtered.filter((p) => p.period === filters.period);
    }

    return filtered.sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  }

  async getPayslipSummary(
    venueId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PayslipSummary> {
    await this.delay(200);

    let filtered = [...this.payslips.filter((p) => !p.isDeleted)];

    if (venueId) {
      filtered = filtered.filter((p) => p.venueId === venueId);
    }
    if (startDate) {
      filtered = filtered.filter((p) => p.startDate >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter((p) => p.endDate <= endDate);
    }

    const totalGross = filtered.reduce((sum, p) => sum + p.grossAmount, 0);
    const totalNet = filtered.reduce((sum, p) => sum + p.netAmount, 0);
    const totalTax = filtered.reduce((sum, p) => sum + p.taxAmount, 0);
    const totalSocialSecurity = filtered.reduce((sum, p) => sum + p.socialSecurity, 0);
    const totalPaid = filtered.filter((p) => p.status === 'PAID').reduce((sum, p) => sum + p.netAmount, 0);
    const totalPending = filtered.filter((p) => p.status === 'PENDING').reduce((sum, p) => sum + p.netAmount, 0);
    const totalFailed = filtered.filter((p) => p.status === 'FAILED').reduce((sum, p) => sum + p.netAmount, 0);

    return {
      totalGross,
      totalNet,
      totalTax,
      totalSocialSecurity,
      totalPaid,
      totalPending,
      totalFailed,
      count: filtered.length,
    };
  }

  async generatePayslip(
    request: PayslipGenerationRequest
  ): Promise<PayslipGenerationResponse> {
    await this.delay(1000);

    const newPayslip: Payslip = {
      id: `ps${Date.now()}`,
      number: `BP-${new Date().getFullYear()}-${String(this.payslips.length + 1).padStart(3, '0')}`,
      employeeId: request.employeeId,
      employeeName: request.employeeName,
      venueId: request.venueId,
      period: request.startDate.substring(0, 7),
      periodType: request.periodType,
      startDate: request.startDate,
      endDate: request.endDate,
      issueDate: new Date().toISOString().split('T')[0],
      grossAmount: (request.hoursWorked || 0) * (request.hourlyRate || 0) + (request.overtimeHours || 0) * (request.overtimeRate || 0),
      netAmount: Math.round(((request.hoursWorked || 0) * (request.hourlyRate || 0) + (request.overtimeHours || 0) * (request.overtimeRate || 0)) * 0.82),
      taxAmount: Math.round(((request.hoursWorked || 0) * (request.hourlyRate || 0) + (request.overtimeHours || 0) * (request.overtimeRate || 0)) * 0.13),
      socialSecurity: Math.round(((request.hoursWorked || 0) * (request.hourlyRate || 0) + (request.overtimeHours || 0) * (request.overtimeRate || 0)) * 0.05),
      status: 'PROCESSING',
      type: 'STANDARD',
      hoursWorked: request.hoursWorked,
      hourlyRate: request.hourlyRate,
      overtimeHours: request.overtimeHours,
      overtimeRate: request.overtimeRate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.payslips.push(newPayslip);

    return {
      success: true,
      payslipId: newPayslip.id,
      message: 'Payslip generated successfully',
      externalReference: `EXT-${Date.now()}`,
    };
  }

  async generateMultiplePayslips(
    requests: PayslipGenerationRequest[]
  ): Promise<PayslipGenerationResponse[]> {
    await this.delay(2000);

    return Promise.all(
      requests.map((request) => this.generatePayslip(request))
    );
  }

  async regeneratePayslip(id: string): Promise<PayslipGenerationResponse> {
    await this.delay(1000);

    const payslip = this.payslips.find((p) => p.id === id);
    if (!payslip) {
      throw new Error(`Payslip not found: ${id}`);
    }

    payslip.status = 'PROCESSING';
    payslip.updatedAt = new Date().toISOString();

    return {
      success: true,
      payslipId: payslip.id,
      message: 'Payslip regeneration initiated',
      externalReference: `EXT-REGEN-${Date.now()}`,
    };
  }

  async updatePayslipStatus(
    id: string,
    status: 'PAID' | 'PENDING' | 'FAILED'
  ): Promise<Payslip> {
    await this.delay(300);

    const payslip = this.payslips.find((p) => p.id === id);
    if (!payslip) {
      throw new Error(`Payslip not found: ${id}`);
    }

    payslip.status = status;
    payslip.updatedAt = new Date().toISOString();

    return payslip;
  }

  async downloadPayslipPdf(id: string): Promise<Blob> {
    await this.delay(500);

    const payslip = this.payslips.find((p) => p.id === id);
    if (!payslip) {
      throw new Error(`Payslip not found: ${id}`);
    }

    return new Blob([`Payslip PDF for ${payslip.number}`], { type: 'application/pdf' });
  }

  async getPayslipPdfUrl(id: string): Promise<string> {
    await this.delay(200);

    const payslip = this.payslips.find((p) => p.id === id);
    if (!payslip) {
      throw new Error(`Payslip not found: ${id}`);
    }

    return payslip.pdfUrl || '#';
  }

  async deletePayslip(id: string): Promise<void> {
    await this.delay(300);

    const payslip = this.payslips.find((p) => p.id === id);
    if (!payslip) {
      throw new Error(`Payslip not found: ${id}`);
    }

    payslip.isDeleted = true;
    payslip.deletedAt = new Date().toISOString();
    payslip.updatedAt = new Date().toISOString();
  }

  async restorePayslip(id: string): Promise<Payslip> {
    await this.delay(300);

    const payslip = this.payslips.find((p) => p.id === id);
    if (!payslip) {
      throw new Error(`Payslip not found: ${id}`);
    }

    payslip.isDeleted = false;
    payslip.deletedAt = undefined;
    payslip.updatedAt = new Date().toISOString();

    return payslip;
  }

  async getAvailablePeriods(venueId?: string): Promise<string[]> {
    await this.delay(200);

    const periods = [...new Set(this.payslips.map((p) => p.period))];
    return periods.sort().reverse();
  }

  async validatePayslipData(
    data: Partial<PayslipGenerationRequest>
  ): Promise<{ valid: boolean; errors: string[] }> {
    await this.delay(200);

    const errors: string[] = [];

    if (!data.employeeId) {
      errors.push('Employee ID is required');
    }
    if (!data.employeeName) {
      errors.push('Employee name is required');
    }
    if (!data.venueId) {
      errors.push('Venue ID is required');
    }
    if (!data.startDate) {
      errors.push('Start date is required');
    }
    if (!data.endDate) {
      errors.push('End date is required');
    }
    if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
      errors.push('Start date must be before end date');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getPayslipEntries(id: string): Promise<PayslipEntry[]> {
    await this.delay(200);
    return [...this.entries];
  }
}

export const mockPayslipApi = new MockPayslipApiService();
export default MockPayslipApiService;
