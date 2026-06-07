'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { recruitmentService, Job } from '@/services/recruitment.service';
import { departmentService, Department } from '@/services/department.service';
import { designationService, Designation } from '@/services/designation.service';
import { Briefcase, MapPin, Search, Edit3, Trash2, CheckCircle2, XCircle, Plus, Eye, RefreshCw } from 'lucide-react';
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
    <div className="space-y-6 select-none">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block border border-transparent">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white shadow-sm cursor-pointer block">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block border border-transparent">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block border border-transparent">
              Candidates
            </span>
          </Link>
          <Link href="/dashboard/recruitment/interviews">
            <span className="text-xs font-semibold px-4 py-2 rounded-lg text-zinc-400 hover:text-white cursor-pointer block transition-colors border border-transparent">
              AI Voice Interviews
            </span>
          </Link>
        </div>
        <Button onClick={openCreateModal} size="sm" className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/10 shadow-lg shadow-indigo-600/10 cursor-pointer h-9 px-4 gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Create Job
        </Button>
      </div>

      {/* Toolbar Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card/45 p-4 rounded-2xl border border-white/5 shadow-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-450" />
          <Input
            placeholder="Search job title or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 bg-white/5 border-white/5 focus:border-indigo-500/50 focus:ring-indigo-500/20 text-white rounded-xl"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/5 hover:bg-white/10 text-xs font-semibold px-3 py-2 rounded-xl border border-white/5 text-zinc-300 focus:outline-none cursor-pointer"
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
      <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-zinc-500 font-semibold flex items-center justify-center">
            <RefreshCw className="animate-spin h-5 w-5 text-indigo-400 mr-2" />
            Loading jobs records...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-xs">No job positions found.</div>
        ) : (
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/5">
              <TableRow className="hover:bg-transparent border-b border-white/5">
                <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-450 border-b border-white/5">Job Code</TableHead>
                <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-450 border-b border-white/5">Job Title</TableHead>
                <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-455 border-b border-white/5">Department</TableHead>
                <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-455 border-b border-white/5">Status</TableHead>
                <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-455 border-b border-white/5">Openings</TableHead>
                <TableHead className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-455 border-b border-white/5 text-right w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job._id} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                  <TableCell className="text-xs font-mono font-semibold text-zinc-400">{job.jobCode}</TableCell>
                  <TableCell className="text-xs font-bold text-white">{job.title}</TableCell>
                  <TableCell className="text-xs text-zinc-300">{job.departmentId?.name || 'Unassigned'}</TableCell>
                  <TableCell>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                        job.status === 'OPEN'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          : job.status === 'CLOSED'
                          ? 'bg-rose-500/10 text-rose-350 border-rose-500/20'
                          : 'bg-white/5 text-zinc-400 border-white/5'
                      }`}
                    >
                      {job.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-zinc-300">{job.openings}</TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1.5 h-12">
                    <Link href={`/careers/jobs/${job._id}`} target="_blank">
                      <Button size="icon" variant="ghost" className="w-7 h-7 rounded-lg hover:bg-white/5 text-zinc-450 hover:text-white cursor-pointer border border-transparent">
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button onClick={() => openEditModal(job)} size="icon" variant="ghost" className="w-7 h-7 rounded-lg hover:bg-white/5 text-indigo-400 hover:text-white cursor-pointer border border-transparent">
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    {job.status === 'DRAFT' || job.status === 'CLOSED' ? (
                      <Button onClick={() => handlePublishToggle(job, 'OPEN')} size="icon" variant="ghost" className="w-7 h-7 rounded-lg hover:bg-white/5 text-emerald-450 hover:text-white cursor-pointer border border-transparent">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <Button onClick={() => handlePublishToggle(job, 'CLOSED')} size="icon" variant="ghost" className="w-7 h-7 rounded-lg hover:bg-white/5 text-amber-500 hover:text-white cursor-pointer border border-transparent">
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button onClick={() => handleDeleteJob(job._id)} size="icon" variant="ghost" className="w-7 h-7 rounded-lg hover:bg-white/5 text-red-400 hover:text-white cursor-pointer border border-transparent">
                      <Trash2 className="w-3.5 h-3.5" />
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
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 bg-card/95 border-white/5 text-white backdrop-blur-3xl shadow-2xl">
          <DialogHeader className="border-b border-white/5 pb-4 mb-4">
            <DialogTitle className="text-sm font-bold text-white">
              {editingJob ? 'Modify Job Details' : 'Post New Job Position'}
            </DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-400">Provide details for the recruitment listing.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveJob} className="space-y-4 py-2 text-white">
            <div className="space-y-1">
              <Label htmlFor="title" className="text-xs font-semibold text-zinc-300">Job Title *</Label>
              <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl text-xs h-10 bg-white/5 border-white/5 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="dept" className="text-xs font-semibold text-zinc-300">Department *</Label>
                <select
                  id="dept"
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full bg-zinc-900 text-xs font-semibold px-3 py-2 rounded-xl border border-white/5 text-zinc-300 focus:outline-none h-10 cursor-pointer"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="desig" className="text-xs font-semibold text-zinc-300">Designation *</Label>
                <select
                  id="desig"
                  value={desigId}
                  onChange={(e) => setDesigId(e.target.value)}
                  className="w-full bg-zinc-900 text-xs font-semibold px-3 py-2 rounded-xl border border-white/5 text-zinc-300 focus:outline-none h-10 cursor-pointer"
                >
                  {designations.map((d) => (
                    <option key={d._id} value={d._id}>{d.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="desc" className="text-xs font-semibold text-zinc-300">Role Overview *</Label>
              <Textarea id="desc" required placeholder="Describe the responsibilities and background of the role." value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl text-xs min-h-[80px] bg-white/5 border-white/5 text-white" />
            </div>

            <div className="space-y-1">
              <Label htmlFor="resps" className="text-xs font-semibold text-zinc-300">Key Responsibilities *</Label>
              <Textarea id="resps" required placeholder="Outline list of responsibilities..." value={responsibilities} onChange={(e) => setResponsibilities(e.target.value)} className="rounded-xl text-xs min-h-[80px] bg-white/5 border-white/5 text-white" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="reqS" className="text-xs font-semibold text-zinc-300">Required Skills (Comma-separated) *</Label>
                <Input id="reqS" required placeholder="React, Node.js, SQL" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} className="rounded-xl text-xs h-10 bg-white/5 border-white/5 text-white" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prefS" className="text-xs font-semibold text-zinc-300">Preferred Skills (Comma-separated)</Label>
                <Input id="prefS" placeholder="Docker, AWS S3" value={preferredSkills} onChange={(e) => setPreferredSkills(e.target.value)} className="rounded-xl text-xs h-10 bg-white/5 border-white/5 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="exp" className="text-xs font-semibold text-zinc-300">Experience Required *</Label>
                <Input id="exp" required value={experience} onChange={(e) => setExperience(e.target.value)} className="rounded-xl text-xs h-10 bg-white/5 border-white/5 text-white" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edu" className="text-xs font-semibold text-zinc-300">Education Required *</Label>
                <Input id="edu" required value={education} onChange={(e) => setEducation(e.target.value)} className="rounded-xl text-xs h-10 bg-white/5 border-white/5 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="type" className="text-xs font-semibold text-zinc-300">Employment Type *</Label>
                <select
                  id="type"
                  value={empType}
                  onChange={(e) => setEmpType(e.target.value)}
                  className="w-full bg-zinc-900 text-xs font-semibold px-3 py-2 rounded-xl border border-white/5 text-zinc-300 focus:outline-none h-10 cursor-pointer"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Internship</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="loc" className="text-xs font-semibold text-zinc-300">Location *</Label>
                <Input id="loc" required value={location} onChange={(e) => setLocation(e.target.value)} className="rounded-xl text-xs h-10 bg-white/5 border-white/5 text-white" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="open" className="text-xs font-semibold text-zinc-300">Openings *</Label>
                <Input id="open" type="number" required value={openings} onChange={(e) => setOpenings(e.target.value)} className="rounded-xl text-xs h-10 bg-white/5 border-white/5 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="salMin" className="text-xs font-semibold text-zinc-300">Salary Min ($)</Label>
                <Input id="salMin" type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="rounded-xl text-xs h-10 bg-white/5 border-white/5 text-white" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="salMax" className="text-xs font-semibold text-zinc-300">Salary Max ($)</Label>
                <Input id="salMax" type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="rounded-xl text-xs h-10 bg-white/5 border-white/5 text-white" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="status" className="text-xs font-semibold text-zinc-300">Status *</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-zinc-900 text-xs font-semibold px-3 py-2 rounded-xl border border-white/5 text-zinc-300 focus:outline-none h-10 cursor-pointer"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="OPEN">Open (Publish)</option>
                  <option value="CLOSED">Closed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="text-xs rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-zinc-300">Cancel</Button>
              <Button type="submit" className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/10 shadow-lg shadow-indigo-600/10 cursor-pointer">Save Specifications</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
