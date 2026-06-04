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
import { toast } from 'sonner';
import { Plus, Edit, RefreshCw, X, Building, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Departments</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Establish and manage company subdivisions, assign leads, and monitor workforce distributions.</p>
        </div>
        {isHRorAdmin && (
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Create Department
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-zinc-500 dark:text-zinc-400">Loading departments list...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Building className="w-12 h-12 text-zinc-300 mx-auto" />
            <p className="text-zinc-500 dark:text-zinc-400">No departments established yet.</p>
            {isHRorAdmin && <Button onClick={openCreateDialog}>Create your first Department</Button>}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Code</TableHead>
                <TableHead>Department Name</TableHead>
                <TableHead>Head of Department</TableHead>
                <TableHead>Employee Count</TableHead>
                <TableHead>Status</TableHead>
                {isHRorAdmin && <TableHead className="w-24 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                  <TableCell className="font-semibold text-zinc-900 dark:text-zinc-200">
                    {dept.code}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-200">{dept.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm truncate" title={dept.description}>
                        {dept.description || 'No description provided.'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dept.headId ? (
                      <span className="text-sm font-semibold flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-green-600" />
                        {dept.headId.firstName} {dept.headId.lastName} ({dept.headId.employeeCode})
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400 italic">Vacant</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-bold">
                      {dept.employeeCount || 0} Members
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      disabled={!isHRorAdmin}
                      onClick={() => handleToggleStatus(dept._id)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold select-none ${
                        dept.isActive
                          ? 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-400'
                          : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400'
                      } ${!isHRorAdmin ? 'cursor-default pointer-events-none' : 'cursor-pointer'}`}
                    >
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </TableCell>
                  {isHRorAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openAssignHeadDialog(dept)} title="Assign Head">
                          <UserCheck className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(dept)} title="Edit details">
                          <Edit className="w-4 h-4" />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Department</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Department Code <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. ENG" value={code} onChange={(e) => setCode(e.target.value)} className="uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Department Name <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. Engineering" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Description</label>
              <Textarea placeholder="Explain responsibilities..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Department */}
      <Dialog open={dialogType === 'edit'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department: {selectedDept?.code}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Department Name <span className="text-red-500">*</span></label>
              <Input placeholder="e.g. Engineering" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Description</label>
              <Textarea placeholder="Explain responsibilities..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Save changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Assign Head */}
      <Dialog open={dialogType === 'assign-head'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Department Head: {selectedDept?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignHead} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Head of Department</label>
              <select
                value={headEmployeeId}
                onChange={(e) => setHeadEmployeeId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
              >
                <option value="">Keep Vacant / Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogType('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Assign Head</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
