'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getCandidateById } from '@/services/candidate.service';
import { User, Calendar, MapPin, Mail, Phone, ChevronLeft, Award } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { ScorecardTab } from '@/components/interview/ScorecardTab';
import { HiringDecisionCenter } from '@/components/interview/HiringDecisionCenter';
import { MediaPlaybackTab } from '@/components/interview/MediaPlaybackTab';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function CandidateDetailPage() {
  const { id } = useParams();
  const candidateId = Array.isArray(id) ? id[0] : id;

  const [activeTab, setActiveTab] = useState<'playback' | 'scorecard' | 'report'>('scorecard');

  const { data: candidateInfo, isLoading, error } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => getCandidateById(candidateId),
    enabled: !!candidateId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !candidateInfo) {
    return (
      <div className="p-8 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center max-w-xl mx-auto mt-10">
        <h3 className="text-xl font-bold mb-2 text-white">Failed to load candidate</h3>
        <p className="text-sm text-zinc-400">We couldn't retrieve the details for this candidate. They may have been removed or the data is incomplete.</p>
        <Link href="/dashboard/recruitment/ai-interviews" className="text-purple-400 hover:underline mt-4 inline-block font-medium">Return to Pipeline</Link>
      </div>
    );
  }

  // Safely extract populated data with fallbacks
  const candidate = candidateInfo.candidateId || {};
  const session = candidateInfo.sessionId || {};
  
  // Safe extraction of nested strings
  const firstName = candidate.firstName ?? 'Unknown';
  const lastName = candidate.lastName ?? '';
  const email = candidate.email ?? 'N/A';
  const initial = firstName.charAt(0) || '?';
  const statusString = (candidateInfo.status || 'PENDING').replace('_', ' ');

  // Safe date parsing
  const dateString = session.startedAt || candidateInfo.createdAt;
  const displayDate = dateString ? new Date(dateString).toLocaleDateString() : 'Unknown Date';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Top Bar Navigation */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/recruitment/ai-interviews" className="p-2 hover:bg-muted dark:hover:bg-white/10 rounded-xl transition-colors border border-border dark:border-transparent dark:hover:border-white/10">
          <ChevronLeft className="h-5 w-5 text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white" />
        </Link>
        <span className="text-sm font-medium text-muted-foreground dark:text-zinc-400">Back to Pipeline</span>
      </div>

      {/* Candidate Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card dark:bg-card/80 backdrop-blur-md border border-border dark:border-white/10 rounded-2xl shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-lg p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 text-primary dark:text-purple-300 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner border-2 border-primary/30 ring-1 ring-border dark:ring-white/10">
            {initial}{lastName.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground dark:text-white">
              {firstName} {lastName}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground dark:text-zinc-400">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-muted-foreground dark:text-zinc-400" /> {email}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-muted-foreground dark:text-zinc-400" /> Interview Date: {displayDate}</span>
            </div>
          </div>
        </div>

        {/* Current Status Badge */}
        <div className="bg-muted/40 dark:bg-white/[0.03] border border-border dark:border-white/10 px-6 py-4 rounded-xl text-center min-w-[200px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-400 mb-1">Application Status</p>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
            candidate.status === 'UNDER_REVIEW' ? 'badge-review' :
            candidate.status === 'SHORTLISTED' ? 'badge-shortlisted' :
            candidate.status === 'SELECTED' ? 'badge-hired' :
            candidate.status === 'REJECTED' ? 'badge-rejected' :
            'bg-muted text-muted-foreground border-border dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
          }`}>
            {candidate.status ? candidate.status.replace(/_/g, ' ') : 'PENDING'}
          </span>
        </div>
      </motion.div>

      {/* Detail View Tabs */}
      <div className="border-b border-border dark:border-white/10">
        <nav className="flex space-x-8" aria-label="Tabs">
          {[
            { id: 'scorecard', label: 'AI Scorecard' },
            { id: 'playback', label: 'Interview Playback' },
            { id: 'report', label: 'Detailed Report' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm transition-colors cursor-pointer
                ${activeTab === tab.id
                  ? 'border-primary text-primary dark:text-purple-400'
                  : 'border-transparent text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white hover:border-border dark:hover:border-zinc-600'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content Area wrapped in Error Boundary */}
      <ErrorBoundary>
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="min-h-[400px]"
        >
          {activeTab === 'scorecard' && <ScorecardTab candidateId={candidateId as string} />}
          {activeTab === 'playback' && <MediaPlaybackTab candidateId={candidateId as string} />}
          {activeTab === 'report' && (
            <div className="bg-card dark:bg-card/80 backdrop-blur-md rounded-2xl border border-dashed border-border dark:border-white/10 flex items-center justify-center text-muted-foreground dark:text-zinc-400 p-12 min-h-[400px]">
              <p className="text-muted-foreground dark:text-zinc-400">Report Viewer Component will render here</p>
            </div>
          )}
        </motion.div>
      </ErrorBoundary>

      {/* Hiring Decision Center wrapped in Error Boundary */}
      <ErrorBoundary>
        <HiringDecisionCenter 
          candidateId={candidateId as string} 
          currentStatus={candidate.status || 'PENDING'} 
        />
      </ErrorBoundary>
    </div>
  );
}
