import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store/auth';

export const AccessDenied = () => {
  const { user } = useAuthStore();
  
  // Determine fallback route based on role
  let fallbackRoute = '/dashboard';
  if (user) {
    switch (user.role) {
      case 'CANDIDATE': fallbackRoute = '/candidate/dashboard'; break;
      case 'EMPLOYEE': fallbackRoute = '/employee/dashboard'; break;
      case 'HR_RECRUITER': fallbackRoute = '/recruitment/dashboard'; break;
      case 'SENIOR_MANAGER': fallbackRoute = '/executive/dashboard'; break;
      case 'MANAGEMENT_ADMIN': fallbackRoute = '/admin/dashboard'; break;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Access Denied</h1>
      <p className="text-zinc-500 dark:text-zinc-400 max-w-md mb-8">
        You do not have the required permissions to view this page. Please contact your administrator if you believe this is an error.
      </p>
      <Link href={fallbackRoute}>
        <Button variant="default" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};
