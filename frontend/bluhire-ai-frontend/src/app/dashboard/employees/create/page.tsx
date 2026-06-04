'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { employeeService } from '@/services/employee.service';
import { departmentService, Department } from '@/services/department.service';
import { designationService, Designation } from '@/services/designation.service';
import { userService, User } from '@/services/user.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Building, MapPin, Briefcase } from 'lucide-react';

export default function CreateEmployeePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Active form section
  const [activeTab, setActiveTab] = useState<'basic' | 'job' | 'extra'>('basic');

  // Form states
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [selectedUserId, setSelectedUserId] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [managerId, setManagerId] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [workLocation, setWorkLocation] = useState('OFFICE');
  const [salaryGrade, setSalaryGrade] = useState('');
  const [experience, setExperience] = useState('');

  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('India');
  const [notes, setNotes] = useState('');

  // Fetch form dependency data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, deptsRes, desgsRes, employeesRes] = await Promise.all([
          userService.list({ limit: 100 }).catch(() => ({ users: [], total: 0 })),
          departmentService.getActive().catch(() => []),
          designationService.getAll().catch(() => []),
          employeeService.list({ limit: 100 }).catch(() => ({ employees: [], total: 0 }))
        ]);
        
        // Filter users who do not have an employee profile already
        const unlinked = (usersRes?.users || []).filter(u => !u.employeeId);
        setUsers(unlinked);
        setDepartments(deptsRes || []);
        setDesignations(desgsRes || []);
        setManagers(employeesRes?.employees || []);
      } catch (error) {
        toast.error('Failed to load dependency data for the form');
      }
    };
    fetchData();
  }, []);

  // Autofill user fields when linked user is selected
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = users.find(u => u._id === userId);
    if (selectedUser) {
      setFirstName(selectedUser.firstName);
      setLastName(selectedUser.lastName);
      setEmail(selectedUser.email);
    }
  };

  const validateForm = () => {
    if (!employeeCode.trim()) {
      toast.error('Employee Code is required');
      setActiveTab('basic');
      return false;
    }
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First & Last name are required');
      setActiveTab('basic');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('A valid Email is required');
      setActiveTab('basic');
      return false;
    }
    if (!phone.trim()) {
      toast.error('Phone number is required');
      setActiveTab('basic');
      return false;
    }
    if (!departmentId) {
      toast.error('Please select a Department');
      setActiveTab('job');
      return false;
    }
    if (!designationId) {
      toast.error('Please select a Designation');
      setActiveTab('job');
      return false;
    }
    if (!joiningDate) {
      toast.error('Joining Date is required');
      setActiveTab('job');
      return false;
    }
    if (!workLocation.trim()) {
      toast.error('Work Location is required');
      setActiveTab('job');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload: any = {
        employeeCode: employeeCode.toUpperCase(),
        userId: selectedUserId || undefined,
        firstName,
        lastName,
        email,
        phone,
        gender,
        departmentId,
        designationId,
        employmentType,
        joiningDate: new Date(joiningDate).toISOString(),
        workLocation,
      };

      if (dateOfBirth) payload.dateOfBirth = new Date(dateOfBirth).toISOString();
      if (managerId) payload.managerId = managerId;
      if (salaryGrade) payload.salaryGrade = salaryGrade;
      if (experience) payload.experience = parseFloat(experience);
      if (notes) payload.notes = notes;

      if (emergencyName || emergencyPhone || emergencyRelationship) {
        payload.emergencyContact = {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRelationship
        };
      }

      if (street || city || state || postalCode || country) {
        payload.address = {
          street,
          city,
          state,
          postalCode,
          country
        };
      }

      await employeeService.create(payload);
      toast.success('Employee record created successfully');
      router.push('/dashboard/employees');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create employee record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Create Employee</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Establish a new workforce record linked to a system user account.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'basic'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-950'
          }`}
        >
          1. Basic Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('job')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'job'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-950'
          }`}
        >
          2. Employment & Role
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('extra')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'extra'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-950'
          }`}
        >
          3. Address & Emergency
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm space-y-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Link User Account (Optional)</label>
                <Select value={selectedUserId} onValueChange={handleUserSelect}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select a user account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.firstName} {u.lastName} ({u.email} - {u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-zinc-400">Only users without existing employee profiles are shown.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Employee Code <span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g. EMP102"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">First Name <span className="text-red-500">*</span></label>
                <Input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Last Name <span className="text-red-500">*</span></label>
                <Input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email Address <span className="text-red-500">*</span></label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Phone Number <span className="text-red-500">*</span></label>
                <Input
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Gender</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select Gender..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Date of Birth</label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="button" onClick={() => setActiveTab('job')} className="bg-blue-600 hover:bg-blue-700 text-white">
                Next: Employment details
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'job' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <Building className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">Employment & Hierarchy</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Department <span className="text-red-500">*</span></label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select Department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Designation <span className="text-red-500">*</span></label>
                <Select value={designationId} onValueChange={setDesignationId}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select Designation..." />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => (
                      <SelectItem key={d._id} value={d._id}>{d.title} (Level {d.level})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Reporting Manager</label>
                <Select value={managerId} onValueChange={setManagerId}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="No Manager (e.g. CEO)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Manager (e.g. CEO)</SelectItem>
                    {(managers || []).map((m) => (
                      <SelectItem key={m._id} value={m._id}>
                        {m.firstName} {m.lastName} ({m.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Employment Type</label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select Type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERN">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Joining Date <span className="text-red-500">*</span></label>
                <Input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Work Location <span className="text-red-500">*</span></label>
                <Select value={workLocation} onValueChange={setWorkLocation}>
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Select Location..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFFICE">Office</SelectItem>
                    <SelectItem value="REMOTE">Remote</SelectItem>
                    <SelectItem value="HYBRID">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Salary Grade / Level</label>
                <Input
                  placeholder="e.g. L4, M2"
                  value={salaryGrade}
                  onChange={(e) => setSalaryGrade(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Prior Experience (Years)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Prior experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setActiveTab('basic')}>
                Back to Basic
              </Button>
              <Button type="button" onClick={() => setActiveTab('extra')} className="bg-blue-600 hover:bg-blue-700 text-white">
                Next: Address & emergency
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'extra' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">Address & Emergency Contacts</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Address Fields */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Permanent Address</h4>
                <div className="space-y-2">
                  <Input placeholder="Street Address" value={street} onChange={(e) => setStreet(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                  <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                  <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Emergency Contact</h4>
                <div className="space-y-2">
                  <Input placeholder="Contact Name" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Input placeholder="Relationship" value={emergencyRelationship} onChange={(e) => setEmergencyRelationship(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Input placeholder="Phone Number" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Notes / Remarks</label>
              <Textarea
                placeholder="Write any onboarding comments or special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setActiveTab('job')}>
                Back to Role
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-32">
                {loading ? 'Creating...' : 'Save Employee'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
