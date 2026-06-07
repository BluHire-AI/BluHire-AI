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
import CandidateDashboard from '@/components/CandidateDashboard';
import { Suspense } from 'react';

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
  if (user?.role === 'CANDIDATE') {
    return (
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-28 space-y-4">
          <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
          <p className="text-xs text-white/45 font-medium">Reconstructing dashboard...</p>
        </div>
      }>
        <CandidateDashboard />
      </Suspense>
    );
  }
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
    { 
      title: 'Resume Screening AI', 
      desc: 'Saves hours of recruiter review with structured parsing and scoring.', 
      icon: FileText,
      route: '/dashboard/recruitment'
    },
    { 
      title: 'AI Interview Engine', 
      desc: 'Automated video and voice candidate screening with visual summaries.', 
      icon: Sparkles,
      route: '/dashboard/recruitment'
    },
    { 
      title: 'HR Copilot', 
      desc: 'Semantic workspace query tool for policy enforcement and quick insights.', 
      icon: Brain,
      route: '/dashboard/copilot'
    },
    { 
      title: 'Skill Analyzer', 
      desc: 'Map department competencies against global industry standards.', 
      icon: Award,
      route: '/dashboard/performance?tab=skills'
    },
    { 
      title: 'Performance Coach', 
      desc: 'Individual growth plans with automatic benchmark analysis.', 
      icon: Compass,
      route: '/dashboard/performance'
    }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
        <p className="text-xs text-white/45 font-medium">Reconstructing workspace data...</p>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-10 select-none max-w-7xl mx-auto p-1">
      {/* 1. Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
        <div className="space-y-1.5">
          <h1 className="text-h1 text-white flex flex-wrap items-center gap-3">
            {getGreeting()}, {user?.firstName}
            <span className="inline-flex items-center text-[10px] font-bold font-mono px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
              SYSTEM NORMAL
            </span>
          </h1>
          <p className="text-body-copy text-white/60">
            Here is your live operations overview for BluHire-AI today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData} 
            className="rounded-xl border-white/10 bg-white/[0.02] text-white/80 hover:text-white hover:bg-white/[0.06] text-xs h-9 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
          </Button>
          <Link href="/dashboard/employees/create">
            <Button 
              size="sm" 
              className="bg-[#8B5CF6] hover:bg-[#A855F7] text-white rounded-xl text-xs font-semibold h-9 shadow-lg shadow-[#8B5CF6]/15 transition-all duration-250 cursor-pointer border-0"
            >
              <Plus className="w-3.5 h-3.5 mr-2" /> Onboard Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Total Employees', val: stats.totalEmployees, desc: 'Total database count', icon: Users },
          { title: 'Active Employees', val: stats.activeEmployees, desc: 'Operational staff count', icon: UserCheck },
          { title: 'Employees on Probation', val: stats.probation, desc: 'Under review period', icon: Clock },
          { title: 'Employees on Leave', val: stats.onLeave, desc: 'Approved leave cycles', icon: Calendar },
          { title: 'Total Departments', val: stats.departmentsCount, desc: 'Configured business units', icon: Building },
          { title: 'Total Designations', val: stats.designationsCount, desc: 'Job roles & hierarchy tiers', icon: Briefcase },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -4 }}
              className="transition-all duration-300"
            >
              <Card className="bg-white/[0.03] border-white/10 shadow-2xl relative overflow-hidden group rounded-[24px]">
                {/* Decorative hover gradient border */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[#8B5CF6]/0 via-[#8B5CF6]/0 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
                  <CardTitle className="text-small-label text-white/45">{item.title}</CardTitle>
                  <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 group-hover:text-[#8B5CF6] group-hover:border-[#8B5CF6]/30 transition-colors">
                    <Icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="text-kpi text-white">{item.val}</div>
                  <p className="text-small-label text-white/40 mt-1.5">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* 3. Operational Timeline & Recently Added Employees */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities Timeline */}
        <Card className="border-white/10 bg-white/[0.03] rounded-[24px] shadow-2xl">
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle className="text-h2 text-white">Recent Employee Activity Timeline</CardTitle>
            <CardDescription className="text-body-copy text-white/60">Real-time audit log from EmployeeActivity database.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {activities.length === 0 ? (
              <p className="text-xs text-white/40 italic py-8 text-center">No recent activity logged in the database.</p>
            ) : (
              <div className="relative pl-5 border-l border-white/10 space-y-5 my-2">
                {activities.map((act, i) => (
                  <div key={act._id || i} className="relative group">
                    <span className="absolute -left-[27px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#050505] border border-white/10 group-hover:border-[#8B5CF6] transition-colors duration-250">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6] shadow-[0_0_6px_rgba(139,92,246,0.6)]" />
                    </span>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="text-grid text-white/90 group-hover:text-white transition-colors">{act.title}</p>
                        <p className="text-body-copy text-white/40 mt-0.5">{act.description}</p>
                      </div>
                      <span className="text-small-label text-white/40 font-mono font-medium whitespace-nowrap bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
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
        <Card className="border-white/10 bg-white/[0.03] rounded-[24px] shadow-2xl">
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle className="text-h2 text-white">Recently Onboarded Employees</CardTitle>
            <CardDescription className="text-body-copy text-white/60">Newly added operational staff records.</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {recentEmployees.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-xs text-white/40 italic">No employee records configured yet.</p>
                <Link href="/dashboard/employees/create" className="mt-4 inline-block">
                  <Button size="sm" className="bg-[#8B5CF6] hover:bg-[#A855F7] text-white rounded-xl text-xs">Create Employee</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEmployees.map((emp) => (
                  <div key={emp._id} className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6] font-bold flex items-center justify-center text-[10px] border border-[#8B5CF6]/25 shrink-0 shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                        {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-grid text-white/90">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-body-copy text-white/40 mt-0.5">
                          {emp.designationId?.title || 'Unassigned'} • {emp.departmentId?.name || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <span className="text-small-label px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 text-white/60 font-mono">
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
      <div className="space-y-4 pt-4">
        <div>
          <h2 className="text-h2 text-white">AI Modules Hub</h2>
          <p className="text-body-copy text-white/40">Future smart tools roadmap under active planning.</p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {aiModules.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.route}
                className="block group outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 rounded-[20px] transition-all duration-300"
                aria-label={`Navigate to ${item.title}`}
              >
                <Card className="cursor-pointer border-dashed border-white/10 bg-transparent hover:border-white/20 hover:bg-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_-3px_rgba(139,92,246,0.15)] relative overflow-hidden rounded-[20px]">
                  <CardHeader className="pb-2 flex flex-row items-center space-x-3 px-5 pt-5">
                    <div className="p-2 bg-white/[0.04] border border-white/10 rounded-xl text-white/60 group-hover:text-[#8B5CF6] group-hover:border-[#8B5CF6]/30 transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-grid text-white/90 group-hover:text-white transition-colors">{item.title}</CardTitle>
                      <span className="inline-block mt-0.5 text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 uppercase tracking-wider font-mono">Planned</span>
                    </div>
                  </CardHeader>
                  <CardContent className="px-5 pb-5">
                    <p className="text-body-copy leading-relaxed text-white/40 font-medium font-sans group-hover:text-white/60 transition-colors">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
