'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { payrollService, TaxConfig, TaxSlab } from '@/services/payroll.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Percent, Plus, Trash2, CheckCircle2, ShieldCheck, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

function fmtAmt(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
}

export default function TaxCenterPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [configs, setConfigs] = useState<TaxConfig[]>([]);

  // Dialog states
  const [isOpen, setIsOpen] = useState(false);
  const [financialYear, setFinancialYear] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [slabs, setSlabs] = useState<TaxSlab[]>([
    { minIncome: 0, maxIncome: 300000, taxRate: 0 },
    { minIncome: 300001, maxIncome: 600000, taxRate: 5 },
    { minIncome: 600001, maxIncome: 900000, taxRate: 10 }
  ]);

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';
  const isAdmin = user?.role === 'MANAGEMENT_ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await payrollService.getTaxConfigs();
      setConfigs(data || []);
    } catch (err) {
      console.error('Failed to load tax configurations', err);
      toast.error('Failed to load tax slabs configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSlabRow = () => {
    setSlabs(prev => [...prev, { minIncome: 0, maxIncome: 0, taxRate: 0 }]);
  };

  const handleRemoveSlabRow = (idx: number) => {
    setSlabs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSlabChange = (idx: number, field: keyof TaxSlab, val: number) => {
    setSlabs(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const handleCreateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financialYear.trim()) {
      toast.error('Financial Year designation is required.');
      return;
    }

    if (slabs.length === 0) {
      toast.error('Configure at least one tax slab bracket.');
      return;
    }

    setActionLoading(true);
    try {
      await payrollService.createTaxConfig({
        financialYear,
        slabs,
        isActive
      });
      toast.success('🎉 Tax Configuration created and updated successfully!');
      setIsOpen(false);
      
      // Reset form
      setFinancialYear('');
      setIsActive(true);
      setSlabs([
        { minIncome: 0, maxIncome: 300000, taxRate: 0 },
        { minIncome: 300001, maxIncome: 600000, taxRate: 5 }
      ]);
      
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to establish tax configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetActive = async (id: string) => {
    setActionLoading(true);
    try {
      await payrollService.updateTaxConfig(id, { isActive: true });
      toast.success('🎉 Active Tax Slab changed. Upcoming payroll calculations will use these parameters.');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to activate tax slabs configuration.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Percent className="w-5.5 h-5.5 text-purple-650" />
            Tax Configurations & Slabs
          </h2>
          <p className="text-sm text-zinc-500">
            Define annual progressive tax thresholds and active TDS rates.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsOpen(true)} className="bg-purple-650 hover:bg-purple-700 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Establish Slabs Year
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : configs.length === 0 ? (
        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm text-center p-16">
          <CardContent className="font-semibold text-xs text-zinc-450">
            No tax configuration slabs configured yet. Establish one to begin processing runs.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active configurations card */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">Available Configurations</h3>
            
            {configs.map(config => (
              <Card 
                key={config._id} 
                className={`border-zinc-200/60 dark:border-zinc-800 shadow-sm relative overflow-hidden transition-all ${
                  config.isActive 
                    ? 'border-purple-600 bg-purple-50/20 dark:bg-purple-950/10' 
                    : 'hover:border-zinc-350 hover:shadow-md'
                }`}
              >
                <CardHeader className="pb-3 flex justify-between items-start flex-row gap-2">
                  <div>
                    <CardTitle className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">
                      FY {config.financialYear}
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Created: {new Date(config.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </CardDescription>
                  </div>
                  {config.isActive ? (
                    <Badge className="bg-purple-100 text-purple-700 font-bold border-purple-200 text-[10px] flex items-center gap-1.5 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Active Slabs
                    </Badge>
                  ) : (
                    isAdmin && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleSetActive(config._id)}
                        disabled={actionLoading}
                        className="text-[10px] h-7 px-2.5 rounded-xl border-purple-250 text-purple-700 hover:bg-purple-50/40"
                      >
                        Activate
                      </Button>
                    )
                  )}
                </CardHeader>
                <CardContent className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide border-t border-zinc-150/40 dark:border-zinc-850/40 pt-3 flex justify-between items-center">
                  <span>Number of Slabs: {config.slabs?.length || 0}</span>
                  <span>Max Rate: {config.slabs?.reduce((max, s) => Math.max(max, s.taxRate), 0)}%</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Active configuration detail viewer */}
          <div className="lg:col-span-2">
            {(() => {
              const active = configs.find(c => c.isActive) || configs[0];
              return (
                <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
                  <CardHeader className="border-b border-zinc-150 dark:border-zinc-850">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Percent className="w-5.5 h-5.5 text-purple-500" />
                      Tax Slab Details: FY {active.financialYear}
                    </CardTitle>
                    <CardDescription>
                      These slabs determine dynamic monthly TDS deductions based on projected annual gross payouts.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-400 font-bold uppercase tracking-wider">
                          <th className="p-4">Income Brackets (INR)</th>
                          <th className="p-4">Tax Rate (%)</th>
                          <th className="p-4">Tax Payable Example</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                        {active.slabs?.map((slab, i) => {
                          const exampleIncome = (slab.minIncome + (slab.maxIncome > 9999999 ? slab.minIncome + 200000 : slab.maxIncome)) / 2;
                          const slabTax = (exampleIncome - slab.minIncome) * (slab.taxRate / 100);
                          return (
                            <tr key={i} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
                              <td className="p-4 font-bold text-zinc-850 dark:text-zinc-200">
                                {fmtAmt(slab.minIncome)} {slab.maxIncome > 99999999 ? 'and above' : `to ${fmtAmt(slab.maxIncome)}`}
                              </td>
                              <td className="p-4">
                                <Badge className={`text-xs font-bold ${slab.taxRate === 0 ? 'bg-zinc-50 text-zinc-550 border-zinc-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                  {slab.taxRate}%
                                </Badge>
                              </td>
                              <td className="p-4 text-zinc-500 font-medium">
                                At {fmtAmt(exampleIncome)}: <span className="font-bold text-zinc-700 dark:text-zinc-300">{fmtAmt(slabTax)}</span> in slab
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl">
          <form onSubmit={handleCreateConfig}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-500" />
                Configure Tax Slabs Bracket
              </DialogTitle>
              <DialogDescription className="text-zinc-450 text-xs">
                Set up a new progressive tax structure. Slabs must increase chronologically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 pr-1 max-h-[380px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Financial Year Label
                  </Label>
                  <Input
                    value={financialYear}
                    onChange={e => setFinancialYear(e.target.value)}
                    placeholder="e.g. 2026-27"
                    className="rounded-xl h-10 text-xs font-bold"
                    required
                  />
                </div>
                
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActiveCheckbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <Label htmlFor="isActiveCheckbox" className="text-xs font-bold text-zinc-650 cursor-pointer">
                    Set Active Immediately
                  </Label>
                </div>
              </div>

              {/* Slabs list form builder */}
              <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">Progression Slabs</h4>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddSlabRow}
                    className="h-8 text-[10px] border-purple-250 text-purple-750 font-bold rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Bracket
                  </Button>
                </div>

                {slabs.map((slab, idx) => (
                  <div key={idx} className="flex gap-2.5 items-end bg-zinc-50/50 dark:bg-zinc-900/10 p-3 rounded-xl border border-zinc-150/40 dark:border-zinc-850/40">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[9px] font-bold text-zinc-400 uppercase">Min Income</Label>
                      <Input
                        type="number"
                        value={slab.minIncome}
                        onChange={e => handleSlabChange(idx, 'minIncome', Number(e.target.value))}
                        className="h-8.5 rounded-lg text-xs"
                        required
                        min={0}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[9px] font-bold text-zinc-400 uppercase">Max Income</Label>
                      <Input
                        type="number"
                        value={slab.maxIncome}
                        onChange={e => handleSlabChange(idx, 'maxIncome', Number(e.target.value))}
                        className="h-8.5 rounded-lg text-xs"
                        required
                        min={0}
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-[9px] font-bold text-zinc-400 uppercase">Rate (%)</Label>
                      <Input
                        type="number"
                        value={slab.taxRate}
                        onChange={e => handleSlabChange(idx, 'taxRate', Number(e.target.value))}
                        className="h-8.5 rounded-lg text-xs font-semibold"
                        required
                        min={0}
                        max={100}
                      />
                    </div>
                    {slabs.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSlabRow(idx)}
                        className="h-8.5 w-8.5 hover:bg-rose-50 text-rose-500 rounded-lg shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={actionLoading} className="bg-purple-650 hover:bg-purple-700 text-white rounded-xl font-bold">
                {actionLoading ? 'Recording...' : 'Configure Active Slabs'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
