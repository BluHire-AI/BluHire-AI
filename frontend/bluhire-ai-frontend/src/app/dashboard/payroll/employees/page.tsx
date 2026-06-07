'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { payrollService, PayrollItem, PayrollRun } from '@/services/payroll.service';
import { employeeService, Employee } from '@/services/employee.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw, Edit3, Settings, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function fmtAmt(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

export default function EmployeesPayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState('');
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Editing Structure modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  
  // Structure form states
  const [baseSalary, setBaseSalary] = useState(0);
  const [hra, setHra] = useState(0);
  const [medical, setMedical] = useState(0);
  const [travel, setTravel] = useState(0);
  const [special, setSpecial] = useState(0);
  const [otherAllowance, setOtherAllowance] = useState(0);
  const [pf, setPf] = useState(0);
  const [insurance, setInsurance] = useState(0);

  const loadRuns = useCallback(async () => {
    try {
      const data = await payrollService.getRuns();
      setRuns(data || []);
      if (data && data.length > 0) {
        setSelectedRunId(data[0]._id);
      }
    } catch {
      toast.error('Failed to load payroll batches.');
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const loadItems = useCallback(async () => {
    if (!selectedRunId) return;
    setLoading(true);
    try {
      const data = await payrollService.getItems(selectedRunId);
      setItems(data || []);
    } catch {
      toast.error('Failed to load employee list.');
    } finally {
      setLoading(false);
    }
  }, [selectedRunId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleOpenEdit = async (item: PayrollItem) => {
    setActionLoading(true);
    try {
      const struct = await payrollService.getSalaryStructure(item.employeeId._id);
      setSelectedEmp(item.employeeId);
      setBaseSalary(struct.baseSalary || 0);
      setHra(struct.hra || 0);
      setMedical(struct.medical || 0);
      setTravel(struct.travel || 0);
      setSpecial(struct.special || 0);
      setOtherAllowance(struct.otherAllowance || 0);
      setPf(struct.pf || 0);
      setInsurance(struct.insurance || 0);
      setIsEditOpen(true);
    } catch {
      toast.error('Failed to load salary structure details.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setActionLoading(true);
    try {
      // Check if current run is locked
      const currentRun = runs.find(r => r._id === selectedRunId);
      if (currentRun?.isLocked) {
        toast.error('This payroll run cycle is locked (PAID). You cannot modify salary structures.');
        setIsEditOpen(false);
        return;
      }

      await payrollService.updateSalaryStructure(selectedEmp._id, {
        baseSalary: Number(baseSalary),
        hra: Number(hra),
        medical: Number(medical),
        travel: Number(travel),
        special: Number(special),
        otherAllowance: Number(otherAllowance),
        pf: Number(pf),
        insurance: Number(insurance)
      });
      
      toast.success('🎉 Salary structure updated. Recalculate or regenerate payroll run to apply updates.');
      setIsEditOpen(false);
      loadItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save salary structure.');
    } finally {
      setActionLoading(false);
    }
  };

  const currentRun = runs.find(r => r._id === selectedRunId);

  const filteredItems = items.filter(item => {
    const name = `${item.employeeId?.firstName || ''} ${item.employeeId?.lastName || ''}`.toLowerCase();
    const code = (item.employeeId?.employeeCode || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || code.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Filters and Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Employee Payroll Management</h2>
          <p className="text-sm text-zinc-500">Inspect earnings calculations, worked days, and configure individual structures.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-56">
            <Select value={selectedRunId} onValueChange={setSelectedRunId}>
              <SelectTrigger className="rounded-xl h-10">
                <SelectValue placeholder="Select Payroll Cycle" />
              </SelectTrigger>
              <SelectContent>
                {runs.map(run => (
                  <SelectItem key={run._id} value={run._id}>
                    Cycle: {run.month}/{run.year} ({run.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={loadItems} disabled={loading} className="rounded-xl h-10">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main List */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-150 dark:border-zinc-850">
          <div>
            <CardTitle className="text-base font-bold">Payroll Calculations Sheet</CardTitle>
            <CardDescription className="text-xs">Adjust and recalculate individual wages.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search employee by name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl text-xs"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center text-zinc-450 text-xs font-semibold">
              No employee calculated logs found for this cycle. Make sure you compile the payroll run first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Base Salary</th>
                    <th className="p-4">Attendance %</th>
                    <th className="p-4">Overtime Pay</th>
                    <th className="p-4">Bonuses</th>
                    <th className="p-4">Deductions</th>
                    <th className="p-4">Tax (TDS)</th>
                    <th className="p-4 font-black">Net Salary</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {filteredItems.map(item => {
                    const empName = `${item.employeeId?.firstName || 'N/A'} ${item.employeeId?.lastName || ''}`;
                    const code = item.employeeId?.employeeCode || 'N/A';
                    return (
                      <tr key={item._id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-zinc-150">{empName}</span>
                            <span className="text-[10px] font-mono text-zinc-400 mt-0.5">{code} • {item.employeeId?.email}</span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-650 dark:text-zinc-350">{fmtAmt(item.baseSalary)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                            <span>{item.attendance?.attendancePercentage?.toFixed(0)}%</span>
                            <span className="text-[10px] text-zinc-400 font-normal">
                              ({item.attendance?.workedDays}d worked)
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-650 dark:text-zinc-350">
                          {item.overtimeAmount > 0 ? (
                            <div className="flex flex-col">
                              <span>{fmtAmt(item.overtimeAmount)}</span>
                              <span className="text-[9px] text-zinc-455 font-semibold mt-0.5">({item.attendance?.overtimeHours} hrs)</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="p-4 text-emerald-600 dark:text-emerald-450 font-bold">
                          {item.bonusesAmount > 0 ? fmtAmt(item.bonusesAmount) : '—'}
                        </td>
                        <td className="p-4 text-rose-500 font-bold">
                          {item.deductionsAmount > 0 ? fmtAmt(item.deductionsAmount) : '—'}
                        </td>
                        <td className="p-4 text-rose-500 font-bold">
                          {item.taxAmount > 0 ? fmtAmt(item.taxAmount) : '—'}
                        </td>
                        <td className="p-4 font-black text-purple-600 dark:text-purple-400 text-sm">
                          {fmtAmt(item.netSalary)}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(item)}
                              disabled={actionLoading}
                              className="h-8 w-8 text-zinc-450 hover:text-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/10 rounded-lg"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
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

      {/* Edit Salary Structure Dialog Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveStructure}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-500" />
                Edit Salary Structure
              </DialogTitle>
              <DialogDescription className="text-zinc-450">
                Update base wages and allowance configs for {selectedEmp?.firstName} {selectedEmp?.lastName}.
              </DialogDescription>
            </DialogHeader>

            {currentRun?.isLocked && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-450 rounded-xl flex items-center gap-2 text-xs font-semibold border border-rose-200 dark:border-rose-900/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                This payroll period is PAID/Locked. Structure changes won't apply to this cycle.
              </div>
            )}

            <div className="space-y-4 py-4 max-h-[360px] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-zinc-400 uppercase">Base Monthly Salary</Label>
                <Input
                  type="number"
                  value={baseSalary}
                  onChange={e => setBaseSalary(Number(e.target.value))}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-400 uppercase">HRA Allowance</Label>
                  <Input
                    type="number"
                    value={hra}
                    onChange={e => setHra(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-400 uppercase">Medical Allowance</Label>
                  <Input
                    type="number"
                    value={medical}
                    onChange={e => setMedical(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-400 uppercase">Travel Allowance</Label>
                  <Input
                    type="number"
                    value={travel}
                    onChange={e => setTravel(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-400 uppercase">Special Allowance</Label>
                  <Input
                    type="number"
                    value={special}
                    onChange={e => setSpecial(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-400 uppercase">Provident Fund (PF)</Label>
                  <Input
                    type="number"
                    value={pf}
                    onChange={e => setPf(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-zinc-400 uppercase">Health Insurance</Label>
                  <Input
                    type="number"
                    value={insurance}
                    onChange={e => setInsurance(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={actionLoading || currentRun?.isLocked} className="bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-bold">
                {actionLoading ? 'Saving...' : 'Save Structure'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
