'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, FileText, Bell, CheckCircle2 } from 'lucide-react';

export default function CandidateDashboard() {
  return (
    <RoleGuard allowedRoles={['CANDIDATE']}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Application Status</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Under Review</div>
            <p className="text-xs text-zinc-500 mt-1">Updated 2 days ago</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Interview Schedule</CardTitle>
            <Calendar className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 Upcoming</div>
            <p className="text-xs text-zinc-500 mt-1">Technical Round - Tomorrow</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Profile Completion</CardTitle>
            <FileText className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-zinc-500 mt-1">Resume parsed successfully</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Notifications</CardTitle>
            <Bell className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Unread</div>
            <p className="text-xs text-zinc-500 mt-1">Check your inbox</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Welcome to your Candidate Portal</h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          This dashboard contains only what you need: your applications, schedules, and profile details.
          Internal reports and scoring algorithms are kept hidden from this view.
        </p>
      </div>
    </RoleGuard>
  );
}
