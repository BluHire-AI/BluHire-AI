'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { designationService, Designation } from '@/services/designation.service';
import { departmentService, Department } from '@/services/department.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Plus, Edit, Trash2, RefreshCw, Briefcase, Search, Filter, 
  ArrowUpDown, Layers, ShieldCheck, Building2, ChevronRight, 
  TrendingUp, Award, CheckCircle2, ChevronDown, Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { motion, AnimatePresence } from 'framer-motion';

// Semantic Level Configuration derived from the 1-7 level bands in the backend model
const LEVEL_CONFIG: Record<number, { title: string; subtitle: string; badgeColor: string; pillColor: string; border: string }> = {
  1: { 
    title: 'Level 1', 
    subtitle: 'Entry Level', 
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    pillColor: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
    border: 'border-emerald-500/30'
  },
  2: { 
    title: 'Level 2', 
    subtitle: 'Mid Level', 
    badgeColor: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    pillColor: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800/40',
    border: 'border-sky-500/30'
  },
  3: { 
    title: 'Level 3', 
    subtitle: 'Senior', 
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    pillColor: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
    border: 'border-indigo-500/30'
  },
  4: { 
    title: 'Level 4', 
    subtitle: 'Lead', 
    badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    pillColor: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
    border: 'border-purple-500/30'
  },
  5: { 
    title: 'Level 5', 
    subtitle: 'Manager', 
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    pillColor: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    border: 'border-amber-500/30'
  },
  6: { 
    title: 'Level 6', 
    subtitle: 'Director', 
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    pillColor: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40',
    border: 'border-rose-500/30'
  },
  7: { 
    title: 'Level 7', 
    subtitle: 'Executive', 
    badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    pillColor: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800/40',
    border: 'border-violet-500/30'
  },
};

