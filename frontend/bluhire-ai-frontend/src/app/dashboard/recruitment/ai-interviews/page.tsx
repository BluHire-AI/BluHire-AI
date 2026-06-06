'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardOverview } from '@/services/candidate.service';
import { Users, CheckCircle, Clock, Star, XCircle, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AIInterviewsDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ai-interviews-overview'],
    queryFn: getDashboardOverview,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-red-500 bg-red-50 rounded-lg">
        Failed to load dashboard metrics.
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Candidates',
      value: data.totalCandidates,
      icon: <Users className="h-6 w-6 text-blue-500" />,
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Completed Interviews',
      value: data.completedInterviews,
      icon: <CheckCircle className="h-6 w-6 text-emerald-500" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      title: 'Under Review',
      value: data.underReview,
      icon: <Clock className="h-6 w-6 text-amber-500" />,
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      title: 'Shortlisted',
      value: data.shortlisted,
      icon: <Star className="h-6 w-6 text-purple-500" />,
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
    {
      title: 'Rejected',
      value: data.rejected,
      icon: <XCircle className="h-6 w-6 text-red-500" />,
      bg: 'bg-red-50',
      border: 'border-red-100',
    },
    {
      title: 'Selected',
      value: data.selected,
      icon: <Trophy className="h-6 w-6 text-indigo-500" />,
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">AI Interviews Dashboard</h1>
          <p className="text-slate-500 mt-2">Executive overview of candidate pipelines and evaluations.</p>
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

      {/* Placeholder for Pipeline/Rankings components in subsequent steps */}
      <div className="mt-12 p-8 border border-slate-200 rounded-2xl bg-white border-dashed text-center text-slate-400">
        Pipeline & Rankings view will be integrated here...
      </div>
    </div>
  );
}
