'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BrainCircuit, Video, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

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
      // Direct candidate to the actual recording interface.
      // We can route them to a specific component or route.
      // For this workflow, let's assume we use /interview/[token]/recording
      router.push(`/interview/${token}/recording`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start interview.');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Validating secure token...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-4">
        <Card className="w-full max-w-md shadow-lg border-red-200 dark:border-red-900/30">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl text-slate-800 dark:text-slate-100">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-slate-600 dark:text-slate-400">
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <BrainCircuit className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            BluHire <span className="text-blue-600">AI</span>
          </span>
        </div>

        <Card className="shadow-xl border-slate-200/60 dark:border-zinc-800/60 overflow-hidden">
          <div className="h-2 bg-blue-600 w-full" />
          <CardHeader className="text-center pt-8 pb-6">
            <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Welcome, {session.candidate?.firstName}!
            </CardTitle>
            <CardDescription className="text-base">
              You are about to begin your AI-driven video interview for the position.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5" />
                Secure Interview Environment
              </h3>
              <p className="text-sm text-blue-700/80 dark:text-blue-400/80">
                This is a timed, proctored assessment. Ensure you are in a quiet room with a stable internet connection. 
                Your camera and microphone will be recorded during the session.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-slate-100 dark:bg-zinc-900 rounded-lg">
                <span className="text-slate-500 block mb-1">Total Questions</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                  {session.totalQuestions}
                </span>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-zinc-900 rounded-lg">
                <span className="text-slate-500 block mb-1">Estimated Time</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 text-lg">
                  {session.template?.durationMinutes || 15} mins
                </span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="px-8 pb-8 pt-4">
            <Button 
              size="lg" 
              className="w-full text-lg h-14 bg-blue-600 hover:bg-blue-700 text-white gap-2"
              onClick={startInterview}
            >
              <Video className="w-5 h-5" />
              Start Interview
              <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
