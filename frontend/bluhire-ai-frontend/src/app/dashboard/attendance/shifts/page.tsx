'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { shiftService, Shift } from '@/services/shift.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Plus, Trash2, Edit3, ShieldAlert, Sparkles, RefreshCw, CalendarRange } from 'lucide-react';
import { toast } from 'sonner';

export default function ShiftsPage() {
  const { user } = useAuthStore();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [gracePeriod, setGracePeriod] = useState(15);
  const [workingHours, setWorkingHours] = useState(8);
  const [isFlexible, setIsFlexible] = useState('false');

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  const loadShifts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shiftService.list();
      setShifts(data || []);
    } catch (err) {
      console.error('Failed to load shifts', err);
      toast.error('Failed to load shifts from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShifts();
  }, [loadShifts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startTime || !endTime) {
      toast.error('Please fill in name and timings.');
      return;
    }
    setActionLoading(true);
    try {
      await shiftService.create({
        name,
        startTime,
        endTime,
        gracePeriodMinutes: Number(gracePeriod),
        workingHoursPerDay: Number(workingHours),
        isFlexible: isFlexible === 'true'
      });
      toast.success('🎉 Shift created successfully!');
      setIsCreateOpen(false);
      setName('');
      loadShifts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create shift');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setName(shift.name);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setGracePeriod(shift.gracePeriodMinutes);
    setWorkingHours(shift.workingHoursPerDay);
    setIsFlexible(shift.isFlexible ? 'true' : 'false');
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingShift) return;
    setActionLoading(true);
    try {
      await shiftService.update(editingShift._id, {
        name,
        startTime,
        endTime,
        gracePeriodMinutes: Number(gracePeriod),
        workingHoursPerDay: Number(workingHours),
        isFlexible: isFlexible === 'true'
      });
      toast.success('Shift updated successfully.');
      setIsEditOpen(false);
      loadShifts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update shift');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shift?')) return;
    try {
      await shiftService.delete(id);
      toast.success('Shift deleted successfully.');
      loadShifts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete shift');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Shift Management</h2>
          <p className="text-sm text-zinc-500">Configure and assign work shifts across company departments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadShifts} disabled={loading} className="rounded-xl h-10">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {isHR && (
            <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm font-bold text-xs h-10">
              <Plus className="w-4 h-4 mr-2" />
              Create Shift
            </Button>
          )}
        </div>
      </div>

      {/* Utilization Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Shift Protocols', val: shifts.length, sub: 'Active protocols', icon: CalendarRange, color: 'text-blue-500' },
          { label: 'Standard shifts', val: shifts.filter(s => !s.isFlexible).length, sub: 'Fixed time windows', icon: Clock, color: 'text-emerald-500' },
          { label: 'Flexible Shifts', val: shifts.filter(s => s.isFlexible).length, sub: 'Dynamic check-in', icon: Sparkles, color: 'text-purple-500' },
        ].map(({ label, val, sub, icon: Ic, color }) => (
          <Card key={label} className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-extrabold text-zinc-900 dark:text-white mt-1">{val}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
              </div>
              <div className={`p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl ${color}`}>
                <Ic className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Shifts Table */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-bold">Active Shifts</CardTitle>
          <CardDescription>All standard and flexible shifts configured in the system.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 m-4 bg-zinc-50/50 dark:bg-zinc-900/10">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-full border border-blue-100 dark:border-blue-900/30">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No shifts configured</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  There are no shifts created in the system yet. Click below to add a new shift schedule.
                </p>
              </div>
              {isHR && (
                <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs px-4 h-9">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Create Shift
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/40">
                  <TableRow className="border-zinc-100 dark:border-zinc-800">
                    <TableHead className="font-bold">Shift Name</TableHead>
                    <TableHead className="font-bold">Timings</TableHead>
                    <TableHead className="font-bold">Grace Period</TableHead>
                    <TableHead className="font-bold">Working Hours</TableHead>
                    <TableHead className="font-bold">Shift Type</TableHead>
                    {isHR && <TableHead className="text-right font-bold">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map(shift => (
                    <TableRow key={shift._id} className="border-zinc-50 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10">
                      <TableCell className="font-bold text-zinc-800 dark:text-zinc-200">{shift.name}</TableCell>
                      <TableCell className="font-semibold text-zinc-650 dark:text-zinc-350">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {shift.startTime} - {shift.endTime}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-zinc-650 dark:text-zinc-350 text-xs">{shift.gracePeriodMinutes} mins</TableCell>
                      <TableCell className="font-semibold text-zinc-650 dark:text-zinc-350 text-xs">{shift.workingHoursPerDay} hrs</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-bold ${
                          shift.isFlexible 
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/60' 
                            : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/60'
                        }`}>
                          {shift.isFlexible ? 'Flexible' : 'Standard'}
                        </Badge>
                      </TableCell>
                      {isHR && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(shift)} className="h-8 w-8 text-zinc-450 hover:text-zinc-700 rounded-lg">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(shift._id)} className="h-8 w-8 text-red-500 hover:text-red-750 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Shift Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Create Shift Protocol
              </DialogTitle>
              <DialogDescription className="text-zinc-455">Add a new work shift protocol to associate with profiles.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-zinc-400 uppercase">Shift Name</Label>
                <Input
                  id="name"
                  placeholder="Morning Shift"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="startTime" className="text-xs font-bold text-zinc-400 uppercase">Start Time (HH:mm)</Label>
                  <Input
                    id="startTime"
                    placeholder="09:00"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="endTime" className="text-xs font-bold text-zinc-400 uppercase">End Time (HH:mm)</Label>
                  <Input
                    id="endTime"
                    placeholder="18:00"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="grace" className="text-xs font-bold text-zinc-400 uppercase">Grace Period (Minutes)</Label>
                  <Input
                    id="grace"
                    type="number"
                    value={gracePeriod}
                    onChange={e => setGracePeriod(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hours" className="text-xs font-bold text-zinc-400 uppercase">Working Hours Per Day</Label>
                  <Input
                    id="hours"
                    type="number"
                    value={workingHours}
                    onChange={e => setWorkingHours(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="isFlexible" className="text-xs font-bold text-zinc-400 uppercase">Shift Type</Label>
                <Select value={isFlexible} onValueChange={setIsFlexible}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Standard Fixed Shift</SelectItem>
                    <SelectItem value="true">Flexible Check-In Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                {actionLoading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Edit Shift Protocol
              </DialogTitle>
              <DialogDescription className="text-zinc-455">Modify shift timing parameters.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-bold text-zinc-400 uppercase">Shift Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-startTime" className="text-xs font-bold text-zinc-400 uppercase">Start Time (HH:mm)</Label>
                  <Input
                    id="edit-startTime"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-endTime" className="text-xs font-bold text-zinc-400 uppercase">End Time (HH:mm)</Label>
                  <Input
                    id="edit-endTime"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-grace" className="text-xs font-bold text-zinc-400 uppercase">Grace Period (Minutes)</Label>
                  <Input
                    id="edit-grace"
                    type="number"
                    value={gracePeriod}
                    onChange={e => setGracePeriod(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-hours" className="text-xs font-bold text-zinc-400 uppercase">Working Hours Per Day</Label>
                  <Input
                    id="edit-hours"
                    type="number"
                    value={workingHours}
                    onChange={e => setWorkingHours(Number(e.target.value))}
                    className="rounded-xl h-10 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit-isFlexible" className="text-xs font-bold text-zinc-400 uppercase">Shift Type</Label>
                <Select value={isFlexible} onValueChange={setIsFlexible}>
                  <SelectTrigger className="rounded-xl h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Standard Fixed Shift</SelectItem>
                    <SelectItem value="true">Flexible Check-In Shift</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
