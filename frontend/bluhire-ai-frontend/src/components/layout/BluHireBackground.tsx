'use client';

import React from 'react';
import StarField from '@/components/StarField';
import { useTheme } from 'next-themes';

interface BluHireBackgroundProps {
  children?: React.ReactNode;
  showConstellation?: boolean;
  className?: string;
}

export function BluHireBackground({
  children,
  showConstellation = true,
  className = '',
}: BluHireBackgroundProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = !mounted || (resolvedTheme || theme) === 'dark';

  return (
    <div className={`relative min-h-screen w-full bg-background text-foreground overflow-x-hidden ${className}`}>
      {/* Ambient glowing gradients & constellation */}
      <div className="bg-scene pointer-events-none fixed inset-0 z-0">
        <div className="bg-ambient" />
        {showConstellation && mounted && <StarField dark={isDark} />}
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
export default BluHireBackground;
