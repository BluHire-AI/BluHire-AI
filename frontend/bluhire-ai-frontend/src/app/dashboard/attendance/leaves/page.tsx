'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { leaveService, Leave } from '@/services/leave.service';
import { employeeService, Employee } from '@/services/employee.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Umbrella, Sparkles, RefreshCw, Calendar, FileText, User, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { EmployeeCombobox } from '@/components/EmployeeCombobox';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING:   { label: 'Pending',   cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  APPROVED:  { label: 'Approved',  cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  REJECTED:  { label: 'Rejected',  cls: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

export default function LeavesPage() {
  const { user } = useAuthStore();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  
  // States
  const [balances, setBalances] = useState<any>(null);
  const [requests, setRequests] = useState<Leave[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  // Resolve current employee
  useEffect(() => {
    if (!user) return;
    employeeService.getMe()
      .then(emp => {
        if (emp) {
          setEmployeeId(emp._id);
          setSelectedEmployeeId(emp._id);
        }
      })
      .catch(() => {});
  }, [user]);

  // Fetch employees list if HR
  useEffect(() => {
    if (isHR) {
      employeeService.list({ limit: 100 })
        .then(res => {
          const list = res.employees || [];
          setEmployees(list);
          if (list.length > 0 && !selectedEmployeeId) {
            setSelectedEmployeeId(list[0]._id);
          }
        })
        .catch(() => {});
    }
  }, [isHR, selectedEmployeeId]);

  const loadData = useCallback(async () => {
    const targetEmpId = isHR ? selectedEmployeeId : employeeId;
    if (!targetEmpId) return;
    
    setLoading(true);
    try {
      const [balanceRes, listRes] = await Promise.all([
        api.get('/leaves/balance', { params: { employeeId: targetEmpId } }),
        leaveService.list({ employeeId: targetEmpId, limit: 10 })
      ]);
      setBalances(balanceRes.data?.data);
      setRequests(listRes.data || []);
    } catch (err) {
      console.error('Failed to load leave data', err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedEmployeeId, isHR]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Trigger form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmpId = isHR ? selectedEmployeeId : employeeId;
    if (!targetEmpId) {
      toast.error('Please select an employee.');
      return;
    }
    if (!startDate || !endDate || !reason) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setActionLoading(true);
    try {
      await leaveService.apply({
        employeeId: targetEmpId,
        leaveType,
        startDate,
        endDate,
        reason
      });

      toast.success('🎉 Leave applied successfully!');
      setIsModalOpen(false);
      
      // Reset form
      setStartDate('');
      setEndDate('');
      setReason('');
      
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return;
    try {
      await leaveService.cancel(id);
      toast.success('Leave cancelled successfully.');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel leave');
    }
  };

  return (
    <div className="space-y-6 select-none p-1">
      
      {/* Header & Filter / Employee Switcher for HR */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Umbrella className="w-5 h-5 text-indigo-400" />
            Leave Management
          </h2>
          <p className="text-xs text-white/60 mt-1">Apply for leaves, view limits, and track approvals.</p>
        </div>
        <div className="flex items-center gap-3">
          {isHR && (
            <div className="w-64">
              <EmployeeCombobox
                employees={employees}
                selectedId={selectedEmployeeId}
                onChange={setSelectedEmployeeId}
                placeholder="Switch Employee view..."
              />
            </div>
          )}
          <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/10 shadow-lg shadow-indigo-600/10 cursor-pointer h-10 px-4">
            <Plus className="w-4 h-4 mr-2" />
            Apply Leave
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Balance Cards */}
        <div className="col-span-1 space-y-4">
          <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 bg-white/5 border-b border-white/5">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Umbrella className="w-4 h-4 text-indigo-400" />
                Leave Balances (Quota)
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-400">Current dynamic allowances for this calendar year</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {[
                { label: 'Annual Leave', balance: balances?.balances?.ANNUAL ?? 15, quota: balances?.quotas?.ANNUAL ?? 15, color: 'from-violet-500 to-indigo-500' },
                { label: 'Sick Leave', balance: balances?.balances?.SICK ?? 10, quota: balances?.quotas?.SICK ?? 10, color: 'from-rose-500 to-orange-500' },
                { label: 'Casual Leave', balance: balances?.balances?.CASUAL ?? 7, quota: balances?.quotas?.CASUAL ?? 7, color: 'from-amber-500 to-yellow-500' },
              ].map(({ label, balance, quota, color }) => {
                const percentage = Math.min(100, Math.max(0, (balance / (quota || 1)) * 100));
                return (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/70 font-semibold">{label}</span>
                      <span className="font-bold text-white">{balance} <span className="text-xs text-white/40">/ {quota} days</span></span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full rounded-full bg-gradient-to-r ${color} shadow-lg`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Other types info */}
          {balances?.used && (
            <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 bg-white/5 border-b border-white/5 px-6 py-4">
                <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Used Leaves Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs font-semibold pt-4">
                <div className="flex justify-between text-zinc-300">
                  <span>Maternity Leave</span>
                  <span className="font-bold text-white">{balances.used.MATERNITY || 0} days</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Paternity Leave</span>
                  <span className="font-bold text-white">{balances.used.PATERNITY || 0} days</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Unpaid Leave</span>
                  <span className="font-bold text-white">{balances.used.UNPAID || 0} days</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Paginated Leaves List */}
        <Card className="col-span-1 lg:col-span-2 bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/5 px-6 py-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Recent Leave Requests</CardTitle>
              <CardDescription className="text-[10px] text-zinc-400 font-medium mt-0.5">Your recently applied and approved logs</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-xl h-9 border-white/10 hover:bg-white/5 text-zinc-300 cursor-pointer">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-4">
                <Skeleton className="h-10 w-full bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
                <Skeleton className="h-10 w-full bg-white/5" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 p-6">
                <div className="p-4 bg-white/5 text-indigo-400 rounded-2xl border border-white/10">
                  <Umbrella className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">No leave requests found</h4>
                  <p className="text-xs text-white/50 max-w-sm">
                    There are no leave requests submitted for this profile yet. Click below to apply for a schedule.
                  </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/10 shadow-lg shadow-indigo-600/10 cursor-pointer h-9 px-4 mt-2">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Apply Leave
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/5 text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
                      <th className="p-4 pl-6">Leave Type</th>
                      <th className="p-4">Dates</th>
                      <th className="p-4">Days</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {requests.map(req => {
                      const badge = STATUS_BADGE[req.status] || STATUS_BADGE.PENDING;
                      const days = Math.ceil((new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      return (
                        <tr key={req._id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                          <td className="p-4 pl-6 font-bold text-white">{req.leaveType}</td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-white/90">
                                {new Date(req.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(req.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-zinc-500 mt-0.5 max-w-[200px] truncate">
                                "{req.reason}"
                              </span>
                            </div>
                          </td>
                          <td className="p-4 font-semibold text-white/80">{days}d</td>
                          <td className="p-4">
                            <Badge variant="outline" className={`text-[9px] font-bold border ${badge.cls}`}>
                              {badge.label}
                            </Badge>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {req.status === 'PENDING' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelLeave(req._id)}
                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg h-8 px-2.5 font-bold text-[11px]"
                              >
                                Cancel
                              </Button>
                            )}
                            {req.status !== 'PENDING' && <span className="text-zinc-500 text-xs italic">—</span>}
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

      {/* Apply Leave Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card/95 border-white/5 text-white backdrop-blur-3xl shadow-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="border-b border-white/5 pb-4 mb-4">
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-white">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                Apply for Leave
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-[10px]">Submit a leave request. Leave balances will adjust on approval.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 pr-1 max-h-[380px] overflow-y-auto">
              {/* Employee Switcher for HR on the Form */}
              {isHR && (
                <div className="space-y-1.5">
                  <Label htmlFor="form-emp" className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-zinc-450" />
                    Apply For Employee
                  </Label>
                  <EmployeeCombobox
                    employees={employees}
                    selectedId={selectedEmployeeId}
                    onChange={setSelectedEmployeeId}
                    placeholder="Choose employee..."
                  />
                </div>
              )}

              {/* Leave Type */}
              <div className="space-y-1.5">
                <Label htmlFor="leaveType" className="text-[10px] font-bold text-zinc-400 uppercase">Leave Type</Label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 text-xs text-white h-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 px-3"
                >
                  <option value="ANNUAL" className="bg-zinc-950 text-white">Annual Leave</option>
                  <option value="SICK" className="bg-zinc-950 text-white">Sick Leave</option>
                  <option value="CASUAL" className="bg-zinc-950 text-white">Casual Leave</option>
                  <option value="MATERNITY" className="bg-zinc-950 text-white">Maternity Leave</option>
                  <option value="PATERNITY" className="bg-zinc-950 text-white">Paternity Leave</option>
                  <option value="UNPAID" className="bg-zinc-950 text-white">Unpaid Leave</option>
                </select>
              </div>

              {/* Start Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-[10px] font-bold text-zinc-400 uppercase">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="pl-9 rounded-xl h-10 text-xs font-semibold bg-white/5 border-white/5 text-white"
                      required
                    />
                  </div>
                </div>

                {/* End Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-[10px] font-bold text-zinc-400 uppercase">End Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="pl-9 rounded-xl h-10 text-xs font-semibold bg-white/5 border-white/5 text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-[10px] font-bold text-zinc-400 uppercase">Reason</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                  <Textarea
                    id="reason"
                    placeholder="Provide a detailed explanation for your leave..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="pl-9 rounded-xl text-xs min-h-[80px] bg-white/5 border-white/5 text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-white/5 pt-4 mt-4 gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="text-xs rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={actionLoading} className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/10 shadow-lg shadow-indigo-650/10 cursor-pointer h-10 px-4">
                {actionLoading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
