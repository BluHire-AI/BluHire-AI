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
import { 
  Plus, Search, Filter, Edit, Trash2, Eye, RefreshCw, X, ChevronLeft, 
  ChevronRight, Download, EyeOff, LayoutGrid, CheckSquare, Square, MoreHorizontal, UserCheck
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem 
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Column Visibility States
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    employee: true,
    department: true,
    designation: true,
    status: true,
    type: true,
    location: true,
  });

  // Bulk Selection States
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  // Saved Filter Templates (Simulated)
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string, filters: any }>>([
    { name: 'Active Office Staff', filters: { status: 'ACTIVE', location: 'OFFICE' } },
    { name: 'Remote Engineering', filters: { location: 'REMOTE', type: 'FULL_TIME' } }
  ]);

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
    setSelectedEmployeeIds([]); // Reset selection when filters change
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

  const loadSavedFilter = (filterConfig: any) => {
    if (filterConfig.status) setSelectedStatus(filterConfig.status);
    if (filterConfig.location) setSelectedLocation(filterConfig.location);
    if (filterConfig.type) setSelectedType(filterConfig.type);
    setPage(1);
    toast.success("Applied saved filter template");
  };

  const toggleSelectAll = () => {
    if (selectedEmployeeIds.length === employees.length) {
      setSelectedEmployeeIds([]);
    } else {
      setSelectedEmployeeIds(employees.map(e => e._id));
    }
  };

  const toggleSelectEmployee = (id: string) => {
    setSelectedEmployeeIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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

  const handleBulkStatusChange = (status: string) => {
    toast.success(`Simulated bulk status change to ${status} for ${selectedEmployeeIds.length} records.`);
    setSelectedEmployeeIds([]);
  };

  const exportToCSV = () => {
    if (employees.length === 0) {
      toast.error("No employee records to export.");
      return;
    }
    const headers = ["Employee Code", "First Name", "Last Name", "Email", "Department", "Designation", "Status", "Type", "Location"];
    const rows = employees.map(emp => [
      emp.employeeCode,
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.departmentId?.name || 'Unassigned',
      emp.designationId?.title || 'Unassigned',
      emp.employmentStatus,
      emp.employmentType,
      emp.workLocation
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BluHire_Workforce_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Workforce CSV data downloaded successfully.");
  };

  const getStatusVariant = (status: string) => {
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
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-h1 text-white">Workforce Directory</h1>
          <p className="text-body-copy text-white/60 mt-2">Manage and track your premium workforce credentials, roles, and profiles.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Export CSV Button */}
          <Button onClick={exportToCSV} variant="outline" className="border-white/10 bg-white/[0.02] text-white/80 hover:text-white hover:bg-white/[0.06] text-xs h-9 rounded-xl cursor-pointer gap-2 transition-all">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>

          {isHRorAdmin && (
            <Link href="/dashboard/employees/create" className="w-full sm:w-auto">
              <Button className="w-full bg-[#8B5CF6] hover:bg-[#A855F7] text-white gap-2 rounded-xl cursor-pointer border-0 text-xs font-semibold h-9 shadow-lg shadow-[#8B5CF6]/15 transition-all duration-250">
                <Plus className="w-3.5 h-3.5" /> Add Employee
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Action Filters Panel */}
      <div className="bg-white/[0.03] backdrop-blur-xl p-5 rounded-[24px] border border-white/10 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-white/30" />
              <Input
                placeholder="Search by name, email, employee code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-white/[0.02] border-white/10 focus:border-[#8B5CF6]/50 focus:ring-[#8B5CF6]/20 text-white rounded-xl text-grid placeholder:text-white/30"
              />
            </div>
            <Button type="submit" className="bg-[#8B5CF6] hover:bg-[#A855F7] text-white rounded-xl px-5 text-xs font-semibold border-0 cursor-pointer h-10 shadow-md">
              Search
            </Button>
            {(search || selectedDept !== 'all' || selectedDesg !== 'all' || selectedStatus !== 'all' || selectedType !== 'all' || selectedLocation !== 'all') && (
              <Button type="button" variant="ghost" onClick={resetFilters} className="text-white/40 hover:text-white rounded-xl text-xs gap-1">
                <X className="w-3.5 h-3.5" /> Reset
              </Button>
            )}
          </form>

          <div className="flex items-center space-x-3">
            {/* Column Visibility Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center text-xs font-semibold h-10 border border-white/10 rounded-xl gap-2 cursor-pointer text-white/80 px-4 bg-white/[0.02] hover:bg-white/[0.06] hover:text-white transition-all">
                <LayoutGrid className="w-3.5 h-3.5" /> Columns
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl text-white">
                <DropdownMenuLabel className="text-xs font-bold text-white/85">Visible Columns</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {Object.keys(visibleColumns).map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col}
                    checked={(visibleColumns as any)[col]}
                    onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, [col]: checked }))}
                    className="capitalize text-xs text-white/70 focus:bg-white/[0.06] focus:text-white cursor-pointer"
                  >
                    {col}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Saved Filters Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center text-xs font-semibold h-10 border border-white/10 rounded-xl gap-2 cursor-pointer text-white/80 px-4 bg-white/[0.02] hover:bg-white/[0.06] hover:text-white transition-all">
                <Filter className="w-3.5 h-3.5" /> Saved Filters
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl text-white">
                <DropdownMenuLabel className="text-xs font-bold text-white/85">Filter Presets</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {savedFilters.map((sf, index) => (
                  <DropdownMenuItem key={index} onClick={() => loadSavedFilter(sf.filters)} className="text-xs text-white/70 cursor-pointer focus:bg-white/[0.06] focus:text-white">
                    {sf.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-white/10">
          <div className="space-y-1">
            <label className="text-small-label text-white/40">Department</label>
            <Select value={selectedDept} onValueChange={(val) => { setSelectedDept(val); setPage(1); }}>
              <SelectTrigger className="h-9 bg-white/[0.02] border-white/10 hover:bg-white/[0.06] rounded-xl text-grid text-white/80">
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

          <div className="space-y-1">
            <label className="text-small-label text-white/40">Designation</label>
            <Select value={selectedDesg} onValueChange={(val) => { setSelectedDesg(val); setPage(1); }}>
              <SelectTrigger className="h-9 bg-white/[0.02] border-white/10 hover:bg-white/[0.06] rounded-xl text-grid text-white/80">
                <SelectValue placeholder="All Designations" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl text-white text-xs">
                <SelectItem value="all">All Designations</SelectItem>
                {designations.map((d) => (
                  <SelectItem key={d._id} value={d._id}>{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-small-label text-white/40">Status</label>
            <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPage(1); }}>
              <SelectTrigger className="h-9 bg-white/[0.02] border-white/10 hover:bg-white/[0.06] rounded-xl text-grid text-white/80">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl text-white text-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="ON_LEAVE">ON LEAVE</SelectItem>
                <SelectItem value="TERMINATED">TERMINATED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-small-label text-white/40">Type</label>
            <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setPage(1); }}>
              <SelectTrigger className="h-9 bg-white/[0.02] border-white/10 hover:bg-white/[0.06] rounded-xl text-grid text-white/80">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl text-white text-xs">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="FULL_TIME">FULL TIME</SelectItem>
                <SelectItem value="PART_TIME">PART TIME</SelectItem>
                <SelectItem value="CONTRACT">CONTRACT</SelectItem>
                <SelectItem value="INTERN">INTERN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="text-small-label text-white/40">Location</label>
            <Select value={selectedLocation} onValueChange={(val) => { setSelectedLocation(val); setPage(1); }}>
              <SelectTrigger className="h-9 bg-white/[0.02] border-white/10 hover:bg-white/[0.06] rounded-xl text-grid text-white/80">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl text-white text-xs">
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="OFFICE">OFFICE</SelectItem>
                <SelectItem value="REMOTE">REMOTE</SelectItem>
                <SelectItem value="HYBRID">HYBRID</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Bulk Action Header Alert Panel */}
      <AnimatePresence>
        {selectedEmployeeIds.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col sm:flex-row justify-between items-center bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 p-3 rounded-xl gap-3"
          >
            <div className="flex items-center text-xs font-semibold text-[#c084fc]">
              <CheckSquare className="w-4 h-4 mr-2 text-[#8B5CF6]" /> {selectedEmployeeIds.length} employees selected
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button onClick={() => handleBulkStatusChange('ACTIVE')} variant="outline" size="sm" className="bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/25 text-white rounded-lg text-xs cursor-pointer">
                Mark Active
              </Button>
              <Button onClick={() => handleBulkStatusChange('ON_LEAVE')} variant="outline" size="sm" className="bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/25 text-white rounded-lg text-xs cursor-pointer">
                Mark Leave
              </Button>
              <Button onClick={() => setSelectedEmployeeIds([])} variant="ghost" size="sm" className="text-white/40 hover:text-white text-xs cursor-pointer">
                Deselect All
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Section */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[24px] overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-6 h-6 text-[#8B5CF6] animate-spin" />
            <p className="text-xs text-white/45 font-medium">Scanning database registry...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-white/40 text-xs font-medium">
              {total === 0 && !search && selectedDept === 'all' && selectedDesg === 'all' && selectedStatus === 'all' && selectedType === 'all' && selectedLocation === 'all'
                ? "No employee records established yet."
                : "No workforce records matched the query criteria."}
            </p>
            {total === 0 && !search && selectedDept === 'all' && selectedDesg === 'all' && selectedStatus === 'all' && selectedType === 'all' && selectedLocation === 'all' ? (
              isHRorAdmin && (
                <Link href="/dashboard/employees/create">
                  <Button className="bg-[#8B5CF6] hover:bg-[#A855F7] text-white rounded-xl text-xs border-0">Create your first Employee</Button>
                </Link>
              )
            ) : (
              <Button variant="outline" onClick={resetFilters} className="rounded-xl border-white/10 bg-white/[0.02] text-xs text-white/80 hover:bg-white/[0.06]">Clear All Filters</Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-white/[0.015] border-b border-white/10">
                <TableRow className="hover:bg-transparent border-b border-white/10">
                  <TableHead className="w-10">
                    <button onClick={toggleSelectAll} className="p-1 rounded cursor-pointer text-white/30 hover:bg-white/[0.06] hover:text-white transition-all">
                      {selectedEmployeeIds.length === employees.length ? (
                        <CheckSquare className="w-4 h-4 text-[#8B5CF6]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </TableHead>
                  {visibleColumns.code && <TableHead className="w-24 text-small-label text-white/40 border-b border-white/10">ID Code</TableHead>}
                  {visibleColumns.employee && <TableHead className="text-small-label text-white/40 border-b border-white/10">Employee Profile</TableHead>}
                  {visibleColumns.department && <TableHead className="text-small-label text-white/40 border-b border-white/10">Department</TableHead>}
                  {visibleColumns.designation && <TableHead className="text-small-label text-white/40 border-b border-white/10">Designation</TableHead>}
                  {visibleColumns.status && <TableHead className="text-small-label text-white/40 border-b border-white/10">Status</TableHead>}
                  {visibleColumns.type && <TableHead className="text-small-label text-white/40 border-b border-white/10">Type</TableHead>}
                  {visibleColumns.location && <TableHead className="text-small-label text-white/40 border-b border-white/10">Location</TableHead>}
                  <TableHead className="w-14 border-b border-white/10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const isSelected = selectedEmployeeIds.includes(emp._id);
                  const statusLabel = emp.employmentStatus.replace('_', ' ');
                  let statusBadgeStyle = 'border-white/10 bg-white/[0.04] text-white/60';
                  if (emp.employmentStatus === 'ACTIVE') {
                    statusBadgeStyle = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400';
                  } else if (emp.employmentStatus === 'ON_LEAVE') {
                    statusBadgeStyle = 'border-amber-500/20 bg-amber-500/10 text-amber-400';
                  } else if (emp.employmentStatus === 'TERMINATED') {
                    statusBadgeStyle = 'border-rose-500/20 bg-rose-500/10 text-rose-400';
                  }

                  return (
                    <TableRow key={emp._id} className={`hover:bg-white/[0.015] border-b border-white/10 transition-colors ${isSelected ? 'bg-[#8B5CF6]/10' : ''}`}>
                      <TableCell className="w-10">
                        <button onClick={() => toggleSelectEmployee(emp._id)} className="p-1 rounded cursor-pointer text-white/30 hover:bg-white/[0.06] hover:text-white transition-all">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-[#8B5CF6]" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>
                      {visibleColumns.code && (
                        <TableCell className="font-mono text-small-label text-white/60">
                          {emp.employeeCode}
                        </TableCell>
                      )}
                      {visibleColumns.employee && (
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-center justify-center font-bold text-[10px] text-[#8B5CF6] shrink-0">
                              {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-grid font-bold text-white hover:text-[#8B5CF6] transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/employees/${emp._id}`)}>
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="text-grid text-white/40">
                                {emp.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.department && (
                        <TableCell className="text-grid text-white/80">
                          {emp.departmentId?.name || (
                            <span className="text-small-label text-white/30 italic">Unassigned</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.designation && (
                        <TableCell className="text-grid text-white/80">
                          {emp.designationId?.title || (
                            <span className="text-small-label text-white/30 italic">Unassigned</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell>
                          <Badge variant="outline" className={`rounded-lg text-small-label border ${statusBadgeStyle}`}>
                            {statusLabel}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.type && (
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg text-small-label border-white/10 text-white/60 bg-white/[0.02]">
                            {emp.employmentType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.location && (
                        <TableCell>
                          <span className="text-grid text-white/60">{emp.workLocation}</span>
                        </TableCell>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg cursor-pointer text-white/40 hover:text-white hover:bg-white/[0.06] transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl text-white">
                            <DropdownMenuLabel className="text-[10px] font-extrabold uppercase tracking-wider text-white/40">Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${emp._id}`)} className="text-xs text-white/80 focus:bg-white/[0.06] focus:text-white cursor-pointer">
                              <Eye className="mr-2 h-3.5 w-3.5" /> View Profile
                            </DropdownMenuItem>
                            {isHRorAdmin && (
                              <>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${emp._id}/edit`)} className="text-xs text-white/80 focus:bg-white/[0.06] focus:text-white cursor-pointer">
                                  <Edit className="mr-2 h-3.5 w-3.5" /> Edit Record
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(emp._id)}
                                  className="text-red-400 focus:bg-red-950/20 text-xs cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Record
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center p-4 border-t border-white/10">
              <span className="text-small-label text-white/40">
                Showing {employees.length} of {total} employees
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-xl h-8 px-3 border-white/10 bg-white/[0.02] text-white/80 hover:text-white hover:bg-white/[0.06] text-xs cursor-pointer transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="rounded-xl h-8 px-3 border-white/10 bg-white/[0.02] text-white/80 hover:text-white hover:bg-white/[0.06] text-xs cursor-pointer transition-all"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
