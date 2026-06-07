'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit2, Copy, Trash2, ArrowLeft, BookOpen, Clock, Sparkles, RefreshCw, FileText } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Template {
  _id: string;
  name: string;
  jobRole: string;
  department: string;
  experienceLevel: string;
  difficultyLevel: string;
  skillsRequired: string[];
  numQuestions: number;
  timeLimit: number;
  interviewType: string;
  maxAttempts: number;
  showResultsToCandidate?: boolean;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog form states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    jobRole: '',
    department: 'Engineering',
    experienceLevel: 'Mid',
    difficultyLevel: 'Medium',
    skillsRequired: '',
    numQuestions: 5,
    timeLimit: 15,
    interviewType: 'Mixed',
    maxAttempts: 1,
    showResultsToCandidate: false,
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await api.get('/recruitment/interviews/templates');
      setTemplates(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load interview templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({
      name: '',
      jobRole: '',
      department: 'Engineering',
      experienceLevel: 'Mid',
      difficultyLevel: 'Medium',
      skillsRequired: '',
      numQuestions: 5,
      timeLimit: 15,
      interviewType: 'Mixed',
      maxAttempts: 1,
      showResultsToCandidate: false,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (t: Template) => {
    setEditingId(t._id);
    setForm({
      name: t.name,
      jobRole: t.jobRole,
      department: t.department,
      experienceLevel: t.experienceLevel,
      difficultyLevel: t.difficultyLevel,
      skillsRequired: t.skillsRequired.join(', '),
      numQuestions: t.numQuestions,
      timeLimit: t.timeLimit,
      interviewType: t.interviewType,
      maxAttempts: t.maxAttempts,
      showResultsToCandidate: t.showResultsToCandidate || false,
    });
    setDialogOpen(true);
  };

  const handleClone = async (t: Template) => {
    try {
      const payload = {
        name: `${t.name} (Copy)`,
        jobRole: t.jobRole,
        department: t.department,
        experienceLevel: t.experienceLevel,
        difficultyLevel: t.difficultyLevel,
        skillsRequired: t.skillsRequired,
        numQuestions: t.numQuestions,
        timeLimit: t.timeLimit,
        interviewType: t.interviewType,
        maxAttempts: t.maxAttempts,
      };

      await api.post('/recruitment/interviews/templates', payload);
      toast.success('Template cloned successfully');
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to clone template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this template?')) return;
    try {
      await api.delete(`/recruitment/interviews/templates/${id}`);
      toast.success('Template archived successfully');
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to delete template');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillsArray = form.skillsRequired
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const payload = {
        ...form,
        skillsRequired: skillsArray
      };

      if (editingId) {
        await api.patch(`/recruitment/interviews/templates/${editingId}`, payload);
        toast.success('Template updated successfully');
      } else {
        await api.post('/recruitment/interviews/templates', payload);
        toast.success('Template created successfully');
      }

      setDialogOpen(false);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/recruitment/interviews">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Interview Templates Manager
            </h1>
          </div>
          <p className="text-white/60 text-xs pl-11">Configure reusable templates for AI-generated voice screening interviews.</p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="rounded-xl bg-[#8B5CF6] hover:bg-[#A855F7] text-white font-semibold text-xs h-10 border-0 cursor-pointer shadow-lg shadow-[#8B5CF6]/15"
        >
          <Plus className="w-4 h-4 mr-2" /> Create Template
        </Button>
      </div>

      {/* Main Table grid */}
      <Card className="bg-white/[0.02] border-white/10 rounded-[24px] overflow-hidden shadow-2xl">
        <Table>
          <TableHeader className="bg-white/[0.02] border-b border-white/10">
            <TableRow className="hover:bg-transparent border-white/10 text-white/50 text-[11px] uppercase tracking-wider font-mono">
              <TableHead className="py-4">Template Name Head</TableHead>
              <TableHead>Target Job Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Q&A Specs</TableHead>
              <TableHead>Max Attempts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20">
                  <RefreshCw className="w-6 h-6 text-[#8B5CF6] animate-spin mx-auto mb-2" />
                  <span className="text-xs text-white/40 font-medium">Reconstructing templates...</span>
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-white/45 italic text-xs">
                  No interview templates configured. Click 'Create Template' to start.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t._id} className="border-white/5 hover:bg-white/[0.01] transition-all">
                  <TableCell className="font-semibold text-white py-4 max-w-xs truncate">{t.name}</TableCell>
                  <TableCell className="text-white/70">{t.jobRole}</TableCell>
                  <TableCell className="text-white/70">{t.department}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20 px-2 py-0.5 rounded">
                      {t.interviewType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white/60 text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-[#8B5CF6]" /> {t.numQuestions} Questions</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#8B5CF6]" /> {t.timeLimit} Mins Limit</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/70">{t.maxAttempts} Attempts</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button onClick={() => handleOpenEdit(t)} variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-white/[0.04] text-white/60 hover:text-white" title="Edit Template">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={() => handleClone(t)} variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-white/[0.04] text-white/60 hover:text-white" title="Clone Template">
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={() => handleDelete(t._id)} variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-white/60 hover:text-red-400" title="Delete Template">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#0b0b0c] border border-white/10 rounded-[28px] max-w-lg text-white select-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
              {editingId ? 'Edit Interview Template' : 'Create Interview Template'}
            </DialogTitle>
            <DialogDescription className="text-xs text-white/40">
              Customize dynamic questions generation rules for candidate voice screening.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 my-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g. MERN Fullstack Engineering Interview"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-white/[0.03] border-white/10 text-white rounded-xl h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="jobRole">Target Job Role</Label>
                <Input
                  id="jobRole"
                  placeholder="e.g. Senior Node Developer"
                  value={form.jobRole}
                  onChange={(e) => setForm({ ...form, jobRole: e.target.value })}
                  className="bg-white/[0.03] border-white/10 text-white rounded-xl h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="e.g. Engineering"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="bg-white/[0.03] border-white/10 text-white rounded-xl h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="experienceLevel">Experience Level</Label>
                <Select
                  value={form.experienceLevel}
                  onValueChange={(val) => setForm({ ...form, experienceLevel: val || '' })}
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/10 rounded-xl h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0b0c] border border-white/10 text-white">
                    <SelectItem value="Junior">Junior</SelectItem>
                    <SelectItem value="Mid">Mid Level</SelectItem>
                    <SelectItem value="Senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="difficultyLevel">Difficulty Level</Label>
                <Select
                  value={form.difficultyLevel}
                  onValueChange={(val) => setForm({ ...form, difficultyLevel: val || '' })}
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/10 rounded-xl h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0b0c] border border-white/10 text-white">
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="interviewType">Interview Type</Label>
                <Select
                  value={form.interviewType}
                  onValueChange={(val) => setForm({ ...form, interviewType: val || '' })}
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/10 rounded-xl h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0b0b0c] border border-white/10 text-white">
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skillsRequired">Skills Assessed (Comma-separated)</Label>
              <Input
                id="skillsRequired"
                placeholder="e.g. React, NodeJS, MongoDB, JWT, TypeScript"
                value={form.skillsRequired}
                onChange={(e) => setForm({ ...form, skillsRequired: e.target.value })}
                className="bg-white/[0.03] border-white/10 text-white rounded-xl h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="numQuestions">Num Questions</Label>
                <Input
                  id="numQuestions"
                  type="number"
                  min={1}
                  value={form.numQuestions}
                  onChange={(e) => setForm({ ...form, numQuestions: parseInt(e.target.value) || 5 })}
                  className="bg-white/[0.03] border-white/10 text-white rounded-xl h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timeLimit">Time Limit (Mins)</Label>
                <Input
                  id="timeLimit"
                  type="number"
                  min={1}
                  value={form.timeLimit}
                  onChange={(e) => setForm({ ...form, timeLimit: parseInt(e.target.value) || 15 })}
                  className="bg-white/[0.03] border-white/10 text-white rounded-xl h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maxAttempts">Max Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  min={1}
                  value={form.maxAttempts}
                  onChange={(e) => setForm({ ...form, maxAttempts: parseInt(e.target.value) || 1 })}
                  className="bg-white/[0.03] border-white/10 text-white rounded-xl h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                id="showResultsToCandidate"
                type="checkbox"
                checked={form.showResultsToCandidate}
                onChange={(e) => setForm({ ...form, showResultsToCandidate: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-[#8B5CF6] focus:ring-[#8B5CF6] cursor-pointer"
              />
              <Label htmlFor="showResultsToCandidate" className="text-white/80 cursor-pointer">
                Release Interview Results/Report to Candidate
              </Label>
            </div>

            <DialogFooter className="pt-6 gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl border border-white/10 text-white/70 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-xl bg-[#8B5CF6] hover:bg-[#A855F7] text-white border-0 cursor-pointer px-6"
              >
                Save Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
