'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { recruitmentService, Candidate } from '@/services/recruitment.service';
import { Search, Mail, Phone, Eye, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function CandidatesDirectory() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function loadCandidates() {
    try {
      setLoading(true);
      const result = await recruitmentService.listCandidates({ limit: 100 });
      setCandidates(result.candidates);
    } catch (error) {
      console.error('Failed to load candidates:', error);
      toast.error('Failed to retrieve candidates directory.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCandidates();
  }, []);

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
    } catch (error: any) {
      toast.error('Could not download resume file.');
    }
  };

  const filteredCandidates = candidates.filter((cand) => {
    const term = search.toLowerCase();
    return (
      cand.firstName.toLowerCase().includes(term) ||
      cand.lastName.toLowerCase().includes(term) ||
      cand.email.toLowerCase().includes(term) ||
      cand.candidateCode.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#0e1422] p-1 rounded-xl">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-bold px-4 py-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer block">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-bold px-4 py-2 rounded-lg bg-white dark:bg-[#161f30] text-blue-600 dark:text-blue-400 shadow-sm cursor-pointer block">
              Candidates
            </span>
          </Link>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="flex gap-3 items-center justify-between bg-white dark:bg-[#0e1422] p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search candidates by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 rounded-xl"
          />
        </div>
      </div>

      {/* Candidates Table List */}
      <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm rounded-2xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-zinc-400 font-semibold flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
            Loading candidates database...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">No candidate profiles found.</div>
        ) : (
          <Table>
            <TableHeader className="bg-zinc-50/50 dark:bg-[#111827]/40">
              <TableRow>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Candidate Code</TableHead>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Candidate Name</TableHead>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Contact Details</TableHead>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500">Skills Profile</TableHead>
                <TableHead className="text-xs font-extrabold uppercase text-zinc-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((cand) => (
                <TableRow key={cand._id} className="hover:bg-zinc-50/30 dark:hover:bg-[#111827]/10 transition-colors">
                  <TableCell className="text-xs font-bold text-zinc-500">{cand.candidateCode}</TableCell>
                  <TableCell className="text-xs font-black text-zinc-800 dark:text-zinc-100">{cand.firstName} {cand.lastName}</TableCell>
                  <TableCell className="text-xs text-zinc-650 space-y-0.5">
                    <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-zinc-400" /> {cand.email}</p>
                    <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-zinc-400" /> {cand.phone}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {cand.skills.slice(0, 3).map((skill) => (
                        <span key={skill} className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border border-zinc-200/20 dark:border-zinc-800/20">
                          {skill}
                        </span>
                      ))}
                      {cand.skills.length > 3 && (
                        <span className="text-[9px] text-zinc-400 font-semibold mt-0.5">+{cand.skills.length - 3} more</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right flex items-center justify-end gap-1.5 h-12">
                    {cand.resume?.fileName && (
                      <Button onClick={() => handleDownloadResume(cand.resume?.fileName)} size="icon" variant="ghost" className="w-8 h-8 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850">
                        <Download className="w-4 h-4 text-zinc-400" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
