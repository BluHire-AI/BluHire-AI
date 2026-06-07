'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Users, UserCheck, ShieldAlert, Settings,
  Search, CheckCircle, Clock, XCircle, LogIn, LogOut,
  RefreshCw, Power
} from 'lucide-react';

interface Employee {
  _id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId?: any;
  designationId?: any;
  allowSelfCheckIn?: boolean;
}

interface AttendanceRecord {
  _id: string;
  employeeId: any;
  checkInTime?: string;
  checkOutTime?: string;
  attendanceStatus?: string;
  workingHours?: number;
}

export default function AttendanceManagementPage() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceRecord>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active employees
      const empRes = await api.get('/employees', { params: { limit: 100 } });
      const empList = empRes.data?.data?.data || [];
      setEmployees(empList);

      // 2. Fetch today's attendance records
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      const todayEnd = new Date();
      todayEnd.setHours(23,59,59,999);

      const attRes = await api.get('/attendance', {
        params: {
          startDate: todayStart.toISOString(),
          endDate: todayEnd.toISOString(),
          limit: 100
        }
      });

      const records = attRes.data?.data?.records || [];
      const map: Record<string, AttendanceRecord> = {};
      
      records.forEach((rec: any) => {
        const empId = rec.employeeId?._id || rec.employeeId;
        if (empId) map[empId.toString()] = rec;
      });

      setAttendanceMap(map);
    } catch (error: any) {
      toast.error('Failed to load management dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHR) {
      fetchData();
    }
  }, [isHR]);

  if (!isHR) {
    return (
      <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center text-red-800 dark:text-red-400 gap-4">
          <ShieldAlert className="w-12 h-12" />
          <div>
            <h3 className="font-bold text-lg">Access Denied</h3>
            <p className="text-sm opacity-80 mt-1">This page is only accessible to HR Recruiter and Administrator roles.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Toggle Self Check-in permission for a specific employee
  const handleTogglePermission = async (employeeId: string, currentVal: boolean) => {
    setActionLoading(`perm-${employeeId}`);
    try {
      const newVal = !currentVal;
      await api.put(`/employees/${employeeId}`, { allowSelfCheckIn: newVal });
      
      setEmployees(prev =>
        prev.map(emp => emp._id === employeeId ? { ...emp, allowSelfCheckIn: newVal } : emp)
      );

      toast.success(`Check-in permission ${newVal ? 'enabled' : 'disabled'} successfully.`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update permission');
    } finally {
      setActionLoading(null);
    }
  };

  // Perform manual check-in by HR
  const handleManualCheckIn = async (employeeId: string) => {
    setActionLoading(`checkin-${employeeId}`);
    try {
      const res = await api.post('/attendance/check-in', {
        employeeId,
        location: 'Office (HR Checked-In)'
      });
      
      const record = res.data?.data;
      if (record) {
        setAttendanceMap(prev => ({ ...prev, [employeeId]: record }));
      }
      toast.success('Employee checked in successfully.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Check-in failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Perform manual check-out by HR
  const handleManualCheckOut = async (employeeId: string) => {
    setActionLoading(`checkout-${employeeId}`);
    try {
      const res = await api.post('/attendance/check-out', { employeeId });
      const record = res.data?.data;
      if (record) {
        setAttendanceMap(prev => ({ ...prev, [employeeId]: record }));
      }
      toast.success('Employee checked out successfully.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Check-out failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter list by search query
  const filteredEmployees = employees.filter(emp => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const email = emp.email.toLowerCase();
    const code = emp.employeeCode.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query) || code.includes(query);
  });

  // Calculate statistics
  const totalEmployees = employees.length;
  const presentToday = Object.values(attendanceMap).filter(rec => rec.checkInTime).length;
  const selfCheckInEnabled = employees.filter(emp => emp.allowSelfCheckIn !== false).length;

  return (
    <div className="space-y-6">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="overflow-hidden border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Employees</p>
              <h3 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">{loading ? '...' : totalEmployees}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Present Today</p>
              <h3 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">{loading ? '...' : presentToday}</h3>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-zinc-200/60 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Self Check-In Permission</p>
              <h3 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">{loading ? '...' : selfCheckInEnabled} <span className="text-xs text-zinc-500 dark:text-zinc-450 font-normal">/ {totalEmployees} enabled</span></h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
              <Settings className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main List */}
      <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-md">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-150 dark:border-zinc-850">
          <div>
            <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Check-In Policy & Manual Logs</CardTitle>
            <CardDescription className="text-zinc-500 dark:text-zinc-400 text-xs">Configure self-service check-in permissions per employee or manually record entry/exit times.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search employee..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9 rounded-xl flex gap-1.5 items-center">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
              No employees found matching the criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-500 dark:text-zinc-400 font-semibold">
                    <th className="p-4">Employee</th>
                    <th className="p-4">Department & Designation</th>
                    <th className="p-4 text-center">Self Check-In Permission</th>
                    <th className="p-4">Today's Attendance Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredEmployees.map(emp => {
                    const record = attendanceMap[emp._id];
                    const isSelfCheckInEnabled = emp.allowSelfCheckIn !== false;
                    const isChecking = actionLoading === `checkin-${emp._id}` || actionLoading === `checkout-${emp._id}`;
                    const isPermChanging = actionLoading === `perm-${emp._id}`;

                    const checkedIn = !!record?.checkInTime;
                    const checkedOut = !!record?.checkOutTime;

                    return (
                      <tr key={emp._id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10 transition-colors">
                        
                        {/* Employee details */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-zinc-900 dark:text-zinc-150">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="text-xs text-zinc-400 font-mono mt-0.5">{emp.employeeCode} • {emp.email}</span>
                          </div>
                        </td>

                        {/* Dept/Designation */}
                        <td className="p-4 text-zinc-650 dark:text-zinc-400 text-xs">
                          <div className="flex flex-col">
                            <span className="font-medium text-zinc-700 dark:text-zinc-350">
                              {emp.designationId?.title || 'Associate'}
                            </span>
                            <span className="text-zinc-400 dark:text-zinc-500 mt-0.5">
                              {emp.departmentId?.name || 'General'}
                            </span>
                          </div>
                        </td>

                        {/* Switch for Permission */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() => handleTogglePermission(emp._id, isSelfCheckInEnabled)}
                              disabled={isPermChanging}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                isSelfCheckInEnabled ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'
                              } ${isPermChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  isSelfCheckInEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                        </td>

                        {/* Attendance Status */}
                        <td className="p-4">
                          {checkedOut ? (
                            <Badge className="bg-zinc-100 hover:bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 font-semibold gap-1.5 py-1 px-2.5 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5 text-zinc-500" />
                              Completed ({record.workingHours}h worked)
                            </Badge>
                          ) : checkedIn ? (
                            <Badge className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 font-semibold gap-1.5 py-1 px-2.5 rounded-full">
                              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Active (Checked In at {new Date(record.checkInTime!).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })})
                            </Badge>
                          ) : (
                            <Badge className="bg-zinc-50 dark:bg-zinc-900 text-zinc-450 border border-zinc-150 dark:border-zinc-800 font-medium py-1 px-2.5 rounded-full">
                              Not Checked In
                            </Badge>
                          )}
                        </td>

                        {/* Actions for manual check-in/out */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!checkedIn && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManualCheckIn(emp._id)}
                                disabled={isChecking}
                                className="bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 h-8 text-xs font-bold rounded-lg flex items-center gap-1.5"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                Check In
                              </Button>
                            )}
                            {checkedIn && !checkedOut && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManualCheckOut(emp._id)}
                                disabled={isChecking}
                                className="bg-red-50 hover:bg-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/60 h-8 text-xs font-bold rounded-lg flex items-center gap-1.5"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                Check Out
                              </Button>
                            )}
                            {checkedOut && (
                              <span className="text-xs text-zinc-400 italic">No actions available</span>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}
