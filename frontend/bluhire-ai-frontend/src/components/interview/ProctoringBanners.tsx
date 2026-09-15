'use client';

import React from 'react';
import { ProctoringStateStatus } from '@/types/proctoring';
import { ShieldCheck, AlertTriangle, ShieldAlert, ShieldX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProctoringHeaderBadgeProps {
  status: ProctoringStateStatus;
}

export const ProctoringHeaderBadge: React.FC<ProctoringHeaderBadgeProps> = ({ status }) => {
  let badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
  let dotColor = 'bg-emerald-400';
  let label = 'PROCTORING ACTIVE';

  if (status === 'WARNING') {
    badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/25';
    dotColor = 'bg-amber-400 animate-pulse';
    label = 'PROCTORING WARNING';
  } else if (status === 'INTERRUPTED') {
    badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/25';
    dotColor = 'bg-rose-400 animate-ping';
    label = 'PROCTORING INTERRUPTED';
  } else if (status === 'UNAVAILABLE') {
    badgeColor = 'text-zinc-400 bg-zinc-500/10 border-zinc-500/25';
    dotColor = 'bg-zinc-400';
    label = 'PROCTORING UNAVAILABLE';
  }

  return (
    <div className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full border text-[11px] font-mono font-bold tracking-wider uppercase transition-colors ${badgeColor}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </div>
  );
};

interface ProctoringWarningBannerProps {
  warningMessage: string | null;
}

export const ProctoringWarningBanner: React.FC<ProctoringWarningBannerProps> = ({ warningMessage }) => {
  if (!warningMessage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[92%] sm:w-auto bg-[#0f111f]/90 border border-amber-500/40 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-[0_8px_30px_rgba(245,158,11,0.25)] flex items-center gap-3 text-xs font-semibold text-amber-200 pointer-events-none"
      >
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
        <span className="truncate">{warningMessage}</span>
      </motion.div>
    </AnimatePresence>
  );
};
