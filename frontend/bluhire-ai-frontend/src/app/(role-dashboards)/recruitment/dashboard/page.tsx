'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileBarChart2, Trophy, Navigation } from 'lucide-react';

export default function RecruitmentDashboard() {
  return (
    <RoleGuard allowedRoles={['HR_RECRUITER', 'MANAGEMENT_ADMIN', 'SENIOR_MANAGER']}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Candidates</CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-zinc-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">AI Scorecards Ready</CardTitle>
            <FileBarChart2 className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84</div>
            <p className="text-xs text-zinc-500 mt-1">Pending your review</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Top Ranked</CardTitle>
            <Trophy className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-zinc-500 mt-1">Candidates &gt; 90% Match</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Hiring Decisions</CardTitle>
            <Navigation className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 Actionable</div>
            <p className="text-xs text-zinc-500 mt-1">Offers ready to extend</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Recruitment Hub</h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          This secure portal grants you access to deep AI insights, transcripts, and evaluation metrics not available to standard employees or candidates.
        </p>
      </div>
    </RoleGuard>
  );
}
