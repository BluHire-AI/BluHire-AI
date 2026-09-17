'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCandidateReport, getCandidateScorecard } from '@/services/candidate.service';
import { FileText, AlertCircle, CheckCircle2, TrendingUp, Sparkles, BrainCircuit } from 'lucide-react';

interface DetailedReportTabProps {
  candidateId: string;
}

export const DetailedReportTab: React.FC<DetailedReportTabProps> = ({ candidateId }) => {
  const { data: report, isLoading: isReportLoading } = useQuery({
    queryKey: ['candidate-report', candidateId],
    queryFn: () => getCandidateReport(candidateId),
    enabled: !!candidateId,
  });

  const { data: scorecard, isLoading: isScorecardLoading } = useQuery({
    queryKey: ['candidate-scorecard', candidateId],
    queryFn: () => getCandidateScorecard(candidateId),
    enabled: !!candidateId,
  });

  if (isReportLoading || isScorecardLoading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const isZeroAnswer =
    scorecard?.reasonCode === 'NO_SUBSTANTIVE_RESPONSES' ||
    (scorecard?.completenessScore === 0 && (scorecard?.answeredCount ?? 0) === 0);

  if (isZeroAnswer || !report) {
    return (
      <div className="w-full bg-card dark:bg-card/80 backdrop-blur-md rounded-2xl p-8 border border-border dark:border-white/10 shadow-lg space-y-6 font-sans">
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-3">
          <div className="flex items-center gap-2.5 font-bold text-base text-amber-400">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span>Detailed Interview Report — Insufficient Responses</span>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed max-w-2xl">
            Candidate completed the interview session but provided no substantive responses. All interview questions were skipped. Detailed technical, communication, and problem-solving report analysis cannot be generated without actual candidate interview responses.
          </p>
          <div className="flex items-center gap-4 text-xs font-mono pt-2 text-amber-300/80 border-t border-amber-500/20">
            <span>Questions Asked: {scorecard?.totalQuestions ?? 5}</span>
            <span>Substantive Answers: 0</span>
            <span>Skipped: {scorecard?.totalQuestions ?? 5}</span>
            <span>Answer Completeness: 0%</span>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/60 dark:border-white/10 space-y-2">
          <h4 className="text-xs font-bold text-foreground dark:text-white uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Evaluation Summary
          </h4>
          <p className="text-xs text-muted-foreground dark:text-zinc-300 leading-relaxed">
            {scorecard?.reasoning || 'Interview session completed with 0 substantive responses. No candidate answer data was available for report synthesis.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-card dark:bg-card/80 backdrop-blur-md rounded-2xl p-8 border border-border dark:border-white/10 shadow-lg space-y-8 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-border dark:border-white/10">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground dark:text-white">AI Comprehensive Interview Report</h2>
            <p className="text-xs text-muted-foreground dark:text-zinc-400">Automated transcript synthesis and evaluation feedback</p>
          </div>
        </div>
        {report.finalRecommendation && (
          <span className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
            Recommendation: {report.finalRecommendation}
          </span>
        )}
      </div>

      {/* Candidate Summary Paragraph */}
      {report.candidateSummary && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-zinc-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" /> Executive Candidate Summary
          </h3>
          <div className="p-5 rounded-xl bg-muted/30 dark:bg-white/[0.02] border border-border dark:border-white/10 text-xs text-foreground/90 dark:text-zinc-200 leading-relaxed">
            {report.candidateSummary}
          </div>
        </div>
      )}

      {/* Key Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Evaluated Key Strengths
          </h4>
          <div className="p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 space-y-2">
            {report.strengths && report.strengths.length > 0 ? (
              report.strengths.map((str: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                  <span className="font-bold">•</span>
                  <span>{str}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No distinct strengths identified from transcript.</p>
            )}
          </div>
        </div>

        {/* Weaknesses / Growth Areas */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Areas for Improvement
          </h4>
          <div className="p-4 rounded-xl bg-amber-500/[0.04] border border-amber-500/20 space-y-2">
            {report.weaknesses && report.weaknesses.length > 0 ? (
              report.weaknesses.map((w: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-bold">•</span>
                  <span>{w}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No major risk areas flagged.</p>
            )}
          </div>
        </div>
      </div>

      {/* Categorized Feedback */}
      {(report.technicalFeedback || report.communicationFeedback) && (
        <div className="space-y-4 pt-2 border-t border-border dark:border-white/10">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-zinc-300">
            Categorized Evaluator Notes
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {report.technicalFeedback && (
              <div className="p-4 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border dark:border-white/10 space-y-1">
                <span className="font-bold text-foreground dark:text-white block text-[11px] uppercase tracking-wider text-blue-400">Technical Depth</span>
                <p className="text-muted-foreground dark:text-zinc-300 leading-relaxed">{report.technicalFeedback}</p>
              </div>
            )}
            {report.communicationFeedback && (
              <div className="p-4 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border dark:border-white/10 space-y-1">
                <span className="font-bold text-foreground dark:text-white block text-[11px] uppercase tracking-wider text-indigo-400">Communication & Clarity</span>
                <p className="text-muted-foreground dark:text-zinc-300 leading-relaxed">{report.communicationFeedback}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
