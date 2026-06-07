'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { attendanceService, AttendanceRecord, AttendanceStatus } from '@/services/attendance.service';
import { employeeService } from '@/services/employee.service';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, MapPin, Search, Download } from 'lucide-react';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PRESENT:        { label: 'Present',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/60' },
  LATE:           { label: 'Late',          cls: 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/60'           },
  ABSENT:         { label: 'Absent',        cls: 'bg-red-50 text-red-700 border-red-250 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/60'                       },
  HALF_DAY:       { label: 'Half Day',      cls: 'bg-orange-50 text-orange-700 border-orange-250 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/60'     },
  ON_LEAVE:       { label: 'On Leave',      cls: 'bg-blue-50 text-blue-700 border-blue-250 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/60'                 },
  HOLIDAY:        { label: 'Holiday',       cls: 'bg-purple-50 text-purple-700 border-purple-250 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/60'     },
  WEEKEND:        { label: 'Weekend',       cls: 'bg-zinc-50 text-zinc-500 border-zinc-250 dark:bg-zinc-800/40 dark:text-zinc-400 dark:border-zinc-700'                  },
  WORK_FROM_HOME: { label: 'Work From Home',cls: 'bg-teal-50 text-teal-700 border-teal-250 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/60'                 },
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
const LIMIT = 10;

export default function AttendanceHistoryPage() {
  const { user } = useAuthStore();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);

  // Resolve employee ID timezone-safely
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

  const load = useCallback(async () => {
    const targetEmpId = isHR ? selectedEmployeeId : employeeId;
    if (!targetEmpId) return;
    setLoading(true);
    try {
      // Timezone-safe local dates
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
      
      const params: any = {
        employeeId: targetEmpId,
        startDate: start,
        endDate: end,
        page,
        limit: LIMIT,
      };

      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }

      const res = await attendanceService.getHistory(params);
      setRecords(res.records || []);
      setTotal(res.total || 0);
    } catch { 
      setRecords([]); 
      setTotal(0);
    } finally { 
      setLoading(false); 
    }
  }, [employeeId, selectedEmployeeId, isHR, month, year, page, statusFilter]);

  useEffect(() => { setPage(1); }, [month, year, statusFilter]);
  useEffect(() => { load(); }, [load]);

  const exportCSV = () => {
    if (records.length === 0) {
      toast.error('No records available to export.');
      return;
    }
    const headers = ['Date', 'Check In', 'Check Out', 'Hours Worked', 'Overtime Hours', 'Status', 'Location', 'Remarks'];
    const rows = records.map(rec => [
      new Date(rec.date).toLocaleDateString('en-IN'),
      rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString('en-IN') : '—',
      rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString('en-IN') : '—',
      rec.workingHours || 0,
      rec.overtimeHours || 0,
      rec.attendanceStatus,
      rec.location || '—',
      rec.remarks || '—'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_history_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV exported successfully!');
  };

  const filteredRecords = records.filter(rec => {
    const query = searchQuery.toLowerCase();
    const loc = (rec.location || '').toLowerCase();
    const remarks = (rec.remarks || '').toLowerCase();
    const dateStr = new Date(rec.date).toLocaleDateString('en-IN').toLowerCase();
    return loc.includes(query) || remarks.includes(query) || dateStr.includes(query);
  });

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-5">
      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={String(month)} onValueChange={(v: string) => setMonth(Number(v))}>
            <SelectTrigger className="w-40 h-10 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={String(year)} onValueChange={(v: string) => setYear(Number(v))}>
            <SelectTrigger className="w-28 h-10 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-10 rounded-xl"><SelectValue placeholder="Status Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PRESENT">Present</SelectItem>
              <SelectItem value="LATE">Late</SelectItem>
              <SelectItem value="ABSENT">Absent</SelectItem>
              <SelectItem value="HALF_DAY">Half Day</SelectItem>
              <SelectItem value="ON_LEAVE">On Leave</SelectItem>
              <SelectItem value="HOLIDAY">Holiday</SelectItem>
              <SelectItem value="WORK_FROM_HOME">Work From Home</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-64 h-10">
            <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
            <Input
              placeholder="Search location/remarks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs"
            />
          </div>

          {isHR && (
            <div className="w-64">
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="Select Employee profile" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button onClick={exportCSV} variant="outline" className="h-10 rounded-xl font-bold flex gap-1.5 items-center">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60">
            <TableRow className="border-zinc-100 dark:border-zinc-800">
              <TableHead className="font-bold">Date</TableHead>
              <TableHead className="font-bold">Check In</TableHead>
              <TableHead className="font-bold">Check Out</TableHead>
              <TableHead className="font-bold">Hours</TableHead>
              <TableHead className="font-bold">Overtime</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Location & Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-20 rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-zinc-50/50 dark:bg-zinc-900/10">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-850 text-zinc-500 rounded-full border border-zinc-200 dark:border-zinc-800">
                      <Search className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No attendance records found</h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                        There are no attendance records logged matching the selected filters for {MONTHS[month - 1]} {year}.
                      </p>
                    </div>
                    <Button onClick={load} variant="outline" className="h-9 rounded-xl text-xs px-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      Refresh Records
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map(rec => {
                const badge = STATUS_BADGE[rec.attendanceStatus] ?? STATUS_BADGE['ABSENT'];
                return (
                  <TableRow key={rec._id} className="border-zinc-50 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20">
                    <TableCell className="font-bold text-zinc-700 dark:text-zinc-200">
                      {new Date(rec.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="tabular-nums text-zinc-650 dark:text-zinc-300 font-semibold">{fmt12(rec.checkInTime)}</TableCell>
                    <TableCell className="tabular-nums text-zinc-650 dark:text-zinc-300 font-semibold">{fmt12(rec.checkOutTime)}</TableCell>
                    <TableCell className="tabular-nums font-semibold">{rec.workingHours > 0 ? fmtHours(rec.workingHours) : '—'}</TableCell>
                    <TableCell className={`tabular-nums font-semibold ${rec.overtimeHours > 0 ? 'text-amber-600 dark:text-amber-450' : 'text-zinc-450'}`}>
                      {rec.overtimeHours > 0 ? fmtHours(rec.overtimeHours) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-bold border ${badge.cls}`}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-zinc-450 text-xs">
                      <div className="flex flex-col gap-0.5">
                        {rec.location && (
                          <span className="flex items-center gap-1 font-semibold"><MapPin className="w-3.5 h-3.5 text-zinc-400" />{rec.location}</span>
                        )}
                        {rec.remarks && <span className="italic">"{rec.remarks}"</span>}
                        {!rec.location && !rec.remarks && '—'}
                      </div>
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
            <p className="text-xs text-zinc-400 font-bold">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} records
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-xl">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)} className="rounded-xl">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
