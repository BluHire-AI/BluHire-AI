'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const verifyOtpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be exactly 6 digits' }).regex(/^\d+$/, 'Must be only numbers'),
});

type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      toast.error('Email is required to verify OTP');
      router.push('/forgot-password');
    }
  }, [email, router]);

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
    try {
      setIsLoading(true);
      const response = await api.post('/auth/verify-reset-otp', {
        email,
        otp: data.otp
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

  if (!email) return null;

  return (
    <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Verify OTP</CardTitle>
        <CardDescription>
          Enter the 6-digit verification code sent to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">One Time Password</Label>
            <Input 
              id="otp" 
              type="text" 
              maxLength={6}
              placeholder="123456" 
              {...register('otp')}
              className={`text-center tracking-[0.5em] text-lg font-bold ${errors.otp ? 'border-red-500' : ''}`}
            />
            {errors.otp && (
              <p className="text-sm text-red-500">{errors.otp.message}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mt-20"></div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
