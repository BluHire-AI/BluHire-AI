'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { attendanceService, AttendanceSummary } from '@/services/attendance.service';
import { employeeService, Employee } from '@/services/employee.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingUp, RefreshCw, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function fmtHours(h: number) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  return `${hr}h ${min}m`;
}

export default function AttendanceAnalyticsPage() {
  const { user } = useAuthStore();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  
  // HR employee list switcher
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  // 1. Resolve logged-in employee record securely
  useEffect(() => {
    if (!user) return;
    employeeService.getMe()
      .then(emp => {
        if (emp) {
          setEmployeeId(emp._id);
          setSelectedEmployeeId(emp._id);
        }
      })
      .catch((err) => {
        console.warn('[ATTENDANCE] Fallback used. Employee profile not configured.', err.message || err);
      });
  }, [user]);

  // 2. Fetch employee directory if HR
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
        .catch((err) => console.error('Failed to load employee list', err));
    }
  }, [isHR, selectedEmployeeId]);

  // 3. Load Monthly Summary data
  const load = useCallback(async () => {
    const targetEmpId = isHR ? selectedEmployeeId : employeeId;
    if (!targetEmpId) return;

    setLoading(true);
    try {
      const s = await attendanceService.getSummary(targetEmpId, month, year);
      setSummary(s);
    } catch (err) {
      console.error('Failed to load attendance summary', err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [employeeId, selectedEmployeeId, isHR, month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const pct = summary?.attendancePercentage ?? 0;

  const bars = summary ? [
    { label: 'Present',  val: summary.presentDays,  total: summary.totalWorkingDays, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-450' },
    { label: 'Late',     val: summary.lateDays,     total: summary.totalWorkingDays, color: 'bg-amber-400',  text: 'text-amber-600 dark:text-amber-400'   },
    { label: 'Absent',   val: summary.absentDays,   total: summary.totalWorkingDays, color: 'bg-red-500',    text: 'text-red-600 dark:text-red-400'     },
    { label: 'On Leave', val: summary.leaveDays,    total: summary.totalWorkingDays, color: 'bg-blue-500',   text: 'text-blue-600 dark:text-blue-400'    },
  ] : [];

  const statCards = summary ? [
    { label: 'Present Days',   val: summary.presentDays,                    sub: `of ${summary.totalWorkingDays} working days`, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Absent Days',    val: summary.absentDays,                     sub: 'total absences',                              icon: XCircle,      color: 'text-red-500'     },
    { label: 'Late Arrivals',  val: summary.lateDays,                       sub: 'late check-ins',                              icon: AlertCircle,  color: 'text-amber-500'   },
    { label: 'Leave Taken',    val: summary.leaveDays,                      sub: 'approved leaves',                             icon: Clock,        color: 'text-blue-500'    },
    { label: 'Total Hours',    val: fmtHours(summary.totalWorkingHours),    sub: 'hours worked this month',                     icon: Clock,        color: 'text-purple-500'  },
    { label: 'Overtime Hours', val: fmtHours(summary.totalOvertimeHours),   sub: 'extra hours logged',                          icon: TrendingUp,   color: 'text-orange-500'  },
  ] : [];

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Filters and Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select value={String(month)} onValueChange={(v: string) => setMonth(Number(v))}>
            <SelectTrigger className="w-40 rounded-xl h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v: string) => setYear(Number(v))}>
            <SelectTrigger className="w-28 rounded-xl h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="rounded-xl h-10">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* HR Employee Selector */}
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

      {/* Attendance ring + bar breakdown */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            {MONTHS[month - 1]} {year} — Attendance Summary
          </CardTitle>
          <CardDescription>Monthly statistics and metrics visualization.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex gap-8 flex-col md:flex-row">
              <Skeleton className="w-40 h-40 rounded-full shrink-0" />
              <div className="flex-1 space-y-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 rounded-xl w-full" />)}
              </div>
            </div>
          ) : summary ? (
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Ring */}
              <div className="relative shrink-0">
                <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="12" className="text-zinc-100 dark:text-zinc-850" />
                  <circle
                    cx="60" cy="60" r="50" fill="none"
                    stroke={pct >= 90 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#ef4444'}
                    strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-zinc-900 dark:text-white">{pct.toFixed(0)}%</span>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Attendance</span>
                </div>
              </div>

              {/* Bars */}
              <div className="flex-1 w-full space-y-3 font-semibold text-xs">
                {bars.map(b => (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-600 dark:text-zinc-300">{b.label}</span>
                      <span className={`font-bold ${b.text}`}>{b.val} days</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${b.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: b.total > 0 ? `${(b.val / b.total) * 100}%` : '0%' }}
                        transition={{ duration: 0.7 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-zinc-50/50 dark:bg-zinc-900/10">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-850 text-zinc-500 rounded-full border border-zinc-200 dark:border-zinc-800">
                <BarChart3 className="w-8 h-8 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No attendance summary available</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  There is no summary data calculated for the selected employee in this month. Try refreshing the selection.
                </p>
              </div>
              <Button onClick={load} variant="outline" className="h-9 rounded-xl text-xs px-4 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Refresh Summary
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map(({ label, val, sub, icon: Ic, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-5 shadow-sm"
            >
              <Ic className={`w-5 h-5 ${color} mb-3`} />
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{val}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{label}</p>
              <p className="text-[11px] text-zinc-550 dark:text-zinc-450 font-medium mt-0.5">{sub}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

