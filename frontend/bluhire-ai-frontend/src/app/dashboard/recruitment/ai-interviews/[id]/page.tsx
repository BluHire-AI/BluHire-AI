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
      <div className="p-8 text-red-500 bg-red-50 rounded-lg text-center max-w-xl mx-auto mt-10">
        <h3 className="text-xl font-bold mb-2">Failed to load candidate</h3>
        <p className="text-sm">We couldn't retrieve the details for this candidate. They may have been removed or the data is incomplete.</p>
        <Link href="/dashboard/recruitment/ai-interviews" className="text-blue-600 hover:underline mt-4 inline-block font-medium">Return to Pipeline</Link>
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
        <Link href="/dashboard/recruitment/ai-interviews" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ChevronLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <span className="text-sm font-medium text-slate-500">Back to Pipeline</span>
      </div>

      {/* Candidate Profile Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
      >
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold shadow-inner border-4 border-white ring-1 ring-slate-100">
            {initial}{lastName.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {firstName} {lastName}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {email}</span>
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Interview Date: {displayDate}</span>
            </div>
          </div>
        </div>

        {/* Current Status Badge */}
        <div className="bg-slate-50 border border-slate-200 px-6 py-4 rounded-xl text-center min-w-[200px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Application Status</p>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            candidate.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-800' :
            candidate.status === 'SHORTLISTED' ? 'bg-purple-100 text-purple-800' :
            candidate.status === 'SELECTED' ? 'bg-emerald-100 text-emerald-800' :
            candidate.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
            'bg-slate-100 text-slate-800'
          }`}>
            {candidate.status ? candidate.status.replace(/_/g, ' ') : 'PENDING'}
          </span>
        </div>
      </motion.div>

      {/* Detail View Tabs */}
      <div className="border-b border-slate-200">
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
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
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
          className={`min-h-[400px] ${activeTab !== 'scorecard' ? 'bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400' : ''}`}
        >
          {activeTab === 'scorecard' && <ScorecardTab candidateId={candidateId as string} />}
          {activeTab === 'playback' && <MediaPlaybackTab candidateId={candidateId as string} />}
          {activeTab === 'report' && <div className="text-center p-8">Report Viewer Component will render here</div>}
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
