'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, Eye, UserX, Users, 
  ExternalLink, Copy, Camera, AlertCircle, Clock 
} from 'lucide-react';

interface RecruiterProctoringReportProps {
  sessionId: string;
}

export const RecruiterProctoringReport: React.FC<RecruiterProctoringReportProps> = ({ sessionId }) => {
  const { data: proctoringData, isLoading, error } = useQuery({
    queryKey: ['proctoring-data', sessionId],
    queryFn: async () => {
      const res = await api.get(`/interviews/${sessionId}/proctoring`);
      return res.data.data;
    },
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !proctoringData) {
    return (
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-zinc-400 text-sm">
        <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
        <p>No proctoring session events recorded yet.</p>
      </div>
    );
  }

  const { riskScore = 0, riskLevel = 'LOW', summary = {}, events = [] } = proctoringData;

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'MODERATE':
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms || ms <= 0) return 'Instant';
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="w-full bg-card dark:bg-card/80 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-border dark:border-white/10 shadow-lg space-y-6 font-sans">
      {/* Top Banner: Proctoring Risk Overview */}
      <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-muted/40 dark:bg-white/[0.03] rounded-2xl border border-border dark:border-white/10 gap-6">
        <div className="flex items-center space-x-6">
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-white/10" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="45" fill="none" 
                stroke={riskScore > 75 ? '#ef4444' : riskScore > 50 ? '#f97316' : riskScore > 20 ? '#eab308' : '#10b981'} 
                strokeWidth="8" strokeLinecap="round"
                initial={{ strokeDasharray: '283', strokeDashoffset: '283' }}
                animate={{ strokeDashoffset: 283 - (283 * riskScore) / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <span className="text-2xl font-extrabold text-white">{riskScore}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">AI Proctoring Integrity Review</h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Automated behavioral proctoring signals captured during session
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">Assessed Risk Level</span>
          <div className={`px-5 py-2.5 rounded-xl border text-sm font-extrabold uppercase tracking-wide flex items-center gap-2 ${getRiskBadge(riskLevel)}`}>
            {riskLevel === 'LOW' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span>{riskLevel} RISK</span>
          </div>
        </div>
      </div>

      {/* Proctoring Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <Eye className="w-4 h-4 text-amber-400" /> Gaze Deviations
          </div>
          <p className="text-xl font-extrabold text-white">{summary.gazeAwayCount || 0}</p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <UserX className="w-4 h-4 text-rose-400" /> Face Absence
          </div>
          <p className="text-xl font-extrabold text-white">{summary.faceMissingCount || 0}</p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <Users className="w-4 h-4 text-purple-400" /> Multiple Faces
          </div>
          <p className="text-xl font-extrabold text-white">{summary.multipleFaceCount || 0}</p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-medium">
            <ExternalLink className="w-4 h-4 text-indigo-400" /> Tab / Window Switches
          </div>
          <p className="text-xl font-extrabold text-white">{(summary.tabSwitchCount || 0) + (summary.windowBlurCount || 0)}</p>
        </div>
      </div>

      {/* Chronological Event Timeline */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" /> Session Event Timeline ({events.length})
        </h4>

        {events.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 text-center text-xs text-zinc-400">
            No proctoring warnings or violations recorded during this interview.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {events.map((evt: any, idx: number) => {
              const data = evt.eventData || {};
              const timeStr = new Date(evt.timestamp).toLocaleTimeString();
              const evtType = evt.eventType || data.type || 'EVENT';
              const duration = data.durationMs || 0;

              return (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-zinc-400 text-[11px]">{timeStr}</span>
                    <span className="px-2.5 py-1 rounded-md bg-white/10 font-mono font-bold text-purple-300">
                      {evtType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-zinc-400 font-mono">{formatDuration(duration)}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      data.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                      data.severity === 'high' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-purple-500/20 text-purple-300'
                    }`}>
                      {data.severity || 'warning'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
