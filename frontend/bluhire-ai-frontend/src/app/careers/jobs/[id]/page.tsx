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
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-muted-foreground font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
        Loading job specifications...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8 font-sans">
        <h2 className="text-xl font-bold text-foreground mb-4">Job opening not found or no longer active.</h2>
        <Link href="/careers">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-xl transition">
            Back to Careers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground font-sans pb-16">
      {/* Navbar Header */}
      <header className="h-16 bg-card/40 backdrop-blur-xl border-b border-border flex items-center px-8 shadow-lg sticky top-0 z-50">
        <Link href="/careers" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-small-label">Back to Career Portal</span>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        {/* Main Job Banner */}
        <div className="glass bg-card/40 border border-border p-8 rounded-3xl shadow-2xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-small-label bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded inline-block mb-3">
                {job.employmentType.replace('_', ' ')}
              </span>
              <h1 className="text-h1 text-white">
                {job.title}
              </h1>
              <p className="text-body-copy text-muted-foreground mt-1">
                {job.departmentId?.name} • <span className="font-mono">{job.jobCode}</span>
              </p>
            </div>
            <div>
              <Link href={`/careers/apply/${job._id}`}>
                <Button size="lg" className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-extrabold px-8 py-6 rounded-xl shadow-lg shadow-primary/15 transition-all duration-300 cursor-pointer">
                  Apply for this position
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-primary">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-small-label text-muted-foreground">Location</p>
                <p className="text-grid font-bold text-foreground">{job.location}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-primary">
                <Clock className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-small-label text-muted-foreground">Openings</p>
                <p className="text-grid font-bold text-foreground">{job.openings} vacant</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-primary">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-small-label text-muted-foreground">Salary Range</p>
                <p className="text-grid font-bold text-foreground">
                  {job.salaryMin && job.salaryMax
                    ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                    : 'Undisclosed'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-muted/50 border border-border flex items-center justify-center text-primary">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-small-label text-muted-foreground">Experience</p>
                <p className="text-grid font-bold text-foreground">{job.experienceRequired}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Spec Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* Job Description */}
            <Card className="glass bg-card/35 border border-border rounded-2xl overflow-hidden shadow-none">
              <CardContent className="p-8">
                <h3 className="text-h2 text-primary mb-4">
                  Role Overview
                </h3>
                <div className="text-body-copy leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans">
                  {job.description}
                </div>
              </CardContent>
            </Card>

            {/* Responsibilities */}
            <Card className="glass bg-card/35 border border-border rounded-2xl overflow-hidden shadow-none">
              <CardContent className="p-8">
                <h3 className="text-h2 text-primary mb-4">
                  Key Responsibilities
                </h3>
                <div className="text-body-copy leading-relaxed text-muted-foreground whitespace-pre-wrap font-sans">
                  {job.responsibilities}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar details */}
          <div className="space-y-6">
            {/* Skills Profile */}
            <Card className="glass bg-card/35 border border-border rounded-2xl overflow-hidden shadow-none">
              <CardContent className="p-6 font-sans">
                <h4 className="text-small-label text-muted-foreground mb-4 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {job.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="text-small-label px-2.5 py-1 rounded bg-muted border border-border text-muted-foreground normal-case font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {job.preferredSkills && job.preferredSkills.length > 0 && (
                  <>
                    <h4 className="text-small-label text-muted-foreground mt-6 mb-4 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      Preferred Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.preferredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="text-small-label px-2.5 py-1 rounded bg-muted border border-border text-muted-foreground normal-case font-semibold"
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
            <Card className="glass bg-card/35 border border-border rounded-2xl overflow-hidden shadow-none">
              <CardContent className="p-6 space-y-4 font-sans">
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h5 className="text-small-label text-muted-foreground">Education Required</h5>
                    <p className="text-body-copy text-foreground mt-0.5">{job.educationRequired}</p>
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
