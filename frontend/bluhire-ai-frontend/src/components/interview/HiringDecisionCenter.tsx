'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateCandidateStatus } from '@/services/candidate.service';
import { Check, X, Clock, UserCheck, Loader2 } from 'lucide-react';

interface HiringDecisionCenterProps {
  candidateId: string;
  currentStatus: string | null | undefined;
}

export const HiringDecisionCenter: React.FC<HiringDecisionCenterProps> = ({ candidateId, currentStatus }) => {
  const queryClient = useQueryClient();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (newStatus: string) => updateCandidateStatus(candidateId, newStatus),
    onMutate: (variables) => {
      setLoadingAction(variables);
    },
    onSuccess: () => {
      // Invalidate both the specific candidate and the pipeline
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] });
      queryClient.invalidateQueries({ queryKey: ['ai-interviews-overview'] });
    },
    onSettled: () => {
      setLoadingAction(null);
    }
  });

  const handleAction = (status: string) => {
    mutation.mutate(status);
  };

  const safeStatus = currentStatus ?? 'PENDING';
  const isCurrent = (status: string) => safeStatus === status;

  return (
    <div className="bg-card dark:bg-card/80 backdrop-blur-md rounded-2xl border border-border dark:border-white/10 shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-lg p-6 mt-8 font-sans">
      <h3 className="text-lg font-bold text-foreground dark:text-white mb-2">Hiring Decision</h3>
      <p className="text-sm text-muted-foreground dark:text-zinc-400 mb-6">Finalize the candidate's application status based on AI evaluations.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* SHORTLIST */}
        <button
          onClick={() => handleAction('SHORTLISTED')}
          disabled={isCurrent('SHORTLISTED') || !!loadingAction}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            isCurrent('SHORTLISTED') 
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-purple-500/60 dark:bg-purple-500/15 dark:text-purple-300 cursor-default' 
              : 'border-border bg-card hover:border-indigo-400 hover:bg-indigo-50/50 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-purple-500/40 dark:hover:bg-purple-500/10 dark:text-zinc-300 cursor-pointer disabled:opacity-50 shadow-xs'
          }`}
        >
          {loadingAction === 'SHORTLISTED' ? (
            <Loader2 className="w-6 h-6 text-indigo-600 dark:text-purple-400 animate-spin mb-2" />
          ) : (
            <Check className={`w-6 h-6 mb-2 ${isCurrent('SHORTLISTED') ? 'text-indigo-600 dark:text-purple-400' : 'text-muted-foreground dark:text-zinc-400'}`} />
          )}
          <span className={`text-sm font-semibold ${isCurrent('SHORTLISTED') ? 'text-indigo-700 dark:text-purple-300' : 'text-foreground dark:text-zinc-300'}`}>
            Shortlist
          </span>
        </button>

        {/* SELECT */}
        <button
          onClick={() => handleAction('SELECTED')}
          disabled={isCurrent('SELECTED') || !!loadingAction}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            isCurrent('SELECTED') 
              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-350 cursor-default' 
              : 'border-border bg-card hover:border-emerald-400 hover:bg-emerald-50/50 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10 dark:text-zinc-300 cursor-pointer disabled:opacity-50 shadow-xs'
          }`}
        >
          {loadingAction === 'SELECTED' ? (
            <Loader2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin mb-2" />
          ) : (
            <UserCheck className={`w-6 h-6 mb-2 ${isCurrent('SELECTED') ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground dark:text-zinc-400'}`} />
          )}
          <span className={`text-sm font-semibold ${isCurrent('SELECTED') ? 'text-emerald-700 dark:text-emerald-350' : 'text-foreground dark:text-zinc-300'}`}>
            Select (Hire)
          </span>
        </button>

        {/* HOLD */}
        <button
          onClick={() => handleAction('UNDER_REVIEW')}
          disabled={isCurrent('UNDER_REVIEW') || !!loadingAction}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            isCurrent('UNDER_REVIEW') 
              ? 'border-amber-600 bg-amber-50 text-amber-700 dark:border-amber-500/60 dark:bg-amber-500/15 dark:text-amber-300 cursor-default' 
              : 'border-border bg-card hover:border-amber-400 hover:bg-amber-50/50 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-amber-500/40 dark:hover:bg-amber-500/10 dark:text-zinc-300 cursor-pointer disabled:opacity-50 shadow-xs'
          }`}
        >
          {loadingAction === 'UNDER_REVIEW' ? (
            <Loader2 className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-spin mb-2" />
          ) : (
            <Clock className={`w-6 h-6 mb-2 ${isCurrent('UNDER_REVIEW') ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground dark:text-zinc-400'}`} />
          )}
          <span className={`text-sm font-semibold ${isCurrent('UNDER_REVIEW') ? 'text-amber-700 dark:text-amber-300' : 'text-foreground dark:text-zinc-300'}`}>
            Keep on Hold
          </span>
        </button>

        {/* REJECT */}
        <button
          onClick={() => handleAction('REJECTED')}
          disabled={isCurrent('REJECTED') || !!loadingAction}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            isCurrent('REJECTED') 
              ? 'border-rose-600 bg-rose-50 text-rose-700 dark:border-rose-500/60 dark:bg-rose-500/15 dark:text-rose-350 cursor-default' 
              : 'border-border bg-card hover:border-rose-400 hover:bg-rose-50/50 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:text-zinc-300 cursor-pointer disabled:opacity-50 shadow-xs'
          }`}
        >
          {loadingAction === 'REJECTED' ? (
            <Loader2 className="w-6 h-6 text-rose-600 dark:text-rose-400 animate-spin mb-2" />
          ) : (
            <X className={`w-6 h-6 mb-2 ${isCurrent('REJECTED') ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground dark:text-zinc-400'}`} />
          )}
          <span className={`text-sm font-semibold ${isCurrent('REJECTED') ? 'text-rose-700 dark:text-rose-350' : 'text-foreground dark:text-zinc-300'}`}>
            Reject
          </span>
        </button>

      </div>
    </div>
  );
};
