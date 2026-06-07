'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardOverview, getInterviewSessions, deleteInterviewSession } from '@/services/candidate.service';
import { Users, CheckCircle, Clock, Star, XCircle, Trophy, Eye, Video, FileText, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
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
      icon: <Users className="h-6 w-6 text-blue-500" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Completed Interviews',
      value: overview?.completedInterviews || 0,
      icon: <CheckCircle className="h-6 w-6 text-emerald-500" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      title: 'Under Review',
      value: overview?.underReview || 0,
      icon: <Clock className="h-6 w-6 text-amber-500" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      title: 'Shortlisted',
      value: overview?.shortlisted || 0,
      icon: <Star className="h-6 w-6 text-purple-500" />,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      title: 'Rejected',
      value: overview?.rejected || 0,
      icon: <XCircle className="h-6 w-6 text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
    {
      title: 'Selected',
      value: overview?.selected || 0,
      icon: <Trophy className="h-6 w-6 text-indigo-500" />,
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'STARTED':
      case 'QUESTION_ACTIVE':
      case 'ANSWER_PROCESSING':
      case 'NEXT_QUESTION':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CREATED':
      case 'READY':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'TIMEOUT':
      case 'ERROR':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#0e1422] p-1 rounded-xl">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
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
          <Link href="/dashboard/recruitment/ai-interviews">
            <span className="text-xs font-bold px-4 py-2 rounded-lg bg-white dark:bg-[#161f30] text-blue-600 dark:text-blue-400 shadow-sm cursor-pointer block">
              AI Interviews
            </span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-6 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
          >
            {/* Background decoration */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 ${card.bg}`} />
            
            <div className="relative z-10 flex items-center space-x-4">
              <div className={`p-4 rounded-xl ${card.bg} ${card.border} border`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{card.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Recent AI Interview Sessions</h2>
        <Card className="bg-white border-zinc-200/80 shadow-sm rounded-2xl overflow-hidden">
          {!sessions || sessions.length === 0 ? (
            <div className="text-center py-20 text-zinc-400">No active AI interview sessions found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow>
                  <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Candidate</TableHead>
                  <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Template</TableHead>
                  <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Session Status</TableHead>
                  <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Date Invited</TableHead>
                  <TableHead className="text-xs font-extrabold uppercase text-zinc-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any) => (
                  <TableRow key={session._id} className="hover:bg-zinc-50/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-800">
                          {session.candidateId?.firstName} {session.candidateId?.lastName}
                        </span>
                        <span className="text-xs text-zinc-500">{session.candidateId?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600 font-medium">
                      {session.templateId?.title || 'Unknown Template'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-xs px-2.5 py-0.5 rounded-full ${getStatusColor(session.status)}`}>
                        {session.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {new Date(session.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      {session.status === 'COMPLETED' ? (
                        <Link href={`/dashboard/recruitment/ai-interviews/${session._id}`}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-2">
                            <Eye className="w-4 h-4" /> View Results
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="ghost" disabled className="text-zinc-400 rounded-lg">
                          Pending
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSession(session._id)}
                        className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 w-8 h-8 p-0"
                        title="Delete Session"
                      >
                        <Trash2 className="w-4 h-4" />
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
