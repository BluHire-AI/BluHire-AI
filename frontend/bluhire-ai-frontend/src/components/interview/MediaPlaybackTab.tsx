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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !media || (!media.recordings.length && !media.transcripts.length)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 w-full text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mb-3" />
        <h3 className="text-lg font-semibold text-slate-700">No Media Available</h3>
        <p className="text-sm mt-1 max-w-sm">
          The interview recording and transcript for this candidate are not available.
        </p>
      </div>
    );
  }

  const { recordings, transcripts } = media;
  const currentRecording = recordings[activeQuestion];
  const currentTranscript = transcripts[activeQuestion];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm font-sans flex flex-col md:flex-row overflow-hidden min-h-[500px]">
      
      {/* Sidebar - Question Navigation */}
      <div className="md:w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-100/50">
          <h3 className="font-bold text-slate-800">Interview Segments</h3>
          <p className="text-xs text-slate-500">{recordings.length} recorded answers</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {recordings.map((rec: any, i: number) => (
            <button
              key={rec._id}
              onClick={() => setActiveQuestion(i)}
              className={`w-full text-left p-4 border-b border-slate-200 transition-colors flex items-center justify-between ${
                activeQuestion === i ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-slate-100 border-l-4 border-l-transparent'
              }`}
            >
              <div>
                <span className={`font-semibold text-sm ${activeQuestion === i ? 'text-blue-700' : 'text-slate-700'}`}>
                  Question {i + 1}
                </span>
              </div>
              <Video className={`w-4 h-4 ${activeQuestion === i ? 'text-blue-500' : 'text-slate-400'}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:w-2/3 p-6 flex flex-col space-y-6">
        
        {/* Video Player */}
        <div className="bg-black rounded-xl overflow-hidden shadow-md border border-slate-800 relative w-full pt-[56.25%]">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-900">
              <Video className="w-12 h-12 mb-2 opacity-50" />
              <span>Video segment not available</span>
            </div>
          )}
        </div>

        {/* Transcript Area */}
        <div className="flex-1 bg-slate-50 rounded-xl p-6 border border-slate-200">
          <div className="flex items-center space-x-2 mb-4 text-slate-800 font-semibold border-b pb-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            <h3>AI Transcript</h3>
          </div>
          <div className="prose prose-sm max-w-none text-slate-600 h-full overflow-y-auto max-h-48">
            {currentTranscript ? (
              <p className="whitespace-pre-wrap">{currentTranscript.transcript}</p>
            ) : (
              <p className="text-slate-400 italic">No transcript generated for this segment.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
