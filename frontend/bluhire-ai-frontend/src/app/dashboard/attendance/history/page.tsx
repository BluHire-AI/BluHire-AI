'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileClock } from 'lucide-react';

export default function AttendanceHistoryPage() {
  return (
    <div className="space-y-6">
      <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <FileClock className="w-5 h-5 mr-2 text-blue-500" />
            Attendance History
          </CardTitle>
          <CardDescription>View your detailed check-in and check-out logs.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Placeholder Data */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">Oct {10 - i}, 2026</TableCell>
                    <TableCell>08:55 AM</TableCell>
                    <TableCell>05:10 PM</TableCell>
                    <TableCell>8.25h</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                        Present
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
