'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { payrollService, Payslip } from '@/services/payroll.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Search, Printer, Download, Eye, 
  Calendar, User, DollarSign, ArrowLeft, Building, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function fmtAmt(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
}

export default function PayslipsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  const loadPayslips = useCallback(async () => {
    setLoading(true);
    try {
      // If employee, backend automatically scopes or we pass employeeId.
      // payrollService.getPayslips takes employeeId as optional parameter
      const data = await payrollService.getPayslips();
      setPayslips(data || []);
    } catch (err) {
      console.error('Failed to load payslips', err);
      toast.error('Failed to load payslips list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  const handlePrint = () => {
    window.print();
  };

  // Filtered payslips
  const filteredPayslips = payslips.filter(ps => {
    const matchesSearch = isHR 
      ? (
          ps.salarySnapshot?.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ps.salarySnapshot?.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ps.payslipCode?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : ps.payslipCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMonth = selectedMonth === 'all' ? true : ps.month === parseInt(selectedMonth);
    const matchesYear = selectedYear === 'all' ? true : ps.year === parseInt(selectedYear);

    return matchesSearch && matchesMonth && matchesYear;
  });

  // Extract unique years for filter dropdown
  const uniqueYears = Array.from(new Set(payslips.map(ps => ps.year))).sort((a, b) => b - a);

  // If a payslip is open in detail view (printable view)
  if (selectedPayslip) {
    const snap = selectedPayslip.salarySnapshot || {};
    const allowances = [
      { name: 'House Rent Allowance (HRA)', val: snap.hra || 0 },
      { name: 'Medical Allowance', val: snap.medical || 0 },
      { name: 'Travel Allowance', val: snap.travel || 0 },
      { name: 'Special Allowance', val: snap.special || 0 },
      { name: 'Other Allowances', val: snap.otherAllowance || 0 },
      { name: 'Bonuses & Incentives', val: snap.bonuses || 0 }
    ];

    const deductions = [
      { name: 'Provident Fund (PF)', val: snap.pf || 0 },
      { name: 'Health Insurance', val: snap.insurance || 0 },
      { name: 'Income Tax (TDS)', val: snap.taxAmount || 0 },
      { name: 'Other Deductions', val: snap.deductions || 0 }
    ];

    const totalEarnings = (snap.baseSalary || 0) + allowances.reduce((acc, curr) => acc + curr.val, 0);
    const totalDeductions = deductions.reduce((acc, curr) => acc + curr.val, 0);

    return (
      <div className="space-y-6">
        {/* Printable CSS Rules injected directly */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden;
              background: white !important;
              color: black !important;
            }
            #printable-payslip-area, #printable-payslip-area * {
              visibility: visible;
            }
            #printable-payslip-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />

        {/* Back and Action buttons (hidden on print) */}
        <div className="flex justify-between items-center no-print border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedPayslip(null)}
            className="flex items-center gap-2 text-zinc-650 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payslips
          </Button>

          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-purple-650 hover:bg-purple-700 text-white flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </Button>
          </div>
        </div>

        {/* Payslip Corporate Shell */}
        <div 
          id="printable-payslip-area"
          className="mx-auto max-w-4xl p-8 border border-zinc-200 dark:border-zinc-850 rounded-2xl bg-white dark:bg-zinc-950 shadow-md text-zinc-800 dark:text-zinc-100"
        >
          {/* Header block */}
          <div className="flex justify-between items-start border-b-2 border-purple-600 pb-6">
            <div>
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-extrabold text-2xl tracking-tight">
                <Building className="w-7 h-7 text-purple-600" />
                HRMinds AI
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-semibold">
                Enterprise Human Resource & Payroll Management Suite
              </p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-black uppercase text-zinc-900 dark:text-white">Payslip / Pay Advice</h3>
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1">
                Statement for: {MONTH_NAMES[selectedPayslip.month - 1]} {selectedPayslip.year}
              </p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Reference: {selectedPayslip.payslipCode}</p>
            </div>
          </div>

          {/* Employee Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-b border-zinc-200 dark:border-zinc-800 text-xs">
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Employee Name</p>
              <p className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{snap.employeeName}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Employee Code</p>
              <p className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{snap.employeeCode}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Department</p>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">Engineering & Technology</p>
            </div>
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Designation</p>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">Senior Staff Engineer</p>
            </div>

            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Payment Mode</p>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                Bank Transfer
              </p>
            </div>
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Financial Year</p>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">FY {selectedPayslip.year}-{String(selectedPayslip.year + 1).slice(2)}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">PF Account No.</p>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">HRM/PF/{snap.employeeCode}</p>
            </div>
            <div>
              <p className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Generated Date</p>
              <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">
                {new Date(selectedPayslip.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Core Table Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            {/* Earnings Column */}
            <div>
              <h4 className="text-xs uppercase font-extrabold tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2 text-zinc-900 dark:text-white">
                Earnings / Allowances
              </h4>
              <table className="w-full text-xs mt-3">
                <tbody>
                  <tr className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/20">
                    <td className="py-2 text-zinc-600 dark:text-zinc-300 font-medium">Base Basic Salary</td>
                    <td className="py-2 text-right font-semibold">{fmtAmt(snap.baseSalary)}</td>
                  </tr>
                  {allowances.map((item, index) => (
                    <tr key={index} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/20">
                      <td className="py-2 text-zinc-600 dark:text-zinc-300 font-medium">{item.name}</td>
                      <td className="py-2 text-right font-semibold">{fmtAmt(item.val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Deductions Column */}
            <div>
              <h4 className="text-xs uppercase font-extrabold tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-2 text-zinc-900 dark:text-white">
                Deductions & Taxes
              </h4>
              <table className="w-full text-xs mt-3">
                <tbody>
                  {deductions.map((item, index) => (
                    <tr key={index} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/20">
                      <td className="py-2 text-zinc-600 dark:text-zinc-300 font-medium">{item.name}</td>
                      <td className="py-2 text-right font-semibold text-rose-500 font-semibold">{fmtAmt(item.val)}</td>
                    </tr>
                  ))}
                  {/* Empty rows to align heights */}
                  <tr className="border-b border-transparent">
                    <td className="py-2 text-transparent">Placeholder</td>
                    <td className="py-2 text-transparent">0</td>
                  </tr>
                  <tr className="border-b border-transparent">
                    <td className="py-2 text-transparent">Placeholder</td>
                    <td className="py-2 text-transparent">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-b border-zinc-200 dark:border-zinc-800 py-4 font-bold text-xs uppercase bg-zinc-50/30 dark:bg-zinc-900/10">
            <div className="flex justify-between px-2">
              <span className="text-zinc-700 dark:text-zinc-300">Gross Earnings</span>
              <span className="text-zinc-900 dark:text-white">{fmtAmt(totalEarnings)}</span>
            </div>
            <div className="flex justify-between px-2">
              <span className="text-zinc-700 dark:text-zinc-300">Total Deductions</span>
              <span className="text-rose-500">{fmtAmt(totalDeductions)}</span>
            </div>
          </div>

          {/* Final Net Pay Block */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-purple-50/50 dark:bg-purple-950/15 border border-purple-200/50 dark:border-purple-900/30 rounded-xl p-5 mt-6 gap-4">
            <div>
              <p className="text-[10px] text-purple-650 dark:text-purple-400 font-bold uppercase tracking-wider">
                Net Salary Payout
              </p>
              <h3 className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                {fmtAmt(snap.netSalary)}
              </h3>
            </div>
            <div className="text-right text-xs max-w-md font-semibold text-zinc-500 dark:text-zinc-400 italic">
              * This is a computer-generated salary statement snapshot of HRMinds AI and does not require a physical signature for validity.
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 mt-16 text-center text-xs">
            <div className="space-y-8">
              <div className="h-10 border-b border-zinc-350 dark:border-zinc-700 w-44 mx-auto" />
              <p className="font-bold text-zinc-500 dark:text-zinc-400">Employee Signature</p>
            </div>
            <div className="space-y-8">
              <div className="h-10 border-b border-zinc-350 dark:border-zinc-700 w-44 mx-auto flex items-end justify-center">
                <span className="font-serif italic text-zinc-400 select-none">HRMinds Admin</span>
              </div>
              <p className="font-bold text-zinc-500 dark:text-zinc-400">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filter tools */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder={isHR ? "Search by Employee name, code, or payslip code..." : "Search payslip code..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-9.5 text-xs rounded-xl"
            />
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              <option value="all">All Months</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300"
            >
              <option value="all">All Years</option>
              {uniqueYears.map(yr => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main List Table */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-500" />
            Salary Payslips Roster
          </CardTitle>
          <CardDescription>
            {isHR 
              ? 'Browse and print archived monthly employee statements.' 
              : 'Access and download your official payroll receipts.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div className="p-12 text-center text-zinc-450 font-semibold text-xs">
              No payslip statements matching filters found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Payslip Code</th>
                    {isHR && <th className="p-4">Employee</th>}
                    <th className="p-4">Pay Period</th>
                    <th className="p-4">Gross Earnings</th>
                    <th className="p-4">Deductions</th>
                    <th className="p-4 font-black">Net Salary</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {filteredPayslips.map(ps => {
                    const snap = ps.salarySnapshot || {};
                    const totalEarnings = (snap.baseSalary || 0) + 
                      (snap.hra || 0) + (snap.medical || 0) + 
                      (snap.travel || 0) + (snap.special || 0) + 
                      (snap.otherAllowance || 0) + (snap.bonuses || 0);
                    const totalDeductions = (snap.pf || 0) + 
                      (snap.insurance || 0) + (snap.taxAmount || 0) + 
                      (snap.deductions || 0);

                    return (
                      <tr key={ps._id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                        <td className="p-4 font-bold text-zinc-800 dark:text-zinc-200">{ps.payslipCode}</td>
                        {isHR && (
                          <td className="p-4 font-semibold text-zinc-800 dark:text-zinc-200">
                            <div>{snap.employeeName || 'Anonymous'}</div>
                            <div className="text-[10px] text-zinc-400 font-normal">Code: {snap.employeeCode || 'N/A'}</div>
                          </td>
                        )}
                        <td className="p-4 text-zinc-650 dark:text-zinc-350">
                          <span className="font-bold">{MONTH_NAMES[ps.month - 1]}</span> {ps.year}
                        </td>
                        <td className="p-4 text-zinc-650 dark:text-zinc-350">{fmtAmt(totalEarnings)}</td>
                        <td className="p-4 text-rose-500 font-semibold">{fmtAmt(totalDeductions)}</td>
                        <td className="p-4 font-extrabold text-emerald-600 dark:text-emerald-450">{fmtAmt(snap.netSalary)}</td>
                        <td className="p-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setSelectedPayslip(ps)}
                            className="text-purple-650 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-bold flex items-center gap-1.5 mx-auto rounded-xl"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View & Print
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
