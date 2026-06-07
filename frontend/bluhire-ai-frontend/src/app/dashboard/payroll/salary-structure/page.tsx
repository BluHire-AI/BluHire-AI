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
import { 
  Settings, Search, Edit3, ShieldAlert, Coins, 
  HelpCircle, User, Percent, Building, HeartPulse, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

function fmtAmt(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
}

export default function SalaryStructuresPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Employees list
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Structures lookup cache by employeeId to avoid redundant fetches
  const [structuresCache, setStructuresCache] = useState<Record<string, any>>({});

  // Editing Structure modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);

  // Form states
  const [baseSalary, setBaseSalary] = useState(0);
  const [hra, setHra] = useState(0);
  const [medical, setMedical] = useState(0);
  const [travel, setTravel] = useState(0);
  const [special, setSpecial] = useState(0);
  const [otherAllowance, setOtherAllowance] = useState(0);
  const [pf, setPf] = useState(0);
  const [insurance, setInsurance] = useState(0);

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';
  const isAdmin = user?.role === 'MANAGEMENT_ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const empRes = await employeeService.list({ limit: 100 });
      const empList = empRes.employees || [];
      setEmployees(empList);

      // Proactively pre-load salary structures for the first 10 employees to avoid empty layouts
      const firstTen = empList.slice(0, 10);
      const cacheUpdates: Record<string, any> = {};
      await Promise.all(
        firstTen.map(async (emp) => {
          try {
            const struct = await payrollService.getSalaryStructure(emp._id);
            cacheUpdates[emp._id] = struct;
          } catch {
            cacheUpdates[emp._id] = null; // No structure created yet
          }
        })
      );
      setStructuresCache(prev => ({ ...prev, ...cacheUpdates }));
    } catch (err) {
      console.error('Failed to load employee records', err);
      toast.error('Failed to load employee salary registry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenEdit = async (emp: Employee) => {
    setSelectedEmp(emp);
    setActionLoading(true);
    try {
      let struct = structuresCache[emp._id];
      if (struct === undefined) {
        struct = await payrollService.getSalaryStructure(emp._id);
        setStructuresCache(prev => ({ ...prev, [emp._id]: struct }));
      }
      
      setBaseSalary(struct?.baseSalary || 0);
      setHra(struct?.hra || 0);
      setMedical(struct?.medical || 0);
      setTravel(struct?.travel || 0);
      setSpecial(struct?.special || 0);
      setOtherAllowance(struct?.otherAllowance || 0);
      setPf(struct?.pf || 0);
      setInsurance(struct?.insurance || 0);
      
      setIsEditOpen(true);
    } catch {
      // Setup default zeros if structure not found in DB
      setBaseSalary(0);
      setHra(0);
      setMedical(0);
      setTravel(0);
      setSpecial(0);
      setOtherAllowance(0);
      setPf(0);
      setInsurance(0);
      setIsEditOpen(true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setActionLoading(true);
    try {
      const payload = {
        baseSalary: Number(baseSalary),
        hra: Number(hra),
        medical: Number(medical),
        travel: Number(travel),
        special: Number(special),
        otherAllowance: Number(otherAllowance),
        pf: Number(pf),
        insurance: Number(insurance)
      };

      const updatedStruct = await payrollService.updateSalaryStructure(selectedEmp._id, payload);
      setStructuresCache(prev => ({ ...prev, [selectedEmp._id]: updatedStruct }));
      
      toast.success(`🎉 Salary structure configured for ${selectedEmp.firstName} ${selectedEmp.lastName}.`);
      setIsEditOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update salary configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const dept = (emp.departmentId?.name || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || code.includes(query) || dept.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Settings className="w-5.5 h-5.5 text-purple-650" />
            Global Salary Structures
          </h2>
          <p className="text-sm text-zinc-500">
            Define base salaries, allowances, and statutory deductions per employee profile.
          </p>
        </div>
      </div>

      {/* Filter and search card */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search employees by name, code, or department..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9.5 text-xs rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Roster sheet */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Coins className="w-5 h-5 text-purple-500" />
            Employee Salary Roster
          </CardTitle>
          <CardDescription>
            Manage basic structures. Highlighted values represent active monthly allocations.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-zinc-450 font-semibold text-xs">
              No employee records found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Department / Level</th>
                    <th className="p-4">Base Monthly</th>
                    <th className="p-4">Total Allowances</th>
                    <th className="p-4">PF & Insurance</th>
                    <th className="p-4 font-black">Gross Pay Projection</th>
                    <th className="p-4 text-center">Status</th>
                    {isAdmin && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                  {filteredEmployees.map(emp => {
                    const struct = structuresCache[emp._id];
                    const hasStruct = struct !== undefined && struct !== null;
                    
                    const allowancesSum = hasStruct
                      ? (struct.hra || 0) + (struct.medical || 0) + 
                        (struct.travel || 0) + (struct.special || 0) + 
                        (struct.otherAllowance || 0)
                      : 0;

                    const deductionsSum = hasStruct
                      ? (struct.pf || 0) + (struct.insurance || 0)
                      : 0;

                    const grossSalary = hasStruct ? (struct.baseSalary || 0) + allowancesSum : 0;

                    return (
                      <tr key={emp._id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-zinc-150">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              Code: {emp.employeeCode}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-zinc-650 dark:text-zinc-350">
                          <div>{emp.departmentId?.name || 'Unassigned'}</div>
                          <div className="text-[10px] text-zinc-400">{emp.designationId?.title || 'No Title'}</div>
                        </td>
                        <td className="p-4 font-semibold">
                          {hasStruct ? fmtAmt(struct.baseSalary) : <span className="text-zinc-400 font-normal italic">Not configured</span>}
                        </td>
                        <td className="p-4 text-zinc-650 dark:text-zinc-350">
                          {hasStruct && allowancesSum > 0 ? (
                            <div className="flex flex-col">
                              <span>{fmtAmt(allowancesSum)}</span>
                              <span className="text-[9px] text-zinc-400">HRA, Medical, Travel, Special</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="p-4 text-rose-500 font-semibold">
                          {hasStruct && deductionsSum > 0 ? (
                            <div className="flex flex-col">
                              <span>{fmtAmt(deductionsSum)}</span>
                              <span className="text-[9px] text-zinc-400">PF: {fmtAmt(struct.pf)} • Ins: {fmtAmt(struct.insurance)}</span>
                            </div>
                          ) : '—'}
                        </td>
                        <td className="p-4 font-extrabold text-purple-700 dark:text-purple-400">
                          {hasStruct ? fmtAmt(grossSalary) : '—'}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={hasStruct ? 'bg-emerald-50 text-emerald-700 border-emerald-250' : 'bg-zinc-50 text-zinc-500 border-zinc-200'}>
                            {hasStruct ? 'Active Config' : 'Missing Config'}
                          </Badge>
                        </td>
                        {isAdmin && (
                          <td className="p-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(emp)}
                              className="border-purple-200 hover:border-purple-300 text-purple-750 hover:bg-purple-50/20 rounded-xl"
                            >
                              <Edit3 className="w-3.5 h-3.5 mr-1" />
                              Configure
                            </Button>
                          </td>
                        )}
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
                Configure Salary Structure
              </DialogTitle>
              <DialogDescription className="text-zinc-450 text-xs">
                Setup active base and statutory items for {selectedEmp?.firstName} {selectedEmp?.lastName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 max-h-[380px] overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-zinc-450" />
                  Base Monthly Salary (INR)
                </Label>
                <Input
                  type="number"
                  value={baseSalary}
                  onChange={e => setBaseSalary(Number(e.target.value))}
                  className="rounded-xl h-10 text-xs font-semibold"
                  placeholder="Enter base monthly salary"
                  required
                  min={0}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase">HRA Allowance</Label>
                  <Input
                    type="number"
                    value={hra}
                    onChange={e => setHra(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <HeartPulse className="w-3 h-3 text-red-400" />
                    Medical Allowance
                  </Label>
                  <Input
                    type="number"
                    value={medical}
                    onChange={e => setMedical(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase">Travel Allowance</Label>
                  <Input
                    type="number"
                    value={travel}
                    onChange={e => setTravel(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase">Special Allowance</Label>
                  <Input
                    type="number"
                    value={special}
                    onChange={e => setSpecial(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-zinc-400 uppercase">Other Allowances</Label>
                <Input
                  type="number"
                  value={otherAllowance}
                  onChange={e => setOtherAllowance(Number(e.target.value))}
                  className="rounded-xl h-10 text-xs"
                  min={0}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 dark:border-zinc-850 pt-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-zinc-400" />
                    Provident Fund (PF)
                  </Label>
                  <Input
                    type="number"
                    value={pf}
                    onChange={e => setPf(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-450" />
                    Health Insurance
                  </Label>
                  <Input
                    type="number"
                    value={insurance}
                    onChange={e => setInsurance(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    min={0}
                  />
                </div>
              </div>

              {/* Total gross calculation */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-[10px] space-y-1 text-zinc-500 font-semibold uppercase tracking-wider border border-zinc-150 dark:border-zinc-850">
                <div className="flex justify-between">
                  <span>Gross Pay Monthly</span>
                  <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                    {fmtAmt(Number(baseSalary) + Number(hra) + Number(medical) + Number(travel) + Number(special) + Number(otherAllowance))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Deductions Monthly</span>
                  <span className="text-rose-500 font-bold">
                    {fmtAmt(Number(pf) + Number(insurance))}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={actionLoading} className="bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-bold">
                {actionLoading ? 'Saving...' : 'Save Configuration'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
