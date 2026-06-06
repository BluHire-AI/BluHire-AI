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
  Briefcase, MapPin, Phone, Mail, User, Info, Plus, Trash2, FileUp, RefreshCw,
  Sparkles, Brain, ArrowUpRight, Flame, Target
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';

export default function EmployeeDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuthStore();

  const skillRadarData = [
    { subject: 'Technical Skill', A: 88, fullMark: 100 },
    { subject: 'Communication', A: 75, fullMark: 100 },
    { subject: 'Leadership', A: 82, fullMark: 100 },
    { subject: 'Strategy', A: 85, fullMark: 100 },
    { subject: 'Teamwork', A: 90, fullMark: 100 },
  ];

  const performanceTrendData = [
    { name: 'Q1 2025', rating: 3.8 },
    { name: 'Q2 2025', rating: 4.1 },
    { name: 'Q3 2025', rating: 4.0 },
    { name: 'Q4 2025', rating: 4.3 },
  ];

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
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border border-primary/5 blur-sm animate-pulse" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground tracking-wide animate-pulse">Loading employee profile...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6 bg-card border border-border rounded-2xl p-8 mt-20 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-destructive/10 rounded-full blur-3xl pointer-events-none" />
        <ShieldAlert className="w-12 h-12 text-destructive mx-auto animate-bounce" />
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Profile Not Found</h2>
          <p className="text-sm text-muted-foreground">The requested employee record does not exist or has been deleted.</p>
        </div>
        <Link href="/dashboard/employees" className="block">
          <Button className="w-full bg-primary hover:bg-primary/95 text-white rounded-xl font-semibold shadow-md">
            Back to Employees
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-2xl bg-card/65 backdrop-blur-md border border-border/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/employees">
            <Button variant="ghost" size="icon" className="hover:bg-muted/60 rounded-xl transition-all h-9 w-9">
              <ArrowLeft className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Button>
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-indigo-500 border border-primary/20 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-primary/20 shrink-0">
            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {employee.firstName} {employee.lastName}
              </h1>
              <Badge className={
                employee.employmentStatus === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 font-bold'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/10 font-bold'
              }>
                {employee.employmentStatus}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {employee.designationId?.title || 'Unassigned'} • {employee.departmentId?.name || 'Unassigned Department'} ({employee.employeeCode})
            </p>
          </div>
        </div>

        {isHRorAdmin && (
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" size="sm" className="rounded-xl border-border/60 hover:bg-muted/60 text-xs font-semibold" onClick={() => setActiveDialog('status')}>
              Change Status
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl border-border/60 hover:bg-muted/60 text-xs font-semibold" onClick={() => setActiveDialog('transfer')}>
              Transfer
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl border-border/60 hover:bg-muted/60 text-xs font-semibold" onClick={() => {
              setPromoDesg(employee.designationId?._id || '');
              setPromoDept(employee.departmentId?._id || '');
              setPromoSalary(employee.salaryGrade || '');
              setActiveDialog('promote');
            }}>
              Promote
            </Button>
            <Link href={`/dashboard/employees/${employee._id}/edit`}>
              <Button size="sm" className="bg-primary hover:bg-primary/95 text-white rounded-xl shadow-md text-xs font-semibold">
                <Edit className="w-4 h-4 mr-2" /> Edit Profile
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/30 p-1 rounded-2xl border border-border/50 flex flex-wrap gap-1 w-fit max-w-full">
          <TabsTrigger value="overview" className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="education" className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Education & Skills</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Performance</TabsTrigger>
          <TabsTrigger value="career-growth" className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Career Growth</TabsTrigger>
          <TabsTrigger value="ai-insights" className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer transition-all data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> AI Insights
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Documents</TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-xl text-xs font-bold px-4 py-2 cursor-pointer transition-all data-[state=active]:bg-primary data-[state=active]:text-white">Career Timeline</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 bg-card/60 backdrop-blur-md border border-border/80 shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <User className="w-5 h-5 text-primary" /> Personal & Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Email Address</span>
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" /> {employee.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Phone Number</span>
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {employee.phone}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Gender</span>
                    <span className="text-sm font-medium text-foreground">{employee.gender || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Date of Birth</span>
                    <span className="text-sm font-medium text-foreground">
                      {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-2">Employment Type</span>
                    <Badge variant="outline" className="bg-muted/50 border-border font-semibold text-foreground px-2.5 py-1 text-xs">{employee.employmentType.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Work Location</span>
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" /> {employee.workLocation}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Joining Date</span>
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" /> {new Date(employee.joiningDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Salary Grade</span>
                    <span className="text-sm font-medium text-foreground">{employee.salaryGrade || 'None'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-1">Reporting Manager</span>
                    <span className="text-sm font-medium text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {employee.managerId ? `${employee.managerId.firstName} ${employee.managerId.lastName}` : 'Direct Report (CEO)'}
                    </span>
                  </div>
                </div>

                {employee.notes && (
                  <div className="border-t border-border pt-6">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block mb-2">HR Notes</span>
                    <p className="text-sm text-muted-foreground italic leading-relaxed bg-muted/20 p-3.5 rounded-xl border border-border/40">"{employee.notes}"</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              {/* Emergency Contact */}
              <Card className="bg-card/60 backdrop-blur-md border border-border/80 shadow-md rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <Info className="w-4.5 h-4.5 text-primary" /> Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employee.emergencyContact ? (
                    <div className="space-y-3.5">
                      <div>
                        <p className="text-sm font-bold text-foreground">{employee.emergencyContact.name}</p>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">Relationship: {employee.emergencyContact.relationship}</p>
                      </div>
                      <p className="text-sm text-foreground flex items-center gap-2 bg-muted/40 p-2.5 rounded-xl border border-border/40">
                        <Phone className="w-4 h-4 text-muted-foreground" /> {employee.emergencyContact.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No emergency contact details provided.</p>
                  )}
                </CardContent>
              </Card>

              {/* Address Details */}
              <Card className="bg-card/60 backdrop-blur-md border border-border/80 shadow-md rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <MapPin className="w-4.5 h-4.5 text-primary" /> Residential Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {employee.address ? (
                    <div className="text-sm text-foreground space-y-2">
                      <p className="font-medium">{employee.address.street}</p>
                      <p className="text-muted-foreground">{employee.address.city}, {employee.address.state} {employee.address.postalCode}</p>
                      <div className="pt-2 border-t border-border/40">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Country</p>
                        <p className="font-semibold text-foreground mt-0.5">{employee.address.country}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No address details provided.</p>
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
            <Card className="bg-card/60 backdrop-blur-md border border-border/80 shadow-md rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Award className="w-5 h-5 text-primary" /> Technical Skills
                </CardTitle>
                {isHRorAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => setActiveDialog('skill')} className="hover:bg-muted/65 rounded-xl h-8 w-8">
                    <Plus className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {employee.skills && employee.skills.length > 0 ? (
                    employee.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="pr-1 gap-1 bg-muted/60 border-border text-foreground hover:bg-muted/80 rounded-xl px-2.5 py-1 text-xs">
                        {skill}
                        {isHRorAdmin && (
                          <button onClick={() => handleRemoveSkill(skill)} className="text-muted-foreground hover:text-destructive transition-colors ml-1 w-4 h-4 rounded-full flex items-center justify-center hover:bg-destructive/10">
                            ×
                          </button>
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No skills listed yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Education History */}
            <Card className="md:col-span-2 bg-card/60 backdrop-blur-md border border-border/80 shadow-md rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <GraduationCap className="w-5 h-5 text-primary" /> Academic Qualifications
                </CardTitle>
                {isHRorAdmin && (
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/60 hover:bg-muted/60 text-xs font-semibold" onClick={() => setActiveDialog('education')}>
                    <Plus className="w-4 h-4" /> Add Degree
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {employee.education && employee.education.length > 0 ? (
                  employee.education.map((edu, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl border border-border/60 bg-muted/20 items-center">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{edu.degree} in {edu.field}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{edu.institution} • Class of {edu.graduationYear}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8 italic">No academic qualifications listed.</p>
                )}
              </CardContent>
            </Card>

            {/* Certifications */}
            <Card className="md:col-span-3 bg-card/60 backdrop-blur-md border border-border/80 shadow-md rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <Award className="w-5 h-5 text-primary" /> Professional Credentials
                </CardTitle>
                {isHRorAdmin && (
                  <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/60 hover:bg-muted/60 text-xs font-semibold" onClick={() => setActiveDialog('certification')}>
                    <Plus className="w-4 h-4" /> Add Certificate
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {employee.certifications && employee.certifications.length > 0 ? (
                  employee.certifications.map((cert, idx) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-xl border border-border/60 bg-muted/25 items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground">{cert.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Issued by {cert.issuer}</p>
                          <p className="text-[10px] text-muted-foreground/80 mt-1 font-semibold">
                            Issued: {new Date(cert.issueDate).toLocaleDateString()}
                            {cert.expiryDate && ` • Expires: ${new Date(cert.expiryDate).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      {cert.certificateUrl && (
                        <a href={cert.certificateUrl} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/95 text-xs font-bold rounded-xl hover:bg-primary/5 px-3">View</Button>
                        </a>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-sm text-muted-foreground italic">
                    No certifications uploaded.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 border-border bg-card/60 backdrop-blur-md shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Award className="w-4.5 h-4.5 text-primary" /> Performance Appraisal Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 5]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                    <Line type="monotone" dataKey="rating" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--background)' }} activeDot={{ r: 6 }} name="Rating" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-border bg-card/60 backdrop-blur-md shadow-md rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Appraisal Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="p-3 bg-muted/20 border border-border/40 rounded-xl">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Self Evaluation</span>
                    <span className="text-xl font-bold text-foreground mt-0.5 block">4.5 / 5.0</span>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border/40 rounded-xl">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Manager Evaluation</span>
                    <span className="text-xl font-bold text-foreground mt-0.5 block">4.3 / 5.0</span>
                  </div>
                  <div className="p-3 bg-muted/20 border border-border/40 rounded-xl">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Last Promotion Date</span>
                    <span className="text-sm font-semibold text-foreground mt-0.5 block">October 14, 2025</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 4: Career Growth */}
        <TabsContent value="career-growth" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border bg-card/60 backdrop-blur-md shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Promotion Readiness</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative w-32 h-32 flex items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                  <div className="text-center">
                    <span className="text-3xl font-black text-primary">82%</span>
                    <span className="text-[9px] text-muted-foreground block font-bold mt-1 uppercase tracking-wider">Readiness Score</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-5 font-medium leading-relaxed">
                  Excellent technical skills and strong collaboration indicators place this employee high in the promotion pool.
                </p>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 border-border bg-card/60 backdrop-blur-md shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Career Ladder Pathway</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-muted/20">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Current Designation</span>
                    <span className="text-sm font-bold text-foreground mt-0.5 block">{employee.designationId?.title || 'Unassigned'}</span>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Target Next Level</span>
                    <span className="text-sm font-bold text-primary mt-0.5 block">Lead Specialist</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Skills to Master for Level Up</h4>
                  <ul className="space-y-2.5">
                    {[
                      { skill: "Distributed Cloud Architecture", status: "In progress", color: "text-amber-500 bg-amber-500/10" },
                      { skill: "Leadership & Strategy Appraisals", status: "Pending", color: "text-muted-foreground bg-muted" },
                      { skill: "Project Management Certifications", status: "In progress", color: "text-amber-500 bg-amber-500/10" }
                    ].map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center text-xs p-3 rounded-xl border border-border/40 bg-muted/10">
                        <span className="font-semibold text-foreground">{item.skill}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${item.color}`}>{item.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 5: AI Insights */}
        <TabsContent value="ai-insights" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Profile Summary */}
            <Card className="md:col-span-2 border-border bg-card/60 backdrop-blur-md shadow-md rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                <Brain className="w-24 h-24 text-primary" />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500" /> AI-Generated Employee Executive Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-xs leading-relaxed text-foreground font-medium">
                  {employee.firstName} has consistently demonstrated strong project delivery outputs, achieving an average rating of 4.15/5.0. Their technical competency ranks in the top 15% of the company database.
                </p>
                <p className="text-xs leading-relaxed text-foreground font-medium">
                  <strong>Risk Assessment:</strong> Attrition risk is classified as <span className="text-emerald-450 font-bold">Low (15%)</span>, supported by a healthy attendance record, high participation in technical skill upgrades, and consistent appraisals.
                </p>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Retention Priority</span>
                    <Badge variant="outline" className="mt-1 bg-emerald-500/10 text-emerald-450 border-emerald-500/20 px-2 py-0.5 rounded-lg">Standard Support</Badge>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase tracking-wider">Leadership Fit Score</span>
                    <span className="text-sm font-extrabold text-indigo-400 mt-1 block">88% (Excellent)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competency Assessment Radar */}
            <Card className="border-border bg-card/60 backdrop-blur-md shadow-md rounded-2xl">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Competency Radar</CardTitle>
              </CardHeader>
              <CardContent className="h-[220px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={skillRadarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" stroke="var(--muted-foreground)" fontSize={9} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={8} />
                    <Radar name={employee.firstName} dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 6: Documents */}
        <TabsContent value="documents">
          <Card className="bg-card/60 backdrop-blur-md border border-border/80 shadow-md rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <FileText className="w-5 h-5 text-primary" /> Employee Attachments & Folders
              </CardTitle>
              {isHRorAdmin && (
                <Button variant="outline" size="sm" className="gap-1.5 rounded-xl border-border/60 hover:bg-muted/60 text-xs font-semibold" onClick={() => setActiveDialog('document')}>
                  <FileUp className="w-4 h-4" /> Upload Document
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {employee.documents && employee.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {employee.documents.map((doc, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold truncate max-w-[150px] text-foreground" title={doc.fileName}>{doc.fileName}</p>
                          <p className="text-[10px] text-muted-foreground capitalize mt-0.5">{doc.fileType} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/95 text-xs font-bold rounded-xl hover:bg-primary/5 px-2.5">Download</Button>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground italic text-sm">
                  No verified document copies (Offer letters, ID cards, degrees) uploaded.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Career Timeline */}
        <TabsContent value="timeline">
          <Card className="bg-card/60 backdrop-blur-md border border-border/80 shadow-md rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Calendar className="w-5 h-5 text-primary" /> Employment Journey & Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">No historical records available on the timeline.</p>
              ) : (
                <div className="relative pl-6 border-l border-border/80 space-y-6 ml-3 py-2">
                  {timeline.map((act, idx) => (
                    <div key={act._id || idx} className="relative">
                      <span className="absolute -left-[35px] top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary ring-4 ring-background">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {new Date(act.createdAt).toLocaleDateString()}
                          </span>
                          <Badge variant="outline" className="text-[9px] py-0 bg-muted/40 border-border text-foreground font-bold">
                            {act.activityType}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-sm text-foreground mt-1">
                          {act.description}
                        </h4>
                        {act.notes && (
                          <p className="text-xs text-muted-foreground italic mt-1 bg-muted/10 p-2.5 rounded-xl border border-border/30 max-w-2xl">
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
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Add Technical Skill</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSkill} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Skill Name</label>
              <Input placeholder="e.g. Node.js, AWS, React" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')} className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold">Cancel</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold">Add Skill</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Add Education */}
      <Dialog open={activeDialog === 'education'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Add Academic Qualification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEdu} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Degree / Certificate</label>
              <Input placeholder="e.g. Bachelor of Technology" value={eduDegree} onChange={(e) => setEduDegree(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Field of Study</label>
              <Input placeholder="e.g. Computer Science & Engineering" value={eduField} onChange={(e) => setEduField(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Institution / University</label>
              <Input placeholder="e.g. Stanford University" value={eduInst} onChange={(e) => setEduInst(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Graduation Year</label>
              <Input type="number" value={eduYear} onChange={(e) => setEduYear(parseInt(e.target.value))} className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')} className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold">Cancel</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Add Certification */}
      <Dialog open={activeDialog === 'certification'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Add Certification</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCert} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Certification Name</label>
              <Input placeholder="e.g. AWS Certified Solutions Architect" value={certName} onChange={(e) => setCertName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Issuer</label>
              <Input placeholder="e.g. Amazon Web Services" value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Issue Date</label>
                <Input type="date" value={certIssueDate} onChange={(e) => setCertIssueDate(e.target.value)} className="rounded-xl cursor-pointer" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Expiry Date (Optional)</label>
                <Input type="date" value={certExpiryDate} onChange={(e) => setCertExpiryDate(e.target.value)} className="rounded-xl cursor-pointer" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Credential URL</label>
              <Input placeholder="e.g. https://creds.com/id" value={certUrl} onChange={(e) => setCertUrl(e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')} className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold">Cancel</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold">Add</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Upload Document */}
      <Dialog open={activeDialog === 'document'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Upload Document Attachment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDoc} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">File Name</label>
              <Input placeholder="e.g. Offer_Letter_Signed.pdf" value={docName} onChange={(e) => setDocName(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer transition-all"
              >
                <option value="pdf">PDF Copy</option>
                <option value="docx">Word Doc</option>
                <option value="png">PNG Image</option>
                <option value="jpeg">JPEG Image</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">File URL (Hosted/Mock)</label>
              <Input placeholder="https://..." value={docUrl} onChange={(e) => setDocUrl(e.target.value)} className="rounded-xl" />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')} className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold">Cancel</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold">Upload</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 5. Process Promotion */}
      <Dialog open={activeDialog === 'promote'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Process Promotion</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePromote} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">New Designation <span className="text-destructive">*</span></label>
              <select
                value={promoDesg}
                onChange={(e) => setPromoDesg(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer transition-all"
              >
                <option value="">Select Designation...</option>
                {designations.map((d) => (
                  <option key={d._id} value={d._id}>{d.title} (Level {d.level})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Change Department (Optional)</label>
              <select
                value={promoDept}
                onChange={(e) => setPromoDept(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer transition-all"
              >
                <option value="">Keep current department</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">New Salary Grade / Code (Optional)</label>
              <Input placeholder="e.g. Grade L5" value={promoSalary} onChange={(e) => setPromoSalary(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Effective Date</label>
              <Input type="date" value={promoDate} onChange={(e) => setPromoDate(e.target.value)} className="rounded-xl cursor-pointer" />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')} className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold">Cancel</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold">Approve Promotion</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 6. Process Transfer */}
      <Dialog open={activeDialog === 'transfer'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Process Department Transfer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransfer} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">New Department <span className="text-destructive">*</span></label>
              <select
                value={transDept}
                onChange={(e) => setTransDept(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer transition-all"
              >
                <option value="">Select Department...</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Change Designation (Optional)</label>
              <select
                value={transDesg}
                onChange={(e) => setTransDesg(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer transition-all"
              >
                <option value="">Keep current designation</option>
                {designations.map((d) => (
                  <option key={d._id} value={d._id}>{d.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Transfer Date</label>
              <Input type="date" value={transDate} onChange={(e) => setTransDate(e.target.value)} className="rounded-xl cursor-pointer" />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')} className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold">Cancel</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold">Approve Transfer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Change Status */}
      <Dialog open={activeDialog === 'status'} onOpenChange={(open) => !open && setActiveDialog('none')}>
        <DialogContent className="bg-card border border-border rounded-2xl max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Change Employment Status</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStatusChange} className="space-y-5 mt-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Employment Status <span className="text-destructive">*</span></label>
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer transition-all"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON LEAVE</option>
                <option value="TERMINATED">TERMINATED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Reason for Change (Optional)</label>
              <Input placeholder="e.g. Parental leave, voluntary separation" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Effective Date</label>
              <Input type="date" value={statusDate} onChange={(e) => setStatusDate(e.target.value)} className="rounded-xl cursor-pointer" />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setActiveDialog('none')} className="rounded-xl border-border/60 hover:bg-muted text-xs font-semibold">Cancel</Button>
              <Button type="submit" className="bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-semibold">Confirm Change</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
