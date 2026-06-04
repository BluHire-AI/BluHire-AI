'use client';

import React, { useState, useEffect } from 'react';
import { employeeService, Employee } from '@/services/employee.service';
import { departmentService, Department } from '@/services/department.service';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, Mail, Phone, RefreshCw, X, Contact } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Directory</h1>
        <p className="text-zinc-500 dark:text-zinc-400">View and connect with colleagues across all departments.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search colleagues by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="w-full sm:w-60">
          <Select value={selectedDept} onValueChange={setSelectedDept}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(search || selectedDept !== 'all') && (
          <Button variant="ghost" onClick={resetFilters} className="text-zinc-500 hover:text-zinc-900 gap-2">
            <X className="w-4 h-4" /> Clear
          </Button>
        )}
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading directory cards...</p>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Contact className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
          <p className="text-zinc-500 dark:text-zinc-400">No colleagues match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map((emp) => (
            <Card key={emp._id} className="overflow-hidden hover:shadow-md transition-shadow border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-lg border border-blue-100 dark:border-blue-800">
                    {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base">
                      {emp.firstName} {emp.lastName}
                    </h3>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {emp.designationId?.title || 'Team Member'}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {emp.departmentId?.name || 'Operations'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-1.5 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  {emp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-zinc-400" />
                      <span>{emp.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-zinc-400" />
                    <span>Work Location: {emp.workLocation}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
