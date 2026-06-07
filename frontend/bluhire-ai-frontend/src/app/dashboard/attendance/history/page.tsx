'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { attendanceService, AttendanceRecord, AttendanceStatus } from '@/services/attendance.service';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PRESENT:        { label: 'Present',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  LATE:           { label: 'Late',          cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'           },
  ABSENT:         { label: 'Absent',        cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'                       },
  HALF_DAY:       { label: 'Half Day',      cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800'     },
  ON_LEAVE:       { label: 'On Leave',      cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800'                 },
  HOLIDAY:        { label: 'Holiday',       cls: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800'     },
  WEEKEND:        { label: 'Weekend',       cls: 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700'                  },
  WORK_FROM_HOME: { label: 'Work From Home',cls: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400 dark:border-teal-800'                 },
};

function fmt12(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function fmtHours(h: number) {
  const hr = Math.floor(h); const min = Math.round((h - hr) * 60);
  return `${hr}h ${min}m`;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const LIMIT = 12;

export default function AttendanceHistoryPage() {
  const { user } = useAuthStore();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
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
      const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const end   = new Date(year, month, 0).toISOString().split('T')[0];
      const res = await attendanceService.getHistory({ employeeId, startDate: start, endDate: end, page, limit: LIMIT });
      setRecords(res.records || []);
      setTotal(res.total || 0);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }, [employeeId, month, year, page]);

  useEffect(() => { setPage(1); }, [month, year]);
  useEffect(() => { load(); }, [load]);

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={String(month)} onValueChange={v => setMonth(Number(v))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={v => setYear(Number(v))}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60">
            <TableRow className="border-zinc-100 dark:border-zinc-800">
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold">Check In</TableHead>
              <TableHead className="font-semibold">Check Out</TableHead>
              <TableHead className="font-semibold">Hours</TableHead>
              <TableHead className="font-semibold">Overtime</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20 rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-zinc-400 py-14 text-sm">
                  No attendance records found for {MONTHS[month - 1]} {year}.
                </TableCell>
              </TableRow>
            ) : (
              records.map(rec => {
                const badge = STATUS_BADGE[rec.attendanceStatus] ?? STATUS_BADGE['ABSENT'];
                return (
                  <TableRow key={rec._id} className="border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <TableCell className="font-semibold text-zinc-700 dark:text-zinc-200">
                      {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="tabular-nums text-zinc-600 dark:text-zinc-300">{fmt12(rec.checkInTime)}</TableCell>
                    <TableCell className="tabular-nums text-zinc-600 dark:text-zinc-300">{fmt12(rec.checkOutTime)}</TableCell>
                    <TableCell className="tabular-nums font-medium">{rec.workingHours > 0 ? fmtHours(rec.workingHours) : '—'}</TableCell>
                    <TableCell className={`tabular-nums font-medium ${rec.overtimeHours > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'}`}>
                      {rec.overtimeHours > 0 ? fmtHours(rec.overtimeHours) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs border ${badge.cls}`}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-xs">
                      {rec.location ? (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rec.location}</span>
                      ) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
            <p className="text-xs text-zinc-400">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} records
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
