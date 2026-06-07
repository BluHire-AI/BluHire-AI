'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { attendanceService, AttendanceRecord, AttendanceStatus } from '@/services/attendance.service';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Clock, LogIn, LogOut, Timer, TrendingUp,
  AlertCircle, CheckCircle2, XCircle, Coffee,
  Home, Sun, Umbrella, RefreshCw, User, MapPin, ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PRESENT:        { label: 'Present',       color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2 },
  LATE:           { label: 'Late',           color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',         icon: AlertCircle  },
  ABSENT:         { label: 'Absent',         color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',                 icon: XCircle      },
  HALF_DAY:       { label: 'Half Day',       color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',     icon: Clock        },
  ON_LEAVE:       { label: 'On Leave',       color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',             icon: Umbrella     },
  HOLIDAY:        { label: 'Holiday',        color: 'text-purple-600',  bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',     icon: Sun          },
  WEEKEND:        { label: 'Weekend',        color: 'text-zinc-500',    bg: 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-700',             icon: Coffee       },
  WORK_FROM_HOME: { label: 'Work From Home', color: 'text-teal-600',    bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800',            icon: Home         },
};

function fmt12(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtHours(h: number) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  return `${hr}h ${min}m`;
}

function elapsedStr(from: string): string {
  const ms = Date.now() - new Date(from).getTime();
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 3600)).padStart(2,'0')}:${String(Math.floor((s % 3600) / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
}

export default function AttendanceOverviewPage() {
  const { user } = useAuthStore();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [allowSelfCheckIn, setAllowSelfCheckIn] = useState(true);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [clock, setClock] = useState(new Date());
  const [elapsed, setElapsed] = useState('00:00:00');

  // Live clock tick
  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date());
      if (record?.checkInTime && !record.checkOutTime) {
        setElapsed(elapsedStr(record.checkInTime));
      }
    }, 1000);
    return () => clearInterval(t);
  }, [record]);

  // Resolve employee ID
  useEffect(() => {
    if (!user) return;
    api.get('/employees', { params: { search: user.email, limit: 1 } })
      .then(res => {
        const emp = res.data?.data?.data?.[0];
        if (emp) {
          setEmployeeId(emp._id);
          setAllowSelfCheckIn(emp.allowSelfCheckIn !== false);
        }
      })
      .catch(() => {});
  }, [user]);

  const loadToday = useCallback(async () => {
    setLoading(true);
    try {
      const rec = await attendanceService.getToday();
      setRecord(rec);
      if (rec?.checkInTime && !rec.checkOutTime) setElapsed(elapsedStr(rec.checkInTime));
    } catch { /* no record */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadToday(); }, [loadToday]);

  const handleCheckIn = async () => {
    if (!employeeId) { toast.error('No employee record linked. Please contact HR.'); return; }
    setActionLoading(true);
    try {
      const rec = await attendanceService.checkIn({ location: 'Office' });
      setRecord(rec);
      toast.success('✅ Checked in successfully!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Check-in failed');
    } finally { setActionLoading(false); }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const rec = await attendanceService.checkOut();
      setRecord(rec);
      toast.success('👋 Checked out successfully!');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Check-out failed');
    } finally { setActionLoading(false); }
  };

  const checkedIn  = !!record?.checkInTime;
  const checkedOut = !!record?.checkOutTime;
  const status     = record?.attendanceStatus as AttendanceStatus | undefined;
  const cfg        = status ? STATUS_CONFIG[status] : null;
  const workProgress = Math.min(((record?.workingHours ?? 0) / 8) * 100, 100);
  const today = clock.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">


      {/* Self Check-in disabled warning */}
      {!loading && employeeId && !allowSelfCheckIn && (
        <Card className="border-red-200 dark:border-red-850 bg-red-50 dark:bg-red-950/30">
          <CardContent className="flex items-center gap-3 py-4 text-red-700 dark:text-red-400 text-sm font-medium">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            Self check-in/out has been disabled for your profile by HR. Please coordinate with HR to check you in or out.
          </CardContent>
        </Card>
      )}

      {/* Date & status row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{today}</p>
          {cfg && (
            <Badge className={`mt-1 border ${cfg.bg} ${cfg.color} font-semibold`}>
              <cfg.icon className="w-3 h-3 mr-1.5" />
              {cfg.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-500 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
              <User className="w-3.5 h-3.5" /> {user.firstName} {user.lastName}
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={loadToday} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main check-in card */}
      <Card className="overflow-hidden border-zinc-200/60 dark:border-zinc-800 shadow-md">
        <CardContent className="p-0">
          {/* Gradient hero */}
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-10 text-white text-center">
            <div className="text-5xl font-mono font-extrabold tracking-tight mb-1 tabular-nums">
              {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <p className="text-blue-200 text-sm mb-6">Current Time</p>

            {checkedIn && !checkedOut && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 bg-white/15 px-4 py-2 rounded-full text-sm font-semibold mb-6"
              >
                <Timer className="w-4 h-4 animate-pulse" />
                Elapsed: {elapsed}
              </motion.div>
            )}

            <div className="flex justify-center gap-4">
              {loading ? (
                <Skeleton className="h-12 w-72 rounded-2xl bg-white/20" />
              ) : (
                <>
                  <Button
                    size="lg"
                    disabled={checkedIn || actionLoading || !allowSelfCheckIn}
                    onClick={handleCheckIn}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl px-8 shadow-lg disabled:opacity-50"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {checkedIn ? 'Checked In ✓' : 'Check In'}
                  </Button>
                  <Button
                    size="lg"
                    disabled={!checkedIn || checkedOut || actionLoading || !allowSelfCheckIn}
                    onClick={handleCheckOut}
                    className="bg-red-500 hover:bg-red-400 text-white rounded-2xl px-8 shadow-lg disabled:opacity-50"
                  >
                    <LogOut className="w-5 h-5 mr-2" />
                    {checkedOut ? 'Checked Out ✓' : 'Check Out'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Time detail strip */}
          <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
            {[
              { label: 'Check In',  val: fmt12(record?.checkInTime),  icon: LogIn  },
              { label: 'Check Out', val: fmt12(record?.checkOutTime), icon: LogOut },
              { label: 'Hours',     val: record ? fmtHours(record.workingHours) : '—', icon: Clock },
            ].map(({ label, val, icon: Ic }) => (
              <div key={label} className="flex flex-col items-center py-5 gap-1">
                <Ic className="w-4 h-4 text-zinc-400" />
                <p className="text-xs text-zinc-400 font-medium">{label}</p>
                <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">{val}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Working hours progress */}
      {checkedIn && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-zinc-200/60 dark:border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Working Hours Progress
              </CardTitle>
              <CardDescription>Target: 8 hours / day</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500 mb-1">
                <span>{fmtHours(record?.workingHours ?? 0)} worked</span>
                <span>{Math.round(workProgress)}%</span>
              </div>
              <Progress value={workProgress} className="h-3 rounded-full" />
              {(record?.overtimeHours ?? 0) > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" />
                  {fmtHours(record!.overtimeHours)} overtime logged
                </p>
              )}
              {record?.location && (
                <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" /> {record.location}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Status Today',  val: cfg?.label ?? 'Not marked',    color: 'bg-blue-500'    },
          { label: 'Break',         val: record ? fmtHours(record.breakDuration) : '—', color: 'bg-amber-500'   },
          { label: 'Working Hours', val: record ? fmtHours(record.workingHours)  : '—', color: 'bg-emerald-500' },
          { label: 'Overtime',      val: record ? fmtHours(record.overtimeHours) : '—', color: 'bg-purple-500'  },
        ].map(({ label, val, color }) => (
          <Card key={label} className="border-zinc-200/60 dark:border-zinc-800">
            <CardContent className="p-4">
              <div className={`w-1.5 h-8 rounded-full ${color} mb-2`} />
              <p className="text-xl font-extrabold text-zinc-900 dark:text-white">{val}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