export default function DesignationsPage() {
  const { user } = useAuthStore();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'LEVEL_ASC' | 'LEVEL_DESC' | 'DEPARTMENT'>('LEVEL_ASC');
  
  // Interactive Career Paths Selection
  const [selectedCareerDesg, setSelectedCareerDesg] = useState<Designation | null>(null);

  // Dialog State
  const [dialogType, setDialogType] = useState<'none' | 'create' | 'edit'>('none');
  const [selectedDesg, setSelectedDesg] = useState<Designation | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [level, setLevel] = useState(1);
  const [description, setDescription] = useState('');

  const isHRorAdmin = user?.role === 'MANAGEMENT_ADMIN' || user?.role === 'HR_RECRUITER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [desgsRes, deptsRes] = await Promise.all([
        designationService.list({ page: 1, limit: 100 }).catch(() => ({ designations: [], total: 0 })),
        departmentService.getActive().catch(() => [])
      ]);
      setDesignations(desgsRes?.designations || []);
      setDepartments(deptsRes || []);
    } catch (error) {
      toast.error('Failed to load designation records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to extract clean department name
  const getDeptName = (deptId: Designation['departmentId']): string => {
    if (typeof deptId === 'object' && deptId !== null && deptId.name) {
      return deptId.name;
    }
    const match = departments.find(d => d._id === String(deptId));
    return match?.name || 'General';
  };

  const getDeptIdString = (deptId: Designation['departmentId']): string => {
    if (typeof deptId === 'object' && deptId !== null && deptId._id) {
      return deptId._id;
    }
    return String(deptId || '');
  };

  // Helper for designation code fallback
  const getDesignationCode = (desg: Designation): string => {
    if (desg.code && desg.code !== 'undefined' && desg.code.trim()) {
      return desg.code.toUpperCase();
    }
    // Deterministic initials from title + Level
    const words = desg.title.trim().split(/\s+/);
    const initials = words.map(w => w[0]?.toUpperCase() || '').join('').slice(0, 3);
    return `${initials || 'ROLE'}-L${desg.level}`;
  };

  // Dynamic Summary Statistics Calculation
  const totalDesignationsCount = designations.length;
  const activeDesignationsCount = designations.filter(d => d.isActive !== false).length;
  
  const distinctLevels = useMemo(() => {
    const set = new Set(designations.map(d => d.level).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [designations]);

  const distinctDepartmentsCount = useMemo(() => {
    const set = new Set(designations.map(d => getDeptName(d.departmentId)));
    return set.size;
  }, [designations, departments]);

  // Grouped designations by Level for Career Paths
  const designationsByLevel = useMemo(() => {
    const map = new Map<number, Designation[]>();
    // Sort all designations by title
    const sorted = [...designations].sort((a, b) => a.title.localeCompare(b.title));
    
    sorted.forEach((d) => {
      const lvl = d.level || 1;
      if (!map.has(lvl)) {
        map.set(lvl, []);
      }
      map.get(lvl)!.push(d);
    });

    // Return entries sorted by level ascending
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [designations]);

  // Filtered & Sorted Designations List for the main cards/grid
  const filteredDesignations = useMemo(() => {
    return designations
      .filter((desg) => {
        // Status filter
        const isActive = desg.isActive !== false;
        if (statusFilter === 'ACTIVE' && !isActive) return false;
        if (statusFilter === 'INACTIVE' && isActive) return false;

        // Level filter
        if (levelFilter !== 'ALL' && String(desg.level) !== levelFilter) return false;

        // Department filter
        if (deptFilter !== 'ALL') {
          const dId = getDeptIdString(desg.departmentId);
          const dName = getDeptName(desg.departmentId);
          if (dId !== deptFilter && dName !== deptFilter) return false;
        }

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const code = getDesignationCode(desg).toLowerCase();
        const title = desg.title.toLowerCase();
        const desc = (desg.description || '').toLowerCase();
        const dept = getDeptName(desg.departmentId).toLowerCase();

        return title.includes(q) || code.includes(q) || desc.includes(q) || dept.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'NAME') return a.title.localeCompare(b.title);
        if (sortBy === 'LEVEL_ASC') return a.level - b.level || a.title.localeCompare(b.title);
        if (sortBy === 'LEVEL_DESC') return b.level - a.level || a.title.localeCompare(b.title);
        if (sortBy === 'DEPARTMENT') {
          const deptA = getDeptName(a.departmentId);
          const deptB = getDeptName(b.departmentId);
          return deptA.localeCompare(deptB) || a.level - b.level;
        }
        return 0;
      });
  }, [designations, departments, searchQuery, statusFilter, levelFilter, deptFilter, sortBy]);

  // Dialog Handlers
  const openCreateDialog = () => {
    setTitle('');
    setCode('');
    setDepartmentId(departments[0]?._id || '');
    setLevel(1);
    setDescription('');
    setDialogType('create');
  };

  const openEditDialog = (desg: Designation) => {
    setSelectedDesg(desg);
    setTitle(desg.title);
    setCode(getDesignationCode(desg));
    setDepartmentId(getDeptIdString(desg.departmentId));
    setLevel(desg.level || 1);
    setDescription(desg.description || '');
    setDialogType('edit');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !departmentId) {
      toast.error('Title and Department are required');
      return;
    }
    try {
      await designationService.create({
        title,
        code: code.trim() ? code.toUpperCase() : undefined,
        departmentId,
        level,
        description
      });
      toast.success('Designation created successfully');
      setDialogType('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create designation');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesg) return;
    if (!title.trim() || !departmentId) {
      toast.error('Title and Department are required');
      return;
    }
    try {
      await designationService.update(selectedDesg._id, {
        title,
        departmentId,
        level,
        description
      });
      toast.success('Designation updated successfully');
      setDialogType('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update designation');
    }
  };

  const handleDelete = async (id: string, desgTitle: string) => {
    if (!confirm(`Are you sure you want to delete designation "${desgTitle}"?`)) return;
    try {
      await designationService.delete(id);
      toast.success('Designation deleted successfully');
      if (selectedCareerDesg?._id === id) {
        setSelectedCareerDesg(null);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete designation');
    }
  };

  return (
    <div className="space-y-6 select-none p-1 pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground dark:text-white">
            Designations
          </h1>
          <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-1">
            Define job roles, career levels, and progression paths across the organization.
          </p>
        </div>
        
        {isHRorAdmin && (
          <Button 
            onClick={openCreateDialog} 
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white gap-2 rounded-xl h-10.5 px-4 font-semibold cursor-pointer transition-all shadow-md shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" /> Create Designation
          </Button>
        )}
      </div>

      {/* 2. Summary Statistics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Designations */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl shadow-xs rounded-2xl p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground dark:text-zinc-400">Total Designations</p>
                <h3 className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalDesignationsCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Active Designations */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.04 }}>
          <Card className="border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl shadow-xs rounded-2xl p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground dark:text-zinc-400">Active Designations</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeDesignationsCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Career Levels */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.08 }}>
          <Card className="border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl shadow-xs rounded-2xl p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground dark:text-zinc-400">Career Levels</p>
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{distinctLevels.length}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/50 dark:border-purple-800/40 flex items-center justify-center">
                <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Departments Covered */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.12 }}>
          <Card className="border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl shadow-xs rounded-2xl p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground dark:text-zinc-400">Departments Covered</p>
                <h3 className="text-2xl font-bold text-sky-600 dark:text-sky-400 mt-1">{distinctDepartmentsCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/50 dark:border-sky-800/40 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* 3. Career Paths Section (Job Architecture & Level Progression) */}
      <Card className="border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-base font-bold text-foreground dark:text-white">Career Paths</h2>
            </div>
            <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1">
              Explore progression from entry-level roles to senior leadership across organizational grading bands.
            </p>
          </div>

          {selectedCareerDesg && (
            <button
              onClick={() => setSelectedCareerDesg(null)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto font-medium"
            >
              Reset selection
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Loading career architecture...</p>
          </div>
        ) : designationsByLevel.length === 0 ? (
          <div className="py-12 px-6 text-center text-xs text-muted-foreground">
            No designations currently registered to construct career paths.
          </div>
        ) : (
          <div className="p-5">
            {/* Horizontal level columns with connecting indicators */}
            <div className="overflow-x-auto pb-3">
              <div className="flex items-start gap-4 min-w-max">
                {designationsByLevel.map(([lvl, desgsInLevel], colIndex) => {
                  const levelMeta = LEVEL_CONFIG[lvl] || {
                    title: `Level ${lvl}`,
                    subtitle: 'Standard Level',
                    badgeColor: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
                    pillColor: 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 border-zinc-300 dark:border-zinc-700',
                    border: 'border-zinc-500/30'
                  };

                  const isNextLevel = selectedCareerDesg && (lvl === (selectedCareerDesg.level || 1) + 1);
                  const isPrevLevel = selectedCareerDesg && (lvl === (selectedCareerDesg.level || 1) - 1);
                  const isCurrentLevel = selectedCareerDesg && (lvl === (selectedCareerDesg.level || 1));

                  return (
                    <React.Fragment key={lvl}>
                      {/* Column for Level */}
                      <div className={`w-64 shrink-0 rounded-2xl p-3.5 transition-all duration-200 border ${
                        isCurrentLevel
                          ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400/50 shadow-sm'
                          : isNextLevel || isPrevLevel
                            ? 'bg-muted/30 dark:bg-white/[0.02] border-indigo-200/40 dark:border-white/10'
                            : 'bg-muted/20 dark:bg-white/[0.015] border-border/60 dark:border-white/5'
                      }`}>
                        {/* Level Header Badge */}
                        <div className="flex items-center justify-between pb-3 border-b border-border/40 dark:border-white/5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-extrabold border ${levelMeta.badgeColor}`}>
                                {levelMeta.title}
                              </span>
                              <span className="text-[11px] font-semibold text-foreground dark:text-zinc-300">
                                {levelMeta.subtitle}
                              </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {desgsInLevel.length} {desgsInLevel.length === 1 ? 'Role' : 'Roles'}
                            </p>
                          </div>
                        </div>

                        {/* Roles inside this Level */}
                        <div className="space-y-2 mt-3 max-h-[380px] overflow-y-auto pr-1">
                          {desgsInLevel.map((desg) => {
                            const isSelected = selectedCareerDesg?._id === desg._id;
                            const deptName = getDeptName(desg.departmentId);
                            const desgCode = getDesignationCode(desg);
                            const isActive = desg.isActive !== false;

                            return (
                              <div
                                key={desg._id}
                                onClick={() => setSelectedCareerDesg(isSelected ? null : desg)}
                                className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 relative ${
                                  isSelected
                                    ? 'bg-card dark:bg-[#121528] border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                                    : 'bg-card/70 dark:bg-white/[0.03] border-border/70 dark:border-white/5 hover:border-indigo-300/60 dark:hover:border-purple-800/40 hover:bg-card dark:hover:bg-white/[0.05]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="text-xs font-bold text-foreground dark:text-white leading-snug">
                                    {desg.title}
                                  </h4>
                                  <span className="text-[9px] font-mono font-semibold text-muted-foreground/80 dark:text-zinc-400 bg-muted/60 dark:bg-white/[0.05] px-1 py-0.5 rounded shrink-0">
                                    {desgCode}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between gap-2 mt-2">
                                  <span className="text-[10px] font-medium text-indigo-600 dark:text-purple-300 truncate max-w-[130px]">
                                    {deptName}
                                  </span>
                                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-400'}`} title={isActive ? 'Active role' : 'Inactive role'} />
                                </div>

                                {desg.description && (
                                  <p className="text-[10px] text-muted-foreground dark:text-zinc-400 line-clamp-2 mt-1.5">
                                    {desg.description}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Progression Connector Between Columns */}
                      {colIndex < designationsByLevel.length - 1 && (
                        <div className="flex items-center justify-center self-center pt-10 text-muted-foreground/40 dark:text-white/20 shrink-0">
                          <ChevronRight className="w-5 h-5 animate-pulse" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Selected Designation Detail Drawer / Action Tray */}
            {selectedCareerDesg && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    L{selectedCareerDesg.level}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground dark:text-white">
                        {selectedCareerDesg.title}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/60 dark:bg-white/10 font-bold text-muted-foreground dark:text-zinc-300">
                        {getDesignationCode(selectedCareerDesg)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-0.5">
                      Department: <strong className="text-foreground dark:text-white">{getDeptName(selectedCareerDesg.departmentId)}</strong> • Band: Level {selectedCareerDesg.level} ({LEVEL_CONFIG[selectedCareerDesg.level]?.subtitle || 'Standard'})
                    </p>
                  </div>
                </div>

                {isHRorAdmin && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(selectedCareerDesg)}
                      className="h-8 rounded-lg text-xs font-semibold border-indigo-200 dark:border-indigo-800/60 bg-card hover:bg-muted cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit Role
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(selectedCareerDesg._id, selectedCareerDesg.title)}
                      className="h-8 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        )}
      </Card>

      {/* 4. Search, Filter & Control Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 bg-card/90 dark:bg-[#0e101e]/80 backdrop-blur-2xl p-3.5 border border-border/80 dark:border-white/10 rounded-2xl shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
          <Input
            placeholder="Search designations by title, code, description, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 rounded-xl text-sm text-foreground dark:text-white focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Filters and Sorting Controls */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Level Filter */}
          <div className="relative">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-10 pl-8 pr-7 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white border border-border dark:border-white/15 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
            >
              <option value="ALL" className="bg-popover text-foreground">All Levels</option>
              {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                <option key={l} value={String(l)} className="bg-popover text-foreground">Level {l} ({LEVEL_CONFIG[l]?.subtitle || 'Standard'})</option>
              ))}
            </select>
            <Layers className="absolute left-2.5 top-3.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Department Filter */}
          <div className="relative">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="h-10 pl-8 pr-7 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white border border-border dark:border-white/15 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
            >
              <option value="ALL" className="bg-popover text-foreground">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id} className="bg-popover text-foreground">{d.name}</option>
              ))}
            </select>
            <Building2 className="absolute left-2.5 top-3.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 pl-8 pr-7 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white border border-border dark:border-white/15 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
            >
              <option value="ALL" className="bg-popover text-foreground">All Statuses</option>
              <option value="ACTIVE" className="bg-popover text-foreground">Active Only</option>
              <option value="INACTIVE" className="bg-popover text-foreground">Inactive Only</option>
            </select>
            <Filter className="absolute left-2.5 top-3.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 pl-8 pr-7 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white border border-border dark:border-white/15 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
            >
              <option value="LEVEL_ASC" className="bg-popover text-foreground">Sort: Level (Low to High)</option>
              <option value="LEVEL_DESC" className="bg-popover text-foreground">Sort: Level (High to Low)</option>
              <option value="NAME" className="bg-popover text-foreground">Sort by Title</option>
              <option value="DEPARTMENT" className="bg-popover text-foreground">Sort by Department</option>
            </select>
            <ArrowUpDown className="absolute left-2.5 top-3.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadData} 
            className="h-10 w-10 rounded-xl border-border dark:border-white/10 bg-background/50 dark:bg-white/[0.03] cursor-pointer hover:bg-muted text-muted-foreground"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 5. Designations Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-card/40 dark:bg-[#0e101e]/40 border border-border/80 dark:border-white/10 rounded-2xl backdrop-blur-xl">
          <RefreshCw className="w-7 h-7 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Loading organization designations...</p>
        </div>
      ) : filteredDesignations.length === 0 ? (
        <div className="text-center py-20 bg-card/40 dark:bg-[#0e101e]/40 border border-border/80 dark:border-white/10 rounded-2xl backdrop-blur-xl space-y-3">
          <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-semibold text-foreground dark:text-white">
            {totalDesignationsCount === 0 ? 'No designations yet' : 'No designations match your search'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {totalDesignationsCount === 0
              ? "Create job roles and career levels to build your organization's job architecture."
              : 'Try clearing your search keyword or changing your level and department filters.'}
          </p>
          {isHRorAdmin && (
            <Button onClick={openCreateDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold h-9 px-4 mt-2 cursor-pointer">
              <Plus className="w-3.5 h-3.5 mr-1" /> Create Designation
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDesignations.map((desg, index) => {
            const deptName = getDeptName(desg.departmentId);
            const desgCode = getDesignationCode(desg);
            const levelMeta = LEVEL_CONFIG[desg.level] || {
              title: `Level ${desg.level}`,
              subtitle: 'Standard Level',
              badgeColor: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
              pillColor: 'bg-zinc-100 dark:bg-zinc-800/40 text-zinc-400 border-zinc-300 dark:border-zinc-700',
              border: 'border-zinc-500/30'
            };
            const isActive = desg.isActive !== false;

            return (
              <motion.div
                key={desg._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
              >
                <Card className="h-full border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/90 backdrop-blur-xl rounded-2xl shadow-xs hover:border-indigo-300/60 dark:hover:border-purple-800/60 transition-all duration-200 flex flex-col justify-between overflow-hidden">
                  <div className="p-5 space-y-4">
                    {/* Card Top Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50/80 dark:bg-purple-950/50 border border-indigo-100 dark:border-purple-800/40 flex items-center justify-center shrink-0 mt-0.5">
                          <Briefcase className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm text-foreground dark:text-white leading-tight">
                              {desg.title}
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground/70 dark:text-zinc-400 bg-muted/60 dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
                              {desgCode}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1 line-clamp-2 min-h-[32px]">
                            {desg.description || 'No job description configured for this designation.'}
                          </p>
                        </div>
                      </div>

                      {/* Status Indicator Badge */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold select-none border shrink-0 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                          : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="h-px bg-border/40 dark:bg-white/5 w-full" />

                    {/* Metadata Pill Indicators */}
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {/* Department Attribute */}
                      <div className="p-2.5 rounded-xl bg-muted/30 dark:bg-white/[0.02] border border-border/50 dark:border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 dark:text-zinc-400 block mb-1">
                          Department
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground dark:text-white truncate">
                          <Building2 className="w-3.5 h-3.5 text-indigo-500 dark:text-purple-400 shrink-0" />
                          <span className="truncate">{deptName}</span>
                        </div>
                      </div>

                      {/* Level Attribute (Prominent Visual Hierarchy) */}
                      <div className="p-2.5 rounded-xl bg-muted/30 dark:bg-white/[0.02] border border-border/50 dark:border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 dark:text-zinc-400 block mb-1">
                          Career Level
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${levelMeta.badgeColor}`}>
                            {levelMeta.title}
                          </span>
                          <span className="text-[11px] font-semibold text-muted-foreground dark:text-zinc-300 truncate">
                            {levelMeta.subtitle}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions Bar (Matching Departments Page Style) */}
                  {isHRorAdmin && (
                    <div className="px-5 py-3 bg-muted/20 dark:bg-white/[0.02] border-t border-border/40 dark:border-white/5 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-muted-foreground/70 dark:text-zinc-400">
                        Band {desg.level} of 7
                      </span>

                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(desg)}
                          className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer px-2.5 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(desg._id, desg.title)}
                          title="Delete Designation" 
                          className="h-8 w-8 rounded-lg cursor-pointer hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 6. Create & Edit Dialogs (Matching Departments Page Modal Implementation) */}
      {/* Create Designation Dialog */}
      <Dialog open={dialogType === 'create'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent className="rounded-2xl border-border dark:border-white/10 bg-card dark:bg-[#0e101e] backdrop-blur-2xl shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground dark:text-white flex items-center gap-2">
              <Briefcase className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" /> Create Designation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a new job title, grading level, and department alignment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
                  Role Code <span className="text-destructive">*</span>
                </label>
                <Input 
                  placeholder="e.g. SWE-L2" 
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                  className="uppercase rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-foreground dark:text-white" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
                  Job Title <span className="text-destructive">*</span>
                </label>
                <Input 
                  placeholder="e.g. Software Engineer II" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-foreground dark:text-white" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
                  Department <span className="text-destructive">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border dark:border-white/15 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="" className="bg-popover text-foreground">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id} className="bg-popover text-foreground">{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
                  Level Band (1-7) <span className="text-destructive">*</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-border dark:border-white/15 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                    <option key={l} value={l} className="bg-popover text-foreground">Level {l} ({LEVEL_CONFIG[l]?.subtitle || 'Standard'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
                Description
              </label>
              <Textarea 
                placeholder="Outline key responsibilities, competencies, and grading requirements..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={3} 
                className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-foreground dark:text-white" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl border-border text-foreground cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer font-semibold">
                Create Designation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Designation Dialog */}
      <Dialog open={dialogType === 'edit'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent className="rounded-2xl border-border dark:border-white/10 bg-card dark:bg-[#0e101e] backdrop-blur-2xl shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground dark:text-white flex items-center gap-2">
              <Edit className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" /> Edit Designation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update job details and career band assignment for this role.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
                Job Title <span className="text-destructive">*</span>
              </label>
              <Input 
                placeholder="e.g. Software Engineer II" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-foreground dark:text-white" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
                  Department <span className="text-destructive">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-border dark:border-white/15 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="" className="bg-popover text-foreground">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id} className="bg-popover text-foreground">{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
                  Level Band (1-7) <span className="text-destructive">*</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl border border-border dark:border-white/15 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                    <option key={l} value={l} className="bg-popover text-foreground">Level {l} ({LEVEL_CONFIG[l]?.subtitle || 'Standard'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
                Description
              </label>
              <Textarea 
                placeholder="Describe scope, responsibilities & roles..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={3} 
                className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 text-foreground dark:text-white" 
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl border-border text-foreground cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer font-semibold">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
