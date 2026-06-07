'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { payrollService } from '@/services/payroll.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, TrendingUp, DollarSign, Wallet, Sparkles, 
  ShieldAlert, RefreshCw, PieChart, Coins, Info, Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, Legend
} from 'recharts';

function fmtAmt(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
}

const COLORS = ['#6366f1', '#a855f7', '#10b981', '#f59e0b', '#ef4444'];

export default function PayrollAnalyticsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await payrollService.getAnalytics();
      setAnalytics(stats);
    } catch (err) {
      console.error('Failed to load payroll analytics', err);
      toast.error('Failed to load payroll analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[280px] w-full rounded-2xl" />
          <Skeleton className="h-[280px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm text-center p-16">
        <CardContent className="font-semibold text-xs text-zinc-450">
          Failed to compile organization payroll analytics. Generate a paid payroll run to view trends.
        </CardContent>
      </Card>
    );
  }

  // Compile component breakdown for Donut Chart
  const totalOvertime = analytics.totalOvertimeCost || 0;
  const totalBonuses = analytics.totalBonusCost || 0;
  const totalDeductions = analytics.totalDeductionCost || 0;
  // Calculate approximate base salary from average and history
  const latestCost = analytics.costHistory?.[analytics.costHistory.length - 1]?.cost || 0;
  const estimatedBase = Math.max(latestCost - totalOvertime - totalBonuses + totalDeductions, 0);

  const componentData = [
    { name: 'Base Salaries', value: estimatedBase },
    { name: 'Bonus Awards', value: totalBonuses },
    { name: 'Overtime Pay', value: totalOvertime },
    { name: 'PF & Insurance (Deducted)', value: totalDeductions }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5.5 h-5.5 text-purple-650" />
            Executive Payroll Analytics
          </h2>
          <p className="text-sm text-zinc-500">
            Audit organizational labor budgets, cost distributions, and component breakdowns.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="rounded-xl h-10">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Monthly Budget</p>
              <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">{fmtAmt(latestCost)}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Spent on last processed run</p>
            </div>
            <div className="p-2.5 rounded-xl border text-purple-500 bg-purple-50/50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Average Salary</p>
              <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">{fmtAmt(analytics.avgSalary || 0)}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Average payout per staff</p>
            </div>
            <div className="p-2.5 rounded-xl border text-blue-500 bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40">
              <Wallet className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Accumulated Bonuses</p>
              <p className="text-xl font-black text-zinc-900 dark:text-white mt-1 text-emerald-600">{fmtAmt(totalBonuses)}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Total spot incentives given</p>
            </div>
            <div className="p-2.5 rounded-xl border text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40">
              <Sparkles className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Insurance & PF pool</p>
              <p className="text-xl font-black text-zinc-900 dark:text-white mt-1 text-rose-500">{fmtAmt(totalDeductions)}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">Total co-pay pools deducted</p>
            </div>
            <div className="p-2.5 rounded-xl border text-rose-500 bg-rose-50/50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main charts layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Line Chart */}
        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Organizational Cost Growth
            </CardTitle>
            <CardDescription>Overall monthly net compensation expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.costHistory?.length === 0 ? (
              <div className="py-24 text-center text-zinc-450 font-semibold text-xs">
                No past paid runs log found.
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.costHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" fontSize={11} stroke="#94a3b8" />
                    <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [fmtAmt(Number(v)), 'Total Net Pay']} />
                    <Line type="monotone" dataKey="cost" stroke="#a855f7" strokeWidth={3} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Distribution Bar Chart */}
        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-indigo-500" />
              Department Cost Allocation
            </CardTitle>
            <CardDescription>Salary breakdown divided across organizational units.</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.departmentDistribution?.length === 0 ? (
              <div className="py-24 text-center text-zinc-450 font-semibold text-xs">
                No active employee department distributions recorded.
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.departmentDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                    <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => [fmtAmt(Number(v)), 'Department Total Net']} />
                    <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Component Breakdown Card (Pie Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-zinc-200/60 dark:border-zinc-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-1.5">
              <PieChart className="w-5 h-5 text-indigo-500" />
              Compensation Components
            </CardTitle>
            <CardDescription>Breakdown ratio of active components.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-2">
            {componentData.length === 0 ? (
              <div className="py-12 text-center text-zinc-450 font-semibold text-xs">
                No active components loaded.
              </div>
            ) : (
              <>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={componentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {componentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => fmtAmt(Number(v))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend list */}
                <div className="w-full text-xs space-y-1.5 mt-2 font-semibold text-zinc-650 dark:text-zinc-350">
                  {componentData.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="text-zinc-900 dark:text-zinc-150">{fmtAmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Informational checklist info card */}
        <Card className="lg:col-span-2 border-zinc-200/60 dark:border-zinc-800 bg-purple-50/15 dark:bg-purple-950/5 relative overflow-hidden shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Info className="w-5 h-5 text-purple-550" />
              Tax Slab & Dynamic Projections Audit
            </CardTitle>
            <CardDescription>Overview of statutory rules matching the active cycle.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs space-y-4 font-semibold text-zinc-650 dark:text-zinc-350">
            <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-2">
              <h4 className="text-zinc-900 dark:text-zinc-150 uppercase text-[10px] tracking-wide font-black">1. Statutory Tax Calculations</h4>
              <p className="font-normal text-zinc-550 leading-relaxed">
                TDS projections are dynamically derived by multiplying the employee's monthly gross earnings (excluding tax itself) by 12, deducting the standard rebate deduction of <span className="font-semibold text-zinc-800 dark:text-zinc-250">₹50,000</span>, assessing the balance against the active configuration slabs, and dividing by 12.
              </p>
            </div>
            
            <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-2">
              <h4 className="text-zinc-900 dark:text-zinc-150 uppercase text-[10px] tracking-wide font-black">2. Daily Wage Formula</h4>
              <p className="font-normal text-zinc-550 leading-relaxed">
                Absence penalties and half-day deductions deduct base pay proportionally from gross income:
                <br />
                <code className="text-purple-600 font-mono text-[10px] bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                  dailyRate = (baseSalary + allowances) / totalDaysInMonth
                </code>
              </p>
            </div>

            <div className="p-3.5 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-2">
              <h4 className="text-zinc-900 dark:text-zinc-150 uppercase text-[10px] tracking-wide font-black">3. Overtime Multiplier</h4>
              <p className="font-normal text-zinc-550 leading-relaxed">
                Hourly overtime rates project as:
                <br />
                <code className="text-purple-600 font-mono text-[10px] bg-purple-50 dark:bg-purple-950/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                  overtimeWages = overtimeHours * ((baseSalary / 160) * 1.5)
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
