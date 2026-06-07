'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { payrollService, PayrollRun } from '@/services/payroll.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, RefreshCw, Send, CheckCircle, Wallet, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtAmt(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

export default function PayrollProcessingPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Run states
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await payrollService.getRuns();
      setRuns(data || []);
    } catch (err) {
      console.error('Failed to load payroll runs', err);
      toast.error('Failed to load payroll batches.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('generate');
    try {
      await payrollService.generateRun(Number(month), Number(year));
      toast.success('🎉 Payroll run compiled successfully!');
      loadRuns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate payroll.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitReview = async (runId: string) => {
    setActionLoading(`review-${runId}`);
    try {
      await payrollService.submitForReview(runId);
      toast.success('Submitted for audit review.');
      loadRuns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit review.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (runId: string) => {
    setActionLoading(`approve-${runId}`);
    try {
      await payrollService.approveRun(runId);
      toast.success('🎉 Payroll run approved successfully!');
      loadRuns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePay = async (runId: string) => {
    if (!confirm('Are you sure you want to process payments? This will lock all details and print payslip snapshots.')) return;
    setActionLoading(`pay-${runId}`);
    try {
      await payrollService.payRun(runId);
      toast.success('🎉 Payouts disbursed and payroll run locked.');
      loadRuns();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Payout disbursement failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const years = Array.from({ length: 3 }, (_, i) => String(now.getFullYear() - i));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Payroll Processing Engine</h2>
          <p className="text-sm text-zinc-500">Run and manage employee monthly payroll batches.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadRuns} disabled={loading} className="rounded-xl h-10">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Run generation form */}
        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Play className="w-5 h-5 text-purple-500" />
              Generate Payroll Run
            </CardTitle>
            <CardDescription>Select the target cycle to compile employee attendance data.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase">Payroll Month</label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={i} value={String(i + 1)}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase">Payroll Year</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={actionLoading === 'generate'}
                className="w-full bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-bold h-10"
              >
                {actionLoading === 'generate' ? 'Compiling logs...' : 'Compile Payroll'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing runs list */}
        <Card className="lg:col-span-2 border-zinc-200/60 dark:border-zinc-800 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Execution Batches</CardTitle>
            <CardDescription>Approval workflow logs and disbursements status.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : runs.length === 0 ? (
              <div className="p-12 text-center text-zinc-450 text-xs font-semibold">
                No payroll cycles generated yet. Select a month and click compile.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Period</th>
                      <th className="p-4">Employees</th>
                      <th className="p-4">Total Net Cost</th>
                      <th className="p-4">Workflow Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {runs.map(run => {
                      const isLock = run.isLocked || run.status === 'PAID';
                      return (
                        <tr key={run._id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                          <td className="p-4 font-bold text-zinc-800 dark:text-zinc-200">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                              {MONTHS[run.month - 1]} {run.year}
                            </div>
                          </td>
                          <td className="p-4 text-zinc-600 dark:text-zinc-350 font-semibold">{run.employeesCount} employees</td>
                          <td className="p-4 font-extrabold text-zinc-800 dark:text-zinc-105">{fmtAmt(run.totalCost)}</td>
                          <td className="p-4">
                            <Badge className={`text-[10px] font-bold ${
                              run.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40'
                                : run.status === 'APPROVED'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/60'
                                : run.status === 'UNDER_REVIEW'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/60'
                                : 'bg-zinc-50 text-zinc-500 border border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700'
                            }`}>
                              {run.status === 'PAID' ? '🔒 PAID (Locked)' : run.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              {run.status === 'GENERATED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSubmitReview(run._id)}
                                  disabled={actionLoading !== null}
                                  className="h-8 text-[10px] font-bold rounded-lg border-amber-200 text-amber-700 hover:bg-amber-50/50"
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Submit Review
                                </Button>
                              )}
                              {run.status === 'UNDER_REVIEW' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(run._id)}
                                  disabled={actionLoading !== null}
                                  className="h-8 text-[10px] font-bold rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50/50"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve Run
                                </Button>
                              )}
                              {run.status === 'APPROVED' && (
                                <Button
                                  size="sm"
                                  onClick={() => handlePay(run._id)}
                                  disabled={actionLoading !== null}
                                  className="h-8 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                >
                                  <Wallet className="w-3 h-3 mr-1" />
                                  Disburse Payouts
                                </Button>
                              )}
                              {isLock && (
                                <div className="text-[10px] font-bold text-zinc-400 italic flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-zinc-400" />
                                  Locked / Completed
                                </div>
                              )}
                            </div>
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
    </div>
  );
}
