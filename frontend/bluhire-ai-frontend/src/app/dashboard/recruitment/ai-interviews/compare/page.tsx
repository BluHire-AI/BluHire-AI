'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCandidateById, getCandidateScorecard } from '@/services/candidate.service';
import { motion } from 'framer-motion';
import { Code, MessageSquare, BrainCircuit, CheckSquare, Trophy, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function CandidateComparisonPage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchComparisonData() {
      if (!idsParam) {
        setLoading(false);
        return;
      }
      
      const ids = idsParam.split(',').slice(0, 3); // Max 3 candidates
      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const [info, scorecard] = await Promise.all([
              getCandidateById(id).catch(() => null),
              getCandidateScorecard(id).catch(() => null),
            ]);
            return { id, info, scorecard };
          })
        );
        // Even if scorecard is null, keep the candidate to show "Evaluation in Progress"
        setCandidates(results.filter(r => r.info));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchComparisonData();
  }, [idsParam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="p-8 text-slate-500 bg-slate-50 rounded-2xl border text-center mt-10">
        <h3 className="text-xl font-semibold mb-2">No Candidates Selected</h3>
        <p>Please select up to 3 candidates from the pipeline to compare.</p>
        <Link href="/dashboard/recruitment/ai-interviews" className="text-blue-600 font-medium hover:underline mt-4 inline-block">
          Return to Pipeline
        </Link>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-8 max-w-7xl mx-auto font-sans space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/recruitment/ai-interviews" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ChevronLeft className="h-5 w-5 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Candidate Comparison</h1>
            <p className="text-slate-500 text-sm mt-1">Comparing {candidates.length} candidate(s) side-by-side.</p>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-6 min-w-max">
            {candidates.map((c, idx) => {
              const { info, scorecard } = c;
              const user = info?.candidateId || {};
              const overallScore = Math.round(scorecard?.overallScore ?? 0);
              
              const recommendation = overallScore >= 80 ? 'HIRE' : overallScore >= 60 ? 'MAYBE HIRE' : 'REJECT';
              const recColor = overallScore >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                               overallScore >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                               'bg-red-50 text-red-700 border-red-200';

              const firstName = user?.firstName ?? 'Unknown';
              const lastName = user?.lastName ?? '';
              const initial = firstName.charAt(0) || '?';

              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-shrink-0"
                >
                  {/* Header Card */}
                  <div className="p-6 border-b border-slate-100 flex flex-col items-center bg-slate-50 relative overflow-hidden">
                    {overallScore >= 80 && (
                      <div className="absolute -top-6 -right-6 text-emerald-500 opacity-10">
                        <Trophy size={120} />
                      </div>
                    )}
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold border-2 border-white shadow-sm z-10">
                      {initial}{lastName.charAt(0)}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mt-4 z-10 text-center">
                      {firstName} {lastName}
                    </h3>
                    <div className={`mt-3 px-4 py-1.5 rounded-full text-xs font-bold border tracking-wide z-10 ${recColor}`}>
                      {scorecard ? recommendation : 'PENDING'}
                    </div>
                  </div>

                  {/* Score Overall */}
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Overall Score</span>
                    <span className="text-2xl font-bold text-slate-900">{overallScore}</span>
                  </div>

                  {/* Metric Breakdown */}
                  <div className="p-6 space-y-5 bg-white">
                    {[
                      { label: 'Technical', val: scorecard?.technicalScore ?? 0, icon: <Code size={16} /> },
                      { label: 'Communication', val: scorecard?.communicationScore ?? 0, icon: <MessageSquare size={16} /> },
                      { label: 'Problem Solving', val: scorecard?.problemSolvingScore ?? 0, icon: <BrainCircuit size={16} /> },
                      { label: 'Completeness', val: scorecard?.completenessScore ?? 0, icon: <CheckSquare size={16} /> }
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <span className="text-slate-400">{metric.icon}</span>
                            {metric.label}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{Math.round(metric.val)}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ width: `${metric.val}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <Link 
                      href={`/dashboard/recruitment/ai-interviews/${c.id}`}
                      className="block w-full py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 text-center hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
