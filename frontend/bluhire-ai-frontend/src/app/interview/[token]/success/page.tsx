'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InterviewSuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-xl">
        <Card className="shadow-xl border-slate-200/60 dark:border-zinc-800/60 overflow-hidden text-center">
          <div className="h-2 bg-emerald-500 w-full" />
          <CardHeader className="pt-10 pb-6">
            <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
              Interview Submitted Successfully
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400">
              Thank you for taking the time to complete the AI-driven assessment.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 pb-10">
            <div className="bg-slate-100 dark:bg-zinc-900/50 p-5 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-start gap-4 text-left">
              <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">What happens next?</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your recorded responses and AI transcriptions are securely saved and have been sent to the recruitment team. They will review your performance and reach out to you with the next steps regarding your application.
                </p>
              </div>
            </div>

            <Button 
              className="mt-4 text-slate-500 hover:text-slate-800"
              variant="ghost"
              onClick={() => window.close()}
            >
              You may now close this window.
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
