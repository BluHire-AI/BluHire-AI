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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-4 gap-4">
        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-2xl border border-white/10">
          <Link href="/dashboard/recruitment">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-white/60 hover:text-white cursor-pointer block transition-all">
              Overview
            </span>
          </Link>
          <Link href="/dashboard/recruitment/jobs">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-white/60 hover:text-white cursor-pointer block transition-all">
              Job Posts
            </span>
          </Link>
          <Link href="/dashboard/recruitment/pipeline">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-white/60 hover:text-white cursor-pointer block transition-all">
              Pipeline Board
            </span>
          </Link>
          <Link href="/dashboard/recruitment/candidates">
            <span className="text-xs font-bold px-4 py-2 rounded-xl bg-[#8B5CF6] text-white shadow-md cursor-pointer block transition-all">
              Candidates
            </span>
          </Link>
          <Link href="/dashboard/recruitment/ai-interviews">
            <span className="text-xs font-bold px-4 py-2 rounded-xl text-white/60 hover:text-white cursor-pointer block transition-all">
              AI Interviews
            </span>
          </Link>
        </div>
      </div>

      <div className="pb-6 border-b border-white/10">
        <h1 className="text-[40px] md:text-[48px] font-extrabold tracking-tight text-white leading-none">
          Candidates Catalog
        </h1>
        <p className="text-white/60 text-sm mt-2 font-medium">
          View, search, and manage candidate talent profiles in your talent pool.
        </p>
      </div>

      {/* Toolbar Filter */}
      <div className="flex gap-3 items-center justify-between bg-white/[0.03] backdrop-blur-xl p-4 rounded-[24px] border border-white/10 shadow-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
          <Input
            placeholder="Search candidates by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 rounded-xl bg-white/[0.02] border-white/10 focus:border-[#8B5CF6]/50 focus:ring-[#8B5CF6]/20 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Candidates Table List */}
      <Card className="bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-2xl rounded-[24px] overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-white/45 font-semibold flex items-center justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-[#8B5CF6]/20 border-t-[#8B5CF6] animate-spin mr-3" />
            Loading candidates database...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="text-center py-20 text-white/40">No candidate profiles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/[0.015] border-b border-white/10">
                <TableRow className="border-white/10">
                  <TableHead className="text-xs font-bold uppercase text-white/40 tracking-wider pl-6">Candidate Code</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-white/40 tracking-wider">Candidate Name</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-white/40 tracking-wider">Contact Details</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-white/40 tracking-wider">Skills Profile</TableHead>
                  <TableHead className="text-xs font-bold uppercase text-white/40 tracking-wider text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCandidates.map((cand) => (
                  <TableRow key={cand._id} className="hover:bg-white/[0.015] border-b border-white/10 transition-colors">
                    <TableCell className="text-xs font-bold text-white/40 pl-6">{cand.candidateCode}</TableCell>
                    <TableCell className="text-xs font-bold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#A855F7] flex items-center justify-center font-bold text-[10px] text-white uppercase shrink-0">
                          {cand.firstName[0]}{cand.lastName[0]}
                        </div>
                        <span>{cand.firstName} {cand.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-white/80 space-y-0.5">
                      <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-white/20" /> {cand.email}</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-white/20" /> {cand.phone}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {cand.skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-white/[0.04] text-white border border-white/10">
                            {skill}
                          </span>
                        ))}
                        {cand.skills.length > 3 && (
                          <span className="text-[9px] text-white/40 font-semibold mt-0.5">+{cand.skills.length - 3} more</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      {cand.resume?.fileName && (
                        <div className="flex justify-end items-center">
                          <Button onClick={() => handleDownloadResume(cand.resume?.fileName)} size="icon" variant="ghost" className="w-8 h-8 rounded-xl hover:bg-white/[0.06] text-white/60 hover:text-white">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
