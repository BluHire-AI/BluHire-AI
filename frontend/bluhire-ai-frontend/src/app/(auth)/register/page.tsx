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

const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  employeeId: z.string().optional(),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  role: z.literal('EMPLOYEE').default('EMPLOYEE'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      password: '',
      role: 'EMPLOYEE',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      const payload: Record<string, any> = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        role: 'EMPLOYEE',
      };
      if (data.employeeId?.trim()) {
        payload.employeeId = data.employeeId.trim();
      }

      const response = await api.post('/auth/register', payload);
      
      if (response.data.success) {
        toast.success('Registration successful! Please sign in.');
        router.push('/login');
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0] || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-[24px] shadow-2xl relative overflow-hidden group my-2">
      <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <CardHeader className="space-y-1.5 pb-5">
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white">Create an account</CardTitle>
        <CardDescription className="text-xs text-muted-foreground dark:text-zinc-400">
          Enter your details below to set up your workspace profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">First name</Label>
              <Input 
                id="firstName" 
                placeholder="John" 
                {...register('firstName')}
                className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.firstName ? 'border-destructive/60' : ''}`}
              />
              {errors.firstName && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Last name</Label>
              <Input 
                id="lastName" 
                placeholder="Doe" 
                {...register('lastName')}
                className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.lastName ? 'border-destructive/60' : ''}`}
              />
              {errors.lastName && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                {...register('email')}
                className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.email ? 'border-destructive/60' : ''}`}
              />
              {errors.email && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="employeeId" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Employee ID <span className="text-[10px] text-muted-foreground font-normal">(Optional)</span></Label>
              <Input 
                id="employeeId" 
                placeholder="Auto-generated if left blank" 
                {...register('employeeId')}
                className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.employeeId ? 'border-destructive/60' : ''}`}
              />
              {errors.employeeId && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors.employeeId.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Account Access Level</Label>
            <div className="flex items-center justify-between p-3 rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-foreground dark:text-zinc-200">Standard Employee Account</p>
                  <p className="text-[10px] text-muted-foreground dark:text-zinc-400">Timesheets, profiles, reviews & self-service</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-primary/15 dark:bg-primary/25 text-primary border border-primary/30">
                EMPLOYEE
              </span>
            </div>
            <p className="text-[10.5px] text-muted-foreground/75 dark:text-zinc-500 leading-tight">
              * Privileged workspace roles (HR Recruiter, Senior Manager, Management Admin) are strictly provisioned by internal system administrators.
            </p>
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              {...register('password')}
              className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.password ? 'border-destructive/60' : ''}`}
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
            {isLoading ? 'Creating account...' : 'Create workspace account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/80 dark:border-white/10 pt-4 pb-4 bg-muted/20 dark:bg-white/[0.01]">
        <div className="text-xs text-muted-foreground dark:text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
