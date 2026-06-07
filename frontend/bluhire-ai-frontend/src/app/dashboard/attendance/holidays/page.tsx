'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { holidayService, Holiday } from '@/services/holiday.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, CalendarHeart, Gift, RefreshCw, Calendar, Sparkles, AlertCircle, Timer } from 'lucide-react';
import { toast } from 'sonner';

export default function HolidaysPage() {
  const { user } = useAuthStore();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [type, setType] = useState('PUBLIC'); // 'PUBLIC' or 'OPTIONAL'
  const [description, setDescription] = useState('');

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  const loadHolidays = useCallback(async () => {
    setLoading(true);
    try {
      const res = await holidayService.list({ limit: 100 });
      setHolidays(res.data || []);
    } catch (err) {
      console.error('Failed to load holidays', err);
      toast.error('Failed to load holidays from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHolidays();
  }, [loadHolidays]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date) {
      toast.error('Please specify the holiday name and date.');
      return;
    }

    setActionLoading(true);
    try {
      await holidayService.create({
        name,
        date,
        description,
        isOptional: type === 'OPTIONAL',
      });

      toast.success('🎉 Holiday added successfully!');
      setIsOpen(false);
      
      // Reset form fields
      setName('');
      setDate('');
      setType('PUBLIC');
      setDescription('');

      loadHolidays();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add holiday.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday record?')) return;
    try {
      await holidayService.delete(id);
      toast.success('Holiday deleted successfully.');
      loadHolidays();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to delete holiday.');
    }
  };

  // Helper calculations for Countdown & Upcoming Timeline
  const getNextHoliday = () => {
    if (holidays.length === 0) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedUpcoming = holidays
      .map(h => ({ ...h, parsedDate: new Date(h.date) }))
      .filter(h => h.parsedDate >= today)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

    if (sortedUpcoming.length === 0) return null;

    const next = sortedUpcoming[0];
    const diffTime = next.parsedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      holiday: next,
      daysLeft: diffDays,
    };
  };

  const getUpcomingHolidays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return holidays
      .map(h => ({ ...h, parsedDate: new Date(h.date) }))
      .filter(h => h.parsedDate >= today)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
  };

  const nextHolidayData = getNextHoliday();
  const upcomingHolidays = getUpcomingHolidays();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Holiday Calendar</h2>
          <p className="text-sm text-zinc-500">Configure and track company-wide official and optional holidays.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadHolidays} disabled={loading} className="rounded-xl h-10">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {isHR && (
            <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm font-bold text-xs h-10">
              <Plus className="w-4 h-4 mr-2" />
              Add Holiday
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarHeart className="w-5 h-5 text-rose-500" />
                  All Company Holidays
                </CardTitle>
                <CardDescription>A comprehensive listing of current company holidays.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 text-center text-zinc-550 text-xs font-semibold">
                  Loading holidays...
                </div>
              ) : holidays.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 m-4 bg-zinc-50/50 dark:bg-zinc-900/10">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-full border border-blue-100 dark:border-blue-900/30">
                    <CalendarHeart className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No holidays configured</h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                      There are no holidays configured on the company calendar yet. Click below to add a holiday.
                    </p>
                  </div>
                  {isHR && (
                    <Button onClick={() => setIsOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs px-4 h-9">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Holiday
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/40">
                      <TableRow className="border-zinc-100 dark:border-zinc-800">
                        <TableHead className="font-bold">Holiday Name</TableHead>
                        <TableHead className="font-bold">Date</TableHead>
                        <TableHead className="font-bold">Type</TableHead>
                        <TableHead className="font-bold">Description</TableHead>
                        {isHR && <TableHead className="text-right font-bold">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holidays.map(h => (
                        <TableRow key={h._id} className="border-zinc-50 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/10">
                          <TableCell className="font-bold text-zinc-800 dark:text-zinc-200">{h.name}</TableCell>
                          <TableCell className="font-semibold text-zinc-650 dark:text-zinc-350 text-xs">
                            {new Date(h.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[10px] font-bold ${
                              h.isOptional
                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/60'
                                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/60'
                            }`}>
                              {h.isOptional ? 'Optional Holiday' : 'Public Holiday'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-zinc-500 dark:text-zinc-400 text-xs font-medium max-w-[200px] truncate">
                            {h.description || '—'}
                          </TableCell>
                          {isHR && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(h._id)}
                                className="h-8 w-8 text-red-500 hover:text-red-750 rounded-lg hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
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
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          {/* Countdown Widget */}
          <Card className="border-zinc-200/60 dark:border-zinc-800 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" />
                Next Holiday Countdown
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {nextHolidayData ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-black text-white">{nextHolidayData.holiday.name}</p>
                    <p className="text-xs text-indigo-200 mt-1 font-semibold">
                      {new Date(nextHolidayData.holiday.date).toLocaleDateString('en-IN', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                  <div className="pt-2 flex items-baseline gap-2">
                    <span className="text-5xl font-black text-white">{nextHolidayData.daysLeft}</span>
                    <span className="text-xs font-extrabold uppercase text-indigo-300">Days Left</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-indigo-200 text-xs font-semibold">
                  No upcoming holidays scheduled.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Widget */}
          <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Gift className="w-4.5 h-4.5 text-blue-500" />
                Upcoming Timeline
              </CardTitle>
              <CardDescription>Chronological timeline of upcoming leaves/holidays.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {upcomingHolidays.length === 0 ? (
                <div className="py-6 text-center text-zinc-450 text-xs font-semibold">
                  No upcoming holidays left this year.
                </div>
              ) : (
                <div className="relative border-l border-zinc-200 dark:border-zinc-800 ml-2.5 pl-5 space-y-6">
                  {upcomingHolidays.slice(0, 5).map(h => (
                    <div key={h._id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[26px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-zinc-150 dark:bg-zinc-850 ring-4 ring-white dark:ring-zinc-950">
                        <span className={`h-1.5 w-1.5 rounded-full ${h.isOptional ? 'bg-purple-500' : 'bg-rose-500'}`} />
                      </span>
                      <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          {h.name}
                          <span className="text-[10px] font-semibold text-zinc-455">
                            ({h.isOptional ? 'Optional' : 'Public'})
                          </span>
                        </p>
                        <p className="text-[10px] text-zinc-455 font-semibold mt-0.5">
                          {new Date(h.date).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        {h.description && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-450 mt-1 line-clamp-2 italic">
                            "{h.description}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Holiday Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                Add New Holiday
              </DialogTitle>
              <DialogDescription className="text-zinc-450">Register a new company holiday for employee view and calendar integration.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Holiday Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-bold text-zinc-400 uppercase">Holiday Name</Label>
                <Input
                  id="name"
                  placeholder="Christmas Day"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                  required
                />
              </div>

              {/* Date & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-bold text-zinc-400 uppercase">Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="pl-9 rounded-xl h-10 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="type" className="text-xs font-bold text-zinc-400 uppercase">Holiday Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public Holiday</SelectItem>
                      <SelectItem value="OPTIONAL">Optional Holiday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-bold text-zinc-400 uppercase">Description / Details</Label>
                <Textarea
                  id="description"
                  placeholder="Optional details, e.g., standard holiday rules..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="rounded-xl text-xs min-h-[80px]"
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">
                {actionLoading ? 'Creating...' : 'Add Holiday'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

