'use client';

import React from 'react';
import { useAuthStore } from '@/lib/store/auth';

interface PermissionGuardProps {
  roles: string[];
  children: React.ReactNode;
}

/**
 * Similar to RoleGuard, but silently hides content instead of showing "Access Denied".
 * Used for wrapping UI elements (like buttons) rather than entire page routes.
 */
export const PermissionGuard = ({ roles, children }: PermissionGuardProps) => {
  const { user } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  if (!roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};
