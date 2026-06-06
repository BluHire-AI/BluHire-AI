'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

export default function AttendanceCalendarPage() {
  return (
    <div className="space-y-6">
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <CalendarDays className="w-5 h-5 mr-2 text-blue-500" />
            Attendance Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[600px] border rounded-xl flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 border-dashed border-zinc-300 dark:border-zinc-700">
            <div className="text-center">
              <CalendarDays className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">Full Calendar View Coming Soon</p>
              <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">Will display present, absent, leaves, and holidays.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
