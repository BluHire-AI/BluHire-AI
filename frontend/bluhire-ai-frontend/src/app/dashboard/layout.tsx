'use client';

import React from 'react';
import { AuthProvider } from '@/components/providers/auth-provider';
import { AppLayout } from '@/components/layout/AppLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppLayout>
        {children}
      </AppLayout>
    </AuthProvider>
  );
}
