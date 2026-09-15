'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  BrainCircuit, Video, AlertCircle, Loader2, ArrowRight, 
  ShieldCheck, Building, HelpCircle, Clock, CheckCircle2, Sparkles 
} from 'lucide-react';
import { api } from '@/lib/api';
import StarField from '@/components/StarField';

export default function PublicInterviewLanding() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await api.get(`/interviews/public/${token}`);
        setSession(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or expired interview link.');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchSession();
    }
  }, [token]);

  const startInterview = async () => {
    try {
      setIsLoading(true);
      await api.post(`/interviews/public/${token}/start`);
      router.push(`/interview/${token}/recording`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start interview.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 overflow-hidden">
        {/* Animated Background */}
        <div className="bg-scene">
          <div className="bg-ambient" />
          <StarField dark={true} />
        </div>

        <div className="relative z-10 flex flex-col items-center space-y-4 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-2xl p-8 rounded-[28px] border border-border dark:border-white/10 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
          <p className="text-sm font-semibold tracking-wide text-zinc-300">Validating secure interview environment...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 overflow-hidden">
        {/* Animated Background */}
        <div className="bg-scene">
          <div className="bg-ambient" />
          <StarField dark={true} />
        </div>

        <div className="relative z-10 w-full max-w-md bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl p-8 rounded-[28px] border border-red-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.5)] text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-rose-500/15 text-rose-400 rounded-2xl border border-rose-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Access Denied</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const candidateName = session.candidate?.firstName || 'Candidate';
  const jobTitle = session.jobId?.title || session.template?.title || 'Open Position';
  const duration = session.template?.durationMinutes || 30;
  const questionCount = session.totalQuestions || 5;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white p-4 sm:p-6 overflow-hidden selection:bg-primary/30 selection:text-white">
      {/* Animated Connected-Node Background */}
      <div className="bg-scene">
        <div className="bg-ambient" />
        <StarField dark={true} />
      </div>

      <div className="relative z-10 w-full max-w-2xl space-y-6 anim-hero">
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
          <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-purple-300 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
            AI Interview Experience
          </span>
        </div>

        {/* Main Glass Card */}
        <div className="bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[28px] shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-full" />
          
          <div className="p-6 sm:p-8 space-y-6">
            {/* AI Avatar Badge & Welcome Header */}
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 border border-white/20 flex items-center justify-center text-white shadow-[0_0_24px_rgba(139,92,246,0.4)] mx-auto">
                <BrainCircuit className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Welcome, {candidateName}!
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-lg mx-auto">
                  You are about to begin your AI-driven video assessment for <span className="text-purple-300 font-semibold">{jobTitle}</span>.
                </p>
              </div>
            </div>

            {/* Security / Proctoring Banner */}
            <div className="bg-indigo-950/40 dark:bg-white/[0.03] border border-indigo-500/20 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 backdrop-blur-md">
              <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">✦ Secure Interview Environment</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  This is a timed, proctored assessment. Ensure camera and microphone permissions are enabled and you are in a quiet environment.
                </p>
              </div>
            </div>

            {/* Metrics Metadata Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-muted/30 dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-xl p-3.5 flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Questions</span>
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">{questionCount} Items</span>
              </div>

              <div className="bg-muted/30 dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-xl p-3.5 flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Est. Duration</span>
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">~{duration} Minutes</span>
              </div>

              <div className="bg-muted/30 dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-xl p-3.5 flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider">Requirements</span>
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">Camera & Mic</span>
              </div>
            </div>

            {/* Start Button CTA */}
            <div className="pt-2">
              <Button
                size="lg"
                onClick={startInterview}
                className="w-full h-14 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-[0_0_30px_rgba(139,92,246,0.35)] transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer border-0"
              >
                <Video className="w-5 h-5" />
                <span>Start Interview</span>
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
