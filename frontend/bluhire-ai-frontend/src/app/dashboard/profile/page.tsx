'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  IdCard, 
  Activity, 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';

import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const profileSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      department: '',
      designation: '',
    },
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        phone: (user as any).phone || '',
        department: user.department || '',
        designation: user.designation || '',
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      const response = await api.put('/users/me', data);
      
      if (response.data.success) {
        setUser(response.data.data);
        toast.success('Profile updated successfully');
        reset(data); // reset to make isDirty false
      }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1150px] mx-auto space-y-8 pb-10">
      {/* Page Header */}
      <div className="anim-hero flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground dark:text-white">
              Profile Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 text-primary dark:bg-purple-500/15 dark:text-purple-300 border border-primary/20">
              Account
            </span>
          </div>
          <p className="text-sm text-muted-foreground dark:text-zinc-400">
            Manage your account settings, personal details, and HR system information.
          </p>
        </div>

        {/* Header Quick Identity Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/80 dark:bg-[#0e101e]/80 border border-border/80 dark:border-white/10 text-xs text-muted-foreground dark:text-zinc-300 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Verified Identity</span>
          </div>
        </div>
      </div>

      {/* Main Grid: 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Personal Information Form (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="anim-card glass border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(23,32,51,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] rounded-2xl overflow-hidden">
            {/* Banner / Avatar Header Section inside Personal Info Card */}
            <div className="relative p-6 sm:p-7 border-b border-border/60 dark:border-white/10 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-transparent dark:from-indigo-500/10 dark:via-purple-500/10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="relative group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xl sm:text-2xl shadow-lg shadow-indigo-500/25 border-2 border-white/20">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
                      : 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card dark:border-[#0e101e] flex items-center justify-center shadow-xs" title="Account Active">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-bold text-foreground dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground dark:text-zinc-400">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground dark:text-zinc-400 pt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      {user?.department || 'General'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                      {user?.designation || 'Staff Member'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <CardHeader className="pt-6 pb-2 px-6 sm:px-7">
              <CardTitle className="text-lg font-bold text-foreground dark:text-white flex items-center gap-2">
                <User className="w-4.5 h-4.5 text-indigo-600 dark:text-purple-400" />
                Personal Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground dark:text-zinc-400">
                Update your personal contact details, department assignment, and designation.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 sm:px-7 pt-4 pb-6">
              <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                
                {/* First Name & Last Name (2 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs font-semibold text-foreground dark:text-zinc-200 flex items-center gap-1.5">
                      First Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input 
                      id="firstName" 
                      {...register('firstName')}
                      placeholder="Enter first name"
                      className={`h-10.5 rounded-xl border bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white text-sm transition-all focus:ring-2 focus:ring-primary/30 ${
                        errors.firstName ? 'border-red-500 focus:ring-red-500/30' : 'border-border dark:border-white/15'
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs font-semibold text-foreground dark:text-zinc-200 flex items-center gap-1.5">
                      Last Name <span className="text-rose-500">*</span>
                    </Label>
                    <Input 
                      id="lastName" 
                      {...register('lastName')}
                      placeholder="Enter last name"
                      className={`h-10.5 rounded-xl border bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white text-sm transition-all focus:ring-2 focus:ring-primary/30 ${
                        errors.lastName ? 'border-red-500 focus:ring-red-500/30' : 'border-border dark:border-white/15'
                      }`}
                    />
                    {errors.lastName && (
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1 mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Field (Full width, read-only with lock indicator) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-xs font-semibold text-foreground dark:text-zinc-200 flex items-center gap-1.5">
                      Email Address
                    </Label>
                    <span className="text-[11px] font-medium text-muted-foreground dark:text-zinc-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500" /> Read-only identifier
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-zinc-400 pointer-events-none" />
                    <Input 
                      id="email" 
                      type="email" 
                      value={user?.email || ''} 
                      disabled
                      readOnly
                      className="h-10.5 pl-10 rounded-xl border border-border/80 dark:border-white/10 bg-slate-100/80 dark:bg-white/[0.04] text-slate-700 dark:text-zinc-300 font-medium text-sm cursor-not-allowed opacity-90"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground dark:text-zinc-400">
                    Email address is tied to your system login account and cannot be changed here.
                  </p>
                </div>

                {/* Phone Number Field (Full width) */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-semibold text-foreground dark:text-zinc-200 flex items-center gap-1.5">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-zinc-400 pointer-events-none" />
                    <Input 
                      id="phone" 
                      {...register('phone')}
                      placeholder="+1 (555) 000-0000"
                      className="h-10.5 pl-10 rounded-xl border border-border dark:border-white/15 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white text-sm transition-all focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Department & Designation (2 columns) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-xs font-semibold text-foreground dark:text-zinc-200 flex items-center gap-1.5">
                      Department
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-zinc-400 pointer-events-none" />
                      <Input 
                        id="department" 
                        {...register('department')}
                        placeholder="e.g. Engineering"
                        className="h-10.5 pl-10 rounded-xl border border-border dark:border-white/15 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white text-sm transition-all focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-xs font-semibold text-foreground dark:text-zinc-200 flex items-center gap-1.5">
                      Designation
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground dark:text-zinc-400 pointer-events-none" />
                      <Input 
                        id="designation" 
                        {...register('designation')}
                        placeholder="e.g. Senior Software Engineer"
                        className="h-10.5 pl-10 rounded-xl border border-border dark:border-white/15 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white text-sm transition-all focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </CardContent>

            {/* Card Footer Action Bar */}
            <CardFooter className="flex items-center justify-between border-t border-border/60 dark:border-white/10 px-6 sm:px-7 py-4 bg-muted/20 dark:bg-white/[0.01]">
              <div className="text-xs text-muted-foreground dark:text-zinc-400">
                {isDirty ? (
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    You have unsaved changes
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    All changes saved
                  </span>
                )}
              </div>

              <Button 
                type="submit" 
                form="profile-form" 
                disabled={isLoading || !isDirty}
                className="h-10 px-6 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 dark:shadow-purple-500/25 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Account Details Side Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="anim-card glass border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(23,32,51,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] rounded-2xl overflow-hidden">
            <CardHeader className="pt-6 pb-3 px-6">
              <CardTitle className="text-base font-bold text-foreground dark:text-white flex items-center gap-2">
                <IdCard className="w-4.5 h-4.5 text-indigo-600 dark:text-purple-400" />
                Account Details
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground dark:text-zinc-400">
                Your system role and identifiers.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-6 pb-6 space-y-4">
              
              {/* System Role */}
              <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-white/[0.03] border border-border/60 dark:border-white/10 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-400 block">
                  System Role
                </span>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase tracking-wider bg-primary/10 text-primary dark:bg-purple-500/15 dark:text-purple-300 border border-primary/20 dark:border-purple-500/30">
                    {user?.role?.replace('_', ' ')}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-purple-400" />
                </div>
              </div>

              {/* Employee ID */}
              <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-white/[0.03] border border-border/60 dark:border-white/10 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-400 block">
                  Employee ID
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-foreground dark:text-white tracking-wider">
                    {user?.employeeId || 'EMP-2026-001'}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground dark:text-zinc-400">
                    VERIFIED
                  </span>
                </div>
              </div>

              {/* Account Status */}
              <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-white/[0.03] border border-border/60 dark:border-white/10 space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground dark:text-zinc-400 block">
                  Account Status
                </span>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    <div className={`w-2 h-2 rounded-full ${user?.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span>{user?.isActive !== false ? 'Active' : 'Inactive'}</span>
                  </div>
                  <Activity className="w-4 h-4 text-emerald-500" />
                </div>
              </div>

              {/* System Notice */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-purple-400" />
                  Security Notice
                </div>
                <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                  Your profile changes are audited and synchronized instantly across BluHire-AI HR systems.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

