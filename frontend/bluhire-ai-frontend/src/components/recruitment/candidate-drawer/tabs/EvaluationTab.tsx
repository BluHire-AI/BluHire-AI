'use client';

import React from 'react';
import { Star, FileEdit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Application } from '@/services/recruitment.service';
import { InfoSection } from '../InfoSection';

interface EvaluationTabProps {
  application: Application;
  recruiterScoreVal: number;
  setRecruiterScoreVal: (val: number) => void;
  recruiterNotesVal: string;
  setRecruiterNotesVal: (val: string) => void;
  onUpdateEvaluation: () => Promise<void>;
  submittingStage: boolean;
}

export function EvaluationTab({
  application,
  recruiterScoreVal,
  setRecruiterScoreVal,
  recruiterNotesVal,
  setRecruiterNotesVal,
  onUpdateEvaluation,
  submittingStage,
}: EvaluationTabProps) {
  return (
    <div className="space-y-6">
      <InfoSection title="Recruiter Evaluation & Internal Rating" icon={Star}>
        <div className="p-4 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/60 dark:border-white/[0.06] space-y-4">
          {/* Star Rating */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Overall Candidate Rating (1–5 Stars)
            </Label>
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRecruiterScoreVal(star)}
                  className="p-1 rounded-lg hover:bg-muted/50 dark:hover:bg-white/10 transition-all active:scale-95 focus:outline-none"
                  title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      star <= recruiterScoreVal
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-muted-foreground/30 hover:text-amber-400/50'
                    }`}
                  />
                </button>
              ))}
              <span className="text-xs font-bold text-foreground dark:text-zinc-200 ml-2">
                {recruiterScoreVal} / 5
              </span>
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recruiter Evaluation Notes
            </Label>
            <textarea
              value={recruiterNotesVal}
              onChange={(e) => setRecruiterNotesVal(e.target.value)}
              placeholder="Record candidate strengths, cultural fit impressions, salary negotiation points, or next steps..."
              rows={4}
              className="w-full bg-card dark:bg-white/[0.03] border border-border dark:border-white/10 rounded-xl p-3 text-xs text-foreground dark:text-white placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed resize-y min-h-[90px]"
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={onUpdateEvaluation}
            disabled={submittingStage}
            className="w-full h-9 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {submittingStage ? 'Saving Notes...' : 'Save Evaluation Notes'}
          </Button>
        </div>
      </InfoSection>
    </div>
  );
}
