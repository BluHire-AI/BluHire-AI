'use client';

import React from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { AccessDenied } from './AccessDenied';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { user } = useAuthStore();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (!user || !allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};
