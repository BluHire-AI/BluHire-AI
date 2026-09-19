'use client';

import React from 'react';
import { Building } from 'lucide-react';
import { BluHireBackground } from '@/components/layout/BluHireBackground';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BluHireBackground showConstellation={true} className="flex min-h-screen">
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-auto">
        {/* Canonical Brand Header */}
        <div className="flex flex-col items-center mb-6 sm:mb-8 text-center select-none">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-3.5 shadow-md dark:shadow-[0_0_20px_rgba(139,92,246,0.25)]">
            <Building className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl sm:text-3xl tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-violet-400 dark:via-indigo-300 dark:to-[#8B5CF6] bg-clip-text text-transparent">
            BluHire-AI
          </span>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ENTERPRISE WORKFORCE & HRMS
          </div>
        </div>

        {/* Centered Auth Card Container */}
        <div className="w-full max-w-md mx-auto">
          {children}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-muted-foreground/70 dark:text-zinc-500 flex items-center justify-center gap-2 font-mono">
          <span>&copy; {new Date().getFullYear()} BluHire-AI</span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </span>
        </div>
      </div>
    </BluHireBackground>
  );
}
