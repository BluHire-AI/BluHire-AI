'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BrainCircuit, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InterviewSuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <BrainCircuit className="w-8 h-8 text-blue-600" />
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            BluHire <span className="text-blue-600">AI</span>
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="shadow-xl border-slate-200/60 dark:border-zinc-800/60 overflow-hidden text-center">
            <div className="h-2 bg-emerald-500 w-full" />
            
            <CardHeader className="pt-10 pb-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-6"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <CardTitle className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                Interview Completed
              </CardTitle>
              <CardDescription className="text-base text-slate-500 dark:text-zinc-400">
                Thank you for completing your AI assessment.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="px-8 pb-10">
              <p className="text-slate-600 dark:text-slate-300">
                Your responses have been successfully submitted and are currently being processed by our system.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800">
                You may now close this window safely. Our recruitment team will be in touch with you shortly regarding the next steps.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
