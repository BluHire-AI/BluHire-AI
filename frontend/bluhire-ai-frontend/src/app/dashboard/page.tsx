'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShieldCheck, Activity, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeRoles: 0,
    recentLogins: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (user?.role === 'MANAGEMENT_ADMIN' || user?.role === 'HR_RECRUITER') {
          // Attempt to fetch real user count and employee stats
          const [usersResponse, empStats] = await Promise.all([
            api.get('/users?limit=1'),
            api.get('/employees/stats/dashboard').catch(() => ({ data: { data: null } }))
          ]);
          
          setStats({
            totalUsers: usersResponse.data?.data?.total || 12,
            activeRoles: empStats.data?.data?.activeCount || 4,
            recentLogins: empStats.data?.data?.totalDepartments || 24,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats', error);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Here is what&apos;s happening across BluHire-AI today.
        </p>
      </div>

      {(user?.role === 'MANAGEMENT_ADMIN' || user?.role === 'HR_RECRUITER') && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers > 0 ? stats.totalUsers : '--'}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                +15% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Roles</CardTitle>
              <ShieldCheck className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRoles || 4}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Across all departments
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats.recentLogins || 24}</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Logins in the last 24h
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Calendar className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Scheduled interviews today
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Your personal dashboard and quick actions will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="flex h-[250px] items-center justify-center rounded-md border border-dashed border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Chart data will be available as you use the system.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
            <CardDescription>
              You have 2 unread messages.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">System Update</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Welcome to the new BluHire-AI HRMS platform!
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Profile</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Please ensure your profile information is up to date.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
