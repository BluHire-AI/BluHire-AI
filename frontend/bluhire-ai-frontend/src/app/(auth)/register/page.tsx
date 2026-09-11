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
  employeeId: z.string().min(2, { message: 'Employee ID is required' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  role: z.enum(['HR_RECRUITER', 'EMPLOYEE', 'MANAGEMENT_ADMIN', 'SENIOR_MANAGER'], { 
    message: 'Please select a role' 
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      employeeId: '',
      password: '',
      role: 'EMPLOYEE', // Default role
    },
  });

  const activeRole = watch('role');

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', data);
      
      if (response.data.success) {
        toast.success('Registration successful! Please sign in.');
        router.push('/login');
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err.response?.data?.message || 'Failed to register. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xl relative overflow-hidden group my-4">
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
                className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.firstName ? 'border-destructive/60' : ''}`}
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
                className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.lastName ? 'border-destructive/60' : ''}`}
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
                className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.email ? 'border-destructive/60' : ''}`}
              />
              {errors.email && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="employeeId" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Employee ID</Label>
              <Input 
                id="employeeId" 
                placeholder="EMP-1234" 
                {...register('employeeId')}
                className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.employeeId ? 'border-destructive/60' : ''}`}
              />
              {errors.employeeId && (
                <p className="text-[11px] text-destructive mt-1 font-medium">{errors.employeeId.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Account Role</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'EMPLOYEE', label: 'Employee', desc: 'Core profile & timesheets.' },
                { value: 'HR_RECRUITER', label: 'HR Recruiter', desc: 'ATS management & pipelines.' },
                { value: 'SENIOR_MANAGER', label: 'Senior Manager', desc: 'Performances & logs.' },
                { value: 'MANAGEMENT_ADMIN', label: 'Admin', desc: 'Full workspace control.' },
              ].map((r) => {
                const isSelected = activeRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue('role', r.value as any)}
                    className={`flex flex-col text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-primary bg-primary/10 text-primary dark:text-white shadow-xs' 
                        : 'border-border/80 dark:border-white/10 bg-background/40 dark:bg-white/[0.02] text-muted-foreground hover:bg-muted/50 hover:border-border'
                    }`}
                  >
                    <span className={`font-semibold mb-0.5 ${isSelected ? 'text-primary dark:text-violet-300' : 'text-foreground/90 dark:text-zinc-200'}`}>{r.label}</span>
                    <span className="text-[10px] text-muted-foreground dark:text-zinc-400 leading-tight">{r.desc}</span>
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p className="text-[11px] text-destructive mt-1 font-medium">{errors.role.message}</p>
            )}
          </div>
 
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              {...register('password')}
              className={`text-xs h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus:border-primary/60 focus:ring-2 focus:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.password ? 'border-destructive/60' : ''}`}
            />
            {errors.password && (
              <p className="text-[11px] text-destructive mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-10.5 mt-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-xl border-0 shadow-lg shadow-indigo-600/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all duration-200 cursor-pointer" 
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
