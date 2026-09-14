'use client';

import React from 'react';
import Link from 'next/link';
import { MessageSquare, Calendar, ExternalLink, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Application } from '@/services/recruitment.service';
import { InfoSection } from '../InfoSection';

interface InterviewsTabProps {
  application: Application;
  formatDate: (date?: string | Date) => string;
}

export function InterviewsTab({ application, formatDate }: InterviewsTabProps) {
  const hasInterviewData = Boolean(
    (application.interviewStatus && application.interviewStatus !== 'Scheduled') ||
      (application.interviewScore !== undefined && application.interviewScore !== null) ||
      application.interviewFeedback ||
      application.interviewCompletedAt
  );

  return (
    <div className="space-y-4">
      <InfoSection title="Interview & Technical Evaluations" icon={MessageSquare}>
        {hasInterviewData ? (
          <div className="p-4 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/70 dark:border-white/10 space-y-3.5">
            {/* Assessment Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-white/[0.04] gap-2 flex-wrap">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Assessment Status
                </span>
                <span className="text-xs font-bold text-foreground dark:text-white mt-0.5 block">
                  {application.interviewStatus || 'Evaluation Recorded'}
                </span>
              </div>

              {application.interviewScore !== undefined && application.interviewScore !== null && (
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Technical Score
                  </span>
                  <span className="text-sm font-black text-amber-500 dark:text-amber-400 block mt-0.5">
                    {application.interviewScore} / 100
                  </span>
                </div>
              )}
            </div>

            {/* Assessment Feedback */}
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block">
                Evaluator Feedback & Assessment Notes
              </span>
              <div className="mt-1.5 p-3 rounded-lg bg-card/60 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.04] text-xs leading-relaxed text-foreground/90 dark:text-zinc-200">
                {application.interviewFeedback || (
                  <span className="text-muted-foreground italic">
                    Feedback evaluation records pending completion of assessment panel notes.
                  </span>
                )}
              </div>
            </div>

            {/* Completion Timestamp & Link */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40 dark:border-white/[0.04] gap-2 flex-wrap text-[10px]">
              {application.interviewCompletedAt ? (
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                  Completed: {formatDate(application.interviewCompletedAt)}
                </span>
              ) : (
                <span className="text-muted-foreground">Status: In Progress / Scheduled</span>
              )}

              <Link href="/dashboard/recruitment/ai-interviews">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-[10px] font-semibold text-primary hover:bg-primary/10 gap-1 px-2"
                >
                  <span>View in AI Interviews</span>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-border dark:border-white/10 rounded-xl bg-card dark:bg-white/[0.02] space-y-3">
            <MessageSquare className="w-9 h-9 text-muted-foreground/60 mx-auto" />
            <div className="space-y-1">
              <p className="font-bold text-xs text-foreground dark:text-white">
                No Interview Conducted Yet
              </p>
              <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                Candidate is currently in the <strong className="text-foreground dark:text-zinc-200">{application.currentStage}</strong> stage. Once an AI or technical interview is launched, assessments and scores will appear here.
              </p>
            </div>
            <div className="pt-1">
              <Link href="/dashboard/recruitment/ai-interviews">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold gap-1.5 border-border dark:border-white/15"
                >
                  <span>Open AI Interviews Center</span>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </InfoSection>
    </div>
  );
}
