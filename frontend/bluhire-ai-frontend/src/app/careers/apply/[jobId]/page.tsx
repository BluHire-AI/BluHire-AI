'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { recruitmentService, Job } from '@/services/recruitment.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

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
      <div className="min-h-screen bg-zinc-50 dark:bg-[#070b13] flex items-center justify-center text-zinc-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
        Initialising application environment...
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

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#070b13] flex items-center justify-center p-6 font-sans">
        <Card className="max-w-md w-full bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 p-8 rounded-3xl shadow-lg text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-black mb-2 text-zinc-800 dark:text-zinc-100">
            Application Received!
          </CardTitle>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
            Thank you for applying for the **{job.title}** position. Our recruitment team will review your credentials and get back to you shortly.
          </p>
          <Link href="/careers">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl">
              Back to Career Opportunities
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070b13] text-zinc-900 dark:text-zinc-100 font-sans pb-16">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-[#0e1422] border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center px-8 shadow-sm">
        <Link href={`/careers/jobs/${job._id}`} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Back to Job Specifications</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-6">
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl overflow-hidden shadow-sm">
          <CardHeader className="p-8 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-[#111827]/10">
            <CardTitle className="text-xl font-black text-zinc-800 dark:text-zinc-100">
              Application Form
            </CardTitle>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 font-medium">
              You are applying for the <span className="font-bold text-zinc-700 dark:text-zinc-300">{job.title}</span> position ({job.jobCode}).
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="jane.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Skills and Background */}
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Key Skills (Comma-separated)</Label>
                <Input
                  id="skills"
                  type="text"
                  placeholder="React, TypeScript, Next.js, Node.js"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Total Experience (Years)</Label>
                  <Input
                    id="experience"
                    type="text"
                    placeholder="4 years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Highest Education Qualification</Label>
                  <Input
                    id="education"
                    type="text"
                    placeholder="Bachelor of Science in CS"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Employment details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentCompany" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Current Company</Label>
                  <Input
                    id="currentCompany"
                    type="text"
                    placeholder="Tech Corp Inc."
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentDesignation" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Current Designation</Label>
                  <Input
                    id="currentDesignation"
                    type="text"
                    placeholder="Software Engineer"
                    value={currentDesignation}
                    onChange={(e) => setCurrentDesignation(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedSalary" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Expected Salary (Annual USD)</Label>
                  <Input
                    id="expectedSalary"
                    type="number"
                    placeholder="120000"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noticePeriod" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Notice Period</Label>
                  <Input
                    id="noticePeriod"
                    type="text"
                    placeholder="30 days"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio" className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Portfolio/GitHub URL</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://github.com/username"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Resume File Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Upload Resume <span className="text-red-500">*</span></Label>
                <div className="border-2 border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-500/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-all relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 flex items-center justify-center mb-3">
                    {resumeFile ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </div>
                  {resumeFile ? (
                    <div>
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{resumeFile.name}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Drag & drop resume here, or click to upload</p>
                      <p className="text-[10px] text-zinc-400 font-medium mt-1">Accepts PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 text-white font-extrabold py-6 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md"
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting Application...' : 'Submit Job Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
