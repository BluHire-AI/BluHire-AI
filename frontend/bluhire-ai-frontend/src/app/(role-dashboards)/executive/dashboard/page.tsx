'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExecutiveAnalytics } from '@/services/analytics.service';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, CheckCircle2, Clock, UserCheck, Trophy, XCircle, 
  Percent, Code, MessageSquare, BrainCircuit, Activity 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function ExecutiveDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['executive-analytics'],
    queryFn: getExecutiveAnalytics,
  });

  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['SENIOR_MANAGER', 'MANAGEMENT_ADMIN']}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Compiling executive analytics...</p>
        </div>
      </RoleGuard>
    );
  }

  if (error || !data) {
    return (
      <RoleGuard allowedRoles={['SENIOR_MANAGER', 'MANAGEMENT_ADMIN']}>
        <div className="p-8 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-center max-w-xl mx-auto mt-10">
          <h3 className="text-xl font-bold mb-2">Analytics Unavailable</h3>
          <p className="text-sm">We could not load the executive metrics. Please try again later.</p>
        </div>
      </RoleGuard>
    );
  }

  const { kpi } = data;

  const kpiCards = [
    { title: 'Total Candidates', value: kpi.totalCandidates, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { title: 'Completed Interviews', value: kpi.completedInterviews, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'Under Review', value: kpi.underReview, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'Shortlisted', value: kpi.shortlisted, icon: UserCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'Selected (Hired)', value: kpi.selected, icon: Trophy, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Rejected', value: kpi.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
    
    { title: 'Interview Completion Rate', value: `${kpi.interviewCompletionRate}%`, icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { title: 'Selection Rate', value: `${kpi.selectionRate}%`, icon: Percent, color: 'text-pink-500', bg: 'bg-pink-50' },
    
    { title: 'Avg Technical Score', value: `${kpi.averageTechnicalScore} / 100`, icon: Code, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    { title: 'Avg Communication', value: `${kpi.averageCommunicationScore} / 100`, icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-50' },
    { title: 'Avg Problem Solving', value: `${kpi.averageProblemSolvingScore} / 100`, icon: BrainCircuit, color: 'text-violet-500', bg: 'bg-violet-50' },
  ];

  return (
    <RoleGuard allowedRoles={['SENIOR_MANAGER', 'MANAGEMENT_ADMIN']}>
      <ErrorBoundary>
        <div className="space-y-8 font-sans pb-10">
          
          <div className="border-b border-slate-200 dark:border-zinc-800 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-100">
              Executive Analytics Dashboard
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 mt-2">
              High-level organizational visibility into recruitment performance, AI outcomes, and pipeline efficiency.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Key Performance Indicators
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {kpiCards.map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border border-slate-200/80 shadow-sm overflow-hidden h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl ${card.bg}`}>
                            <Icon className={`w-5 h-5 ${card.color}`} />
                          </div>
                        </div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                          {card.value}
                        </div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">
                          {card.title}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
          
          {/* Module 2: Hiring Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <Card className="border border-slate-200/80 shadow-sm col-span-1">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-zinc-200">
                  Hiring Funnel
                </CardTitle>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Candidate drop-off across the recruitment pipeline.
                </p>
              </CardHeader>
              <CardContent className="h-80 w-full flex items-center justify-center">
                {data.funnel && data.funnel.length > 0 && data.funnel[0].value > 0 ? (
                  <div className="w-full h-full relative">
                    {/* Using a custom composed bar chart to mimic a funnel perfectly in Tailwind/Recharts */}
                    <div className="flex flex-col h-full justify-between py-4">
                      {data.funnel.map((step: any, index: number) => {
                        const maxVal = data.funnel[0].value || 1;
                        const percentage = Math.max(10, (step.value / maxVal) * 100);
                        const colors = [
                          'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 
                          'bg-purple-500', 'bg-fuchsia-500', 'bg-emerald-500', 'bg-rose-500'
                        ];
                        
                        return (
                          <div key={step.name} className="flex items-center justify-center relative w-full group">
                            {/* Label left */}
                            <div className="absolute left-0 w-32 text-right pr-4 text-xs font-semibold text-slate-600 dark:text-zinc-400 z-10">
                              {step.name}
                            </div>
                            
                            {/* Funnel Bar */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, delay: index * 0.1 }}
                              className={`h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm ${colors[index % colors.length]}`}
                            >
                              {step.value}
                            </motion.div>
                            
                            {/* Conversion right */}
                            <div className="absolute right-0 w-16 text-left pl-4 text-xs text-slate-400 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              {Math.round((step.value / maxVal) * 100)}%
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">Not enough funnel data to display.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 shadow-sm col-span-1 border-dashed bg-slate-50 flex items-center justify-center text-slate-400">
              <p>Future Modules (Recommendation Analytics, etc.) will render here.</p>
            </Card>
          </div>
        </div>
      </ErrorBoundary>
    </RoleGuard>
  );
}
