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
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center text-muted-foreground font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3" />
        Initialising application environment...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8 font-sans">
        <h2 className="text-h2 text-foreground mb-4">Job opening not found or no longer active.</h2>
        <Link href="/careers">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 py-2 rounded-xl transition">
            Back to Careers
          </Button>
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6 font-sans">
        <Card className="max-w-md w-full glass bg-card/40 border border-border p-8 rounded-3xl shadow-2xl text-center glow-primary/5">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success border border-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <CardTitle className="text-h2 mb-2 text-foreground">
            Application Received!
          </CardTitle>
          <p className="text-body-copy text-muted-foreground mb-8">
            Thank you for applying for the <span className="font-bold text-primary">{job.title}</span> position. Our recruitment team will review your credentials and get back to you shortly.
          </p>
          <Link href="/careers">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-xl shadow-md shadow-primary/10 cursor-pointer">
              Back to Career Opportunities
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-foreground font-sans pb-16">
      {/* Header */}
      <header className="h-16 bg-card/40 backdrop-blur-xl border-b border-border flex items-center px-8 shadow-lg sticky top-0 z-50">
        <Link href={`/careers/jobs/${job._id}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-small-label">Back to Job Specifications</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-6">
        <Card className="glass bg-card/35 border border-border rounded-3xl overflow-hidden shadow-2xl">
          <CardHeader className="p-8 border-b border-border bg-card/25">
            <CardTitle className="text-h2 text-foreground">
              Application Form
            </CardTitle>
            <p className="text-body-copy text-muted-foreground mt-1.5">
              You are applying for the <span className="font-bold text-primary">{job.title}</span> position (<span className="font-mono">{job.jobCode}</span>).
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-small-label text-muted-foreground">First Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-small-label text-muted-foreground">Last Name <span className="text-red-500">*</span></Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-small-label text-muted-foreground">Email Address <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="jane.doe@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-small-label text-muted-foreground">Phone Number <span className="text-red-500">*</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
              </div>

              {/* Skills and Background */}
              <div className="space-y-2">
                <Label htmlFor="skills" className="text-small-label text-muted-foreground">Key Skills (Comma-separated)</Label>
                <Input
                  id="skills"
                  type="text"
                  placeholder="React, TypeScript, Next.js, Node.js"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-small-label text-muted-foreground">Total Experience (Years)</Label>
                  <Input
                    id="experience"
                    type="text"
                    placeholder="4 years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education" className="text-small-label text-muted-foreground">Highest Education Qualification</Label>
                  <Input
                    id="education"
                    type="text"
                    placeholder="Bachelor of Science in CS"
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
              </div>

              {/* Employment details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentCompany" className="text-small-label text-muted-foreground">Current Company</Label>
                  <Input
                    id="currentCompany"
                    type="text"
                    placeholder="Tech Corp Inc."
                    value={currentCompany}
                    onChange={(e) => setCurrentCompany(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentDesignation" className="text-small-label text-muted-foreground">Current Designation</Label>
                  <Input
                    id="currentDesignation"
                    type="text"
                    placeholder="Software Engineer"
                    value={currentDesignation}
                    onChange={(e) => setCurrentDesignation(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expectedSalary" className="text-small-label text-muted-foreground">Expected Salary (Annual USD)</Label>
                  <Input
                    id="expectedSalary"
                    type="number"
                    placeholder="120000"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="noticePeriod" className="text-small-label text-muted-foreground">Notice Period</Label>
                  <Input
                    id="noticePeriod"
                    type="text"
                    placeholder="30 days"
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
              </div>

              {/* URLs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-small-label text-muted-foreground">LinkedIn Profile URL</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="portfolio" className="text-small-label text-muted-foreground">Portfolio/GitHub URL</Label>
                  <Input
                    id="portfolio"
                    type="url"
                    placeholder="https://github.com/username"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="rounded-xl bg-muted/40 border-border text-foreground hover:bg-muted/60 focus-visible:ring-primary focus-visible:ring-offset-0 focus:outline-none"
                  />
                </div>
              </div>

              {/* Resume File Upload */}
              <div className="space-y-2">
                <Label className="text-small-label text-muted-foreground">Upload Resume <span className="text-red-500">*</span></Label>
                <div className="border-2 border-dashed border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all relative">
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-3">
                    {resumeFile ? <FileText className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                  </div>
                  {resumeFile ? (
                    <div>
                      <p className="text-grid font-bold text-foreground">{resumeFile.name}</p>
                      <p className="text-small-label normal-case text-muted-foreground mt-0.5">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-grid font-bold text-muted-foreground">Drag & drop resume here, or click to upload</p>
                      <p className="text-small-label normal-case text-muted-foreground/60 mt-1">Accepts PDF, DOC, DOCX up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/95 disabled:bg-muted text-primary-foreground text-grid font-bold py-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/15 transition-all cursor-pointer"
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
