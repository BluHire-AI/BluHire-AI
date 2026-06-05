'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Building, Calendar, Sparkles, UserCheck, Clock, FileText,
  UserPlus, ShieldAlert, Award, Compass, RefreshCw, Briefcase, Plus, Brain
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Activity {
  _id: string;
  employeeId?: {
    _id: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  activityType: string;
  title: string;
  description: string;
  createdAt: string;
}

interface RecentEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  joiningDate: string;
  departmentId?: {
    name: string;
  };
  designationId?: {
    title: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    probation: 0,
    departmentsCount: 0,
    designationsCount: 0,
  });
  
  const [recentEmployees, setRecentEmployees] = useState<RecentEmployee[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [empStatsRes, deptRes, desgRes, recentEmpRes, recentActRes] = await Promise.all([
        api.get('/employees/stats/dashboard').catch(() => ({ data: { data: null } })),
        api.get('/departments').catch(() => ({ data: { data: null } })),
        api.get('/designations').catch(() => ({ data: { data: null } })),
        api.get('/employees', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } }).catch(() => ({ data: { data: null } })),
        api.get('/activities/recent', { params: { limit: 8 } }).catch(() => ({ data: { data: null } }))
      ]);

      const empStats = empStatsRes.data?.data || {};
      const depts = deptRes.data?.data?.data || deptRes.data?.data || [];
      const desgs = desgRes.data?.data?.data || desgRes.data?.data || [];

      setStats({
        totalEmployees: empStats.totalEmployees || 0,
        activeEmployees: empStats.activeEmployees || 0,
        onLeave: empStats.onLeave || 0,
        probation: empStats.probation || 0,
        departmentsCount: deptRes.data?.data?.pagination?.total || depts.length || 0,
        designationsCount: desgRes.data?.data?.pagination?.total || desgs.length || 0,
      });

      setRecentEmployees(recentEmpRes.data?.data?.data || []);
      setActivities(recentActRes.data?.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const aiModules = [
    { title: 'Resume Screening AI', desc: 'Saves hours of recruiter review with structured parsing and scoring.', icon: FileText },
    { title: 'AI Interview Engine', desc: 'Automated video and voice candidate screening with visual summaries.', icon: Sparkles },
    { title: 'HR Copilot', desc: 'Semantic workspace query tool for policy enforcement and quick insights.', icon: Brain },
    { title: 'Skill Analyzer', desc: 'Map department competencies against global industry standards.', icon: Award },
    { title: 'Performance Coach', desc: 'Individual growth plans with automatic benchmark analysis.', icon: Compass }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Reconstructing dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none max-w-7xl mx-auto">
      {/* 1. Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium">
            Here is your live operations overview for BluHire-AI today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="rounded-xl border-zinc-200 dark:border-zinc-800">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Link href="/dashboard/employees/create">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Onboard Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Total Employees', val: stats.totalEmployees, desc: 'Total database count', icon: Users, bg: 'from-blue-600/5 to-indigo-600/5' },
          { title: 'Active Employees', val: stats.activeEmployees, desc: 'Operational staff count', icon: UserCheck, bg: 'from-emerald-600/5 to-teal-600/5' },
          { title: 'Employees on Probation', val: stats.probation, desc: 'Under review period', icon: Clock, bg: 'from-amber-600/5 to-orange-600/5' },
          { title: 'Employees on Leave', val: stats.onLeave, desc: 'Approved leave cycles', icon: Calendar, bg: 'from-rose-600/5 to-red-600/5' },
          { title: 'Total Departments', val: stats.departmentsCount, desc: 'Configured business units', icon: Building, bg: 'from-purple-600/5 to-pink-600/5' },
          { title: 'Total Designations', val: stats.designationsCount, desc: 'Job roles & hierarchy tiers', icon: Briefcase, bg: 'from-violet-600/5 to-fuchsia-600/5' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`overflow-hidden border-zinc-200/60 dark:border-zinc-800/80 bg-gradient-to-br ${item.bg} shadow-sm rounded-2xl`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">{item.title}</CardTitle>
                  <Icon className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{item.val}</div>
                  <p className="text-xs text-zinc-400 mt-1 font-medium">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Operational Timeline & Recently Added Employees */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities Timeline */}
        <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">Recent Employee Activity Timeline</CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">Real-time audit log from EmployeeActivity database.</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-zinc-500 italic py-6 text-center">No recent activity logged in the database.</p>
            ) : (
              <div className="relative pl-6 border-l border-zinc-100 dark:border-zinc-800 space-y-5">
                {activities.map((act, i) => (
                  <div key={act._id || i} className="relative">
                    <span className="absolute -left-[31px] top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 ring-4 ring-white dark:ring-zinc-950">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    </span>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">{act.title}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{act.description}</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-medium whitespace-nowrap">
                        {new Date(act.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Onboarded Employees */}
        <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">Recently Onboarded Employees</CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">Newly added operational staff records.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEmployees.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2" />
                <p className="text-sm text-zinc-500 italic">No employee records configured yet.</p>
                <Link href="/dashboard/employees/create" className="mt-4 inline-block">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">Create Employee</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEmployees.map((emp) => (
                  <div key={emp._id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-800/10">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-xs">
                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {emp.designationId?.title || 'Unassigned'} • {emp.departmentId?.name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold">
                      {emp.employeeCode}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. AI Hub (Planned Modules) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">AI Modules Hub</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Future smart tools roadmap under active planning.</p>
        </div>
        
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {aiModules.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} className="border-dashed border-zinc-200 dark:border-zinc-800 bg-transparent relative overflow-hidden rounded-2xl">
                <CardHeader className="pb-2 flex flex-row items-center space-x-2.5">
                  <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg text-zinc-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{item.title}</CardTitle>
                    <span className="inline-block mt-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase">Coming Soon</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500 font-medium">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
