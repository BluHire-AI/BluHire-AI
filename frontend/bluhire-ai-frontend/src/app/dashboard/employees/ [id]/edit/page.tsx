'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import { employeeService, Employee } from '@/services/employee.service';
import { departmentService, Department } from '@/services/department.service';
import { designationService, Designation } from '@/services/designation.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, User, Building, MapPin, RefreshCw } from 'lucide-react';

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'basic' | 'job' | 'extra'>('basic');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Lists
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [managers, setManagers] = useState<Employee[]>([]);

  // Form Fields
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
  const [employmentStatus, setEmploymentStatus] = useState('ACTIVE');
  const [joiningDate, setJoiningDate] = useState('');
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes, desgsRes, employeesRes, empData] = await Promise.all([
          departmentService.getActive(),
          designationService.getAll(),
          employeeService.list({ limit: 100 }),
          employeeService.get(id)
        ]);

        setDepartments(deptsRes);
        setDesignations(desgsRes);
        setManagers(employeesRes.employees.filter(e => e._id !== id));

        // Prefill Form Fields
        setEmployeeCode(empData.employeeCode);
        setFirstName(empData.firstName);
        setLastName(empData.lastName);
        setEmail(empData.email);
        setPhone(empData.phone || '');
        setGender(empData.gender || 'MALE');
        if (empData.dateOfBirth) {
          setDateOfBirth(new Date(empData.dateOfBirth).toISOString().split('T')[0]);
        }
        setDepartmentId(empData.departmentId?._id || '');
        setDesignationId(empData.designationId?._id || '');
        setManagerId(empData.managerId?._id || '');
        setEmploymentType(empData.employmentType || 'FULL_TIME');
        setEmploymentStatus(empData.employmentStatus || 'ACTIVE');
        if (empData.joiningDate) {
          setJoiningDate(new Date(empData.joiningDate).toISOString().split('T')[0]);
        }
        setWorkLocation(empData.workLocation || 'OFFICE');
        setSalaryGrade(empData.salaryGrade || '');
        setExperience(empData.experience ? empData.experience.toString() : '');

        if (empData.emergencyContact) {
          setEmergencyName(empData.emergencyContact.name || '');
          setEmergencyPhone(empData.emergencyContact.phone || '');
          setEmergencyRelationship(empData.emergencyContact.relationship || '');
        }

        if (empData.address) {
          setStreet(empData.address.street || '');
          setCity(empData.address.city || '');
          setState(empData.address.state || '');
          setPostalCode(empData.address.postalCode || '');
          setCountry(empData.address.country || 'India');
        }

        setNotes(empData.notes || '');
      } catch (error) {
        toast.error('Failed to load employee record data');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const validateForm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First & Last name are required');
      setActiveTab('basic');
      return false;
    }
    if (!phone.trim()) {
      toast.error('Phone number is required');
      setActiveTab('basic');
      return false;
    }
    if (!departmentId) {
      toast.error('Department is required');
      setActiveTab('job');
      return false;
    }
    if (!designationId) {
      toast.error('Designation is required');
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
        firstName,
        lastName,
        phone,
        gender,
        departmentId,
        designationId,
        employmentStatus,
        workLocation,
      };

      if (dateOfBirth) payload.dateOfBirth = new Date(dateOfBirth).toISOString();
      if (managerId) payload.managerId = managerId;
      else payload.managerId = null; // Unassign manager
      
      if (salaryGrade) payload.salaryGrade = salaryGrade;
      if (experience) payload.experience = parseFloat(experience);
      if (notes) payload.notes = notes;

      payload.emergencyContact = {
        name: emergencyName,
        phone: emergencyPhone,
        relationship: emergencyRelationship
      };

      payload.address = {
        street,
        city,
        state,
        postalCode,
        country
      };

      await employeeService.update(id, payload);
      toast.success('Employee record updated successfully');
      router.push(`/dashboard/employees/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update employee record');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-zinc-500 dark:text-zinc-400">Loading employee details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link href={`/dashboard/employees/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Edit Employee: {firstName} {lastName}</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Modify profile parameters, update work location, or change organization hierarchies.</p>
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
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg text-zinc-900 dark:text-white">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Employee Code</label>
                <Input value={employeeCode} disabled className="bg-zinc-50 dark:bg-zinc-800 cursor-not-allowed" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email Address</label>
                <Input value={email} disabled className="bg-zinc-50 dark:bg-zinc-800 cursor-not-allowed" />
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
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Phone Number <span className="text-red-500">*</span></label>
                <Input
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
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
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Designation <span className="text-red-500">*</span></label>
                <select
                  value={designationId}
                  onChange={(e) => setDesignationId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Designation...</option>
                  {designations.map((d) => (
                    <option key={d._id} value={d._id}>{d.title} (Level {d.level})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Reporting Manager</label>
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Manager (e.g. CEO)</option>
                  {managers.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName} ({m.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Employment Status</label>
                <select
                  value={employmentStatus}
                  onChange={(e) => setEmploymentStatus(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON LEAVE</option>
                  <option value="TERMINATED">TERMINATED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Employment Type</label>
                <select
                  value={employmentType}
                  disabled
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm cursor-not-allowed"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Work Location <span className="text-red-500">*</span></label>
                <select
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OFFICE">Office</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Salary Grade</label>
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
                placeholder="Write any comments..."
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
                {loading ? 'Saving...' : 'Update Employee'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
