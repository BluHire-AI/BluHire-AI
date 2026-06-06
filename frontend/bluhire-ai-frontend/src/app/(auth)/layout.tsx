import React from 'react';
import { Building, Sparkles } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-transparent text-white relative">
      {/* Left visual branding panel (visible on md screens and up) */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden flex-col justify-between p-12 border-r border-white/10 bg-white/[0.01] z-10">
        {/* Soft decorative ambient glow circles */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#8B5CF6]/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-[#A855F7]/5 rounded-full blur-[90px] pointer-events-none" />
        
        {/* Logo */}
        <div className="flex items-center space-x-3 z-10">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 flex items-center justify-center text-[#8B5CF6] shadow-[0_0_12px_rgba(139,92,246,0.15)]">
            <Building className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            BluHire-AI
          </span>
        </div>

        {/* Big high-contrast quote/brand tag */}
        <div className="z-10 max-w-md my-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#8B5CF6] text-xs font-semibold tracking-wide uppercase select-none">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Powered HRMS SaaS</span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Hire, manage, and scale with intelligent agent loops.
          </h2>
          <p className="text-sm text-white/60 leading-relaxed font-sans">
            Unify ATS tracking, core HR records, automated appraisals, and conversational copilot actions under a single premium space.
          </p>
        </div>

        {/* Footer */}
        <div className="z-10 text-xs text-white/40 flex justify-between">
          <span>&copy; {new Date().getFullYear()} BluHire-AI Inc.</span>
          <span>All systems operational</span>
        </div>
      </div>

      {/* Right form container */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-transparent z-10">
        {/* Soft background ambient glow for mobile */}
        <div className="md:hidden absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-[#8B5CF6]/10 rounded-full blur-[70px] pointer-events-none" />
        
        <div className="w-full max-w-md z-10">
          <div className="md:hidden mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-[#8B5CF6] bg-clip-text text-transparent">BluHire-AI</h1>
            <p className="text-white/60 text-xs mt-2 font-medium">Intelligent HR Management System</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
