'use client';

import React from 'react';
import { CheckCircle2, ShieldCheck, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StarField from '@/components/StarField';

export default function InterviewSuccess() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 sm:p-6 overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* Animated Connected-Node Background Scene */}
      <div className="bg-scene">
        <div className="bg-ambient" />
        <StarField dark={true} />
      </div>

      <div className="relative z-10 w-full max-w-xl space-y-6 anim-hero">
        {/* Top Header Branding */}
        <div className="flex flex-col items-center justify-center text-center space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(139,92,246,0.25)]">
              <Building className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-[#8B5CF6] bg-clip-text text-transparent">
              BluHire-AI
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            Assessment Completed
          </span>
        </div>

        {/* Main Success Glass Card */}
        <div className="bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[28px] shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden text-center">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 w-full" />
          
          <div className="p-8 space-y-6">
            {/* Glowing Icon */}
            <div className="mx-auto w-20 h-20 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Interview Completed
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
                Thank you for completing your AI assessment.
              </p>
            </div>

            {/* Next Steps Banner */}
            <div className="bg-muted/30 dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-2xl p-5 text-left flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">What happens next?</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Your recorded responses and AI transcriptions have been saved securely. Our recruitment team will review your performance and reach out to you with the next steps regarding your application.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              className="text-xs text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl"
              onClick={() => window.close()}
            >
              You may now close this browser window safely.
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
