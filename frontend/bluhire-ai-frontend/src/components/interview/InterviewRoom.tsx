'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import { PreparationCountdown } from './PreparationCountdown';
import { Mic, MicOff, Video, VideoOff, RefreshCw, Send, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

type InterviewPhase =
  | 'INITIALIZING'
  | 'LOADING_QUESTION'
  | 'AI_SPEAKING'
  | 'COUNTDOWN'
  | 'RECORDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'ERROR';

interface Question {
  questionId: string;
  questionText: string;
  category: string;
  difficulty: string;
  questionIndex: number;
  totalQuestions: number;
}

export const InterviewRoom: React.FC<{
  sessionId: string;   // This is actually the public token
  onComplete: (blobs: Blob[]) => void;
}> = ({ sessionId: token, onComplete }) => {
  const [phase, setPhase] = useState<InterviewPhase>('INITIALIZING');
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [replayCount, setReplayCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const allRecordedBlobsRef = useRef<Blob[]>([]);   // Accumulates all question blobs
  const currentQuestionIdRef = useRef<string | null>(null);

  const voiceSettings = React.useMemo(() => ({ rate: 1.0, pitch: 1.0 }), []);
  const { speak, status: voiceStatus } = useVoiceEngine(voiceSettings);

  // ─── Phase 1: Initialize Camera ────────────────────────────────────────────
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        // Camera ready → start interview by fetching first question
        await fetchNextQuestion();
      } catch (error) {
        console.error('[InterviewRoom] Camera/mic access failed:', error);
        setErrorMessage('Camera or microphone access denied. Please allow permissions and refresh.');
        setPhase('ERROR');
      }
    };
    initCamera();
    return () => {
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Phase 2: AI Speaking ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'AI_SPEAKING' && currentQuestion) {
      speak(currentQuestion.questionText, () => {
        setPhase('COUNTDOWN');
      });
    }
  }, [phase, speak, currentQuestion]);

  // ─── Fetch Next Question (Adaptive) ────────────────────────────────────────
  const fetchNextQuestion = useCallback(async () => {
    setPhase('LOADING_QUESTION');
    try {
      const res = await api.get(`/interviews/public/${token}/next-question`);
      const q: Question | null = res.data.data;

      if (!q) {
        // No more questions — check if this is the VERY FIRST question
        if (allRecordedBlobsRef.current.length === 0 && !currentQuestionIdRef.current) {
          console.log('[DEBUG_AUDIT] Case A: Zero questions asked. Triggering configuration error.');
          setErrorMessage('Interview Configuration Error: No questions available for this assessment.');
          setPhase('ERROR');
          return;
        }

        // Case B: Completed at least one question
        console.log('[DEBUG_AUDIT] Case B: Interview naturally complete. Triggering onComplete().');
        setPhase('COMPLETED');
        onComplete(allRecordedBlobsRef.current);
        return;
      }

      console.log(`[InterviewRoom] Question ${q.questionIndex}/${q.totalQuestions}: [${q.difficulty}] ${q.questionText}`);
      currentQuestionIdRef.current = q.questionId;
      setCurrentQuestion(q);
      setReplayCount(0);
      setPhase('AI_SPEAKING');
    } catch (err: any) {
      console.error('[InterviewRoom] Failed to fetch next question:', err);
      setErrorMessage('Failed to load question. Please check your connection.');
      setPhase('ERROR');
    }
  }, [token, onComplete]);

  // ─── Start Recording ────────────────────────────────────────────────────────
  const handleCountdownComplete = useCallback(() => {
    setPhase('RECORDING');
    if (!mediaStreamRef.current) return;

    recordedChunksRef.current = [];
    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';
      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        console.log(`[InterviewRoom] Recording stopped. Blob size: ${blob.size} bytes, type: ${blob.type}`);
        allRecordedBlobsRef.current.push(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Collect data every 1 second
      console.log('[InterviewRoom] Recording started.');
    } catch (err) {
      console.error('[InterviewRoom] Error starting MediaRecorder:', err);
    }
  }, []);

  // ─── Repeat Question ────────────────────────────────────────────────────────
  const handleRepeatQuestion = () => {
    if (replayCount >= 2) {
      speak("I'm sorry, but I can only repeat a question twice.");
      return;
    }
    setReplayCount(prev => prev + 1);
    setPhase('AI_SPEAKING');
  };

  // ─── Submit Answer ──────────────────────────────────────────────────────────
  const handleSubmitAnswer = useCallback(() => {
    setPhase('PROCESSING');

    // Stop recorder — onstop fires asynchronously
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      console.log('[InterviewRoom] Recording stop() called.');
    }

    // Wait for onstop to fire (blob to be assembled) before fetching next question
    // We use a short delay to allow the onstop handler to complete
    setTimeout(async () => {
      // Upload the last recorded blob immediately so we don't wait until end
      const lastBlob = allRecordedBlobsRef.current[allRecordedBlobsRef.current.length - 1];
      if (lastBlob && currentQuestionIdRef.current) {
        try {
          const formData = new FormData();
          const qi = currentQuestion?.questionIndex ?? 0;
          // Append text fields FIRST so backend multer has them in req.body
          formData.append('questionIndex', qi.toString());
          if (currentQuestionIdRef.current) {
            formData.append('questionId', currentQuestionIdRef.current);
          }
          formData.append('video', lastBlob, `question_${qi}.webm`);
          await api.post(`/interviews/public/${token}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          console.log(`[InterviewRoom] Upload successful for question ${qi}.`);
        } catch (uploadErr) {
          console.error('[InterviewRoom] Upload failed:', uploadErr);
        }
      }

      // Fetch next adaptive question
      await fetchNextQuestion();
    }, 1500);
  }, [currentQuestion, token, fetchNextQuestion]);

  const totalQuestions = currentQuestion?.totalQuestions ?? 3;
  const questionIndex = currentQuestion?.questionIndex ?? 0;

  if (phase === 'ERROR') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-red-400">Interview Error</h2>
        <p className="text-slate-400 text-center max-w-md">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">

      {/* TOP: Header & AI Status */}
      <header className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full transition-colors ${voiceStatus === 'SPEAKING' ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}>
            <User size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Ava <span className="text-sm font-normal text-slate-400 ml-2">AI Interviewer</span></h1>
            <p className="text-sm text-blue-400 font-medium">
              {phase === 'INITIALIZING' && 'Connecting...'}
              {phase === 'LOADING_QUESTION' && 'Selecting your next question...'}
              {phase === 'AI_SPEAKING' && 'Ava is speaking...'}
              {phase === 'COUNTDOWN' && 'Prepare your answer'}
              {phase === 'RECORDING' && 'Listening to your response...'}
              {phase === 'PROCESSING' && 'Uploading and analyzing...'}
              {phase === 'COMPLETED' && 'Interview complete!'}
            </p>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Session Progress</p>
            <p className="text-sm font-medium">
              Question {questionIndex} of {totalQuestions}
            </p>
            {currentQuestion && (
              <p className="text-xs text-slate-500 mt-0.5">
                {currentQuestion.difficulty} · {currentQuestion.category}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* MIDDLE: Camera Feed */}
      <main className="flex-1 flex items-center justify-center p-8 relative">
        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-500 ${!cameraActive ? 'opacity-0' : 'opacity-100'}`}
          />

          {/* Overlays */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {phase === 'COUNTDOWN' && (
              <div className="pointer-events-auto scale-125">
                <PreparationCountdown isActive={true} onComplete={handleCountdownComplete} />
              </div>
            )}

            {(phase === 'LOADING_QUESTION' || phase === 'INITIALIZING') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/80 backdrop-blur-lg p-8 rounded-2xl border border-slate-700 text-center"
              >
                <RefreshCw size={40} className="mx-auto mb-4 text-blue-500 animate-spin" />
                <h3 className="text-xl font-medium">
                  {phase === 'INITIALIZING' ? 'Starting interview...' : 'Loading next question...'}
                </h3>
              </motion.div>
            )}

            {phase === 'PROCESSING' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/80 backdrop-blur-lg p-8 rounded-2xl border border-slate-700 text-center"
              >
                <RefreshCw size={40} className="mx-auto mb-4 text-blue-500 animate-spin" />
                <h3 className="text-xl font-medium">Uploading and transcribing...</h3>
                <p className="text-slate-400 mt-2">Please wait while we process your answer.</p>
              </motion.div>
            )}

            {phase === 'COMPLETED' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-900/90 backdrop-blur-lg p-10 rounded-2xl border border-emerald-700 text-center"
              >
                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-emerald-400">Interview Complete!</h3>
                <p className="text-slate-400 mt-2">Your responses are being analyzed. Thank you!</p>
              </motion.div>
            )}
          </div>

          {/* Recording Indicator */}
          {phase === 'RECORDING' && (
            <div className="absolute top-6 left-6 flex items-center space-x-2 bg-red-500/20 px-4 py-2 rounded-full border border-red-500/50 backdrop-blur-md">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-500 font-medium text-sm">REC</span>
            </div>
          )}

          {/* Question Text Overlay */}
          {(phase === 'AI_SPEAKING' || phase === 'COUNTDOWN' || phase === 'RECORDING') && currentQuestion && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-transparent p-6">
              <p className="text-sm text-slate-400 uppercase tracking-wider mb-1 font-semibold">Question {questionIndex}</p>
              <p className="text-white text-lg font-medium leading-relaxed">{currentQuestion.questionText}</p>
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM: Controls */}
      <footer className="px-8 py-6 bg-slate-900/50 backdrop-blur-md border-t border-slate-800 flex justify-center items-center space-x-6">

        <button
          onClick={() => setMicActive(!micActive)}
          className={`p-4 rounded-full transition-colors ${micActive ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}
        >
          {micActive ? <Mic size={24} /> : <MicOff size={24} />}
        </button>

        <button
          onClick={() => setCameraActive(!cameraActive)}
          className={`p-4 rounded-full transition-colors ${cameraActive ? 'bg-slate-800 hover:bg-slate-700' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}
        >
          {cameraActive ? <Video size={24} /> : <VideoOff size={24} />}
        </button>

        <div className="w-px h-8 bg-slate-700 mx-4" />

        <button
          onClick={handleRepeatQuestion}
          disabled={phase !== 'RECORDING' && phase !== 'COUNTDOWN'}
          className="flex items-center space-x-2 px-6 py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all"
        >
          <RefreshCw size={20} />
          <span className="font-medium">Repeat Question ({2 - replayCount} left)</span>
        </button>

        <button
          onClick={handleSubmitAnswer}
          disabled={phase !== 'RECORDING'}
          className="flex items-center space-x-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-800 disabled:cursor-not-allowed rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <span>Submit Answer</span>
          <Send size={20} />
        </button>

      </footer>
    </div>
  );
};
