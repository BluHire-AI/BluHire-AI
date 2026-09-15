'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCandidateScorecard } from '@/services/candidate.service';
import { motion } from 'framer-motion';
import { Code, MessageSquare, BrainCircuit, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react';
import { RecruiterProctoringReport } from './RecruiterProctoringReport';

interface ScorecardTabProps {
  candidateId: string;
}

export const ScorecardTab: React.FC<ScorecardTabProps> = ({ candidateId }) => {
  const { data: scorecard, isLoading, error } = useQuery({
    queryKey: ['candidate-scorecard', candidateId],
    queryFn: () => getCandidateScorecard(candidateId),
    enabled: !!candidateId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full text-zinc-400 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-zinc-500 mb-3" />
        <h3 className="text-lg font-semibold text-white">Evaluation in Progress</h3>
        <p className="text-sm mt-1 max-w-sm text-zinc-400">
          The AI scorecard for this candidate is either still being generated or is currently unavailable. Please check back later.
        </p>
      </div>
    );
  }

  // Safe fallbacks for partial evaluations
  const overallScore = Math.round(scorecard?.overallScore ?? 0);
  
  // Provide color coding based on score thresholds
  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return 'badge-hired';
    if (score >= 60) return 'badge-review';
    return 'badge-rejected';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-[#10B981]';
    if (score >= 60) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  const metrics = [
    { label: 'Technical', score: scorecard?.technicalScore ?? 0, weight: '40%', icon: <Code className="w-5 h-5 text-blue-500 dark:text-blue-400" /> },
    { label: 'Communication', score: scorecard?.communicationScore ?? 0, weight: '25%', icon: <MessageSquare className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> },
    { label: 'Problem Solving', score: scorecard?.problemSolvingScore ?? 0, weight: '25%', icon: <BrainCircuit className="w-5 h-5 text-purple-500 dark:text-purple-400" /> },
    { label: 'Completeness', score: scorecard?.completenessScore ?? 0, weight: '10%', icon: <CheckSquare className="w-5 h-5 text-zinc-500 dark:text-zinc-400" /> },
  ];

  return (
    <div className="w-full bg-card dark:bg-card/80 backdrop-blur-md rounded-2xl p-8 border border-border dark:border-white/10 shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-lg font-sans space-y-8">
      
      {/* Top Banner - Overall Score */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-muted/40 dark:bg-white/[0.03] rounded-2xl border border-border dark:border-white/10">
        <div className="flex items-center space-x-6">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Circular Progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-white/10" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="45" fill="none" 
                stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="8" strokeLinecap="round"
                initial={{ strokeDasharray: '283', strokeDashoffset: '283' }}
                animate={{ strokeDashoffset: 283 - (283 * overallScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <span className="text-3xl font-bold text-foreground dark:text-white">{overallScore}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-muted-foreground dark:text-zinc-400" /> Overall AI Score
            </h2>
            <p className="text-muted-foreground dark:text-zinc-400 mt-1 text-sm">Weighted average of all evaluation metrics</p>
          </div>
        </div>

        {/* AI Recommendation Badge */}
        <div className="mt-6 md:mt-0 flex flex-col items-center md:items-end">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground dark:text-zinc-400 mb-2">Final Recommendation</span>
          <div className={`px-6 py-3 rounded-xl border text-lg font-bold shadow-xs ${
            scorecard.recommendation === 'HIRE' ? 'badge-hired' :
            scorecard.recommendation === 'MAYBE_HIRE' ? 'badge-review' :
            scorecard.recommendation === 'REJECT' ? 'badge-rejected' :
            overallScore >= 80 ? 'badge-hired' :
            overallScore >= 60 ? 'badge-review' :
            'bg-muted text-muted-foreground border-border dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
          }`}>
            {scorecard.recommendation ? scorecard.recommendation.replace(/_/g, ' ') : (overallScore >= 80 ? 'HIRE' : overallScore >= 60 ? 'MAYBE HIRE' : 'PENDING')}
          </div>
          {scorecard.confidence != null && (
            <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1">Confidence: {Math.round(scorecard.confidence * 100)}%</p>
          )}
        </div>
      </div>

      {/* Breakdowns */}
      <div>
        <h3 className="text-lg font-bold text-foreground dark:text-white mb-6 border-b border-border dark:border-white/10 pb-2">Metric Breakdown</h3>
        <div className="space-y-6">
          {metrics.map((m, i) => (
            <motion.div 
              key={m.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4 md:w-1/3">
                <div className="p-3 bg-muted/60 dark:bg-white/[0.04] rounded-xl border border-border dark:border-white/10">
                  {m.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground dark:text-zinc-100">{m.label}</h4>
                  <p className="text-xs text-muted-foreground dark:text-zinc-400">Weight: {m.weight}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 px-4">
                <div className="h-3 w-full bg-muted dark:bg-white/10 border border-border/40 dark:border-transparent rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${m.score}%` }}
                    transition={{ duration: 1, delay: i * 0.1 + 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${getProgressColor(Math.round(m.score))}`}
                  />
                </div>
              </div>

              {/* Score Value */}
              <div className="md:w-24 text-right">
                <span className={`inline-block px-3 py-1 rounded-md font-bold text-sm border ${getScoreBadgeClass(Math.round(m.score))}`}>
                  {Math.round(m.score)} / 100
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Reasoning */}
      {scorecard.reasoning && (
        <div className="bg-[#F8FAFC] dark:bg-white/[0.03] border border-border dark:border-white/10 rounded-xl p-6">
          <h3 className="text-sm font-bold text-foreground dark:text-zinc-300 uppercase tracking-wider mb-3">AI Evaluator Feedback</h3>
          <div className="space-y-2">
            {scorecard.reasoning.split(' | ').map((line: string, i: number) => (
              <p key={i} className="text-sm text-muted-foreground dark:text-zinc-300 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* AI Proctoring & Integrity Review */}
      <RecruiterProctoringReport sessionId={candidateId} />
    </div>
  );
};
