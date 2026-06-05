'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, Search, Building2, Eye } from 'lucide-react';
import { recruitmentService, Job } from '@/services/recruitment.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

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
    <div className="min-h-screen bg-zinc-50 dark:bg-[#070b13] text-zinc-900 dark:text-zinc-100 font-sans">
      {/* Brand Navbar */}
      <header className="h-16 bg-white dark:bg-[#0e1422] border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between px-8 z-10 shadow-sm transition-colors duration-300">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600 mr-2.5">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            BluHire-AI Careers
          </span>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="text-xs">
            Employee Login
          </Button>
        </Link>
      </header>

      {/* Hero Banner */}
      <section className="py-20 text-center relative overflow-hidden bg-gradient-to-tr from-blue-600/10 via-indigo-500/5 to-purple-600/10">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Find Your Next Career Move
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto mb-8 text-base">
            Join a fast-growing, inclusive team building next-generation AI automation platforms.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto bg-white dark:bg-[#0e1422] p-2 rounded-2xl shadow-md border border-zinc-200/50 dark:border-zinc-800">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search jobs, required skills, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-zinc-50 dark:bg-[#161f30] text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 focus:outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc === 'ALL' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-zinc-50 dark:bg-[#161f30] text-xs font-semibold px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 focus:outline-none"
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t === 'ALL' ? 'All Types' : t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Listings */}
      <main className="max-w-6xl mx-auto py-12 px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 font-medium">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
            Loading open opportunities...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 dark:text-zinc-400">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
            No open jobs matching your search parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Card
                key={job._id}
                className="flex flex-col bg-white dark:bg-[#0e1422] border-zinc-200/80 dark:border-zinc-800/80 hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden group hover:-translate-y-0.5"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 tracking-wider uppercase">
                      {job.employmentType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-semibold">{job.jobCode}</span>
                  </div>
                  <CardTitle className="text-lg font-bold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1.5">
                    {job.departmentId?.name || 'Department'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-4 leading-relaxed">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {job.requiredSkills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="text-[9px] font-bold text-zinc-400 px-1 py-0.5">
                        +{job.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center justify-between bg-zinc-50/50 dark:bg-[#111827]/30">
                  <div className="flex items-center text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {job.openings} {job.openings > 1 ? 'openings' : 'opening'}
                    </span>
                  </div>
                  <Link href={`/careers/jobs/${job._id}`}>
                    <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 rounded-lg flex items-center gap-1.5">
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
    </div>
  );
}
