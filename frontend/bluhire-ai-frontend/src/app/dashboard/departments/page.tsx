'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { departmentService, Department } from '@/services/department.service';
import { employeeService, Employee } from '@/services/employee.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Plus, Edit, RefreshCw, Building2, UserCheck, Search, Users, 
  Layers, Code2, TrendingUp, DollarSign, Cog, ShieldCheck, 
  Filter, ArrowUpDown, ChevronRight, Trash2
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { motion } from 'framer-motion';

export default function DepartmentsPage() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'EMPLOYEES' | 'CODE'>('NAME');

  // Dialog State
  const [dialogType, setDialogType] = useState<'none' | 'create' | 'edit' | 'assign-head' | 'view-members'>('none');
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [headEmployeeId, setHeadEmployeeId] = useState('');

  const isHRorAdmin = user?.role === 'MANAGEMENT_ADMIN' || user?.role === 'HR_RECRUITER';

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptsRes, employeesRes] = await Promise.all([
        departmentService.list({ page: 1, limit: 100 }).catch(() => ({ departments: [], total: 0 })),
        employeeService.list({ limit: 100 }).catch(() => ({ employees: [], total: 0 }))
      ]);
      setDepartments(deptsRes?.departments || []);
      setEmployees(employeesRes?.employees || []);
    } catch (error) {
      toast.error('Failed to load department records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute exact employee count for a department accurately
  const getDepartmentEmployeeCount = (dept: Department): number => {
    // If backend attached valid employeeCount, prefer it
    if (dept.employeeCount !== undefined && dept.employeeCount !== null && dept.employeeCount > 0) {
      return dept.employeeCount;
    }
    // Dynamic matching against frontend loaded employees list
    return employees.filter((emp) => {
      if (emp.isDeleted) return false;
      
      const empDeptId = typeof emp.departmentId === 'object' && emp.departmentId !== null
        ? (emp.departmentId as any)._id || (emp.departmentId as any).id
        : emp.departmentId;

      const empDeptName = typeof emp.departmentId === 'object' && emp.departmentId !== null
        ? (emp.departmentId as any).name
        : null;

      if (empDeptId && String(empDeptId) === String(dept._id)) return true;
      if (empDeptName && empDeptName.toLowerCase() === dept.name.toLowerCase()) return true;
      return false;
    }).length;
  };

  // Get department members list
  const getDepartmentMembers = (deptId: string, deptName: string): Employee[] => {
    return employees.filter((emp) => {
      if (emp.isDeleted) return false;
      const empDeptId = typeof emp.departmentId === 'object' && emp.departmentId !== null
        ? (emp.departmentId as any)._id || (emp.departmentId as any).id
        : emp.departmentId;

      const empDeptName = typeof emp.departmentId === 'object' && emp.departmentId !== null
        ? (emp.departmentId as any).name
        : null;

      return (empDeptId && String(empDeptId) === String(deptId)) || 
             (empDeptName && empDeptName.toLowerCase() === deptName.toLowerCase());
    });
  };

  // Filtered & Sorted Departments
  const filteredDepartments = useMemo(() => {
    return departments
      .filter((dept) => {
        // Status filter
        if (statusFilter === 'ACTIVE' && !dept.isActive) return false;
        if (statusFilter === 'INACTIVE' && dept.isActive) return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const deptName = dept.name.toLowerCase();
        const deptCode = dept.code.toLowerCase();
        const deptDesc = (dept.description || '').toLowerCase();
        const headName = dept.headId ? `${dept.headId.firstName} ${dept.headId.lastName}`.toLowerCase() : '';

        return deptName.includes(q) || deptCode.includes(q) || deptDesc.includes(q) || headName.includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'NAME') return a.name.localeCompare(b.name);
        if (sortBy === 'CODE') return a.code.localeCompare(b.code);
        if (sortBy === 'EMPLOYEES') {
          return getDepartmentEmployeeCount(b) - getDepartmentEmployeeCount(a);
        }
        return 0;
      });
  }, [departments, employees, searchQuery, statusFilter, sortBy]);

  // Statistics Summary Metrics
  const totalDepartmentsCount = departments.length;
  const activeDepartmentsCount = departments.filter((d) => d.isActive).length;
  const totalEmployeesCount = employees.filter((e) => !e.isDeleted).length;

  // Department Icon Map
  const getDepartmentIcon = (deptName: string) => {
    const lower = deptName.toLowerCase();
    if (lower.includes('eng') || lower.includes('software') || lower.includes('tech')) return <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    if (lower.includes('hr') || lower.includes('human') || lower.includes('people')) return <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    if (lower.includes('sal') || lower.includes('market')) return <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    if (lower.includes('fin') || lower.includes('account')) return <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    if (lower.includes('ops') || lower.includes('operation')) return <Cog className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
    if (lower.includes('prod') || lower.includes('design')) return <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    return <Building2 className="w-5 h-5 text-slate-600 dark:text-zinc-400" />;
  };

  // Dialog Handlers
  const openCreateDialog = () => {
    setName('');
    setCode('');
    setDescription('');
    setDialogType('create');
  };

  const openEditDialog = (dept: Department) => {
    setSelectedDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setDescription(dept.description || '');
    setDialogType('edit');
  };

  const openAssignHeadDialog = (dept: Department) => {
    setSelectedDept(dept);
    setHeadEmployeeId(dept.headId?._id || '');
    setDialogType('assign-head');
  };

  const openViewMembersDialog = (dept: Department) => {
    setSelectedDept(dept);
    setDialogType('view-members');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Name & Code are required');
      return;
    }
    try {
      await departmentService.create({ name, code: code.toUpperCase(), description });
      toast.success('Department created successfully');
      setDialogType('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await departmentService.update(selectedDept._id, { name, description });
      toast.success('Department updated successfully');
      setDialogType('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update department');
    }
  };

  const handleAssignHead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      if (headEmployeeId) {
        await departmentService.assignHead(selectedDept._id, headEmployeeId);
        toast.success('Department Head assigned successfully');
      } else {
        await departmentService.removeHead(selectedDept._id);
        toast.success('Department Head removed successfully');
      }
      setDialogType('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign department head');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await departmentService.toggleStatus(id);
      toast.success('Department status updated');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (dept: Department) => {
    const empCount = getDepartmentEmployeeCount(dept);
    if (empCount > 0) {
      toast.error(`Cannot delete department with ${empCount} active employees.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete department "${dept.name}"?`)) return;

    try {
      await departmentService.delete(dept._id);
      toast.success('Department deleted successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    }
  };

  return (
    <div className="space-y-6 select-none p-1 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground dark:text-white">
            Departments
          </h1>
          <p className="text-sm text-muted-foreground dark:text-zinc-400 mt-1">
            Manage company departments, department leads, workforce distribution, and organizational structure.
          </p>
        </div>
        
        {isHRorAdmin && (
          <Button 
            onClick={openCreateDialog} 
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white gap-2 rounded-xl h-10.5 px-4 font-semibold cursor-pointer transition-all shadow-md shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" /> Create Department
          </Button>
        )}
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <Card className="border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl shadow-xs rounded-2xl p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground dark:text-zinc-400">Total Departments</p>
                <h3 className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalDepartmentsCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/40 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }}>
          <Card className="border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl shadow-xs rounded-2xl p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground dark:text-zinc-400">Active Departments</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{activeDepartmentsCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }}>
          <Card className="border border-border/80 dark:border-white/10 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl shadow-xs rounded-2xl p-4.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground dark:text-zinc-400">Total Employees Assigned</p>
                <h3 className="text-2xl font-bold text-foreground dark:text-white mt-1">{totalEmployeesCount}</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/50 dark:border-purple-800/40 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Toolbar: Search, Filters & Sorting */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card/90 dark:bg-[#0e101e]/80 backdrop-blur-2xl p-3.5 border border-border/80 dark:border-white/10 rounded-2xl shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
          <Input
            placeholder="Search departments, codes, descriptions, or leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 rounded-xl text-sm text-foreground dark:text-white focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 pl-9 pr-8 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white border border-border dark:border-white/15 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
            >
              <option value="ALL" className="bg-popover text-foreground">All Statuses</option>
              <option value="ACTIVE" className="bg-popover text-foreground">Active Only</option>
              <option value="INACTIVE" className="bg-popover text-foreground">Inactive Only</option>
            </select>
            <Filter className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 pl-9 pr-8 bg-background/50 dark:bg-white/[0.03] text-foreground dark:text-white border border-border dark:border-white/15 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer appearance-none"
            >
              <option value="NAME" className="bg-popover text-foreground">Sort by Name</option>
              <option value="EMPLOYEES" className="bg-popover text-foreground">Sort by Employees</option>
              <option value="CODE" className="bg-popover text-foreground">Sort by Code</option>
            </select>
            <ArrowUpDown className="absolute left-3 top-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
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

      {/* Departments Grid Display */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-card/40 dark:bg-[#0e101e]/40 border border-border/80 dark:border-white/10 rounded-2xl backdrop-blur-xl">
          <RefreshCw className="w-7 h-7 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Loading company departments...</p>
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="text-center py-20 bg-card/40 dark:bg-[#0e101e]/40 border border-border/80 dark:border-white/10 rounded-2xl backdrop-blur-xl space-y-3">
          <Building2 className="w-12 h-12 text-muted-foreground/50 mx-auto" />
          <h3 className="text-base font-semibold text-foreground dark:text-white">No departments found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery || statusFilter !== 'ALL' 
              ? 'No departments match your current filter criteria.' 
              : 'Create your first department to organize your workforce.'}
          </p>
          {isHRorAdmin && (
            <Button onClick={openCreateDialog} className="bg-primary text-primary-foreground rounded-xl text-xs font-semibold h-9 px-4 mt-2 cursor-pointer">
              <Plus className="w-3.5 h-3.5 mr-1" /> Create Department
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept, index) => {
            const empCount = getDepartmentEmployeeCount(dept);
            const headName = dept.headId ? `${dept.headId.firstName} ${dept.headId.lastName}` : null;
            const headEmail = dept.headId?.email || null;

            return (
              <motion.div
                key={dept._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <Card className="h-full border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/90 backdrop-blur-xl rounded-2xl shadow-xs hover:border-indigo-300/60 dark:hover:border-purple-800/60 transition-all duration-200 flex flex-col justify-between overflow-hidden">
                  <div className="p-5 space-y-4">
                    {/* Card Top Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50/80 dark:bg-purple-950/50 border border-indigo-100 dark:border-purple-800/40 flex items-center justify-center shrink-0">
                          {getDepartmentIcon(dept.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm text-foreground dark:text-white leading-tight">
                              {dept.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-muted-foreground/70 dark:text-zinc-500 bg-muted/60 dark:bg-white/[0.05] px-1.5 py-0.5 rounded">
                              {dept.code}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1 line-clamp-2 min-h-[32px]">
                            {dept.description || 'No description provided for this department.'}
                          </p>
                        </div>
                      </div>

                      <button
                        disabled={!isHRorAdmin}
                        onClick={() => handleToggleStatus(dept._id)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold select-none border transition-colors shrink-0 ${
                          dept.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-zinc-100 dark:bg-zinc-800/50 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                        } ${!isHRorAdmin ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                      >
                        {dept.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div className="h-px bg-border/40 dark:bg-white/5 w-full" />

                    {/* Employee Count Pill */}
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => openViewMembersDialog(dept)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-purple-300 hover:underline cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{empCount} {empCount === 1 ? 'Employee' : 'Employees'}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Head of Department Section */}
                    <div className="pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 dark:text-zinc-400 mb-1.5">
                        Head of Department
                      </p>
                      {headName ? (
                        <div className="flex items-center gap-2 bg-muted/40 dark:bg-white/[0.03] p-2 rounded-xl border border-border/50 dark:border-white/5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {headName.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground dark:text-white truncate">
                              {headName}
                            </p>
                            {headEmail && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {headEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-muted/20 dark:bg-white/[0.02] p-2 rounded-xl border border-dashed border-border/60 dark:border-white/10 text-xs text-muted-foreground italic">
                          <span>Vacant</span>
                          {isHRorAdmin && (
                            <button 
                              onClick={() => openAssignHeadDialog(dept)}
                              className="text-[10px] font-semibold text-indigo-600 dark:text-purple-300 not-italic hover:underline cursor-pointer"
                            >
                              + Assign Lead
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Actions Bar */}
                  {isHRorAdmin && (
                    <div className="px-5 py-3 bg-muted/20 dark:bg-white/[0.02] border-t border-border/40 dark:border-white/5 flex items-center justify-between gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openAssignHeadDialog(dept)}
                        className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer px-2.5 rounded-lg"
                      >
                        <UserCheck className="w-3.5 h-3.5 mr-1" /> Lead
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => openEditDialog(dept)}
                          className="h-8 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer px-2.5 rounded-lg"
                        >
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        
                        {empCount === 0 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(dept)}
                            title="Delete Department" 
                            className="h-8 w-8 rounded-lg cursor-pointer hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dialog Modals */}
      {/* 1. Create Department */}
      <Dialog open={dialogType === 'create'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent className="rounded-2xl border-border dark:border-white/10 bg-card dark:bg-[#0e101e] backdrop-blur-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground dark:text-white">Create Department</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Add a new operational department to the organization.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Department Code <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. ENG" value={code} onChange={(e) => setCode(e.target.value)} className="uppercase rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Department Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Engineering" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Description</label>
              <Textarea placeholder="Describe department scope & responsibilities..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl border-border text-foreground cursor-pointer">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer">Create Department</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Department */}
      <Dialog open={dialogType === 'edit'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent className="rounded-2xl border-border dark:border-white/10 bg-card dark:bg-[#0e101e] backdrop-blur-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground dark:text-white">Edit Department: {selectedDept?.code}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Update department title and operational description.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Department Name <span className="text-destructive">*</span></label>
              <Input placeholder="e.g. Engineering" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Description</label>
              <Textarea placeholder="Describe department scope..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl border-border text-foreground cursor-pointer">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Assign Head */}
      <Dialog open={dialogType === 'assign-head'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent className="rounded-2xl border-border dark:border-white/10 bg-card dark:bg-[#0e101e] backdrop-blur-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground dark:text-white">Assign Department Head: {selectedDept?.name}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Select an active employee to lead this department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignHead} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">Head of Department</label>
              <select
                value={headEmployeeId}
                onChange={(e) => setHeadEmployeeId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border dark:border-white/15 bg-background/70 dark:bg-white/[0.04] text-foreground dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
              >
                <option value="" className="bg-popover text-foreground">Keep Vacant / Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id} className="bg-popover text-foreground">
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl border-border text-foreground cursor-pointer">Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer">Assign Head</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. View Department Members */}
      <Dialog open={dialogType === 'view-members'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent className="rounded-2xl border-border dark:border-white/10 bg-card dark:bg-[#0e101e] backdrop-blur-2xl shadow-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground dark:text-white">
              {selectedDept?.name} Members
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Active employees assigned to this department.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2 max-h-[350px] overflow-y-auto pr-1">
            {selectedDept && getDepartmentMembers(selectedDept._id, selectedDept.name).length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-6 text-center">No active members in this department.</p>
            ) : (
              selectedDept && getDepartmentMembers(selectedDept._id, selectedDept.name).map((emp) => (
                <div key={emp._id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 dark:bg-white/[0.03] border border-border/50 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {emp.email} • {emp.employeeCode}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-mono font-semibold">
                    {emp.employmentStatus || 'ACTIVE'}
                  </Badge>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="outline" onClick={() => setDialogType('none')} className="rounded-xl border-border text-foreground cursor-pointer text-xs">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



