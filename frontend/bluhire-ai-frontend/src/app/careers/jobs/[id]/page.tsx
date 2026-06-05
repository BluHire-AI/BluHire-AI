'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Briefcase, MapPin, Clock, DollarSign, Award, GraduationCap, CheckCircle } from 'lucide-react';
import { recruitmentService, Job } from '@/services/recruitment.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
      <div className="min-h-screen bg-zinc-50 dark:bg-[#070b13] flex items-center justify-center text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
        Loading job specifications...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#070b13] flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-200 mb-4">Job opening not found or no longer active.</h2>
        <Link href="/careers">
          <Button>Back to Careers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070b13] text-zinc-900 dark:text-zinc-100 font-sans pb-16">
      {/* Navbar Header */}
      <header className="h-16 bg-white dark:bg-[#0e1422] border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center px-8 shadow-sm">
        <Link href="/careers" className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Career Portal</span>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        {/* Main Job Banner */}
        <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/80 dark:border-zinc-800/80 p-8 rounded-3xl shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 tracking-wider uppercase inline-block mb-3">
                {job.employmentType.replace('_', ' ')}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">
                {job.title}
              </h1>
              <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
                {job.departmentId?.name} • {job.jobCode}
              </p>
            </div>
            <div>
              <Link href={`/careers/apply/${job._id}`}>
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-8 py-6 rounded-xl shadow-md transition-all duration-300">
                  Apply for this position
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-850">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#161f30] flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase">Location</p>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{job.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#161f30] flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase">Openings</p>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{job.openings} vacant</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#161f30] flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase">Salary Range</p>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {job.salaryMin && job.salaryMax
                    ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                    : 'Undisclosed'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-[#161f30] flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold uppercase">Experience</p>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{job.experienceRequired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Spec Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Job Description */}
            <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-none">
              <CardContent className="p-8">
                <h3 className="text-base font-extrabold mb-4 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Role Overview
                </h3>
                <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                  {job.description}
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-none">
              <CardContent className="p-8">
                <h3 className="text-base font-extrabold mb-4 uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  Key Responsibilities
                </h3>
                <div className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                  {job.responsibilities}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar details */}
          <div className="space-y-6">
            {/* Skills Profile */}
            <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-none">
              <CardContent className="p-6">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[10px] font-bold px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-700/40"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {job.preferredSkills && job.preferredSkills.length > 0 && (
                  <>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 mt-6 mb-4 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-purple-500" />
                      Preferred Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.preferredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-bold px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/40 dark:border-zinc-700/40"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Qualifications profile */}
            <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-none">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-zinc-400 mt-0.5" />
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Education Required</h5>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{job.educationRequired}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
