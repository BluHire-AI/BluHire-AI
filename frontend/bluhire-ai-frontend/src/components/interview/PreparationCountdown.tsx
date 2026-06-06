'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreparationCountdownProps {
  duration?: number; // In seconds, default to 5
  onComplete: () => void;
  isActive: boolean;
}

export const PreparationCountdown: React.FC<PreparationCountdownProps> = ({ 
  duration = 5, 
  onComplete, 
  isActive 
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(duration);
      return;
    }

    if (timeLeft === 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, duration, onComplete]);

  if (!isActive) return null;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-2xl border border-slate-700 backdrop-blur-sm">
      <h3 className="text-xl font-medium text-slate-300 mb-4">Get Ready</h3>
      <p className="text-sm text-slate-400 mb-6 text-center max-w-sm">
        Recording will start automatically in...
      </p>
      
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Animated Background Ring */}
        <motion.svg 
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(59, 130, 246, 0.2)"
            strokeWidth="8"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 1 }}
            animate={{ pathLength: timeLeft / duration }}
            transition={{ duration: 1, ease: "linear" }}
          />
        </motion.svg>

        {/* Number Display */}
        <AnimatePresence mode="wait">
          <motion.span
            key={timeLeft}
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-5xl font-bold text-white z-10"
          >
            {timeLeft}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};
