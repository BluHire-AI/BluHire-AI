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
    <div className="flex flex-col items-center justify-center p-8 bg-[#0e101e]/90 rounded-[24px] border border-white/15 backdrop-blur-xl shadow-2xl space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-bold text-white tracking-tight">Get Ready</h3>
        <p className="text-xs text-zinc-400 mt-1">
          Recording begins automatically in...
        </p>
      </div>
      
      <div className="relative w-28 h-28 flex items-center justify-center">
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
            stroke="rgba(139, 92, 246, 0.2)"
            strokeWidth="7"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#8B5CF6"
            strokeWidth="7"
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
            className="text-4xl font-extrabold text-white z-10 font-mono tracking-tight"
          >
            {timeLeft}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};
