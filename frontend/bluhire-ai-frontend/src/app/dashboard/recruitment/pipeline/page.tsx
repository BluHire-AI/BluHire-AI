'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { recruitmentService, Application, Job } from '@/services/recruitment.service';
import { departmentService, Department } from '@/services/department.service';
import {
  FileText, Check, ChevronRight, Download, Briefcase, Calendar, Star,
  Award, Sparkles, Building, UserCheck, UserX, Info, Phone, Mail,
  Link as LinkIcon, Search, RotateCcw, HelpCircle, Layers, GraduationCap,
  MessageSquare, UserCircle2, ExternalLink, ArrowUpDown, ChevronLeft, X,
  UserPlus, FileSpreadsheet, Eye, MoreHorizontal, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

const ACTIVE_STAGES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'] as const;

export default function PipelineBoard() {
  const router = useRouter();
  
  // Data States
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Sorting State
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchSkill, setSearchSkill] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [selectedExperience, setSelectedExperience] = useState<string>('ALL');
  const [selectedAiScoreRange, setSelectedAiScoreRange] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionStage, setBulkActionStage] = useState<string>('');

  // Drawer Slide-out Panel State
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<string>('profile');
  const [submittingStage, setSubmittingStage] = useState(false);

  // Recruiter score/evaluation local state
  const [recruiterScoreVal, setRecruiterScoreVal] = useState<number>(3);
  const [recruiterNotesVal, setRecruiterNotesVal] = useState<string>('');

  // Hiring Modal States
  const [hiringModalOpen, setHiringModalOpen] = useState(false);
  const [hiringAppId, setHiringAppId] = useState<string | null>(null);
  const [hiringRole, setHiringRole] = useState<string>('EMPLOYEE');
  const [hiringDeptId, setHiringDeptId] = useState<string>('');
  const [hiringDesigId, setHiringDesigId] = useState<string>('');
  const [hiringManagerId, setHiringManagerId] = useState<string>('NONE');
  const [hiringJoiningDate, setHiringJoiningDate] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [activeEmployees, setActiveEmployees] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);

  // Fetch applications list with all query parameters
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams: any = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
      };

      if (searchQuery) queryParams.search = searchQuery;
      if (searchSkill) queryParams.skill = searchSkill;
      if (selectedJobId !== 'ALL') queryParams.jobId = selectedJobId;
      if (selectedStage !== 'ALL') queryParams.currentStage = selectedStage;
      if (selectedExperience !== 'ALL') queryParams.experience = selectedExperience;
      
      // Map AI Score filter range
      if (selectedAiScoreRange !== 'ALL') {
        if (selectedAiScoreRange === '90') queryParams.aiScoreMin = 90;
        else if (selectedAiScoreRange === '80') queryParams.aiScoreMin = 80;
        else if (selectedAiScoreRange === '70') queryParams.aiScoreMin = 70;
        else if (selectedAiScoreRange === 'low') queryParams.aiScoreMax = 69;
      }

      if (startDate) queryParams.startDate = startDate;
      if (endDate) queryParams.endDate = endDate;

      const response = await recruitmentService.listApplications(queryParams);
      setApplications(response.applications);
      setTotalItems(response.total);

      // Refresh global analytics counts
      const statsData = await recruitmentService.getAnalytics();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load candidate applications.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortOrder, searchQuery, searchSkill, selectedJobId, selectedStage, selectedExperience, selectedAiScoreRange, startDate, endDate]);

  // Load configuration metadata
  async function loadMetadata() {
    try {
      const jobsRes = await recruitmentService.listJobs({ limit: 100 });
      setJobs(jobsRes.jobs);

      const deptsRes = await departmentService.getActive();
      setDepartments(deptsRes);

      const desgsRes = await api.get('/designations');
      setDesignations(desgsRes.data?.data?.data || desgsRes.data?.data || []);
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  }

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStageChange = async (appId: string, newStage: string, stageNotes?: string) => {
    try {
      setSubmittingStage(true);
      const updated = await recruitmentService.moveStage(appId, newStage, stageNotes || 'Stage transitioned from candidate list');
      toast.success(`Candidate advanced to ${newStage} successfully!`);
      
      if (selectedApp?._id === appId) {
        setSelectedApp(prev => prev ? { ...prev, currentStage: newStage as any } : null);
      }
      
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update stage');
    } finally {
      setSubmittingStage(false);
    }
  };

  const fetchActiveEmployees = async () => {
    try {
      const response = await api.get('/employees?limit=100&employmentStatus=ACTIVE');
      setActiveEmployees(response.data?.data?.data || response.data?.data || []);
    } catch (err) {
      console.error("Failed to load active employees list", err);
    }
  };

  const handleHireCandidate = async (appId: string) => {
    const app = applications.find(a => a._id === appId) || selectedApp;
    if (!app) return;

    fetchActiveEmployees();

    setHiringAppId(appId);
    setHiringRole('EMPLOYEE');
    
    // Set default department and designation from job
    const deptId = app.jobId?.departmentId?._id || app.jobId?.departmentId || '';
    const desigId = app.jobId?.designationId?._id || app.jobId?.designationId || '';
    setHiringDeptId(typeof deptId === 'object' ? deptId._id : deptId);
    setHiringDesigId(typeof desigId === 'object' ? desigId._id : desigId);
    
    setHiringManagerId('NONE');
    setHiringJoiningDate(new Date().toISOString().substring(0, 10));
    setHiringModalOpen(true);
  };

  const submitHiring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hiringAppId) return;

    try {
      setSubmittingStage(true);
      
      const onboardingData = {
        employeeRole: hiringRole,
        departmentId: hiringDeptId || undefined,
        designationId: hiringDesigId || undefined,
        managerId: hiringManagerId === 'NONE' ? undefined : hiringManagerId,
        joiningDate: hiringJoiningDate ? new Date(hiringJoiningDate) : undefined
      };

      const updated = await recruitmentService.moveStage(
        hiringAppId, 
        'HIRED', 
        `Candidate hired successfully. Onboarded to role: ${hiringRole}.`, 
        onboardingData
      );

      toast.success('Candidate successfully hired and employee record created!');
      setHiringModalOpen(false);

      if (selectedApp?._id === hiringAppId) {
        setSelectedApp(prev => prev ? { ...prev, currentStage: 'HIRED' as any } : null);
      }

      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to complete hiring onboarding');
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleRejectCandidate = async (appId: string) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    await handleStageChange(appId, 'REJECTED', reason || 'Candidate rejected.');
  };

  const handleDownloadResume = async (filename?: string) => {
    if (!filename) {
      toast.error('No resume file linked.');
      return;
    }
    try {
      const blob = await recruitmentService.downloadResume(filename);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      toast.error('Could not download resume file.');
    }
  };

  // Toggle sorting fields
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchSkill('');
    setSelectedJobId('ALL');
    setSelectedStage('ALL');
    setSelectedExperience('ALL');
    setSelectedAiScoreRange('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Checkbox Selection Helpers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = applications.map(app => app._id);
      setSelectedIds(ids);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk Action Executions
  const handleBulkMove = async () => {
    if (!bulkActionStage) {
      toast.error('Please select a stage for bulk transition.');
      return;
    }
    try {
      setLoading(true);
      const results = await Promise.allSettled(
        selectedIds.map(id => recruitmentService.moveStage(id, bulkActionStage, 'Bulk stage transition.'))
      );

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

      if (rejected.length === 0) {
        toast.success(`Successfully moved ${selectedIds.length} candidates to ${bulkActionStage}`);
      } else {
        const errorMessages = rejected.map(r => {
          const reason = r.reason?.response?.data?.message || r.reason?.message || 'Unknown error';
          return `- ${reason}`;
        });
        const uniqueErrors = Array.from(new Set(errorMessages));

        toast.error(
          <div className="text-xs">
            <p className="font-bold">Failed to update {rejected.length} candidate{rejected.length !== 1 ? 's' : ''}.</p>
            <p className="mt-1 font-semibold">Reason:</p>
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[10px] opacity-90">
              {uniqueErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>,
          { duration: 8000 }
        );

        if (fulfilled.length > 0) {
          toast.success(`Successfully moved ${fulfilled.length} candidates to ${bulkActionStage}`);
        }
      }
      setSelectedIds([]);
      setBulkActionStage('');
      fetchApplications();
    } catch (error) {
      toast.error('Error occurred during bulk stage update.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkReject = async () => {
    const reason = window.prompt(`Reject ${selectedIds.length} candidates? Enter reason:`);
    if (reason === null) return;
    try {
      setLoading(true);
      const results = await Promise.allSettled(
        selectedIds.map(id => recruitmentService.moveStage(id, 'REJECTED', reason || 'Bulk rejected.'))
      );

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

      if (rejected.length === 0) {
        toast.success(`Rejected ${selectedIds.length} candidates successfully.`);
      } else {
        const errorMessages = rejected.map(r => {
          const reasonMsg = r.reason?.response?.data?.message || r.reason?.message || 'Unknown error';
          return `- ${reasonMsg}`;
        });
        const uniqueErrors = Array.from(new Set(errorMessages));

        toast.error(
          <div className="text-xs">
            <p className="font-bold">Failed to reject {rejected.length} candidate{rejected.length !== 1 ? 's' : ''}.</p>
            <p className="mt-1 font-semibold">Reason:</p>
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-[10px] opacity-90">
              {uniqueErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>,
          { duration: 8000 }
        );

        if (fulfilled.length > 0) {
          toast.success(`Rejected ${fulfilled.length} candidates successfully.`);
        }
      }
      setSelectedIds([]);
      fetchApplications();
    } catch (error) {
      toast.error('Error occurred during bulk rejection.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkExport = () => {
    // Generate CSV string
    const headers = 'Candidate Code,First Name,Last Name,Email,Job Title,Current Stage,AI Score,Experience\n';
    const rows = applications
      .filter(app => selectedIds.includes(app._id))
      .map(app => {
        const cand = app.candidateId;
        const job = app.jobId;
        return `"${cand?.candidateCode || ''}","${cand?.firstName || ''}","${cand?.lastName || ''}","${cand?.email || ''}","${job?.title || ''}","${app.currentStage}","${app.aiScore || 0}%","${cand?.experience || ''}"`;
      })
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `hrminds_ats_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Export download completed!');
  };

  const handleBulkSendEmail = () => {
    const selectedApps = applications.filter(app => selectedIds.includes(app._id));
    const emails = selectedApps.map(app => app.candidateId?.email).filter(Boolean);
    if (emails.length === 0) {
      toast.error('No emails found for selected candidates.');
      return;
    }
    window.location.href = `mailto:${emails.join(',')}?subject=BluHire-AI Recruitment Update`;
    toast.success('Opened mail composer link.');
  };

  const handleBulkAssign = () => {
    toast.success(`Assigned Recruiter to ${selectedIds.length} candidates (mock action completed).`);
    setSelectedIds([]);
  };

  const handleBulkScreen = async () => {
    try {
      setLoading(true);
      await recruitmentService.screenApplicationBulk(selectedIds);
      toast.success(`Successfully queued ${selectedIds.length} candidates for AI Resume screening.`);
      setSelectedIds([]);
      setTimeout(() => fetchApplications(), 2000);
    } catch (error) {
      toast.error('Failed to trigger bulk AI screening.');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScreening = async (appId: string) => {
    try {
      setSubmittingStage(true);
      await recruitmentService.screenApplication(appId);
      toast.success('Queued candidate for AI resume screening.');
      setTimeout(async () => {
        await fetchApplications();
        try {
          const response = await recruitmentService.getScreeningResult(appId);
          setSelectedApp(prev => prev ? {
            ...prev,
            screeningStatus: response.screeningStatus,
            aiScore: response.aiScore,
            aiRecommendation: response.aiRecommendation,
            matchingSkills: response.matchingSkills,
            missingSkills: response.missingSkills,
            screeningSummary: response.screeningSummary,
            notes: response.notes
          } : null);
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    } catch (error) {
      toast.error('Failed to start AI screening.');
    } finally {
      setSubmittingStage(false);
    }
  };

  // Star Rating helper
  const renderStars = (score?: number) => {
    const cleanScore = score || 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-3 h-3 ${star <= cleanScore ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`}
          />
        ))}
      </div>
    );
  };

  // Convert date format
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculation of stage count and percentage progression
  const stageStats = useMemo(() => {
    if (!stats || !stats.pipelineStats) return [];
    const pipeline = stats.pipelineStats;
    const stagesOrder = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED'] as const;
    
    // total non-rejected applications
    const totalActive = Object.keys(pipeline)
      .filter(k => k !== 'REJECTED')
      .reduce((sum, key) => sum + (pipeline[key] || 0), 0);

    return stagesOrder.map((stage, index) => {
      const count = pipeline[stage] || 0;
      const pct = totalActive > 0 ? ((count / totalActive) * 100).toFixed(0) : '0';
      
      // Calculate conversion from previous stage
      let conversion = '100';
      if (index > 0) {
        const prevStage = stagesOrder[index - 1];
        const prevCount = pipeline[prevStage] || 0;
        conversion = prevCount > 0 ? ((count / prevCount) * 100).toFixed(0) : '0';
      }

      return {
        name: stage,
        count,
        percentage: pct,
        conversionRate: conversion,
      };
    });
  }, [stats]);

  // Open detailed Candidate profile drawer
  const openCandidateDrawer = (app: Application) => {
    setSelectedApp(app);
    setDrawerOpen(true);
    setDrawerTab('profile');
    setRecruiterScoreVal(app.recruiterScore || 3);
    setRecruiterNotesVal(app.notes || '');
  };

  const handleUpdateEvaluation = async () => {
    if (!selectedApp) return;
    try {
      setSubmittingStage(true);
      // Update local notes and evaluation
      await recruitmentService.updateJob(selectedApp.jobId._id, {}); // dummy trigger or endpoint
      // Simulate evaluation update via application patch
      await recruitmentService.moveStage(selectedApp._id, selectedApp.currentStage, recruiterNotesVal);
      toast.success('Candidate evaluation notes updated successfully!');
      fetchApplications();
    } catch (error) {
      toast.error('Could not save notes evaluation.');
    } finally {
      setSubmittingStage(false);
    }
  };

  // Sourcing color tags helper
  const getStageBadgeColor = (stage: string) => {
    switch (stage) {
      case 'APPLIED': return 'badge-applied';
      case 'SCREENING': return 'badge-screening';
      case 'SHORTLISTED': return 'badge-shortlisted';
      case 'INTERVIEW': return 'badge-review';
      case 'OFFER': return 'badge-offer';
      case 'HIRED': return 'badge-hired';
      case 'REJECTED': return 'badge-rejected';
      default: return 'bg-muted text-muted-foreground border-border dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  // Pagination bounds
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Navigation Headers */}
      <div className="flex flex-wrap items-center justify-between border-b border-border dark:border-white/10 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-card dark:bg-white/[0.03] p-1 rounded-2xl border border-border dark:border-white/10">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white cursor-pointer block transition-all">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white cursor-pointer block transition-all">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground shadow-md cursor-pointer block transition-all">
              ATS Pipeline Grid
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white cursor-pointer block transition-all">
              Candidates Catalog
            </span>
          </Link>
          <Link href="/dashboard/recruitment/ai-interviews">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-muted-foreground dark:text-zinc-400 hover:text-foreground dark:hover:text-white cursor-pointer block transition-all">
              AI Interviews
            </span>
          </Link>
        </div>
        <div>
          <Link href="/careers" target="_blank">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 rounded-xl">
              Careers Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="pb-6 border-b border-border dark:border-white/10">
        <h1 className="text-h1 text-foreground dark:text-white">
          ATS Pipeline Grid
        </h1>
        <p className="text-body-copy text-muted-foreground dark:text-zinc-400 mt-2">
          Screen resumes, track application steps, and manage applicant progression using our AI matching metrics.
        </p>
      </div>

      {/* Analytics KPI Counters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { title: "Total Applications", value: stats?.totalApplications || 0, color: "bg-blue-500" },
          { title: "New Today", value: stats?.newToday || 0, color: "bg-cyan-500", highlight: "text-cyan-600 dark:text-cyan-400" },
          { title: "Screening", value: Number(stats?.pipelineStats?.SCREENING || 0) + Number(stats?.pipelineStats?.SHORTLISTED || 0), color: "bg-indigo-500", highlight: "text-indigo-600 dark:text-indigo-400" },
          { title: "Interviews", value: stats?.pipelineStats?.INTERVIEW || 0, color: "bg-amber-500", highlight: "text-amber-600 dark:text-amber-400" },
          { title: "Offers Sent", value: stats?.pipelineStats?.OFFER || 0, color: "bg-sky-500", highlight: "text-sky-600 dark:text-sky-400" },
          { title: "Hired", value: stats?.pipelineStats?.HIRED || 0, color: "bg-emerald-500", highlight: "text-emerald-600 dark:text-emerald-400" },
          { title: "Rejected", value: stats?.pipelineStats?.REJECTED || 0, color: "bg-rose-500", highlight: "text-rose-600 dark:text-rose-400" }
        ].map((item, idx) => (
          <div key={idx} className="bg-card dark:bg-card/80 backdrop-blur-md border border-border dark:border-white/10 rounded-xl p-3.5 shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-sm text-left relative overflow-hidden group transition-all duration-300 hover:shadow-md hover:border-primary/30 dark:hover:border-white/20">
            <div className={`absolute top-0 left-0 w-1 h-full ${item.color}`} />
            <p className="text-small-label text-muted-foreground dark:text-zinc-400 font-semibold tracking-wider uppercase">{item.title}</p>
            <h3 className={`text-h2 mt-1.5 font-bold tracking-tight transition-transform duration-300 origin-left group-hover:translate-x-0.5 ${item.highlight || 'text-foreground dark:text-white'}`}>
              {item.value}
            </h3>
          </div>
        ))}
      </div>

      {/* Horizontal Pipeline Progression Flow Visualization */}
      {stageStats.length > 0 && (
        <Card className="bg-card dark:bg-card/80 backdrop-blur-md border border-border dark:border-white/10 p-4 rounded-xl shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-md">
          <h4 className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground dark:text-zinc-300 mb-3.5">Conversion & Stage Progression Funnel</h4>
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-3 text-xs">
            {stageStats.map((item, idx) => (
              <React.Fragment key={item.name}>
                <div className="flex-1 bg-muted/30 dark:bg-white/[0.03] p-3 rounded-xl border border-border dark:border-white/10 flex flex-col justify-between hover:bg-muted/50 dark:hover:bg-white/[0.06] transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-small-label text-foreground dark:text-zinc-200 font-bold uppercase tracking-wider">{item.name}</span>
                    <span className="text-small-label font-bold text-primary dark:text-purple-300 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 px-2 py-0.5 rounded-full">{item.count}</span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <span className="text-small-label text-muted-foreground dark:text-zinc-400 block normal-case font-medium">Conv. Rate</span>
                      <span className="text-grid text-foreground dark:text-white font-bold mt-0.5 block">{item.conversionRate}%</span>
                    </div>
                    <div>
                      <span className="text-small-label text-muted-foreground dark:text-zinc-400 block normal-case font-medium">Total Share</span>
                      <span className="text-grid text-muted-foreground dark:text-zinc-300 font-semibold mt-0.5 block">{item.percentage}%</span>
                    </div>
                  </div>
                </div>
                {idx < stageStats.length - 1 && (
                  <div className="hidden md:flex items-center justify-center text-muted-foreground/60 dark:text-zinc-500">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      {/* Filters Toolbar Row */}
      <div className="bg-card dark:bg-card/80 backdrop-blur-md p-4.5 rounded-xl border border-border dark:border-white/10 space-y-4 shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-md">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground dark:text-zinc-300">Recruiter Filters Panel</h4>
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                const toastId = toast.loading('Recalculating all candidate scores...');
                try {
                  await recruitmentService.recalculateScores();
                  toast.success('Successfully calculated and synchronized all applicant scores!', { id: toastId });
                  fetchApplications();
                } catch (err) {
                  toast.error('Failed to recalculate scores.', { id: toastId });
                }
              }}
              variant="outline"
              size="sm"
              className="text-xs h-7 font-bold flex items-center gap-1 rounded-lg"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary dark:text-purple-400" />
              Recalculate Scores
            </Button>
            <Button onClick={handleResetFilters} variant="ghost" size="sm" className="text-xs h-7 font-bold flex items-center gap-1 rounded-lg">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Candidate Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground dark:text-zinc-400" />
            <Input
              placeholder="Search Name/Code..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-8 text-grid h-9 rounded-xl"
            />
          </div>

          {/* Skill Search */}
          <div className="relative">
            <Award className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground dark:text-zinc-400" />
            <Input
              placeholder="Filter by Skill..."
              value={searchSkill}
              onChange={(e) => { setSearchSkill(e.target.value); setCurrentPage(1); }}
              className="pl-8 text-grid h-9 rounded-xl"
            />
          </div>

          {/* Job Position Filter */}
          <Select value={selectedJobId} onValueChange={(val: string) => { setSelectedJobId(val); setCurrentPage(1); }} searchable={true}>
            <SelectTrigger className="text-xs font-bold px-2.5 h-9 w-44 rounded-xl">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Jobs</SelectItem>
              {jobs.map((job) => (
                <SelectItem key={job._id} value={job._id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stage Filter */}
          <Select value={selectedStage} onValueChange={(val: string) => { setSelectedStage(val); setCurrentPage(1); }}>
            <SelectTrigger className="text-xs font-bold px-2.5 h-9 w-36 rounded-xl">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Stages</SelectItem>
              {ACTIVE_STAGES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
              <SelectItem value="REJECTED">REJECTED</SelectItem>
            </SelectContent>
          </Select>

          {/* Experience Filter */}
          <Select value={selectedExperience} onValueChange={(val: string) => { setSelectedExperience(val); setCurrentPage(1); }}>
            <SelectTrigger className="text-xs font-bold px-2.5 h-9 w-40 rounded-xl">
              <SelectValue placeholder="All Experience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Experience</SelectItem>
              <SelectItem value="Entry">Entry (0-2 years)</SelectItem>
              <SelectItem value="Mid">Mid (3-5 years)</SelectItem>
              <SelectItem value="Senior">Senior (5+ years)</SelectItem>
              <SelectItem value="Lead">Lead / Executive</SelectItem>
            </SelectContent>
          </Select>

          {/* AI Score Filter */}
          <Select value={selectedAiScoreRange} onValueChange={(val: string) => { setSelectedAiScoreRange(val); setCurrentPage(1); }}>
            <SelectTrigger className="text-xs font-bold px-2.5 h-9 w-40 rounded-xl">
              <SelectValue placeholder="All AI Scores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All AI Scores</SelectItem>
              <SelectItem value="90">90%+ Match</SelectItem>
              <SelectItem value="80">80%+ Match</SelectItem>
              <SelectItem value="70">70%+ Match</SelectItem>
              <SelectItem value="low">Under 70% Match</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Picker Range (HTML date) */}
          <div className="flex items-center gap-1.5 min-w-[170px]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-card dark:bg-white/[0.04] border border-border dark:border-white/10 text-[10px] font-bold p-1 rounded-xl text-foreground dark:text-zinc-200 focus:outline-none focus:border-primary h-9 w-full cursor-pointer hover:bg-muted/50 dark:hover:bg-white/[0.08]"
              title="Applied From"
            />
            <span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="bg-card dark:bg-white/[0.04] border border-border dark:border-white/10 text-[10px] font-bold p-1 rounded-xl text-foreground dark:text-zinc-200 focus:outline-none focus:border-primary h-9 w-full cursor-pointer hover:bg-muted/50 dark:hover:bg-white/[0.08]"
              title="Applied To"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Table Container */}
      <Card className="bg-card dark:bg-card/80 backdrop-blur-md border border-border dark:border-white/10 rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-lg">
        <div className="p-4 border-b border-border dark:border-white/10 flex items-center justify-between bg-muted/20 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-grid font-bold text-foreground dark:text-white">Candidates Database</span>
            <span className="text-[10px] font-bold text-primary dark:text-purple-300 bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full border border-primary/20 dark:border-primary/30">
              {totalItems} total record{totalItems !== 1 && 's'}
            </span>
          </div>
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-primary dark:text-purple-300 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary dark:bg-purple-400 animate-ping" />
              Loading database...
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 dark:bg-white/[0.02]">
              <TableRow className="hover:bg-transparent border-b border-border dark:border-white/10">
                <TableHead className="w-10 text-center pl-4">
                  <input
                    type="checkbox"
                    checked={applications.length > 0 && selectedIds.length === applications.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border dark:border-white/20 accent-primary w-3.5 h-3.5 cursor-pointer"
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('candidate')} className="text-small-label text-foreground dark:text-zinc-300 font-bold pl-2 cursor-pointer select-none">
                  <div className="flex items-center gap-1 hover:text-primary dark:hover:text-white transition-colors">
                    Candidate
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'candidate' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('job')} className="text-small-label text-foreground dark:text-zinc-300 font-bold cursor-pointer select-none">
                  <div className="flex items-center gap-1 hover:text-primary dark:hover:text-white transition-colors">
                    Job Applied
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'job' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('currentStage')} className="text-small-label text-foreground dark:text-zinc-300 font-bold cursor-pointer select-none">
                  <div className="flex items-center gap-1 hover:text-primary dark:hover:text-white transition-colors">
                    Stage
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'currentStage' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('screeningScore')} className="text-small-label text-foreground dark:text-zinc-300 font-bold cursor-pointer select-none">
                  <div className="flex items-center gap-1 hover:text-primary dark:hover:text-white transition-colors">
                    Screening
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'screeningScore' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('interviewScore')} className="text-small-label text-foreground dark:text-zinc-300 font-bold cursor-pointer select-none">
                  <div className="flex items-center gap-1 hover:text-primary dark:hover:text-white transition-colors">
                    Interview
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'interviewScore' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('finalScore')} className="text-small-label text-foreground dark:text-zinc-300 font-bold cursor-pointer select-none">
                  <div className="flex items-center gap-1 hover:text-primary dark:hover:text-white transition-colors">
                    Final Score
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'finalScore' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
                <TableHead className="text-small-label text-foreground dark:text-zinc-300 font-bold select-none">
                  AI Rec
                </TableHead>
                <TableHead onClick={() => handleSort('experience')} className="text-small-label text-foreground dark:text-zinc-300 font-bold cursor-pointer select-none">
                  <div className="flex items-center gap-1 hover:text-primary dark:hover:text-white transition-colors">
                    Experience
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'experience' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('appliedDate')} className="text-small-label text-foreground dark:text-zinc-300 font-bold cursor-pointer select-none">
                  <div className="flex items-center gap-1 hover:text-primary dark:hover:text-white transition-colors">
                    Applied Date
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'appliedDate' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('recruiterScore')} className="text-small-label text-foreground dark:text-zinc-300 font-bold cursor-pointer select-none">
                  <div className="flex items-center gap-1 hover:text-primary dark:hover:text-white transition-colors">
                    Recruiter Score
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'recruiterScore' ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                </TableHead>
                <TableHead className="text-small-label text-foreground dark:text-zinc-300 font-bold text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow className="hover:bg-transparent border-b border-border dark:border-white/10">
                  <TableCell colSpan={12} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                      <HelpCircle className="w-10 h-10 text-muted-foreground" />
                      <p className="text-xs font-bold uppercase tracking-wider text-foreground dark:text-white">No Candidates Found</p>
                      <p className="text-[10px] text-muted-foreground">Try modifying filters or adding a new record</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => {
                  const cand = app.candidateId;
                  const job = app.jobId;
                  const isChecked = selectedIds.includes(app._id);
                  const isSelected = selectedApp?._id === app._id;
                  
                  if (!cand || !job) return null;

                  return (
                    <TableRow
                      key={app._id}
                      onClick={() => openCandidateDrawer(app)}
                      className={`cursor-pointer hover:bg-muted/40 dark:hover:bg-white/[0.04] border-b border-border/60 dark:border-white/5 transition-colors ${
                        isChecked ? 'bg-primary/10' : isSelected ? 'bg-muted/60 dark:bg-white/[0.06]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="w-10 text-center pl-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(e.target.checked, app._id)}
                          className="rounded border-border dark:border-white/20 accent-primary w-3.5 h-3.5 cursor-pointer"
                        />
                      </TableCell>

                      {/* Candidate */}
                      <TableCell className="pl-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm shrink-0">
                            {cand.firstName[0]}
                            {cand.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-grid font-bold text-foreground dark:text-white hover:text-primary transition-colors truncate">
                              {cand.firstName} {cand.lastName}
                            </h4>
                            <p className="text-small-label text-muted-foreground font-medium mt-0.5">
                              {cand.candidateCode}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Job Applied */}
                      <TableCell>
                        <div className="min-w-[120px] max-w-[200px]">
                          <p className="text-grid font-bold text-foreground dark:text-zinc-100 truncate">{job.title}</p>
                          <p className="text-small-label text-muted-foreground font-medium mt-0.5 truncate">
                            {job.departmentId?.name || 'Department'}
                          </p>
                        </div>
                      </TableCell>

                      {/* Current Stage */}
                      <TableCell>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase inline-block ${getStageBadgeColor(app.currentStage)}`}>
                          {app.currentStage}
                        </span>
                      </TableCell>

                      {/* Screening Score */}
                      <TableCell>
                        {app.screeningStatus === 'PENDING' ? (
                          <span className="text-small-label text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">Queued</span>
                        ) : app.screeningStatus === 'PROCESSING' ? (
                          <span className="text-small-label text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-primary/20 border border-purple-200 dark:border-primary/30 px-2 py-0.5 rounded-full animate-pulse">Screening...</span>
                        ) : app.screeningStatus === 'FAILED' ? (
                          <span className="text-small-label text-rose-700 dark:text-rose-350 bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 px-2 py-0.5 rounded-full" title={app.notes || 'Screening failed'}>Failed</span>
                        ) : app.screeningScore !== undefined && app.screeningScore !== null ? (
                          <div className="flex items-center gap-1.5 min-w-[70px]">
                            <span className="text-small-label text-foreground dark:text-white font-bold">{app.screeningScore}%</span>
                            <div className="w-12 h-1.5 bg-muted dark:bg-white/10 border border-border dark:border-white/15 rounded-full overflow-hidden shrink-0">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-cyan-500"
                                style={{ width: `${app.screeningScore}%` }}
                              />
                            </div>
                          </div>
                        ) : app.aiScore !== undefined && app.aiScore !== null ? (
                          <div className="flex items-center gap-1.5 min-w-[70px]">
                            <span className="text-small-label text-foreground dark:text-white font-bold">{app.aiScore}%</span>
                            <div className="w-12 h-1.5 bg-muted dark:bg-white/10 border border-border dark:border-white/15 rounded-full overflow-hidden shrink-0">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-cyan-500"
                                style={{ width: `${app.aiScore}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-small-label text-muted-foreground italic">-</span>
                        )}
                      </TableCell>

                      {/* Interview Score */}
                      <TableCell>
                        {app.interviewStatus === 'COMPLETED' || (app.interviewScore !== undefined && app.interviewScore !== null) ? (
                          app.interviewScore !== undefined && app.interviewScore !== null ? (
                            <div className="flex items-center gap-1.5 min-w-[70px]">
                              <span className="text-small-label text-foreground dark:text-white font-bold">{app.interviewScore}%</span>
                              <div className="w-12 h-1.5 bg-muted dark:bg-white/10 border border-border dark:border-white/15 rounded-full overflow-hidden shrink-0">
                                <div
                                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                  style={{ width: `${app.interviewScore}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-small-label text-muted-foreground italic">-</span>
                          )
                        ) : app.interviewStatus === 'PENDING' || app.interviewStatus === 'SCHEDULED' ? (
                          <span className="text-small-label text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 px-2 py-0.5 rounded-full">Scheduled</span>
                        ) : (
                          <span className="text-small-label text-muted-foreground italic">-</span>
                        )}
                      </TableCell>

                      {/* Final Score */}
                      <TableCell>
                        {app.finalScore !== undefined && app.finalScore !== null ? (
                          <div className="flex items-center gap-1.5 min-w-[70px]">
                            <span className="text-small-label text-foreground dark:text-white font-bold">{app.finalScore}%</span>
                            <div className="w-12 h-1.5 bg-muted dark:bg-white/10 border border-border dark:border-white/15 rounded-full overflow-hidden shrink-0">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                style={{ width: `${app.finalScore}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-small-label text-muted-foreground italic">-</span>
                        )}
                      </TableCell>

                      {/* AI Rec */}
                      <TableCell>
                        {app.aiRecommendation ? (
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase inline-block ${
                            app.aiRecommendation === 'HIRE' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-350 dark:border-emerald-500/30' 
                              : app.aiRecommendation === 'REJECT' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-350 dark:border-rose-500/30' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                          }`}>
                            {app.aiRecommendation}
                          </span>
                        ) : (
                          <span className="text-small-label text-muted-foreground italic">-</span>
                        )}
                      </TableCell>

                      {/* Experience */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-small-label text-foreground dark:text-zinc-200 normal-case font-semibold">
                          <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[80px]">{cand.experience || 'Entry'}</span>
                        </div>
                      </TableCell>

                      {/* Applied Date */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-small-label text-foreground dark:text-zinc-200 normal-case font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{formatDate(app.appliedAt)}</span>
                        </div>
                      </TableCell>

                      {/* Recruiter Score */}
                      <TableCell>
                        {renderStars(app.recruiterScore)}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            onClick={() => openCandidateDrawer(app)}
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 rounded hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground dark:hover:text-white"
                            title="Quick View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleHireCandidate(app._id)}
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 rounded hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            title="Hire Candidate"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleRejectCandidate(app._id)}
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 rounded hover:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                            title="Reject Candidate"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="p-4 bg-muted/20 dark:bg-white/[0.02] border-t border-border dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>View rows:</span>
            <Select value={String(itemsPerPage)} onValueChange={(val: string) => { setItemsPerPage(Number(val)); setCurrentPage(1); }}>
              <SelectTrigger className="bg-card dark:bg-white/[0.04] border border-border dark:border-white/10 rounded-xl px-2.5 h-8 w-20 text-foreground dark:text-zinc-200">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-muted-foreground ml-2 font-medium">
              Showing {applications.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} candidates
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-xl p-0 border-border dark:border-white/10 bg-transparent disabled:opacity-30 hover:bg-muted dark:hover:bg-white/10 text-foreground dark:text-zinc-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-semibold text-foreground dark:text-zinc-200">Page {currentPage} of {totalPages}</span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-xl p-0 border-border dark:border-white/10 bg-transparent disabled:opacity-30 hover:bg-muted dark:hover:bg-white/10 text-foreground dark:text-zinc-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Hiring Onboarding Details Modal Dialog */}
      <Dialog open={hiringModalOpen} onOpenChange={setHiringModalOpen}>
        <DialogContent className="bg-card dark:bg-[#0b0b0c] border border-border dark:border-white/10 rounded-[28px] max-w-md text-foreground select-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground dark:text-white">
              <UserCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              Complete Onboarding Conversion
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Confirm onboarding parameters to promote candidate to an employee.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitHiring} className="space-y-4 my-2 text-xs">
            {/* Assigned Role */}
            <div className="space-y-1.5">
              <Label htmlFor="hiringRole" className="text-xs font-semibold text-foreground dark:text-zinc-300">Assigned Employee System Role</Label>
              <Select value={hiringRole} onValueChange={setHiringRole}>
                <SelectTrigger id="hiringRole" className="w-full bg-card dark:bg-white/[0.04] border border-border dark:border-white/10 rounded-xl h-9 px-3 text-xs text-foreground dark:text-zinc-200">
                  <SelectValue placeholder="Select System Role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee (Standard HRMS Access)</SelectItem>
                  <SelectItem value="HR_RECRUITER">HR Recruiter (Recruitment & Directory)</SelectItem>
                  <SelectItem value="SENIOR_MANAGER">Senior Manager (Performance & Hierarchy)</SelectItem>
                  <SelectItem value="MANAGEMENT_ADMIN">Management Admin (Full System Administrator)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department Selection */}
            <div className="space-y-1.5">
              <Label htmlFor="hiringDept" className="text-xs font-semibold text-foreground dark:text-zinc-300">Department</Label>
              <Select value={hiringDeptId} onValueChange={setHiringDeptId} searchable={true}>
                <SelectTrigger id="hiringDept" className="w-full bg-card dark:bg-white/[0.04] border border-border dark:border-white/10 rounded-xl h-9 px-3 text-xs text-foreground dark:text-zinc-200">
                  <SelectValue placeholder="Select Department..." />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Designation / Job Title */}
            <div className="space-y-1.5">
              <Label htmlFor="hiringDesig" className="text-xs font-semibold text-foreground dark:text-zinc-300">Designation</Label>
              <Select value={hiringDesigId} onValueChange={setHiringDesigId} searchable={true}>
                <SelectTrigger id="hiringDesig" className="w-full bg-card dark:bg-white/[0.04] border border-border dark:border-white/10 rounded-xl h-9 px-3 text-xs text-foreground dark:text-zinc-200">
                  <SelectValue placeholder="Select Designation..." />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d: any) => (
                    <SelectItem key={d._id} value={d._id}>
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Manager Assignment */}
            <div className="space-y-1.5">
              <Label htmlFor="hiringManager" className="text-xs font-semibold text-foreground dark:text-zinc-300">Reporting Manager</Label>
              <Select value={hiringManagerId} onValueChange={setHiringManagerId} searchable={true}>
                <SelectTrigger id="hiringManager" className="w-full bg-card dark:bg-white/[0.04] border border-border dark:border-white/10 rounded-xl h-9 px-3 text-xs text-foreground dark:text-zinc-200">
                  <SelectValue placeholder="Unassigned / No Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Unassigned / No Manager</SelectItem>
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Joining Date */}
            <div className="space-y-1.5">
              <Label htmlFor="hiringJoiningDate" className="text-xs font-semibold text-foreground dark:text-zinc-300">Joining Date</Label>
              <Input
                id="hiringJoiningDate"
                type="date"
                value={hiringJoiningDate}
                onChange={(e) => setHiringJoiningDate(e.target.value)}
                className="bg-card dark:bg-white/[0.04] border-border dark:border-white/10 text-foreground dark:text-zinc-200 rounded-xl h-9 text-xs"
                required
              />
            </div>

            <DialogFooter className="pt-4 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setHiringModalOpen(false)}
                className="rounded-xl border border-border dark:border-white/15 text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingStage}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white border-0 cursor-pointer px-6 font-bold"
              >
                {submittingStage ? 'Onboarding...' : 'Onboard Employee'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Slide-out Candidate Profiler Drawer Panel */}
      {drawerOpen && selectedApp && (
        <>
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          />

          {/* Drawer Right Body */}
          <div className="fixed top-0 right-0 h-full w-[480px] sm:w-[560px] md:w-[680px] bg-card/95 dark:bg-[#0c0c12]/95 backdrop-blur-lg border-l border-border dark:border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col text-foreground">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border dark:border-white/10 bg-muted/20 dark:bg-white/[0.02] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full tracking-wider uppercase ${getStageBadgeColor(selectedApp.currentStage)}`}>
                    {selectedApp.currentStage}
                  </span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    Sourcing ID: {selectedApp.candidateId?.candidateCode}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground dark:text-white mt-1.5">
                  {selectedApp.candidateId?.firstName} {selectedApp.candidateId?.lastName}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Job Target: <span className="text-foreground dark:text-zinc-200 font-semibold">{selectedApp.jobId?.title}</span> • <span>{selectedApp.jobId?.departmentId?.name || 'Department'}</span>
                </p>
              </div>
              <Button
                onClick={() => setDrawerOpen(false)}
                size="icon"
                variant="ghost"
                className="w-8 h-8 rounded-xl hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Progress Banner actions inside drawer */}
            {selectedApp.currentStage !== 'HIRED' && selectedApp.currentStage !== 'REJECTED' && (
              <div className="px-5 py-3 bg-muted/30 dark:bg-white/[0.03] border-b border-border dark:border-white/10 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase text-muted-foreground">Advance Candidate:</span>
                  <Select
                    value={selectedApp.currentStage}
                    onValueChange={(newStage: string) => {
                      if (newStage === 'HIRED') {
                        handleHireCandidate(selectedApp._id);
                      } else {
                        handleStageChange(selectedApp._id, newStage, 'Moved via drawer stage selectors');
                      }
                    }}
                    disabled={submittingStage}
                  >
                    <SelectTrigger className="bg-card dark:bg-white/[0.04] text-[10px] font-bold px-2 h-8 w-36 rounded-xl border border-border dark:border-white/10 text-foreground dark:text-zinc-200">
                      <SelectValue placeholder="Select Stage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVE_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRejectCandidate(selectedApp._id)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/15 rounded-xl font-bold"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleHireCandidate(selectedApp._id)}
                    size="sm"
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold text-[10px] flex items-center gap-1 rounded-xl"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-0.5" />
                    Hire Candidate
                  </Button>
                </div>
              </div>
            )}

            {/* Drawer Tab Headers Selector */}
            <div className="flex border-b border-border dark:border-white/10 px-4 bg-muted/20 dark:bg-white/[0.02] text-xs font-bold gap-1 py-1.5 overflow-x-auto shrink-0 scrollbar-none">
              {[
                { key: 'profile', name: 'Profile', icon: UserCircle2 },
                { key: 'resume', name: 'Resume', icon: FileText },
                { key: 'skills', name: 'Skills Match', icon: Award },
                { key: 'education', name: 'Education', icon: GraduationCap },
                { key: 'ai', name: 'AI Resume Analysis', icon: Sparkles },
                { key: 'interviews', name: 'Interviews', icon: MessageSquare },
                { key: 'evaluation', name: 'Recruiter Score', icon: Star },
                { key: 'timeline', name: 'Stage Audit', icon: Layers },
              ].map((tab) => {
                const isActive = drawerTab === tab.key;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setDrawerTab(tab.key)}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all cursor-pointer font-bold shrink-0 text-[10px] tracking-wide uppercase ${
                      isActive
                        ? 'border-primary text-primary font-extrabold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            {/* Drawer Body Contents (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 text-xs">
              {/* Profile Tab */}
              {drawerTab === 'profile' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-bold uppercase text-muted-foreground text-[9px] tracking-wider mb-2">Key Contact Bio</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 dark:bg-white/[0.03] p-4 rounded-xl border border-border dark:border-white/10">
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Email Address</p>
                        <p className="font-bold text-foreground dark:text-white mt-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          {selectedApp.candidateId?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Phone Number</p>
                        <p className="font-bold text-foreground dark:text-white mt-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                          {selectedApp.candidateId?.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">LinkedIn Profile</p>
                        {selectedApp.candidateId?.linkedinUrl ? (
                          <a href={selectedApp.candidateId.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline flex items-center gap-1 mt-1">
                            <LinkIcon className="w-3 h-3 text-muted-foreground" />
                            linkedin.com/profile
                          </a>
                        ) : (
                          <p className="font-bold text-muted-foreground mt-1">N/A</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Portfolio / GitHub</p>
                        {selectedApp.candidateId?.portfolioUrl ? (
                          <a href={selectedApp.candidateId.portfolioUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-primary hover:underline flex items-center gap-1 mt-1">
                            <LinkIcon className="w-3 h-3 text-muted-foreground" />
                            sourcing portfolio
                          </a>
                        ) : (
                          <p className="font-bold text-muted-foreground mt-1">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold uppercase text-muted-foreground text-[9px] tracking-wider mb-2">Work Status Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 dark:bg-white/[0.03] p-4 rounded-xl border border-border dark:border-white/10">
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Current Company</p>
                        <p className="font-bold text-foreground dark:text-white mt-1">{selectedApp.candidateId?.currentCompany || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Current Designation</p>
                        <p className="font-bold text-foreground dark:text-white mt-1">{selectedApp.candidateId?.currentDesignation || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Expected Compensation</p>
                        <p className="font-bold text-foreground dark:text-white mt-1">
                          {selectedApp.candidateId?.expectedSalary ? `$${selectedApp.candidateId.expectedSalary.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Notice Period</p>
                        <p className="font-bold text-foreground dark:text-white mt-1">{selectedApp.candidateId?.noticePeriod || 'Immediate'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase">Sourcing Source</p>
                        <span className="font-bold text-foreground dark:text-zinc-200 bg-muted/60 dark:bg-white/10 border border-border dark:border-white/10 px-2 py-0.5 rounded mt-1 inline-block uppercase text-[10px]">
                          {selectedApp.candidateId?.source || 'DIRECT'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resume Tab */}
              {drawerTab === 'resume' && (
                <div className="space-y-4 h-full flex flex-col">
                  <h4 className="font-bold uppercase text-muted-foreground text-[9px] tracking-wider mb-1">Uploaded Resume Vault</h4>
                  {selectedApp.candidateId?.resume?.fileName ? (
                    <div className="flex-1 flex flex-col space-y-4">
                      <div className="border border-border dark:border-white/10 rounded-xl p-4 flex items-center justify-between bg-muted/30 dark:bg-white/[0.03]">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-primary/20 text-primary border border-primary/30 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground dark:text-white truncate max-w-[280px]">{selectedApp.candidateId.resume.fileName}</p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">Uploaded: {formatDate(selectedApp.candidateId.resume.uploadedAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleDownloadResume(selectedApp.candidateId?.resume?.fileName)}
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-xl hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <a
                            href={recruitmentService.getResumeDownloadUrl(selectedApp.candidateId.resume.fileName)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="w-8 h-8 rounded-xl hover:bg-muted dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
                              title="Native Preview File"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      </div>

                      {/* Browser Streaming preview panel container */}
                      <div className="flex-1 min-h-[340px] border border-border dark:border-white/10 rounded-xl overflow-hidden bg-card dark:bg-white/[0.02] relative">
                        {/* Stream preview text helper */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2 pointer-events-none">
                          <AlertCircle className="w-8 h-8 text-muted-foreground" />
                          <p className="font-bold text-xs text-foreground dark:text-white">PDF Document Stream Preview Container</p>
                          <p className="text-[10px] text-muted-foreground max-w-[340px]">Point to the external native review trigger if your sandbox blocks direct PDF embeds.</p>
                        </div>
                        <iframe
                          src={recruitmentService.getResumeDownloadUrl(selectedApp.candidateId.resume.fileName)}
                          className="w-full h-full border-0 relative z-10 opacity-90"
                          title="Candidate Resume Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border dark:border-white/10 rounded-xl bg-card dark:bg-white/[0.02]">
                      <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="font-bold text-foreground dark:text-white">No Resume document available</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">This applicant was registered without a PDF attachment.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Skills Tab */}
              {drawerTab === 'skills' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold uppercase text-muted-foreground text-[9px] tracking-wider mb-2">Candidate Skills Array</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.candidateId?.skills?.map((s) => (
                        <span key={s} className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-muted/60 dark:bg-white/10 text-foreground dark:text-white border border-border dark:border-white/15 shadow-sm">
                          {s}
                        </span>
                      )) || <span className="text-muted-foreground italic">No skills listed.</span>}
                    </div>
                  </div>

                  <div className="bg-muted/30 dark:bg-white/[0.03] p-4 rounded-xl border border-border dark:border-white/10 space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Matching Job Requirements</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApp.matchingSkills && selectedApp.matchingSkills.length > 0 ? (
                          selectedApp.matchingSkills.map((s) => (
                            <span key={s} className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-350 dark:border-emerald-500/30">{s}</span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-[10px] italic">No match intersections</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Info className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Missing Sourcing Requirements</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApp.missingSkills && selectedApp.missingSkills.length > 0 ? (
                          selectedApp.missingSkills.map((s) => (
                            <span key={s} className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-350 dark:border-rose-500/30">{s}</span>
                          ))
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold italic">Perfect match! No missing skills</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Education Tab */}
              {drawerTab === 'education' && (
                <div className="space-y-4">
                  <h4 className="font-bold uppercase text-muted-foreground text-[9px] tracking-wider mb-2">Academic Credentials</h4>
                  <div className="bg-muted/30 dark:bg-white/[0.03] p-4 rounded-xl border border-border dark:border-white/10">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">Education Details Summary</p>
                    <p className="text-xs font-bold text-foreground dark:text-white mt-1">{selectedApp.candidateId?.education || 'No details registered'}</p>
                  </div>
                </div>
              )}

              {/* AI Resume Analysis Tab */}
              {drawerTab === 'ai' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold uppercase text-muted-foreground text-[9px] tracking-wider">AI Resume Scoring & Analysis</h4>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      Status: <span className="uppercase text-primary font-bold">{selectedApp.screeningStatus || 'PENDING'}</span>
                    </span>
                  </div>

                  {/* Queued / Processing States */}
                  {selectedApp.screeningStatus === 'PENDING' && (
                    <div className="bg-muted/30 dark:bg-white/[0.03] border border-border dark:border-white/10 p-4 rounded-xl text-center space-y-3">
                      <div className="w-8 h-8 rounded-full border-2 border-amber-400 border-t-transparent animate-spin mx-auto" />
                      <p className="font-bold text-foreground dark:text-white">Queued for AI Screening</p>
                      <p className="text-[10px] text-muted-foreground">The background worker queue is picking up this document shortly. Please wait...</p>
                    </div>
                  )}

                  {selectedApp.screeningStatus === 'PROCESSING' && (
                    <div className="bg-muted/30 dark:bg-white/[0.03] border border-border dark:border-white/10 p-4 rounded-xl text-center space-y-3">
                      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
                      <p className="font-bold text-foreground dark:text-white">AI Screening in Progress...</p>
                      <p className="text-[10px] text-muted-foreground">FastAPI parser is reading text content and running OpenRouter analysis templates. Please wait...</p>
                    </div>
                  )}

                  {selectedApp.screeningStatus === 'FAILED' && (() => {
                    const getActionableErrorMessage = (notes: string) => {
                      if (!notes) return {
                        title: "AI Sourcing Match Failed",
                        desc: "An error occurred during resume text processing or LLM evaluation.",
                        action: "Please check your network connection and try running the analysis again."
                      };
                      const lowerNotes = notes.toLowerCase();
                      if (lowerNotes.includes("unauthorized") || lowerNotes.includes("authentication") || lowerNotes.includes("401")) {
                        return {
                          title: "Authentication Error",
                          desc: "The AI screening request could not be authenticated. Please log out and sign back in to renew your session.",
                          action: "Contact system administrators if access issues persist."
                        };
                      }
                      if (lowerNotes.includes("offline") || lowerNotes.includes("fetch failed") || lowerNotes.includes("connection refused") || lowerNotes.includes("econnrefused") || lowerNotes.includes("503") || lowerNotes.includes("service offline")) {
                        return {
                          title: "AI Service Offline",
                          desc: "The background AI parsing microservice is currently offline or unreachable.",
                          action: "Please verify that the FastAPI server is running on port 8000."
                        };
                      }
                      if (lowerNotes.includes("api key") || lowerNotes.includes("missing api key") || lowerNotes.includes("your_openrouter_api_key_here")) {
                        return {
                          title: "Missing API Key",
                          desc: "OpenRouter API Key is missing or set to the default placeholder in the environment variables.",
                          action: "Please set the OPENROUTER_API_KEY inside 'ai-service/.env'."
                        };
                      }
                      if (lowerNotes.includes("rate limit") || lowerNotes.includes("429") || lowerNotes.includes("too many requests")) {
                        return {
                          title: "Rate Limit Exceeded",
                          desc: "OpenRouter API free-tier rate limits have been exceeded.",
                          action: "Please wait a moment before retrying, or configure a paid model tier."
                        };
                      }
                      if (lowerNotes.includes("openrouter") || lowerNotes.includes("llm") || lowerNotes.includes("choices")) {
                        return {
                          title: "OpenRouter Error",
                          desc: `The OpenRouter LLM service failed to process the request. Details: ${notes}`,
                          action: "Verify OpenRouter API status or check the model fallback config."
                        };
                      }
                      if (lowerNotes.includes("extract") || lowerNotes.includes("parse") || lowerNotes.includes("pdf") || lowerNotes.includes("docx") || lowerNotes.includes("empty")) {
                        return {
                          title: "Invalid Resume",
                          desc: "The document parser was unable to extract readable text content from the uploaded resume file.",
                          action: "Ensure the file is not password-protected, corrupted, or fully scanned image-based without OCR text."
                        };
                      }
                      return {
                        title: "AI Screening Error",
                        desc: notes,
                        action: "Please check the server logs for detailed traceback information."
                      };
                    };

                    const errInfo = getActionableErrorMessage(selectedApp.notes || '');
                    return (
                      <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-rose-500 dark:text-rose-400 mx-auto" />
                        <div>
                          <p className="font-bold text-sm text-rose-600 dark:text-rose-400">{errInfo.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-semibold leading-normal">{errInfo.desc}</p>
                        </div>
                        <div className="bg-card border border-border dark:border-white/10 p-2.5 rounded-xl text-left text-[9px] leading-relaxed">
                          <span className="font-bold uppercase text-rose-600 dark:text-rose-400 tracking-wide block mb-0.5">Actionable step:</span>
                          <span className="text-foreground dark:text-zinc-300 font-semibold">{errInfo.action}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Score & Recommendation */}
                  {selectedApp.screeningStatus !== 'PENDING' && selectedApp.screeningStatus !== 'PROCESSING' && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-primary/10 to-indigo-500/10 p-4 rounded-xl border border-primary/20">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Screening</p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black text-primary">{selectedApp.screeningScore !== undefined && selectedApp.screeningScore !== null ? selectedApp.screeningScore : (selectedApp.aiScore || 0)}%</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-4 rounded-xl border border-violet-500/20">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Interview</p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black text-violet-600 dark:text-violet-300">{selectedApp.interviewScore !== undefined && selectedApp.interviewScore !== null ? `${selectedApp.interviewScore}%` : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-4 rounded-xl border border-emerald-500/20">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Final Score</p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{selectedApp.finalScore !== undefined && selectedApp.finalScore !== null ? `${selectedApp.finalScore}%` : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-4 rounded-xl border border-purple-500/20">
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">AI Sourcing Grade</p>
                        <p className="text-xs font-black text-primary mt-2.5 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-primary" />
                          {selectedApp.aiRecommendation || 'Sourcing grade pending'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {selectedApp.screeningStatus !== 'PENDING' && selectedApp.screeningStatus !== 'PROCESSING' && (
                    <div className="bg-muted/30 dark:bg-white/[0.03] p-4 rounded-xl border border-border dark:border-white/10">
                      <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">AI Screening Insights Summary</p>
                      <p className="text-xs leading-relaxed text-foreground dark:text-zinc-200 font-medium">{selectedApp.screeningSummary || 'Screening insights uncomputed.'}</p>
                    </div>
                  )}

                  {/* Run / Re-run Trigger Actions */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handleTriggerScreening(selectedApp._id)}
                      disabled={submittingStage || selectedApp.screeningStatus === 'PROCESSING'}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white font-bold w-full text-xs rounded-xl flex items-center justify-center gap-1.5 h-9 shadow-md cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      {selectedApp.screeningStatus === 'COMPLETED' ? 'Re-run Screening Analysis' : 'Run AI Resume Screening'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Interviews Tab */}
              {drawerTab === 'interviews' && (
                <div className="space-y-4">
                  <h4 className="font-bold uppercase text-muted-foreground text-[9px] tracking-wider mb-2">Interview Evaluations</h4>
                  <div className="bg-muted/30 dark:bg-white/[0.03] p-4 rounded-xl border border-border dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border dark:border-white/10">
                      <div>
                        <span className="text-[8px] text-muted-foreground font-bold uppercase block">Technical Assessment Status</span>
                        <span className="text-xs font-bold text-foreground dark:text-white mt-0.5 block">{selectedApp.interviewStatus || 'Scheduled'}</span>
                      </div>
                      {selectedApp.interviewScore !== undefined && selectedApp.interviewScore !== null && (
                        <div className="text-right">
                          <span className="text-[8px] text-muted-foreground font-bold uppercase block">Score</span>
                          <span className="text-xs font-black text-amber-500 dark:text-amber-400 block">{selectedApp.interviewScore}/100</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[8px] text-muted-foreground font-bold uppercase block">Assessment Feedback</span>
                      <p className="text-xs text-muted-foreground italic mt-1.5 leading-relaxed">
                        {selectedApp.interviewFeedback || 'Feedback evaluation records pending completion of technical assessments.'}
                      </p>
                    </div>
                    {selectedApp.interviewCompletedAt && (
                      <p className="text-[9px] text-muted-foreground mt-2">
                        Completed at: {formatDate(selectedApp.interviewCompletedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Recruiter Evaluation Notes Tab */}
              {drawerTab === 'evaluation' && (
                <div className="space-y-5">
                  <h4 className="font-bold uppercase text-muted-foreground text-[9px] tracking-wider mb-2">Recruiter Evaluation & Star Rating</h4>
                  <div className="space-y-4 bg-muted/30 dark:bg-white/[0.03] p-4 rounded-xl border border-border dark:border-white/10">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] text-muted-foreground font-bold uppercase">Recruiter Score Evaluation (1-5 Stars)</Label>
                      <div className="flex items-center gap-1.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRecruiterScoreVal(star)}
                            className="focus:outline-none transition-transform active:scale-90"
                          >
                            <Star
                              className={`w-6 h-6 cursor-pointer ${
                                star <= recruiterScoreVal
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-muted-foreground/40'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] text-muted-foreground font-bold uppercase">Evaluation Notes</Label>
                      <textarea
                        value={recruiterNotesVal}
                        onChange={(e) => setRecruiterNotesVal(e.target.value)}
                        placeholder="Write candidate evaluation highlights, review summary, or next assessment parameters..."
                        className="w-full h-24 bg-card dark:bg-white/[0.04] border border-border dark:border-white/10 rounded-xl p-2.5 text-xs text-foreground dark:text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/45"
                      />
                    </div>

                    <Button
                      onClick={handleUpdateEvaluation}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl w-full text-xs shadow-md cursor-pointer"
                    >
                      Save Evaluation Notes
                    </Button>
                  </div>
                </div>
              )}

              {/* Timeline Tab */}
              {drawerTab === 'timeline' && (
                <div className="space-y-4">
                  <h4 className="font-bold uppercase text-muted-foreground text-[9px] tracking-wider mb-2">Stage Change Activity Log</h4>
                  <div className="space-y-3.5 pl-2 max-h-[380px] overflow-y-auto">
                    {selectedApp.stageHistory.map((hist, idx) => (
                      <div key={idx} className="text-[10px] leading-relaxed relative pb-2 border-l border-border dark:border-white/15 pl-4 last:border-l-0">
                        <div className="w-2.5 h-2.5 bg-primary/20 border border-primary rounded-full absolute -left-[6px] top-1" />
                        <p className="font-bold text-foreground dark:text-white uppercase tracking-wide">{hist.stage}</p>
                        {hist.notes && <p className="text-muted-foreground mt-0.5 italic">Comment: {hist.notes}</p>}
                        <p className="text-[8px] text-muted-foreground mt-1">
                          Date: {formatDate(hist.changedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Close Actions Footer */}
            <div className="p-4 border-t border-border dark:border-white/10 bg-muted/20 dark:bg-white/[0.02] flex items-center justify-end shrink-0">
              <Button onClick={() => setDrawerOpen(false)} variant="outline" className="text-xs rounded-xl border-border dark:border-white/15 bg-transparent text-foreground hover:text-foreground dark:text-zinc-200 dark:hover:text-white hover:bg-muted dark:hover:bg-white/10 font-bold px-4 py-2">
                Close Profile
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Sticky Bottom Bulk Operations Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-between z-40 px-6 py-2.5 w-[95%] sm:w-auto gap-8 group/toolbar"
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '999px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
          }}
        >
          <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
            {/* Selection Counter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] shrink-0" />
              <span className="text-sm font-semibold text-white font-sans tracking-tight">
                {selectedIds.length} Selected
              </span>
            </div>

            {/* Group 2: Move Stage dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={bulkActionStage}
                onChange={(e) => setBulkActionStage(e.target.value)}
                className="h-10 px-4 text-xs font-medium focus:outline-none cursor-pointer text-zinc-200 hover:text-white hover:bg-white/[0.08] transition-all"
                style={{
                  background: '#0a0a0c',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                <option value="" className="bg-[#0a0a0c] text-zinc-400">Move Stage...</option>
                {ACTIVE_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button
                onClick={handleBulkMove}
                disabled={!bulkActionStage || loading}
                className="h-10 px-4 rounded-full bg-transparent hover:bg-white/10 text-zinc-200 hover:text-white disabled:opacity-40 font-medium text-xs border border-white/15 cursor-pointer transition-all"
              >
                {loading && bulkActionStage ? `Updating ${selectedIds.length} candidates...` : 'Apply'}
              </Button>
            </div>

            {/* Group 3: Primary Action - AI Screen */}
            <div className="shrink-0">
              <Button
                onClick={handleBulkScreen}
                disabled={loading}
                className="h-10 px-4 rounded-full font-medium text-xs flex items-center justify-center cursor-pointer transition-all hover:bg-[#9d68fb] disabled:opacity-40"
                style={{
                  background: '#8B5CF6',
                  color: 'white',
                  border: '0',
                }}
              >
                <Sparkles className="w-4 h-4 mr-2 shrink-0 text-white" strokeWidth={2} />
                AI Screen
              </Button>
            </div>

            {/* Group 4: Secondary Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                onClick={handleBulkAssign}
                disabled={loading}
                className="h-10 px-4 rounded-full bg-transparent text-zinc-200 hover:text-white hover:bg-white/10 font-medium text-xs border-0 cursor-pointer flex items-center justify-center transition-all disabled:opacity-40"
                title="Assign recruiter"
              >
                <UserPlus className="w-4 h-4 mr-2 shrink-0 text-zinc-300" strokeWidth={2} />
                Assign
              </Button>

              <Button
                onClick={handleBulkSendEmail}
                disabled={loading}
                className="h-10 px-4 rounded-full bg-transparent text-zinc-200 hover:text-white hover:bg-white/10 font-medium text-xs border-0 cursor-pointer flex items-center justify-center transition-all disabled:opacity-40"
                title="Email selected candidates"
              >
                <Mail className="w-4 h-4 mr-2 shrink-0 text-zinc-300" strokeWidth={2} />
                Email
              </Button>

              <Button
                onClick={handleBulkExport}
                disabled={loading}
                className="h-10 px-4 rounded-full bg-transparent text-zinc-200 hover:text-white hover:bg-white/10 font-medium text-xs border-0 cursor-pointer flex items-center justify-center transition-all disabled:opacity-40"
                title="Export to CSV"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 shrink-0 text-zinc-300" strokeWidth={2} />
                Export
              </Button>
            </div>

            {/* Group 5: Destructive Action - Reject */}
            <div className="shrink-0">
              <Button
                onClick={handleBulkReject}
                disabled={loading}
                className="h-10 px-4 rounded-full font-medium text-xs flex items-center justify-center cursor-pointer transition-all hover:bg-rose-500/20 disabled:opacity-40"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#F87171',
                  border: '0',
                }}
              >
                <UserX className="w-4 h-4 mr-2 shrink-0" strokeWidth={2} />
                {loading && !bulkActionStage ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>

          {/* Group 6: Close Toolbar (Deselect All) */}
          <div className="shrink-0 border-l border-white/10 pl-2">
            <Button
              onClick={() => setSelectedIds([])}
              className="h-10 w-10 p-0 rounded-full bg-transparent hover:bg-white/10 text-zinc-400 hover:text-white opacity-0 group-hover/toolbar:opacity-100 transition-opacity duration-200 cursor-pointer flex items-center justify-center border-0"
              title="Deselect all"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
