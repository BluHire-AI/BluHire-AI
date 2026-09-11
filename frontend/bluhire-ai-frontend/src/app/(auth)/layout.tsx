'use client';

import React from 'react';
import { Building, Sparkles } from 'lucide-react';
import { BluHireBackground } from '@/components/layout/BluHireBackground';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BluHireBackground showConstellation={true} className="flex min-h-screen">
      <div className="min-h-screen w-full flex flex-col md:flex-row relative">
        {/* Left visual branding panel (visible on md screens and up) */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col justify-between p-12 lg:p-16 border-r border-border/80 dark:border-white/10 bg-card/40 dark:bg-[#0e101e]/40 backdrop-blur-2xl z-10">
          {/* Soft decorative ambient glow circles */}
          <div className="absolute top-1/4 left-1/4 w-[380px] h-[380px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[280px] h-[280px] bg-violet-600/10 rounded-full blur-[90px] pointer-events-none" />
          
          {/* Logo Header */}
          <div className="flex items-center space-x-3 z-10">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs dark:shadow-[0_0_16px_rgba(139,92,246,0.25)]">
              <Building className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-violet-400 dark:via-indigo-300 dark:to-[#8B5CF6] bg-clip-text text-transparent">
              BluHire-AI
            </span>
          </div>

          {/* Core Brand Value Statement */}
          <div className="z-10 max-w-md my-auto space-y-5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-wider uppercase select-none">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>AI-POWERED HRMS SAAS</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-foreground dark:text-white">
              Hire, manage, and scale with intelligent agent loops.
            </h2>
            <p className="text-sm text-muted-foreground dark:text-zinc-400 leading-relaxed font-sans">
              Unify candidate pipelines, core workforce records, automated appraisals, and conversational copilot actions under a single enterprise workspace.
            </p>
          </div>

          {/* Footer status indicator */}
          <div className="z-10 text-xs text-muted-foreground/70 dark:text-white/40 flex items-center justify-between font-mono">
            <span>&copy; {new Date().getFullYear()} BluHire-AI HRMS</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </span>
          </div>
        </div>

        {/* Right form container */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-6 sm:p-10 lg:p-12 z-10 my-auto">
          {/* Top Brand Tag for Mobile */}
          <div className="md:hidden mb-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 text-primary mb-3 shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-[#8B5CF6] bg-clip-text text-transparent">
              BluHire-AI
            </h1>
            <p className="text-muted-foreground text-xs mt-1 font-medium">Intelligent HR Management System</p>
          </div>

          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </BluHireBackground>
  );
}

