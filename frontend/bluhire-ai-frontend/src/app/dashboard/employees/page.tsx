'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { employeeService, Employee } from '@/services/employee.service';
import { departmentService, Department } from '@/services/department.service';
import { designationService, Designation } from '@/services/designation.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Filter, Edit, Trash2, Eye, RefreshCw, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function EmployeeListPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedDesg, setSelectedDesg] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const isHRorAdmin = user?.role === 'MANAGEMENT_ADMIN' || user?.role === 'HR_RECRUITER';

  const fetchFiltersData = async () => {
    try {
      const [deptsRes, desgsRes] = await Promise.all([
        departmentService.getActive(),
        designationService.getAll()
      ]);
      setDepartments(deptsRes);
      setDesignations(desgsRes);
    } catch (error) {
      console.error('Failed to load filters metadata', error);
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const query: any = {
        page,
        limit,
      };

      if (search.trim()) query.search = search.trim();
      if (selectedDept !== 'all') query.departmentId = selectedDept;
      if (selectedDesg !== 'all') query.designationId = selectedDesg;
      if (selectedStatus !== 'all') query.employmentStatus = selectedStatus;
      if (selectedType !== 'all') query.employmentType = selectedType;
      if (selectedLocation !== 'all') query.workLocation = selectedLocation;

      const res = await employeeService.list(query);
      setEmployees(res?.employees || []);
      setTotal(res?.total || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to retrieve employees');
      setEmployees([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [page, selectedDept, selectedDesg, selectedStatus, selectedType, selectedLocation]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedDept('all');
    setSelectedDesg('all');
    setSelectedStatus('all');
    setSelectedType('all');
    setSelectedLocation('all');
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee record?')) return;
    try {
      await employeeService.delete(id);
      toast.success('Employee record deleted successfully');
      fetchEmployees();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete employee record');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'ON_LEAVE':
        return 'warning';
      case 'TERMINATED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Employees</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage and track your workforce credentials, roles, and profiles.</p>
        </div>
        {isHRorAdmin && (
          <Link href="/dashboard/employees/create">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Add Employee
            </Button>
          </Link>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search by name, email, phone, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" className="gap-2">
            Search
          </Button>
          {(search || selectedDept !== 'all' || selectedDesg !== 'all' || selectedStatus !== 'all' || selectedType !== 'all' || selectedLocation !== 'all') && (
            <Button type="button" variant="ghost" onClick={resetFilters} className="gap-2 text-zinc-500 hover:text-zinc-900">
              <X className="w-4 h-4" /> Reset
            </Button>
          )}
        </form>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2">
          {/* Department Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Department</label>
            <Select value={selectedDept} onValueChange={(val) => { setSelectedDept(val); setPage(1); }}>
              <SelectTrigger className="h-9">
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

          {/* Designation Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Designation</label>
            <Select value={selectedDesg} onValueChange={(val) => { setSelectedDesg(val); setPage(1); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Designations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Designations</SelectItem>
                {designations.map((d) => (
                  <SelectItem key={d._id} value={d._id}>{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Status</label>
            <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPage(1); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="ON_LEAVE">ON LEAVE</SelectItem>
                <SelectItem value="TERMINATED">TERMINATED</SelectItem>
                <SelectItem value="SUSPENDED">SUSPENDED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Employment Type Filter */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Type</label>
            <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setPage(1); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FULL_TIME">FULL TIME</SelectItem>
                <SelectItem value="PART_TIME">PART TIME</SelectItem>
                <SelectItem value="CONTRACT">CONTRACT</SelectItem>
                <SelectItem value="INTERN">INTERN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Work Location Filter */}
          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Location</label>
            <Select value={selectedLocation} onValueChange={(val) => { setSelectedLocation(val); setPage(1); }}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="OFFICE">OFFICE</SelectItem>
                <SelectItem value="REMOTE">REMOTE</SelectItem>
                <SelectItem value="HYBRID">HYBRID</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-zinc-500 dark:text-zinc-400">Loading employees list...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-zinc-500 dark:text-zinc-400 text-lg">No employee records match your criteria.</p>
            <Button variant="outline" onClick={resetFilters}>Clear All Filters</Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Code</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <TableCell className="font-semibold text-zinc-900 dark:text-zinc-200">
                      {emp.employeeCode}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-200">
                            {emp.firstName} {emp.lastName}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{emp.departmentId?.name || 'Unassigned'}</TableCell>
                    <TableCell>{emp.designationId?.title || 'Unassigned'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(emp.employmentStatus)}>
                        {emp.employmentStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {emp.employmentType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{emp.workLocation}</span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 h-8 w-8 p-0 cursor-pointer">
                          <span className="sr-only">Open menu</span>
                          <span className="font-bold">•••</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${emp._id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> View profile
                          </DropdownMenuItem>
                          {isHRorAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${emp._id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit record
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(emp._id)}
                                className="text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete record
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center p-4 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {employees.length} of {total} employees
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
