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
    <div className="min-h-screen bg-transparent text-foreground font-sans pb-16">
      {/* Brand Navbar */}
      <header className="h-16 bg-card/40 backdrop-blur-xl border-b border-border flex items-center justify-between px-8 z-10 shadow-lg sticky top-0">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mr-2.5">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <span className="text-h2 bg-gradient-to-r from-primary via-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            BluHire-AI Careers
          </span>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm" className="text-xs bg-muted/30 border-border hover:bg-muted/80 text-foreground rounded-xl">
            Employee Login
          </Button>
        </Link>
      </header>

      {/* Hero Banner */}
      <section className="py-24 text-center relative overflow-hidden bg-transparent">
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h1 className="text-h1 mb-4 bg-gradient-to-r from-primary via-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
            Find Your Next Career Move
          </h1>
          <p className="text-body-copy text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
            Join a fast-growing, inclusive team building next-generation AI automation platforms.
          </p>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto glass bg-card/65 p-2 rounded-2xl shadow-2xl border border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search jobs, required skills, keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none text-grid text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none cursor-pointer hover:bg-muted/80"
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
                className="bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none cursor-pointer hover:bg-muted/80"
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

      {/* Listings */}
      <main className="max-w-6xl mx-auto py-4 px-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground font-medium">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3" />
            Loading open opportunities...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 text-border" />
            No open jobs matching your search parameters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <Card
                key={job._id}
                className="flex flex-col glass bg-card/40 border border-border hover:border-primary/30 hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden group hover:scale-[1.01] hover:glow-primary/5"
              >
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-small-label bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded">
                      {job.employmentType.replace('_', ' ')}
                    </span>
                    <span className="text-small-label text-muted-foreground font-mono">{job.jobCode}</span>
                  </div>
                  <CardTitle className="text-h2 text-foreground group-hover:text-primary transition-colors">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-body-copy text-muted-foreground flex items-center gap-1.5 mt-1">
                    {job.departmentId?.name || 'Department'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 px-6 pb-6">
                  <p className="text-body-copy text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
                    {job.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {job.requiredSkills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-small-label px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground normal-case font-semibold"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.requiredSkills.length > 3 && (
                      <span className="text-small-label text-muted-foreground/60 px-1 py-0.5 normal-case font-bold">
                        +{job.requiredSkills.length - 3} more
                      </span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="p-6 border-t border-border bg-card/25 flex items-center justify-between">
                  <div className="flex items-center text-small-label text-muted-foreground gap-3 normal-case font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/60" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground/60" />
                      {job.openings} {job.openings > 1 ? 'openings' : 'opening'}
                    </span>
                  </div>
                  <Link href={`/careers/jobs/${job._id}`}>
                    <Button size="sm" className="text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-8 rounded-lg flex items-center gap-1.5 shadow-md shadow-primary/10 cursor-pointer">
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
