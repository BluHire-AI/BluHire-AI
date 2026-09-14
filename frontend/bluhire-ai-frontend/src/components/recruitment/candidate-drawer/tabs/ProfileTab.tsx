'use client';

import React from 'react';
import {
  Mail,
  Phone,
  Globe,
  Briefcase,
  Building,
  DollarSign,
  Clock,
  Tag,
  ExternalLink,
  MapPin,
  Award,
  Target,
  FileText,
} from 'lucide-react';
import { InfoSection, InfoField } from '../InfoSection';
import { Application } from '@/services/recruitment.service';

interface ProfileTabProps {
  application: Application;
  formatDate: (date?: string | Date) => string;
}

export function ProfileTab({ application, formatDate }: ProfileTabProps) {
  const candidate = application.candidateId;
  const job = application.jobId;

  // Format notice period (e.g. "0" -> "Immediate", "30" -> "30 Days")
  const formatNoticePeriod = (val?: string) => {
    if (!val || val === '0' || val.toLowerCase() === 'immediate') return 'Immediate';
    if (!isNaN(Number(val))) return `${val} Days`;
    return val;
  };

  // Format experience (e.g. "2" -> "2 Years")
  const formatExperience = (exp?: string) => {
    if (!exp) return 'Not specified';
    if (!isNaN(Number(exp))) return `${exp} ${Number(exp) === 1 ? 'Year' : 'Years'}`;
    return exp;
  };

  const isLongSummary = candidate?.experience && candidate.experience.trim().length > 30;

  return (
    <div className="space-y-4">
      {/* Candidate High-Level Overview Card */}
      <div className="p-3.5 rounded-xl bg-gradient-to-br from-primary/[0.06] to-violet-500/[0.03] border border-primary/20 space-y-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Target className="w-3.5 h-3.5" />
          Candidate Quick Overview
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-card/60 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.04]">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
              Current Role
            </span>
            <span className="font-bold text-foreground dark:text-white truncate block mt-0.5" title={candidate?.currentDesignation}>
              {candidate?.currentDesignation || 'Not specified'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-card/60 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.04]">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
              Target Role
            </span>
            <span className="font-bold text-foreground dark:text-white truncate block mt-0.5" title={job?.title}>
              {job?.title || 'General Position'}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-card/60 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.04]">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
              Experience
            </span>
            <span className="font-bold text-foreground dark:text-white truncate block mt-0.5">
              {formatExperience(candidate?.experience)}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-card/60 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.04]">
            <span className="text-[9px] font-semibold text-muted-foreground uppercase block">
              Location
            </span>
            <span className="font-bold text-foreground dark:text-white truncate block mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              {job?.location || 'Remote / Hybrid'}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <InfoSection title="Contact Information" icon={Mail}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <InfoField
            label="Email Address"
            icon={Mail}
            value={
              candidate?.email ? (
                <a
                  href={`mailto:${candidate.email}`}
                  className="text-foreground dark:text-white hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  {candidate.email}
                </a>
              ) : null
            }
          />
          <InfoField
            label="Phone Number"
            icon={Phone}
            value={
              candidate?.phone ? (
                <a
                  href={`tel:${candidate.phone}`}
                  className="text-foreground dark:text-white hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  {candidate.phone}
                </a>
              ) : null
            }
          />
          <InfoField
            label="LinkedIn Profile"
            icon={Globe}
            isLink={!!candidate?.linkedinUrl}
            href={candidate?.linkedinUrl}
            value={
              candidate?.linkedinUrl ? (
                <span className="inline-flex items-center gap-1">
                  View Profile <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </span>
              ) : null
            }
          />
          <InfoField
            label="Portfolio / Website"
            icon={ExternalLink}
            isLink={!!candidate?.portfolioUrl}
            href={candidate?.portfolioUrl}
            value={
              candidate?.portfolioUrl ? (
                <span className="inline-flex items-center gap-1">
                  View Portfolio <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </span>
              ) : null
            }
          />
        </div>
      </InfoSection>

      {/* Work Information Section */}
      <InfoSection title="Work Information" icon={Briefcase}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <InfoField
            label="Current Company"
            icon={Building}
            value={candidate?.currentCompany || 'Not specified'}
          />
          <InfoField
            label="Current Designation"
            icon={Briefcase}
            value={candidate?.currentDesignation || 'Not specified'}
          />
          <InfoField
            label="Expected Compensation"
            icon={DollarSign}
            value={
              candidate?.expectedSalary
                ? `$${candidate.expectedSalary.toLocaleString()} / year`
                : 'Negotiable'
            }
          />
          <InfoField
            label="Notice Period"
            icon={Clock}
            value={formatNoticePeriod(candidate?.noticePeriod)}
          />
          <InfoField
            label="Sourcing Source"
            icon={Tag}
            badge
            value={candidate?.source || 'Direct Application'}
          />
          <InfoField
            label="Department"
            icon={Building}
            value={job?.departmentId?.name || 'Recruitment'}
          />
        </div>
      </InfoSection>

      {/* Optional Descriptive Background text if available */}
      {isLongSummary && (
        <InfoSection title="Professional Background Summary" icon={FileText}>
          <div className="p-3.5 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/60 dark:border-white/[0.06] text-xs text-foreground/90 dark:text-zinc-200 leading-relaxed font-normal">
            {candidate.experience}
          </div>
        </InfoSection>
      )}
    </div>
  );
}
