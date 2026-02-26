import type {
  Payslip,
  PayslipEntry,
  PayslipFilters,
  PayslipGenerationRequest,
  PayslipGenerationResponse,
  PayslipSummary,
} from '@/types/payslip';

const API_BASE_URL = process.env.NEXT_PUBLIC_PAYSLIP_API_URL || '/api/payslips';

class PayslipApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `API Error: ${response.statusText}`);
    }

    return response.json();
  }

  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  async getPayslips(filters?: PayslipFilters): Promise<Payslip[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.employeeId) queryParams.append('employeeId', filters.employeeId);
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.period) queryParams.append('period', filters.period);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);
    if (filters?.search) queryParams.append('search', filters.search);

    const queryString = queryParams.toString();
    return this.request<Payslip[]>(queryString ? `?${queryString}` : '');
  }

  async getPayslipById(id: string): Promise<Payslip> {
    return this.request<Payslip>(`/${id}`);
  }

  async getPayslipByNumber(number: string): Promise<Payslip> {
    return this.request<Payslip>(`/number/${encodeURIComponent(number)}`);
  }

  async getEmployeePayslips(
    employeeId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Payslip[]> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const queryString = queryParams.toString();
    return this.request<Payslip[]>(`/employee/${employeeId}${queryString ? `?${queryString}` : ''}`);
  }

  async getVenuePayslips(
    venueId: string,
    filters?: PayslipFilters
  ): Promise<Payslip[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.period) queryParams.append('period', filters.period);
    if (filters?.startDate) queryParams.append('startDate', filters.startDate);
    if (filters?.endDate) queryParams.append('endDate', filters.endDate);

    const queryString = queryParams.toString();
    return this.request<Payslip[]>(`/venue/${venueId}${queryString ? `?${queryString}` : ''}`);
  }

  async getPayslipSummary(
    venueId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<PayslipSummary> {
    const queryParams = new URLSearchParams();
    if (venueId) queryParams.append('venueId', venueId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const queryString = queryParams.toString();
    return this.request<PayslipSummary>(`/summary${queryString ? `?${queryString}` : ''}`);
  }

  async generatePayslip(
    request: PayslipGenerationRequest
  ): Promise<PayslipGenerationResponse> {
    return this.request<PayslipGenerationResponse>('/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async generateMultiplePayslips(
    requests: PayslipGenerationRequest[]
  ): Promise<PayslipGenerationResponse[]> {
    return this.request<PayslipGenerationResponse[]>('/generate/batch', {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }

  async regeneratePayslip(id: string): Promise<PayslipGenerationResponse> {
    return this.request<PayslipGenerationResponse>(`/${id}/regenerate`, {
      method: 'POST',
    });
  }

  async updatePayslipStatus(
    id: string,
    status: 'PAID' | 'PENDING' | 'FAILED'
  ): Promise<Payslip> {
    return this.request<Payslip>(`/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async downloadPayslipPdf(id: string): Promise<Blob> {
    const token = this.getAuthToken();
    const response = await fetch(`${this.baseUrl}/${id}/pdf`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    return response.blob();
  }

  async getPayslipPdfUrl(id: string): Promise<string> {
    const payslip = await this.getPayslipById(id);
    if (!payslip.pdfUrl) {
      throw new Error('No PDF URL available for this payslip');
    }
    return payslip.pdfUrl;
  }

  async deletePayslip(id: string): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: 'DELETE',
    });
  }

  async restorePayslip(id: string): Promise<Payslip> {
    return this.request<Payslip>(`/${id}/restore`, {
      method: 'POST',
    });
  }

  async getAvailablePeriods(venueId?: string): Promise<string[]> {
    const queryString = venueId ? `?venueId=${venueId}` : '';
    return this.request<string[]>(`/periods${queryString}`);
  }

  async validatePayslipData(
    data: Partial<PayslipGenerationRequest>
  ): Promise<{ valid: boolean; errors: string[] }> {
    return this.request<{ valid: boolean; errors: string[] }>('/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPayslipEntries(id: string): Promise<PayslipEntry[]> {
    return this.request<PayslipEntry[]>(`/${id}/entries`);
  }
}

export const payslipApi = new PayslipApiService();
export default PayslipApiService;
