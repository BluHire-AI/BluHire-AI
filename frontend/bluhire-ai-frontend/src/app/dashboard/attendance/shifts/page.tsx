'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus } from 'lucide-react';

export default function ShiftsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Shift Management</h2>
          <p className="text-sm text-zinc-500">Configure and assign work shifts.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Create Shift
        </Button>
      </div>

      <Card className="border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Active Shifts</CardTitle>
          <CardDescription>All standard and flexible shifts configured in the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shift Name</TableHead>
                <TableHead>Timings</TableHead>
                <TableHead>Grace Period</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Morning Shift</TableCell>
                <TableCell className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-zinc-400" />
                  09:00 - 18:00
                </TableCell>
                <TableCell>15 mins</TableCell>
                <TableCell>8 hrs</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
                    Active
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Night Shift</TableCell>
                <TableCell className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-zinc-400" />
                  20:00 - 05:00
                </TableCell>
                <TableCell>10 mins</TableCell>
                <TableCell>8 hrs</TableCell>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900">
                    Active
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
