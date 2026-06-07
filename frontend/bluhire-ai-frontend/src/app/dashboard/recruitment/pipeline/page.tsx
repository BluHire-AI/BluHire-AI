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

const ACTIVE_STAGES = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'HIRED'] as const;

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

  const handleHireCandidate = async (appId: string) => {
    const candidateName = selectedApp?.candidateId ? 
      `${selectedApp.candidateId.firstName} ${selectedApp.candidateId.lastName}` : 'this candidate';
    if (!window.confirm(`Hire ${candidateName}?\n\nThis will:\n✅ Create an Employee account\n✅ Generate a temporary password\n✅ Send a congratulations onboarding email\n\nAre you sure?`)) return;
    try {
      setSubmittingStage(true);
      const result = await recruitmentService.hireCandidate(appId);
      toast.success(`🎉 ${result.candidateName || candidateName} has been hired! Onboarding email sent to ${result.email}.`);
      if (selectedApp?._id === appId) {
        setSelectedApp(prev => prev ? { ...prev, currentStage: 'HIRED' as any } : null);
      }
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to hire candidate');
    } finally {
      setSubmittingStage(false);
    }
  };

  const handleRejectCandidate = async (appId: string) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    await handleStageChange(appId, 'REJECTED', reason || 'Candidate rejected.');
  };

  const handleInviteToInterview = async (appId: string) => {
    try {
      setSubmittingStage(true);
      const session = await recruitmentService.inviteToInterview(appId);
      
      // Auto-copy link to clipboard for easy testing
      if (session && session.publicToken) {
        const inviteUrl = `${window.location.origin}/interview/${session.publicToken}`;
        navigator.clipboard.writeText(inviteUrl).catch(() => {});
        toast.success('Invitation sent! Secure link copied to clipboard.');
      } else {
        toast.success('Interview invitation sent to candidate successfully!');
      }
      
      if (selectedApp?._id === appId) {
        setSelectedApp(prev => prev ? { ...prev, currentStage: 'INTERVIEW' as any, interviewStatus: 'INTERVIEW_INVITED' } : null);
      }
      
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to send interview invitation');
    } finally {
      setSubmittingStage(false);
    }
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
      await Promise.all(
        selectedIds.map(id => recruitmentService.moveStage(id, bulkActionStage, 'Bulk stage transition.'))
      );
      toast.success(`Successfully moved ${selectedIds.length} candidates to ${bulkActionStage}`);
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
      await Promise.all(
        selectedIds.map(id => recruitmentService.moveStage(id, 'REJECTED', reason || 'Bulk rejected.'))
      );
      toast.success(`Rejected ${selectedIds.length} candidates successfully.`);
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
            className={`w-3 h-3 ${star <= cleanScore ? 'text-amber-500 fill-amber-500' : 'text-zinc-650'}`}
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
    const stagesOrder = ['APPLIED', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'HIRED'] as const;
    
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
      case 'APPLIED': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'SCREENING': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
      case 'SHORTLISTED': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'INTERVIEW': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'HIRED': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      default: return 'bg-zinc-800 text-zinc-500 dark:text-zinc-400';
    }
  };

  // Pagination bounds
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="space-y-6 font-sans text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-[#050811] min-h-screen pb-12 p-1">
      {/* Navigation Headers */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#0e1422] p-1 rounded-xl border border-zinc-800/50">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 cursor-pointer block transition-colors">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 cursor-pointer block transition-colors">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-bold px-4 py-2 rounded-lg bg-zinc-100 dark:bg-[#161f30] text-blue-400 shadow-sm cursor-pointer block">
              ATS Pipeline Grid
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block transition-colors">
              Candidates Catalog
            </span>
          </Link>
          <Link href="/dashboard/recruitment/ai-interviews">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block transition-colors">
              AI Interviews
            </span>
          </Link>
        </div>
        <div>
          <Link href="/careers" target="_blank">
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 rounded-xl border-zinc-800 hover:bg-zinc-900 bg-transparent text-zinc-600 dark:text-zinc-350">
              Careers Portal
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics KPI Counters Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm text-left relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Total Applications</p>
          <h3 className="text-xl font-black mt-1 text-zinc-800 dark:text-zinc-250 group-hover:scale-105 transition-transform duration-300 origin-left">
            {stats?.totalApplications || 0}
          </h3>
        </div>
        <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm text-left relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">New Today</p>
          <h3 className="text-xl font-black mt-1 text-cyan-400 group-hover:scale-105 transition-transform duration-300 origin-left">
            {stats?.newToday || 0}
          </h3>
        </div>
        <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm text-left relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Screening</p>
          <h3 className="text-xl font-black mt-1 text-indigo-400 group-hover:scale-105 transition-transform duration-300 origin-left">
            {Number(stats?.pipelineStats?.SCREENING || 0) + Number(stats?.pipelineStats?.SHORTLISTED || 0)}
          </h3>
        </div>
        <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm text-left relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Interviews Scheduled</p>
          <h3 className="text-xl font-black mt-1 text-amber-400 group-hover:scale-105 transition-transform duration-300 origin-left">
            {stats?.pipelineStats?.INTERVIEW || 0}
          </h3>
        </div>
        <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm text-left relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Hired</p>
          <h3 className="text-xl font-black mt-1 text-emerald-450 group-hover:scale-105 transition-transform duration-300 origin-left">
            {stats?.pipelineStats?.HIRED || 0}
          </h3>
        </div>
        <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-sm text-left relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
          <p className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wider">Rejected</p>
          <h3 className="text-xl font-black mt-1 text-rose-400 group-hover:scale-105 transition-transform duration-300 origin-left">
            {stats?.pipelineStats?.REJECTED || 0}
          </h3>
        </div>
      </div>

      {/* Horizontal Pipeline Progression Flow Visualization */}
      {stageStats.length > 0 && (
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200 dark:border-zinc-850 p-4 rounded-xl">
          <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500 mb-3">Conversion & Stage Progression Funnel</h4>
          <div className="flex flex-col md:flex-row items-stretch justify-between gap-3 text-xs">
            {stageStats.map((item, idx) => (
              <React.Fragment key={item.name}>
                <div className="flex-1 bg-zinc-100/50 dark:bg-zinc-950/45 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-850 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[9px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{item.name}</span>
                    <span className="font-black text-blue-450 text-[10px] bg-blue-950/30 px-1.5 py-0.5 rounded-full">{item.count}</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <span className="text-[8px] text-zinc-500 font-bold block uppercase">Conversion Rate</span>
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-0.5 block">{item.conversionRate}%</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-500 font-bold block uppercase">Total Share</span>
                      <span className="text-xs font-black text-zinc-500 dark:text-zinc-400 mt-0.5 block">{item.percentage}%</span>
                    </div>
                  </div>
                </div>
                {idx < stageStats.length - 1 && (
                  <div className="hidden md:flex items-center justify-center text-zinc-700">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      {/* Filters Toolbar Row */}
      <div className="bg-white dark:bg-[#0e1422] p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-extrabold tracking-wider uppercase text-zinc-500">Recruiter Filters Panel</h4>
          <Button onClick={handleResetFilters} variant="ghost" size="sm" className="text-xs h-7 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:text-zinc-100 font-bold flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Candidate Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500 dark:text-zinc-550" />
            <Input
              placeholder="Search Name/Code..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-8 text-xs bg-white dark:bg-zinc-950/60 border-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 h-9 rounded-lg"
            />
          </div>

          {/* Skill Search */}
          <div className="relative">
            <Award className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500 dark:text-zinc-550" />
            <Input
              placeholder="Filter by Skill..."
              value={searchSkill}
              onChange={(e) => { setSearchSkill(e.target.value); setCurrentPage(1); }}
              className="pl-8 text-xs bg-white dark:bg-zinc-950/60 border-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-500 h-9 rounded-lg"
            />
          </div>

          {/* Job Position Filter */}
          <select
            value={selectedJobId}
            onChange={(e) => { setSelectedJobId(e.target.value); setCurrentPage(1); }}
            className="bg-white dark:bg-zinc-950/60 border border-zinc-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-350 focus:outline-none focus:border-blue-500 h-9 cursor-pointer"
          >
            <option value="ALL">All Jobs</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </select>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => { setSelectedStage(e.target.value); setCurrentPage(1); }}
            className="bg-white dark:bg-zinc-950/60 border border-zinc-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-350 focus:outline-none focus:border-blue-500 h-9 cursor-pointer"
          >
            <option value="ALL">All Stages</option>
            {ACTIVE_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="REJECTED">REJECTED</option>
          </select>

          {/* Experience Filter */}
          <select
            value={selectedExperience}
            onChange={(e) => { setSelectedExperience(e.target.value); setCurrentPage(1); }}
            className="bg-white dark:bg-zinc-950/60 border border-zinc-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-350 focus:outline-none focus:border-blue-500 h-9 cursor-pointer"
          >
            <option value="ALL">All Experience</option>
            <option value="Entry">Entry (0-2 years)</option>
            <option value="Mid">Mid (3-5 years)</option>
            <option value="Senior">Senior (5+ years)</option>
            <option value="Lead">Lead / Executive</option>
          </select>

          {/* AI Score Filter */}
          <select
            value={selectedAiScoreRange}
            onChange={(e) => { setSelectedAiScoreRange(e.target.value); setCurrentPage(1); }}
            className="bg-white dark:bg-zinc-950/60 border border-zinc-800 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-zinc-600 dark:text-zinc-350 focus:outline-none focus:border-blue-500 h-9 cursor-pointer"
          >
            <option value="ALL">All AI Scores</option>
            <option value="90">90%+ Match</option>
            <option value="80">80%+ Match</option>
            <option value="70">70%+ Match</option>
            <option value="low">Under 70% Match</option>
          </select>

          {/* Date Picker Range (HTML date) */}
          <div className="flex items-center gap-1 min-w-[170px]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="bg-white dark:bg-zinc-950/60 border border-zinc-800 text-[9px] font-semibold p-1 rounded-lg text-zinc-600 dark:text-zinc-350 focus:outline-none h-9 w-full cursor-pointer"
              title="Applied From"
            />
            <span className="text-[10px] text-zinc-650 font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="bg-white dark:bg-zinc-950/60 border border-zinc-800 text-[9px] font-semibold p-1 rounded-lg text-zinc-600 dark:text-zinc-350 focus:outline-none h-9 w-full cursor-pointer"
              title="Applied To"
            />
          </div>
        </div>
      </div>

      {/* Main Grid Table Container */}
      <Card className="bg-white dark:bg-[#0e1422] border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-850/80 flex items-center justify-between bg-zinc-950/15">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-zinc-300">Candidates Database</span>
            <span className="text-[10px] font-extrabold text-blue-450 bg-blue-950/20 px-2 py-0.5 rounded-full border border-blue-900/30">
              {totalItems} total record{totalItems !== 1 && 's'}
            </span>
          </div>
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-blue-450 font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              Loading database...
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-950/40">
              <TableRow className="hover:bg-transparent border-zinc-200 dark:border-zinc-850">
                <TableHead className="w-10 text-center pl-4">
                  <input
                    type="checkbox"
                    checked={applications.length > 0 && selectedIds.length === applications.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-800 accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                  />
                </TableHead>
                <TableHead onClick={() => handleSort('candidate')} className="text-xs font-bold text-zinc-450 pl-2 cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    Candidate
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'candidate' ? 'text-blue-500' : 'text-zinc-650'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('job')} className="text-xs font-bold text-zinc-450 cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    Job Applied
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'job' ? 'text-blue-500' : 'text-zinc-650'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('currentStage')} className="text-xs font-bold text-zinc-450 cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    Stage
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'currentStage' ? 'text-blue-500' : 'text-zinc-650'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('aiScore')} className="text-xs font-bold text-zinc-450 cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    AI Match
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'aiScore' ? 'text-blue-500' : 'text-zinc-650'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('experience')} className="text-xs font-bold text-zinc-450 cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    Experience
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'experience' ? 'text-blue-500' : 'text-zinc-650'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('appliedDate')} className="text-xs font-bold text-zinc-450 cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    Applied Date
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'appliedDate' ? 'text-blue-500' : 'text-zinc-650'}`} />
                  </div>
                </TableHead>
                <TableHead onClick={() => handleSort('recruiterScore')} className="text-xs font-bold text-zinc-450 cursor-pointer select-none">
                  <div className="flex items-center gap-1">
                    Recruiter Score
                    <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'recruiterScore' ? 'text-blue-500' : 'text-zinc-650'}`} />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-bold text-zinc-450 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.length === 0 ? (
                <TableRow className="hover:bg-transparent border-zinc-200 dark:border-zinc-850">
                  <TableCell colSpan={9} className="text-center py-20">
                    <div className="flex flex-col items-center justify-center space-y-2 text-zinc-500">
                      <HelpCircle className="w-10 h-10 text-zinc-700" />
                      <p className="text-xs font-black uppercase tracking-wider">No Candidates Found</p>
                      <p className="text-[10px] text-zinc-600">Try modifying filters or adding a new record</p>
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
                      className={`cursor-pointer hover:bg-zinc-950/20 border-zinc-200 dark:border-zinc-850 transition-colors ${
                        isChecked ? 'bg-blue-600/5' : isSelected ? 'bg-zinc-850/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="w-10 text-center pl-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(e.target.checked, app._id)}
                          className="rounded bg-zinc-950 border-zinc-800 accent-blue-600 w-3.5 h-3.5 cursor-pointer"
                        />
                      </TableCell>

                      {/* Candidate */}
                      <TableCell className="pl-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-xs text-zinc-900 dark:text-white uppercase shadow-sm shrink-0">
                            {cand.firstName[0]}
                            {cand.lastName[0]}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200 hover:text-blue-400 truncate">
                              {cand.firstName} {cand.lastName}
                            </h4>
                            <p className="text-[9px] text-zinc-500 font-extrabold tracking-wider mt-0.5">
                              {cand.candidateCode}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Job Applied */}
                      <TableCell>
                        <div className="min-w-[120px] max-w-[200px]">
                          <p className="text-xs font-bold text-zinc-600 dark:text-zinc-350 truncate">{job.title}</p>
                          <p className="text-[9px] text-zinc-500 dark:text-zinc-550 font-bold tracking-wide mt-0.5 truncate uppercase">
                            {job.departmentId?.name || 'Department'}
                          </p>
                        </div>
                      </TableCell>

                      {/* Current Stage */}
                      <TableCell>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full tracking-wider uppercase inline-block ${getStageBadgeColor(app.currentStage)}`}>
                          {app.currentStage}
                        </span>
                      </TableCell>

                      {/* AI Score / Interview Score */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {/* Resume Match Score */}
                          {app.screeningStatus === 'PENDING' ? (
                            <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full animate-pulse w-max">Queued</span>
                          ) : app.screeningStatus === 'PROCESSING' ? (
                            <span className="text-[9px] font-extrabold text-blue-500 bg-blue-500/10 border border-blue-500/25 px-2 py-0.5 rounded-full animate-pulse w-max">Screening...</span>
                          ) : app.screeningStatus === 'FAILED' ? (
                            <span className="text-[9px] font-extrabold text-rose-500 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded-full w-max" title={app.notes || 'Screening failed'}>Failed</span>
                          ) : app.aiScore !== undefined && app.aiScore !== null ? (
                            <div className="flex items-center gap-1.5 min-w-[70px]" title="Resume Match Score">
                              <span className="text-[10px] font-black text-blue-450">{app.aiScore}% (CV)</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-550 italic font-semibold w-max">Not Screened</span>
                          )}

                          {/* AI Interview Score */}
                          {app.interviewRecommendation && (
                            <div className="flex items-center gap-1.5 min-w-[70px]" title="AI Interview Score">
                              <span className="text-[10px] font-black text-purple-500">
                                {Math.round(app.interviewRecommendation.confidence * 100)}% (AI Int)
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Experience */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
                          <Briefcase className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[80px]">{cand.experience || 'Entry'}</span>
                        </div>
                      </TableCell>

                      {/* Applied Date */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-550 shrink-0" />
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
                          {app.interviewSession && (
                            <Link href={`/dashboard/recruitment/ai-interviews/${app.interviewSession._id}`}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="w-7 h-7 rounded hover:bg-purple-500/20 text-purple-500 hover:text-purple-400"
                                title="View AI Scorecard"
                              >
                                <Award className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          )}
                          <Button
                            onClick={() => openCandidateDrawer(app)}
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 rounded hover:bg-zinc-800/80 text-zinc-450 hover:text-zinc-800 dark:text-zinc-200"
                            title="Quick View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleHireCandidate(app._id)}
                            disabled={app.currentStage !== 'INTERVIEW'}
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 rounded hover:bg-emerald-950/20 text-emerald-500 disabled:opacity-30"
                            title={app.currentStage !== 'INTERVIEW' ? 'Must be in INTERVIEW stage to Hire' : 'Hire Candidate'}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            onClick={() => handleRejectCandidate(app._id)}
                            size="icon"
                            variant="ghost"
                            className="w-7 h-7 rounded hover:bg-red-950/20 text-red-500"
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
        <div className="p-4 bg-zinc-950/25 border-t border-zinc-200 dark:border-zinc-850 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-zinc-450">
          <div className="flex items-center gap-1.5">
            <span>View rows:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 focus:outline-none cursor-pointer text-zinc-300"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span className="text-zinc-650 ml-2">
              Showing {applications.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} candidates
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-lg p-0 border-zinc-800 bg-transparent disabled:opacity-30 hover:bg-zinc-950"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-350" />
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              variant="outline"
              size="sm"
              className="h-8 w-8 rounded-lg p-0 border-zinc-800 bg-transparent disabled:opacity-30 hover:bg-zinc-950"
            >
              <ChevronRight className="w-4 h-4 text-zinc-600 dark:text-zinc-350" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Slide-out Candidate Profiler Modal Panel */}
      {drawerOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Modal Body */}
          <div className="relative w-full h-full max-w-7xl bg-white dark:bg-[#0e1422] border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col transform transition-transform duration-300">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase ${getStageBadgeColor(selectedApp.currentStage)}`}>
                    {selectedApp.currentStage}
                  </span>
                  <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                    Sourcing ID: {selectedApp.candidateId?.candidateCode}
                  </span>
                </div>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1.5 flex items-center gap-2">
                  {selectedApp.candidateId?.firstName} {selectedApp.candidateId?.lastName}
                </h3>
                <p className="text-[11px] text-zinc-450 font-bold mt-0.5">
                  Job Target: {selectedApp.jobId?.title} • {selectedApp.jobId?.departmentId?.name || 'Department'}
                </p>
              </div>
              <Button
                onClick={() => setDrawerOpen(false)}
                size="icon"
                variant="ghost"
                className="w-8 h-8 rounded-lg hover:bg-zinc-900 text-zinc-450 hover:text-zinc-800 dark:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Progress Banner actions inside drawer */}
            {selectedApp.currentStage !== 'HIRED' && selectedApp.currentStage !== 'REJECTED' && (
              <div className="px-5 py-3 bg-zinc-950/20 border-b border-zinc-200 dark:border-zinc-850 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black uppercase text-zinc-500">Advance Candidate:</span>
                  <select
                    value={selectedApp.currentStage}
                    onChange={(e) => handleStageChange(selectedApp._id, e.target.value, 'Moved via drawer stage selectors')}
                    disabled={submittingStage}
                    className="bg-zinc-100 dark:bg-[#161f30] text-[10px] font-black px-2 py-1 rounded border border-zinc-800 text-zinc-600 dark:text-zinc-350 focus:outline-none cursor-pointer"
                  >
                    <option value={selectedApp.currentStage}>{selectedApp.currentStage}</option>
                    {ACTIVE_STAGES.indexOf(selectedApp.currentStage as any) > -1 && ACTIVE_STAGES.indexOf(selectedApp.currentStage as any) + 1 < ACTIVE_STAGES.length && (
                      <option value={ACTIVE_STAGES[ACTIVE_STAGES.indexOf(selectedApp.currentStage as any) + 1]}>
                        Move to {ACTIVE_STAGES[ACTIVE_STAGES.indexOf(selectedApp.currentStage as any) + 1]}
                      </option>
                    )}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleRejectCandidate(selectedApp._id)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] text-red-400 border-red-500/20 hover:bg-red-500/10 rounded-lg"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleInviteToInterview(selectedApp._id)}
                    disabled={submittingStage || (selectedApp.currentStage !== 'SHORTLISTED' && selectedApp.currentStage !== 'INTERVIEW')}
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] text-blue-400 border-blue-500/20 hover:bg-blue-500/10 rounded-lg flex items-center disabled:opacity-30"
                    title={selectedApp.currentStage !== 'SHORTLISTED' ? 'Candidate must be Shortlisted to invite to interview' : ''}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {selectedApp.interviewStatus === 'INTERVIEW_INVITED' ? 'Reschedule Interview' : 'Invite To Interview'}
                  </Button>
                  <Button
                    onClick={() => handleHireCandidate(selectedApp._id)}
                    disabled={selectedApp.currentStage !== 'INTERVIEW'}
                    size="sm"
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-zinc-900 dark:text-white font-bold text-[10px] flex items-center gap-1 rounded-lg disabled:opacity-30"
                    title={selectedApp.currentStage !== 'INTERVIEW' ? 'Candidate must be in Interview stage to Hire' : ''}
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-0.5" />
                    Hire Candidate
                  </Button>
                </div>
              </div>
            )}

            {/* Drawer Tab Headers Selector */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-850/80 px-4 bg-zinc-950/10 text-xs font-bold gap-1 py-1.5 overflow-x-auto shrink-0 scrollbar-none">
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
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-zinc-500 dark:text-zinc-550 hover:text-zinc-300'
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
                    <h4 className="font-extrabold uppercase text-zinc-500 text-[9px] tracking-wider mb-2">Key Contact Bio</h4>
                    <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850">
                      <div>
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Email Address</p>
                        <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                          {selectedApp.candidateId?.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Phone Number</p>
                        <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                          {selectedApp.candidateId?.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase">LinkedIn Profile</p>
                        {selectedApp.candidateId?.linkedinUrl ? (
                          <a href={selectedApp.candidateId.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1">
                            <LinkIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                            linkedin.com/profile
                          </a>
                        ) : (
                          <p className="font-bold text-zinc-400 dark:text-zinc-600 mt-1">N/A</p>
                        )}
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Portfolio / GitHub</p>
                        {selectedApp.candidateId?.portfolioUrl ? (
                          <a href={selectedApp.candidateId.portfolioUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-1 mt-1">
                            <LinkIcon className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                            sourcing portfolio
                          </a>
                        ) : (
                          <p className="font-bold text-zinc-400 dark:text-zinc-600 mt-1">N/A</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold uppercase text-zinc-500 text-[9px] tracking-wider mb-2">Work Status Details</h4>
                    <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850">
                      <div>
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Current Company</p>
                        <p className="font-bold text-zinc-800 dark:text-zinc-300 mt-1">{selectedApp.candidateId?.currentCompany || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Current Designation</p>
                        <p className="font-bold text-zinc-800 dark:text-zinc-300 mt-1">{selectedApp.candidateId?.currentDesignation || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Expected Compensation</p>
                        <p className="font-bold text-zinc-800 dark:text-zinc-300 mt-1">
                          {selectedApp.candidateId?.expectedSalary ? `$${selectedApp.candidateId.expectedSalary.toLocaleString()}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Notice Period</p>
                        <p className="font-bold text-zinc-800 dark:text-zinc-300 mt-1">{selectedApp.candidateId?.noticePeriod || 'Immediate'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Sourcing Source</p>
                        <span className="font-bold text-zinc-700 dark:text-zinc-350 bg-zinc-200/50 dark:bg-zinc-900 border border-zinc-300/50 dark:border-zinc-850 px-2 py-0.5 rounded mt-1 inline-block uppercase text-[10px]">
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
                  <h4 className="font-extrabold uppercase text-zinc-500 text-[9px] tracking-wider mb-1">Uploaded Resume Vault</h4>
                  {selectedApp.candidateId?.resume?.fileName ? (
                    <div className="flex-1 flex flex-col space-y-4">
                      <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl p-4 flex items-center justify-between bg-zinc-950/25">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-blue-955/35 text-blue-450 border border-blue-900/30 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[280px]">{selectedApp.candidateId.resume.fileName}</p>
                            <p className="text-[9px] text-zinc-500 dark:text-zinc-550 mt-0.5">Uploaded: {formatDate(selectedApp.candidateId.resume.uploadedAt)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleDownloadResume(selectedApp.candidateId?.resume?.fileName)}
                            size="icon"
                            variant="ghost"
                            className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
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
                              className="w-8 h-8 rounded-lg hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                              title="Native Preview File"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      </div>

                      {/* Browser Streaming preview panel container */}
                      <div className="flex-1 min-h-[340px] border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden bg-zinc-950/50 relative">
                        {/* Stream preview text helper */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-zinc-500 space-y-2 pointer-events-none">
                          <AlertCircle className="w-8 h-8 text-zinc-700" />
                          <p className="font-bold text-xs text-zinc-500 dark:text-zinc-400">PDF Document Stream Preview Container</p>
                          <p className="text-[10px] text-zinc-600 max-w-[340px]">Point to the external native review trigger if your sandbox blocks direct PDF embeds.</p>
                        </div>
                        <iframe
                          src={recruitmentService.getResumeDownloadUrl(selectedApp.candidateId.resume.fileName)}
                          className="w-full h-full border-0 relative z-10 opacity-90"
                          title="Candidate Resume Preview"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-850 rounded-xl bg-zinc-950/10">
                      <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
                      <p className="font-bold text-zinc-500 dark:text-zinc-400">No Resume document available</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">This applicant was registered without a PDF attachment.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Skills Tab */}
              {drawerTab === 'skills' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-extrabold uppercase text-zinc-500 text-[9px] tracking-wider mb-2">Candidate Skills Array</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.candidateId?.skills?.map((s, index) => (
                        <span key={`${s}-${index}`} className="text-[10px] font-bold px-2.5 py-1 rounded bg-zinc-100 dark:bg-[#161f30] text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                          {s}
                        </span>
                      )) || <span className="text-zinc-500 italic">No skills listed.</span>}
                    </div>
                  </div>

                  <div className="bg-zinc-950/20 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Check className="w-4 h-4 text-emerald-450" />
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">Matching Job Requirements</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApp.matchingSkills && selectedApp.matchingSkills.length > 0 ? (
                          selectedApp.matchingSkills.map((s, index) => (
                            <span key={`${s}-${index}`} className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-[10px] italic">No match intersections</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Info className="w-4 h-4 text-rose-400" />
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">Missing Sourcing Requirements</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApp.missingSkills && selectedApp.missingSkills.length > 0 ? (
                          selectedApp.missingSkills.map((s, index) => (
                            <span key={`${s}-${index}`} className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">{s}</span>
                          ))
                        ) : (
                          <span className="text-emerald-450 text-[10px] font-semibold italic">Perfect match! No missing skills</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Education Tab */}
              {drawerTab === 'education' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold uppercase text-zinc-500 text-[9px] tracking-wider mb-2">Academic Credentials</h4>
                  <div className="bg-zinc-950/25 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850">
                    <p className="text-[9px] text-zinc-500 font-extrabold uppercase">Education Details Summary</p>
                    <p className="text-xs font-bold text-zinc-300 mt-1">{selectedApp.candidateId?.education || 'No details registered'}</p>
                  </div>
                </div>
              )}

              {/* AI Resume Analysis Tab */}
              {drawerTab === 'ai' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold uppercase text-zinc-500 text-[9px] tracking-wider">AI Resume Scoring & Analysis</h4>
                    <span className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400">
                      Status: <span className="uppercase text-blue-450">{selectedApp.screeningStatus || 'PENDING'}</span>
                    </span>
                  </div>

                  {/* Queued / Processing States */}
                  {selectedApp.screeningStatus === 'PENDING' && (
                    <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-xl text-center space-y-3">
                      <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mx-auto" />
                      <p className="font-bold text-zinc-300">Queued for AI Screening</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-550">The background worker queue is picking up this document shortly. Please wait...</p>
                    </div>
                  )}

                  {selectedApp.screeningStatus === 'PROCESSING' && (
                    <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-xl text-center space-y-3">
                      <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
                      <p className="font-bold text-zinc-300">AI Screening in Progress...</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-550">FastAPI parser is reading text content and running OpenRouter analysis templates. Please wait...</p>
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
                      <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-xl text-center space-y-3">
                        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                        <div>
                          <p className="font-extrabold text-sm text-rose-400">{errInfo.title}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium leading-normal">{errInfo.desc}</p>
                        </div>
                        <div className="bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-lg text-left text-[9px] leading-relaxed">
                          <span className="font-extrabold uppercase text-rose-500 tracking-wide block mb-0.5">Actionable step:</span>
                          <span className="text-zinc-600 dark:text-zinc-350 font-medium">{errInfo.action}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Score & Recommendation */}
                  {selectedApp.screeningStatus !== 'PENDING' && selectedApp.screeningStatus !== 'PROCESSING' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-4 rounded-xl border border-blue-500/10">
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">Match Score</p>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl font-black text-blue-400">{selectedApp.aiScore || 0}%</span>
                          <span className="text-[9px] text-zinc-500 dark:text-zinc-550 font-bold">Match rating</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500/5 to-indigo-500/5 p-4 rounded-xl border border-purple-500/10">
                        <p className="text-[9px] text-zinc-500 font-extrabold uppercase tracking-wider">AI Sourcing Grade</p>
                        <p className="text-xs font-black text-purple-400 mt-2.5 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          {selectedApp.aiRecommendation || 'Sourcing grade pending'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {selectedApp.screeningStatus !== 'PENDING' && selectedApp.screeningStatus !== 'PROCESSING' && (
                    <div className="bg-zinc-950/25 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850">
                      <p className="text-[9px] text-zinc-500 font-extrabold uppercase mb-1">AI Screening Insights Summary</p>
                      <p className="text-xs leading-relaxed text-zinc-300 font-medium">{selectedApp.screeningSummary || 'Screening insights uncomputed.'}</p>
                    </div>
                  )}

                  {/* Run / Re-run Trigger Actions */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handleTriggerScreening(selectedApp._id)}
                      disabled={submittingStage || selectedApp.screeningStatus === 'PROCESSING'}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-zinc-900 dark:text-white font-bold w-full text-xs rounded-lg flex items-center justify-center gap-1.5 h-9"
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
                  <h4 className="font-extrabold uppercase text-zinc-500 text-[9px] tracking-wider mb-2">Interview Evaluations</h4>
                  <div className="bg-zinc-950/25 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-850/80">
                      <div>
                        <span className="text-[8px] text-zinc-500 dark:text-zinc-550 font-bold uppercase block">Technical Assessment Status</span>
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-350 mt-0.5 block">{selectedApp.interviewStatus || 'Scheduled'}</span>
                      </div>
                      {selectedApp.interviewScore !== undefined && selectedApp.interviewScore !== null && (
                        <div className="text-right">
                          <span className="text-[8px] text-zinc-500 dark:text-zinc-550 font-bold uppercase block">Score</span>
                          <span className="text-xs font-black text-amber-500 block">{selectedApp.interviewScore}/100</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-555 font-bold uppercase block">Assessment Feedback</span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mt-1 leading-relaxed">
                        {selectedApp.interviewFeedback || 'Feedback evaluation records pending completion of technical assessments.'}
                      </p>
                    </div>
                    {selectedApp.interviewCompletedAt && (
                      <p className="text-[9px] text-zinc-600 mt-2">
                        Completed at: {formatDate(selectedApp.interviewCompletedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Recruiter Evaluation Notes Tab */}
              {drawerTab === 'evaluation' && (
                <div className="space-y-5">
                  <h4 className="font-extrabold uppercase text-zinc-500 text-[9px] tracking-wider mb-2">Recruiter Evaluation & Star Rating</h4>
                  <div className="space-y-4 bg-zinc-950/25 p-4 rounded-xl border border-zinc-200 dark:border-zinc-850">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] text-zinc-500 font-extrabold uppercase">Recruiter Score Evaluation (1-5 Stars)</Label>
                      <div className="flex items-center gap-1.5 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRecruiterScoreVal(star)}
                            className="focus:outline-none transition-transform active:scale-90"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= recruiterScoreVal
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-zinc-800'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[9px] text-zinc-500 font-extrabold uppercase">Evaluation Evaluation Notes</Label>
                      <textarea
                        value={recruiterNotesVal}
                        onChange={(e) => setRecruiterNotesVal(e.target.value)}
                        placeholder="Write candidate evaluation highlights, review summary, or next assessment parameters..."
                        className="w-full h-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <Button
                      onClick={handleUpdateEvaluation}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-zinc-900 dark:text-white font-bold rounded-lg w-full text-xs"
                    >
                      Save Evaluation Evaluation
                    </Button>
                  </div>
                </div>
              )}

              {/* Timeline Tab */}
              {drawerTab === 'timeline' && (
                <div className="space-y-4">
                  <h4 className="font-extrabold uppercase text-zinc-500 text-[9px] tracking-wider mb-2">Stage Change Activity Log</h4>
                  <div className="space-y-3 pl-2 max-h-[380px] overflow-y-auto">
                    {selectedApp.stageHistory.map((hist, idx) => (
                      <div key={idx} className="text-[10px] leading-relaxed relative pb-2 border-l border-zinc-800 pl-4 last:border-l-0">
                        <div className="w-2.5 h-2.5 bg-blue-500/20 border border-blue-500 rounded-full absolute -left-[6px] top-1" />
                        <p className="font-black text-zinc-600 dark:text-zinc-350 uppercase">{hist.stage}</p>
                        {hist.notes && <p className="text-zinc-500 mt-0.5 italic">Comment: {hist.notes}</p>}
                        <p className="text-[8px] text-zinc-600 mt-1">
                          Date: {formatDate(hist.changedAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Close Actions Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-850 bg-zinc-950/20 flex items-center justify-end shrink-0">
              <Button onClick={() => setDrawerOpen(false)} variant="outline" className="text-xs rounded-xl border-zinc-800 bg-transparent text-zinc-600 dark:text-zinc-350 hover:bg-zinc-900">
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bulk Operations Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0c101b]/95 border border-blue-500/35 px-5 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-5 z-40 backdrop-blur-md max-w-xl w-[90%] sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse shrink-0" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
              {selectedIds.length} Checked
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Bulk Move Selector */}
            <div className="flex items-center gap-1">
              <select
                value={bulkActionStage}
                onChange={(e) => setBulkActionStage(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-[10px] font-black px-2 py-1 rounded focus:outline-none cursor-pointer text-zinc-600 dark:text-zinc-350 h-8"
              >
                <option value="">Move Stage...</option>
                {ACTIVE_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Button
                onClick={handleBulkMove}
                disabled={!bulkActionStage}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-zinc-900 dark:text-white font-bold text-[10px] h-8 rounded-lg"
              >
                Apply
              </Button>
            </div>

            {/* Bulk AI Screening */}
            <Button
              onClick={handleBulkScreen}
              size="sm"
              variant="outline"
              className="text-[10px] border-blue-500/20 text-blue-400 hover:bg-blue-500/10 rounded-lg h-8 px-2"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 shrink-0" />
              AI Screen
            </Button>

            {/* Reject Bulk */}
            <Button
              onClick={handleBulkReject}
              size="sm"
              variant="outline"
              className="text-[10px] border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg h-8 px-2"
            >
              <UserX className="w-3 h-3 mr-1 shrink-0" />
              Reject
            </Button>



            {/* Export Selected to CSV */}
            <Button
              onClick={handleBulkExport}
              size="sm"
              variant="outline"
              className="text-[10px] border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-900 rounded-lg h-8 px-2"
              title="Export to CSV"
            >
              <FileSpreadsheet className="w-3 h-3 mr-1 shrink-0" />
              Export
            </Button>

            {/* Send Bulk Mail */}
            <Button
              onClick={handleBulkSendEmail}
              size="sm"
              variant="outline"
              className="text-[10px] border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-900 rounded-lg h-8 px-2"
              title="Email selected candidates"
            >
              <Mail className="w-3 h-3 mr-1 shrink-0" />
              Email
            </Button>

            {/* Deselect All */}
            <Button
              onClick={() => setSelectedIds([])}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-zinc-900 text-zinc-450 hover:text-zinc-800 dark:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
