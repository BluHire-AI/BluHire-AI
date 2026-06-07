'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { 
  LayoutDashboard, Play, Users, FileText, Settings, 
  Sparkles, ShieldAlert, Percent, BarChart3, History 
} from 'lucide-react';

interface TabItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

export default function PayrollLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  // Role-adaptive subtabs
  const hrTabs: TabItem[] = [
    { name: 'Dashboard', href: '/dashboard/payroll', icon: LayoutDashboard },
    { name: 'Processing', href: '/dashboard/payroll/processing', icon: Play },
    { name: 'Employees', href: '/dashboard/payroll/employees', icon: Users },
    { name: 'Payslips', href: '/dashboard/payroll/payslips', icon: FileText },
    { name: 'Salary Structure', href: '/dashboard/payroll/salary-structure', icon: Settings },
    { name: 'Bonuses & Awards', href: '/dashboard/payroll/bonuses', icon: Sparkles },
    { name: 'Deductions', href: '/dashboard/payroll/deductions', icon: ShieldAlert },
    { name: 'Tax Center', href: '/dashboard/payroll/tax-center', icon: Percent },
    { name: 'Analytics', href: '/dashboard/payroll/analytics', icon: BarChart3 }
  ];

  const employeeTabs: TabItem[] = [
    { name: 'My Payroll Overview', href: '/dashboard/payroll', icon: LayoutDashboard },
    { name: 'My Payslips', href: '/dashboard/payroll/payslips', icon: FileText },
    { name: 'Earnings History', href: '/dashboard/payroll/history', icon: History }
  ];

  const tabs = isHR ? hrTabs : employeeTabs;

  return (
    <div className="space-y-6">
      {/* Subtab Navigation header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-px">
        <div className="flex flex-wrap gap-1.5 -mb-px">
          {tabs.map(tab => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors rounded-t-xl ${
                  isActive 
                    ? 'border-purple-650 text-purple-600 bg-purple-50/40 dark:bg-purple-950/10 dark:text-purple-400' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}
