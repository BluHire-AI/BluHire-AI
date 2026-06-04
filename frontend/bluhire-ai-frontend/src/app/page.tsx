'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-blue-600 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
      </div>
    </div>
  );
}
