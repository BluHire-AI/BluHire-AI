'use client';

import React from 'react';
import { Sparkles, AlertCircle, RefreshCw, CheckCircle2, Zap, UserCheck, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Application } from '@/services/recruitment.service';
import { InfoSection } from '../InfoSection';

interface AiAnalysisTabProps {
  application: Application;
  onTriggerScreening: (appId: string) => void;
  submittingStage: boolean;
}

export function AiAnalysisTab({
  application,
  onTriggerScreening,
  submittingStage,
}: AiAnalysisTabProps) {
  const status = application.screeningStatus || 'PENDING';
  const isProcessing = status === 'PROCESSING';
  const isPending = status === 'PENDING';
  const isFailed = status === 'FAILED';

  const getActionableErrorMessage = (notes: string) => {
    if (!notes) {
      return {
        title: 'AI Sourcing Match Failed',
        desc: 'An error occurred during resume text processing or LLM evaluation.',
        action: 'Please check your network connection and try running the analysis again.',
      };
    }
    const lowerNotes = notes.toLowerCase();
    if (
      lowerNotes.includes('unauthorized') ||
      lowerNotes.includes('authentication') ||
      lowerNotes.includes('401')
    ) {
      return {
        title: 'Authentication Error',
        desc: 'The AI screening request could not be authenticated. Please renew your session.',
        action: 'Contact system administrators if access issues persist.',
      };
    }
    if (
      lowerNotes.includes('offline') ||
      lowerNotes.includes('fetch failed') ||
      lowerNotes.includes('connection refused') ||
      lowerNotes.includes('econnrefused') ||
      lowerNotes.includes('503') ||
      lowerNotes.includes('service offline')
    ) {
      return {
        title: 'AI Service Offline',
        desc: 'The background AI parsing microservice is currently offline or unreachable.',
        action: 'Please verify that the FastAPI server is running on port 8000.',
      };
    }
    if (
      lowerNotes.includes('api key') ||
      lowerNotes.includes('missing api key') ||
      lowerNotes.includes('your_openrouter_api_key_here')
    ) {
      return {
        title: 'Missing API Key',
        desc: 'OpenRouter API Key is missing or set to the default placeholder in environment variables.',
        action: "Please set OPENROUTER_API_KEY inside 'ai-service/.env'.",
      };
    }
    if (
      lowerNotes.includes('rate limit') ||
      lowerNotes.includes('429') ||
      lowerNotes.includes('too many requests')
    ) {
      return {
        title: 'Rate Limit Exceeded',
        desc: 'OpenRouter API rate limits have been exceeded.',
        action: 'Please wait a moment before retrying, or configure a paid model tier.',
      };
    }
    if (
      lowerNotes.includes('openrouter') ||
      lowerNotes.includes('llm') ||
      lowerNotes.includes('choices')
    ) {
      return {
        title: 'OpenRouter Error',
        desc: `The OpenRouter LLM service failed to process the request. Details: ${notes}`,
        action: 'Verify OpenRouter API status or check the model fallback configuration.',
      };
    }
    if (
      lowerNotes.includes('extract') ||
      lowerNotes.includes('parse') ||
      lowerNotes.includes('pdf') ||
      lowerNotes.includes('docx') ||
      lowerNotes.includes('empty')
    ) {
      return {
        title: 'Invalid Resume Document',
        desc: 'The document parser was unable to extract readable text content from the uploaded resume file.',
        action: 'Ensure the file is not password-protected or scanned image-only without OCR text.',
      };
    }
    return {
      title: 'AI Screening Error',
      desc: notes,
      action: 'Please check server logs for detailed traceback information.',
    };
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wide">
            Completed
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Analyzing
          </span>
        );
      case 'FAILED':
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 uppercase tracking-wide">
            Failed
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wide">
            Pending
          </span>
        );
    }
  };

  const screeningScore =
    application.screeningScore !== undefined && application.screeningScore !== null
      ? application.screeningScore
      : application.aiScore || 0;

  // Format AI Summary into readable sentences / bullet items
  const summaryParagraphs = React.useMemo(() => {
    if (!application.screeningSummary) return [];
    return application.screeningSummary
      .split(/\n|(?<=[.!?])\s+(?=[A-Z])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
  }, [application.screeningSummary]);

  const rawRec = application.aiRecommendation || '';
  const needsReview =
    rawRec.toLowerCase().includes('review') ||
    rawRec.toLowerCase().includes('pending') ||
    !rawRec;

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/70 dark:border-white/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-foreground dark:text-white">
            AI Screening Evaluation
          </span>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Pending State */}
      {isPending && (
        <div className="bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/20 p-5 rounded-xl text-center space-y-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
          <p className="font-bold text-xs text-foreground dark:text-white">Queued for AI Screening</p>
          <p className="text-[10px] text-muted-foreground max-w-sm mx-auto">
            The background worker queue is picking up this document. You can also trigger analysis directly below.
          </p>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-primary/[0.04] dark:bg-primary/[0.06] border border-primary/20 p-5 rounded-xl text-center space-y-2.5">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="font-bold text-xs text-foreground dark:text-white">AI Screening in Progress...</p>
          <p className="text-[10px] text-muted-foreground max-w-sm mx-auto">
            Parsing document structure and computing semantic match against job requirements.
          </p>
        </div>
      )}

      {/* Failed State */}
      {isFailed && (() => {
        const errInfo = getActionableErrorMessage(application.notes || '');
        return (
          <div className="bg-rose-500/[0.04] dark:bg-rose-500/[0.08] border border-rose-500/20 p-4 rounded-xl space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs text-rose-600 dark:text-rose-400">{errInfo.title}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{errInfo.desc}</p>
              </div>
            </div>
            <div className="bg-card dark:bg-black/40 border border-border dark:border-white/10 p-2.5 rounded-lg text-[10px] leading-relaxed">
              <span className="font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wider block mb-0.5 text-[9px]">
                Recommended Action:
              </span>
              <span className="text-foreground dark:text-zinc-300 font-medium">{errInfo.action}</span>
            </div>
          </div>
        );
      })()}

      {/* 4 Score Metric Cards with intentional states */}
      {!isPending && !isProcessing && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Screening Match */}
          <div className="p-3 rounded-xl bg-primary/[0.06] border border-primary/20 flex flex-col justify-between space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Screening Match
            </span>
            <div className="text-2xl font-black text-primary my-1">{screeningScore}%</div>
            <span className="text-[9px] text-muted-foreground">Resume parser score</span>
          </div>

          {/* Interview Score */}
          <div className="p-3 rounded-xl bg-violet-500/[0.06] border border-violet-500/20 flex flex-col justify-between space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Interview Score
            </span>
            <div className="my-1">
              {application.interviewScore !== undefined && application.interviewScore !== null ? (
                <span className="text-2xl font-black text-violet-600 dark:text-violet-300">
                  {application.interviewScore}%
                </span>
              ) : (
                <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold bg-muted/60 dark:bg-white/10 text-muted-foreground uppercase">
                  Pending Interview
                </span>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground">Technical assessment</span>
          </div>

          {/* Final Composite */}
          <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 flex flex-col justify-between space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Final Composite
            </span>
            <div className="my-1">
              {application.finalScore !== undefined && application.finalScore !== null ? (
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {application.finalScore}%
                </span>
              ) : (
                <span className="inline-block px-2 py-1 rounded-md text-[10px] font-bold bg-muted/60 dark:bg-white/10 text-muted-foreground uppercase">
                  Awaiting Pipeline
                </span>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground">Weighted score</span>
          </div>

          {/* Sourcing Grade */}
          <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 flex flex-col justify-between space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Sourcing Grade
            </span>
            <div className="my-1">
              {needsReview ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-350 border border-amber-500/30">
                  <UserCheck className="w-3 h-3 shrink-0" />
                  Human Review Required
                </span>
              ) : (
                <span className="text-xs font-bold text-foreground dark:text-white flex items-center gap-1 truncate">
                  <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
                  {rawRec}
                </span>
              )}
            </div>
            <span className="text-[9px] text-muted-foreground">Recommendation tier</span>
          </div>
        </div>
      )}

      {/* Decision Factors & Rejection Reasons Section */}
      {!isPending && !isProcessing && (
        <InfoSection title="Decision Factors & Rejection Reasons" icon={AlertCircle}>
          <div className="p-4 rounded-xl bg-card dark:bg-white/[0.02] border border-border/70 dark:border-white/10 space-y-4">
            
            {/* A. Resume Strengths */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                A. Resume Strengths
              </span>
              {application.matchingSkills && application.matchingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {application.matchingSkills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">General profile alignment recorded.</p>
              )}
            </div>

            {/* B. Resume Concerns & Missing Skills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                B. Resume Concerns & Missing Skills
              </span>
              {application.missingSkills && application.missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {application.missingSkills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                      ⚠ Missing: {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No critical missing skill gaps flagged during resume screening.</p>
              )}
            </div>

            {/* C. Interview Findings */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
                C. Interview Findings
              </span>
              <div className="p-3 rounded-lg bg-muted/40 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.04] text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Interview Assessment Status:</span>
                  <span className="font-bold text-foreground dark:text-white">
                    {application.interviewStatus || (application.interviewScore !== undefined && application.interviewScore !== null ? 'COMPLETED' : 'Pending')}
                  </span>
                </div>
                {application.interviewFeedback ? (
                  <p className="text-xs leading-relaxed text-foreground/90 dark:text-zinc-200 pt-1 border-t border-border/30 dark:border-white/5">
                    {application.interviewFeedback}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    {application.interviewScore === 0 ? 'Interview completed with 0 substantive responses. Technical, communication, and problem-solving ability could not be evaluated.' : 'Interview evaluation details pending assessment panel completion.'}
                  </p>
                )}
              </div>
            </div>

            {/* D. Integrity / Proctoring Findings */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                D. Integrity & Proctoring Findings
              </span>
              <div className="p-2.5 rounded-lg bg-muted/30 dark:bg-white/[0.02] border border-border/40 dark:border-white/[0.04] text-xs">
                <p className="text-[11px] text-muted-foreground">
                  Proctoring monitoring active. Recruiter proctoring logs available in the AI Interview Scorecard tab.
                </p>
              </div>
            </div>

            {/* E. Final Recommendation & Key Decision Factors */}
            <div className="space-y-1.5 pt-1 border-t border-border/40 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground dark:text-white block">
                E. Final Recommendation & Key Decision Factors
              </span>
              <div className={`p-3 rounded-xl border flex flex-col space-y-1 ${
                rawRec === 'REJECT' || application.currentStage === 'REJECTED'
                  ? 'bg-rose-500/[0.06] border-rose-500/20 text-rose-700 dark:text-rose-300'
                  : rawRec === 'HIRE' || application.currentStage === 'HIRED'
                  ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/[0.06] border-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>Recommendation: {rawRec || application.currentStage}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                    Decision Factor
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed font-normal opacity-90">
                  {application.interviewFeedback || application.screeningSummary || 'Evaluated based on overall recruitment pipeline match.'}
                </p>
              </div>
            </div>

          </div>
        </InfoSection>
      )}

      {/* Structured AI Screening Insights Summary */}
      {!isPending && !isProcessing && (
        <InfoSection title="AI Screening Insights" icon={Sparkles}>
          <div className="p-4 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/70 dark:border-white/10 space-y-2">
            {summaryParagraphs.length > 0 ? (
              <div className="space-y-2">
                {summaryParagraphs.map((para, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90 dark:text-zinc-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{para}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Screening insights uncomputed. Run the screening analysis to generate executive summary highlights.
              </p>
            )}
          </div>
        </InfoSection>
      )}

      {/* Run / Re-run Action Button */}
      <div className="pt-1">
        <Button
          onClick={() => onTriggerScreening(application._id)}
          disabled={submittingStage || isProcessing}
          className="w-full h-9 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {status === 'COMPLETED' ? 'Re-run Screening Analysis' : 'Run AI Resume Screening'}
        </Button>
      </div>
    </div>
  );
}
