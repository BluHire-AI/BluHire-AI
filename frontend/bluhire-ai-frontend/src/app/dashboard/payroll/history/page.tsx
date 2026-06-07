'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { payrollService } from '@/services/payroll.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  History, TrendingUp, DollarSign, Wallet, ShieldAlert, 
  Sparkles, Calendar, ArrowUpRight, FileText, Download 
} from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Link from 'next/link';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function fmtAmt(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
}

export default function PayrollHistoryPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch historical payroll records for current user
      const data = await payrollService.getHistory();
      setHistory(data || []);
    } catch (err) {
      console.error('Failed to load payroll history', err);
      toast.error('Failed to load payroll history.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Calculations for summary cards
  const totalPaid = history.reduce((sum, item) => sum + (item.netSalary || 0), 0);
  const avgPaid = history.length > 0 ? totalPaid / history.length : 0;
  const totalTaxes = history.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const totalDeducted = history.reduce((sum, item) => sum + (item.deductionsAmount || 0), 0);

  // Formatting chart data (reverse history to show chronological order)
  const chartData = [...history]
    .reverse()
    .map(item => ({
      name: `${MONTH_NAMES[item.payrollRunId?.month - 1 || item.month - 1]?.slice(0, 3)} ${item.payrollRunId?.year || item.year}`,
      net: item.netSalary || 0,
      gross: (item.baseSalary || 0) + (item.allowancesAmount || 0) + (item.bonusesAmount || 0) + (item.overtimeAmount || 0)
    }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <History className="w-5.5 h-5.5 text-purple-650" />
          My Compensation History
        </h2>
        <p className="text-sm text-zinc-500">
          Track salary growth, overtime records, and detailed monthly distributions.
        </p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-[280px] w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : history.length === 0 ? (
        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
          <CardContent className="p-16 text-center text-zinc-450 font-semibold text-xs">
            No historical payroll records are logged for your account.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Net Earnings</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">{fmtAmt(totalPaid)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Sum of all payouts received</p>
                </div>
                <div className="p-2.5 rounded-xl border text-purple-500 bg-purple-50/50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40">
                  <Wallet className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Average Monthly Pay</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">{fmtAmt(avgPaid)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Rolling monthly average</p>
                </div>
                <div className="p-2.5 rounded-xl border text-blue-500 bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Taxes Contributed</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white mt-1 text-rose-500">{fmtAmt(totalTaxes)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Total Income Tax (TDS)</p>
                </div>
                <div className="p-2.5 rounded-xl border text-rose-500 bg-rose-50/50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Other Deductions</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white mt-1 text-rose-500">{fmtAmt(totalDeducted)}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Provident Fund, Insurance, etc.</p>
                </div>
                <div className="p-2.5 rounded-xl border text-amber-500 bg-amber-50/50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40">
                  <Sparkles className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recharts Area Trend */}
          <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                Earning Trends
              </CardTitle>
              <CardDescription>Visual summary comparing monthly Gross Earnings vs Net Payout</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                    <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [fmtAmt(Number(v))]} />
                    <Area type="monotone" dataKey="gross" name="Gross Salary" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGross)" />
                    <Area type="monotone" dataKey="net" name="Net Salary" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Roster list */}
          <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">Historical Pay Stubs</CardTitle>
              <CardDescription>Detailed audit of individual cycle payments</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Period</th>
                      <th className="p-4">Base Salary</th>
                      <th className="p-4">Allowances</th>
                      <th className="p-4">Bonus</th>
                      <th className="p-4">Overtime</th>
                      <th className="p-4">TDS (Tax)</th>
                      <th className="p-4">Deductions</th>
                      <th className="p-4 font-black">Net Salary</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {history.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                        <td className="p-4 font-bold text-zinc-850 dark:text-zinc-200">
                          {MONTH_NAMES[(item.payrollRunId?.month || item.month) - 1]} {item.payrollRunId?.year || item.year}
                        </td>
                        <td className="p-4 text-zinc-650 dark:text-zinc-350">{fmtAmt(item.baseSalary)}</td>
                        <td className="p-4 text-zinc-650 dark:text-zinc-350">{fmtAmt(item.allowancesAmount)}</td>
                        <td className="p-4 text-emerald-600 font-semibold">{fmtAmt(item.bonusesAmount)}</td>
                        <td className="p-4 text-emerald-650">{fmtAmt(item.overtimeAmount)}</td>
                        <td className="p-4 text-rose-500 font-semibold">{fmtAmt(item.taxAmount)}</td>
                        <td className="p-4 text-rose-500 font-semibold">{fmtAmt(item.deductionsAmount)}</td>
                        <td className="p-4 font-extrabold text-purple-700 dark:text-purple-400">{fmtAmt(item.netSalary)}</td>
                        <td className="p-4 text-center">
                          <Badge className={item.isLocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}>
                            {item.isLocked ? 'Paid & Locked' : 'Under Review'}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Link href="/dashboard/payroll/payslips">
                            <Button variant="ghost" size="sm" className="text-purple-650 hover:text-purple-700 dark:text-purple-400 font-bold p-1 rounded-xl">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
