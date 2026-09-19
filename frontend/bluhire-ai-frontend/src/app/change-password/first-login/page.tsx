'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, Building } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BluHireBackground } from '@/components/layout/BluHireBackground';

const schema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormValues = z.infer<typeof schema>;

const requirements = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'One number', test: (v: string) => /[0-9]/.test(v) },
  { label: 'One special character', test: (v: string) => /[^a-zA-Z0-9]/.test(v) },
];

export default function FirstLoginPasswordChange() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Guard: only employees with mustChangePassword can access this page
  useEffect(() => {
    if (user && !user.mustChangePassword) {
      router.replace('/dashboard');
    }
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const watchedNew = watch('newPassword', '');

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      await api.post('/auth/change-password', {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      // Update local user state to clear mustChangePassword
      if (user) {
        setUser({ ...user, mustChangePassword: false });
      }

      toast.success('🎉 Password changed successfully! Welcome aboard!');

      // Redirect to employee dashboard
      setTimeout(() => {
        router.push('/employee/dashboard');
      }, 1200);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BluHireBackground showConstellation={true} className="flex min-h-screen">
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 z-10 my-auto">
        {/* Canonical Brand Header */}
        <div className="flex flex-col items-center mb-6 text-center select-none">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mb-3 shadow-md dark:shadow-[0_0_20px_rgba(139,92,246,0.25)]">
            <Building className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl sm:text-3xl tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-violet-400 dark:via-indigo-300 dark:to-[#8B5CF6] bg-clip-text text-transparent">
            BluHire-AI
          </span>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ENTERPRISE SECURITY
          </div>
        </div>

        {/* Form Card Container */}
        <div className="w-full max-w-md mx-auto">
          <Card className="w-full border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-[24px] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            
            <CardHeader className="space-y-2 pb-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground dark:text-white">
                Set Permanent Password
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                You are logging in for the first time. For workspace security, please configure your new permanent password.
              </CardDescription>
              <div className="pt-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Action Required &bull; First Login
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* User greeting pill */}
              {user && (
                <div className="flex items-center gap-3 bg-muted/40 dark:bg-white/[0.03] border border-border dark:border-white/10 rounded-xl p-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground dark:text-white truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-muted-foreground dark:text-zinc-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Current (temp) password */}
                <div className="space-y-1.5">
                  <Label htmlFor="oldPassword" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">
                    Temporary Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      id="oldPassword"
                      type={showOld ? 'text' : 'password'}
                      {...register('oldPassword')}
                      placeholder="Temporary password from email"
                      className={`text-xs h-10.5 pl-10 pr-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.oldPassword ? 'border-destructive/60' : ''}`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowOld(!showOld)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground dark:hover:text-white transition-colors"
                      aria-label={showOld ? 'Hide password' : 'Show password'}
                    >
                      {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.oldPassword && (
                    <p className="text-[11px] text-destructive mt-1 font-medium">{errors.oldPassword.message}</p>
                  )}
                </div>

                {/* New password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      id="newPassword"
                      type={showNew ? 'text' : 'password'}
                      {...register('newPassword')}
                      placeholder="Create a strong password"
                      className={`text-xs h-10.5 pl-10 pr-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.newPassword ? 'border-destructive/60' : ''}`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNew(!showNew)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground dark:hover:text-white transition-colors"
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-[11px] text-destructive mt-1 font-medium">{errors.newPassword.message}</p>
                  )}

                  {/* Password requirements live indicator */}
                  {watchedNew && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 space-y-1.5 bg-muted/40 dark:bg-white/[0.02] border border-border/60 dark:border-white/5 rounded-xl p-3 select-none"
                    >
                      {requirements.map((req) => {
                        const met = req.test(watchedNew);
                        return (
                          <div key={req.label} className="flex items-center gap-2">
                            <CheckCircle2 className={`w-3.5 h-3.5 transition-colors ${met ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
                            <span className={`text-[11px] font-medium transition-colors ${met ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/70 dark:text-zinc-500'}`}>
                              {req.label}
                            </span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      {...register('confirmPassword')}
                      placeholder="Re-enter new password"
                      className={`text-xs h-10.5 pl-10 pr-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/25 text-foreground dark:text-white rounded-xl placeholder:text-muted-foreground/60 transition-all ${errors.confirmPassword ? 'border-destructive/60' : ''}`}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowConfirm(!showConfirm)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground dark:hover:text-white transition-colors"
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11px] text-destructive mt-1 font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Canonical Info notice */}
                <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 select-none">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-amber-700 dark:text-amber-300/90 text-[11px] leading-relaxed">
                    After updating your password, you will be directed straight to your employee dashboard.
                  </p>
                </div>

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10.5 mt-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl border-0 shadow-lg shadow-primary/20 dark:shadow-[0_0_20px_rgba(139,92,246,0.25)] transition-all duration-200 cursor-pointer"
                >
                  {isLoading ? 'Setting permanent password...' : 'Set Password & Enter Workspace'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-muted-foreground/70 dark:text-zinc-500 flex items-center justify-center gap-2 font-mono">
          <span>&copy; {new Date().getFullYear()} BluHire-AI</span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Workspace Security Active
          </span>
        </div>
      </div>
    </BluHireBackground>
  );
}
