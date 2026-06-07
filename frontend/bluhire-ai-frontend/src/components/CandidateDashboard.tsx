'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, AlertTriangle, Play, RefreshCw, LogOut, CheckCircle2, Award, Star, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Assignment {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    jobCode: string;
    departmentId?: { name: string };
  };
  interviewTemplateId: {
    name: string;
    interviewType: string;
    numQuestions: number;
    timeLimit: number;
    skillsRequired: string[];
  };
  status: string;
  assignedAt: string;
  expiresAt: string;
  maxAttempts: number;
  attemptCount: number;
  showResultsToCandidate?: boolean;
  finalCandidateScore?: number;
  interviewScore?: number;
  rankingPosition?: number;
  rankingReasoning?: string;
}

export default function CandidateDashboard() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('tab') || 'active';

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Results Modal State
  const [selectedResult, setSelectedResult] = useState<Assignment | null>(null);
  const [resultsModalOpen, setResultsModalOpen] = useState(false);

  // Sync initial state and subscribe to changes
  useEffect(() => {
    const storeUser = useAuthStore.getState().user;
    console.log('[CandidateDashboard] Initial mount. Store user:', storeUser);
    setCurrentUser(storeUser);

    const unsubscribe = useAuthStore.subscribe((state) => {
      console.log('[CandidateDashboard] Auth store updated. New user:', state.user);
      setCurrentUser(state.user);
    });

    return () => unsubscribe();
  }, []);

  const fetchAssignments = async (candidateId: string) => {
    console.log('[CandidateDashboard] fetchAssignments triggered. candidateId:', candidateId);
    setLoading(true);
    setError(null);
    try {
      console.log('[CandidateDashboard] Sending API request to fetch assignments...');
      const res = await api.get('/recruitment/interviews/assignments', {
        params: { candidateId }
      });
      console.log('[CandidateDashboard] API request success. Data received:', res.data?.data);
      setAssignments(res.data?.data || []);
    } catch (err: any) {
      console.error('[CandidateDashboard] API request failed:', err);
      setError(err.response?.data?.message || 'Failed to fetch interview assignments. Please check your network connection.');
    } finally {
      setLoading(false);
      console.log('[CandidateDashboard] fetchAssignments completed. Loading state set to false.');
    }
  };

  useEffect(() => {
    const tokenExists = typeof window !== 'undefined' ? !!localStorage.getItem('auth-storage') : false;
    
    if (!currentUser) {
      console.log('[CandidateDashboard] User context is empty. Setting hydration timeout to check auth...');
      const timer = setTimeout(() => {
        const latestUser = useAuthStore.getState().user;
        if (!latestUser) {
          console.warn('[CandidateDashboard] Authentication failed: No user found. Redirecting to login.');
          router.push('/login');
        } else {
          console.log('[CandidateDashboard] User hydrated successfully via timeout check:', latestUser);
          setCurrentUser(latestUser);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }

    // Role safety check
    if (currentUser.role !== 'CANDIDATE') {
      console.warn('[CandidateDashboard] User is not a candidate. Role:', currentUser.role);
      setError('Unauthorized access. Only candidates are allowed to access this portal.');
      setLoading(false);
      return;
    }

    const candidateId = currentUser.id || currentUser._id;
    if (candidateId) {
      fetchAssignments(candidateId);
    } else {
      console.warn('[CandidateDashboard] User is authenticated but contains no ID:', currentUser);
      setError('Invalid user session. Missing candidate ID.');
      setLoading(false);
    }
  }, [currentUser, router]);

  const handleOpenResults = (assignment: Assignment) => {
    setSelectedResult(assignment);
    setResultsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
        <p className="text-xs text-white/45 font-medium">Loading your candidate portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 max-w-md mx-auto p-4 select-none">
        <Card className="bg-red-500/5 border-red-500/20 rounded-[24px] p-8 text-center w-full shadow-2xl">
          <CardHeader className="pb-3 flex flex-col items-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mb-2 animate-bounce" />
            <CardTitle className="text-red-400 text-lg font-bold">Error Loading Portal</CardTitle>
            <CardDescription className="text-white/40 text-xs">
              Something went wrong while loading your candidate profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs text-white/60">
            <p>{error}</p>
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => currentUser && fetchAssignments(currentUser.id || currentUser._id)} 
                className="flex-1 rounded-xl bg-[#8B5CF6] hover:bg-[#A855F7] text-white font-semibold text-xs h-10 border-0 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
              <Button 
                onClick={logout} 
                variant="outline" 
                className="flex-1 rounded-xl border-white/10 bg-white/[0.02] text-white/80 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all text-xs h-10"
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter assignments based on active tab
  const filteredAssignments = assignments.filter((assignment) => {
    const isExpired = new Date(assignment.expiresAt) < new Date();
    const attemptsExceeded = assignment.attemptCount >= assignment.maxAttempts;
    const isCompleted = assignment.status === 'Completed' || assignment.status === 'Reviewed';
    
    if (currentTab === 'history') {
      return isCompleted || isExpired || attemptsExceeded;
    }
    // Default: active
    return !isCompleted && !isExpired && !attemptsExceeded;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 select-none">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Welcome, {currentUser?.firstName}!
            <Badge className="bg-[#8B5CF6]/10 text-[#8B5CF6] hover:bg-[#8B5CF6]/20 border-[#8B5CF6]/30 text-[10px] font-mono px-3 py-0.5 rounded-full">
              CANDIDATE ACCOUNT
            </Badge>
          </h1>
          <p className="text-white/60 text-sm">
            {currentTab === 'active' 
              ? 'Below are your active AI Interview invitations. Review guidelines and complete them before they expire.'
              : 'Review your completed assessments and status history below.'}
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="rounded-xl border-white/10 bg-white/[0.02] text-white/80 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 transition-all text-xs h-9"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" /> Logout
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="bg-white/[0.02] border border-white/10 rounded-[24px] overflow-hidden relative p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#8B5CF6] font-bold text-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.15)] shrink-0">
              {currentUser?.firstName?.charAt(0)}{currentUser?.lastName?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{currentUser?.firstName} {currentUser?.lastName}</h2>
              <p className="text-xs text-white/40 mt-1 font-mono">{currentUser?.employeeId || 'CAND-ID'}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs text-white/60">
            <div className="flex items-center space-x-2">
              <span className="text-white/40">Email:</span>
              <span className="text-white font-medium">{currentUser?.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/40">Phone:</span>
              <span className="text-white font-medium">{currentUser?.phone || 'Not Provided'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/40">Account Portal:</span>
              <span className="text-[#8B5CF6] font-bold uppercase tracking-wider">{currentUser?.role?.replace('_', ' ')}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Active Tab Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white capitalize">
          {currentTab === 'active' ? 'Active Invitations' : 'Interview History'}
        </h2>
        <span className="text-xs text-white/40 font-semibold bg-white/[0.03] px-3 py-1 rounded-full border border-white/5">
          Showing {filteredAssignments.length} interviews
        </span>
      </div>

      {/* Main Content */}
      {filteredAssignments.length === 0 ? (
        <Card className="bg-white/[0.02] border-white/10 border-dashed rounded-[24px] py-16 text-center">
          <CardContent className="space-y-4">
            <div className="w-12 h-12 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-white/40">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">No interviews found</h3>
            <p className="text-sm text-white/40 max-w-sm mx-auto">
              {currentTab === 'active' 
                ? 'You do not have any pending interview invitations at this moment.'
                : 'You have no interview history records associated with your account.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredAssignments.map((assignment) => {
            const template = assignment.interviewTemplateId || {
              name: 'AI Voice Assessment',
              interviewType: 'Mixed',
              numQuestions: 5,
              timeLimit: 15,
              skillsRequired: []
            };
            const job = assignment.jobId || {
              jobCode: 'N/A',
              title: 'Position Under Review',
              departmentId: { name: 'Engineering' }
            };
            const isExpired = new Date(assignment.expiresAt) < new Date();
            const attemptsExceeded = assignment.attemptCount >= assignment.maxAttempts;
            const isCompleted = assignment.status === 'Completed' || assignment.status === 'Reviewed';

            let statusBadge = (
              <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">Pending</Badge>
            );
            if (isCompleted) {
              statusBadge = <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Completed</Badge>;
            } else if (isExpired) {
              statusBadge = <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Expired</Badge>;
            } else if (assignment.status === 'In Progress') {
              statusBadge = <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse">In Progress</Badge>;
            }

            return (
              <Card
                key={assignment._id}
                className={`border-white/10 bg-white/[0.03] rounded-[24px] transition-all duration-300 relative overflow-hidden group ${
                  assignment.status === 'In Progress' && !isExpired ? 'ring-1 ring-[#8B5CF6]/50 shadow-[0_0_20px_rgba(139,92,246,0.1)]' : ''
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#8B5CF6]/0 via-[#8B5CF6]/0 to-[#8B5CF6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-mono text-white/40 tracking-wider">
                      {job.jobCode} • {(job as any).departmentId?.name || 'Department'}
                    </span>
                    {statusBadge}
                  </div>
                  <CardTitle className="text-xl text-white font-bold mt-2">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="text-white/40 text-xs mt-1">
                    {template.interviewType} Interview template: {template.name}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Skill Badges */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Assessed Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {template.skillsRequired.map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-white/[0.02] border-white/10 text-white/70 text-[10px]">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Interview Specs Grid */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/10 text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#8B5CF6]" />
                      <span>{template.timeLimit} Minutes Limit</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
                      <span>{template.numQuestions} AI Questions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-[#8B5CF6]" />
                      <span>Attempts: {assignment.attemptCount} / {assignment.maxAttempts}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#8B5CF6]" />
                      <span>Expires: {new Date(assignment.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* CTA button */}
                  {isCompleted ? (
                    <div className="flex flex-col gap-2">
                      <Button disabled className="w-full rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold text-xs h-10">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Interview Completed
                      </Button>
                      
                      {assignment.showResultsToCandidate && (
                        <Button
                          onClick={() => handleOpenResults(assignment)}
                          variant="outline"
                          className="w-full rounded-xl border-[#8B5CF6]/30 hover:border-[#8B5CF6] bg-transparent text-[#8B5CF6] hover:bg-[#8B5CF6]/5 font-semibold text-xs h-10 transition-all cursor-pointer"
                        >
                          <Star className="w-4 h-4 mr-2" /> View Interview Results
                        </Button>
                      )}
                    </div>
                  ) : isExpired ? (
                    <Button disabled className="w-full rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-semibold text-xs h-10">
                      <AlertTriangle className="w-4 h-4 mr-2" /> Invitation Expired
                    </Button>
                  ) : attemptsExceeded ? (
                    <Button disabled className="w-full rounded-xl bg-white/[0.04] text-white/30 border border-white/10 font-semibold text-xs h-10">
                      Attempt Limit Exceeded
                    </Button>
                  ) : (
                    <Button
                      onClick={() => router.push(`/dashboard/interview/${assignment._id}`)}
                      className="w-full rounded-xl bg-[#8B5CF6] hover:bg-[#A855F7] text-white font-semibold text-xs h-10 shadow-lg shadow-[#8B5CF6]/10 cursor-pointer border-0"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {assignment.status === 'In Progress' ? 'Resume Interview' : 'Start Interview'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Guidelines Section */}
      <Card className="bg-white/[0.02] border-white/10 border rounded-[24px] p-6 shadow-lg">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-lg text-white font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8B5CF6]" /> Candidate Code of Conduct & Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 text-white/60 text-xs space-y-3 leading-relaxed">
          <p>
            1. <strong>Integrity Monitoring:</strong> This is a secure, monitored voice assessment. Fullscreen mode is required. Tab-switching, exiting fullscreen, or connection cuts will be flagged as suspicious behavior.
          </p>
          <p>
            2. <strong>Audio Verification:</strong> Ensure your microphone is fully functional. Record in a quiet environment. Speak clearly and directly into the microphone.
          </p>
          <p>
            3. <strong>Auto-Save Progress:</strong> If you lose network connection, the system auto-saves your current question. You can resume from the dashboard within your expiration limit.
          </p>
        </CardContent>
      </Card>

      {/* RESULTS DETAILED MODAL */}
      <Dialog open={resultsModalOpen} onOpenChange={setResultsModalOpen}>
        <DialogContent className="bg-[#0b0b0c] border border-white/10 rounded-[28px] max-w-md text-white select-none">
          {selectedResult && (
            <>
              <DialogHeader>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 animate-pulse" />
                </div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                  Interview Evaluation Feedback
                </DialogTitle>
                <DialogDescription className="text-xs text-white/40">
                  AI-compiled scores released by the recruitment team for {selectedResult.jobId?.title || 'Position'}.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-3 text-xs">
                {/* Score Section */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center space-y-1.5">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Final AI Screening Score</span>
                  <h3 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#8B5CF6]">
                    {selectedResult.finalCandidateScore || selectedResult.interviewScore || 0}%
                  </h3>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] uppercase font-mono tracking-wider">
                    {(selectedResult.finalCandidateScore || selectedResult.interviewScore || 0) >= 75 
                      ? 'Strong Assessment' 
                      : (selectedResult.finalCandidateScore || selectedResult.interviewScore || 0) >= 60 
                      ? 'Good Competency' 
                      : 'Under Recruiter Review'}
                  </Badge>
                </div>

                {/* Details list */}
                <div className="space-y-3 bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                  <div>
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">Assessed Skills</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedResult.interviewTemplateId?.skillsRequired?.map((s, idx) => (
                        <Badge key={idx} variant="outline" className="text-[9px] bg-white/[0.02] border-white/10 text-white/80">
                          {s}
                        </Badge>
                      )) || <span className="text-white/60 font-medium italic">Standard Job Competencies</span>}
                    </div>
                  </div>

                  {selectedResult.rankingPosition && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Overall Leaderboard Rank</span>
                      <span className="text-xs font-bold font-mono text-[#8B5CF6]">Rank #{selectedResult.rankingPosition}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1">Evaluation & Feedback</span>
                    <p className="text-white/75 leading-relaxed font-sans text-justify mt-1">
                      {selectedResult.rankingReasoning || 'Your voice assessment answers have been evaluated successfully. The hiring team is currently calibrating profiles and will reach out if your application moves to the next recruitment stage.'}
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => setResultsModalOpen(false)}
                  className="w-full rounded-xl bg-[#8B5CF6] hover:bg-[#A855F7] text-white border-0 font-semibold text-xs h-10 mt-2"
                >
                  Close Results
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
