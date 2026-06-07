'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

import { useAuthStore } from '@/lib/store/auth';

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  const tabs = [
    { name: 'Overview', href: '/dashboard/attendance' },
    { name: 'Calendar', href: '/dashboard/attendance/calendar' },
    { name: 'History', href: '/dashboard/attendance/history' },
    { name: 'Leaves', href: '/dashboard/attendance/leaves' },
    { name: 'Shifts', href: '/dashboard/attendance/shifts' },
    { name: 'Holidays', href: '/dashboard/attendance/holidays' },
    { name: 'Analytics', href: '/dashboard/attendance/analytics' },
    ...(isHR ? [{ name: 'Management', href: '/dashboard/attendance/management' }] : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Attendance & Leave Management</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your attendance, apply for leaves, and view your schedule.</p>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors relative
                    ${isActive
                      ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                      : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300 dark:hover:border-zinc-700'
                    }
                  `}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">
        {children}
      </div>
    </div>
  );
}
