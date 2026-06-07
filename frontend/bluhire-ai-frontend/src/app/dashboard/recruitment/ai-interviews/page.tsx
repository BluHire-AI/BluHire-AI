'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardOverview, getInterviewSessions, deleteInterviewSession } from '@/services/candidate.service';
import { Users, CheckCircle, Clock, Star, XCircle, Trophy, Eye, Video, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AIInterviewsDashboard() {
  const queryClient = useQueryClient();
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['ai-interviews-overview'],
    queryFn: getDashboardOverview,
  });

  const { data: sessions, isLoading: isSessionsLoading } = useQuery({
    queryKey: ['ai-interviews-sessions'],
    queryFn: getInterviewSessions,
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
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'STARTED':
      case 'QUESTION_ACTIVE':
      case 'ANSWER_PROCESSING':
      case 'NEXT_QUESTION':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
      case 'CREATED':
      case 'READY':
        return 'bg-white/5 text-zinc-400 border-white/5';
      case 'TIMEOUT':
      case 'ERROR':
        return 'bg-rose-500/10 text-rose-350 border-rose-500/20';
      default:
        return 'bg-white/5 text-zinc-450 border-white/5';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 select-none p-1">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block border border-transparent">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block border border-transparent">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block border border-transparent">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block border border-transparent">
              Candidates
            </span>
          </Link>
          <Link href="/dashboard/recruitment/ai-interviews">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white shadow-sm cursor-pointer block">
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
            <Card className="bg-white/[0.03] border-white/10 shadow-2xl relative overflow-hidden group rounded-[24px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-5 pt-5">
                <CardTitle className="text-small-label text-white/45 truncate max-w-[120px]">{card.title}</CardTitle>
                <div className={`p-2 rounded-xl bg-white/[0.04] border ${card.border} ${card.color} group-hover:bg-white/[0.08] transition-colors`}>
                  {card.icon}
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="text-2xl font-bold text-white">{card.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="text-h2 text-white">Recent AI Interview Sessions</h2>
        <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
          {!sessions || sessions.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 text-xs">No active AI interview sessions found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-white/5 border-b border-white/5">
                <TableRow className="hover:bg-transparent border-b border-white/5">
                  <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-450 border-b border-white/5 pl-6">Candidate</TableHead>
                  <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-455 border-b border-white/5">Template</TableHead>
                  <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-455 border-b border-white/5">Session Status</TableHead>
                  <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-455 border-b border-white/5">Date Invited</TableHead>
                  <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-455 border-b border-white/5 text-right pr-6 w-36">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any) => (
                  <TableRow key={session._id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">
                          {session.candidateId?.firstName} {session.candidateId?.lastName}
                        </span>
                        <span className="text-[10px] text-zinc-500 mt-0.5">{session.candidateId?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-300 font-semibold">
                      {session.templateId?.title || 'Unknown Template'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getStatusColor(session.status)}`}>
                        {session.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right pr-6 flex items-center justify-end gap-1.5 h-12">
                      {session.status === 'COMPLETED' ? (
                        <Link href={`/dashboard/recruitment/ai-interviews/${session._id}`}>
                          <Button size="sm" className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-bold rounded-xl h-7 px-3 border border-white/10 gap-1.5">
                            <Eye className="w-3 h-3" /> View Results
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-[10px] font-semibold text-zinc-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
                          Pending
                        </span>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteSession(session._id)}
                        className="text-zinc-455 hover:text-red-400 hover:bg-white/5 w-7 h-7 p-0 rounded-lg border border-transparent"
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
