'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { recruitmentService } from '@/services/recruitment.service';
import { Briefcase, Users, FileText, CheckCircle, Clock, TrendingUp, Calendar, ArrowUpRight, Sparkles, Award, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RecruitmentDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [aiStats, setAiStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await recruitmentService.getAnalytics();
        setStats(data);
        try {
          const aiData = await recruitmentService.getAIAnalytics();
          setAiStats(aiData);
        } catch (aiErr) {
          console.error('Failed to load AI analytics stats:', aiErr);
        }
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
  const interviewCount = stats?.pipelineStats?.INTERVIEW || 0;
  const screeningCount = stats?.pipelineStats?.SCREENING || 0;

  return (
    <div className="space-y-8">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#0e1422] p-1 rounded-xl border border-zinc-200 dark:border-zinc-850">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-bold px-4 py-2 rounded-lg bg-white dark:bg-[#161f30] text-blue-600 dark:text-blue-400 shadow-sm cursor-pointer block">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-550 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block transition-colors">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-555 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block transition-colors">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-555 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block transition-colors">
              Candidates
            </span>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/careers" target="_blank">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 rounded-xl">
              Careers Portal
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Active Jobs</p>
              <h3 className="text-xl font-black text-zinc-850 dark:text-zinc-100 mt-0.5">{openJobs}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Candidates</p>
              <h3 className="text-xl font-black text-zinc-850 dark:text-zinc-100 mt-0.5">{totalCandidates}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Applications</p>
              <h3 className="text-xl font-black text-zinc-850 dark:text-zinc-100 mt-0.5">{totalApplications}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-xl">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Hired</p>
              <h3 className="text-xl font-black text-zinc-850 dark:text-zinc-100 mt-0.5">{hiredCount}</h3>
            </div>
          </CardContent>
        </Card>

        {/* New average AI match score KPI card */}
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600 animate-pulse" />
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase tracking-wider">Avg Match Score</p>
              <h3 className="text-xl font-black text-purple-650 dark:text-purple-400 mt-0.5">
                {aiStats?.averageAiScore ? `${aiStats.averageAiScore}%` : 'Pending'}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Funnel Stages and Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm p-6 flex flex-col justify-between rounded-xl">
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
                { stage: 'Hired (Employee List)', count: hiredCount, color: 'bg-emerald-500' },
              ].map((item) => {
                const percentage = totalApplications > 0 ? Math.round((item.count / totalApplications) * 100) : 0;
                return (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-600 dark:text-zinc-400">{item.stage}</span>
                      <span className="text-zinc-850 dark:text-zinc-100">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.max(3, percentage)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 mt-6 flex justify-end">
            <Link href="/dashboard/recruitment/pipeline">
              <Button size="sm" variant="ghost" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50/50 dark:hover:bg-blue-950/20">
                Go to Pipeline Board →
              </Button>
            </Link>
          </div>
        </Card>

        {/* Activity Log Feed */}
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm p-6 rounded-xl">
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
                      {act.title.replace('_', ' ')}
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

      {/* AI Resume Screening Insights Dashboard Section */}
      {aiStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* AI Recommendation Distribution */}
          <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm p-6 flex flex-col justify-between rounded-xl">
            <div>
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-bold text-zinc-805 dark:text-zinc-100 flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-purple-600 animate-pulse" />
                  AI Candidate Recommendation Funnel
                </CardTitle>
                <CardDescription className="text-xs">Candidate evaluations classified by OpenRouter screening models</CardDescription>
              </CardHeader>
              <div className="space-y-4">
                {[
                  { recommendation: 'Strong Hire', count: aiStats.strongHireCount || 0, color: 'bg-emerald-600' },
                  { recommendation: 'Hire', count: aiStats.hireCount || 0, color: 'bg-emerald-400' },
                  { recommendation: 'Needs Review', count: aiStats.needsReviewCount || 0, color: 'bg-amber-400' },
                  { recommendation: 'Reject', count: aiStats.rejectCount || 0, color: 'bg-rose-500' }
                ].map((item) => {
                  const totalCompleted = (aiStats.strongHireCount || 0) + (aiStats.hireCount || 0) + (aiStats.needsReviewCount || 0) + (aiStats.rejectCount || 0);
                  const percentage = totalCompleted > 0 ? Math.round((item.count / totalCompleted) * 100) : 0;
                  return (
                    <div key={item.recommendation} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-650 dark:text-zinc-400">{item.recommendation}</span>
                        <span className="text-zinc-850 dark:text-zinc-200">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.max(2, percentage)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* AI Matching vs Missing Skills Analysis */}
          <Card className="lg:col-span-2 bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm p-6 rounded-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-sm font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-blue-600" />
                Aggregated Skills Match Sourcing Analysis
              </CardTitle>
              <CardDescription className="text-xs">Top matching and missing skill tags parsed by AI from candidate profiles</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Matching Skills */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                  <span>Top Matching Skills</span>
                </div>
                <div className="space-y-2">
                  {!aiStats.topMatchingSkills || aiStats.topMatchingSkills.length === 0 ? (
                    <p className="text-[10px] text-zinc-450 italic">No skills match analysis records available yet.</p>
                  ) : (
                    aiStats.topMatchingSkills.slice(0, 5).map((item: any) => (
                      <div key={item.skill} className="flex justify-between items-center bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 p-2 rounded-lg text-xs">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">{item.skill}</span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-350 px-2 py-0.5 rounded-full font-bold">
                          {item.count} hits
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Missing Skills */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-rose-500 font-bold text-xs">
                  <Info className="w-4 h-4" />
                  <span>Top Missing Skills</span>
                </div>
                <div className="space-y-2">
                  {!aiStats.topMissingSkills || aiStats.topMissingSkills.length === 0 ? (
                    <p className="text-[10px] text-zinc-450 italic">No missing skills analysis records available yet.</p>
                  ) : (
                    aiStats.topMissingSkills.slice(0, 5).map((item: any) => (
                      <div key={item.skill} className="flex justify-between items-center bg-rose-500/5 dark:bg-rose-955/10 border border-rose-500/10 p-2 rounded-lg text-xs">
                        <span className="font-semibold text-rose-700 dark:text-rose-455">{item.skill}</span>
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-350 px-2 py-0.5 rounded-full font-bold">
                          {item.count} gaps
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
