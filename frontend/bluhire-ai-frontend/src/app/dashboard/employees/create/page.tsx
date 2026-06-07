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
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center space-x-4 p-6 rounded-2xl bg-card/60 backdrop-blur-md border border-border/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <Link href="/dashboard/employees">
          <Button variant="ghost" size="icon" className="hover:bg-muted/60 rounded-xl transition-all h-9 w-9">
            <ArrowLeft className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create Employee</h1>
          <p className="text-sm text-muted-foreground mt-1">Establish a new workforce record linked to a system user account.</p>
        </div>
      </div>

      {/* Tabs / Step indicators */}
      <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-border/55 gap-1.5 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`px-4.5 py-2 font-bold text-xs rounded-xl cursor-pointer transition-all ${
            activeTab === 'basic'
              ? 'bg-primary text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          1. Basic Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('job')}
          className={`px-4.5 py-2 font-bold text-xs rounded-xl cursor-pointer transition-all ${
            activeTab === 'job'
              ? 'bg-primary text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          2. Employment & Role
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('extra')}
          className={`px-4.5 py-2 font-bold text-xs rounded-xl cursor-pointer transition-all ${
            activeTab === 'extra'
              ? 'bg-primary text-white shadow-md'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          }`}
        >
          3. Address & Emergency
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl p-6.5 shadow-xl space-y-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <UserPlus className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Link User Account (Optional)</label>
                <Select value={selectedUserId} onValueChange={handleUserSelect} searchable={true}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border/60 bg-muted/20">
                    <SelectValue placeholder="Select a user account..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {users.map((u) => (
                      <SelectItem key={u._id} value={u._id} className="text-foreground hover:bg-muted cursor-pointer">
                        {u.firstName} {u.lastName} ({u.email} - {u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground/80 font-medium">Only users without existing employee profiles are shown.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Employee Code <span className="text-destructive">*</span></label>
                <Input
                  placeholder="e.g. EMP102"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="uppercase rounded-xl border-border/60 bg-muted/20 focus:bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">First Name <span className="text-destructive">*</span></label>
                <Input
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Last Name <span className="text-destructive">*</span></label>
                <Input
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Email Address <span className="text-destructive">*</span></label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Phone Number <span className="text-destructive">*</span></label>
                <Input
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Gender</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border/60 bg-muted/20">
                    <SelectValue placeholder="Select Gender..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    <SelectItem value="MALE" className="cursor-pointer">Male</SelectItem>
                    <SelectItem value="FEMALE" className="cursor-pointer">Female</SelectItem>
                    <SelectItem value="OTHER" className="cursor-pointer">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Date of Birth</label>
                <Input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent cursor-pointer"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-border/40">
              <Button type="button" onClick={() => setActiveTab('job')} className="bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md text-xs font-semibold px-5">
                Next: Employment details
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'job' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <Building className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Employment & Hierarchy</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5.5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Department <span className="text-destructive">*</span></label>
                <Select value={departmentId} onValueChange={setDepartmentId} searchable={true}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border/60 bg-muted/20">
                    <SelectValue placeholder="Select Department..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {departments.map((d) => (
                      <SelectItem key={d._id} value={d._id} className="cursor-pointer">{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Designation <span className="text-destructive">*</span></label>
                <Select value={designationId} onValueChange={setDesignationId} searchable={true}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border/60 bg-muted/20">
                    <SelectValue placeholder="Select Designation..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    {designations.map((d) => (
                      <SelectItem key={d._id} value={d._id} className="cursor-pointer">{d.title} (Level {d.level})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Reporting Manager</label>
                <Select value={managerId} onValueChange={setManagerId} searchable={true}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border/60 bg-muted/20">
                    <SelectValue placeholder="No Manager (e.g. CEO)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    <SelectItem value="" className="cursor-pointer">No Manager (e.g. CEO)</SelectItem>
                    {(managers || []).map((m) => (
                      <SelectItem key={m._id} value={m._id} className="cursor-pointer">
                        {m.firstName} {m.lastName} ({m.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Employment Type</label>
                <Select value={employmentType} onValueChange={setEmploymentType}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border/60 bg-muted/20">
                    <SelectValue placeholder="Select Type..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    <SelectItem value="FULL_TIME" className="cursor-pointer">Full Time</SelectItem>
                    <SelectItem value="PART_TIME" className="cursor-pointer">Part Time</SelectItem>
                    <SelectItem value="CONTRACT" className="cursor-pointer">Contract</SelectItem>
                    <SelectItem value="INTERN" className="cursor-pointer">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Joining Date <span className="text-destructive">*</span></label>
                <Input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Work Location <span className="text-destructive">*</span></label>
                <Select value={workLocation} onValueChange={setWorkLocation}>
                  <SelectTrigger className="w-full h-10 rounded-xl border border-border/60 bg-muted/20">
                    <SelectValue placeholder="Select Location..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border">
                    <SelectItem value="OFFICE" className="cursor-pointer">Office</SelectItem>
                    <SelectItem value="REMOTE" className="cursor-pointer">Remote</SelectItem>
                    <SelectItem value="HYBRID" className="cursor-pointer">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Salary Grade / Level</label>
                <Input
                  placeholder="e.g. L4, M2"
                  value={salaryGrade}
                  onChange={(e) => setSalaryGrade(e.target.value)}
                  className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Prior Experience (Years)</label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Prior experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setActiveTab('basic')} className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold px-5">
                Back to Basic
              </Button>
              <Button type="button" onClick={() => setActiveTab('extra')} className="bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md text-xs font-semibold px-5">
                Next: Address & emergency
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'extra' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60">
              <MapPin className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg text-foreground">Address & Emergency Contacts</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6.5">
              {/* Address Fields */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-foreground uppercase tracking-wider text-muted-foreground/90">Permanent Address</h4>
                <div className="space-y-3">
                  <Input placeholder="Street Address" value={street} onChange={(e) => setStreet(e.target.value)} className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent" />
                  <Input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Postal Code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent" />
                  <Input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent" />
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-foreground uppercase tracking-wider text-muted-foreground/90">Emergency Contact</h4>
                <div className="space-y-3">
                  <Input placeholder="Contact Name" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent" />
                </div>
                <div className="space-y-3">
                  <Input placeholder="Relationship" value={emergencyRelationship} onChange={(e) => setEmergencyRelationship(e.target.value)} className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent" />
                </div>
                <div className="space-y-3">
                  <Input placeholder="Phone Number" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent" />
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Notes / Remarks</label>
              <Textarea
                placeholder="Write any onboarding comments or special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl border-border/60 bg-muted/20 focus:bg-transparent"
              />
            </div>

            <div className="flex justify-between pt-5 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setActiveTab('job')} className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold px-5">
                Back to Role
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md text-xs font-semibold px-6 min-w-32">
                {loading ? 'Creating...' : 'Save Employee'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
