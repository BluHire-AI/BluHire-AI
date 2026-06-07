'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { recruitmentService, Job } from '@/services/recruitment.service';
import { departmentService, Department } from '@/services/department.service';
import { designationService, Designation } from '@/services/designation.service';
import { Briefcase, MapPin, Search, Edit3, Trash2, CheckCircle2, XCircle, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function JobsManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [deptId, setDeptId] = useState('');
  const [desigId, setDesigId] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [empType, setEmpType] = useState('FULL_TIME');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [openings, setOpenings] = useState('1');
  const [status, setStatus] = useState('DRAFT');

  async function loadData() {
    try {
      setLoading(true);
      const jobsData = await recruitmentService.listJobs({ limit: 100 });
      setJobs(jobsData.jobs);

      const depts = await departmentService.getActive();
      setDepartments(depts);

      const desigs = await designationService.getAll();
      setDesignations(desigs);
    } catch (error) {
      console.error('Failed to load jobs list data:', error);
      toast.error('Error loading recruitment data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingJob(null);
    setTitle('');
    setDeptId(departments[0]?._id || '');
    setDesigId(designations[0]?._id || '');
    setDescription('');
    setResponsibilities('');
    setRequiredSkills('');
    setPreferredSkills('');
    setExperience('2-4 years');
    setEducation("Bachelor's Degree");
    setEmpType('FULL_TIME');
    setLocation('HQ Office');
    setSalaryMin('');
    setSalaryMax('');
    setOpenings('1');
    setStatus('DRAFT');
    setModalOpen(true);
  };

  const openEditModal = (job: Job) => {
    setEditingJob(job);
    setTitle(job.title);
    setDeptId(job.departmentId?._id || '');
    setDesigId(job.designationId?._id || '');
    setDescription(job.description);
    setResponsibilities(job.responsibilities);
    setRequiredSkills(job.requiredSkills.join(', '));
    setPreferredSkills(job.preferredSkills?.join(', ') || '');
    setExperience(job.experienceRequired);
    setEducation(job.educationRequired);
    setEmpType(job.employmentType);
    setLocation(job.location);
    setSalaryMin(job.salaryMin?.toString() || '');
    setSalaryMax(job.salaryMax?.toString() || '');
    setOpenings(job.openings.toString());
    setStatus(job.status);
    setModalOpen(true);
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !deptId || !desigId || !description || !responsibilities || !requiredSkills || !experience || !education || !location) {
      toast.error('Please enter all required specifications.');
      return;
    }

    const jobPayload = {
      title,
      departmentId: deptId,
      designationId: desigId,
      description,
      responsibilities,
      requiredSkills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      preferredSkills: preferredSkills ? preferredSkills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      experienceRequired: experience,
      educationRequired: education,
      employmentType: empType,
      location,
      salaryMin: salaryMin ? parseInt(salaryMin) : undefined,
      salaryMax: salaryMax ? parseInt(salaryMax) : undefined,
      openings: parseInt(openings) || 1,
      status: status as any,
    };

    try {
      if (editingJob) {
        await recruitmentService.updateJob(editingJob._id, jobPayload);
        toast.success('Job details updated successfully!');
      } else {
        await recruitmentService.createJob(jobPayload);
        toast.success('Job posted successfully!');
      }
      setModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to save job details.');
    }
  };

  const handlePublishToggle = async (job: Job, newStatus: 'OPEN' | 'CLOSED') => {
    try {
      await recruitmentService.updateJob(job._id, { status: newStatus });
      toast.success(`Job status changed to ${newStatus}`);
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle status.');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job post?')) return;
    try {
      await recruitmentService.deleteJob(jobId);
      toast.success('Job post deleted successfully');
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete job post.');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.jobCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#0e1422] p-1 rounded-xl">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-bold px-4 py-2 rounded-lg bg-white dark:bg-[#161f30] text-blue-600 dark:text-blue-400 shadow-sm cursor-pointer block">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
              Candidates
            </span>
          </Link>
          <Link href="/dashboard/recruitment/ai-interviews">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block transition-colors">
              AI Interviews
            </span>
          </Link>
        </div>
        <Button onClick={openCreateModal} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 rounded-lg h-9">
          <Plus className="w-4 h-4" />
          Create Job
        </Button>
      </div>

      {/* Toolbar Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-[#0e1422] p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search job title or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 rounded-xl"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-50 dark:bg-[#161f30] text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="OPEN">Open/Published</option>
            <option value="CLOSED">Closed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>
        </div>
      </div>

      {/* Jobs Table List */}
      <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-zinc-400 font-semibold flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
            Loading jobs records...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">No job positions found.</div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-[#111827]/40">
              <TableRow>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Job Code</TableHead>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Job Title</TableHead>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Department</TableHead>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Status</TableHead>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Openings</TableHead>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job._id} className="hover:bg-zinc-50/30 dark:hover:bg-[#111827]/10 transition-colors">
                  <TableCell className="text-xs font-bold text-zinc-500">{job.jobCode}</TableCell>
                  <TableCell className="text-xs font-black text-zinc-800 dark:text-zinc-100">{job.title}</TableCell>
                  <TableCell className="text-xs text-zinc-600 dark:text-zinc-400">{job.departmentId?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                        job.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : job.status === 'CLOSED'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                          : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{job.openings}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1.5 h-12">
                    <Link href={`/careers/jobs/${job._id}`} target="_blank">
                      <Button size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850">
                        <Eye className="w-4 h-4 text-zinc-400" />
                      </Button>
                    </Link>
                    <Button onClick={() => openEditModal(job)} size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850">
                      <Edit3 className="w-4 h-4 text-blue-500" />
                    </Button>
                    {job.status === 'DRAFT' || job.status === 'CLOSED' ? (
                      <Button onClick={() => handlePublishToggle(job, 'OPEN')} size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </Button>
                    ) : (
                      <Button onClick={() => handlePublishToggle(job, 'CLOSED')} size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850">
                        <XCircle className="w-4 h-4 text-amber-500" />
                      </Button>
                    )}
                    <Button onClick={() => handleDeleteJob(job._id)} size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Creation/Edit Dialog Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 border-zinc-200/80 dark:border-zinc-800/80">
          <DialogHeader>
            <DialogTitle className="text-base font-black">
              {editingJob ? 'Modify Job Details' : 'Post New Job Position'}
            </DialogTitle>
            <DialogDescription className="text-xs">Provide details for the recruitment listing.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveJob} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs font-bold">Job Title *</Label>
              <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl text-xs h-9" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dept" className="text-xs font-bold">Department *</Label>
                <select
                  id="dept"
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#161f30] text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none h-9"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="desig" className="text-xs font-bold">Designation *</Label>
                <select
                  id="desig"
                  value={desigId}
                  onChange={(e) => setDesigId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#161f30] text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none h-9"
                >
                  {designations.map((d) => (
                    <option key={d._id} value={d._id}>{d.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-bold">Role Overview *</Label>
              <Textarea id="desc" required placeholder="Describe the responsibilities and background of the role." value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl text-xs min-h-[80px]" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="resps" className="text-xs font-bold">Key Responsibilities *</Label>
              <Textarea id="resps" required placeholder="Outline list of responsibilities..." value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} className="rounded-xl text-xs min-h-[80px]" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="reqS" className="text-xs font-bold">Required Skills (Comma-separated) *</Label>
                <Input id="reqS" required placeholder="React, Node.js, SQL" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prefS" className="text-xs font-bold">Preferred Skills (Comma-separated)</Label>
                <Input id="prefS" placeholder="Docker, AWS S3" value={preferredSkills} onChange={(e) => setPreferredSkills(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="exp" className="text-xs font-bold">Experience Required *</Label>
                <Input id="exp" required value={experience} onChange={(e) => setExperience(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edu" className="text-xs font-bold">Education Required *</Label>
                <Input id="edu" required value={education} onChange={(e) => setEducation(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-xs font-bold">Employment Type *</Label>
                <select
                  id="type"
                  value={empType}
                  onChange={(e) => setEmpType(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#161f30] text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none h-9"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc" className="text-xs font-bold">Location *</Label>
                <Input id="loc" required value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="open" className="text-xs font-bold">Openings *</Label>
                <Input id="open" type="number" required value={openings} onChange={(e) => setOpenings(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="salMin" className="text-xs font-bold">Salary Min ($)</Label>
                <Input id="salMin" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salMax" className="text-xs font-bold">Salary Max ($)</Label>
                <Input id="salMax" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="rounded-xl text-xs h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold">Status *</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-[#161f30] text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none h-9"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open (Publish)</option>
                  <option value="CLOSED">Closed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="text-xs rounded-xl">Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl">Save Specifications</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
