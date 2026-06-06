'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Plus,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowRight,
  Search,
  Award,
  ShieldAlert,
  Brain,
  Zap,
  BookOpen,
  UserCheck,
  RefreshCw,
  FileText,
  ChevronRight,
  BarChart3,
  ListTodo,
  TrendingDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function PerformanceDashboard() {
  const { user } = useAuthStore();
  const isAdminOrManager = user?.role === 'MANAGEMENT_ADMIN' || user?.role === 'SENIOR_MANAGER';
  const isEmployee = user?.role === 'EMPLOYEE';
  const isRecruiter = user?.role === 'HR_RECRUITER';

  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  // Overview metrics state
  const [overview, setOverview] = useState({
    overallAvgScore: 0,
    promotionReadyCount: 0,
    goalCompletionRate: 0,
    reviewCompletionRate: 0
  });
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [managerRankings, setManagerRankings] = useState<any[]>([]);

  // Reviews Tab state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [filterPeriod, setFilterPeriod] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({
    employeeId: '',
    reviewPeriod: 'Q1 2026',
    reviewType: 'QUARTERLY',
    overallScore: 75,
    communicationScore: 7,
    technicalScore: 7,
    leadershipScore: 7,
    productivityScore: 7,
    teamworkScore: 7,
    comments: '',
    strengths: [] as string[],
    weaknesses: [] as string[],
    status: 'DRAFT'
  });
  const [strengthInput, setStrengthInput] = useState('');
  const [weaknessInput, setWeaknessInput] = useState('');

  // Goals Tab state
  const [goals, setGoals] = useState<any[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({
    employeeId: '',
    title: '',
    description: '',
    category: 'General',
    priority: 'MEDIUM',
    targetDate: new Date().toISOString().split('T')[0],
    progressPercentage: 0,
    weightage: 100,
    status: 'NOT_STARTED'
  });

  // Skills Tab state
  const [skills, setSkills] = useState<any[]>([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillForm, setSkillForm] = useState({
    employeeId: '',
    skillName: '',
    currentLevel: 5,
    desiredLevel: 8
  });
  const [selectedSkillInsight, setSelectedSkillInsight] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Promotion Tab state
  const [promotionCandidates, setPromotionCandidates] = useState<any[]>([]);
  const [promoLoading, setPromoLoading] = useState<string | null>(null);

  // Analytics Tab state
  const [chartData, setChartData] = useState({
    goals: [] as any[],
    skills: [] as any[],
    performanceDistribution: [] as any[]
  });

  // Module 8.1 State additions
  const [highRisks, setHighRisks] = useState<any[]>([]);
  const [successionPlans, setSuccessionPlans] = useState<any[]>([]);
  const [comparisonEmployeeId, setComparisonEmployeeId] = useState('');
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [trendEmployeeId, setTrendEmployeeId] = useState('');
  const [trendData, setTrendData] = useState<any>(null);
  const [learningPlan, setLearningPlan] = useState<any>(null);
  const [learningPlanLoading, setLearningPlanLoading] = useState(false);


  // Set default tab if employee or query param tab is provided
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['overview', 'reviews', 'goals', 'skills', 'promotions', 'analytics'].includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (isEmployee) {
        setActiveTab('goals');
      }
    } else if (isEmployee) {
      setActiveTab('goals');
    }
  }, [user]);

  // Initial Fetches
  useEffect(() => {
    fetchMetadata();
    fetchTabData();
  }, [activeTab, reviewPage, filterPeriod, filterType, filterDept]);

  useEffect(() => {
    if (comparisonEmployeeId) {
      fetchComparison(comparisonEmployeeId);
    }
  }, [comparisonEmployeeId]);

  useEffect(() => {
    if (trendEmployeeId) {
      fetchTrend(trendEmployeeId);
    }
  }, [trendEmployeeId]);

  const fetchMetadata = async () => {
    try {
      if (!isEmployee) {
        const [empRes, deptRes] = await Promise.all([
          api.get('/employees?limit=100').catch(() => ({ data: { data: [] } })),
          api.get('/departments/active').catch(() => ({ data: { data: [] } }))
        ]);
        
        const empList = Array.isArray(empRes.data.data) ? empRes.data.data : (empRes.data.data?.data || []);
        const deptList = Array.isArray(deptRes.data.data) ? deptRes.data.data : (deptRes.data.data?.data || deptRes.data.data?.departments || []);
        
        setEmployees(empList);
        setDepartments(deptList);
      }
    } catch (err) {
      console.error('Failed to load employee metadata', err);
    }
  };

  const fetchTabData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview' && !isEmployee) {
        const [overRes, perfRes, managerRes, riskRes] = await Promise.all([
          api.get('/performance/analytics/overview'),
          api.get('/performance/analytics/top-performers'),
          api.get('/performance/analytics/manager-effectiveness'),
          api.get('/performance/risk').catch(() => ({ data: { data: [] } }))
        ]);
        setOverview(overRes.data.data);
        setTopPerformers(perfRes.data.data);
        setManagerRankings(managerRes.data.data);
        setHighRisks(riskRes.data.data || []);
      }

      if (activeTab === 'reviews') {
        const params: any = {
          page: reviewPage,
          limit: 10,
          reviewPeriod: filterPeriod,
          reviewType: filterType,
          departmentId: filterDept
        };
        const res = await api.get('/performance/reviews', { params });
        const items = res.data.items || [];
        setReviews(items);
        setReviewTotal(res.data.total || 0);

        if (isEmployee && items.length > 0 && !comparisonEmployeeId) {
          const empId = items[0].employeeId?._id || items[0].employeeId;
          if (empId) {
            setComparisonEmployeeId(empId);
            setTrendEmployeeId(empId);
          }
        }
      }

      if (activeTab === 'goals') {
        const res = await api.get('/performance/goals');
        setGoals(res.data.data || []);
      }

      if (activeTab === 'skills') {
        const res = await api.get('/performance/skills');
        setSkills(res.data.data || []);
      }

      if (activeTab === 'promotions' && !isEmployee) {
        const [res, successionRes] = await Promise.all([
          api.get('/performance/promotions'),
          api.get('/performance/succession').catch(() => ({ data: { data: [] } }))
        ]);
        setPromotionCandidates(res.data.data || []);
        setSuccessionPlans(successionRes.data.data || []);
      }

      if (activeTab === 'analytics' && !isEmployee) {
        const [gRes, sRes, overRes] = await Promise.all([
          api.get('/performance/analytics/goal-completion'),
          api.get('/performance/analytics/skill-gaps'),
          api.get('/performance/analytics/overview')
        ]);

        // Format goal status stats
        const gData = Object.entries(gRes.data.data || {}).map(([key, value]) => ({
          name: key.replace('_', ' '),
          value
        }));

        // Format skill gaps
        const sData = (sRes.data.data || []).slice(0, 10).map((s: any) => ({
          name: s.skillName,
          gap: s.avgGapScore,
          count: s.employeeCount
        }));

        // Fetch top performers details for review score distributions
        const topPerfs = await api.get('/performance/analytics/top-performers');
        const scoreGroups = [
          { name: '70-79', count: 0 },
          { name: '80-89', count: 0 },
          { name: '90-100', count: 0 }
        ];
        (topPerfs.data.data || []).forEach((r: any) => {
          if (r.overallScore >= 90) scoreGroups[2].count++;
          else if (r.overallScore >= 80) scoreGroups[1].count++;
          else scoreGroups[0].count++;
        });

        setChartData({
          goals: gData,
          skills: sData,
          performanceDistribution: scoreGroups
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to fetch data for tab: ' + activeTab);
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecruiter) {
      toast.error('Recruiter role does not have write access');
      return;
    }
    try {
      const payload = {
        ...reviewForm,
        overallScore: Number(reviewForm.overallScore),
        communicationScore: Number(reviewForm.communicationScore),
        technicalScore: Number(reviewForm.technicalScore),
        leadershipScore: Number(reviewForm.leadershipScore),
        productivityScore: Number(reviewForm.productivityScore),
        teamworkScore: Number(reviewForm.teamworkScore)
      };

      if (selectedReview) {
        await api.put(`/performance/reviews/${selectedReview._id}`, payload);
        toast.success('Performance review updated successfully!');
      } else {
        await api.post('/performance/reviews', payload);
        toast.success('Performance review created successfully!');
      }
      setShowReviewModal(false);
      setSelectedReview(null);
      resetReviewForm();
      fetchTabData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecruiter) {
      toast.error('Recruiter role does not have write access');
      return;
    }
    try {
      const payload = {
        ...goalForm,
        progressPercentage: Number(goalForm.progressPercentage),
        weightage: Number(goalForm.weightage)
      };
      await api.post('/performance/goals', payload);
      toast.success('Goal assigned successfully!');
      setShowGoalModal(false);
      resetGoalForm();
      fetchTabData();
    } catch (err: any) {
      toast.error('Failed to create goal');
    }
  };

  const handleUpdateGoalStatus = async (goalId: string, newStatus: string, progress: number) => {
    if (isRecruiter) {
      toast.error('Recruiter role is read-only');
      return;
    }
    try {
      await api.put(`/performance/goals/${goalId}`, { status: newStatus, progressPercentage: progress });
      toast.success('Goal updated successfully');
      fetchTabData();
    } catch (err: any) {
      toast.error('Failed to update goal');
    }
  };

  const handleAssessSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecruiter) {
      toast.error('Recruiter role does not have write access');
      return;
    }
    try {
      const payload = {
        ...skillForm,
        currentLevel: Number(skillForm.currentLevel),
        desiredLevel: Number(skillForm.desiredLevel)
      };
      await api.post('/performance/skills', payload);
      toast.success('Skill assessment completed!');
      setShowSkillModal(false);
      fetchTabData();
    } catch (err: any) {
      toast.error('Failed to submit skill assessment');
    }
  };

  const fetchComparison = async (empId: string) => {
    if (!empId) return;
    try {
      const res = await api.get(`/performance/reviews/comparison/${empId}`);
      setComparisonData(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch self vs manager comparison');
    }
  };

  const fetchTrend = async (empId: string) => {
    if (!empId) return;
    try {
      const res = await api.get(`/performance/trends/${empId}`);
      setTrendData(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch employee trend');
    }
  };

  const handleFetchInsights = async (employeeId: string) => {
    setInsightsLoading(true);
    setLearningPlanLoading(true);
    try {
      const [res, lpRes] = await Promise.all([
        api.get(`/performance/skills/insights/${employeeId}`),
        api.get(`/performance/learning-plan/${employeeId}`).catch(() => ({ data: { data: null } }))
      ]);
      setSelectedSkillInsight(res.data.data?.insights || res.data.insights || 'No raw insights compiled.');
      setLearningPlan(lpRes.data.data || lpRes.data || null);
    } catch (err) {
      toast.error('Failed to retrieve AI insights or learning plan');
    } finally {
      setInsightsLoading(false);
      setLearningPlanLoading(false);
    }
  };

  const handleTriggerPromotionEvaluation = async (employeeId: string) => {
    if (isRecruiter) {
      toast.error('Recruiter role does not have write access');
      return;
    }
    setPromoLoading(employeeId);
    try {
      const res = await api.post(`/performance/promotions/evaluate/${employeeId}`);
      toast.success('AI promotion evaluation completed!');
      fetchTabData();
    } catch (err) {
      toast.error('Failed to trigger AI readiness scoring');
    } finally {
      setPromoLoading(null);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this performance review?')) return;
    try {
      await api.delete(`/performance/reviews/${id}`);
      toast.success('Review deleted');
      fetchTabData();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  const resetReviewForm = () => {
    setReviewForm({
      employeeId: '',
      reviewPeriod: 'Q1 2026',
      reviewType: 'QUARTERLY',
      overallScore: 75,
      communicationScore: 7,
      technicalScore: 7,
      leadershipScore: 7,
      productivityScore: 7,
      teamworkScore: 7,
      comments: '',
      strengths: [],
      weaknesses: [],
      status: 'DRAFT'
    });
  };

  const resetGoalForm = () => {
    setGoalForm({
      employeeId: '',
      title: '',
      description: '',
      category: 'General',
      priority: 'MEDIUM',
      targetDate: new Date().toISOString().split('T')[0],
      progressPercentage: 0,
      weightage: 100,
      status: 'NOT_STARTED'
    });
  };

  // Color mappings
  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
  const PRIORITY_COLORS: any = {
    HIGH: 'bg-red-500/10 text-red-500 border-red-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    LOW: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  };

  return (
    <div className="min-h-screen bg-transparent text-foreground p-6 space-y-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass bg-card/40 border border-border rounded-2xl p-6 glow-primary/5 gap-4">
        <div>
          <h1 className="text-h1 bg-gradient-to-r from-primary via-purple-400 to-success bg-clip-text text-transparent">
            Continuous AI Performance Coach
          </h1>
          <p className="text-body-copy text-muted-foreground mt-1">
            Evaluate workforce milestones, skill gap intelligence, and AI-driven promotion readiness.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-small-label font-semibold">
            {user?.role?.replace('_', ' ')}
          </span>
          <button
            onClick={fetchTabData}
            className="p-2 bg-muted hover:bg-muted/85 border border-border rounded-xl transition text-foreground cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border overflow-x-auto gap-2">
        {!isEmployee && (
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-6 font-medium text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
        )}
        <button
          onClick={() => setActiveTab('reviews')}
          className={`py-3 px-6 font-medium text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Performance Reviews
        </button>
        <button
          onClick={() => setActiveTab('goals')}
          className={`py-3 px-6 font-medium text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'goals'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Goals Kanban
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`py-3 px-6 font-medium text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'skills'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Skill Assessments
        </button>
        {!isEmployee && (
          <button
            onClick={() => setActiveTab('promotions')}
            className={`py-3 px-6 font-medium text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'promotions'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Promotion Readiness
          </button>
        )}
        {!isEmployee && (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-6 font-medium text-sm transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Talent Analytics
          </button>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="flex justify-center items-center py-16 space-x-2">
          <RefreshCw className="animate-spin text-primary" />
          <span className="text-muted-foreground">Loading continuous evaluations...</span>
        </div>
      )}

      {/* Tab Contents */}
      {!loading && (
        <div className="space-y-6">
          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && !isEmployee && (
            <div className="space-y-6 animate-fadeIn">
               {/* Executive Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass bg-card/65 border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Award className="h-16 w-16 text-primary" />
                  </div>
                  <p className="text-small-label text-muted-foreground">Avg Review Score</p>
                  <p className="text-kpi text-primary mt-2">{overview.overallAvgScore}/100</p>
                  <div className="flex items-center text-small-label mt-3 text-success normal-case font-medium">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>Submitted reviews</span>
                  </div>
                </div>

                <div className="glass bg-card/65 border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Brain className="h-16 w-16 text-success" />
                  </div>
                  <p className="text-small-label text-muted-foreground">Promotion Candidates</p>
                  <p className="text-kpi text-success mt-2">{overview.promotionReadyCount}</p>
                  <div className="flex items-center text-small-label mt-3 text-success/80 normal-case font-medium">
                    <Zap className="h-3 w-3 mr-1" />
                    <span>ReadinessScore &ge; 90</span>
                  </div>
                </div>

                <div className="glass bg-card/65 border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <ListTodo className="h-16 w-16 text-warning" />
                  </div>
                  <p className="text-small-label text-muted-foreground">Goal Completion Rate</p>
                  <p className="text-kpi text-warning mt-2">{overview.goalCompletionRate}%</p>
                  <div className="flex items-center text-small-label mt-3 text-warning/80 normal-case font-medium">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    <span>Completed objectives</span>
                  </div>
                </div>

                <div className="glass bg-card/65 border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/20 transition-all shadow-xl">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                    <Clock className="h-16 w-16 text-accent" />
                  </div>
                  <p className="text-small-label text-muted-foreground">Review Submission Rate</p>
                  <p className="text-kpi text-accent mt-2">{overview.reviewCompletionRate}%</p>
                  <div className="flex items-center text-small-label mt-3 text-accent/80 normal-case font-medium">
                    <FileText className="h-3 w-3 mr-1" />
                    <span>Submitted / drafts</span>
                  </div>
                </div>
              </div>

              {/* High Risk Employees Widget */}
              <div className="glass bg-card/40 border border-border rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-destructive" />
                    <h3 className="text-h2 text-foreground">High Performance Risk Intel Log</h3>
                  </div>
                  <span className="text-xs bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-1 rounded-full font-semibold">
                    {highRisks.length} Alerts Active
                  </span>
                </div>
                {highRisks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6 text-sm">
                    No active high-risk performance alerts. All tracked team members are meeting goals and review targets.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {highRisks.map((item, idx) => (
                      <div key={idx} className="bg-muted/30 border border-border p-4 rounded-xl space-y-3 relative overflow-hidden group hover:border-destructive/20 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-foreground text-sm">{item.employee?.firstName} {item.employee?.lastName}</h4>
                            <p className="text-[11px] text-muted-foreground">{item.employee?.employeeCode}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.riskLevel === 'HIGH' 
                              ? 'bg-destructive/10 text-destructive border-destructive/20' 
                              : 'bg-warning/10 text-warning border-warning/20'
                          }`}>
                            Risk Score: {item.riskScore}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Risk Factors:</p>
                          <ul className="list-disc list-inside text-[11px] text-muted-foreground space-y-0.5 animate-fadeIn">
                            {item.reasons?.map((reason: string, rIdx: number) => (
                              <li key={rIdx} className="line-clamp-1">{reason}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="bg-destructive/5 border border-destructive/10 p-2.5 rounded-lg">
                          <p className="text-[10px] text-destructive font-medium leading-relaxed">{item.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leaderboards and Rankings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="glass bg-card/40 border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-4">
                    <h3 className="text-h2 text-foreground">Top Talent Leaderboard</h3>
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  {topPerformers.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No high-performing reviews submitted yet.</div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                      {topPerformers.map((item, idx) => (
                        <div key={item._id} className="flex justify-between items-center bg-muted/40 border border-border p-4 rounded-xl">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary font-bold text-xs rounded-full">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-foreground">
                                {item.employee?.firstName} {item.employee?.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{item.designationName || 'Staff'} - {item.departmentName}</p>
                            </div>
                          </div>
                          <span className="text-primary font-bold bg-primary/10 px-3 py-1 rounded-lg text-sm border border-primary/20">
                            {item.overallScore}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manager Effectiveness */}
                <div className="glass bg-card/40 border border-border rounded-2xl p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-4">
                    <h3 className="text-h2 text-foreground">Manager Effectiveness Index</h3>
                    <UserCheck className="h-5 w-5 text-success" />
                  </div>
                  {managerRankings.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No manager statistics gathered yet.</div>
                  ) : (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                      {managerRankings.map((item, idx) => (
                        <div key={item._id} className="bg-muted/40 border border-border p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold text-foreground">{item.managerName}</p>
                            <span className="text-success font-semibold text-xs bg-success/10 border border-success/20 px-2 py-0.5 rounded">
                              Rank #{idx + 1}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                            <div>
                              Team Score: <strong className="text-foreground">{item.avgPerformanceScore}/100</strong>
                            </div>
                            <div>
                              Goals Completed: <strong className="text-foreground">{item.goalCompletionRate}%</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Filter Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center glass border border-border bg-card/40 rounded-2xl p-4 gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-xl border border-border">
                    <Filter className="h-4 w-4 text-muted-foreground mr-2" />
                    <select
                      value={filterPeriod}
                      onChange={(e) => setFilterPeriod(e.target.value)}
                      className="bg-transparent text-foreground text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="" className="bg-popover text-foreground">All Periods</option>
                      <option value="Q1 2026" className="bg-popover text-foreground">Q1 2026</option>
                      <option value="Q2 2026" className="bg-popover text-foreground">Q2 2026</option>
                      <option value="Q3 2026" className="bg-popover text-foreground">Q3 2026</option>
                      <option value="Q4 2026" className="bg-popover text-foreground">Q4 2026</option>
                    </select>
                  </div>
                  <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-xl border border-border">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="bg-transparent text-foreground text-sm focus:outline-none cursor-pointer"
                    >
                      <option value="" className="bg-popover text-foreground">All Types</option>
                      <option value="MONTHLY" className="bg-popover text-foreground">Monthly</option>
                      <option value="QUARTERLY" className="bg-popover text-foreground">Quarterly</option>
                      <option value="ANNUAL" className="bg-popover text-foreground">Annual</option>
                    </select>
                  </div>
                  {!isEmployee && (
                    <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-xl border border-border">
                      <select
                        value={filterDept}
                        onChange={(e) => setFilterDept(e.target.value)}
                        className="bg-transparent text-foreground text-sm focus:outline-none cursor-pointer"
                      >
                        <option value="" className="bg-popover text-foreground">All Departments</option>
                        {departments.map(d => (
                          <option key={d._id} value={d._id} className="bg-popover text-foreground">{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {isAdminOrManager && (
                  <button
                    onClick={() => { setSelectedReview(null); resetReviewForm(); setShowReviewModal(true); }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/95 font-semibold text-sm text-primary-foreground px-4 py-2 rounded-xl transition cursor-pointer shadow-lg shadow-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                    Create Review
                  </button>
                )}
              </div>

              {/* Self vs Manager Comparison Section */}
              <div className="glass border border-border bg-card/40 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-h2 text-foreground font-sans">Self vs Manager Evaluation Gaps</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Compare self-ratings side-by-side with supervisor scores.</p>
                  </div>
                  {!isEmployee && (
                    <div className="w-full md:w-64">
                      <select
                        value={comparisonEmployeeId}
                        onChange={(e) => setComparisonEmployeeId(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none cursor-pointer"
                      >
                        <option value="" className="bg-popover text-foreground">Compare employee ratings...</option>
                        {employees.map(e => (
                          <option key={e._id} value={e._id} className="bg-popover text-foreground">{e.firstName} {e.lastName} ({e.employeeCode})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {isEmployee && !comparisonEmployeeId && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (reviews.length > 0) {
                          const empId = reviews[0].employeeId?._id || reviews[0].employeeId;
                          if (empId) setComparisonEmployeeId(empId);
                        }
                      }}
                      className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Load My Comparison Report
                    </button>
                  </div>
                )}

                {comparisonEmployeeId && (
                  <>
                    {comparisonData.length === 0 ? (
                      <div className="text-center text-muted-foreground py-6 text-sm">
                        No paired evaluations (Self & Manager) matching Q1/Q2 periods found for this employee.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={comparisonData.map(c => ({
                              period: c.reviewPeriod,
                              Self: c.self?.overallScore || 0,
                              Manager: c.manager?.overallScore || 0
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="period" stroke="var(--muted-foreground)" />
                              <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                              <Legend />
                              <Bar dataKey="Self" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Manager" fill="var(--success)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="bg-muted/30 p-4 border border-border rounded-xl space-y-3">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Evaluation Discrepancies</h4>
                          <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                            {comparisonData.map((c, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs border-b border-border/40 pb-2 last:border-0">
                                <div>
                                  <p className="font-semibold text-foreground">{c.reviewPeriod}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    Self: {c.self?.overallScore || 0}% &bull; Mgr: {c.manager?.overallScore || 0}%
                                  </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  c.gap > 5 
                                    ? 'bg-success/10 text-success border-success/20'
                                    : c.gap < -5
                                    ? 'bg-destructive/10 text-destructive border-destructive/20'
                                    : 'bg-muted border-border text-muted-foreground'
                                }`}>
                                  Gap: {c.gap > 0 ? `+${c.gap}` : c.gap}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Review Table */}
              <div className="glass border border-border bg-card/40 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-muted/65 border-b border-border text-muted-foreground text-small-label">
                        <th className="p-4">Employee</th>
                        <th className="p-4">Review Type</th>
                        <th className="p-4">Period</th>
                        <th className="p-4">Reviewer</th>
                        <th className="p-4 text-center">Score</th>
                        <th className="p-4">Status</th>
                        {isAdminOrManager && <th className="p-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {reviews.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground">No performance reviews match the filters.</td>
                        </tr>
                      ) : (
                        reviews.map((rev) => (
                          <tr key={rev._id} className="hover:bg-muted/20 transition-colors text-grid text-foreground">
                            <td className="p-4">
                              <p className="font-semibold text-foreground">
                                {rev.employeeId?.firstName} {rev.employeeId?.lastName}
                              </p>
                              <p className="text-small-label text-muted-foreground">{rev.employeeId?.employeeCode}</p>
                            </td>
                            <td className="p-4">{rev.reviewType}</td>
                            <td className="p-4">{rev.reviewPeriod}</td>
                            <td className="p-4">
                              {rev.reviewerId?.firstName} {rev.reviewerId?.lastName}
                            </td>
                            <td className="p-4 text-center font-bold text-primary">{rev.overallScore}%</td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-small-label border ${
                                rev.status === 'SUBMITTED'
                                  ? 'bg-success/10 text-success border-success/20'
                                  : 'bg-muted text-muted-foreground border-border'
                              }`}>
                                {rev.status}
                              </span>
                            </td>
                            {isAdminOrManager && (
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedReview(rev);
                                    setReviewForm({
                                      employeeId: rev.employeeId?._id || '',
                                      reviewPeriod: rev.reviewPeriod,
                                      reviewType: rev.reviewType,
                                      overallScore: rev.overallScore,
                                      communicationScore: rev.communicationScore,
                                      technicalScore: rev.technicalScore,
                                      leadershipScore: rev.leadershipScore,
                                      productivityScore: rev.productivityScore,
                                      teamworkScore: rev.teamworkScore,
                                      comments: rev.comments,
                                      strengths: rev.strengths,
                                      weaknesses: rev.weaknesses,
                                      status: rev.status
                                    });
                                    setShowReviewModal(true);
                                  }}
                                  className="p-1.5 hover:bg-muted rounded transition text-primary inline-flex cursor-pointer"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(rev._id)}
                                  className="p-1.5 hover:bg-muted rounded transition text-destructive inline-flex cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {reviewTotal > 10 && (
                  <div className="flex justify-between items-center p-4 border-t border-border bg-muted/20">
                    <button
                      disabled={reviewPage === 1}
                      onClick={() => setReviewPage(p => p - 1)}
                      className="px-3 py-1 bg-muted hover:bg-muted/80 border border-border text-xs rounded transition disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-muted-foreground">
                      Page {reviewPage} of {Math.ceil(reviewTotal / 10)}
                    </span>
                    <button
                      disabled={reviewPage * 10 >= reviewTotal}
                      onClick={() => setReviewPage(p => p + 1)}
                      className="px-3 py-1 bg-muted hover:bg-muted/80 border border-border text-xs rounded transition disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. GOALS TAB */}
          {activeTab === 'goals' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Header and filters */}
              <div className="flex justify-between items-center">
                <h3 className="text-h2 text-foreground">Kanban Milestone Roadmap</h3>
                {isAdminOrManager && (
                  <button
                    onClick={() => { resetGoalForm(); setShowGoalModal(true); }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/95 font-semibold text-sm text-primary-foreground px-4 py-2 rounded-xl transition cursor-pointer shadow-lg shadow-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                    Assign Goal
                  </button>
                )}
              </div>

              {/* Kanban Layout */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map((stage) => {
                  const stageGoals = goals.filter(g => g.status === stage);
                  return (
                    <div key={stage} className="glass border border-border bg-card/30 rounded-2xl p-4 space-y-4">
                      <div className="flex justify-between items-center border-b border-border/60 pb-2">
                        <span className="font-bold text-sm tracking-wider uppercase text-muted-foreground">
                          {stage.replace('_', ' ')}
                        </span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">
                          {stageGoals.length}
                        </span>
                      </div>

                      <div className="space-y-3 min-h-[300px]">
                        {stageGoals.map((goal) => (
                          <div
                            key={goal._id}
                            className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-primary/40 transition-all shadow-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold ${PRIORITY_COLORS[goal.priority]}`}>
                                  {goal.priority}
                                </span>
                                <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded border border-border">
                                  w: {goal.weightage || 100}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(goal.targetDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-sm leading-tight">{goal.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{goal.description || 'No description provided'}</p>
                              {!isEmployee && (
                                <p className="text-[10px] text-primary mt-2 font-medium">
                                  {goal.employeeId?.firstName} {goal.employeeId?.lastName}
                                </p>
                              )}
                            </div>

                            {/* Goal Progress Slider */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                <span>Progress</span>
                                <span>{goal.progressPercentage}%</span>
                              </div>
                              <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-primary h-full transition-all"
                                  style={{ width: `${goal.progressPercentage}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Kanban Drag / Status controls */}
                            {!isRecruiter && (
                              <div className="flex justify-between items-center pt-2 border-t border-border/60 text-[10px] gap-2">
                                <select
                                  value={goal.status}
                                  onChange={(e) => handleUpdateGoalStatus(goal._id, e.target.value, goal.progressPercentage)}
                                  className="bg-muted/50 text-foreground rounded px-2 py-1 border border-border focus:outline-none flex-1 text-center cursor-pointer"
                                >
                                  <option value="NOT_STARTED" className="bg-popover text-foreground">Not Started</option>
                                  <option value="IN_PROGRESS" className="bg-popover text-foreground">In Progress</option>
                                  <option value="COMPLETED" className="bg-popover text-foreground">Completed</option>
                                  <option value="OVERDUE" className="bg-popover text-foreground">Overdue</option>
                                </select>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={goal.progressPercentage}
                                  onChange={(e) => handleUpdateGoalStatus(goal._id, goal.status, Number(e.target.value))}
                                  className="w-12 bg-muted/50 text-foreground rounded px-1 py-1 border border-border text-center focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. SKILLS TAB */}
          {activeTab === 'skills' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h3 className="text-h2 text-foreground">Competency Heatmaps & Gap Analysis</h3>
                {isAdminOrManager && (
                  <button
                    onClick={() => { setShowSkillModal(true); }}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/95 font-semibold text-sm text-primary-foreground px-4 py-2 rounded-xl transition cursor-pointer shadow-lg shadow-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                    Assess Skill
                  </button>
                )}
              </div>

              {/* Skills list cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {skills.length === 0 ? (
                  <div className="col-span-full glass border border-border bg-card/30 p-8 text-center text-muted-foreground rounded-2xl">
                    No skill competency maps defined yet.
                  </div>
                ) : (
                  skills.map((item) => (
                    <div
                      key={item._id}
                      className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-lg hover:border-primary/20 transition-all"
                    >
                      <div className="flex justify-between items-start border-b border-border/60 pb-3">
                        <div>
                          <h4 className="font-extrabold text-foreground">{item.skillName}</h4>
                          {!isEmployee && (
                            <p className="text-xs text-primary mt-0.5">
                              {item.employeeId?.firstName} {item.employeeId?.lastName}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${
                          item.gapScore === 0
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-warning/10 text-warning border-warning/20'
                        }`}>
                          {item.gapScore === 0 ? 'Optimal' : `Gap Score: ${item.gapScore}`}
                        </span>
                      </div>

                      {/* Score comparison visual */}
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Current Proficiency Level</span>
                            <span className="font-bold text-foreground">{item.currentLevel}/10</span>
                          </div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${item.currentLevel * 10}%` }}></div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Required Level for Designation</span>
                            <span className="font-bold text-accent">{item.desiredLevel}/10</span>
                          </div>
                          <div className="w-full bg-muted h-2 rounded-full overflow-hidden border border-border">
                            <div className="bg-accent h-full rounded-full" style={{ width: `${item.desiredLevel * 10}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t border-border/60">
                        <span>Assessed by {item.assessedBy?.firstName || 'HR'}</span>
                        <button
                          onClick={() => handleFetchInsights(item.employeeId?._id || item.employeeId)}
                          className="flex items-center gap-1 text-primary hover:text-primary/80 font-semibold cursor-pointer"
                        >
                          <Brain className="h-3.5 w-3.5" />
                          AI Gap Roadmap
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* AI Insights Modal/Panel */}
              {selectedSkillInsight && (
                <div className="glass bg-card border border-primary/20 rounded-2xl p-6 relative overflow-hidden animate-fadeIn shadow-2xl glow-primary/5">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Brain className="h-32 w-32 text-primary" />
                  </div>
                  <div className="flex justify-between items-center border-b border-border/60 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary animate-pulse" />
                      <h4 className="font-bold text-foreground">AI Skill Coach Growth Roadmap</h4>
                    </div>
                    <button
                      onClick={() => setSelectedSkillInsight(null)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Close Roadmap
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedSkillInsight}
                  </div>
                </div>
              )}

              {/* AI Structured Learning Plan Card Section */}
              {learningPlan && learningPlan.courses && (
                <div className="glass bg-card border border-success/20 rounded-2xl p-6 space-y-4 animate-fadeIn shadow-2xl">
                  <div className="flex justify-between items-center border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-success" />
                      <h4 className="font-bold text-foreground">AI Growth Pathway (Learning Plan)</h4>
                    </div>
                    <button
                      onClick={() => setLearningPlan(null)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Close Learning Plan
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {learningPlan.courses.map((course: any, idx: number) => (
                      <div key={idx} className="bg-muted/30 border border-border p-4 rounded-xl space-y-3 relative hover:border-success/20 transition-all">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-foreground text-sm">{course.courseName}</h5>
                          <span className="bg-success/10 text-success border border-success/20 text-[10px] font-bold px-2 py-0.5 rounded">
                            {course.duration}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Topics covered:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {course.topics?.map((topic: string, tIdx: number) => (
                              <span key={tIdx} className="text-[10px] bg-card border border-border px-2 py-0.5 rounded text-foreground">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. PROMOTION READINESS TAB */}
          {activeTab === 'promotions' && !isEmployee && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center">
                <h3 className="text-h2 text-foreground">AI Promotion Eligible Candidates</h3>
                <div className="text-xs text-muted-foreground flex items-center glass bg-card/40 border border-border px-3 py-1.5 rounded-xl">
                  <Brain className="h-3.5 w-3.5 text-primary mr-2" />
                  Calculates tenure, review scores, and goals completion.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {promotionCandidates.length === 0 ? (
                  <div className="col-span-full glass border border-border bg-card/30 p-8 text-center text-muted-foreground rounded-2xl">
                    No active promotion assessment reviews found. Trigger candidate scoring from the list.
                  </div>
                ) : (
                  promotionCandidates.map((promo) => (
                    <div
                      key={promo._id}
                      className="bg-card border border-border rounded-2xl p-6 space-y-4 hover:border-primary/20 transition-all shadow-xl"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border/60 pb-4 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-extrabold text-lg">
                            {promo.employee?.firstName?.[0]}
                            {promo.employee?.lastName?.[0]}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-foreground text-lg">
                              {promo.employee?.firstName} {promo.employee?.lastName}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              Code: {promo.employee?.employeeCode} &bull; {promo.departmentName} &bull; {promo.designationName || 'Staff'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground font-semibold">Promotion Readiness Score</p>
                            <span className={`text-2xl font-black ${
                              promo.readinessScore >= 90
                                ? 'text-success'
                                : promo.readinessScore >= 75
                                ? 'text-warning'
                                : 'text-muted-foreground'
                            }`}>
                              {promo.readinessScore}%
                            </span>
                          </div>

                          {!isRecruiter && (
                            <button
                              disabled={promoLoading === promo.employee?._id}
                              onClick={() => handleTriggerPromotionEvaluation(promo.employee?._id)}
                              className="px-4 py-2 bg-muted hover:bg-muted/80 text-xs font-semibold rounded-xl border border-border text-primary hover:text-primary/90 transition flex items-center gap-1.5 cursor-pointer"
                            >
                              {promoLoading === promo.employee?._id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Brain className="h-3.5 w-3.5" />
                              )}
                              Re-Score Candidate
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Content breakdown */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="bg-muted/30 p-4 border border-border rounded-xl space-y-2">
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Candidate Strengths</h5>
                          <ul className="space-y-1.5 text-xs text-foreground">
                            {promo.strengths?.map((s: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                                <span>{s}</span>
                              </li>
                            ))}
                            {(!promo.strengths || promo.strengths.length === 0) && (
                              <li className="text-muted-foreground">No strengths logged.</li>
                            )}
                          </ul>
                        </div>

                        <div className="bg-muted/30 p-4 border border-border rounded-xl space-y-2">
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Missing Skill Gaps</h5>
                          <ul className="space-y-1.5 text-xs text-foreground">
                            {promo.skillGaps?.map((g: string, idx: number) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />
                                <span>{g}</span>
                              </li>
                            ))}
                            {(!promo.skillGaps || promo.skillGaps.length === 0) && (
                              <li className="text-muted-foreground">All required designation skills mastered.</li>
                            )}
                          </ul>
                        </div>

                        <div className="bg-muted/30 p-4 border border-border rounded-xl space-y-2">
                          <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recommended Career Tier</h5>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-primary">{promo.recommendedLevel}</p>
                            <p className="text-[11px] text-muted-foreground">Calculated on tenure milestones & peer feedback.</p>
                          </div>
                        </div>
                      </div>

                      {/* AI Summary roadmap */}
                      <div className="bg-primary/5 p-4 border border-primary/10 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Brain className="h-4 w-4 text-primary" />
                          <h5 className="text-xs font-bold text-foreground">AI Growth Roadmap & Timeline Analysis</h5>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{promo.aiSummary}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Succession Planning Section */}
              <div className="glass border border-border bg-card/40 rounded-2xl p-6 space-y-4 mt-6">
                <div className="flex justify-between items-center border-b border-border pb-4">
                  <div>
                    <h3 className="text-h2 text-foreground font-sans">Role Succession Pipelines</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-sans">Critical organizational positions and identified candidate replacements.</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-full font-semibold">
                    {successionPlans.length} Positions Mapped
                  </span>
                </div>

                {successionPlans.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6 text-sm">
                    No succession plan maps generated yet. Use the Copilot tool to initialize one.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {successionPlans.map((plan, idx) => (
                      <div key={idx} className="bg-card border border-border p-5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-start border-b border-border pb-3">
                          <div>
                            <h4 className="font-extrabold text-foreground text-sm">{plan.position}</h4>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Current: {plan.currentEmployee ? `${plan.currentEmployee.firstName} ${plan.currentEmployee.lastName} (${plan.currentEmployee.employeeCode})` : 'Vacant'}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(plan.generatedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Identified Successors:</p>
                          <div className="space-y-3">
                            {plan.successorCandidates?.map((candidate: any, cIdx: number) => (
                              <div key={cIdx} className="bg-muted/30 border border-border p-3 rounded-xl space-y-2">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-foreground">
                                    {candidate.employeeId?.firstName} {candidate.employeeId?.lastName}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    candidate.readinessScore >= 85
                                      ? 'bg-success/10 text-success border-success/20'
                                      : 'bg-warning/10 text-warning border-warning/20'
                                  }`}>
                                    Ready: {candidate.recommendedTimeline} ({candidate.readinessScore}%)
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {candidate.suitabilityReasons?.map((reason: string, rIdx: number) => (
                                    <span key={rIdx} className="text-[9px] bg-card border border-border px-1.5 py-0.5 rounded text-muted-foreground animate-fadeIn">
                                      &bull; {reason}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. ANALYTICS TAB */}
          {activeTab === 'analytics' && !isEmployee && (
            <div className="space-y-6 animate-fadeIn">
              {/* Employee Historic Trend Line */}
              <div className="glass border border-border bg-card/40 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-4">
                  <div>
                    <h3 className="text-h2 text-foreground font-sans">Individual Performance Score Trends</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 font-sans">Track historical rating trajectories and rolling score averages.</p>
                  </div>
                  <div className="w-full md:w-64">
                    <select
                      value={trendEmployeeId}
                      onChange={(e) => setTrendEmployeeId(e.target.value)}
                      className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none cursor-pointer"
                    >
                      <option value="" className="bg-popover text-foreground">Select employee for trend chart...</option>
                      {employees.map(e => (
                        <option key={e._id} value={e._id} className="bg-popover text-foreground">{e.firstName} {e.lastName} ({e.employeeCode})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {trendEmployeeId && trendData && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="bg-muted border border-border px-3 py-1 rounded-xl text-foreground">
                        Rolling Average: <strong className="text-primary">{trendData.rollingAverage}%</strong>
                      </span>
                      <span className={`px-3 py-1 rounded-xl font-bold border ${
                        trendData.trendDirection === 'UPWARD'
                          ? 'bg-success/10 text-success border-success/20'
                          : trendData.trendDirection === 'DOWNWARD'
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}>
                        Trend: {trendData.trendDirection}
                      </span>
                    </div>

                    {trendData.scores?.length === 0 ? (
                      <div className="text-center text-muted-foreground py-6 text-sm">
                        No performance history submitted for this employee.
                      </div>
                    ) : (
                      <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData.scores.map((score: number, idx: number) => ({
                            period: trendData.periods[idx] || `Period ${idx+1}`,
                            Score: score
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="period" stroke="var(--muted-foreground)" />
                            <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" />
                            <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="Score" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score distributions */}
                <div className="glass border border-border bg-card/40 rounded-2xl p-6 space-y-4">
                  <h4 className="font-extrabold text-foreground">Performance Distribution</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.performanceDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                        <YAxis stroke="var(--muted-foreground)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                        <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Goals Status */}
                <div className="glass border border-border bg-card/40 rounded-2xl p-6 space-y-4">
                  <h4 className="font-extrabold text-foreground">Milestone Goal Completion Trends</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.goals}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {chartData.goals.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Skill gaps average */}
                <div className="glass border border-border bg-card/40 rounded-2xl p-6 space-y-4 lg:col-span-2">
                  <h4 className="font-extrabold text-foreground">Competency Skill Deficiency Levels</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.skills}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                        <YAxis stroke="var(--muted-foreground)" />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
                        <Legend />
                        <Bar dataKey="gap" name="Average Gap Score" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="count" name="Employee Count" fill="var(--success)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass bg-card border border-border rounded-2xl p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl glow-primary/5">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-xl font-bold text-foreground">
                {selectedReview ? 'Update Performance Review' : 'Create Performance Review'}
              </h3>
              <button onClick={() => { setShowReviewModal(false); setSelectedReview(null); }} className="text-muted-foreground hover:text-foreground cursor-pointer text-xl">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Select Employee</label>
                  <select
                    disabled={!!selectedReview}
                    value={reviewForm.employeeId}
                    onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })}
                    required
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-muted/80"
                  >
                    <option value="" className="bg-popover text-foreground">Choose employee...</option>
                    {employees.map(e => (
                      <option key={e._id} value={e._id} className="bg-popover text-foreground">{e.firstName} {e.lastName} ({e.employeeCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Review Period</label>
                  <select
                    value={reviewForm.reviewPeriod}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewPeriod: e.target.value })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-muted/80"
                  >
                    <option value="Q1 2026" className="bg-popover text-foreground">Q1 2026</option>
                    <option value="Q2 2026" className="bg-popover text-foreground">Q2 2026</option>
                    <option value="Q3 2026" className="bg-popover text-foreground">Q3 2026</option>
                    <option value="Q4 2026" className="bg-popover text-foreground">Q4 2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Review Type</label>
                  <select
                    value={reviewForm.reviewType}
                    onChange={(e) => setReviewForm({ ...reviewForm, reviewType: e.target.value })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-muted/80"
                  >
                    <option value="MONTHLY" className="bg-popover text-foreground">Monthly</option>
                    <option value="QUARTERLY" className="bg-popover text-foreground">Quarterly</option>
                    <option value="ANNUAL" className="bg-popover text-foreground">Annual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Overall Review Rating (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reviewForm.overallScore}
                    onChange={(e) => setReviewForm({ ...reviewForm, overallScore: Number(e.target.value) })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                  />
                </div>
              </div>

              {/* Sub-scores */}
              <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-4">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Sub-Metric Competency Ratings (1-10)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {['technicalScore', 'communicationScore', 'leadershipScore', 'productivityScore', 'teamworkScore'].map((scoreKey) => (
                    <div key={scoreKey}>
                      <label className="block text-[10px] text-muted-foreground font-medium mb-1 capitalize">
                        {scoreKey.replace('Score', '')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={(reviewForm as any)[scoreKey]}
                        onChange={(e) => setReviewForm({ ...reviewForm, [scoreKey]: Number(e.target.value) })}
                        className="w-full bg-muted/50 border border-border rounded-xl px-2 py-1.5 text-xs text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Comments and Tags */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Supervisor Comments</label>
                  <textarea
                    rows={3}
                    value={reviewForm.comments}
                    onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                    required
                    placeholder="Enter professional coaching notes and metrics accomplishments..."
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Key Strengths</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={strengthInput}
                        onChange={(e) => setStrengthInput(e.target.value)}
                        placeholder="e.g. System Design"
                        className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (strengthInput.trim()) {
                            setReviewForm({ ...reviewForm, strengths: [...reviewForm.strengths, strengthInput.trim()] });
                            setStrengthInput('');
                          }
                        }}
                        className="px-3 bg-muted hover:bg-muted/80 border border-border rounded-xl text-xs text-foreground cursor-pointer transition"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2 animate-fadeIn">
                      {reviewForm.strengths.map((s, i) => (
                        <span key={i} className="text-[10px] bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-primary">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Areas for Growth</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={weaknessInput}
                        onChange={(e) => setWeaknessInput(e.target.value)}
                        placeholder="e.g. Public Speaking"
                        className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (weaknessInput.trim()) {
                            setReviewForm({ ...reviewForm, weaknesses: [...reviewForm.weaknesses, weaknessInput.trim()] });
                            setWeaknessInput('');
                          }
                        }}
                        className="px-3 bg-muted hover:bg-muted/80 border border-border rounded-xl text-xs text-foreground cursor-pointer transition"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2 animate-fadeIn">
                      {reviewForm.weaknesses.map((w, i) => (
                        <span key={i} className="text-[10px] bg-warning/10 border border-warning/20 px-2 py-0.5 rounded text-warning">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center border-t border-border/60 pt-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Submission Mode:</label>
                  <select
                    value={reviewForm.status}
                    onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                    className="bg-muted/50 border border-border rounded-xl px-2 py-1 text-xs text-foreground cursor-pointer focus:outline-none"
                  >
                    <option value="DRAFT" className="bg-popover text-foreground">DRAFT</option>
                    <option value="SUBMITTED" className="bg-popover text-foreground">SUBMITTED (Triggers AI coach)</option>
                  </select>
                </div>

                <div className="space-x-3">
                  <button
                    type="button"
                    onClick={() => { setShowReviewModal(false); setSelectedReview(null); }}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border text-xs font-semibold rounded-xl text-muted-foreground cursor-pointer transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary/90 font-semibold text-xs text-primary-foreground rounded-xl cursor-pointer transition shadow-lg shadow-primary/10"
                  >
                    {selectedReview ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl glow-primary/5">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-xl font-bold text-foreground">Assign New Goal</h3>
              <button onClick={() => setShowGoalModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Select Employee</label>
                <select
                  value={goalForm.employeeId}
                  onChange={(e) => setGoalForm({ ...goalForm, employeeId: e.target.value })}
                  required
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-muted/80"
                >
                  <option value="" className="bg-popover text-foreground">Choose employee...</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id} className="bg-popover text-foreground">{e.firstName} {e.lastName} ({e.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="e.g. Master React 19 Core Hooks"
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  placeholder="Enter detailed goals scope..."
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Goal Category</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground cursor-pointer focus:ring-2 focus:ring-primary"
                  >
                    <option value="Technical" className="bg-popover text-foreground">Technical</option>
                    <option value="Operations" className="bg-popover text-foreground">Operations</option>
                    <option value="Leadership" className="bg-popover text-foreground">Leadership</option>
                    <option value="General" className="bg-popover text-foreground">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Priority</label>
                  <select
                    value={goalForm.priority}
                    onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground cursor-pointer focus:ring-2 focus:ring-primary"
                  >
                    <option value="LOW" className="bg-popover text-foreground">Low</option>
                    <option value="MEDIUM" className="bg-popover text-foreground">Medium</option>
                    <option value="HIGH" className="bg-popover text-foreground">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Target End Date</label>
                  <input
                    type="date"
                    required
                    value={goalForm.targetDate}
                    onChange={(e) => setGoalForm({ ...goalForm, targetDate: e.target.value })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Start progress</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={goalForm.progressPercentage}
                    onChange={(e) => setGoalForm({ ...goalForm, progressPercentage: Number(e.target.value) })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Goal Weightage (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={goalForm.weightage}
                    onChange={(e) => setGoalForm({ ...goalForm, weightage: Number(e.target.value) })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border text-xs font-semibold rounded-xl text-muted-foreground cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 font-semibold text-xs text-primary-foreground rounded-xl cursor-pointer transition shadow-lg shadow-primary/10"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SKILL ASSESSMENT MODAL */}
      {showSkillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl glow-primary/5">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <h3 className="text-xl font-bold text-foreground">Assess Skill Competency</h3>
              <button onClick={() => setShowSkillModal(false)} className="text-muted-foreground hover:text-foreground cursor-pointer text-xl">&times;</button>
            </div>

            <form onSubmit={handleAssessSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Select Employee</label>
                <select
                  value={skillForm.employeeId}
                  onChange={(e) => setSkillForm({ ...skillForm, employeeId: e.target.value })}
                  required
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:bg-muted/80"
                >
                  <option value="" className="bg-popover text-foreground">Choose employee...</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id} className="bg-popover text-foreground">{e.firstName} {e.lastName} ({e.employeeCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Skill Name</label>
                <input
                  type="text"
                  required
                  value={skillForm.skillName}
                  onChange={(e) => setSkillForm({ ...skillForm, skillName: e.target.value })}
                  placeholder="e.g. Node.js, System Architecture"
                  className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Current Level (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={skillForm.currentLevel}
                    onChange={(e) => setSkillForm({ ...skillForm, currentLevel: Number(e.target.value) })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Desired Level (1-10)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={skillForm.desiredLevel}
                    onChange={(e) => setSkillForm({ ...skillForm, desiredLevel: Number(e.target.value) })}
                    className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary hover:bg-muted/80"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSkillModal(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 border border-border text-xs font-semibold rounded-xl text-muted-foreground cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary/90 font-semibold text-xs text-primary-foreground rounded-xl cursor-pointer transition shadow-lg shadow-primary/10"
                >
                  Assess
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
