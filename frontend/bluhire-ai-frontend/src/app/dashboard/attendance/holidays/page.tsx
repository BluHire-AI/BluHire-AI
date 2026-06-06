'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, CalendarHeart } from 'lucide-react';

export default function HolidaysPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Holiday Calendar</h2>
          <p className="text-sm text-zinc-500">Manage company-wide holidays.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Holiday
        </Button>
      </div>

      <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <CalendarHeart className="w-5 h-5 mr-2 text-rose-500" />
            2026 Holidays
          </CardTitle>
          <CardDescription>Upcoming official holidays for the year.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Holiday Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">New Year's Day</TableCell>
                <TableCell>Jan 01, 2026</TableCell>
                <TableCell>Public Holiday</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Labor Day</TableCell>
                <TableCell>May 01, 2026</TableCell>
                <TableCell>Public Holiday</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Christmas</TableCell>
                <TableCell>Dec 25, 2026</TableCell>
                <TableCell>Public Holiday</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
