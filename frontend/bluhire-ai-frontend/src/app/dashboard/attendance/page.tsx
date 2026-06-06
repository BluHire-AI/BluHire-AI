'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

export default function AttendanceOverviewPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Check In / Out Card */}
        <Card className="col-span-1 md:col-span-2 border-zinc-200/80 dark:border-zinc-800/80 shadow-sm bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-900 dark:to-zinc-950/50">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              Today's Attendance
            </CardTitle>
            <CardDescription>Record your daily check-in and check-out</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <div className="text-4xl font-bold tracking-tight mb-2 text-zinc-800 dark:text-zinc-100">
              09:45 AM
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Current Time</p>
            
            <div className="flex space-x-4">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 shadow-sm">
                Check In
              </Button>
              <Button size="lg" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30 rounded-xl px-8" disabled>
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Monthly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">92%</div>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Good standing
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Leave Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">12 Days</div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Annual leaves remaining
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Recent Activity placeholder */}
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400 text-sm">
            No recent attendance activity to show.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
