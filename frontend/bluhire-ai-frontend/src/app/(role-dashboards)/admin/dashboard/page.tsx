'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Shield, HardDrive, Cpu } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <RoleGuard allowedRoles={['MANAGEMENT_ADMIN']}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">System Status</CardTitle>
            <Cpu className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Operational</div>
            <p className="text-xs text-emerald-500 mt-1">All services online</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Database Size</CardTitle>
            <HardDrive className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2 GB</div>
            <p className="text-xs text-zinc-500 mt-1">72% of quota</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Active Roles</CardTitle>
            <Shield className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5 Policies</div>
            <p className="text-xs text-zinc-500 mt-1">Enforced system-wide</p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200/60 dark:border-zinc-800/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Settings</CardTitle>
            <Settings className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Available</div>
            <p className="text-xs text-zinc-500 mt-1">Global overrides</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Super Administrator Hub</h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          This panel is restricted to System Administrators. It grants full access to all organizational metrics, settings, and infrastructure health.
        </p>
      </div>
    </RoleGuard>
  );
}
