'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import analyticsService from '@/services/analytics.service';
import { recruitmentService } from '@/services/recruitment.service';
import {
  Users, Briefcase, TrendingUp, Calendar, RefreshCw, Download, BarChart3,
  Search, ShieldAlert, Award, Clock, FileText, CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';

export default function AnalyticsDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // Filters state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [jobId, setJobId] = useState('ALL');
  const [departmentId, setDepartmentId] = useState('ALL');

  // Dropdown options
  const [jobs, setJobs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Analytics datasets
  const [overview, setOverview] = useState<any>({
    totalJobs: 0,
    openJobs: 0,
    totalCandidates: 0,
    totalApplications: 0,
    totalHires: 0,
    totalRejections: 0,
    conversionRate: 0,
    averageTimeToHire: 0,
  });

  const [funnel, setFunnel] = useState<any>({
    counts: { Applied: 0, Screening: 0, Shortlisted: 0, Interview: 0, Offer: 0, Hired: 0, Rejected: 0 },
    conversionRates: {},
    dropOffs: {},
    efficiency: 0,
  });

  const [screening, setScreening] = useState<any>({
    totalScreened: 0,
    averageMatchScore: 0,
    recommended: 0,
    needsReview: 0,
    notRecommended: 0,
    scoreDistribution: [],
  });

  const [interviews, setInterviews] = useState<any>({
    interviewsScheduled: 0,
    interviewsCompleted: 0,
    averageInterviewScore: 0,
    passRate: 0,
    failureRate: 0,
    topPerformingCandidates: [],
  });

  const [recruiters, setRecruiters] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  
  // Paginated Job Performance state
  const [jobPage, setJobPage] = useState(1);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobPerformance, setJobPerformance] = useState<any[]>([]);

  const [skills, setSkills] = useState<any>({
    requestedSkills: [],
    availableSkills: [],
    skillGap: [],
    shortages: [],
    emerging: [],
  });

  const [activity, setActivity] = useState<any>({
    daily: [],
    weekly: [],
    monthly: [],
    hiringTrends: [],
    recruitmentVelocity: {},
  });

  const [trendResolution, setTrendResolution] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Trigger auto refresh sync
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchFiltersOptions = async () => {
    try {
      const [jobsRes, deptRes] = await Promise.all([
        recruitmentService.listJobs({ limit: 1000 }),
        api.get('/departments'),
      ]);
      setJobs(jobsRes.jobs || []);
      setDepartments(deptRes.data?.data?.data || deptRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching filter dropdowns:', err);
    }
  };

  const fetchAnalyticsData = async (silent = false) => {
    if (!silent) setLoading(true);
    
    const query = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      jobId: jobId !== 'ALL' ? jobId : undefined,
      departmentId: departmentId !== 'ALL' ? departmentId : undefined,
    };

    try {
      const [
        overviewRes,
        funnelRes,
        screeningRes,
        interviewsRes,
        recruitersRes,
        deptsRes,
        skillsRes,
        activityRes,
      ] = await Promise.all([
        analyticsService.getOverview(query),
        analyticsService.getFunnel(query),
        analyticsService.getAIScreening(query),
        analyticsService.getInterviews(query),
        analyticsService.getRecruiters(query),
        analyticsService.getDepartments(query),
        analyticsService.getSkills(query),
        analyticsService.getActivity(query),
      ]);

      setOverview(overviewRes);
      setFunnel(funnelRes);
      setScreening(screeningRes);
      setInterviews(interviewsRes);
      setRecruiters(recruitersRes);
      setDepartmentStats(deptsRes);
      setSkills(skillsRes);
      setActivity(activityRes);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.error('Error fetching dashboard statistics:', err);
      toast.error('Failed to update live dashboard metrics');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchJobPerformance = async () => {
    try {
      const query = {
        page: jobPage,
        limit: 5,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        jobId: jobId !== 'ALL' ? jobId : undefined,
        departmentId: departmentId !== 'ALL' ? departmentId : undefined,
      };
      const jobPerformanceRes = await analyticsService.getJobs(query);
      setJobPerformance(jobPerformanceRes.data);
      setJobTotal(jobPerformanceRes.total);
    } catch (err) {
      console.error('Error fetching job performance page:', err);
    }
  };

  useEffect(() => {
    fetchFiltersOptions();
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate, jobId, departmentId]);

  useEffect(() => {
    fetchJobPerformance();
  }, [startDate, endDate, jobId, departmentId, jobPage]);

  // Real-time updates: refresh every 60 seconds without full-page reload
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData(true);
      fetchJobPerformance();
    }, 60000);
    return () => clearInterval(interval);
  }, [startDate, endDate, jobId, departmentId, jobPage]);

  const handleExport = async (report: string, format: string) => {
    const query = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      jobId: jobId !== 'ALL' ? jobId : undefined,
      departmentId: departmentId !== 'ALL' ? departmentId : undefined,
    };
    try {
      toast.info(`Generating ${report.replace('-', ' ')} export (${format.toUpperCase()})...`);
      await analyticsService.downloadReport(report, format, query);
      toast.success(`${report.replace('-', ' ')} report exported successfully!`);
    } catch (err: any) {
      console.error('Export error:', err);
      toast.error('Export download failed. Please try again.');
    }
  };

  // Color harmony tokens
  const THEME_COLORS = {
    blue: '#3b82f6',
    indigo: '#6366f1',
    purple: '#a855f7',
    emerald: '#10b981',
    amber: '#f59e0b',
    rose: '#f43f5e',
    zinc: '#64748b',
    darkBg: '#0e1422',
  };

  // Transform pipeline funnel for Recharts
  const funnelData = [
    { name: 'Applied', Count: funnel.counts.Applied, Conversion: 100 },
    { name: 'Screening', Count: funnel.counts.Screening, Conversion: funnel.conversionRates['Applied to Screening'] || 0 },
    { name: 'Shortlisted', Count: funnel.counts.Shortlisted, Conversion: funnel.conversionRates['Screening to Shortlisted'] || 0 },
    { name: 'Interview', Count: funnel.counts.Interview, Conversion: funnel.conversionRates['Shortlisted to Interview'] || 0 },
    { name: 'Offer', Count: funnel.counts.Offer, Conversion: funnel.conversionRates['Interview to Offer'] || 0 },
    { name: 'Hired', Count: funnel.counts.Hired, Conversion: funnel.conversionRates['Offer to Hired'] || 0 },
  ];

  // Transform trend resolution based on selector
  const getTrendData = () => {
    if (trendResolution === 'daily') {
      return activity.daily.map((item: any) => ({ name: item.date, Applications: item.count }));
    }
    if (trendResolution === 'weekly') {
      return activity.weekly.map((item: any) => ({ name: item.week, Applications: item.count }));
    }
    return activity.monthly.map((item: any) => ({ name: item.month, Applications: item.count }));
  };

  // Transform skills gap data for Recharts
  const skillsChartData = skills.skillGap.slice(0, 10).map((s: any) => ({
    skill: s.skill,
    'Market Demand (%)': s.demandPct,
    'Candidate Supply (%)': s.supplyPct,
  }));

  // Velocity data mapping
  const velocityChartData = Object.entries(activity.recruitmentVelocity || {}).map(([stage, days]) => ({
    stage,
    Days: days,
  }));

  const isRecruiter = user?.role === 'HR_RECRUITER';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Assembling executive intelligence dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-blue-600" /> Executive Analytics Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium">
            Centralized recruitment intelligence command center. Last synced: <span className="text-blue-600 dark:text-blue-400">{lastRefreshed || 'Just Now'}</span>
          </p>
        </div>
        
        {/* Dynamic Exports Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {['recruitment', 'recruiter', 'ai-screening', 'interview', 'hiring'].map((report) => {
            // Recruiters can only export recruiter (own) and hiring/screening reports
            if (isRecruiter && (report === 'recruiter' || report === 'recruitment')) return null;
            return (
              <div key={report} className="relative group">
                <Button variant="outline" size="xs" className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs gap-1.5 font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                  <Download className="w-3.5 h-3.5" /> {report.replace('-', ' ')}
                </Button>
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex flex-col bg-white dark:bg-[#0e1422] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 p-1 w-28">
                  <button onClick={() => handleExport(report, 'csv')} className="text-left px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg font-semibold">CSV</button>
                  <button onClick={() => handleExport(report, 'excel')} className="text-left px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg font-semibold">Excel</button>
                  <button onClick={() => handleExport(report, 'pdf')} className="text-left px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg font-semibold">PDF Report</button>
                </div>
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={() => fetchAnalyticsData(false)} className="rounded-xl border-zinc-200 dark:border-zinc-800">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 2. Filters Row */}
      <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row flex-wrap items-center gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            {/* Start Date */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-[10px] font-extrabold uppercase text-zinc-400">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            {/* End Date */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-[10px] font-extrabold uppercase text-zinc-400">End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Job Select */}
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <span className="text-[10px] font-extrabold uppercase text-zinc-400">Position Scope</span>
              <select
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-xs"
              >
                <option value="ALL">All Jobs</option>
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>{j.title} ({j.jobCode})</option>
                ))}
              </select>
            </div>

            {/* Department Select (hidden for recruiters as they scope to own jobs) */}
            {!isRecruiter && (
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[10px] font-extrabold uppercase text-zinc-400">Department Scope</span>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {(startDate || endDate || jobId !== 'ALL' || departmentId !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setJobId('ALL');
                setDepartmentId('ALL');
              }}
              className="text-xs text-red-500 hover:text-red-600 rounded-xl"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 3. Top KPI Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: 'Total Candidates', val: overview.totalCandidates, desc: 'Registered talent base', icon: Users, color: 'text-blue-500', bg: 'from-blue-600/5 to-indigo-600/5' },
          { title: 'Total Applications', val: overview.totalApplications, desc: 'Job requests received', icon: FileText, color: 'text-indigo-500', bg: 'from-indigo-600/5 to-purple-600/5' },
          { title: 'Open Job Openings', val: overview.openJobs, desc: 'Actively recruiting roles', icon: Briefcase, color: 'text-purple-500', bg: 'from-purple-600/5 to-pink-600/5' },
          { title: 'Hires Completed', val: overview.totalHires, desc: 'Successful onboarded staff', icon: CheckCircle2, color: 'text-emerald-500', bg: 'from-emerald-600/5 to-teal-600/5' },
          { title: 'Funnel Conversion Rate', val: `${overview.conversionRate}%`, desc: 'Applications successfully hired', icon: TrendingUp, color: 'text-amber-500', bg: 'from-amber-600/5 to-orange-600/5' },
          { title: 'Avg Time To Hire', val: `${overview.averageTimeToHire} Days`, desc: 'Average lifecycle speed', icon: Clock, color: 'text-rose-500', bg: 'from-rose-600/5 to-red-600/5' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Card className={`overflow-hidden border-zinc-200/60 dark:border-zinc-800/80 bg-gradient-to-br ${kpi.bg} shadow-sm rounded-2xl`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-bold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">{kpi.title}</CardTitle>
                  <Icon className={`h-5 w-5 ${kpi.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{kpi.val}</div>
                  <p className="text-xs text-zinc-400 mt-1 font-medium">{kpi.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* 4. Main Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Pipeline Funnel */}
        <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Recruitment Funnel Aggregate</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Cumulative applicant journey conversions. Efficiency: {funnel.efficiency}%</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3f3f46', borderRadius: '8px' }} labelClassName="text-white font-bold" />
                <Bar dataKey="Count" fill={THEME_COLORS.indigo} radius={[6, 6, 0, 0]} barSize={35}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 5 ? THEME_COLORS.emerald : index === 0 ? THEME_COLORS.blue : THEME_COLORS.indigo} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hiring Activity Trend */}
        <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Application Velocity Trend</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Aggregated submissions trend</CardDescription>
            </div>
            <div className="flex gap-1">
              {(['daily', 'weekly', 'monthly'] as const).map((res) => (
                <button
                  key={res}
                  onClick={() => setTrendResolution(res)}
                  className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg transition-all border ${
                    trendResolution === res
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={getTrendData()} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={THEME_COLORS.blue} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={THEME_COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3f3f46', borderRadius: '8px' }} labelClassName="text-white font-bold" />
                <Area type="monotone" dataKey="Applications" stroke={THEME_COLORS.blue} strokeWidth={2.5} fillOpacity={1} fill="url(#colorTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Department Hiring Comparison */}
        {!isRecruiter && (
          <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Department Performance Breakdown</CardTitle>
              <CardDescription className="text-xs text-zinc-500">Hires and open roles mapped across active units</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentStats} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="departmentName" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3f3f46', borderRadius: '8px' }} labelClassName="text-white font-bold" />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="hires" name="Hires" fill={THEME_COLORS.emerald} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="openJobs" name="Open Openings" fill={THEME_COLORS.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* AI Screening match score distribution */}
        <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">AI Match Score Spread Histogram</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Distribution frequency of completed screening scores. Average Match: {screening.averageMatchScore}%</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={screening.scoreDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="bin" name="Score Brackets" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3f3f46', borderRadius: '8px' }} labelClassName="text-white font-bold" />
                <Bar dataKey="count" name="Candidates Count" fill={THEME_COLORS.blue} radius={[4, 4, 0, 0]} barSize={40}>
                  {screening.scoreDistribution.map((entry: any, index: number) => {
                    const colors = [THEME_COLORS.rose, THEME_COLORS.amber, THEME_COLORS.purple, THEME_COLORS.blue, THEME_COLORS.emerald];
                    return <Cell key={`cell-${index}`} fill={colors[index] || THEME_COLORS.blue} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Skills gap visualization */}
        <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Skills Gap Intelligence</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Comparing Job Market Demand against Candidate Supply percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={skillsChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="skill" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3f3f46', borderRadius: '8px' }} labelClassName="text-white font-bold" />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Market Demand (%)" fill={THEME_COLORS.rose} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Candidate Supply (%)" fill={THEME_COLORS.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hiring duration speed */}
        <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Hiring Velocity (Average Days)</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Days spent by applications transitioning through consecutive stages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={velocityChartData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={10} tickLine={false} />
                <YAxis dataKey="stage" type="category" stroke="#71717a" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#3f3f46', borderRadius: '8px' }} labelClassName="text-white font-bold" />
                <Bar dataKey="Days" fill={THEME_COLORS.amber} radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 5. Recruiter Leaderboard */}
      <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
            {isRecruiter ? 'Your Performance AnalyticsCard' : 'Recruiter Leaderboard & Conversion Matrix'}
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            {isRecruiter ? 'Overview of your key parameters' : 'Ranked performance matrix of recruiters based on hires'}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs text-left text-zinc-500 dark:text-zinc-400">
            <thead className="text-[10px] uppercase bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 font-bold border-b border-zinc-100 dark:border-zinc-800">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Recruiter Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3 text-center">Candidates Processed</th>
                <th className="px-5 py-3 text-center">Interviews Conducted</th>
                <th className="px-5 py-3 text-center">Offers Released</th>
                <th className="px-5 py-3 text-center">Hires</th>
                <th className="px-5 py-3 text-center">Conversion Rate</th>
                <th className="px-5 py-3 text-center">Avg Time to Hire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {recruiters.map((rec: any, idx: number) => (
                <tr key={rec.recruiterId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                  <td className="px-5 py-4 font-extrabold text-blue-600 dark:text-blue-400">#{idx + 1}</td>
                  <td className="px-5 py-4 font-bold">{rec.recruiterName}</td>
                  <td className="px-5 py-4 font-medium text-zinc-500">{rec.recruiterEmail}</td>
                  <td className="px-5 py-4 text-center font-semibold">{rec.candidatesProcessed}</td>
                  <td className="px-5 py-4 text-center font-semibold">{rec.interviewsConducted}</td>
                  <td className="px-5 py-4 text-center font-semibold">{rec.offersReleased}</td>
                  <td className="px-5 py-4 text-center font-extrabold text-emerald-600 dark:text-emerald-400">{rec.hiresCompleted}</td>
                  <td className="px-5 py-4 text-center font-bold">{rec.conversionRate}%</td>
                  <td className="px-5 py-4 text-center font-bold text-zinc-500">{rec.averageTimeToHire} Days</td>
                </tr>
              ))}
              {recruiters.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-6 italic text-zinc-500">No recruiters metrics available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 6. Jobs Performance Table (with Pagination) */}
      <Card className="border-zinc-200/60 dark:border-zinc-800/80 bg-white dark:bg-[#0e1422] rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Active Job Openings Statistics</CardTitle>
          <CardDescription className="text-xs text-zinc-500">Stage count and conversions for active postings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-zinc-500 dark:text-zinc-400">
              <thead className="text-[10px] uppercase bg-zinc-50 dark:bg-zinc-900/50 text-zinc-400 font-bold border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Job Title</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3 text-center">Applications</th>
                  <th className="px-5 py-3 text-center">Shortlisted</th>
                  <th className="px-5 py-3 text-center">Interviews</th>
                  <th className="px-5 py-3 text-center">Offers</th>
                  <th className="px-5 py-3 text-center">Hires</th>
                  <th className="px-5 py-3 text-center">Rejections</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                {jobPerformance.map((job: any) => (
                  <tr key={job.jobId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-4 font-bold text-zinc-500">{job.jobCode}</td>
                    <td className="px-5 py-4 font-bold text-zinc-900 dark:text-zinc-100">{job.jobTitle}</td>
                    <td className="px-5 py-4 font-medium">{job.departmentName || 'N/A'}</td>
                    <td className="px-5 py-4 text-center font-semibold">{job.applications}</td>
                    <td className="px-5 py-4 text-center font-semibold">{job.shortlisted}</td>
                    <td className="px-5 py-4 text-center font-semibold">{job.interviews}</td>
                    <td className="px-5 py-4 text-center font-semibold">{job.offers}</td>
                    <td className="px-5 py-4 text-center font-extrabold text-emerald-600 dark:text-emerald-400">{job.hires}</td>
                    <td className="px-5 py-4 text-center font-semibold text-rose-500">{job.rejections}</td>
                  </tr>
                ))}
                {jobPerformance.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-6 italic text-zinc-500">No active job posts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {jobTotal > 5 && (
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
              <span className="text-xs text-zinc-400 font-semibold">
                Showing {Math.min(jobTotal, (jobPage - 1) * 5 + 1)}–{Math.min(jobTotal, jobPage * 5)} of {jobTotal} job posts
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                  disabled={jobPage === 1}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setJobPage((p) => (p * 5 < jobTotal ? p + 1 : p))}
                  disabled={jobPage * 5 >= jobTotal}
                  className="rounded-xl border-zinc-200 dark:border-zinc-800 cursor-pointer"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
