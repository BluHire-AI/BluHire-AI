'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { attendanceService, AttendanceRecord, AttendanceStatus } from '@/services/attendance.service';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  PRESENT:        { label: 'Present',       dot: 'bg-emerald-500' },
  LATE:           { label: 'Late',          dot: 'bg-amber-400'   },
  ABSENT:         { label: 'Absent',        dot: 'bg-red-500'     },
  HALF_DAY:       { label: 'Half Day',      dot: 'bg-orange-400'  },
  ON_LEAVE:       { label: 'On Leave',      dot: 'bg-blue-500'    },
  HOLIDAY:        { label: 'Holiday',       dot: 'bg-purple-400'  },
  WEEKEND:        { label: 'Weekend',       dot: 'bg-zinc-300 dark:bg-zinc-600' },
  WORK_FROM_HOME: { label: 'Work From Home',dot: 'bg-teal-500'    },
};

function fmtHours(h: number) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  return `${hr}h${min > 0 ? ` ${min}m` : ''}`;
}

export default function AttendanceCalendarPage() {
  const { user } = useAuthStore();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear]   = useState(now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/employees', { params: { search: user.email, limit: 1 } })
      .then(res => { const emp = res.data?.data?.data?.[0]; if (emp) setEmployeeId(emp._id); })
      .catch(() => {});
  }, [user]);

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end   = new Date(year, month + 1, 0).toISOString().split('T')[0];
      const res = await attendanceService.getHistory({ employeeId, startDate: start, endDate: end, limit: 62 });
      setRecords(res.records || []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }, [employeeId, month, year]);

  useEffect(() => { load(); }, [load]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const recordMap: Record<number, AttendanceRecord> = {};
  records.forEach(r => { recordMap[new Date(r.date).getDate()] = r; });

  return (
    <div className="space-y-6">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">{monthName}</h2>
        <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(STATUS_CONFIG).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-zinc-500">
            <div className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
            {val.label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <Card className="border-zinc-200/60 dark:border-zinc-800">
        <CardContent className="p-4">
          {loading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} className="text-center text-[11px] font-bold text-zinc-400 pb-2">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const rec = recordMap[day];
                const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
                const isFuture = new Date(year, month, day) > now;
                const dot = rec ? STATUS_CONFIG[rec.attendanceStatus]?.dot : '';

                return (
                  <motion.div
                    key={day}
                    whileHover={!isFuture ? { scale: 1.04 } : {}}
                    className={`relative rounded-xl border p-2 min-h-[64px] flex flex-col items-center justify-between transition-all
                      ${isToday ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-sm' : 'border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900'}
                      ${isFuture ? 'opacity-35' : ''}
                    `}
                  >
                    <span className={`text-xs font-bold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-300'}`}>
                      {day}
                    </span>
                    {rec && <div className={`w-3 h-3 rounded-full ${dot} mt-1`} title={STATUS_CONFIG[rec.attendanceStatus]?.label} />}
                    {(rec?.workingHours ?? 0) > 0 && (
                      <span className="text-[9px] text-zinc-400 font-medium">{fmtHours(rec!.workingHours)}</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
