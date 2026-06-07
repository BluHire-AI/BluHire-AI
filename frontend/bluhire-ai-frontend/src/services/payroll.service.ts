import { api } from '@/lib/api';

export interface PayrollRun {
  _id: string;
  month: number;
  year: number;
  status: 'PENDING' | 'GENERATED' | 'UNDER_REVIEW' | 'APPROVED' | 'PAID';
  isLocked: boolean;
  totalCost: number;
  employeesCount: number;
  processedBy?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PayrollItem {
  _id: string;
  payrollRunId: string;
  employeeId: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    email: string;
  };
  baseSalary: number;
  allowancesAmount: number;
  bonusesAmount: number;
  overtimeAmount: number;
  deductionsAmount: number;
  taxableIncome: number;
  taxAmount: number;
  netSalary: number;
  isLocked: boolean;
  attendance: {
    workedDays: number;
    absentDays: number;
    leaveDays: number;
    overtimeHours: number;
    attendancePercentage: number;
  };
}

export interface Payslip {
  _id: string;
  payrollId: string;
  employeeId: any;
  month: number;
  year: number;
  payslipCode: string;
  salarySnapshot: {
    employeeName: string;
    employeeCode: string;
    baseSalary: number;
    hra: number;
    medical: number;
    travel: number;
    special: number;
    otherAllowance: number;
    bonuses: number;
    pf: number;
    insurance: number;
    deductions: number;
    taxableIncome: number;
    taxAmount: number;
    grossSalary: number;
    netSalary: number;
  };
  createdAt: string;
}

export interface TaxSlab {
  minIncome: number;
  maxIncome: number;
  taxRate: number;
}

export interface TaxConfig {
  _id: string;
  financialYear: string;
  slabs: TaxSlab[];
  isActive: boolean;
  createdAt: string;
}

export const payrollService = {
  getRuns: async (): Promise<PayrollRun[]> => {
    const res = await api.get('/payroll/runs');
    return res.data.data || [];
  },

  generateRun: async (month: number, year: number): Promise<PayrollRun> => {
    const res = await api.post('/payroll/generate', { month, year });
    return res.data.data;
  },

  submitForReview: async (runId: string): Promise<PayrollRun> => {
    const res = await api.post(`/payroll/runs/${runId}/review`);
    return res.data.data;
  },

  approveRun: async (runId: string): Promise<PayrollRun> => {
    const res = await api.post(`/payroll/runs/${runId}/approve`);
    return res.data.data;
  },

  payRun: async (runId: string): Promise<PayrollRun> => {
    const res = await api.post(`/payroll/runs/${runId}/pay`);
    return res.data.data;
  },

  getItems: async (runId: string): Promise<PayrollItem[]> => {
    const res = await api.get('/payroll/items', { params: { runId } });
    return res.data.data || [];
  },

  getSalaryStructure: async (employeeId: string) => {
    const res = await api.get(`/payroll/salary-structure/${employeeId}`);
    return res.data.data;
  },

  updateSalaryStructure: async (employeeId: string, data: any) => {
    const res = await api.post(`/payroll/salary-structure/${employeeId}`, data);
    return res.data.data;
  },

  addBonus: async (data: any) => {
    const res = await api.post('/payroll/bonus', data);
    return res.data.data;
  },

  getBonuses: async (employeeId?: string): Promise<any[]> => {
    const res = await api.get('/payroll/bonus', { params: { employeeId } });
    return res.data.data || [];
  },

  addDeduction: async (data: any) => {
    const res = await api.post('/payroll/deduction', data);
    return res.data.data;
  },

  getDeductions: async (employeeId?: string): Promise<any[]> => {
    const res = await api.get('/payroll/deduction', { params: { employeeId } });
    return res.data.data || [];
  },


  getHistory: async (employeeId?: string): Promise<any[]> => {
    const res = await api.get('/payroll/history', { params: { employeeId } });
    return res.data.data || [];
  },

  getPayslips: async (employeeId?: string): Promise<Payslip[]> => {
    const res = await api.get('/payslips', { params: { employeeId } });
    return res.data.data || [];
  },

  getPayslip: async (id: string): Promise<Payslip> => {
    const res = await api.get(`/payslips/${id}`);
    return res.data.data;
  },

  getTaxConfigs: async (): Promise<TaxConfig[]> => {
    const res = await api.get('/payroll/tax-config');
    return res.data.data || [];
  },

  createTaxConfig: async (data: any): Promise<TaxConfig> => {
    const res = await api.post('/payroll/tax-config', data);
    return res.data.data;
  },

  updateTaxConfig: async (id: string, data: any): Promise<TaxConfig> => {
    const res = await api.put(`/payroll/tax-config/${id}`, data);
    return res.data.data;
  },

  getAnalytics: async (): Promise<any> => {
    const res = await api.get('/payroll/analytics');
    return res.data.data;
  },
};
