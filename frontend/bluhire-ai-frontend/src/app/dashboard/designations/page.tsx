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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, RefreshCw, Briefcase, Award, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Sort designations by level to show career ladder progression
  const sortedLevels = [...designations].sort((a, b) => a.level - b.level);

  return (
    <div className="space-y-8 select-none p-1">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Designations
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Establish job roles, configure level bands (1-7), and structure workforce hierarchies.
          </p>
        </div>
        {isHRorAdmin && (
          <Button 
            onClick={openCreateDialog} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 rounded-xl cursor-pointer shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" /> Create Designation
          </Button>
        )}
      </div>

      {/* Designation Career Ladder Path Visual */}
      <Card className="border-border bg-card/40 backdrop-blur-xl relative overflow-hidden group/card shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-primary animate-pulse" /> Career Ladder Path Map
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Workforce vertical progression pathways from entry level (L1) to executive leadership (L7).
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto py-6">
          <div className="flex items-center space-x-6 min-w-max p-2">
            {sortedLevels.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic py-2">
                <Sparkles className="w-4 h-4 text-muted-foreground/60" />
                No levels established yet. Designations you add will appear here in chronological order of their level.
              </div>
            ) : (
              sortedLevels.map((desg, idx) => (
                <React.Fragment key={desg._id}>
                  <motion.div 
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="flex flex-col items-center bg-card/60 border border-border/80 p-3.5 rounded-2xl w-32 shadow-xl hover:border-primary/30 transition-all duration-300 relative group/node"
                  >
                    {/* Level marker with glowing effect */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-indigo-600/10 border border-primary/30 text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-[0_0_15px_rgba(99,102,241,0.15)] group-hover/node:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all">
                      L{desg.level}
                    </div>
                    <span 
                      className="text-[11px] font-bold text-foreground mt-3 truncate w-full text-center group-hover/node:text-primary transition-colors" 
                      title={desg.title}
                    >
                      {desg.title}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono uppercase mt-1 tracking-wider">{desg.code}</span>
                  </motion.div>
                  {idx < sortedLevels.length - 1 && (
                    <div className="flex items-center shrink-0">
                      <ArrowRight className="w-5 h-5 text-muted-foreground/40 animate-pulse" />
                    </div>
                  )}
                </React.Fragment>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table grid layout */}
      <div className="bg-card/30 border border-border rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Loading designations list...</p>
          </div>
        ) : designations.length === 0 ? (
          <div className="text-center py-24 space-y-5">
            <div className="w-16 h-16 bg-muted/30 border border-border/60 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Briefcase className="w-8 h-8 text-muted-foreground/70" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <p className="text-sm font-semibold text-foreground">No designations established yet</p>
              <p className="text-xs text-muted-foreground">
                Set up job titles, assign grading levels, and map them to active departments.
              </p>
            </div>
            {isHRorAdmin && (
              <Button onClick={openCreateDialog} className="rounded-xl bg-primary text-primary-foreground cursor-pointer">
                Create your first Designation
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/20 border-b border-border/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-32 text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 px-6">Code</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Title</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Department</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Level Band</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4">Status</TableHead>
                {isHRorAdmin && <TableHead className="w-24 text-right text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-4 px-6">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {designations.map((desg) => {
                const deptName = typeof desg.departmentId === 'object' ? desg.departmentId?.name : departments.find(d => d._id === desg.departmentId)?.name || 'Unassigned';
                return (
                  <TableRow key={desg._id} className="hover:bg-muted/10 border-b border-border/40 transition-colors duration-150">
                    <TableCell className="font-mono text-xs font-semibold text-foreground py-4 px-6">
                      <span className="px-2 py-1 bg-muted/40 border border-border/50 rounded-lg text-foreground/90">
                        {desg.code}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div>
                        <div className="text-xs font-bold text-foreground">{desg.title}</div>
                        <div className="text-[11px] text-muted-foreground max-w-sm truncate mt-0.5" title={desg.description}>
                          {desg.description || 'No description provided.'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="rounded-lg text-[10px] font-bold bg-muted border border-border/40 text-muted-foreground">
                        {deptName}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="font-semibold text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                        Level {desg.level}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge 
                        variant={desg.isActive ? 'success' : 'secondary'} 
                        className={`rounded-lg text-[10px] font-bold border ${desg.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border/40'}`}
                      >
                        {desg.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {isHRorAdmin && (
                      <TableCell className="text-right py-4 px-6">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => openEditDialog(desg)} 
                            title="Edit details" 
                            className="h-8 w-8 rounded-lg cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(desg._id)}
                            className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-lg cursor-pointer"
                            title="Delete designation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      <AnimatePresence>
        {/* 1. Create Designation */}
        {dialogType === 'create' && (
          <Dialog open={true} onOpenChange={() => setDialogType('none')}>
            <DialogContent className="rounded-2xl border-border bg-card/95 backdrop-blur-2xl shadow-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Create Designation
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Designation Code <span className="text-destructive">*</span></label>
                    <Input 
                      placeholder="e.g. SDE2" 
                      value={code} 
                      onChange={(e) => setCode(e.target.value)} 
                      className="uppercase rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Title <span className="text-destructive">*</span></label>
                    <Input 
                      placeholder="e.g. Software Engineer II" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Department <span className="text-destructive">*</span></label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="" className="bg-popover text-foreground">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id} className="bg-popover text-foreground">{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Level Band (1-7) <span className="text-destructive">*</span></label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(parseInt(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                        <option key={l} value={l} className="bg-popover text-foreground">Level {l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                  <Textarea 
                    placeholder="Explain responsibilities, requirements & roles..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3} 
                    className="rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0" 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground">Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl cursor-pointer shadow-lg shadow-primary/20">Create Designation</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* 2. Edit Designation */}
        {dialogType === 'edit' && (
          <Dialog open={true} onOpenChange={() => setDialogType('none')}>
            <DialogContent className="rounded-2xl border-border bg-card/95 backdrop-blur-2xl shadow-2xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Edit className="w-4 h-4 text-primary" /> Edit Designation: <span className="font-mono text-primary">{selectedDesg?.code}</span>
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdate} className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Title <span className="text-destructive">*</span></label>
                  <Input 
                    placeholder="e.g. Software Engineer II" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    className="rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Department <span className="text-destructive">*</span></label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="" className="bg-popover text-foreground">Select Department...</option>
                      {departments.map((d) => (
                        <option key={d._id} value={d._id} className="bg-popover text-foreground">{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Level Band (1-7) <span className="text-destructive">*</span></label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(parseInt(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl border border-border bg-background/50 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((l) => (
                        <option key={l} value={l} className="bg-popover text-foreground">Level {l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                  <Textarea 
                    placeholder="Explain responsibilities, requirements & roles..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3} 
                    className="rounded-xl bg-background/50 border-border text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0" 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                  <Button type="button" variant="outline" onClick={() => setDialogType('none')} className="rounded-xl cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground">Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl cursor-pointer shadow-lg shadow-primary/20">Save Changes</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}



