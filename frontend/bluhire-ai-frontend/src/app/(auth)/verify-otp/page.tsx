'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const verifyOtpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be exactly 6 digits' }).regex(/^\d+$/, 'Must be only numbers'),
});

type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (!email) {
      toast.error('Email is required to verify OTP');
      router.push('/forgot-password');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: '',
    },
  });

  const onSubmit = async (data: VerifyOtpFormValues) => {
    if (!email) return;
    try {
      setIsLoading(true);
      const response = await api.post('/auth/verify-reset-otp', {
        email,
        otp: data.otp,
      });
      
      if (response.data.success) {
        toast.success('OTP Verified Successfully');
        // Redirect to reset-password page with temporary reset token
        router.push(`/reset-password?token=${response.data.data.tempResetToken}`);
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email || resendCooldown > 0 || isResending) return;
    try {
      setIsResending(true);
      await api.post('/auth/forgot-password', { email });
      toast.success('If an account exists, a new 6-digit OTP has been sent.');
      setResendCooldown(60);
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err.response?.data?.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white">Verify OTP</CardTitle>
        <CardDescription className="text-xs text-muted-foreground dark:text-zinc-400">
          Enter the 6-digit OTP sent to <span className="font-semibold text-foreground dark:text-white">{email}</span>. The code expires in <span className="font-semibold text-amber-500">10 minutes</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">One Time Password</Label>
            <Input 
              id="otp" 
              type="text" 
              maxLength={6}
              placeholder="123456" 
              {...register('otp')}
              className={`text-center tracking-[0.5em] text-lg font-bold h-12 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 text-foreground dark:text-white rounded-xl ${errors.otp ? 'border-destructive/60' : ''}`}
            />
            {errors.otp && (
              <p className="text-[11px] text-destructive mt-1 font-medium text-center">{errors.otp.message}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-10.5 mt-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-xl border-0 shadow-lg shadow-indigo-600/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all duration-200 cursor-pointer" 
            disabled={isLoading}
          >
            {isLoading ? 'Verifying OTP...' : 'Verify OTP'}
          </Button>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-muted-foreground">Didn&apos;t receive code?</span>
            <Button
              type="button"
              variant="ghost"
              disabled={resendCooldown > 0 || isResending}
              onClick={handleResendOtp}
              className="text-xs h-auto p-0 text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer"
            >
              {isResending ? 'Sending...' : resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between border-t border-border/80 dark:border-white/10 pt-5 pb-5 bg-muted/20 dark:bg-white/[0.01]">
        <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          &larr; Change email
        </Link>
        <Link href="/login" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
          Back to login
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xl p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-3 py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs text-muted-foreground">Preparing OTP verification...</p>
        </div>
      </Card>
    }>
      <VerifyOtpForm />
    </Suspense>
  );
}

