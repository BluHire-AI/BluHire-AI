'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Plane } from 'lucide-react';

export default function LeavesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Leave Management</h2>
          <p className="text-sm text-zinc-500">Apply for leaves and track your requests.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Apply Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balances */}
        <Card className="col-span-1 border-zinc-200/80 dark:border-zinc-800/80 shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardHeader>
            <CardTitle className="text-lg text-white">Leave Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/20 pb-2">
              <span className="text-white/80">Annual Leave</span>
              <span className="font-bold text-xl">12</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/20 pb-2">
              <span className="text-white/80">Sick Leave</span>
              <span className="font-bold text-xl">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/80">Casual Leave</span>
              <span className="font-bold text-xl">3</span>
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests */}
        <Card className="col-span-1 md:col-span-2 border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Annual Leave</TableCell>
                  <TableCell>Oct 15 - Oct 18, 2026</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
                      Pending
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Sick Leave</TableCell>
                  <TableCell>Sep 02, 2026</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                      Approved
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
