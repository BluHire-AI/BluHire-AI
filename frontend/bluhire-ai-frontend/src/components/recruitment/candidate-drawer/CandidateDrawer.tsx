'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Application } from '@/services/recruitment.service';
import { CandidateHeader } from './CandidateHeader';
import { CandidateTabs, DrawerTabKey } from './CandidateTabs';
import { ProfileTab } from './tabs/ProfileTab';
import { ResumeTab } from './tabs/ResumeTab';
import { SkillsTab } from './tabs/SkillsTab';
import { EducationTab } from './tabs/EducationTab';
import { AiAnalysisTab } from './tabs/AiAnalysisTab';
import { InterviewsTab } from './tabs/InterviewsTab';
import { EvaluationTab } from './tabs/EvaluationTab';
import { TimelineTab } from './tabs/TimelineTab';

interface CandidateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  drawerTab: DrawerTabKey;
  onTabChange: (tab: DrawerTabKey) => void;
  onStageChange: (appId: string, newStage: string) => void;
  onReject: (appId: string) => void;
  onHire: (appId: string) => void;
  onDownloadResume: (fileName?: string) => void;
  onTriggerScreening: (appId: string) => void;
  recruiterScoreVal: number;
  setRecruiterScoreVal: (val: number) => void;
  recruiterNotesVal: string;
  setRecruiterNotesVal: (val: string) => void;
  onUpdateEvaluation: () => Promise<void>;
  submittingStage: boolean;
  formatDate: (date?: string | Date) => string;
  getStageBadgeColor: (stage: string) => string;
}

export function CandidateDrawer({
  isOpen,
  onClose,
  application,
  drawerTab,
  onTabChange,
  onStageChange,
  onReject,
  onHire,
  onDownloadResume,
  onTriggerScreening,
  recruiterScoreVal,
  setRecruiterScoreVal,
  recruiterNotesVal,
  setRecruiterNotesVal,
  onUpdateEvaluation,
  submittingStage,
  formatDate,
  getStageBadgeColor,
}: CandidateDrawerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !application || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
      {/* Subtle Backdrop Overlay: Keeps the underlying ATS pipeline visible */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 dark:bg-black/45 backdrop-blur-[1px] pointer-events-auto transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Right-Side Candidate Workspace Drawer */}
      <aside
        className="fixed top-0 right-0 h-screen max-h-screen w-full sm:w-[560px] md:w-[640px] lg:w-[48vw] xl:w-[45vw] max-w-[780px] min-w-[360px] bg-card dark:bg-[#0c0d15] border-l border-border dark:border-white/10 shadow-2xl pointer-events-auto flex flex-col text-foreground animate-in slide-in-from-right duration-200 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Candidate Details Drawer"
      >
        {/* Fixed Candidate Header */}
        <CandidateHeader
          application={application}
          onClose={onClose}
          onStageChange={onStageChange}
          onReject={onReject}
          onHire={onHire}
          submittingStage={submittingStage}
          getStageBadgeColor={getStageBadgeColor}
        />

        {/* Fixed Tab Navigation with horizontal scrolling and indicators */}
        <CandidateTabs activeTab={drawerTab} onTabChange={onTabChange} />

        {/* Scrollable Tab Contents */}
        <main className="flex-1 min-h-0 overflow-y-auto p-5 text-xs">
          {drawerTab === 'profile' && (
            <ProfileTab application={application} formatDate={formatDate} />
          )}

          {drawerTab === 'resume' && (
            <ResumeTab
              application={application}
              formatDate={formatDate}
              onDownloadResume={onDownloadResume}
            />
          )}

          {drawerTab === 'skills' && <SkillsTab application={application} />}

          {drawerTab === 'education' && <EducationTab application={application} />}

          {drawerTab === 'ai' && (
            <AiAnalysisTab
              application={application}
              onTriggerScreening={onTriggerScreening}
              submittingStage={submittingStage}
            />
          )}

          {drawerTab === 'interviews' && (
            <InterviewsTab application={application} formatDate={formatDate} />
          )}

          {drawerTab === 'evaluation' && (
            <EvaluationTab
              application={application}
              recruiterScoreVal={recruiterScoreVal}
              setRecruiterScoreVal={setRecruiterScoreVal}
              recruiterNotesVal={recruiterNotesVal}
              setRecruiterNotesVal={setRecruiterNotesVal}
              onUpdateEvaluation={onUpdateEvaluation}
              submittingStage={submittingStage}
            />
          )}

          {drawerTab === 'timeline' && (
            <TimelineTab application={application} formatDate={formatDate} />
          )}
        </main>

        {/* Fixed Drawer Footer */}
        <footer className="px-5 py-3 border-t border-border/70 dark:border-white/10 bg-card/60 dark:bg-[#0b0c14] flex items-center justify-between shrink-0 text-xs">
          <div className="text-[10px] text-muted-foreground truncate max-w-[260px]">
            {application.candidateId?.email && (
              <span>Contact: {application.candidateId.email}</span>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-semibold rounded-xl border-border dark:border-white/15 bg-transparent hover:bg-muted dark:hover:bg-white/10 text-foreground dark:text-zinc-200 px-4"
          >
            Close Workspace
          </Button>
        </footer>
      </aside>
    </div>,
    document.body
  );
}
