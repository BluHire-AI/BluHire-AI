'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { payrollService } from '@/services/payroll.service';
import { employeeService, Employee } from '@/services/employee.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Sparkles, Plus, Search, Calendar, User, DollarSign, Tag, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { EmployeeCombobox } from '@/components/EmployeeCombobox';

const BONUS_TYPES = [
  { val: 'PERFORMANCE', label: 'Performance Bonus' },
  { val: 'REFERRAL', label: 'Employee Referral' },
  { val: 'FESTIVAL', label: 'Festival Allowance' },
  { val: 'SPOT', label: 'Spot Award' },
  { val: 'RETENTION', label: 'Retention Incentive' }
];

function fmtAmt(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
}

export default function BonusesPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Apply Bonus modal
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [bonusType, setBonusType] = useState('PERFORMANCE');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await payrollService.getBonuses();
      setBonuses(data || []);

      if (isHR) {
        const empRes = await employeeService.list({ limit: 100 });
        setEmployees(empRes.employees || []);
      }
    } catch (err) {
      console.error('Failed to load bonuses', err);
      toast.error('Failed to fetch bonuses list.');
    } finally {
      setLoading(false);
    }
  }, [isHR]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplyBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !amount || !reason) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setActionLoading(true);
    try {
      await payrollService.addBonus({
        employeeId: selectedEmpId,
        bonusType,
        amount: Number(amount),
        reason,
        date: new Date(date)
      });
      toast.success('🎉 Incentive recorded successfully! It will be accounted in the payroll run for this month.');
      setIsOpen(false);
      
      // Reset form
      setSelectedEmpId('');
      setAmount('');
      setReason('');
      
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to apply bonus. The cycle may be locked.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBonuses = bonuses.filter(b => {
    const empName = `${b.employeeId?.firstName || ''} ${b.employeeId?.lastName || ''}`.toLowerCase();
    const type = (b.bonusType || '').toLowerCase();
    const reasonText = (b.reason || '').toLowerCase();
    const code = (b.employeeId?.employeeCode || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    return empName.includes(query) || type.includes(query) || reasonText.includes(query) || code.includes(query);
  });

  return (
    <div className="space-y-6 select-none p-1">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 pb-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            Bonuses & Incentive Awards
          </h2>
          <p className="text-xs text-white/60 mt-1">
            Log and review referral, performance, spot, and festival payouts.
          </p>
        </div>
        {isHR && (
          <Button onClick={() => setIsOpen(true)} className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/10 shadow-lg shadow-indigo-600/10 cursor-pointer h-10 px-4">
            <Plus className="w-4 h-4 mr-2" />
            Issue Spot Incentive
          </Button>
        )}
      </div>

      {/* Filter Roster */}
      <Card className="bg-white/[0.03] border-white/10 shadow-2xl rounded-[24px]">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by Employee name, code, type or reason..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-white/5 border-white/5 focus:border-indigo-500/50 focus:ring-indigo-500/20 text-white rounded-xl"
            />
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-xl h-9 border-white/10 hover:bg-white/5 text-zinc-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardContent>
      </Card>

      {/* Main List */}
      <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 px-6 py-4">
          <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Incentives Registry</CardTitle>
          <CardDescription className="text-[10px] text-zinc-400">Records of all manually registered one-time earnings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredBonuses.length === 0 ? (
            <div className="p-12 text-center text-zinc-550 font-semibold text-xs">
              No bonus entries logged matching your search filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/5 text-zinc-450 font-extrabold uppercase tracking-wider text-[9px]">
                    <th className="p-4 pl-6">Employee</th>
                    <th className="p-4">Bonus Category</th>
                    <th className="p-4">Reason / Notes</th>
                    <th className="p-4">Date Recorded</th>
                    <th className="p-4 pr-6 text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredBonuses.map(b => (
                    <tr key={b._id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">
                            {b.employeeId ? `${b.employeeId.firstName} ${b.employeeId.lastName}` : 'System user'}
                          </span>
                          <span className="text-[10px] text-zinc-500 mt-0.5">Code: {b.employeeId?.employeeCode || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className="bg-purple-500/10 text-purple-300 border-purple-500/20 uppercase tracking-wide font-bold text-[9px]">
                          {b.bonusType}
                        </Badge>
                      </td>
                      <td className="p-4 text-zinc-300 max-w-xs truncate">{b.reason}</td>
                      <td className="p-4 text-zinc-400">
                        {new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-4 pr-6 font-bold text-emerald-400 text-xs text-right">
                        {fmtAmt(b.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card/95 border-white/5 text-white backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleApplyBonus}>
            <DialogHeader className="border-b border-white/5 pb-4 mb-4">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Issue Spot Award / Bonus
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-[10px]">
                Log a one-time monetary incentive. Applied items will compile onto the employee's active salary run.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 pr-1 max-h-[380px] overflow-y-auto">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-zinc-450" />
                  Target Employee
                </Label>
                <EmployeeCombobox
                  employees={employees}
                  selectedId={selectedEmpId}
                  onChange={setSelectedEmpId}
                  placeholder="Choose employee..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-zinc-455" />
                    Award Type
                  </Label>
                  <select
                    value={bonusType}
                    onChange={e => setBonusType(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 text-xs text-white h-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-3"
                  >
                    {BONUS_TYPES.map(bt => (
                      <option key={bt.val} value={bt.val} className="bg-zinc-950 text-white">{bt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-455" />
                    Amount (INR)
                  </Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="rounded-xl h-10 text-xs font-semibold bg-white/5 border-white/5 text-white"
                    placeholder="Enter amount"
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-455" />
                  Effective Date
                </Label>
                <Input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="rounded-xl h-10 text-xs font-semibold bg-white/5 border-white/5 text-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase">Justification / Reason</Label>
                <Input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="rounded-xl h-10 text-xs bg-white/5 border-white/5 text-white"
                  placeholder="e.g. Completed Q2 delivery before deadline"
                  required
                />
              </div>
            </div>

            <DialogFooter className="border-t border-white/5 pt-4 mt-4 gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="text-xs rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={actionLoading} className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/10 shadow-lg shadow-indigo-650/10 cursor-pointer h-10 px-4">
                {actionLoading ? 'Recording...' : 'Grant Incentive'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
