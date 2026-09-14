'use client';

import React from 'react';
import { X, UserCheck, UserX, Briefcase, Building, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Application } from '@/services/recruitment.service';

const ACTIVE_STAGES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'] as const;

interface CandidateHeaderProps {
  application: Application;
  onClose: () => void;
  onStageChange: (appId: string, newStage: string) => void;
  onReject: (appId: string) => void;
  onHire: (appId: string) => void;
  submittingStage: boolean;
  getStageBadgeColor: (stage: string) => string;
}

export function CandidateHeader({
  application,
  onClose,
  onStageChange,
  onReject,
  onHire,
  submittingStage,
  getStageBadgeColor,
}: CandidateHeaderProps) {
  const candidate = application.candidateId;
  const firstName = candidate?.firstName || '';
  const lastName = candidate?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Candidate Profile';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'CP';

  const jobTitle = application.jobId?.title || 'Job Target';
  const departmentName = application.jobId?.departmentId?.name || 'General Recruitment';
  const isFinalized = application.currentStage === 'HIRED' || application.currentStage === 'REJECTED';

  return (
    <div className="p-5 border-b border-border/70 dark:border-white/10 bg-card/80 dark:bg-[#0f101a] shrink-0">
      {/* Top Row: Avatar, Name, Metadata, Close Button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Avatar with Initials */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm ring-2 ring-primary/20 shrink-0 select-none">
            {initials}
          </div>

          <div className="min-w-0 space-y-1">
            {/* Candidate Name & Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-foreground dark:text-white tracking-tight truncate">
                {fullName}
              </h2>
              <span
                className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStageBadgeColor(
                  application.currentStage
                )}`}
              >
                {application.currentStage}
              </span>
              {candidate?.candidateCode && (
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 dark:bg-white/[0.04] px-1.5 py-0.5 rounded border border-border/50 dark:border-white/[0.06]">
                  {candidate.candidateCode}
                </span>
              )}
            </div>

            {/* Secondary Metadata: Job & Department */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80 dark:text-zinc-350">
                <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                {jobTitle}
              </span>
              <span className="text-border dark:text-white/20">•</span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Building className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                {departmentName}
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <Button
          onClick={onClose}
          size="icon"
          variant="ghost"
          className="w-8 h-8 rounded-xl hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          title="Close Drawer"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Action Toolbar: Stage Dropdown, Reject, Hire */}
      {!isFinalized && (
        <div className="mt-4 pt-3.5 border-t border-border/50 dark:border-white/[0.06] flex items-center justify-between gap-3 flex-wrap">
          {/* Stage Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Stage:
            </span>
            <Select
              value={application.currentStage}
              onValueChange={(newStage: string) => {
                if (newStage === 'HIRED') {
                  onHire(application._id);
                } else {
                  onStageChange(application._id, newStage);
                }
              }}
              disabled={submittingStage}
            >
              <SelectTrigger className="bg-card dark:bg-white/[0.04] text-xs font-semibold px-2.5 h-8 w-36 rounded-xl border border-border dark:border-white/10 text-foreground dark:text-zinc-200">
                <SelectValue placeholder="Advance stage..." />
              </SelectTrigger>
              <SelectContent>
                {ACTIVE_STAGES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs font-semibold">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Decision Buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <Button
              onClick={() => onReject(application._id)}
              variant="outline"
              size="sm"
              disabled={submittingStage}
              className="h-8 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-xl transition-colors gap-1"
            >
              <UserX className="w-3.5 h-3.5" />
              Reject
            </Button>
            <Button
              onClick={() => onHire(application._id)}
              size="sm"
              disabled={submittingStage}
              className="h-8 px-3.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-xl shadow-xs transition-colors gap-1"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Hire Candidate
            </Button>
          </div>
        </div>
      )}

      {/* If already finalized */}
      {isFinalized && (
        <div className="mt-3 pt-2.5 border-t border-border/50 dark:border-white/[0.06] flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Application Status:</span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${getStageBadgeColor(
              application.currentStage
            )}`}
          >
            {application.currentStage === 'HIRED' ? 'Candidate Onboarded (Hired)' : 'Application Archived (Rejected)'}
          </span>
        </div>
      )}
    </div>
  );
}
