'use client';

import React from 'react';
import { AuthProvider } from '@/components/providers/auth-provider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

export default function RoleDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppLayout>
          {children}
        </AppLayout>
      </ProtectedRoute>
    </AuthProvider>
  );
}
