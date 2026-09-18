'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Upload, FileText, CheckCircle2, AlertCircle, Briefcase } from 'lucide-react';
import { recruitmentService, Job } from '@/services/recruitment.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { BluHireBackground } from '@/components/layout/BluHireBackground';

export default function ApplyPage() {
  const router = useRouter();
  const { jobId } = useParams() as { jobId: string };
  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Fields State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentDesignation, setCurrentDesignation] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  useEffect(() => {
    async function loadJob() {
      try {
        setLoadingJob(true);
        const data = await recruitmentService.getPublicJob(jobId);
        setJob(data);
      } catch (error) {
        console.error('Failed to load job specs:', error);
      } finally {
        setLoadingJob(false);
      }
    }
    if (jobId) loadJob();
  }, [jobId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'doc' && ext !== 'docx') {
        toast.error('Only PDF or Word documents (.doc, .docx) are allowed.');
        e.target.value = '';
        return;
      }
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !phone || !resumeFile) {
      toast.error('Please fill in all required fields and upload your resume.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('experience', experience);
      formData.append('education', education);
      formData.append('currentCompany', currentCompany);
      formData.append('currentDesignation', currentDesignation);
      formData.append('expectedSalary', expectedSalary);
      formData.append('noticePeriod', noticePeriod);
      formData.append('linkedinUrl', linkedinUrl);
      formData.append('portfolioUrl', portfolioUrl);
      formData.append('resume', resumeFile);

      // Parse skills into array format
      const skillsArray = skills.split(',').map((s) => s.trim()).filter(Boolean);
      formData.append('skills', JSON.stringify(skillsArray));

      await recruitmentService.applyToJob(formData);
      setSuccess(true);
      toast.success('Application submitted successfully!');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to submit application';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingJob) {
    return (
      <BluHireBackground showConstellation={true}>
        <div className="min-h-screen flex flex-col items-center justify-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-xs text-muted-foreground font-medium">Preparing application environment...</p>
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

  if (success) {
    return (
      <BluHireBackground showConstellation={true} containerClassName="items-center justify-center p-6">
        <Card className="max-w-md w-full border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/90 backdrop-blur-2xl p-8 rounded-2xl shadow-xl text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5 shadow-xs">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <CardTitle className="text-xl font-bold text-foreground dark:text-white mb-2">
            Application Received!
          </CardTitle>
          <p className="text-xs text-muted-foreground dark:text-zinc-400 mb-6 leading-relaxed">
            Thank you for applying for the <span className="font-semibold text-foreground dark:text-white">{job.title}</span> position. Our talent acquisition team will review your qualifications and update you promptly.
          </p>
          <Link href="/careers">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-indigo-600/15 cursor-pointer">
              Back to Career Opportunities
            </Button>
          </Link>
        </Card>
      </BluHireBackground>
    );
  }

  return (
    <BluHireBackground showConstellation={true} className="pb-16">
      {/* Header */}
      <header className="h-16 bg-card/85 dark:bg-[#0e101e]/80 backdrop-blur-2xl border-b border-border/80 dark:border-white/10 flex items-center px-6 sm:px-10 shadow-xs sticky top-0 z-50">
        <Link href={`/careers/jobs/${job._id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Back to Job Specifications</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto py-10 px-6">
        <Card className="border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardHeader className="p-6 sm:p-8 border-b border-border/80 dark:border-white/10 bg-muted/20 dark:bg-white/[0.01]">
            <CardTitle className="text-xl font-bold text-foreground dark:text-white">
              Application Form
            </CardTitle>
            <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1">
              You are applying for <span className="font-semibold text-primary dark:text-violet-300">{job.title}</span> (<span className="font-mono">{job.jobCode}</span>).
            </p>
          </CardHeader>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">First Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Last Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="jane.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Phone Number <span className="text-destructive">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              {/* Skills and Background */}
              <div className="space-y-1.5">
                <Label htmlFor="skills" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Key Skills (Comma-separated)</Label>
                <Input
                  id="skills"
                  type="text"
                  placeholder="React, TypeScript, Next.js, Python"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="experience" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Total Experience</Label>
                  <Input
                    id="experience"
                    type="text"
                    placeholder="4 years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="education" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Highest Education Qualification</Label>
                  <Input
                    id="education"
                    type="text"
                    placeholder="Bachelor of Science in CS"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              {/* Employment details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="currentCompany" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Current Company</Label>
                  <Input
                    id="currentCompany"
                    type="text"
                    placeholder="Tech Corp Inc."
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="currentDesignation" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Current Designation</Label>
                  <Input
                    id="currentDesignation"
                    type="text"
                    placeholder="Software Engineer"
                    value={currentDesignation}
                    onChange={(e) => setCurrentDesignation(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expectedSalary" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Expected Salary (Annual USD)</Label>
                  <Input
                    id="expectedSalary"
                    type="number"
                    placeholder="120000"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="noticePeriod" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Notice Period</Label>
                  <Input
                    id="noticePeriod"
                    type="text"
                    placeholder="30 days"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="linkedin" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="portfolio" className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Portfolio / GitHub URL</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://github.com/username"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-xs text-foreground dark:text-white h-10.5 focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
                  />
                </div>
              </div>

              {/* Resume File Upload */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Upload Resume <span className="text-destructive">*</span></Label>
                <div className="border-2 border-dashed border-border/80 dark:border-white/15 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/25 flex items-center justify-center mb-3">
                    {resumeFile ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </div>
                  {resumeFile ? (
                    <div>
                      <p className="text-xs font-bold text-foreground dark:text-white">{resumeFile.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-foreground/90 dark:text-zinc-300">Drag & drop resume here, or click to browse</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Accepts PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold h-11 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 dark:shadow-[0_0_20px_rgba(99,102,241,0.25)] transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting Application...' : 'Submit Job Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </BluHireBackground>
  );
}
