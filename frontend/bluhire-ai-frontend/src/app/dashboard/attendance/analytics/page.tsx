'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function AttendanceAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Attendance Analytics</h2>
        <p className="text-sm text-zinc-500">Workforce productivity and attendance trends.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Average Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">94.2%</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              +2.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Late Arrivals (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">14</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Across all departments</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Overtime Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">342 hrs</div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Total company overtime</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
            Attendance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center border rounded-xl border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="text-center text-zinc-500 dark:text-zinc-400">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 text-zinc-400" />
              <p>Charts will be populated via API in the next step.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
