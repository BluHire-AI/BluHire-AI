'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/forgot-password', data);
      
      if (response.data.success) {
        setIsSubmitted(true);
        setSubmittedEmail(data.email);
        toast.success('If an account exists with that email, a 6-digit OTP has been sent.');
        router.push(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err.response?.data?.message || 'Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white">Forgot password</CardTitle>
        <CardDescription className="text-xs text-muted-foreground dark:text-zinc-400">
          Enter your email address and we&apos;ll send you a 6-digit OTP to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-xs text-center font-medium leading-relaxed">
              If an account exists with that email, a 6-digit OTP has been sent. Please check your inbox.
            </div>
            <Button
              onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(submittedEmail)}`)}
              className="w-full h-10.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-xl border-0 shadow-lg shadow-indigo-600/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all duration-200 cursor-pointer"
            >
              Enter OTP Code
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                {...register('email')}
                className={`text-xs h-10.5 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.email ? 'border-destructive/60' : ''}`}
              />
              {errors.email && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-10.5 mt-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-xl border-0 shadow-lg shadow-indigo-600/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all duration-200 cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/80 dark:border-white/10 pt-5 pb-5 bg-muted/20 dark:bg-white/[0.01]">
        <div className="text-xs text-muted-foreground dark:text-zinc-400">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Back to login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

