'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  UserCircle2,
  FileText,
  Award,
  GraduationCap,
  Sparkles,
  MessageSquare,
  Star,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export type DrawerTabKey =
  | 'profile'
  | 'resume'
  | 'skills'
  | 'education'
  | 'ai'
  | 'interviews'
  | 'evaluation'
  | 'timeline';

interface TabItem {
  key: DrawerTabKey;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { key: 'profile', label: 'Profile', icon: UserCircle2 },
  { key: 'resume', label: 'Resume', icon: FileText },
  { key: 'skills', label: 'Skills Match', icon: Award },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'ai', label: 'AI Resume Analysis', icon: Sparkles },
  { key: 'interviews', label: 'Interview', icon: MessageSquare },
  { key: 'evaluation', label: 'Recruiter Score', icon: Star },
  { key: 'timeline', label: 'Stage Audit', icon: Layers },
];

interface CandidateTabsProps {
  activeTab: DrawerTabKey;
  onTabChange: (tab: DrawerTabKey) => void;
}

export function CandidateTabs({ activeTab, onTabChange }: CandidateTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  // Check scroll on mount, tab change, and resize
  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  // Auto-scroll active tab into view so it is never clipped
  useEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    if (activeEl && scrollRef.current) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
      setTimeout(checkScroll, 250);
    }
  }, [activeTab]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -180 : 180;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkScroll, 250);
    }
  };

  // Support mouse wheel horizontal scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && e.deltaY !== 0) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  return (
    <div className="relative border-b border-border/70 dark:border-white/10 bg-muted/10 dark:bg-[#0b0c14] shrink-0 flex items-center group">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute left-0 z-20 h-full px-2 bg-gradient-to-r from-card via-card/90 dark:from-[#0c0d15] dark:via-[#0c0d15]/90 to-transparent flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          aria-label="Scroll tabs left"
          title="Previous tabs"
        >
          <ChevronLeft className="w-4 h-4 bg-muted/80 dark:bg-white/10 rounded-full p-0.5" />
        </button>
      )}

      {/* Tab Navigation Container */}
      <nav
        ref={scrollRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
        className="flex items-center gap-0.5 px-3 overflow-x-auto scrollbar-none scroll-smooth w-full"
        aria-label="Candidate Drawer Tabs"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              ref={(el) => {
                tabRefs.current[tab.key] = el;
              }}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'border-primary text-primary font-bold bg-primary/[0.04]'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30 dark:hover:bg-white/[0.02]'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? 'text-primary' : 'text-muted-foreground/70'
                }`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute right-0 z-20 h-full px-2 bg-gradient-to-l from-card via-card/90 dark:from-[#0c0d15] dark:via-[#0c0d15]/90 to-transparent flex items-center justify-center text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          aria-label="Scroll tabs right"
          title="More tabs"
        >
          <ChevronRight className="w-4 h-4 bg-muted/80 dark:bg-white/10 rounded-full p-0.5" />
        </button>
      )}
    </div>
  );
}
