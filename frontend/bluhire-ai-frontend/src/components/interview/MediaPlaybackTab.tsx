'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCandidateMedia } from '@/services/candidate.service';
import { Video, FileText, AlertCircle, CheckCircle2, XCircle, Award, Sparkles } from 'lucide-react';

interface MediaPlaybackTabProps {
  candidateId: string;
}

export const MediaPlaybackTab: React.FC<MediaPlaybackTabProps> = ({ candidateId }) => {
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  const { data: media, isLoading, error } = useQuery({
    queryKey: ['candidate-media', candidateId],
    queryFn: () => getCandidateMedia(candidateId),
    enabled: !!candidateId,
    refetchInterval: (query) => {
      // If any question is answered with recording but transcript is still processing/unavailable, poll every 3s
      const reviews = query.state.data?.questionReviews || [];
      const hasPendingTranscript = reviews.some(
        (q: any) => q.status === 'ANSWERED' && (q.transcript?.status === 'PROCESSING' || (!q.transcript?.text && q.recording?.available))
      );
      return hasPendingTranscript ? 3000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const questionReviews = media?.questionReviews || [];
  const totalQuestions = media?.totalQuestions || questionReviews.length || 0;
  const answeredCount = media?.answeredCount ?? questionReviews.filter((q: any) => q.status === 'ANSWERED').length;
  const skippedCount = media?.skippedCount ?? questionReviews.filter((q: any) => q.status === 'SKIPPED').length;
  const transcriptionFailedCount = media?.transcriptionFailedCount ?? questionReviews.filter((q: any) => q.status === 'TRANSCRIPTION_FAILED').length;
  const recordingFailedCount = media?.recordingFailedCount ?? questionReviews.filter((q: any) => q.status === 'RECORDING_FAILED').length;

  if (error || !media || (!questionReviews.length && !media.recordings?.length && !media.transcripts?.length)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full text-muted-foreground dark:text-zinc-400 bg-card dark:bg-white/[0.02] border border-dashed border-border dark:border-white/10 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground dark:text-zinc-500 mb-3" />
        <h3 className="text-lg font-semibold text-foreground dark:text-white">No Question Review Data</h3>
        <p className="text-sm mt-1 max-w-sm text-muted-foreground dark:text-zinc-400">
          The question breakdown and media recordings for this session are not available.
        </p>
      </div>
    );
  }

  const currentQ = questionReviews[activeQuestionIdx] || {
    questionNumber: activeQuestionIdx + 1,
    questionText: `Question ${activeQuestionIdx + 1}`,
    status: 'SKIPPED',
    recording: { available: false },
    transcript: { status: 'NOT_APPLICABLE', text: null },
    evaluation: { status: 'NOT_EVALUATED' },
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ANSWERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'TRANSCRIPTION_FAILED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'RECORDING_FAILED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'PENDING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'SKIPPED':
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="w-full bg-card dark:bg-card/80 backdrop-blur-md rounded-2xl border border-border dark:border-white/10 shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-lg font-sans flex flex-col md:flex-row overflow-hidden min-h-[550px]">
      
      {/* Sidebar - Question List */}
      <div className="md:w-1/3 bg-muted/20 dark:bg-white/[0.02] border-r border-border dark:border-white/10 flex flex-col">
        <div className="p-4 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.02]">
          <h3 className="font-bold text-foreground dark:text-white text-base">Interview Segments</h3>
          <div className="flex flex-col gap-1 mt-1 text-xs text-muted-foreground dark:text-zinc-400">
            <div className="flex items-center justify-between">
              <span>{answeredCount} answered • {skippedCount} skipped</span>
              <span className="font-semibold text-primary dark:text-purple-400">
                {totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0}% Complete
              </span>
            </div>
            {(transcriptionFailedCount > 0 || recordingFailedCount > 0) && (
              <span className="text-amber-400 text-[11px]">
                {transcriptionFailedCount > 0 && `${transcriptionFailedCount} audio processing failed `}
                {recordingFailedCount > 0 && `${recordingFailedCount} recording failed`}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {questionReviews.map((q: any, i: number) => {
            const isSelected = activeQuestionIdx === i;
            const isAnswered = q.status === 'ANSWERED';

            return (
              <button
                key={q.questionId || i}
                onClick={() => setActiveQuestionIdx(i)}
                className={`w-full text-left p-4 border-b border-border dark:border-white/10 transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 dark:bg-primary/15 border-l-4 border-l-primary'
                    : 'hover:bg-muted dark:hover:bg-white/[0.04] border-l-4 border-l-transparent'
                }`}
              >
                <div className="pr-2">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold text-sm ${isSelected ? 'text-primary dark:text-purple-300' : 'text-foreground dark:text-zinc-300'}`}>
                      Question {q.questionNumber || i + 1}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getStatusBadge(q.status)}`}>
                      {q.status}
                    </span>
                  </div>
                  {q.competency && (
                    <span className="inline-block text-[11px] text-purple-400 font-medium mt-0.5">
                      {q.competency}
                    </span>
                  )}
                  <p className="text-xs text-muted-foreground dark:text-zinc-400 line-clamp-1 mt-1">
                    {q.questionText}
                  </p>
                </div>
                {isAnswered ? (
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary dark:text-purple-400' : 'text-emerald-400'}`} />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-zinc-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:w-2/3 p-6 flex flex-col space-y-6">
        
        {/* Question Header & Status */}
        <div className="bg-muted/30 dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground dark:text-zinc-400">
                Question {currentQ.questionNumber} ({currentQ.category || 'General'})
              </span>
              {currentQ.competency && (
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  Target: {currentQ.competency}
                </span>
              )}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadge(currentQ.status)}`}>
              {currentQ.status}
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground dark:text-white">
            {currentQ.questionText}
          </h2>
          {currentQ.reason && (
            <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-2 italic">
              Rationale: {currentQ.reason} {currentQ.sourceSkill ? `(Evaluates ${currentQ.sourceSkill})` : ''}
            </p>
          )}
        </div>

        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden shadow-md border border-border dark:border-white/10 relative w-full pt-[50%]">
          {currentQ.recording?.available && currentQ.recording?.url ? (
            <video
              key={currentQ.questionId}
              controls
              className="absolute top-0 left-0 w-full h-full object-contain"
              src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${currentQ.recording.url}`}
            >
              Your browser does not support the video element.
            </video>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 dark:bg-zinc-950 p-6 text-center">
              <Video className="w-10 h-10 mb-2 text-zinc-500 opacity-60" />
              <span className="text-sm font-semibold text-zinc-300">No Candidate Response Recording</span>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                {currentQ.status === 'SKIPPED'
                  ? 'Candidate skipped this question during the interview session.'
                  : 'Recording not available for this segment.'}
              </p>
            </div>
          )}
        </div>

        {/* Candidate Response Transcript */}
        <div className="bg-muted/30 dark:bg-white/[0.03] rounded-xl p-5 border border-border dark:border-white/10">
          <div className="flex items-center space-x-2 mb-3 border-b border-border dark:border-white/10 pb-2">
            <FileText className="w-5 h-5 text-primary dark:text-purple-400" />
            <h3 className="text-foreground dark:text-white font-semibold">Candidate Response Transcript</h3>
          </div>
          <div className="prose dark:prose-invert prose-sm max-w-none text-muted-foreground dark:text-zinc-300">
            {currentQ.transcript?.status === 'AVAILABLE' && currentQ.transcript?.text ? (
              <p className="whitespace-pre-wrap leading-relaxed text-foreground dark:text-zinc-200">
                "{currentQ.transcript.text}"
              </p>
            ) : currentQ.transcript?.status === 'UNAVAILABLE' ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-xs">
                {currentQ.transcript.text || 'Transcript unavailable — audio processing failed or no speech detected.'}
              </div>
            ) : (
              <p className="text-muted-foreground dark:text-zinc-500 italic text-sm">
                No response provided — question was skipped by candidate.
              </p>
            )}
          </div>
        </div>

        {/* AI Question Evaluation */}
        <div className="bg-muted/30 dark:bg-white/[0.03] rounded-xl p-5 border border-border dark:border-white/10">
          <div className="flex items-center justify-between mb-3 border-b border-border dark:border-white/10 pb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-primary dark:text-purple-400" />
              <h3 className="text-foreground dark:text-white font-semibold">AI Question Evaluation</h3>
            </div>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              currentQ.evaluation?.status === 'EVALUATED'
                ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
            }`}>
              {currentQ.evaluation?.status || 'NOT_EVALUATED'}
            </span>
          </div>

          {currentQ.evaluation?.status === 'EVALUATED' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-lg text-center">
                  <span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-bold uppercase">Technical</span>
                  <p className="text-lg font-extrabold text-foreground dark:text-white mt-0.5">
                    {currentQ.evaluation.technicalScore ?? 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-lg text-center">
                  <span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-bold uppercase">Communication</span>
                  <p className="text-lg font-extrabold text-foreground dark:text-white mt-0.5">
                    {currentQ.evaluation.communicationScore ?? 'N/A'}
                  </p>
                </div>
                <div className="p-3 bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-lg text-center">
                  <span className="text-[10px] text-muted-foreground dark:text-zinc-400 font-bold uppercase">Problem Solving</span>
                  <p className="text-lg font-extrabold text-foreground dark:text-white mt-0.5">
                    {currentQ.evaluation.problemSolvingScore ?? 'N/A'}
                  </p>
                </div>
              </div>
              {currentQ.evaluation.feedback && (
                <p className="text-xs text-muted-foreground dark:text-zinc-300 leading-relaxed bg-card dark:bg-white/[0.02] p-3 border border-border dark:border-white/10 rounded-lg">
                  {currentQ.evaluation.feedback}
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-lg text-sm text-muted-foreground dark:text-zinc-400 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-zinc-500 shrink-0" />
              <div>
                <p className="font-medium text-foreground dark:text-zinc-300">Question Not Evaluated</p>
                <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-0.5">
                  {currentQ.status === 'SKIPPED'
                    ? 'Candidate skipped this question, so no candidate response evidence exists to evaluate.'
                    : 'Transcript unavailable for this segment — no substantive response detected.'}
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
