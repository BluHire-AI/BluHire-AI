'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { attendanceService, AttendanceRecord, AttendanceStatus } from '@/services/attendance.service';
import { employeeService } from '@/services/employee.service';
import { leaveService, Leave } from '@/services/leave.service';
import { holidayService, Holiday } from '@/services/holiday.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock, Sparkles, LogIn, LogOut, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PRESENT:        { label: 'Present',       dot: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-400' },
  LATE:           { label: 'Late',          dot: 'bg-amber-450',  bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40',         text: 'text-amber-700 dark:text-amber-400'   },
  ABSENT:         { label: 'Absent',        dot: 'bg-red-500',    bg: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40',                 text: 'text-red-700 dark:text-red-400'     },
  HALF_DAY:       { label: 'Half Day',      dot: 'bg-orange-450', bg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40',             text: 'text-orange-700 dark:text-orange-400' },
  ON_LEAVE:       { label: 'On Leave',      dot: 'bg-blue-500',   bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40',             text: 'text-blue-700 dark:text-blue-400'   },
  HOLIDAY:        { label: 'Holiday',       dot: 'bg-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40',             text: 'text-purple-700 dark:text-purple-400' },
  WEEKEND:        { label: 'Weekend',       dot: 'bg-zinc-350 dark:bg-zinc-600', bg: 'bg-zinc-50 dark:bg-zinc-900/40 border-zinc-150 dark:border-zinc-800', text: 'text-zinc-650 dark:text-zinc-400' },
  WORK_FROM_HOME: { label: 'Work From Home',dot: 'bg-teal-500',   bg: 'bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/40',             text: 'text-teal-700 dark:text-teal-400'   },
};

function fmtHours(h: number) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  return `${hr}h${min > 0 ? ` ${min}m` : ''}`;
}

function fmt12(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function AttendanceCalendarPage() {
  const { user } = useAuthStore();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear]   = useState(now.getFullYear());
  
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves]   = useState<Leave[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  
  const [loading, setLoading] = useState(false);

  // Detail Drawer state
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    employeeService.getMe()
      .then(emp => { if (emp) setEmployeeId(emp._id); })
      .catch(() => {});
  }, [user]);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
      const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;
      
      const [attRes, leavesRes, holidaysRes] = await Promise.all([
        attendanceService.getHistory({ employeeId, startDate: start, endDate: end, limit: 100 }),
        leaveService.list({ employeeId, startDate: start, endDate: end, limit: 100 }),
        holidayService.list({ year, month: month + 1, limit: 100 })
      ]);

      setRecords(attRes.records || []);
      setLeaves(leavesRes.data || []);
      setHolidays(holidaysRes.data || []);
    } catch (err) {
      console.error('Failed to load calendar data', err);
      setRecords([]);
      setLeaves([]);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, [employeeId, month, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  // Index maps
  const recordMap: Record<number, AttendanceRecord> = {};
  records.forEach(r => {
    recordMap[new Date(r.date).getDate()] = r;
  });

  const holidayMap: Record<number, Holiday> = {};
  holidays.forEach(h => {
    holidayMap[new Date(h.date).getDate()] = h;
  });

  const leaveMap: Record<number, Leave> = {};
  leaves.forEach(l => {
    const lStart = new Date(l.startDate);
    const lEnd = new Date(l.endDate);
    for (let d = 1; d <= daysInMonth; d++) {
      const current = new Date(year, month, d);
      if (current >= lStart && current <= lEnd && l.status === 'APPROVED') {
        leaveMap[d] = l;
      }
    }
  });

  // Merge daily statuses
  const getDayStatus = (day: number): { status: string; record?: AttendanceRecord; leave?: Leave; holiday?: Holiday } => {
    const holiday = holidayMap[day];
    if (holiday) return { status: 'HOLIDAY', holiday };

    const leave = leaveMap[day];
    if (leave) return { status: 'ON_LEAVE', leave };

    const record = recordMap[day];
    if (record) return { status: record.attendanceStatus, record };

    const date = new Date(year, month, day);
    if (date.getDay() === 0 || date.getDay() === 6) return { status: 'WEEKEND' };

    if (date < now) {
      // past day and no checkin/leave/holiday => Absent
      const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
      if (!isToday) return { status: 'ABSENT' };
    }

    return { status: 'NONE' };
  };

  const handleDayClick = (day: number, isFuture: boolean) => {
    if (isFuture) return;
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  // Extract selected details
  const selectedInfo = selectedDay !== null ? getDayStatus(selectedDay) : null;
  const selectedDateStr = selectedDay !== null 
    ? new Date(year, month, selectedDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="space-y-6">
      
      {/* Month nav & actions */}
      <div className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <Button variant="outline" size="icon" onClick={prevMonth} className="rounded-xl"><ChevronLeft className="w-4 h-4" /></Button>
        <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          {monthName}
        </h2>
        <Button variant="outline" size="icon" onClick={nextMonth} className="rounded-xl"><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-4 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2 text-xs font-bold text-zinc-500 dark:text-zinc-400">
            <div className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
            {val.label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
        <CardContent className="p-4">
          {loading ? (
            <div className="grid grid-cols-7 gap-2.5">
              {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2.5">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pb-2">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} className="bg-zinc-50/20 dark:bg-zinc-950/10 rounded-xl" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const { status, record } = getDayStatus(day);
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                const isFuture = new Date(year, month, day) > now;
                const config = STATUS_CONFIG[status];
                const dot = config?.dot ?? '';

                return (
                  <motion.div
                    key={day}
                    whileHover={!isFuture ? { scale: 1.03 } : {}}
                    onClick={() => handleDayClick(day, isFuture)}
                    className={`relative rounded-xl border p-2 min-h-[72px] flex flex-col items-center justify-between cursor-pointer transition-all
                      ${isToday ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-sm' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50/30 dark:hover:bg-zinc-800/20'}
                      ${isFuture ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className={`text-xs font-extrabold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-650 dark:text-zinc-350'}`}>
                      {day}
                    </span>
                    {config && (
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} title={config.label} />
                        {(record?.workingHours ?? 0) > 0 && (
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold">{fmtHours(record!.workingHours)}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog Drawer */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Day Details
            </DialogTitle>
            <DialogDescription className="text-zinc-400 font-medium">{selectedDateStr}</DialogDescription>
          </DialogHeader>

          {selectedInfo && (
            <div className="py-4 space-y-4">
              {/* Status Banner */}
              <div className={`flex items-center gap-3 p-4 rounded-xl border border-dashed ${STATUS_CONFIG[selectedInfo.status]?.bg || 'bg-zinc-50 dark:bg-zinc-800/30'}`}>
                <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[selectedInfo.status]?.dot || 'bg-zinc-400'}`} />
                <div>
                  <p className="text-xs text-zinc-400 font-bold uppercase">Status</p>
                  <p className={`text-base font-bold ${STATUS_CONFIG[selectedInfo.status]?.text || 'text-zinc-850'}`}>
                    {STATUS_CONFIG[selectedInfo.status]?.label || 'No log details'}
                  </p>
                </div>
              </div>

              {/* Attendance specific details */}
              {selectedInfo.record && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-450 font-bold uppercase">Check In</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                      <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                      {fmt12(selectedInfo.record.checkInTime)}
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-450 font-bold uppercase">Check Out</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      {fmt12(selectedInfo.record.checkOutTime)}
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-450 font-bold uppercase">Hours Worked</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      {selectedInfo.record.workingHours > 0 ? fmtHours(selectedInfo.record.workingHours) : '—'}
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <p className="text-[10px] text-zinc-450 font-bold uppercase">Overtime Hours</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                      {selectedInfo.record.overtimeHours > 0 ? fmtHours(selectedInfo.record.overtimeHours) : '—'}
                    </p>
                  </div>
                  {selectedInfo.record.location && (
                    <div className="col-span-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-xs font-semibold text-zinc-500">
                      <MapPin className="w-4 h-4 text-zinc-400" />
                      Location: {selectedInfo.record.location}
                    </div>
                  )}
                  {selectedInfo.record.remarks && (
                    <div className="col-span-2 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400 italic">
                      Remarks: "{selectedInfo.record.remarks}"
                    </div>
                  )}
                </div>
              )}

              {/* Holiday specific details */}
              {selectedInfo.holiday && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-1">
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{selectedInfo.holiday.name}</p>
                  {selectedInfo.holiday.description && (
                    <p className="text-xs text-zinc-550">{selectedInfo.holiday.description}</p>
                  )}
                  <Badge variant="outline" className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-900/40 uppercase font-bold mt-2">
                    Official Company Holiday
                  </Badge>
                </div>
              )}

              {/* Leave specific details */}
              {selectedInfo.leave && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div>
                    <p className="text-[10px] text-zinc-450 font-bold uppercase">Leave Type</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{selectedInfo.leave.leaveType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-450 font-bold uppercase">Duration</p>
                    <p className="text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                      {new Date(selectedInfo.leave.startDate).toLocaleDateString('en-IN')} - {new Date(selectedInfo.leave.endDate).toLocaleDateString('en-IN')} ({selectedInfo.leave.totalDays || 1} days)
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-450 font-bold uppercase">Reason</p>
                    <p className="text-xs text-zinc-500 italic mt-0.5">"{selectedInfo.leave.reason}"</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full rounded-xl">
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
