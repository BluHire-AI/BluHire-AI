'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { attendanceService, AttendanceRecord, AttendanceStatus } from '@/services/attendance.service';
import { employeeService } from '@/services/employee.service';
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
  Home, Sun, Umbrella, RefreshCw, User, MapPin, ShieldAlert,
  Users, UserCheck, Calendar, Activity, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PRESENT:        { label: 'Present',       color: 'text-emerald-600 dark:text-emerald-450', bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40', icon: CheckCircle2 },
  LATE:           { label: 'Late',           color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40',         icon: AlertCircle  },
  ABSENT:         { label: 'Absent',         color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40',                 icon: XCircle      },
  HALF_DAY:       { label: 'Half Day',       color: 'text-orange-600 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40',     icon: Clock        },
  ON_LEAVE:       { label: 'On Leave',       color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40',             icon: Umbrella     },
  HOLIDAY:        { label: 'Holiday',        color: 'text-purple-600 dark:text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/40',     icon: Sun          },
  WEEKEND:        { label: 'Weekend',        color: 'text-zinc-500',    bg: 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-700',             icon: Coffee       },
  WORK_FROM_HOME: { label: 'Work From Home', color: 'text-teal-600 dark:text-teal-400',    bg: 'bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/40',            icon: Home         },
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

  // HR metrics states
  const [hrStats, setHrStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';
  const [loadError, setLoadError] = useState(false);
  const [errorHeader, setErrorHeader] = useState('Unable to connect to HRMinds API');
  const [errorDesc, setErrorDesc] = useState('Real-time dashboard metrics cannot be synchronized. Check your connection or retry the connection below.');

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

  // Load employee ID securely
  const resolveEmployee = useCallback(async () => {
    if (!user) return;
    console.log('[ATTENDANCE] Resolving employee...');
    try {
      const emp = await employeeService.getMe();
      console.log('[ATTENDANCE] Response:', emp);
      if (emp) {
        setEmployeeId(emp._id);
        setAllowSelfCheckIn(emp.allowSelfCheckIn !== false);
      }
    } catch (err: any) {
      console.warn('[ATTENDANCE] Fallback used. Employee profile not configured.', err);
      setEmployeeId(null);
      const status = err?.response?.status;
      if (status === 404) {
        const warned = sessionStorage.getItem('attendance_no_profile_warned');
        if (!warned) {
          sessionStorage.setItem('attendance_no_profile_warned', 'true');
          toast.warning(
            user?.role === 'EMPLOYEE'
              ? 'Your employee profile is incomplete. Please contact HR.'
              : 'Employee profile not configured. Personal attendance tracking is disabled.',
            { duration: 5000 }
          );
        }
      } else {
        setErrorHeader('Employee profile not found');
        setErrorDesc(err?.response?.data?.message || err?.message || 'The employee profile could not be loaded.');
        setLoadError(true);
      }
    }
  }, [user]);

  const loadToday = useCallback(async () => {
    setLoading(true);
    try {
      const rec = await attendanceService.getToday();
      setRecord(rec);
      if (rec?.checkInTime && !rec.checkOutTime) setElapsed(elapsedStr(rec.checkInTime));
    } catch (err: any) { 
      console.error('Failed to load check-in state', err);
      setRecord(null);
      if (err?.response?.status !== 404) {
        setErrorHeader('Attendance profile not configured');
        setErrorDesc(err?.response?.data?.message || err?.message || 'Failed to load check-in state.');
        setLoadError(true);
      }
    } finally { 
      setLoading(false); 
    }
  }, []);

  const loadHRData = useCallback(async () => {
    if (!isHR) return;
    setStatsLoading(true);
    try {
      const [statsRes, historyRes] = await Promise.all([
        api.get('/attendance/stats/today'),
        api.get('/attendance', { params: { limit: 6 } })
      ]);
      setHrStats(statsRes.data?.data);
      setRecentLogs(historyRes.data?.data?.records || []);
    } catch (err: any) {
      console.error('Failed to load HR dashboard data', err);
      setErrorHeader('Attendance profile not configured');
      setErrorDesc(err?.response?.data?.message || err?.message || 'Failed to load HR dashboard data.');
      setLoadError(true);
    } finally {
      setStatsLoading(false);
    }
  }, [isHR]);

  useEffect(() => {
    resolveEmployee().then(() => loadToday());
  }, [resolveEmployee, loadToday]);

  useEffect(() => {
    loadHRData();
  }, [loadHRData]);

  const handleCheckIn = async () => {
    if (!employeeId) { toast.error('No employee record linked. Please contact HR.'); return; }
    setActionLoading(true);
    try {
      const rec = await attendanceService.checkIn({ location: 'Office' });
      setRecord(rec);
      toast.success('✅ Checked in successfully!');
      loadHRData();
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
      loadHRData();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Check-out failed');
    } finally { setActionLoading(false); }
  };

  const handleReload = () => {
    setLoadError(false);
    resolveEmployee().then(() => {
      loadToday();
      loadHRData();
    });
  };

  const checkedIn  = !!record?.checkInTime;
  const checkedOut = !!record?.checkOutTime;
  const status     = record?.attendanceStatus as AttendanceStatus | undefined;
  const cfg        = status ? STATUS_CONFIG[status] : null;
  const workProgress = Math.min(((record?.workingHours ?? 0) / 8) * 100, 100);
  const todayStr = clock.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Weekly mockup chart metrics (Recharts)
  const weeklyTrendData = [
    { name: 'Mon', Present: 88, Late: 8, Leave: 4 },
    { name: 'Tue', Present: 92, Late: 5, Leave: 3 },
    { name: 'Wed', Present: 90, Late: 6, Leave: 4 },
    { name: 'Thu', Present: 94, Late: 3, Leave: 3 },
    { name: 'Fri', Present: 87, Late: 9, Leave: 4 },
  ];

  return (
    <div className="space-y-6">
      
      {/* Self Check-in warning */}
      {!loading && employeeId && !allowSelfCheckIn && (
        <Card className="border-red-200 dark:border-red-850 bg-red-50 dark:bg-red-950/20">
          <CardContent className="flex items-center gap-3 py-4 text-red-700 dark:text-red-400 text-sm font-medium">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            Self check-in/out has been disabled for your profile by HR. Please coordinate with HR.
          </CardContent>
        </Card>
      )}

      {/* Title & Reload row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">{todayStr}</p>
          {cfg && (
            <Badge className={`mt-1 border ${cfg.bg} ${cfg.color} font-bold`}>
              <cfg.icon className="w-3.5 h-3.5 mr-1.5" />
              {cfg.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-zinc-500 bg-zinc-50 dark:bg-zinc-850 border border-zinc-100 dark:border-zinc-800 px-3 py-1.5 rounded-xl">
              <User className="w-3.5 h-3.5" /> {user.firstName} {user.lastName} ({user.role})
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleReload} disabled={loading || statsLoading} className="rounded-xl h-9">
            <RefreshCw className={`w-4 h-4 ${loading || statsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* adapts view based on role */}
      {loadError ? (
        <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
          <CardContent className="p-12 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full border border-red-100 dark:border-red-900/40">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">{errorHeader}</h3>
              <p className="text-xs text-zinc-500 max-w-sm">
                {errorDesc}
              </p>
            </div>
            <Button onClick={handleReload} className="bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs px-4 h-9">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" style={{ animationDuration: '3.5s' }} />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      ) : isHR ? (
        <div className="space-y-6">
          {/* 1. HR Executive Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Present Today', val: hrStats?.presentToday ?? 0, sub: `${hrStats?.totalEmployees ?? 0} employees`, icon: UserCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Absent Today', val: hrStats?.absentToday ?? 0, sub: 'unmarked', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'On Leave', val: hrStats?.onLeaveToday ?? 0, sub: 'approved leaves', icon: Umbrella, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Late Arrivals', val: hrStats?.lateToday ?? 0, sub: 'late arrivals', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Overtime', val: hrStats?.overtimeToday ?? 0, sub: 'overtime logs', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map(({ label, val, sub, icon: Ic, color, bg }) => (
              <Card key={label} className="border-zinc-200/60 dark:border-zinc-800 shadow-sm overflow-hidden">
                <CardContent className="p-5 flex flex-col justify-between h-full min-h-[110px]">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-zinc-900 dark:text-white">{statsLoading ? '...' : val}</span>
                    <div className={`p-2 rounded-xl ${bg} ${color}`}>
                      <Ic className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">{label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 2. Recharts Weekly Chart */}
            <Card className="col-span-1 lg:col-span-2 border-zinc-200/60 dark:border-zinc-800 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Weekly Attendance Trend
                </CardTitle>
                <CardDescription>Attendance distribution over the last 5 active working days (%)</CardDescription>
              </CardHeader>
              <CardContent className="h-64 w-full">
                {weeklyTrendData && weeklyTrendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={weeklyTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
                      <XAxis dataKey="name" fontSize={11} stroke="#888888" />
                      <YAxis fontSize={11} stroke="#888888" domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff', fontSize: '11px' }} />
                      <Bar dataKey="Present" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Leave" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 text-xs gap-2">
                    <TrendingUp className="w-8 h-8 text-zinc-350 animate-pulse" />
                    <span>No weekly attendance trend data available</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 3. Quick Actions */}
            <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  Quick HR Actions
                </CardTitle>
                <CardDescription>Direct shortcuts to schedule and log updates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/attendance/leaves" className="block w-full">
                  <Button variant="outline" className="w-full justify-between h-11 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-xl">
                    <span className="flex items-center gap-2 font-semibold text-xs"><Umbrella className="w-4 h-4 text-blue-500" /> Apply Employee Leave</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Button>
                </Link>
                <Link href="/dashboard/attendance/shifts" className="block w-full">
                  <Button variant="outline" className="w-full justify-between h-11 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-xl">
                    <span className="flex items-center gap-2 font-semibold text-xs"><Clock className="w-4 h-4 text-emerald-500" /> Configure Work Shifts</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Button>
                </Link>
                <Link href="/dashboard/attendance/holidays" className="block w-full">
                  <Button variant="outline" className="w-full justify-between h-11 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-xl">
                    <span className="flex items-center gap-2 font-semibold text-xs"><Sun className="w-4 h-4 text-purple-500" /> Add Official Holiday</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
                  </Button>
                </Link>
                <Link href="/dashboard/attendance/management" className="block w-full">
                  <Button className="w-full justify-center h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-2">
                    <Users className="w-4 h-4 mr-2" />
                    Open Manual Logs Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* 4. Company-Wide Activity Feed */}
          <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-500" />
                Recent Activity Feed
              </CardTitle>
              <CardDescription>Live record logs of checking actions across all office locations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {statsLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 text-xs">No recent actions logged.</div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {recentLogs.map((log: any) => {
                    const statusVal = log.attendanceStatus as AttendanceStatus;
                    const statusCfg = STATUS_CONFIG[statusVal] || STATUS_CONFIG.PRESENT;
                    return (
                      <div key={log._id} className="p-4 flex items-center justify-between text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-350">
                            {log.employeeId?.firstName?.[0] || 'E'}{log.employeeId?.lastName?.[0] || ''}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-800 dark:text-zinc-150">{log.employeeId?.firstName} {log.employeeId?.lastName}</span>
                            <span className="text-[10px] text-zinc-400 mt-0.5">{log.employeeId?.employeeCode || 'EMP'} • {log.location || 'Office'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col text-right">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">In: {fmt12(log.checkInTime)}</span>
                            <span className="text-[10px] text-zinc-400 mt-0.5">{log.checkOutTime ? `Out: ${fmt12(log.checkOutTime)}` : 'Active'}</span>
                          </div>
                          <Badge variant="outline" className={`border text-[10px] font-bold ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* 5. Personal Self Check-in (Show to regular employees OR HR/Admin so they can check themselves in too!) */}
      {employeeId ? (
        <div className="space-y-6">
          {isHR && <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-6">Your Personal Check-In Console</h3>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="overflow-hidden border-zinc-200/60 dark:border-zinc-800 shadow-md">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-10 border-b border-zinc-100 dark:border-zinc-850 text-center relative overflow-hidden">
                    {/* decorative glows */}
                    <div className="absolute top-0 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                    
                    <div className="text-4xl font-mono font-extrabold tracking-tight mb-1 tabular-nums text-white">
                      {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </div>
                    <p className="text-zinc-400 text-xs mb-6 font-semibold uppercase tracking-wider">{todayStr}</p>
 
                    {checkedIn && !checkedOut && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/25 px-4 py-1.5 rounded-full text-xs font-bold text-blue-400 mb-6"
                      >
                        <Timer className="w-3.5 h-3.5 animate-pulse" />
                        Active Logged Time: {elapsed}
                      </motion.div>
                    )}
 
                    <div className="flex justify-center gap-4">
                      {loading ? (
                        <Skeleton className="h-11 w-60 rounded-xl bg-zinc-800" />
                      ) : (
                        <>
                           <Button
                            size="lg"
                            disabled={checkedIn || actionLoading || !allowSelfCheckIn}
                            onClick={handleCheckIn}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-8 shadow-md font-bold text-sm h-11"
                          >
                            <LogIn className="w-4 h-4 mr-2" />
                            {checkedIn ? 'Checked In ✓' : 'Check In'}
                          </Button>
                          <Button
                            size="lg"
                            disabled={!checkedIn || checkedOut || actionLoading || !allowSelfCheckIn}
                            onClick={handleCheckOut}
                            className="bg-red-500 hover:bg-red-400 text-white rounded-xl px-8 shadow-md font-bold text-sm h-11"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            {checkedOut ? 'Checked Out ✓' : 'Check Out'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
 
                  <div className="grid grid-cols-3 divide-x divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 text-center">
                    {[
                      { label: 'Check In Time',  val: fmt12(record?.checkInTime),  icon: LogIn  },
                      { label: 'Check Out Time', val: fmt12(record?.checkOutTime), icon: LogOut },
                      { label: 'Working Hours',     val: record ? fmtHours(record.workingHours) : '—', icon: Clock },
                    ].map(({ label, val, icon: Ic }) => (
                      <div key={label} className="flex flex-col items-center py-5 gap-1">
                        <Ic className="w-4 h-4 text-zinc-400" />
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{label}</p>
                        <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">{val}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
 
              {checkedIn && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                  <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        Daily Target Progress
                      </CardTitle>
                      <CardDescription>Target: 8 hours work day</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-xs text-zinc-500 mb-1">
                        <span>{fmtHours(record?.workingHours ?? 0)} worked</span>
                        <span>{Math.round(workProgress)}%</span>
                      </div>
                      <Progress value={workProgress} className="h-3 rounded-full" />
                      {(record?.overtimeHours ?? 0) > 0 && (
                        <p className="text-xs text-amber-500 flex items-center gap-1.5 mt-2 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {fmtHours(record!.overtimeHours)} overtime logged
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
 
            <div className="space-y-4">
              {[
                { label: 'Status Today',  val: cfg?.label ?? 'Not checked in', color: 'bg-blue-500'    },
                { label: 'Logged Break',  val: record ? fmtHours(record.breakDuration) : '—', color: 'bg-amber-500'   },
                { label: 'Working Hours', val: record ? fmtHours(record.workingHours)  : '—', color: 'bg-emerald-500' },
                { label: 'Overtime Hours', val: record ? fmtHours(record.overtimeHours) : '—', color: 'bg-purple-500'  },
              ].map(({ label, val, color }) => (
                <Card key={label} className="border-zinc-200/60 dark:border-zinc-800 shadow-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-1.5 h-8 rounded-full ${color}`} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</p>
                      <p className="text-lg font-bold text-zinc-800 dark:text-zinc-150 mt-0.5">{val}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {isHR && <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-6">Your Personal Check-In Console</h3>}
          <Card className="border-amber-200 dark:border-amber-900 bg-amber-500/10 dark:bg-amber-950/20 shadow-md">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-3 bg-amber-500/20 text-amber-500 rounded-full">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  {user?.role === 'MANAGEMENT_ADMIN' || user?.role === 'HR_RECRUITER' || user?.role === 'SENIOR_MANAGER'
                    ? 'Employee profile not configured'
                    : 'Your employee profile is incomplete'}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
                  {user?.role === 'MANAGEMENT_ADMIN' || user?.role === 'HR_RECRUITER' || user?.role === 'SENIOR_MANAGER'
                    ? 'Administrative/HR accounts do not participate in shift scheduling or payroll runs, so they do not have active physical employee profiles. You can link or create employee profiles in the Employees directory to enable personal check-ins.'
                    : 'Please contact HR to complete your profile setup.'}
                </p>
              </div>
              {isHR && (
                <Link href="/dashboard/employees">
                  <Button className="bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs px-4 h-9">
                    Go to Employee Directory
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
