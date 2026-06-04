'use client';

import React, { useState, useEffect } from 'react';
import { designationService, Designation } from '@/services/designation.service';
import { departmentService, Department } from '@/services/department.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, RefreshCw, Briefcase } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';

export default function DesignationsPage() {
  const { user } = useAuthStore();
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

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

  const openCreateDialog = () => {
    setTitle('');
    setCode('');
    setDepartmentId('');
    setLevel(1);
    setDescription('');
    setDialogType('create');
  };

  const openEditDialog = (desg: Designation) => {
    setSelectedDesg(desg);
    setTitle(desg.title);
    setCode(desg.code);
    setDepartmentId(typeof desg.departmentId === 'string' ? desg.departmentId : desg.departmentId?._id || '');
    setLevel(desg.level);
    setDescription(desg.description || '');
    setDialogType('edit');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim() || !departmentId) {
      toast.error('Title, Code & Department are required');
      return;
    }
    try {
      await designationService.create({
        title,
        code: code.toUpperCase(),
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
      toast.error('Title & Department are required');
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this designation?')) return;
    try {
      await designationService.delete(id);
      toast.success('Designation deleted successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete designation');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Designations</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Establish job roles, configure level bands (1-7), and structure workforce hierarchies.</p>
        </div>
        {isHRorAdmin && (
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Create Designation
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-zinc-500 dark:text-zinc-400">Loading designations list...</p>
          </div>
        ) : designations.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Briefcase className="w-12 h-12 text-zinc-300 mx-auto" />
            <p className="text-zinc-500 dark:text-zinc-400">No designations established yet.</p>
            {isHRorAdmin && <Button onClick={openCreateDialog}>Create your first Designation</Button>}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Code</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level Band</TableHead>
                <TableHead>Status</TableHead>
                {isHRorAdmin && <TableHead className="w-24 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {designations.map((desg) => {
                const deptName = typeof desg.departmentId === 'object' ? desg.departmentId?.name : departments.find(d => d._id === desg.departmentId)?.name || 'Unassigned';
                return (
                  <TableRow key={desg._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-200">
                      {desg.code}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-200">{desg.title}</div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm truncate" title={desg.description}>
                          {desg.description || 'No description provided.'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{deptName}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Level {desg.level}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={desg.isActive ? 'success' : 'secondary'}>
                        {desg.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {isHRorAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(desg)} title="Edit details">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(desg._id)}
                            className="text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
                            title="Delete designation"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Dialog Modals */}
      {/* 1. Create Designation */}
      <Dialog open={dialogType === 'create'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Designation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Designation Code <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. SDE2" value={code} onChange={(e) => setCode(e.target.value)} className="uppercase" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Title <span className="text-red-500">*</span></label>
                <Input placeholder="e.g. Software Engineer II" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Department <span className="text-red-500">*</span></label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Level Band (1-7) <span className="text-red-500">*</span></label>
                <select
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                    <option key={l} value={l}>Level {l}</option>
                  ))}
                </select>
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

      {/* 2. Edit Designation */}
      <Dialog open={dialogType === 'edit'} onOpenChange={(open) => !open && setDialogType('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Designation: {selectedDesg?.code}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Title <span className="text-red-500">*</span></label>
              <Input placeholder="e.g. Software Engineer II" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Department <span className="text-red-500">*</span></label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Level Band (1-7) <span className="text-red-500">*</span></label>
                <select
                  value={level}
                  onChange={(e) => setLevel(parseInt(e.target.value))}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                    <option key={l} value={l}>Level {l}</option>
                  ))}
                </select>
              </div>
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
    </div>
  );
}
