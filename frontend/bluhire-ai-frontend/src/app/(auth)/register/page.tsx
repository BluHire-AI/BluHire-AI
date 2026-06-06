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
    <Card className="w-full border-white/10 bg-white/[0.03] backdrop-blur-2xl rounded-[24px] shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#8B5CF6]/30 to-transparent" />
      <CardHeader className="space-y-1.5 pb-6">
        <CardTitle className="text-xl font-bold tracking-tight text-white">Create an account</CardTitle>
        <CardDescription className="text-xs text-white/60">
          Enter your details below to set up your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-xs font-medium text-white/80">First name</Label>
              <Input 
                id="firstName" 
                placeholder="John" 
                {...register('firstName')}
                className={`text-xs h-10 bg-white/[0.02] border-white/10 focus:border-[#8B5CF6]/50 focus:ring-[#8B5CF6]/20 text-white rounded-xl ${errors.firstName ? 'border-destructive/50' : ''}`}
              />
              {errors.firstName && (
                <p className="text-[11px] text-destructive mt-1">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-xs font-medium text-white/80">Last name</Label>
              <Input 
                id="lastName" 
                placeholder="Doe" 
                {...register('lastName')}
                className={`text-xs h-10 bg-white/[0.02] border-white/10 focus:border-[#8B5CF6]/50 focus:ring-[#8B5CF6]/20 text-white rounded-xl ${errors.lastName ? 'border-destructive/50' : ''}`}
              />
              {errors.lastName && (
                <p className="text-[11px] text-destructive mt-1">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-medium text-white/80">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                {...register('email')}
                className={`text-xs h-10 bg-white/[0.02] border-white/10 focus:border-[#8B5CF6]/50 focus:ring-[#8B5CF6]/20 text-white rounded-xl ${errors.email ? 'border-destructive/50' : ''}`}
              />
              {errors.email && (
                <p className="text-[11px] text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="employeeId" className="text-xs font-medium text-white/80">Employee ID</Label>
              <Input 
                id="employeeId" 
                placeholder="EMP-1234" 
                {...register('employeeId')}
                className={`text-xs h-10 bg-white/[0.02] border-white/10 focus:border-[#8B5CF6]/50 focus:ring-[#8B5CF6]/20 text-white rounded-xl ${errors.employeeId ? 'border-destructive/50' : ''}`}
              />
              {errors.employeeId && (
                <p className="text-[11px] text-destructive mt-1">{errors.employeeId.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-medium text-white/80">Account Role</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'EMPLOYEE', label: 'Employee', desc: 'Core profile & timesheets.' },
                { value: 'HR_RECRUITER', label: 'HR Recruiter', desc: 'ATS management & pipelines.' },
                { value: 'SENIOR_MANAGER', label: 'Senior Manager', desc: 'Performances & logs.' },
                { value: 'MANAGEMENT_ADMIN', label: 'Admin', desc: 'Full control workspace.' },
              ].map((r) => {
                const isSelected = activeRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue('role', r.value as any)}
                    className={`flex flex-col text-left p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-white shadow-md shadow-[#8B5CF6]/5' 
                        : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.04] hover:border-white/20'
                    }`}
                  >
                    <span className={`font-semibold mb-0.5 ${isSelected ? 'text-[#8B5CF6]' : 'text-white/80'}`}>{r.label}</span>
                    <span className="text-[10px] text-white/40 leading-tight">{r.desc}</span>
                  </button>
                );
              })}
            </div>
            {errors.role && (
              <p className="text-[11px] text-destructive mt-1">{errors.role.message}</p>
            )}
          </div>
 
          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-medium text-white/80">Password</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              {...register('password')}
              className={`text-xs h-10 bg-white/[0.02] border-white/10 focus:border-[#8B5CF6]/50 focus:ring-[#8B5CF6]/20 text-white rounded-xl ${errors.password ? 'border-destructive/50' : ''}`}
            />
            {errors.password && (
              <p className="text-[11px] text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-10 mt-2 bg-[#8B5CF6] hover:bg-[#A855F7] text-white text-xs font-semibold rounded-xl border-0 shadow-lg shadow-[#8B5CF6]/15 transition-all duration-250 cursor-pointer" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create workspace account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-white/10 pt-6 bg-white/[0.01]">
        <div className="text-xs text-white/60">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#8B5CF6] hover:text-[#A855F7] transition-colors">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
