'use client';

import React from 'react';
import { Layers, Clock, ArrowRight } from 'lucide-react';
import { Application } from '@/services/recruitment.service';
import { InfoSection } from '../InfoSection';

interface TimelineTabProps {
  application: Application;
  formatDate: (date?: string | Date) => string;
}

export function TimelineTab({ application, formatDate }: TimelineTabProps) {
  const history = application.stageHistory || [];

  return (
    <div className="space-y-6">
      <InfoSection title="Stage Audit & Progression Timeline" icon={Layers}>
        {history.length > 0 ? (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border dark:before:bg-white/10">
            {history.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Dot */}
                <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-card dark:bg-[#0c0d14] border-2 border-primary flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>

                <div className="p-3 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/60 dark:border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-white flex items-center gap-1.5">
                      <span className="text-primary">Stage:</span> {item.stage}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground/70" />
                      {formatDate(item.changedAt)}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-muted-foreground italic leading-relaxed pt-0.5">
                      {item.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/60 dark:border-white/[0.06] text-center text-xs text-muted-foreground">
            No stage history recorded yet.
          </div>
        )}
      </InfoSection>
    </div>
  );
}
