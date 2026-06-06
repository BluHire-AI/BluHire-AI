'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

import { useRouter } from 'next/navigation';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
        toast.success('If an account exists, an OTP has been sent.');
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
    <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight">Forgot password</CardTitle>
        <CardDescription>
          Enter your email address and we will send you a 6-digit OTP to reset your password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? 'Sending link...' : 'Send reset link'}
            </Button>
          </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-6">
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
            Back to login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
