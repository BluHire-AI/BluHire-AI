'use client';

import React from 'react';
import { GraduationCap, Building2, BookOpen, Award, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { Application } from '@/services/recruitment.service';
import { InfoSection } from '../InfoSection';

interface EducationTabProps {
  application: Application;
}

export function EducationTab({ application }: EducationTabProps) {
  const candidate = application.candidateId;
  const rawEducation = candidate?.education;
  const job = application.jobId;

  // Split multiple education records if separated by newlines, semicolons, or pipes
  const educationList: string[] = React.useMemo(() => {
    if (!rawEducation) return [];
    if (Array.isArray(rawEducation)) return rawEducation.map((e) => (typeof e === 'string' ? e : JSON.stringify(e)));
    return rawEducation
      .split(/\n|;|\s*\|\s*/)
      .map((item) => item.trim())
      .filter(Boolean);
  }, [rawEducation]);

  return (
    <div className="space-y-4">
      {/* Candidate Education Credentials */}
      <InfoSection title="Academic Credentials" icon={GraduationCap}>
        {educationList.length > 0 ? (
          <div className="space-y-2.5">
            {educationList.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/70 dark:border-white/10 space-y-2.5"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h5 className="font-bold text-xs text-foreground dark:text-white leading-snug">
                        {item}
                      </h5>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase tracking-wide">
                        Verified Record
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                      Academic Background
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center border-2 border-dashed border-border dark:border-white/10 rounded-xl bg-card dark:bg-white/[0.02] space-y-2">
            <GraduationCap className="w-9 h-9 text-muted-foreground/60 mx-auto" />
            <p className="font-bold text-xs text-foreground dark:text-white">
              No Education Records Registered
            </p>
            <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
              This candidate application did not submit academic credentials during registration.
            </p>
          </div>
        )}
      </InfoSection>

      {/* Role Educational Requirements Alignment */}
      <InfoSection title="Position Education Alignment" icon={BookOpen}>
        <div className="p-4 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/70 dark:border-white/10 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-card/60 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.04]">
              <span className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">
                Required Degree / Level
              </span>
              <span className="font-bold text-foreground dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                {job?.educationRequired || 'No formal degree required'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-card/60 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.04]">
              <span className="text-[9px] font-bold uppercase text-muted-foreground block mb-1">
                Required Experience
              </span>
              <span className="font-bold text-foreground dark:text-white flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-primary shrink-0" />
                {job?.experienceRequired || 'Flexible'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              Target position belongs to <strong className="text-foreground dark:text-white">{job?.departmentId?.name || 'Recruitment'}</strong> department.
            </span>
          </div>
        </div>
      </InfoSection>
    </div>
  );
}
