'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { recruitmentService } from '@/services/recruitment.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, Briefcase, FileText, CheckCircle, 
  XCircle, Clock, RefreshCw, Plus, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'HR_RECRUITER') {
      router.push('/dashboard/recruitment');
    } else if (user?.role === 'EMPLOYEE') {
      router.push('/employee/dashboard');
    }
  }, [user, router]);

  const fetchDashboardData = async () => {
    // Only load recruitment analytics for admin-level roles
    if (!user || user.role === 'EMPLOYEE') return;
    setLoading(true);
    try {
      const data = await recruitmentService.getAnalytics();
      setStats(data);
    } catch (error) {
      console.error('Failed to load recruitment dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Loading analytics streams...</p>
      </div>
    );
  }

  // Calculate fallbacks
  const openJobs = stats?.openJobs || 0;
  const totalCandidates = stats?.totalCandidates || 0;
  const totalApplications = stats?.totalApplications || 0;
  const interviewCount = stats?.pipelineStats?.INTERVIEW || 0;
  const hiredCount = stats?.pipelineStats?.HIRED || 0;
  const rejectedCount = stats?.pipelineStats?.REJECTED || 0;

  return (
    <div className="space-y-8 select-none max-w-7xl mx-auto">
      {/* 1. Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium">
            Here is your live Recruitment Pipeline overview.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="rounded-xl border-zinc-200 dark:border-zinc-800">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Link href="/dashboard/recruitment/jobs">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Post Job
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Open Jobs', val: openJobs, desc: 'Active job listings', icon: Briefcase, bg: 'from-blue-600/5 to-indigo-600/5' },
          { title: 'Total Candidates', val: totalCandidates, desc: 'Profiles in database', icon: Users, bg: 'from-purple-600/5 to-fuchsia-600/5' },
          { title: 'Applications', val: totalApplications, desc: 'Total submitted applications', icon: FileText, bg: 'from-amber-600/5 to-orange-600/5' },
          { title: 'In Interview', val: interviewCount, desc: 'Candidates currently interviewing', icon: Clock, bg: 'from-emerald-600/5 to-teal-600/5' },
          { title: 'Hired', val: hiredCount, desc: 'Successfully hired candidates', icon: CheckCircle, bg: 'from-green-600/5 to-emerald-600/5' },
          { title: 'Rejected', val: rejectedCount, desc: 'Candidates not selected', icon: XCircle, bg: 'from-rose-600/5 to-red-600/5' },
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

      {/* 3. Operational Timeline */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Activity Log Feed */}
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm p-6 rounded-xl md:col-span-2 lg:col-span-1">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-blue-600" />
              Recruitment Feed
            </CardTitle>
            <CardDescription className="text-xs">Latest log activity updates from recruitment funnel</CardDescription>
          </CardHeader>
          <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2">
            {!stats?.recentActivities || stats.recentActivities.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-10">No recent activities logged.</p>
            ) : (
              stats.recentActivities.map((act: any) => (
                <div key={act._id} className="flex gap-3 text-xs relative group pb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-750 dark:text-zinc-350 leading-tight">
                      {act.title.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed">
                      {act.description}
                    </p>
                    <p className="text-[9px] text-zinc-400/80 mt-0.5">
                      {new Date(act.createdAt).toLocaleDateString()} at {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
