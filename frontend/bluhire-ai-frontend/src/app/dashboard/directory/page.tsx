'use client';

import React, { useState, useEffect } from 'react';
import { employeeService, Employee } from '@/services/employee.service';
import { departmentService, Department } from '@/services/department.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Mail, Phone, RefreshCw, X, Contact, Sparkles, Send, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function DirectoryPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes, empRes] = await Promise.all([
          departmentService.getActive().catch(() => []),
          employeeService.getDirectory({ page: 1, limit: 100 }).catch(() => ({ employees: [], total: 0 }))
        ]);
        setDepartments((deptsRes as any) || []);
        setEmployees(empRes?.employees || []);
      } catch (error) {
        console.error('Failed to load directory data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const searchMatch = fullName.includes(search.toLowerCase()) || emp.email.toLowerCase().includes(search.toLowerCase());
    const deptMatch = selectedDept === 'all' || emp.departmentId?._id === selectedDept;
    return searchMatch && deptMatch;
  });

  const resetFilters = () => {
    setSearch('');
    setSelectedDept('all');
  };

  const handleQuickContact = (email: string) => {
    toast.success(`Message draft created for ${email}`);
  };

  return (
    <div className="space-y-6 select-none">
      <div className="pb-6 border-b border-white/10">
        <h1 className="text-h1 text-white">
          Workspace Directory
        </h1>
        <p className="text-body-copy text-white/60 mt-2">
          View and connect with colleagues across all active department teams.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white/[0.03] backdrop-blur-xl p-5 border border-white/10 rounded-[24px] shadow-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-white/30" />
          <Input
            placeholder="Search colleagues by name, email or active credentials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-white/[0.02] border-white/10 focus:border-[#8B5CF6]/50 focus:ring-[#8B5CF6]/20 text-white rounded-xl text-grid placeholder:text-white/30"
          />
        </div>
        
        <div className="w-full sm:w-64">
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="h-10 bg-white/[0.02] border-white/10 hover:bg-white/[0.06] rounded-xl text-grid text-white/80">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl text-white text-xs">
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(search || selectedDept !== 'all') && (
          <Button variant="ghost" onClick={resetFilters} className="text-white/40 hover:text-white rounded-xl text-xs gap-1 cursor-pointer">
            <X className="w-3.5 h-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-6 h-6 text-[#8B5CF6] animate-spin" />
          <p className="text-xs text-white/45 font-medium">Scanning organizational directory...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.03] backdrop-blur-xl rounded-[24px] border border-white/10 shadow-2xl">
          <Contact className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-xs font-medium">No colleagues match the specified filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp, index) => (
            <motion.div
              key={emp._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              whileHover={{ y: -2 }}
              className="transition-all duration-300"
            >
              <Card className="overflow-hidden bg-white/[0.03] border-white/10 hover:border-[#8B5CF6]/30 shadow-2xl group rounded-[24px] relative">
                {/* Accent ribbon banner background */}
                <div className="h-16 bg-gradient-to-r from-[#8B5CF6]/10 via-[#A855F7]/10 to-[#8B5CF6]/10" />
                
                <CardContent className="p-5 pt-0 space-y-4 relative">
                  {/* Photo Profile */}
                  <div className="flex justify-between items-end -mt-8">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#A855F7] border-4 border-[#050505] flex items-center justify-center font-extrabold text-white text-base shadow-lg">
                      {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </div>
                    <Badge variant="outline" className="rounded-lg text-small-label px-2 py-0.5 bg-white/[0.04] border-white/10 text-white/60">
                      {emp.workLocation}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-grid text-white group-hover:text-[#8B5CF6] transition-colors font-bold">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-small-label text-white/40 mt-0.5">
                      {emp.designationId?.title || 'Team Member'}
                    </p>
                    <p className="text-small-label text-[#8B5CF6] mt-1 flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-amber-300 animate-pulse" /> {emp.departmentId?.name || 'Department Team'}
                    </p>
                  </div>

                  {/* Skills Pills */}
                  {emp.skills && emp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-3 border-t border-white/10">
                      {emp.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="rounded text-small-label px-2 py-0.5 bg-white/[0.04] text-white/80 border border-white/10">
                          {skill}
                        </Badge>
                      ))}
                      {emp.skills.length > 3 && (
                        <Badge variant="outline" className="rounded text-small-label px-1 py-0.5 border-white/10 text-white/40">
                          +{emp.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-4 flex items-center justify-between gap-2">
                    <div className="text-grid text-white/40 truncate flex-1 flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1 text-white/20 shrink-0" /> <span className="truncate">{emp.email}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleQuickContact(emp.email)}
                      className="h-8 rounded-xl cursor-pointer hover:bg-white/[0.06] text-[#8B5CF6] hover:text-white gap-1.5 text-small-label font-bold"
                    >
                      <Send className="w-3 h-3" /> Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
