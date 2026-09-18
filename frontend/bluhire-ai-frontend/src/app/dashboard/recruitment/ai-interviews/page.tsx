'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardOverview, getInterviewSessions, deleteInterviewSession } from '@/services/candidate.service';
import { Users, CheckCircle, Clock, Star, XCircle, Trophy, Eye, Video, FileText, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AIInterviewsDashboard() {
  const queryClient = useQueryClient();
  const { data: overview, isLoading: isOverviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['ai-interviews-overview'],
    queryFn: getDashboardOverview,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { 
    data: sessions, 
    isLoading: isSessionsLoading,
    isError: isSessionsError,
    error: sessionsError,
    refetch: refetchSessions
  } = useQuery({
    queryKey: ['ai-interviews-sessions'],
    queryFn: getInterviewSessions,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const deleteSessionMutation = useMutation({
    mutationFn: deleteInterviewSession,
    onSuccess: () => {
      toast.success('Interview session deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['ai-interviews-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['ai-interviews-overview'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete interview session');
    },
  });

  const handleDeleteSession = (id: string) => {
    if (window.confirm('Are you sure you want to delete this AI interview session? This action cannot be undone and will delete all related scores and reports.')) {
      deleteSessionMutation.mutate(id);
    }
  };

  if (isOverviewLoading || isSessionsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Candidates',
      value: overview?.totalCandidates || 0,
      icon: <Users className="h-5 w-5 text-indigo-400" />,
      color: 'text-indigo-400',
      border: 'border-indigo-500/20',
    },
    {
      title: 'Completed Interviews',
      value: overview?.completedInterviews || 0,
      icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    {
      title: 'Under Review',
      value: overview?.underReview || 0,
      icon: <Clock className="h-5 w-5 text-amber-400" />,
      color: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    {
      title: 'Shortlisted',
      value: overview?.shortlisted || 0,
      icon: <Star className="h-5 w-5 text-violet-400" />,
      color: 'text-violet-400',
      border: 'border-violet-500/20',
    },
    {
      title: 'Rejected',
      value: overview?.rejected || 0,
      icon: <XCircle className="h-5 w-5 text-rose-450" />,
      color: 'text-rose-450',
      border: 'border-rose-500/20',
    },
    {
      title: 'Selected',
      value: overview?.selected || 0,
      icon: <Trophy className="h-5 w-5 text-indigo-400" />,
      color: 'text-indigo-400',
      border: 'border-indigo-500/20',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20';
      case 'STARTED':
      case 'QUESTION_ACTIVE':
      case 'ANSWER_PROCESSING':
      case 'NEXT_QUESTION':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20';
      case 'CREATED':
      case 'READY':
        return 'bg-muted text-muted-foreground border-border dark:bg-white/5 dark:text-zinc-400 dark:border-white/5';
      case 'TIMEOUT':
      case 'ERROR':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-350 dark:border-rose-500/20';
      default:
        return 'bg-muted text-muted-foreground border-border dark:bg-white/5 dark:text-zinc-450 dark:border-white/5';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 select-none p-1">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-border dark:border-white/10 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-muted/40 dark:bg-white/5 p-1 rounded-xl border border-border dark:border-white/10">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white cursor-pointer block border border-transparent transition-colors">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white cursor-pointer block border border-transparent transition-colors">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white cursor-pointer block border border-transparent transition-colors">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-white cursor-pointer block border border-transparent transition-colors">
              Candidates
            </span>
          </Link>
          <Link href="/dashboard/recruitment/ai-interviews">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg bg-card dark:bg-white/10 border border-border dark:border-white/10 text-primary dark:text-white shadow-xs cursor-pointer block">
              AI Interviews
            </span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            whileHover={{ y: -4 }}
            className="transition-all duration-300"
          >
            <Card className="bg-card dark:bg-white/[0.03] border-border dark:border-white/10 shadow-[0_4px_20px_rgba(23,32,51,0.04)] dark:shadow-2xl relative overflow-hidden group rounded-[24px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5">
                <CardTitle className="text-small-label text-muted-foreground dark:text-white/45 truncate max-w-[120px] font-semibold">{card.title}</CardTitle>
                <div className={`p-2 rounded-xl bg-muted/60 dark:bg-white/[0.04] border ${card.border} ${card.color} group-hover:bg-muted dark:group-hover:bg-white/[0.08] transition-colors`}>
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="text-2xl font-bold text-foreground dark:text-white">{card.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-h2 text-foreground dark:text-white">Recent AI Interview Sessions</h2>
        <Card className="bg-card dark:bg-card/45 backdrop-blur-2xl border-border dark:border-white/10 shadow-[0_4px_20px_rgba(23,32,51,0.04)] dark:shadow-2xl rounded-2xl overflow-hidden">
          {isSessionsError ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-foreground dark:text-white">Failed to load interview sessions</h3>
              <p className="text-xs text-muted-foreground dark:text-zinc-400 max-w-sm">
                {(sessionsError as any)?.response?.data?.message || (sessionsError as any)?.message || 'An error occurred while fetching interview sessions.'}
              </p>
              <Button
                size="sm"
                onClick={() => refetchSessions()}
                className="mt-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-xl h-8 px-4 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </Button>
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-xs">No active AI interview sessions found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30 dark:bg-white/5 border-b border-border dark:border-white/10">
                <TableRow className="hover:bg-transparent border-b border-border dark:border-white/10">
                  <TableHead className="text-small-label font-bold text-foreground dark:text-zinc-300 border-b border-border dark:border-white/10 pl-6">Candidate</TableHead>
                  <TableHead className="text-small-label font-bold text-foreground dark:text-zinc-300 border-b border-border dark:border-white/10">Interview / Role</TableHead>
                  <TableHead className="text-small-label font-bold text-foreground dark:text-zinc-300 border-b border-border dark:border-white/10">Session Status</TableHead>
                  <TableHead className="text-small-label font-bold text-foreground dark:text-zinc-300 border-b border-border dark:border-white/10">Date Invited</TableHead>
                  <TableHead className="text-small-label font-bold text-foreground dark:text-zinc-300 border-b border-border dark:border-white/10 text-right pr-6 w-36">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any) => (
                  <TableRow key={session._id} className="hover:bg-muted/30 dark:hover:bg-white/5 border-b border-border dark:border-white/10 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground dark:text-white">
                          {session.candidateId?.firstName} {session.candidateId?.lastName}
                        </span>
                        <span className="text-[10px] text-muted-foreground dark:text-white/40 mt-0.5">{session.candidateId?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-foreground/80 dark:text-zinc-300 font-medium">
                      {session.jobId?.title || session.templateId?.title || 'Job Interview'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getStatusColor(session.status)}`}>
                        {session.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground dark:text-white/60">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right pr-6 flex items-center justify-end gap-1.5 h-12">
                      {session.status === 'COMPLETED' ? (
                        <Link href={`/dashboard/recruitment/ai-interviews/${session._id}`}>
                          <Button size="sm" className="bg-primary hover:bg-primary-hover text-white text-[10px] font-bold rounded-xl h-7 px-3 border-0 gap-1.5 shadow-sm">
                            <Eye className="w-3 h-3" /> View Results
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-[10px] font-semibold text-muted-foreground dark:text-white/60 bg-muted/60 dark:bg-white/5 border border-border dark:border-white/10 px-2.5 py-1 rounded-lg">
                          Pending
                        </span>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSession(session._id)}
                        className="text-muted-foreground hover:text-red-500 hover:bg-muted dark:hover:bg-white/5 w-7 h-7 p-0 rounded-lg border border-transparent"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
