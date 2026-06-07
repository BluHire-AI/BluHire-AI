'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCandidateScorecard } from '@/services/candidate.service';
import { motion } from 'framer-motion';
import { Code, MessageSquare, BrainCircuit, CheckSquare, TrendingUp, AlertCircle } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center h-64 w-full text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mb-3" />
        <h3 className="text-lg font-semibold text-slate-700">Evaluation in Progress</h3>
        <p className="text-sm mt-1 max-w-sm">
          The AI scorecard for this candidate is either still being generated or is currently unavailable. Please check back later.
        </p>
      </div>
    );
  }

  // Safe fallbacks for partial evaluations
  const overallScore = Math.round(scorecard?.overallScore ?? 0);
  
  // Provide color coding based on score thresholds
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const metrics = [
    { label: 'Technical', score: scorecard?.technicalScore ?? 0, weight: '40%', icon: <Code className="w-5 h-5 text-blue-500" /> },
    { label: 'Communication', score: scorecard?.communicationScore ?? 0, weight: '25%', icon: <MessageSquare className="w-5 h-5 text-indigo-500" /> },
    { label: 'Problem Solving', score: scorecard?.problemSolvingScore ?? 0, weight: '25%', icon: <BrainCircuit className="w-5 h-5 text-purple-500" /> },
    { label: 'Completeness', score: scorecard?.completenessScore ?? 0, weight: '10%', icon: <CheckSquare className="w-5 h-5 text-slate-500" /> },
  ];

  return (
    <div className="w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm font-sans space-y-8">
      
      {/* Top Banner - Overall Score */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="flex items-center space-x-6">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Circular Progress */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="45" fill="none" 
                stroke={overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="8" strokeLinecap="round"
                initial={{ strokeDasharray: '283', strokeDashoffset: '283' }}
                animate={{ strokeDashoffset: 283 - (283 * overallScore) / 100 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </svg>
            <span className="text-3xl font-bold text-slate-900">{overallScore}</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-slate-400" /> Overall AI Score
            </h2>
            <p className="text-slate-500 mt-1">Weighted average of all evaluation metrics</p>
          </div>
        </div>

        {/* AI Recommendation Badge */}
        <div className="mt-6 md:mt-0 flex flex-col items-center md:items-end">
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Final Recommendation</span>
          <div className={`px-6 py-3 rounded-xl border text-lg font-bold shadow-sm ${
            scorecard.recommendation === 'HIRE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            scorecard.recommendation === 'MAYBE_HIRE' ? 'bg-amber-50 text-amber-700 border-amber-200' :
            scorecard.recommendation === 'REJECT' ? 'bg-red-50 text-red-700 border-red-200' :
            overallScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
            overallScore >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
            'bg-slate-50 text-slate-500 border-slate-200'
          }`}>
            {scorecard.recommendation || (overallScore >= 80 ? 'HIRE' : overallScore >= 60 ? 'MAYBE HIRE' : 'PENDING')}
          </div>
          {scorecard.confidence != null && (
            <p className="text-xs text-slate-400 mt-1">Confidence: {Math.round(scorecard.confidence * 100)}%</p>
          )}
        </div>
      </div>

      {/* Breakdowns */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-6 border-b pb-2">Metric Breakdown</h3>
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
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  {m.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{m.label}</h4>
                  <p className="text-xs text-slate-400">Weight: {m.weight}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 px-4">
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
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
                <span className={`inline-block px-3 py-1 rounded-md font-bold text-sm border ${getScoreColor(Math.round(m.score))}`}>
                  {Math.round(m.score)} / 100
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* AI Reasoning */}
      {scorecard.reasoning && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">AI Evaluator Feedback</h3>
          <div className="space-y-2">
            {scorecard.reasoning.split(' | ').map((line: string, i: number) => (
              <p key={i} className="text-sm text-slate-600 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}
      
    </div>
  );
};
