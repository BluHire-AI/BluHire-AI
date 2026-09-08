'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCandidateMedia } from '@/services/candidate.service';
import { Video, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MediaPlaybackTabProps {
  candidateId: string;
}

export const MediaPlaybackTab: React.FC<MediaPlaybackTabProps> = ({ candidateId }) => {
  const [activeQuestion, setActiveQuestion] = useState(0);

  const { data: media, isLoading, error } = useQuery({
    queryKey: ['candidate-media', candidateId],
    queryFn: () => getCandidateMedia(candidateId),
    enabled: !!candidateId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !media || (!media.recordings.length && !media.transcripts.length)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full text-muted-foreground dark:text-zinc-400 bg-card dark:bg-white/[0.02] border border-dashed border-border dark:border-white/10 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground dark:text-zinc-500 mb-3" />
        <h3 className="text-lg font-semibold text-foreground dark:text-white">No Media Available</h3>
        <p className="text-sm mt-1 max-w-sm text-muted-foreground dark:text-zinc-400">
          The interview recording and transcript for this candidate are not available.
        </p>
      </div>
    );
  }

  const { recordings, transcripts } = media;
  const currentRecording = recordings[activeQuestion];
  const currentTranscript = transcripts[activeQuestion];

  return (
    <div className="w-full bg-card dark:bg-card/80 backdrop-blur-md rounded-2xl border border-border dark:border-white/10 shadow-[0_4px_20px_rgba(23,32,51,0.06)] dark:shadow-lg font-sans flex flex-col md:flex-row overflow-hidden min-h-[500px]">
      
      {/* Sidebar - Question Navigation */}
      <div className="md:w-1/3 bg-muted/20 dark:bg-white/[0.02] border-r border-border dark:border-white/10 flex flex-col">
        <div className="p-4 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.02]">
          <h3 className="font-bold text-foreground dark:text-white">Interview Segments</h3>
          <p className="text-xs text-muted-foreground dark:text-zinc-400">{recordings.length} recorded answers</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {recordings.map((rec: any, i: number) => (
            <button
              key={rec._id}
              onClick={() => setActiveQuestion(i)}
              className={`w-full text-left p-4 border-b border-border dark:border-white/10 transition-colors flex items-center justify-between cursor-pointer ${
                activeQuestion === i ? 'bg-primary/10 dark:bg-primary/15 border-l-4 border-l-primary' : 'hover:bg-muted dark:hover:bg-white/[0.04] border-l-4 border-l-transparent'
              }`}
            >
              <div>
                <span className={`font-semibold text-sm ${activeQuestion === i ? 'text-primary dark:text-purple-300' : 'text-foreground dark:text-zinc-300'}`}>
                  Question {i + 1}
                </span>
              </div>
              <Video className={`w-4 h-4 ${activeQuestion === i ? 'text-primary dark:text-purple-400' : 'text-muted-foreground dark:text-zinc-500'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:w-2/3 p-6 flex flex-col space-y-6">
        
        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden shadow-md border border-border dark:border-white/10 relative w-full pt-[56.25%]">
          {currentRecording ? (
          <video
            key={currentRecording._id}
            controls
            className="absolute top-0 left-0 w-full h-full object-contain"
            src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000'}${currentRecording.videoUrl}`}
          >
            Your browser does not support the video element.
          </video>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 dark:bg-zinc-950">
              <Video className="w-12 h-12 mb-2 opacity-50 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">Video segment not available</span>
            </div>
          )}
        </div>

        {/* Transcript Area */}
        <div className="flex-1 bg-[#F8FAFC] dark:bg-white/[0.03] rounded-xl p-6 border border-border dark:border-white/10">
          <div className="flex items-center space-x-2 mb-4 text-foreground dark:text-white font-semibold border-b border-border dark:border-white/10 pb-2">
            <FileText className="w-5 h-5 text-primary dark:text-purple-400" />
            <h3 className="text-foreground dark:text-white font-semibold">AI Transcript</h3>
          </div>
          <div className="prose dark:prose-invert prose-sm max-w-none text-muted-foreground dark:text-zinc-300 h-full overflow-y-auto max-h-48">
            {currentTranscript ? (
              <p className="whitespace-pre-wrap text-foreground dark:text-zinc-300 leading-relaxed">{currentTranscript.transcript}</p>
            ) : (
              <p className="text-muted-foreground dark:text-zinc-500 italic">No transcript generated for this segment.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
