'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, Search, Building2, Eye } from 'lucide-react';
import { recruitmentService, Job } from '@/services/recruitment.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { BluHireBackground } from '@/components/layout/BluHireBackground';

export default function CareersLandingPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [locationFilter, setLocationFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  useEffect(() => {
    async function loadJobs() {
      try {
        setLoading(true);
        const result = await recruitmentService.listPublicJobs({ limit: 100 });
        setJobs(result.jobs);
        setFilteredJobs(result.jobs);
      } catch (error) {
        console.error('Failed to load careers jobs:', error);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  useEffect(() => {
    let filtered = jobs.filter((job) => {
      const matchSearch =
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.description.toLowerCase().includes(search.toLowerCase()) ||
        job.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

      const matchLocation = locationFilter === 'ALL' || job.location.toUpperCase() === locationFilter.toUpperCase();
      const matchType = typeFilter === 'ALL' || job.employmentType.toUpperCase() === typeFilter.toUpperCase();

      return matchSearch && matchLocation && matchType;
    });
    setFilteredJobs(filtered);
  }, [search, locationFilter, typeFilter, jobs]);

  // Unique list of locations for filtering
  const locations = ['ALL', ...Array.from(new Set(jobs.map((j) => j.location.toUpperCase())))];
  const types = ['ALL', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];

  return (
    <BluHireBackground showConstellation={true} className="pb-16">
      {/* Brand Public Navbar */}
      <header className="h-16 bg-card/85 dark:bg-[#0e101e]/80 backdrop-blur-2xl border-b border-border/80 dark:border-white/10 flex items-center justify-between px-6 sm:px-10 z-20 shadow-xs sticky top-0">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary mr-3 shadow-xs">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 dark:from-violet-400 dark:via-indigo-300 dark:to-[#8B5CF6] bg-clip-text text-transparent">
            BluHire-AI Careers
          </span>
        </div>
        <Link href="/dashboard">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs font-semibold bg-background/50 dark:bg-white/[0.04] border-border/80 dark:border-white/10 hover:bg-muted/80 text-foreground dark:text-white rounded-xl h-9 px-3.5 cursor-pointer shadow-xs"
          >
            Employee Login
          </Button>
        </Link>
      </header>

      {/* Hero Banner */}
      <section className="pt-16 pb-12 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold tracking-wider uppercase mb-4 select-none">
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            <span>Open Opportunities</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground dark:text-white mb-4">
            Find Your Next Career Move
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground dark:text-zinc-400 max-w-xl mx-auto mb-8 leading-relaxed font-sans">
            Join a fast-growing team building next-generation AI automation platforms. Work on challenging engineering and operational frontiers.
          </p>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-card/90 dark:bg-[#0e101e]/85 backdrop-blur-2xl p-2.5 rounded-2xl shadow-xl border border-border/80 dark:border-white/10">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground dark:text-zinc-400" />
              <Input
                type="text"
                placeholder="Search jobs, required skills, or keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-xs sm:text-sm text-foreground dark:text-white placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-background/50 dark:bg-white/[0.04] border border-border/80 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-medium text-foreground dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer hover:bg-muted/50"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc} className="bg-popover text-foreground">
                    {loc === 'ALL' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-background/50 dark:bg-white/[0.04] border border-border/80 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-medium text-foreground dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer hover:bg-muted/50"
              >
                {types.map((t) => (
                  <option key={t} value={t} className="bg-popover text-foreground">
                    {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings Grid */}
      <main className="max-w-6xl mx-auto py-4 px-6 sm:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 bg-card/40 dark:bg-[#0e101e]/40 border border-border/80 dark:border-white/10 rounded-2xl backdrop-blur-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-xs text-muted-foreground font-medium">Loading open opportunities...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-card/40 dark:bg-[#0e101e]/40 border border-border/80 dark:border-white/10 rounded-2xl backdrop-blur-xl space-y-3">
            <Briefcase className="w-12 h-12 text-muted-foreground/50 mx-auto" />
            <h3 className="text-base font-semibold text-foreground dark:text-white">No matching job openings</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No positions currently match your search parameters. Try adjusting your filters or search keywords.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => (
              <Card
                key={job._id}
                className="flex flex-col border border-border/80 dark:border-white/10 bg-card/90 dark:bg-[#0e101e]/90 backdrop-blur-xl rounded-2xl shadow-xs hover:border-primary/40 transition-all duration-200 overflow-hidden group hover:shadow-lg hover:scale-[1.01]"
              >
                <CardHeader className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary dark:text-violet-300 border border-primary/25 px-2.5 py-1 rounded-md">
                      {job.employmentType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground dark:text-zinc-400 bg-muted/60 dark:bg-white/[0.04] px-2 py-0.5 rounded">
                      {job.jobCode}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground dark:text-white group-hover:text-primary transition-colors">
                      {job.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground dark:text-zinc-400 flex items-center gap-1.5 mt-1 font-medium">
                      {job.departmentId?.name || 'General Department'}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 px-5 pb-5 space-y-3">
                  <p className="text-xs text-muted-foreground dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {job.requiredSkills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted/60 dark:bg-white/[0.05] border border-border/60 dark:border-white/10 text-foreground/80 dark:text-zinc-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="text-[10px] font-bold text-muted-foreground dark:text-zinc-400 px-1 py-0.5">
                        +{job.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-5 border-t border-border/80 dark:border-white/10 bg-muted/20 dark:bg-white/[0.01] flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground dark:text-zinc-400 gap-3 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {job.openings} {job.openings > 1 ? 'openings' : 'opening'}
                    </span>
                  </div>
                  <Link href={`/careers/jobs/${job._id}`}>
                    <Button 
                      size="sm" 
                      className="text-xs bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold h-8.5 px-3 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </BluHireBackground>
  );
}
