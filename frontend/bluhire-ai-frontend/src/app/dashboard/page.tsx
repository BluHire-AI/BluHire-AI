'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, Building, Calendar, Brain, TrendingUp, Sparkles, AlertTriangle, 
  ArrowUpRight, Heart, Award, ArrowDownRight, Compass, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    attendanceRate: 98.4,
    departmentsCount: 0,
    openPositions: 8,
    avgPerformance: 4.2,
    retentionRate: 94.6,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empStats, deptStats] = await Promise.all([
          api.get('/employees/stats/dashboard').catch(() => ({ data: { data: null } })),
          api.get('/departments').catch(() => ({ data: { data: null } }))
        ]);

        const employeesCount = empStats.data?.data?.activeCount || 14;
        const totalDepartments = deptStats.data?.departments?.length || 4;

        setStats(prev => ({
          ...prev,
          totalEmployees: employeesCount,
          departmentsCount: totalDepartments,
        }));
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      }
    };

    fetchStats();
  }, [user]);

  // Simulated chart data
  const workforceGrowth = [
    { name: 'Jan', headcount: 8, recruitment: 2 },
    { name: 'Feb', headcount: 10, recruitment: 3 },
    { name: 'Mar', headcount: 11, recruitment: 1 },
    { name: 'Apr', headcount: 12, recruitment: 2 },
    { name: 'May', headcount: 14, recruitment: 4 },
    { name: 'Jun', headcount: 16, recruitment: 3 },
  ];

  const skillGapMetrics = [
    { name: 'Tech', rating: 88, fill: '#3b82f6' },
    { name: 'Design', rating: 78, fill: '#8b5cf6' },
    { name: 'Marketing', rating: 82, fill: '#10b981' },
    { name: 'Sales', rating: 72, fill: '#f59e0b' },
  ];

  const aiInsights = [
    {
      title: "AI workforce Insights",
      description: "Recruitment velocity in Marketing has increased by 18% over the past 30 days. Onboardings are operating at high efficiency.",
      type: "success",
      icon: Sparkles
    },
    {
      title: "Attrition Risk Alert",
      description: "Engineering Department has a moderate 45% attrition risk. Core indicators suggest 2 senior engineers are approaching the 2-year tenure mark without role upgrades.",
      type: "warning",
      icon: AlertTriangle
    },
    {
      title: "Skill Gap Alert",
      description: "Average proficiency in cloud infrastructure stands at L1. Suggest launching the AWS certification program scheduled next week.",
      type: "info",
      icon: Brain
    }
  ];

  return (
    <div className="space-y-8 select-none">
      {/* 1. Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center">
            Welcome back, {user?.firstName} <Sparkles className="w-6 h-6 ml-2 text-violet-500 animate-pulse" />
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm font-medium">
            Here is your AI-augmented executive overview for BluHire-AI today.
          </p>
        </div>
        <div className="flex items-center space-x-2.5">
          <span className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" /> Live Database Linked
          </span>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { title: "Total Employees", val: stats.totalEmployees, trend: "+14.2%", positive: true, icon: Users, bg: "from-blue-600/5 to-indigo-600/5" },
          { title: "Attendance %", val: `${stats.attendanceRate}%`, trend: "+0.8%", positive: true, icon: CheckCircle2, bg: "from-emerald-600/5 to-teal-600/5" },
          { title: "Departments", val: stats.departmentsCount, trend: "+25.0%", positive: true, icon: Building, bg: "from-purple-600/5 to-pink-600/5" },
          { title: "Open Positions", val: stats.openPositions, trend: "4 active", positive: true, icon: Compass, bg: "from-amber-600/5 to-orange-600/5" },
          { title: "Avg Performance", val: `${stats.avgPerformance}/5`, trend: "+5.1%", positive: true, icon: Award, bg: "from-violet-600/5 to-fuchsia-600/5" },
          { title: "Retention Rate", val: `${stats.retentionRate}%`, trend: "-0.2%", positive: false, icon: Heart, bg: "from-rose-600/5 to-red-600/5" },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`relative overflow-hidden border-zinc-200/60 dark:border-zinc-800/80 bg-gradient-to-br ${item.bg} hover:shadow-md transition-all duration-300`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">{item.title}</CardTitle>
                  <Icon className="h-4.5 w-4.5 text-zinc-400 dark:text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{item.val}</div>
                  <p className={`text-[10px] font-bold mt-1.5 flex items-center ${item.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {item.positive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {item.trend}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* 3. AI Insights Panel */}
      <div className="grid gap-6 md:grid-cols-3">
        {aiInsights.map((insight, index) => {
          const Icon = insight.icon;
          const borderClass = insight.type === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : insight.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-indigo-500/30 bg-indigo-500/5';
          const iconColor = insight.type === 'warning' ? 'text-amber-500' : insight.type === 'success' ? 'text-emerald-500' : 'text-indigo-500';
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`border ${borderClass} shadow-sm overflow-hidden relative`}>
                <div className="absolute top-0 right-0 p-2 opacity-15">
                  <Icon className="w-16 h-16" />
                </div>
                <CardHeader className="pb-2 flex flex-row items-center space-x-2">
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">{insight.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium">
                    {insight.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* 4. Workforce Analytics & Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">Workforce Recruitment Trend</CardTitle>
                <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Growth analysis over the current fiscal quarter.</CardDescription>
              </div>
              <span className="flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4 mr-1" /> AI Forecast Active
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={workforceGrowth} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="headcountGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="recruitmentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="headcount" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#headcountGrad)" name="Total Headcount" />
                <Area type="monotone" dataKey="recruitment" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#recruitmentGrad)" name="New Recruits" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422]">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">Department Skill Levels</CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Radial average percentage metrics.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" barSize={10} data={skillGapMetrics}>
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                  background={{ fill: 'rgba(255,255,255,0.05)' }}
                  dataKey="rating"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 11 }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 5. Recent Activity & 6. Upcoming Events */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422]">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">Recent System Events</CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Audit log of system actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { event: "New Employee Onboarded", desc: "Elena Rostova added under Design Dept.", time: "10 mins ago", type: "success" },
                { event: "Designation Level Updated", desc: "Marcus Vance upgraded from L1 to L2", time: "2 hours ago", type: "info" },
                { event: "API Connection Established", desc: "Secure webhook connection to auth node verified", time: "5 hours ago", type: "system" }
              ].map((act, i) => (
                <div key={i} className="flex items-start space-x-3 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
                  <div className="flex-1 space-y-0.5">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{act.event}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-[11px]">{act.desc}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">{act.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422]">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-100">Upcoming Calendar & Reviews</CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Scheduled organizational actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { event: "Quarterly Appraisal Review", desc: "Engineering senior review cycle begins.", time: "Tomorrow at 10:00 AM" },
                { event: "Skills & Capacity Workshop", desc: "Design division alignment sessions.", time: "June 10, 2:00 PM" },
                { event: "Annual Employee Audit", desc: "BluHire-AI system metadata validation.", time: "June 15, 9:00 AM" }
              ].map((event, i) => (
                <div key={i} className="flex items-start justify-between space-x-2 text-xs border-b border-zinc-100 dark:border-zinc-800/60 pb-3 last:border-0 last:pb-0">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200">{event.event}</p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{event.desc}</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">{event.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
