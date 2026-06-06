'use client';

import React, { useState, useEffect } from 'react';
import { departmentService, Department } from '@/services/department.service';
import { employeeService, Employee } from '@/services/employee.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit, RefreshCw, X, Building, UserCheck, ShieldAlert, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { motion } from 'framer-motion';

export default function DepartmentsPage() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogType, setDialogType] = useState<'none' | 'create' | 'edit' | 'assign-head'>('none');
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

  return (
    <div className="space-y-8 select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Departments</h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">Establish and manage company subdivisions, assign leads, and monitor workforce distributions.</p>
        </div>
        {isHRorAdmin && (
          <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl cursor-pointer transition shadow-lg shadow-primary/10">
            <Plus className="w-4 h-4" /> Create Department
          </Button>
        )}
      </div>

      <div className="glass border border-border bg-card/40 rounded-2xl overflow-hidden shadow-2xl glow-primary/5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Loading departments list...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Building className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground font-medium">No departments established yet.</p>
            {isHRorAdmin && <Button onClick={openCreateDialog} className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">Create your first Department</Button>}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border/80">
                <TableHead className="w-32 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Code</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Department Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Head of Department</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Employee Count</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                {isHRorAdmin && <TableHead className="w-24 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept._id} className="hover:bg-muted/20 border-b border-border/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-foreground">
                    {dept.code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-xs font-bold text-foreground">{dept.name}</div>
                      <div className="text-[11px] text-muted-foreground max-w-sm truncate" title={dept.description}>
                        {dept.description || 'No description provided.'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dept.headId ? (
                      <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <UserCheck className="w-3.5 h-3.5 text-success" />
                        {dept.headId.firstName} {dept.headId.lastName}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">Vacant</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-lg font-bold text-[10px] border-border bg-muted/40 text-foreground">
                      {dept.employeeCount || 0} Members
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      disabled={!isHRorAdmin}
                      onClick={() => handleToggleStatus(dept._id)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold select-none border transition-colors ${
                        dept.isActive
                          ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      } ${!isHRorAdmin ? 'cursor-default pointer-events-none' : 'cursor-pointer'}`}
                    >
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </TableCell>
                  {isHRorAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openAssignHeadDialog(dept)} title="Assign Head" className="h-8 w-8 rounded-lg cursor-pointer hover:bg-muted">
                          <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(dept)} title="Edit details" className="h-8 w-8 rounded-lg cursor-pointer hover:bg-muted">
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog Modals */}
      {/* 1. Create Department */}
      <Dialog open={dialogType === 'create'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent className="rounded-2xl border-border bg-card glass shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Create Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department Code <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. ENG" value={code} onChange={(e) => setCode(e.target.value)} className="uppercase rounded-xl bg-muted/50 border-border focus:ring-primary focus:outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department Name <span className="text-destructive">*</span></label>
                <Input placeholder="e.g. Engineering" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl bg-muted/50 border-border focus:ring-primary focus:outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <Textarea placeholder="Explain responsibilities..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl bg-muted/50 border-border focus:ring-primary focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl border-border hover:bg-muted text-foreground cursor-pointer">Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl cursor-pointer">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Department */}
      <Dialog open={dialogType === 'edit'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent className="rounded-2xl border-border bg-card glass shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Edit Department: {selectedDept?.code}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department Name <span className="text-destructive">*</span></label>
              <Input placeholder="e.g. Engineering" value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl bg-muted/50 border-border focus:ring-primary focus:outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
              <Textarea placeholder="Explain responsibilities..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl bg-muted/50 border-border focus:ring-primary focus:outline-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl border-border hover:bg-muted text-foreground cursor-pointer">Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl cursor-pointer">Save changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Assign Head */}
      <Dialog open={dialogType === 'assign-head'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent className="rounded-2xl border-border bg-card glass shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold uppercase tracking-wider text-foreground">Assign Department Head: {selectedDept?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignHead} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Head of Department</label>
              <select
                value={headEmployeeId}
                onChange={(e) => setHeadEmployeeId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
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
              <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl border-border hover:bg-muted text-foreground cursor-pointer">Cancel</Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl cursor-pointer">Assign Head</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


