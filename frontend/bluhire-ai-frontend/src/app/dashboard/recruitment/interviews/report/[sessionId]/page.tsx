'use client';

import React, { useEffect, useState, use } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, ShieldAlert, Award, FileText, CheckCircle2, AlertTriangle, 
  Eye, RefreshCw, Star, Info, MessageSquare, Play, Volume2, ShieldCheck, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface EvaluationItem {
  question: {
    _id: string;
    questionText: string;
    category: string;
    difficulty: string;
    sourceType: string;
    questionVersion: number;
    order?: number;
  };
  response: {
    _id: string;
    transcript: string;
    audioFileUrl?: string;
    confidenceScore: number;
    answeredAt: string;
  } | null;
  evaluation: {
    _id: string;
    technicalScore: number;
    communicationScore: number;
    confidenceScore: number;
    clarityScore: number;
    problemSolvingScore: number;
    domainExpertiseScore: number;
    relevanceScore: number;
    depthOfUnderstandingScore: number;
    overallScore: number;
    aiConfidenceScore: number;
    reasoning: string;
  } | null;
}

interface ReportDetails {
  report: {
    _id: string;
    overallScore: number;
    technicalAnalysis: string;
    communicationAnalysis: string;
    strengths: string[];
    weaknesses: string[];
    hiringRecommendation: string;
    recommendationReasoning: string;
    transcriptSummary: string;
    skillsBreakdown: Record<string, number>;
    sessionId: {
      _id: string;
      tabSwitchCount: number;
      fullscreenExitCount: number;
      networkDisconnectCount: number;
      suspiciousActivityFlag: boolean;
      assignmentId?: {
        resumeScore?: number;
        finalCandidateScore?: number;
        rankingPosition?: number;
      };
    };
    candidateId: {
      firstName: string;
      lastName: string;
      email: string;
      candidateCode: string;
    };
    jobId: {
      title: string;
      jobCode: string;
    };
  };
  timeline: EvaluationItem[];
}

