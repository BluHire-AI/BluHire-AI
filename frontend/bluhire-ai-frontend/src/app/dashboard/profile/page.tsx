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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input 
                    id="firstName" 
                    {...register('firstName')}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input 
                    id="lastName" 
                    {...register('lastName')}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="bg-zinc-100 dark:bg-zinc-800"
                />
                <p className="text-xs text-zinc-500">Email cannot be changed.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input 
                  id="phone" 
                  {...register('phone')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input 
                    id="department" 
                    {...register('department')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation</Label>
                  <Input 
                    id="designation" 
                    {...register('designation')}
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-zinc-100 dark:border-zinc-800 pt-6">
            <Button 
              type="submit" 
              form="profile-form" 
              disabled={isLoading || !isDirty}
            >
              {isLoading ? 'Saving...' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-2 md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Your system role and identifiers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-zinc-500">System Role</Label>
              <p className="font-medium mt-1">{user?.role?.replace('_', ' ')}</p>
            </div>
            <div>
              <Label className="text-zinc-500">Employee ID</Label>
              <p className="font-medium mt-1">{user?.employeeId || 'Not assigned'}</p>
            </div>
            <div>
              <Label className="text-zinc-500">Account Status</Label>
              <div className="mt-1 flex items-center">
                <div className={`h-2.5 w-2.5 rounded-full mr-2 ${user?.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="font-medium">{user?.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
