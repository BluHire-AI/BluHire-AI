'use client';

import React, { useState, Suspense } from 'react';
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

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error('Reset token is missing or invalid.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: data.password,
      });
      
      if (response.data.success) {
        setIsSuccess(true);
        toast.success('Password has been reset successfully');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err.response?.data?.message || 'Failed to reset password. Your verification session may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-destructive/50 to-transparent" />
        <CardHeader className="space-y-1.5 pb-5">
          <CardTitle className="text-xl font-bold tracking-tight text-destructive">Invalid or Expired Session</CardTitle>
          <CardDescription className="text-xs text-muted-foreground dark:text-zinc-400">
            Your password reset verification session is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground dark:text-zinc-400">
            Please request a new OTP to proceed with updating your account credentials.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border/80 dark:border-white/10 pt-5 pb-5 bg-muted/20 dark:bg-white/[0.01]">
          <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
            Request new OTP
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white">Reset password</CardTitle>
        <CardDescription className="text-xs text-muted-foreground dark:text-zinc-400">
          Choose a new password for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-xs text-center font-medium">
            Password has been reset successfully. Redirecting you to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">New Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                {...register('password')}
                className={`text-xs h-10.5 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.password ? 'border-destructive/60' : ''}`}
              />
              {errors.password && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                {...register('confirmPassword')}
                className={`text-xs h-10.5 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.confirmPassword ? 'border-destructive/60' : ''}`}
              />
              {errors.confirmPassword && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-10.5 mt-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-xl border-0 shadow-lg shadow-indigo-600/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all duration-200 cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset password'}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/80 dark:border-white/10 pt-5 pb-5 bg-muted/20 dark:bg-white/[0.01]">
        <div className="text-xs text-muted-foreground dark:text-zinc-400">
          Remembered your password?{' '}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Back to login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xl p-8 text-center">
        <div className="flex flex-col items-center justify-center space-y-3 py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs text-muted-foreground">Loading password reset form...</p>
        </div>
      </Card>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
