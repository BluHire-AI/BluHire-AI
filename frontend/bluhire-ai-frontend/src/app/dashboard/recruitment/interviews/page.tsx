'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, ArrowLeft, RefreshCw, FileText, CheckCircle2, Clock, 
  Settings, Award, TrendingUp, AlertTriangle, Eye, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Assignment {
  _id: string;
  candidateId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    candidateCode: string;
  };
  jobId: {
    _id: string;
    title: string;
    jobCode: string;
  };
  interviewTemplateId: {
    _id: string;
    name: string;
    timeLimit: number;
    numQuestions: number;
  };
  status: string;
  assignedAt: string;
  expiresAt: string;
  resumeScore?: number;
  interviewScore?: number;
  finalCandidateScore?: number;
  rankingPosition?: number;
  magicToken?: string;
}

interface Analytics {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  averageScore: number;
  successRate: number;
  recommendationDistribution: Record<string, number>;
}

export default function InterviewsDashboard() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  const [analytics, setAnalytics] = useState<Analytics>({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    averageScore: 0,
    successRate: 0,
    recommendationDistribution: {
      'Strong Hire': 0,
      'Hire': 0,
      'Consider': 0,
      'Weak Consider': 0,
      'Reject': 0
    }
  });

  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await api.get('/recruitment/jobs');
      setJobs(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error('Failed to load jobs filter', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const queryParams: any = {};
      if (selectedJob !== 'ALL') queryParams.jobId = selectedJob;
      if (selectedStatus !== 'ALL') queryParams.status = selectedStatus;

      // 1. Fetch assignments list
      const listRes = await api.get('/recruitment/interviews/assignments', { params: queryParams });
      const rawList: Assignment[] = listRes.data?.data || [];
      
      // Sort: Completed/Reviewed at the top sorted by finalCandidateScore desc, followed by Pending/In Progress
      const sorted = [...rawList].sort((a, b) => {
        const aScore = a.finalCandidateScore || 0;
        const bScore = b.finalCandidateScore || 0;
        return bScore - aScore; // Highest final score at the top
      });
      setAssignments(sorted);

      // 2. Fetch aggregated dynamic analytics
      const analyticsRes = await api.get('/recruitment/interviews/analytics', { params: queryParams });
      setAnalytics(analyticsRes.data?.data);

    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [selectedJob, selectedStatus]);

  // Copy magic link to clipboard
  const handleCopyLink = (token?: string) => {
    if (!token) return;
    const url = `${window.location.origin}/careers/activate?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Magic link copied to clipboard!');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 select-none">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-2xl border border-white/10">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-white/60 hover:text-white cursor-pointer block transition-all">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-white/60 hover:text-white cursor-pointer block transition-all">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-white/60 hover:text-white cursor-pointer block transition-all">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-white/60 hover:text-white cursor-pointer block transition-all">
              Candidates
            </span>
          </Link>
          <Link href="/dashboard/recruitment/interviews">
            <span className="text-xs font-bold px-4 py-2 rounded-xl bg-[#8B5CF6] text-white shadow-md cursor-pointer block transition-all">
              AI Voice Interviews
            </span>
          </Link>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            AI Interviews & Evaluations Dashboard
          </h1>
          <p className="text-white/60 text-xs">Monitor candidate attempt logs, track browser integrity records, and examine dynamic scorecards.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/dashboard/recruitment/interviews/templates">
            <Button variant="outline" size="sm" className="rounded-xl border-white/10 text-white/80 hover:text-white bg-transparent h-9 text-xs">
              <Settings className="w-3.5 h-3.5 mr-2" /> Templates Manager
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Invited', val: analytics.totalAssignments, desc: 'Scheduled sittings count', icon: Clock },
          { title: 'Completed Sessions', val: analytics.completedAssignments, desc: 'Assessments finished', icon: CheckCircle2 },
          { title: 'Average Score', val: `${analytics.averageScore}%`, desc: 'Interview performance average', icon: Award },
          { title: 'Interview Success Rate', val: `${analytics.successRate}%`, desc: 'Invited vs finished ratio', icon: TrendingUp },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} className="bg-white/[0.02] border-white/10 rounded-[20px] shadow-lg relative overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">{item.title}</span>
                <div className="p-2 rounded-lg bg-white/[0.04] text-white/50 group-hover:text-[#8B5CF6] transition-colors">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="text-2xl font-bold text-white">{item.val}</div>
                <p className="text-[10px] text-white/40 mt-1">{item.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Analytics distribution and quick filters */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Recommendation distribution card */}
        <Card className="bg-white/[0.02] border-white/10 rounded-[24px] shadow-lg p-6 space-y-4 md:col-span-1">
          <div>
            <h3 className="text-sm font-bold text-white">Recommendation Distribution</h3>
            <p className="text-[10px] text-white/45">Hiring recommendations aggregated dynamically.</p>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {Object.entries(analytics.recommendationDistribution).map(([label, count]) => {
              const total = analytics.completedAssignments || 1;
              const percent = Math.min(100, Math.round((count / total) * 100));
              let color = 'bg-[#8B5CF6]';
              if (label === 'Strong Hire' || label === 'Hire') color = 'bg-emerald-500';
              if (label === 'Reject') color = 'bg-red-500';

              return (
                <div key={label} className="space-y-1">
                  <div className="flex justify-between text-white/70">
                    <span>{label}</span>
                    <span className="font-mono text-white/40">{count} ({percent}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* List of candidates with filters */}
        <Card className="bg-white/[0.02] border-white/10 rounded-[24px] shadow-lg p-6 space-y-4 md:col-span-2">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Candidates & Rank Leaderboard</h3>
              <p className="text-[10px] text-white/45">Sorted dynamically by Final Candidate Score.</p>
            </div>

            <div className="flex gap-2">
              <Select value={selectedJob} onValueChange={(val) => setSelectedJob(val || 'ALL')}>
                <SelectTrigger className="w-[160px] bg-white/[0.03] border-white/10 rounded-xl h-8 text-xs text-white">
                  <SelectValue placeholder="Filter Job" />
                </SelectTrigger>
                <SelectContent className="bg-[#0b0b0c] border border-white/10 text-white">
                  <SelectItem value="ALL">All Jobs</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job._id} value={job._id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val || 'ALL')}>
                <SelectTrigger className="w-[120px] bg-white/[0.03] border-white/10 rounded-xl h-8 text-xs text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0b0b0c] border border-white/10 text-white">
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-white/5 text-[10px] font-mono uppercase text-white/40">
                  <TableHead>Rank</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job Role</TableHead>
                  <TableHead>Resume</TableHead>
                  <TableHead>Voice AI</TableHead>
                  <TableHead>Final Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <RefreshCw className="w-5 h-5 text-[#8B5CF6] animate-spin mx-auto mb-2" />
                      <span className="text-xs text-white/40 font-mono">Querying rankings...</span>
                    </TableCell>
                  </TableRow>
                ) : assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-white/40 italic text-xs">
                      No candidates matches found for the filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((a) => {
                    const isCompleted = a.status === 'Completed' || a.status === 'Reviewed';
                    const candName = a.candidateId ? `${a.candidateId.firstName} ${a.candidateId.lastName}` : 'N/A';
                    
                    return (
                      <TableRow key={a._id} className="border-white/5 hover:bg-white/[0.01] transition-all text-xs text-white/80">
                        <TableCell className="font-mono font-bold text-white">
                          {isCompleted && a.rankingPosition ? `#${a.rankingPosition}` : '-'}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white">{candName}</span>
                            <span className="text-[10px] text-white/40 font-mono">{a.candidateId?.candidateCode || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>{a.jobId?.title || 'N/A'}</TableCell>
                        <TableCell className="font-mono">{a.resumeScore !== null && a.resumeScore !== undefined ? `${a.resumeScore}%` : '-'}</TableCell>
                        <TableCell className="font-mono">{a.interviewScore !== null && a.interviewScore !== undefined ? `${a.interviewScore}%` : '-'}</TableCell>
                        <TableCell className="font-mono font-bold text-[#8B5CF6]">
                          {a.finalCandidateScore !== null && a.finalCandidateScore !== undefined ? `${a.finalCandidateScore}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {a.status === 'Completed' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] rounded">Completed</Badge>
                          ) : a.status === 'In Progress' ? (
                            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px] rounded animate-pulse">In Progress</Badge>
                          ) : (
                            <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[9px] rounded">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isCompleted ? (
                            // Find active session on-click or route by session reference.
                            // In our service we use sessionId. Let's send them to report with assignment details
                            // or session. The report viewer can look up session by assignmentId!
                            <Link href={`/dashboard/recruitment/interviews/report/${a._id}`}>
                              <Button size="sm" variant="ghost" className="h-8 rounded-lg hover:bg-white/[0.04] text-white/60 hover:text-white">
                                <Eye className="w-3.5 h-3.5 mr-1.5" /> View Report
                              </Button>
                            </Link>
                          ) : a.magicToken ? (
                            <Button 
                              onClick={() => handleCopyLink(a.magicToken)}
                              size="sm" 
                              variant="outline" 
                              className="h-8 rounded-lg border-white/10 hover:bg-white/[0.04] text-white/70"
                            >
                              Copy Magic Link
                            </Button>
                          ) : (
                            <span className="text-[10px] text-white/30">Unavailable</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
