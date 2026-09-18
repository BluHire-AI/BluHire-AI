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

  const isZeroAnswer = scorecard?.reasonCode === 'NO_SUBSTANTIVE_RESPONSES' || (scorecard?.completenessScore === 0 && (scorecard?.answeredCount ?? 0) === 0);
  const overallScore = scorecard?.overallScore != null ? Math.round(scorecard.overallScore) : null;
  
  // Provide color coding based on score thresholds
  const getScoreBadgeClass = (score: number | null) => {
    if (score == null) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (score >= 80) return 'badge-hired';
    if (score >= 60) return 'badge-review';
    return 'badge-rejected';
  };

  const getProgressColor = (score: number | null) => {
    if (score == null) return 'bg-amber-500/40';
    if (score >= 80) return 'bg-[#10B981]';
    if (score >= 60) return 'bg-[#F59E0B]';
    return 'bg-[#EF4444]';
  };

  const metrics = [
    { label: 'Technical', score: scorecard?.technicalScore, weight: '40%', icon: <Code className="w-5 h-5 text-blue-500 dark:text-blue-400" /> },
    { label: 'Communication', score: scorecard?.communicationScore, weight: '25%', icon: <MessageSquare className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> },
    { label: 'Problem Solving', score: scorecard?.problemSolvingScore, weight: '25%', icon: <BrainCircuit className="w-5 h-5 text-purple-500 dark:text-purple-400" /> },
    { label: 'Completeness', score: scorecard?.completenessScore ?? 0, weight: '10%', icon: <CheckSquare className="w-5 h-5 text-zinc-500 dark:text-zinc-400" /> },
  ];

  return (
    <div className="w-full bg-card dark:bg-card/80 backdrop-blur-md rounded-2xl p-8 border border-border dark:border-white/10 shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-lg font-sans space-y-8">
      
      {/* Zero Answer Warning Banner */}
      {isZeroAnswer && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Interview Completed with 0 Substantive Responses</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Candidate completed the interview session but skipped all questions. Technical, communication, and problem-solving ability could not be evaluated.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono pt-1 text-amber-300">
            <span>Asked: {scorecard.totalQuestions ?? 5}</span>
            <span>Answered: {scorecard.answeredCount ?? 0}</span>
            <span>Skipped: {scorecard.skippedCount ?? 0}</span>
            <span>Completeness: 0%</span>
          </div>
        </div>
      )}

      {/* Top Banner - Overall Score */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-muted/40 dark:bg-white/[0.03] rounded-2xl border border-border dark:border-white/10">
        <div className="flex items-center space-x-6">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Circular Progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-white/10" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="45" fill="none" 
                stroke={overallScore == null ? '#f59e0b' : overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="8" strokeLinecap="round"
                initial={{ strokeDasharray: '283', strokeDashoffset: '283' }}
                animate={{ strokeDashoffset: overallScore != null ? 283 - (283 * overallScore) / 100 : 283 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <span className="text-2xl font-bold text-foreground dark:text-white">
              {overallScore != null ? overallScore : 'N/A'}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-muted-foreground dark:text-zinc-400" /> Overall AI Score
            </h2>
            <p className="text-muted-foreground dark:text-zinc-400 mt-1 text-sm">
              {isZeroAnswer ? 'Not Evaluated — Insufficient evidence from interview answers' : 'Weighted average of all evaluation metrics'}
            </p>
          </div>
        </div>

        {/* AI Recommendation Badge */}
        <div className="mt-6 md:mt-0 flex flex-col items-center md:items-end">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground dark:text-zinc-400 mb-2">AI Recommendation</span>
          <div className={`px-6 py-3 rounded-xl border text-lg font-bold shadow-xs ${
            scorecard.recommendation === 'INSUFFICIENT_EVIDENCE' || isZeroAnswer ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' :
            scorecard.recommendation === 'HIRE' ? 'badge-hired' :
            scorecard.recommendation === 'MAYBE_HIRE' ? 'badge-review' :
            scorecard.recommendation === 'REJECT' ? 'badge-rejected' :
            'bg-muted text-muted-foreground border-border dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
          }`}>
            {isZeroAnswer ? 'INSUFFICIENT EVIDENCE' : scorecard.recommendation ? scorecard.recommendation.replace(/_/g, ' ') : 'REQUIRES REVIEW'}
          </div>
          {scorecard.confidence != null && !isZeroAnswer && (
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
                    animate={{ width: `${m.score != null ? m.score : 0}%` }}
                    transition={{ duration: 1, delay: i * 0.1 + 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${getProgressColor(m.score ?? null)}`}
                  />
                </div>
              </div>

              {/* Score Value */}
              <div className="md:w-32 text-right">
                <span className={`inline-block px-3 py-1 rounded-md font-bold text-xs border ${getScoreBadgeClass(m.score ?? null)}`}>
                  {m.score != null ? `${Math.round(m.score)} / 100` : 'NOT EVALUATED'}
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
