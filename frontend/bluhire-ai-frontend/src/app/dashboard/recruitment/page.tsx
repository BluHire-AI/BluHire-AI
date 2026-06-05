'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { recruitmentService } from '@/services/recruitment.service';
import { Briefcase, Users, FileText, CheckCircle, Clock, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RecruitmentDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await recruitmentService.getAnalytics();
        setStats(data);
      } catch (error) {
        console.error('Failed to load recruitment stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-400 font-medium">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
        Analysing recruitment data streams...
      </div>
    );
  }

  // Fallbacks for stats if empty
  const openJobs = stats?.openJobs || 0;
  const totalCandidates = stats?.totalCandidates || 0;
  const totalApplications = stats?.totalApplications || 0;
  const hiredCount = stats?.pipelineStats?.HIRED || 0;
  const offerCount = stats?.pipelineStats?.OFFER || 0;
  const interviewCount = stats?.pipelineStats?.INTERVIEW || 0;
  const screeningCount = stats?.pipelineStats?.SCREENING || 0;

  return (
    <div className="space-y-8">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#0e1422] p-1 rounded-xl">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-bold px-4 py-2 rounded-lg bg-white dark:bg-[#161f30] text-blue-600 dark:text-blue-400 shadow-sm cursor-pointer block">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
              Candidates
            </span>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/careers" target="_blank">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
              Careers Portal
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Active Jobs</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">{openJobs}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Total Candidates</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">{totalCandidates}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/10 text-amber-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Applications</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">{totalApplications}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Hired Candidates</p>
              <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mt-1">{hiredCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pipeline Distribution Chart (custom styled bar) */}
        <Card className="lg:col-span-2 bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
                Pipeline Funnel Stages
              </CardTitle>
              <CardDescription className="text-xs">Distribution of candidate profiles currently in the funnel</CardDescription>
            </CardHeader>
            <div className="space-y-4">
              {[
                { stage: 'Screening', count: screeningCount, color: 'bg-indigo-500' },
                { stage: 'Interviews Scheduled', count: interviewCount, color: 'bg-amber-500' },
                { stage: 'Offers Extended', count: offerCount, color: 'bg-blue-500' },
                { stage: 'Hired (Employee List)', count: hiredCount, color: 'bg-emerald-500' },
              ].map((item) => {
                const percentage = totalApplications > 0 ? Math.round((item.count / totalApplications) * 100) : 0;
                return (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-600 dark:text-zinc-400">{item.stage}</span>
                      <span className="text-zinc-800 dark:text-zinc-100">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.max(3, percentage)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50 mt-6 flex justify-end">
            <Link href="/dashboard/recruitment/pipeline">
              <Button size="sm" variant="ghost" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
                Go to Pipeline Board →
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recruitment Activity Log Feed */}
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm p-6">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-blue-600" />
              Recruitment Feed
            </CardTitle>
            <CardDescription className="text-xs">Latest log activity updates from recruitment funnel</CardDescription>
          </CardHeader>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {!stats?.recentActivities || stats.recentActivities.length === 0 ? (
              <p className="text-xs text-zinc-400 text-center py-10">No recent activities logged.</p>
            ) : (
              stats.recentActivities.map((act: any) => (
                <div key={act._id} className="flex gap-3 text-xs relative group pb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-700 dark:text-zinc-300 leading-tight">
                      {act.title.replace('_', ' ')}
                    </p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
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
