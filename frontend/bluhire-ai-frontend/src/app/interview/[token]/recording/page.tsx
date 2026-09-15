'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InterviewRoom } from '@/components/interview/InterviewRoom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Building } from 'lucide-react';
import StarField from '@/components/StarField';

export default function InterviewRecordingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch Session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await api.get(`/interviews/public/${token}`);
        setSession(response.data.data);
      } catch (err: any) {
        toast.error('Invalid or expired interview link.');
        router.push(`/interview/${token}`);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchSession();
  }, [token, router]);

  const handleComplete = async (blobs: Blob[]) => {
    try {
      console.log(`[InterviewRecordingPage] Interview complete. Total blobs captured: ${blobs.length}`);
      await api.post(`/interviews/public/${token}/submit`);
      console.log('[DEBUG_AUDIT] Submitting session and pushing to success page:', { token, totalBlobs: blobs.length });
      router.push(`/interview/${token}/success`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit interview.');
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
          <p className="text-sm font-semibold tracking-wide text-zinc-300">Preparing AI Interview Console...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <InterviewRoom sessionId={token} onComplete={handleComplete} />
  );
}
