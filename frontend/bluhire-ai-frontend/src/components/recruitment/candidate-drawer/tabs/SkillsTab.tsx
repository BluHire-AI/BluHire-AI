'use client';

import React, { useMemo } from 'react';
import { Award, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { Application } from '@/services/recruitment.service';
import { InfoSection } from '../InfoSection';
import { computeSkillMatch, normalizeSkill } from '@/lib/skill-matcher';

interface SkillsTabProps {
  application: Application;
}

export function SkillsTab({ application }: SkillsTabProps) {
  const candidateSkills = application.candidateId?.skills || [];

  // Determine all required skills for this application
  const { matched, missing, matchPercentage, totalRequirements } = useMemo(() => {
    const jobRequirements = application.jobId?.requiredSkills || [];
    const appMatching = application.matchingSkills || [];
    const appMissing = application.missingSkills || [];

    // Combine job required skills and any application requirements, de-duplicating by normalized skill
    const reqMap = new Map<string, string>();
    for (const s of [...jobRequirements, ...appMatching, ...appMissing]) {
      if (s && typeof s === 'string' && s.trim()) {
        const norm = normalizeSkill(s);
        if (!reqMap.has(norm)) {
          reqMap.set(norm, s.trim());
        }
      }
    }

    const allRequirements = Array.from(reqMap.values());

    // Single source of truth calculation
    return computeSkillMatch(candidateSkills, allRequirements);
  }, [
    candidateSkills,
    application.jobId?.requiredSkills,
    application.matchingSkills,
    application.missingSkills,
  ]);

  return (
    <div className="space-y-4">
      {/* Top Match Score & Stats Summary Bar */}
      <div className="p-3.5 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/70 dark:border-white/10 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground dark:text-white">
                Skills Match Analysis
              </span>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/25">
                {matchPercentage}% Match
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {matched.length} of {totalRequirements} position requirements satisfied
            </p>
          </div>
        </div>

        {/* Counts summary chips */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {matched.length} Matched
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            {missing.length} Missing
          </span>
        </div>
      </div>

      {/* Matched Requirements (Positive) */}
      <InfoSection title="Matched Requirements" icon={CheckCircle2}>
        <div className="p-3.5 rounded-xl bg-emerald-500/[0.03] dark:bg-emerald-500/[0.05] border border-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              Verified Competencies ({matched.length})
            </span>
          </div>

          {matched.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {matched.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center gap-1.5"
                >
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic pt-0.5">
              No overlapping competencies found with required skills.
            </p>
          )}
        </div>
      </InfoSection>

      {/* Missing Requirements (Warning / Gap) */}
      <InfoSection title="Missing Requirements" icon={AlertCircle}>
        <div className="p-3.5 rounded-xl bg-rose-500/[0.03] dark:bg-rose-500/[0.05] border border-rose-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              Sourcing Gaps ({missing.length})
            </span>
          </div>

          {missing.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {missing.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-350 border border-rose-500/25"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pt-0.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Complete match! All position requirements are satisfied.
            </div>
          )}
        </div>
      </InfoSection>

      {/* Candidate Skills Profile (Neutral) */}
      <InfoSection title="Candidate Skills" icon={Award}>
        {candidateSkills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 p-3.5 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/70 dark:border-white/10">
            {candidateSkills.map((skill) => (
              <span
                key={skill}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-card dark:bg-white/[0.05] text-foreground dark:text-zinc-200 border border-border dark:border-white/10 shadow-2xs"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-muted/20 dark:bg-white/[0.02] border border-border/70 dark:border-white/10 text-xs text-muted-foreground italic text-center">
            No specific skills registered for this candidate.
          </div>
        )}
      </InfoSection>
    </div>
  );
}
