'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', data);
      
      if (response.data.success) {
        const { user, accessToken, refreshToken } = response.data.data;
        login(user, accessToken, refreshToken);
        toast.success('Login successful');
        
        // First-login: employee must change temporary password
        if (user.mustChangePassword) {
          router.push('/change-password/first-login');
          return;
        }

        let targetRoute = '/dashboard';
        if (user.role === 'EMPLOYEE') {
          targetRoute = '/employee/dashboard';
        }
        router.push(targetRoute);
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-[24px] shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white">Welcome back</CardTitle>
        <CardDescription className="text-xs text-muted-foreground dark:text-zinc-400">
          Enter your credentials to access the BluHire workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="name@company.com" 
              {...register('email')}
              className={`text-xs h-10.5 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.email ? 'border-destructive/60' : ''}`}
            />
            {errors.email && (
              <p className="text-[11px] text-destructive mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Password</Label>
              <Link 
                href="/forgot-password" 
                className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              {...register('password')}
              className={`text-xs h-10.5 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.password ? 'border-destructive/60' : ''}`}
            />
            {errors.password && (
              <p className="text-[11px] text-destructive mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>
          <Button 
            type="submit" 
            className="w-full h-10.5 mt-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl border-0 shadow-lg shadow-primary/20 dark:shadow-[0_0_20px_rgba(139,92,246,0.25)] transition-all duration-200 cursor-pointer" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in to workspace'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/80 dark:border-white/10 pt-5 pb-5 bg-muted/20 dark:bg-white/[0.01]">
        <div className="text-xs text-muted-foreground dark:text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Create an account
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
