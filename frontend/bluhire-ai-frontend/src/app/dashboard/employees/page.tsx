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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Workforce Directory</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium">Manage and track your premium workforce credentials, roles, and profiles.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Export CSV Button */}
          <Button onClick={exportToCSV} variant="outline" className="border-zinc-200/80 dark:border-zinc-800/80 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-700 dark:text-zinc-300 gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>

          {isHRorAdmin && (
            <Link href="/dashboard/employees/create" className="w-full sm:w-auto">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl cursor-pointer">
                <Plus className="w-4 h-4" /> Add Employee
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Action Filters Panel */}
      <div className="bg-white dark:bg-[#0e1422] p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Advanced search by name, email, employee code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl"
              />
            </div>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5">
              Search
            </Button>
            {(search || selectedDept !== 'all' || selectedDesg !== 'all' || selectedStatus !== 'all' || selectedType !== 'all' || selectedLocation !== 'all') && (
              <Button type="button" variant="ghost" onClick={resetFilters} className="text-zinc-500 hover:text-zinc-900 rounded-xl">
                <X className="w-4 h-4 mr-1" /> Reset
              </Button>
            )}
          </form>

          <div className="flex items-center space-x-3">
            {/* Column Visibility Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center text-sm font-medium h-10 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300 px-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                <LayoutGrid className="w-4 h-4" /> Columns
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl border-zinc-200/80 dark:border-zinc-800/80">
                <DropdownMenuLabel className="text-xs">Visible Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.keys(visibleColumns).map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col}
                    checked={(visibleColumns as any)[col]}
                    onCheckedChange={(checked) => setVisibleColumns(prev => ({ ...prev, [col]: checked }))}
                    className="capitalize text-xs"
                  >
                    {col}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Saved Filters Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center text-sm font-medium h-10 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300 px-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                <Filter className="w-4 h-4" /> Saved Filters
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl border-zinc-200/80 dark:border-zinc-800/80">
                <DropdownMenuLabel className="text-xs">Filter Presets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {savedFilters.map((sf, index) => (
                  <DropdownMenuItem key={index} onClick={() => loadSavedFilter(sf.filters)} className="text-xs cursor-pointer">
                    {sf.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Dynamic Filters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Department</label>
            <Select value={selectedDept} onValueChange={(val) => { setSelectedDept(val); setPage(1); }}>
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

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Designation</label>
            <Select value={selectedDesg} onValueChange={(val) => { setSelectedDesg(val); setPage(1); }}>
              <SelectTrigger className="h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-xs">
                <SelectValue placeholder="All Designations" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">All Designations</SelectItem>
                {designations.map((d) => (
                  <SelectItem key={d._id} value={d._id} className="text-xs">{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Status</label>
            <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPage(1); }}>
              <SelectTrigger className="h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="ACTIVE" className="text-xs">ACTIVE</SelectItem>
                <SelectItem value="ON_LEAVE" className="text-xs">ON LEAVE</SelectItem>
                <SelectItem value="TERMINATED" className="text-xs">TERMINATED</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Type</label>
            <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setPage(1); }}>
              <SelectTrigger className="h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="FULL_TIME" className="text-xs">FULL TIME</SelectItem>
                <SelectItem value="PART_TIME" className="text-xs">PART TIME</SelectItem>
                <SelectItem value="CONTRACT" className="text-xs">CONTRACT</SelectItem>
                <SelectItem value="INTERN" className="text-xs">INTERN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Location</label>
            <Select value={selectedLocation} onValueChange={(val) => { setSelectedLocation(val); setPage(1); }}>
              <SelectTrigger className="h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-xs">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">All Locations</SelectItem>
                <SelectItem value="OFFICE" className="text-xs">OFFICE</SelectItem>
                <SelectItem value="REMOTE" className="text-xs">REMOTE</SelectItem>
                <SelectItem value="HYBRID" className="text-xs">HYBRID</SelectItem>
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
            className="flex flex-col sm:flex-row justify-between items-center bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/60 p-3 rounded-xl gap-3"
          >
            <div className="flex items-center text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <CheckSquare className="w-4 h-4 mr-2" /> {selectedEmployeeIds.length} employees selected
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <Button onClick={() => handleBulkStatusChange('ACTIVE')} variant="outline" size="sm" className="bg-white dark:bg-zinc-900 border-indigo-200 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
                Mark Active
              </Button>
              <Button onClick={() => handleBulkStatusChange('ON_LEAVE')} variant="outline" size="sm" className="bg-white dark:bg-zinc-900 border-indigo-200 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs">
                Mark Leave
              </Button>
              <Button onClick={() => setSelectedEmployeeIds([])} variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-800 text-xs">
                Deselect All
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table Section */}
      <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Scanning database registry...</p>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
              {total === 0 && !search && selectedDept === 'all' && selectedDesg === 'all' && selectedStatus === 'all' && selectedType === 'all' && selectedLocation === 'all'
                ? "No employee records established yet."
                : "No workforce records matched the query criteria."}
            </p>
            {total === 0 && !search && selectedDept === 'all' && selectedDesg === 'all' && selectedStatus === 'all' && selectedType === 'all' && selectedLocation === 'all' ? (
              isHRorAdmin && (
                <Link href="/dashboard/employees/create">
                  <Button className="bg-blue-600 text-white rounded-xl">Create your first Employee</Button>
                </Link>
              )
            ) : (
              <Button variant="outline" onClick={resetFilters} className="rounded-xl border-zinc-200">Clear All Filters</Button>
            )}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/30">
                <TableRow>
                  <TableHead className="w-10">
                    <button onClick={toggleSelectAll} className="p-1 rounded cursor-pointer text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      {selectedEmployeeIds.length === employees.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </TableHead>
                  {visibleColumns.code && <TableHead className="w-24 text-[10px] font-bold uppercase tracking-wider text-zinc-500">ID Code</TableHead>}
                  {visibleColumns.employee && <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Employee Profile</TableHead>}
                  {visibleColumns.department && <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Department</TableHead>}
                  {visibleColumns.designation && <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Designation</TableHead>}
                  {visibleColumns.status && <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</TableHead>}
                  {visibleColumns.type && <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Type</TableHead>}
                  {visibleColumns.location && <TableHead className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Location</TableHead>}
                  <TableHead className="w-14"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => {
                  const isSelected = selectedEmployeeIds.includes(emp._id);
                  return (
                    <TableRow key={emp._id} className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors ${isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''}`}>
                      <TableCell className="w-10">
                        <button onClick={() => toggleSelectEmployee(emp._id)} className="p-1 rounded cursor-pointer text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </TableCell>
                      {visibleColumns.code && (
                        <TableCell className="font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                          {emp.employeeCode}
                        </TableCell>
                      )}
                      {visibleColumns.employee && (
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 border border-blue-500/10 flex items-center justify-center font-bold text-xs text-blue-600 dark:text-blue-400">
                              {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer" onClick={() => router.push(`/dashboard/employees/${emp._id}`)}>
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                {emp.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.department && (
                        <TableCell className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {emp.departmentId?.name || (
                            <span className="text-[10px] text-zinc-400 italic">Unassigned</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.designation && (
                        <TableCell className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {emp.designationId?.title || (
                            <span className="text-[10px] text-zinc-400 italic">Unassigned</span>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.status && (
                        <TableCell>
                          <Badge variant={getStatusVariant(emp.employmentStatus)} className="rounded-lg text-[10px] font-bold px-2 py-0.5">
                            {emp.employmentStatus.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.type && (
                        <TableCell>
                          <Badge variant="outline" className="rounded-lg text-[10px] font-medium border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                            {emp.employmentType.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.location && (
                        <TableCell>
                          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{emp.workLocation}</span>
                        </TableCell>
                      )}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg cursor-pointer text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl border-zinc-200/80 dark:border-zinc-800/80">
                            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${emp._id}`)} className="text-xs cursor-pointer">
                              <Eye className="mr-2 h-3.5 w-3.5" /> View Profile
                            </DropdownMenuItem>
                            {isHRorAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/employees/${emp._id}/edit`)} className="text-xs cursor-pointer">
                                  <Edit className="mr-2 h-3.5 w-3.5" /> Edit Record
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(emp._id)}
                                  className="text-red-600 dark:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 text-xs cursor-pointer"
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
            <div className="flex justify-between items-center p-4 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                Showing {employees.length} of {total} employees
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg h-8 px-3 cursor-pointer text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * limit >= total}
                  className="rounded-lg h-8 px-3 cursor-pointer text-xs"
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
