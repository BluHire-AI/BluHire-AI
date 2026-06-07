'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

interface AuthProviderProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export function AuthProvider({ 
  children, 
  requireAuth = true,
  allowedRoles = []
}: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Wait until hydration is complete before acting on auth state
    const checkAuth = () => {
      // If authentication is required and user is not authenticated
      if (requireAuth && !isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // If user is authenticated but trying to access auth pages (login/register)
      if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
        let targetRoute = '/dashboard';
        if (user) {
          switch (user.role) {
            case 'EMPLOYEE': targetRoute = '/employee/dashboard'; break;
            case 'HR_RECRUITER': targetRoute = '/dashboard/recruitment'; break;
            case 'SENIOR_MANAGER': targetRoute = '/executive/dashboard'; break;
            case 'MANAGEMENT_ADMIN': targetRoute = '/admin/dashboard'; break;
          }
        }
        router.push(targetRoute);
        return;
      }

      // Role-based access control
      if (requireAuth && isAuthenticated && allowedRoles.length > 0 && user) {
        if (!allowedRoles.includes(user.role)) {
          router.push('/dashboard/unauthorized');
        }
      }
    };

    checkAuth();
  }, [isClient, isAuthenticated, user, pathname, router, requireAuth, allowedRoles]);

  // Avoid rendering protected content during SSR to prevent hydration mismatch
  if (!isClient) {
    return null; // Or a loading spinner
  }

  // Prevent rendering if not authenticated and auth is required
  if (requireAuth && !isAuthenticated) {
    return null; 
  }

  return <>{children}</>;
}
