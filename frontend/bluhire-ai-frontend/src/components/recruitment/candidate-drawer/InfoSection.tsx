'use client';

import React from 'react';

interface InfoFieldProps {
  label: string;
  value?: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
  isLink?: boolean;
  href?: string;
  badge?: boolean;
}

export function InfoField({
  label,
  value,
  icon: Icon,
  className = '',
  isLink,
  href,
  badge = false,
}: InfoFieldProps) {
  return (
    <div
      className={`flex flex-col justify-between gap-1 p-3 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/60 dark:border-white/[0.06] hover:border-border dark:hover:border-white/15 transition-all ${className}`}
    >
      <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />}
        {label}
      </span>
      <div className="text-xs font-semibold text-foreground dark:text-zinc-100 truncate mt-0.5">
        {isLink && href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1 font-bold"
          >
            {value || 'Open Link'}
          </a>
        ) : badge ? (
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">
            {value || 'N/A'}
          </span>
        ) : (
          value || <span className="text-muted-foreground font-normal italic">N/A</span>
        )}
      </div>
    </div>
  );
}

interface InfoSectionProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function InfoSection({
  title,
  icon: Icon,
  children,
  action,
  className = '',
}: InfoSectionProps) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between pb-1 border-b border-border/40 dark:border-white/[0.04]">
        <h4 className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-primary shrink-0" />}
          {title}
        </h4>
        {action}
      </div>
      {children}
    </div>
  );
}
