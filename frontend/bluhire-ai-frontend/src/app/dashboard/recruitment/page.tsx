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
  const offerCount = stats?.pipelineStats?.OFFER || 0;
  const interviewCount = stats?.pipelineStats?.INTERVIEW || 0;
  const screeningCount = stats?.pipelineStats?.SCREENING || 0;

  return (
    <div className="space-y-6 select-none">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white shadow-sm cursor-pointer block">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block transition-colors border border-transparent">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block transition-colors border border-transparent">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block transition-colors border border-transparent">
              Candidates
            </span>
          </Link>
          <Link href="/dashboard/recruitment/ai-interviews">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block transition-colors border border-transparent">
              AI Interviews
            </span>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href="/careers" target="_blank">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 rounded-xl border-white/5 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 cursor-pointer">
              Careers Portal
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: 'Active Jobs', val: openJobs, icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/25' },
          { title: 'Candidates', val: totalCandidates, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/25' },
          { title: 'Applications', val: totalApplications, icon: FileText, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/25' },
          { title: 'Hired', val: hiredCount, icon: CheckCircle, color: 'text-emerald-450', bg: 'bg-emerald-500/10 border-emerald-500/25' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} className="bg-card/45 border-white/5 shadow-2xl rounded-2xl relative overflow-hidden group">
              <CardContent className="p-5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">{item.title}</p>
                  <h3 className="text-xl font-bold text-white mt-0.5">{item.val}</h3>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Avg Match Score Card */}
        <Card className="col-span-2 lg:col-span-1 bg-card/45 border-white/5 shadow-2xl rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-650 animate-pulse" />
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">Avg Match Score</p>
              <h3 className="text-xl font-bold text-purple-400 mt-0.5">
                {aiStats?.averageAiScore ? `${aiStats.averageAiScore}%` : 'Pending'}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Voice Interviews Quick Access Banner */}
      <Card className="bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-purple-900/40 border border-violet-500/20 shadow-2xl rounded-[24px] p-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-violet-500/10 text-violet-300 border border-violet-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Voice Interview AI
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400 animate-pulse shrink-0" />
              Automated AI Voice Interviews & Candidate Rankings
            </h2>
            <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
              Unlock intelligent recruiting. Candidates moved to the shortlisted stage are automatically invited to set up access, sitting voice-driven interviews with simulated recruiters. Assess technical/communication strengths and view rank positions.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/dashboard/recruitment/ai-interviews">
              <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl border-white/10 hover:bg-white/[0.06] bg-transparent text-white/80 hover:text-white h-9 px-4">
                Manage Templates
              </Button>
            </Link>
            <Link href="/dashboard/recruitment/ai-interviews">
              <Button size="sm" className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/10 shadow-lg shadow-indigo-650/20 h-9 px-4">
                View Interviews & Rankings
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Main Funnel Stages and Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-card/45 border-white/5 shadow-2xl p-5 flex flex-col justify-between rounded-2xl">
          <div>
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Pipeline Funnel Stages
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-400">Distribution of candidate profiles currently in the funnel</CardDescription>
            </CardHeader>
            <div className="space-y-4">
              {[
                { stage: 'Screening', count: screeningCount, color: 'bg-indigo-500' },
                { stage: 'Interviews Scheduled', count: interviewCount, color: 'bg-amber-500' },
                { stage: 'Offers Extended', count: offerCount, color: 'bg-indigo-400' },
                { stage: 'Hired (Employee List)', count: hiredCount, color: 'bg-emerald-500' },
              ].map((item) => {
                const percentage = totalApplications > 0 ? Math.round((item.count / totalApplications) * 100) : 0;
                return (
                  <div key={item.stage} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-zinc-300">{item.stage}</span>
                      <span className="text-white">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.max(3, percentage)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-4 border-t border-white/5 mt-6 flex justify-end">
            <Link href="/dashboard/recruitment/pipeline">
              <Button size="sm" variant="ghost" className="text-xs text-indigo-400 hover:text-white font-bold hover:bg-white/5 cursor-pointer rounded-xl">
                Go to Pipeline Board &rarr;
              </Button>
            </Link>
          </div>
        </Card>

        {/* Activity Log Feed */}
        <Card className="bg-card/45 border-white/5 shadow-2xl p-5 rounded-2xl flex flex-col">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Recruitment Feed
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-400">Latest log activity updates from recruitment funnel</CardDescription>
          </CardHeader>
          <div className="space-y-4 max-h-[260px] overflow-y-auto pr-2 flex-1 scrollbar-none">
            {!stats?.recentActivities || stats.recentActivities.length === 0 ? (
              <p className="text-xs text-zinc-500 italic text-center py-10">No recent activities logged.</p>
            ) : (
              stats.recentActivities.map((act: any) => (
                <div key={act._id} className="flex gap-3 text-xs relative group pb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-zinc-200 group-hover:text-indigo-400 leading-tight transition-colors">
                      {act.title.replace('_', ' ')}
                    </p>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      {act.description}
                    </p>
                    <p className="text-[9px] text-zinc-500 mt-0.5 bg-white/5 px-2 py-0.5 rounded border border-white/5 inline-block">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Recommendation Distribution */}
          <Card className="bg-card/45 border-white/5 shadow-2xl p-5 flex flex-col justify-between rounded-2xl">
            <div>
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  AI Recommendation Funnel
                </CardTitle>
                <CardDescription className="text-[10px] text-zinc-400">Candidate evaluations classified by OpenRouter screening models</CardDescription>
              </CardHeader>
              <div className="space-y-4">
                {[
                  { recommendation: 'Strong Hire', count: aiStats.strongHireCount || 0, color: 'bg-emerald-600' },
                  { recommendation: 'Hire', count: aiStats.hireCount || 0, color: 'bg-emerald-450' },
                  { recommendation: 'Needs Review', count: aiStats.needsReviewCount || 0, color: 'bg-amber-500' },
                  { recommendation: 'Reject', count: aiStats.rejectCount || 0, color: 'bg-rose-500' }
                ].map((item) => {
                  const totalCompleted = (aiStats.strongHireCount || 0) + (aiStats.hireCount || 0) + (aiStats.needsReviewCount || 0) + (aiStats.rejectCount || 0);
                  const percentage = totalCompleted > 0 ? Math.round((item.count / totalCompleted) * 100) : 0;
                  return (
                    <div key={item.recommendation} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-zinc-300">{item.recommendation}</span>
                        <span className="text-white">{item.count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${Math.max(2, percentage)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* AI Matching vs Missing Skills Analysis */}
          <Card className="lg:col-span-2 bg-card/45 border-white/5 shadow-2xl p-5 rounded-2xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                Aggregated Skills Match Sourcing Analysis
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-400">Top matching and missing skill tags parsed by AI from candidate profiles</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Matching Skills */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Top Matching Skills</span>
                </div>
                <div className="space-y-2">
                  {!aiStats.topMatchingSkills || aiStats.topMatchingSkills.length === 0 ? (
                    <p className="text-[10px] text-zinc-500 italic">No skills match analysis records available yet.</p>
                  ) : (
                    aiStats.topMatchingSkills.slice(0, 5).map((item: any) => (
                      <div key={item.skill} className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-xl text-xs">
                        <span className="font-semibold text-emerald-300">{item.skill}</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-250 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                          {item.count} hits
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Missing Skills */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-rose-455 font-bold text-xs">
                  <Info className="w-3.5 h-3.5" />
                  <span>Top Missing Skills</span>
                </div>
                <div className="space-y-2">
                  {!aiStats.topMissingSkills || aiStats.topMissingSkills.length === 0 ? (
                    <p className="text-[10px] text-zinc-500 italic">No missing skills analysis records available yet.</p>
                  ) : (
                    aiStats.topMissingSkills.slice(0, 5).map((item: any) => (
                      <div key={item.skill} className="flex justify-between items-center bg-rose-500/10 border border-rose-500/25 p-2.5 rounded-xl text-xs">
                        <span className="font-semibold text-rose-350">{item.skill}</span>
                        <span className="text-[9px] bg-rose-500/20 text-rose-250 px-2 py-0.5 rounded-full font-bold border border-rose-500/20">
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
