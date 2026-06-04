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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit, ShieldAlert, Award, GraduationCap, FileText, Calendar,
  Briefcase, MapPin, Phone, Mail, User, Info, Plus, Trash2, FileUp, RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function EmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Metadata dropdowns
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);

  // Dialog States
  const [activeDialog, setActiveDialog] = useState<'none' | 'promote' | 'transfer' | 'status' | 'education' | 'certification' | 'document' | 'skill'>('none');

  // Input states for dialogs
  const [promoDesg, setPromoDesg] = useState('');
  const [promoDept, setPromoDept] = useState('');
  const [promoSalary, setPromoSalary] = useState('');
  const [promoDate, setPromoDate] = useState(new Date().toISOString().split('T')[0]);

  const [transDept, setTransDept] = useState('');
  const [transDesg, setTransDesg] = useState('');
  const [transDate, setTransDate] = useState(new Date().toISOString().split('T')[0]);

  const [statusVal, setStatusVal] = useState('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [statusDate, setStatusDate] = useState(new Date().toISOString().split('T')[0]);

  // Skill state
  const [newSkill, setNewSkill] = useState('');

  // Education state
  const [eduInst, setEduInst] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduYear, setEduYear] = useState(new Date().getFullYear());

  // Certification state
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certIssueDate, setCertIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [certExpiryDate, setCertExpiryDate] = useState('');
  const [certUrl, setCertUrl] = useState('');

  // Document state
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState<'pdf' | 'docx' | 'png' | 'jpeg'>('pdf');
  const [docUrl, setDocUrl] = useState('https://example.com/document.pdf');

  const isHRorAdmin = user?.role === 'MANAGEMENT_ADMIN' || user?.role === 'HR_RECRUITER';

  const loadData = async () => {
    try {
      const [empRes, timelineRes] = await Promise.all([
        employeeService.get(id),
        employeeService.getTimeline(id),
      ]);
      setEmployee(empRes);
      setTimeline(timelineRes);
    } catch (error: any) {
      toast.error('Failed to load employee profile');
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const [deptsRes, desgsRes] = await Promise.all([
        departmentService.getActive(),
        designationService.getAll(),
      ]);
      setDepartments(deptsRes);
      setDesignations(desgsRes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
    loadMetadata();
  }, [id]);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoDesg) {
      toast.error('Please select designation');
      return;
    }
    try {
      const body: any = {
        designationId: promoDesg,
        promotionDate: new Date(promoDate).toISOString(),
      };
      if (promoDept) body.departmentId = promoDept;
      if (promoSalary) body.salaryGrade = promoSalary;

      await employeeService.promote(id, body);
      toast.success('Promotion processed successfully');
      setActiveDialog('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Promotion failed');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transDept) {
      toast.error('Please select department');
      return;
    }
    try {
      const body: any = {
        departmentId: transDept,
        transferDate: new Date(transDate).toISOString(),
      };
      if (transDesg) body.designationId = transDesg;

      await employeeService.transfer(id, body);
      toast.success('Department transfer completed');
      setActiveDialog('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Transfer failed');
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: any = {
        employmentStatus: statusVal,
      };
      if (statusReason) body.reason = statusReason;
      if (statusDate) body.effectiveDate = new Date(statusDate).toISOString();

      await employeeService.changeStatus(id, body);
      toast.success('Employment status changed');
      setActiveDialog('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Status change failed');
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    try {
      await employeeService.addSkill(id, newSkill.trim());
      toast.success('Skill added');
      setNewSkill('');
      setActiveDialog('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (skill: string) => {
    if (!confirm(`Are you sure you want to remove ${skill}?`)) return;
    try {
      await employeeService.removeSkill(id, skill);
      toast.success('Skill removed');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove skill');
    }
  };

  const handleAddEdu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduInst.trim() || !eduDegree.trim() || !eduField.trim()) {
      toast.error('All fields are required');
      return;
    }
    try {
      await employeeService.addEducation(id, {
        institution: eduInst,
        degree: eduDegree,
        field: eduField,
        graduationYear: eduYear,
      });
      toast.success('Education history added');
      setEduInst('');
      setEduDegree('');
      setEduField('');
      setActiveDialog('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add education');
    }
  };

  const handleAddCert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certName.trim() || !certIssuer.trim()) {
      toast.error('Name & Issuer are required');
      return;
    }
    try {
      const body: any = {
        name: certName,
        issuer: certIssuer,
        issueDate: new Date(certIssueDate).toISOString(),
      };
      if (certExpiryDate) body.expiryDate = new Date(certExpiryDate).toISOString();
      if (certUrl) body.certificateUrl = certUrl;

      await employeeService.addCertification(id, body);
      toast.success('Certification credential added');
      setCertName('');
      setCertIssuer('');
      setCertUrl('');
      setActiveDialog('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add certification');
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      toast.error('File name is required');
      return;
    }
    try {
      await employeeService.uploadDocument(id, {
        fileName: docName,
        fileType: docType,
        fileUrl: docUrl,
      });
      toast.success('Document uploaded');
      setDocName('');
      setActiveDialog('none');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Document upload failed');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-zinc-500 dark:text-zinc-400">Loading employee details...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-20 space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold">Profile Not Found</h2>
        <p className="text-zinc-500">The requested employee record does not exist or has been deleted.</p>
        <Link href="/dashboard/employees">
          <Button>Back to Employees</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-2xl text-blue-700 dark:text-blue-300">
            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {employee.firstName} {employee.lastName}
              </h1>
              <Badge variant={employee.employmentStatus === 'ACTIVE' ? 'success' : 'warning'}>
                {employee.employmentStatus}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {employee.designationId?.title || 'Unassigned'} • {employee.departmentId?.name || 'Unassigned Department'} ({employee.employeeCode})
            </p>
          </div>
        </div>

        {isHRorAdmin && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveDialog('status')}>
              Change Status
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog('transfer')}>
              Transfer
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              setPromoDesg(employee.designationId?._id || '');
              setPromoDept(employee.departmentId?._id || '');
              setPromoSalary(employee.salaryGrade || '');
              setActiveDialog('promote');
            }}>
              Promote
            </Button>
            <Link href={`/dashboard/employees/${employee._id}/edit`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="education">Education & Skills</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Career Timeline</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-blue-600" /> Personal & Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block">Email Address</span>
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-zinc-400" /> {employee.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block">Phone Number</span>
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" /> {employee.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block">Gender</span>
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{employee.gender || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block">Date of Birth</span>
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-6 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block">Employment Type</span>
                    <Badge variant="outline">{employee.employmentType.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block">Work Location</span>
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" /> {employee.workLocation}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block">Joining Date</span>
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" /> {new Date(employee.joiningDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block">Salary Grade</span>
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{employee.salaryGrade || 'None'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 font-semibold block">Reporting Manager</span>
                    <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      {employee.managerId ? `${employee.managerId.firstName} ${employee.managerId.lastName}` : 'Direct Report (CEO)'}
                    </span>
                  </div>
                </div>

                {employee.notes && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <span className="text-xs text-zinc-400 font-semibold block">HR Notes</span>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 italic">"{employee.notes}"</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Emergency Contact */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" /> Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employee.emergencyContact ? (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{employee.emergencyContact.name}</p>
                      <p className="text-xs text-zinc-500">Relationship: {employee.emergencyContact.relationship}</p>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-zinc-400" /> {employee.emergencyContact.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">No emergency contact details provided.</p>
                  )}
                </CardContent>
              </Card>

              {/* Address Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" /> Residential Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employee.address ? (
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
                      <p>{employee.address.street}</p>
                      <p>{employee.address.city}, {employee.address.state}</p>
                      <p>{employee.address.postalCode}</p>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">{employee.address.country}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">No address details provided.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Education & Skills */}
        <TabsContent value="education" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Skills */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" /> Technical Skills
                </CardTitle>
                {isHRorAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => setActiveDialog('skill')}>
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {employee.skills && employee.skills.length > 0 ? (
                    employee.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="pr-1 gap-1">
                        {skill}
                        {isHRorAdmin && (
                          <button onClick={() => handleRemoveSkill(skill)} className="text-zinc-400 hover:text-red-500 transition-colors">
                            ×
                          </button>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500 italic">No skills listed yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Education History */}
            <Card className="md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" /> Academic Qualifications
                </CardTitle>
                {isHRorAdmin && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setActiveDialog('education')}>
                    <Plus className="w-4 h-4" /> Add Degree
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.education && employee.education.length > 0 ? (
                  employee.education.map((edu, idx) => (
                    <div key={idx} className="flex gap-4 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{edu.degree} in {edu.field}</h4>
                        <p className="text-xs text-zinc-500">{edu.institution} • Class of {edu.graduationYear}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 text-center py-6 italic">No academic qualifications listed.</p>
                )}
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" /> Professional Credentials
                </CardTitle>
                {isHRorAdmin && (
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => setActiveDialog('certification')}>
                    <Plus className="w-4 h-4" /> Add Certificate
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.certifications && employee.certifications.length > 0 ? (
                  employee.certifications.map((cert, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-lg border border-zinc-100 dark:border-zinc-800 items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{cert.name}</h4>
                          <p className="text-xs text-zinc-500">Issued by {cert.issuer}</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Issued: {new Date(cert.issueDate).toLocaleDateString()}
                            {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      {cert.certificateUrl && (
                        <a href={cert.certificateUrl} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm" className="text-blue-600">View</Button>
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-6 text-sm text-zinc-500 italic">
                    No certifications uploaded.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" /> Employee Attachments & Folders
              </CardTitle>
              {isHRorAdmin && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setActiveDialog('document')}>
                  <FileUp className="w-4 h-4" /> Upload Document
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.documents && employee.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {employee.documents.map((doc, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-red-50 dark:bg-red-950/30 text-red-600 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold truncate max-w-[150px]" title={doc.fileName}>{doc.fileName}</p>
                          <p className="text-xs text-zinc-400 capitalize">{doc.fileType} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm" className="text-blue-600 font-medium">Download</Button>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 italic">
                  No verified document copies (Offer letters, ID cards, degrees) uploaded.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Career Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Employment Journey & Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-zinc-500 italic text-center py-6">No historical records available on the timeline.</p>
              ) : (
                <div className="relative pl-6 border-l border-zinc-200 dark:border-zinc-800 space-y-6">
                  {timeline.map((act, idx) => (
                    <div key={act._id || idx} className="relative">
                      <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 ring-4 ring-white dark:ring-zinc-950 text-blue-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400 font-medium">
                            {new Date(act.createdAt).toLocaleDateString()}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0">
                            {act.activityType}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mt-0.5">
                          {act.description}
                        </h4>
                        {act.notes && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mt-0.5">
                            Reason: "{act.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Modals */}
      {/* 1. Add Skill */}
      <Dialog open={activeDialog === 'skill'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Technical Skill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSkill} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Skill Name</label>
              <Input placeholder="e.g. Node.js, AWS, React" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Add Skill</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add Education */}
      <Dialog open={activeDialog === 'education'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Academic Qualification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEdu} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Degree / Certificate</label>
              <Input placeholder="e.g. Bachelor of Technology" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Field of Study</label>
              <Input placeholder="e.g. Computer Science & Engineering" value={eduField} onChange={(e) => setEduField(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Institution / University</label>
              <Input placeholder="e.g. Stanford University" value={eduInst} onChange={(e) => setEduInst(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Graduation Year</label>
              <Input type="number" value={eduYear} onChange={(e) => setEduYear(parseInt(e.target.value))} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Add Certification */}
      <Dialog open={activeDialog === 'certification'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Certification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCert} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Certification Name</label>
              <Input placeholder="e.g. AWS Certified Solutions Architect" value={certName} onChange={(e) => setCertName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Issuer</label>
              <Input placeholder="e.g. Amazon Web Services" value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Issue Date</label>
                <Input type="date" value={certIssueDate} onChange={(e) => setCertIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Expiry Date (Optional)</label>
                <Input type="date" value={certExpiryDate} onChange={(e) => setCertExpiryDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Credential URL</label>
              <Input placeholder="e.g. https://creds.com/id" value={certUrl} onChange={(e) => setCertUrl(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Upload Document */}
      <Dialog open={activeDialog === 'document'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document Attachment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDoc} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">File Name</label>
              <Input placeholder="e.g. Offer_Letter_Signed.pdf" value={docName} onChange={(e) => setDocName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm focus:outline-none"
              >
                <option value="pdf">PDF Copy</option>
                <option value="docx">Word Doc</option>
                <option value="png">PNG Image</option>
                <option value="jpeg">JPEG Image</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">File URL (Hosted/Mock)</label>
              <Input placeholder="https://..." value={docUrl} onChange={(e) => setDocUrl(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Upload</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Process Promotion */}
      <Dialog open={activeDialog === 'promote'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Promotion</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePromote} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">New Designation <span className="text-red-500">*</span></label>
              <select
                value={promoDesg}
                onChange={(e) => setPromoDesg(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
              >
                <option value="">Select Designation...</option>
                {designations.map((d) => (
                  <option key={d._id} value={d._id}>{d.title} (Level {d.level})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Change Department (Optional)</label>
              <select
                value={promoDept}
                onChange={(e) => setPromoDept(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
              >
                <option value="">Keep current department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">New Salary Grade / Code (Optional)</label>
              <Input placeholder="e.g. Grade L5" value={promoSalary} onChange={(e) => setPromoSalary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Effective Date</label>
              <Input type="date" value={promoDate} onChange={(e) => setPromoDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Approve Promotion</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Process Transfer */}
      <Dialog open={activeDialog === 'transfer'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Department Transfer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">New Department <span className="text-red-500">*</span></label>
              <select
                value={transDept}
                onChange={(e) => setTransDept(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Change Designation (Optional)</label>
              <select
                value={transDesg}
                onChange={(e) => setTransDesg(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
              >
                <option value="">Keep current designation</option>
                {designations.map((d) => (
                  <option key={d._id} value={d._id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Transfer Date</label>
              <Input type="date" value={transDate} onChange={(e) => setTransDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Approve Transfer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Change Status */}
      <Dialog open={activeDialog === 'status'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Employment Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStatusChange} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Employment Status <span className="text-red-500">*</span></label>
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON LEAVE</option>
                <option value="TERMINATED">TERMINATED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Reason for Change (Optional)</label>
              <Input placeholder="e.g. Parental leave, voluntary separation" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Effective Date</label>
              <Input type="date" value={statusDate} onChange={(e) => setStatusDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Confirm Change</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
