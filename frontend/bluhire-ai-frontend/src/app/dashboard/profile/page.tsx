'use client';

import React, { useEffect, useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { User, Shield, Briefcase, Mail, Phone, Building, Calendar, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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
        firstName: user.firstName,
        lastName: user.lastName,
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
    <div className="space-y-6 max-w-4xl mx-auto p-1 select-none">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          Profile Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Manage your account preferences, contact info, and role credentials.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left Side: Personal Info Form */}
        <Card className="col-span-2 md:col-span-3 border-border bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <User className="w-4.5 h-4.5 text-primary" /> Personal Information
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Update your employee details here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">First Name</Label>
                  <Input 
                    id="firstName" 
                    {...register('firstName')}
                    className={`rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0 ${errors.firstName ? 'border-destructive' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Last Name</Label>
                  <Input 
                    id="lastName" 
                    {...register('lastName')}
                    className={`rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0 ${errors.lastName ? 'border-destructive' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="email" 
                    type="email" 
                    value={user?.email || ''} 
                    disabled
                    className="pl-10 rounded-xl bg-muted/20 border-border/40 text-muted-foreground/80 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60 italic mt-1">System authentication emails cannot be changed.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Phone number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                  <Input 
                    id="phone" 
                    placeholder="+1 (555) 000-0000"
                    {...register('phone')}
                    className="pl-10 rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="department" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                      id="department" 
                      placeholder="e.g. Engineering"
                      {...register('department')}
                      className="pl-10 rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="designation" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Designation</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                      id="designation" 
                      placeholder="e.g. Software Engineer"
                      {...register('designation')}
                      className="pl-10 rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border/40 pt-5 px-6 pb-6">
            <Button 
              type="submit" 
              form="profile-form" 
              disabled={isLoading || !isDirty}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-5 shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? 'Saving...' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>

        {/* Right Side: Account Details & Badge */}
        <Card className="col-span-2 border-border bg-card/40 backdrop-blur-xl shadow-2xl relative overflow-hidden h-fit">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Shield className="w-4.5 h-4.5 text-indigo-400" /> Account Security
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              System credentials and active authorization logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Visual Avatar Card Widget */}
            <div className="p-4 bg-muted/20 border border-border/60 rounded-2xl flex flex-col items-center text-center space-y-3 shadow-inner">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-[0_0_20px_rgba(99,102,241,0.25)] relative overflow-hidden">
                <span className="z-10">{user?.firstName.charAt(0)}{user?.lastName.charAt(0)}</span>
                <div className="absolute inset-0 bg-white/10 opacity-30 hover:opacity-40 transition-opacity" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-foreground">{user?.firstName} {user?.lastName}</h4>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-muted-foreground/60" /> System Role
                </span>
                <Badge variant="secondary" className="bg-primary/10 border border-primary/20 text-primary font-bold rounded-lg text-[10px] uppercase font-mono tracking-wide px-2 py-0.5">
                  {user?.role?.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-border/40">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" /> Employee ID
                </span>
                <span className="font-mono text-xs text-foreground font-semibold">
                  {user?.employeeId || 'Not assigned'}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-muted-foreground/60" /> Account Status
                </span>
                <div className="flex items-center">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${user?.isActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${user?.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                  </span>
                  <span className="font-bold text-xs text-foreground">{user?.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
