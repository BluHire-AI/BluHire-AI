'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { InterviewRoom } from '@/components/interview/InterviewRoom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
      // Per-question uploads are handled inside InterviewRoom.
      // Here we just finalize the session.
      await api.post(`/interviews/public/${token}/submit`);
      console.log('[DEBUG_AUDIT] Submitting session and pushing to success page:', { token, totalBlobs: blobs.length });
      router.push(`/interview/${token}/success`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit interview.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Preparing AI Interview Environment...</p>
      </div>
    );
  }

  if (!session) return null;

  return (
    <InterviewRoom sessionId={token} onComplete={handleComplete} />
  );
}
