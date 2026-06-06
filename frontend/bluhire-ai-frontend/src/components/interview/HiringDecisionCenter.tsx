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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mt-8 font-sans">
      <h3 className="text-lg font-bold text-slate-900 mb-2">Hiring Decision</h3>
      <p className="text-sm text-slate-500 mb-6">Finalize the candidate's application status based on AI evaluations.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* SHORTLIST */}
        <button
          onClick={() => handleAction('SHORTLISTED')}
          disabled={isCurrent('SHORTLISTED') || !!loadingAction}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            isCurrent('SHORTLISTED') 
              ? 'border-purple-500 bg-purple-50 cursor-default' 
              : 'border-slate-100 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer disabled:opacity-50'
          }`}
        >
          {loadingAction === 'SHORTLISTED' ? (
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin mb-2" />
          ) : (
            <Check className={`w-6 h-6 mb-2 ${isCurrent('SHORTLISTED') ? 'text-purple-600' : 'text-slate-400'}`} />
          )}
          <span className={`text-sm font-semibold ${isCurrent('SHORTLISTED') ? 'text-purple-700' : 'text-slate-600'}`}>
            Shortlist
          </span>
        </button>

        {/* SELECT */}
        <button
          onClick={() => handleAction('SELECTED')}
          disabled={isCurrent('SELECTED') || !!loadingAction}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            isCurrent('SELECTED') 
              ? 'border-emerald-500 bg-emerald-50 cursor-default' 
              : 'border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer disabled:opacity-50'
          }`}
        >
          {loadingAction === 'SELECTED' ? (
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
          ) : (
            <UserCheck className={`w-6 h-6 mb-2 ${isCurrent('SELECTED') ? 'text-emerald-600' : 'text-slate-400'}`} />
          )}
          <span className={`text-sm font-semibold ${isCurrent('SELECTED') ? 'text-emerald-700' : 'text-slate-600'}`}>
            Select (Hire)
          </span>
        </button>

        {/* HOLD */}
        <button
          onClick={() => handleAction('UNDER_REVIEW')}
          disabled={isCurrent('UNDER_REVIEW') || !!loadingAction}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            isCurrent('UNDER_REVIEW') 
              ? 'border-amber-500 bg-amber-50 cursor-default' 
              : 'border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 cursor-pointer disabled:opacity-50'
          }`}
        >
          {loadingAction === 'UNDER_REVIEW' ? (
            <Loader2 className="w-6 h-6 text-amber-500 animate-spin mb-2" />
          ) : (
            <Clock className={`w-6 h-6 mb-2 ${isCurrent('UNDER_REVIEW') ? 'text-amber-600' : 'text-slate-400'}`} />
          )}
          <span className={`text-sm font-semibold ${isCurrent('UNDER_REVIEW') ? 'text-amber-700' : 'text-slate-600'}`}>
            Keep on Hold
          </span>
        </button>

        {/* REJECT */}
        <button
          onClick={() => handleAction('REJECTED')}
          disabled={isCurrent('REJECTED') || !!loadingAction}
          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
            isCurrent('REJECTED') 
              ? 'border-red-500 bg-red-50 cursor-default' 
              : 'border-slate-100 hover:border-red-300 hover:bg-red-50/50 cursor-pointer disabled:opacity-50'
          }`}
        >
          {loadingAction === 'REJECTED' ? (
            <Loader2 className="w-6 h-6 text-red-500 animate-spin mb-2" />
          ) : (
            <X className={`w-6 h-6 mb-2 ${isCurrent('REJECTED') ? 'text-red-600' : 'text-slate-400'}`} />
          )}
          <span className={`text-sm font-semibold ${isCurrent('REJECTED') ? 'text-red-700' : 'text-slate-600'}`}>
            Reject
          </span>
        </button>

      </div>
    </div>
  );
};
