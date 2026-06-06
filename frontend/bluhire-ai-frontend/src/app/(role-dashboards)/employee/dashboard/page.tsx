'use client';

import React from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function EmployeeDashboard() {
  return (
    <RoleGuard allowedRoles={['EMPLOYEE', 'MANAGEMENT_ADMIN', 'SENIOR_MANAGER', 'HR_RECRUITER']}>
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Employee Hub</h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          Welcome to the employee portal. Use the sidebar to access the organizational directory and update your profile.
        </p>
      </div>
    </RoleGuard>
  );
}
