'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RecruitmentDashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard/recruitment');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}


