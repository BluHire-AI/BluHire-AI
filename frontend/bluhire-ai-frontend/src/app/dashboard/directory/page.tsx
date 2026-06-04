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
    <div className="space-y-8 select-none">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Workspace Directory</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1.5 text-sm font-medium">View and connect with colleagues across all active department teams.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-[#0e1422] p-5 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search colleagues by name, email or active credentials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-sm"
          />
        </div>
        
        <div className="w-full sm:w-64">
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-xs">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d._id} value={d._id} className="text-xs">{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(search || selectedDept !== 'all') && (
          <Button variant="ghost" onClick={resetFilters} className="text-zinc-500 hover:text-zinc-900 rounded-xl">
            <X className="w-4 h-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Scanning organizational directory...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#0e1422] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
          <Contact className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">No colleagues match the specified filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp, index) => (
            <motion.div
              key={emp._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden bg-white dark:bg-[#0e1422] hover:shadow-lg transition-all duration-300 border-zinc-200/60 dark:border-zinc-800/80 group rounded-2xl relative">
                {/* Accent ribbon banner background */}
                <div className="h-16 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10" />
                
                <CardContent className="p-6 pt-0 space-y-4 relative">
                  {/* Photo Profile */}
                  <div className="flex justify-between items-end -mt-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-4 border-white dark:border-[#0e1422] flex items-center justify-center font-extrabold text-white text-lg shadow-sm">
                      {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                    </div>
                    <Badge variant="outline" className="rounded-lg text-[10px] font-bold px-2 py-0.5 tracking-wider uppercase bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200/50 dark:border-zinc-800/50">
                      {emp.workLocation}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {emp.designationId?.title || 'Team Member'}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1 flex items-center">
                      <Sparkles className="w-3 h-3 mr-1 text-amber-500 animate-pulse" /> {emp.departmentId?.name || 'Department Team'}
                    </p>
                  </div>

                  {/* Skills Pills */}
                  {emp.skills && emp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5 border-t border-zinc-100 dark:border-zinc-800/60">
                      {emp.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="rounded text-[9px] font-semibold px-2 py-0.5 bg-zinc-100/60 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-300">
                          {skill}
                        </Badge>
                      ))}
                      {emp.skills.length > 3 && (
                        <Badge variant="outline" className="rounded text-[9px] font-semibold px-1 py-0.5">
                          +{emp.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="border-t border-zinc-100 dark:border-zinc-800/60 pt-4 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex-1">
                      <Mail className="w-3.5 h-3.5 inline mr-1 text-zinc-400" /> {emp.email}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleQuickContact(emp.email)}
                      className="h-8 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400 gap-1.5 font-bold text-xs"
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