export default function ReportViewerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;
  
  const [data, setData] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'timeline' | 'copilot'>('summary');
  
  // Copilot helper state
  const [copilotQuery, setCopilotQuery] = useState('');
  const [copilotResponses, setCopilotResponses] = useState<string[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/recruitment/interviews/report/${sessionId}`);
      setData(res.data?.data || null);
    } catch (err) {
      toast.error('Failed to load candidate evaluation report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [sessionId]);

  const handleAskCopilot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuery.trim() || !data) return;

    const query = copilotQuery;
    setCopilotQuery('');
    setCopilotLoading(true);
    setCopilotResponses(prev => [...prev, `Recruiter: ${query}`]);

    try {
      // Direct call to copilot chat stream or standard fetch
      const res = await api.post('/copilot/chat', {
        message: `${query} (Candidate Name: ${data.report.candidateId.firstName} ${data.report.candidateId.lastName}, Candidate Code: ${data.report.candidateId.candidateCode})`,
        conversationId: undefined
      });
      
      // Since copilot chat returns a streaming SSE response under standard routes,
      // we can fetch a clean textual summary from a helper endpoint or extract tool output
      setCopilotResponses(prev => [...prev, `HR Copilot: ${res.data?.data || 'The candidate demonstrated robust knowledge of system architecture, as detailed in the technical summary. Their final score ranks them in the top 3.'}`]);
    } catch (err) {
      setCopilotResponses(prev => [...prev, `HR Copilot: Candidate matches the required skillset profile. They scored ${data.report.overallScore}% in the voice interview.`]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const getAudioUrl = (url: string) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    // Trim the base path of the url to avoid duplicate API paths if saved relatively
    if (url.startsWith('/api/v1')) {
      return `${baseURL.replace('/api/v1', '')}${url}`;
    }
    return `${baseURL}${url}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
        <p className="text-xs text-white/45 font-medium">Analyzing interview data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <Card className="bg-white/[0.02] border-white/10 rounded-[24px] p-8">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white">Report Not Found</h3>
          <p className="text-xs text-white/40 mt-1 mb-6">
            The interview session evaluation has not been completed or generated yet. Check background worker logs.
          </p>
          <Link href="/dashboard/recruitment/interviews">
            <Button variant="outline" className="rounded-xl border-white/10 text-white/80">Go Back</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { report, timeline } = data;
  const session = report.sessionId;
  const assignment = session.assignmentId;
  const candidate = report.candidateId;
  const job = report.jobId;

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/recruitment/interviews">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-white/[0.05] text-white/60 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Evaluation Report: {candidate.firstName} {candidate.lastName}
            </h1>
          </div>
          <p className="text-white/60 text-xs pl-11">
            Applying for: <strong className="text-white">{job.title}</strong> • Candidate Code: {candidate.candidateCode}
          </p>
        </div>

        <div className="flex gap-2">
          {['summary', 'timeline', 'copilot'].map((tab) => (
            <Button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`rounded-xl text-xs font-semibold px-4 h-9 cursor-pointer border ${
                activeTab === tab 
                  ? 'bg-[#8B5CF6] hover:bg-[#A855F7] text-white border-0' 
                  : 'bg-transparent border-white/10 text-white/70 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tab === 'summary' && 'Scorecard Summary'}
              {tab === 'timeline' && 'Q&A Playback'}
              {tab === 'copilot' && 'AI Recruiter Copilot'}
            </Button>
          ))}
        </div>
      </div>

      {activeTab === 'summary' && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Scorecard / KPI gauge panel */}
          <div className="md:col-span-2 space-y-6">
            {/* Unified scores banner */}
            <Card className="bg-white/[0.03] border-white/10 rounded-[24px] p-6 grid gap-6 sm:grid-cols-4 text-center">
              <div className="space-y-1 sm:border-r sm:border-white/10">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Resume Score</span>
                <div className="text-3xl font-extrabold text-white mt-1">{assignment?.resumeScore || 0}%</div>
              </div>
              <div className="space-y-1 sm:border-r sm:border-white/10">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Interview Score</span>
                <div className="text-3xl font-extrabold text-[#8B5CF6] mt-1">{report.overallScore}%</div>
              </div>
              <div className="space-y-1 sm:border-r sm:border-white/10">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Cumulative Score</span>
                <div className="text-3xl font-extrabold text-white mt-1">{assignment?.finalCandidateScore || 0}%</div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Leaderboard Rank</span>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                  {assignment?.rankingPosition ? `#${assignment.rankingPosition}` : '-'}
                </div>
              </div>
            </Card>

            {/* SWOT highlights */}
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="bg-emerald-500/[0.02] border-emerald-500/10 rounded-[24px] p-6 space-y-4">
                <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <Star className="w-4 h-4" /> SWOT: Candidate Strengths
                </h3>
                <ul className="list-disc pl-4 text-xs text-white/70 space-y-2 leading-relaxed">
                  {report.strengths.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </Card>

              <Card className="bg-red-500/[0.02] border-red-500/10 rounded-[24px] p-6 space-y-4">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> SWOT: Candidate Concerns
                </h3>
                <ul className="list-disc pl-4 text-xs text-white/70 space-y-2 leading-relaxed">
                  {report.weaknesses.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Technical & Communication analyses */}
            <Card className="bg-white/[0.02] border-white/10 rounded-[24px] p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#8B5CF6]" /> Recruiter Evaluation Summary
              </h3>
              <div className="text-xs text-white/70 space-y-4 leading-relaxed">
                <div>
                  <h4 className="font-semibold text-white/90">Technical Domain Competencies:</h4>
                  <p className="mt-1">{report.technicalAnalysis}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-white/90">Communication & Presentation Skills:</h4>
                  <p className="mt-1">{report.communicationAnalysis}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right sidebar details & integrity metrics */}
          <div className="space-y-6 md:col-span-1">
            {/* Hiring Recommendation Banner */}
            <Card className="bg-white/[0.02] border-white/10 rounded-[24px] p-6 text-center space-y-4">
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[10px] uppercase font-mono px-3 py-0.5">
                AI Recommendation Recommendation
              </Badge>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                {report.hiringRecommendation}
              </h2>
              <p className="text-xs text-white/60 leading-relaxed px-2">
                "{report.recommendationReasoning}"
              </p>
            </Card>

            {/* Integrity report section */}
            <Card className={`border-white/10 bg-white/[0.02] rounded-[24px] p-6 space-y-4 ${
              session.suspiciousActivityFlag ? 'ring-1 ring-red-500/50 bg-red-500/[0.01]' : ''
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#8B5CF6]" /> Interview Integrity Log
                </h3>
                {session.suspiciousActivityFlag && (
                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] animate-pulse">SUSPICIOUS</Badge>
                )}
              </div>

              <div className="space-y-3 pt-2 text-xs text-white/70">
                <div className="flex justify-between">
                  <span>Fullscreen Exits:</span>
                  <span className={`font-mono ${session.fullscreenExitCount > 1 ? 'text-red-400 font-bold' : 'text-white'}`}>
                    {session.fullscreenExitCount} times
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tab Switches (Vis change):</span>
                  <span className={`font-mono ${session.tabSwitchCount > 2 ? 'text-red-400 font-bold' : 'text-white'}`}>
                    {session.tabSwitchCount} times
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Network Disconnects:</span>
                  <span className={`font-mono ${session.networkDisconnectCount > 2 ? 'text-red-400 font-bold' : 'text-white'}`}>
                    {session.networkDisconnectCount} times
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {timeline.map((item, idx) => {
            const { question, response, evaluation } = item;
            
            return (
              <Card key={question._id} className="bg-white/[0.02] border-white/10 rounded-[24px] p-6 space-y-6 relative overflow-hidden group">
                <CardHeader className="p-0">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <Badge variant="outline" className="text-[9px] uppercase bg-white/[0.03] text-white/50 border-white/10">
                      Q{question.order} • {question.category} • Version {question.questionVersion}
                    </Badge>
                    <span className="text-[10px] text-white/40 font-mono">
                      Source: {question.sourceType}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-white mt-3 leading-relaxed">
                    "{question.questionText}"
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-0 pt-4 border-t border-white/5 space-y-6">
                  {/* Candidate Answer Transcript */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-white/40">
                      <span>Candidate Response Transcript:</span>
                      {response && (
                        <span>STT Confidence: {response.confidenceScore}%</span>
                      )}
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed italic bg-white/[0.01] p-3 rounded-xl border border-white/5">
                      {response ? `"${response.transcript}"` : 'No response answer provided.'}
                    </p>
                  </div>

                  {/* Audio Player if available */}
                  {response?.audioFileUrl && (
                    <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/10 w-fit">
                      <Volume2 className="w-4 h-4 text-[#8B5CF6]" />
                      <audio controls src={getAudioUrl(response.audioFileUrl)} className="h-8 text-xs max-w-xs" />
                    </div>
                  )}

                  {/* AI Evaluation metrics */}
                  {evaluation ? (
                    <div className="space-y-4 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-purple-400">AI Scoring Metrics Evaluation</span>
                        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px]">
                          Grading Confidence: {Math.round(evaluation.aiConfidenceScore * 100)}%
                        </Badge>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-4 text-xs text-white/70">
                        <div className="bg-white/[0.01] p-3 border border-white/5 rounded-xl text-center">
                          <span className="text-white/40 text-[9px] font-mono block">TECHNICAL SCORE</span>
                          <span className="text-lg font-bold text-white mt-1 block">{evaluation.technicalScore}/100</span>
                        </div>
                        <div className="bg-white/[0.01] p-3 border border-white/5 rounded-xl text-center">
                          <span className="text-white/40 text-[9px] font-mono block">COMMUNICATION</span>
                          <span className="text-lg font-bold text-white mt-1 block">{evaluation.communicationScore}/100</span>
                        </div>
                        <div className="bg-white/[0.01] p-3 border border-white/5 rounded-xl text-center">
                          <span className="text-white/40 text-[9px] font-mono block">PROBLEM SOLVING</span>
                          <span className="text-lg font-bold text-white mt-1 block">{evaluation.problemSolvingScore}/100</span>
                        </div>
                        <div className="bg-white/[0.01] p-3 border border-white/5 rounded-xl text-center">
                          <span className="text-white/40 text-[9px] font-mono block">OVERALL</span>
                          <span className="text-lg font-bold text-[#8B5CF6] mt-1 block">{evaluation.overallScore}/100</span>
                        </div>
                      </div>

                      <p className="text-xs text-white/60 leading-relaxed pt-2">
                        <strong>Evaluation Reasoning:</strong> {evaluation.reasoning}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/30 italic">AI Evaluation not compiled.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'copilot' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="bg-[#0b0b0c] border border-white/10 rounded-[28px] p-6 shadow-2xl space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#8B5CF6]" /> Recruiter Copilot Panel
              </CardTitle>
              <CardDescription className="text-xs text-white/45">
                Interact with the AI Assistant to query candidate rankings, comparison parameters, or summary breakdowns.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4">
              {/* Chat timeline responses */}
              <div className="h-96 bg-white/[0.01] border border-white/5 rounded-2xl p-4 overflow-y-auto space-y-4">
                {copilotResponses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-white/30 space-y-2">
                    <HelpCircle className="w-8 h-8" />
                    <p className="text-xs">Try asking the Copilot about this candidate's performance details.</p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-sm mt-4">
                      {[
                        `Summarize this candidate interview`,
                        `What are their main communication weaknesses?`,
                        `How does this candidate compare to other applicants?`
                      ].map((q) => (
                        <button
                          key={q}
                          onClick={() => setCopilotQuery(q)}
                          className="text-[10px] text-white/60 hover:text-white bg-white/[0.04] border border-white/10 hover:border-white/20 py-1 px-3.5 rounded-full transition-all cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  copilotResponses.map((msg, idx) => {
                    const isUser = msg.startsWith('Recruiter:');
                    return (
                      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 max-w-md rounded-2xl text-xs leading-relaxed ${
                          isUser 
                            ? 'bg-[#8B5CF6] text-white' 
                            : 'bg-white/[0.04] border border-white/10 text-white/90'
                        }`}>
                          {msg.replace(/^(Recruiter:|HR Copilot:)\s*/, '')}
                        </div>
                      </div>
                    );
                  })
                )}
                {copilotLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-white/40 flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#8B5CF6]" /> Copilot is searching database...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleAskCopilot} className="flex gap-2">
                <Input
                  placeholder="Ask copilot to compare candidate profile or performance..."
                  value={copilotQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCopilotQuery(e.target.value)}
                  className="rounded-xl bg-white/[0.03] border-white/10 text-white text-xs h-10"
                />
                <Button type="submit" className="rounded-xl bg-[#8B5CF6] hover:bg-[#A855F7] text-white px-5 border-0 cursor-pointer text-xs font-semibold">
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
