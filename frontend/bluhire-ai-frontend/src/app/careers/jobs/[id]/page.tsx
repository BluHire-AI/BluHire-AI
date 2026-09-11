'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign, Award, GraduationCap, CheckCircle } from 'lucide-react';
import { recruitmentService, Job } from '@/services/recruitment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BluHireBackground } from '@/components/layout/BluHireBackground';

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadJob() {
      try {
        setLoading(true);
        const data = await recruitmentService.getPublicJob(id);
        setJob(data);
      } catch (error) {
        console.error('Failed to load job details:', error);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadJob();
  }, [id]);

  if (loading) {
    return (
      <BluHireBackground showConstellation={true}>
        <div className="min-h-screen flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs text-muted-foreground font-medium">Loading position details...</p>
        </div>
      </BluHireBackground>
    );
  }

  if (!job) {
    return (
      <BluHireBackground showConstellation={true}>
        <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-4 text-center">
          <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h2 className="text-lg font-bold text-foreground dark:text-white">Job opening not found or no longer active.</h2>
          <Link href="/careers">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 rounded-xl transition cursor-pointer">
              Back to Careers
            </Button>
          </Link>
        </div>
      </BluHireBackground>
    );
  }

  return (
    <BluHireBackground showConstellation={true} className="pb-16">
      {/* Navbar Header */}
      <header className="h-16 bg-card/85 dark:bg-[#0e101e]/80 backdrop-blur-2xl border-b border-border/80 dark:border-white/10 flex items-center px-6 sm:px-10 shadow-xs sticky top-0 z-50">
        <Link href="/careers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Back to Career Portal</span>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto py-10 px-6">
        {/* Main Job Banner */}
        <div className="border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/90 backdrop-blur-2xl p-6 sm:p-8 rounded-2xl shadow-xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary dark:text-violet-300 border border-primary/25 px-2.5 py-1 rounded-md">
                  {job.employmentType.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono font-semibold text-muted-foreground dark:text-zinc-400 bg-muted/60 dark:bg-white/[0.04] px-2 py-0.5 rounded">
                  {job.jobCode}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground dark:text-white tracking-tight">
                {job.title}
              </h1>
              <p className="text-xs text-muted-foreground dark:text-zinc-400 font-medium">
                {job.departmentId?.name || 'General Department'}
              </p>
            </div>
            
            <div className="shrink-0">
              <Link href={`/careers/apply/${job._id}`}>
                <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold px-7 py-5.5 rounded-xl shadow-lg shadow-indigo-600/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all cursor-pointer">
                  Apply for this position
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/80 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider">Location</p>
                <p className="text-xs font-bold text-foreground dark:text-white mt-0.5">{job.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider">Openings</p>
                <p className="text-xs font-bold text-foreground dark:text-white mt-0.5">{job.openings} {job.openings > 1 ? 'positions' : 'position'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider">Salary Range</p>
                <p className="text-xs font-bold text-foreground dark:text-white mt-0.5">
                  {job.salaryMin && job.salaryMax
                    ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                    : 'Competitive'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider">Experience</p>
                <p className="text-xs font-bold text-foreground dark:text-white mt-0.5">{job.experienceRequired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Spec Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {/* Job Description */}
            <Card className="border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xs overflow-hidden">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-base font-bold text-foreground dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Role Overview
                </h3>
                <div className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                  {job.description}
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            <Card className="border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xs overflow-hidden">
              <CardContent className="p-6 space-y-3">
                <h3 className="text-base font-bold text-foreground dark:text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  Key Responsibilities
                </h3>
                <div className="text-xs text-muted-foreground dark:text-zinc-400 leading-relaxed whitespace-pre-wrap font-sans">
                  {job.responsibilities}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar details */}
          <div className="space-y-6">
            {/* Skills Profile */}
            <Card className="border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xs overflow-hidden">
              <CardContent className="p-6 font-sans space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground dark:text-white mb-3 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Required Skills
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {job.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/60 dark:bg-white/[0.05] border border-border/60 dark:border-white/10 text-foreground/90 dark:text-zinc-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {job.preferredSkills && job.preferredSkills.length > 0 && (
                  <div className="pt-2 border-t border-border/80 dark:border-white/10">
                    <h4 className="text-xs font-bold text-foreground dark:text-white mb-3 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      Preferred Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.preferredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary dark:text-violet-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Qualifications profile */}
            <Card className="border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xs overflow-hidden">
              <CardContent className="p-6 font-sans">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <GraduationCap className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] uppercase font-bold text-muted-foreground dark:text-zinc-400 tracking-wider">Education Required</h5>
                    <p className="text-xs font-bold text-foreground dark:text-white mt-1">{job.educationRequired}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </BluHireBackground>
  );
}
