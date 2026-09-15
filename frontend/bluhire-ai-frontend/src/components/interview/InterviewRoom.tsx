'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import { PreparationCountdown } from './PreparationCountdown';
import { 
  Mic, MicOff, Video, VideoOff, RefreshCw, Send, User, 
  AlertCircle, Sparkles, Building, CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import StarField from '@/components/StarField';
import { useInterviewProctoring } from '@/hooks/useInterviewProctoring';
import { ProctoringSystemCheck } from './ProctoringSystemCheck';
import { ProctoringHeaderBadge, ProctoringWarningBanner } from './ProctoringBanners';

type InterviewPhase =
  | 'INITIALIZING'
  | 'SYSTEM_CHECK'
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

  // ─── AI Proctoring Layer Hook ─────────────────────────────────────────────
  const proctoring = useInterviewProctoring({
    videoRef,
    token,
    enabled: phase !== 'INITIALIZING' && phase !== 'COMPLETED' && phase !== 'ERROR',
  });

  // ─── Phase 1: Initialize Camera & Audio ───────────────────────────────────
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        // Camera & Mic initialized -> transition to System Check phase
        setPhase('SYSTEM_CHECK');
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

  // ─── Stream & Track Synchronization ─────────────────────────────────────────
  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
      if (cameraActive) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [phase, cameraActive]);

  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = cameraActive;
      });
    }
  }, [cameraActive]);

  useEffect(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = micActive;
      });
    }
  }, [micActive]);

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
      <div className="relative min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 overflow-hidden">
        <div className="bg-scene">
          <div className="bg-ambient" />
          <StarField dark={true} />
        </div>
        <div className="relative z-10 w-full max-w-md bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl p-8 rounded-[28px] border border-red-500/30 text-center space-y-4 shadow-2xl">
          <div className="mx-auto w-16 h-16 bg-rose-500/15 text-rose-400 rounded-2xl border border-rose-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Interview Error</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // ─── Render Pre-Interview System Check ─────────────────────────────────────
  if (phase === 'SYSTEM_CHECK') {
    return (
      <ProctoringSystemCheck
        videoRef={videoRef}
        videoStream={mediaStreamRef.current}
        isFaceDetected={proctoring.isFaceDetected}
        faceCount={proctoring.faceCount}
        faceAnalysis={proctoring.faceAnalysis}
        eyeGazeAnalysis={proctoring.eyeGazeAnalysis}
        modelLoaded={proctoring.modelLoaded}
        inferenceAvailable={proctoring.inferenceAvailable}
        onStartInterview={() => fetchNextQuestion()}
        onEnterFullscreen={proctoring.enterFullscreen}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-[#050505] text-white flex flex-col font-sans select-none overflow-hidden relative">

      {/* Animated Connected-Node Background Scene */}
      <div className="bg-scene">
        <div className="bg-ambient" />
        <StarField dark={true} />
      </div>

      {/* TOP: Header & AI Status Bar */}
      <header className="h-16 px-6 border-b border-border dark:border-white/10 flex items-center justify-between bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl z-20 shrink-0 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-[0_0_12px_rgba(139,92,246,0.2)]">
            <Building className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-400 via-violet-400 to-[#8B5CF6] bg-clip-text text-transparent">
            BluHire-AI
          </span>
          <span className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-purple-300 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full hidden sm:inline-block">
            AI Interview Assessment
          </span>

          {/* AI Proctoring Status Badge */}
          <ProctoringHeaderBadge status={proctoring.status} />

          <div className="h-4 w-px bg-white/10 hidden md:block" />

          {/* AI Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 text-xs">
            <div className={`w-2 h-2 rounded-full ${voiceStatus === 'SPEAKING' || phase === 'AI_SPEAKING' ? 'bg-purple-400 animate-ping' : phase === 'RECORDING' ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-zinc-300 font-medium text-[11px]">
              {phase === 'INITIALIZING' && 'Connecting...'}
              {phase === 'LOADING_QUESTION' && 'Preparing question...'}
              {phase === 'AI_SPEAKING' && 'Ava (AI Interviewer) speaking...'}
              {phase === 'COUNTDOWN' && 'Prepare your answer...'}
              {phase === 'RECORDING' && 'AI is listening...'}
              {phase === 'PROCESSING' && 'Transcribing response...'}
              {phase === 'COMPLETED' && 'Assessment complete'}
            </span>
          </div>
        </div>

        {/* Right Progress Tracker */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Session Progress</span>
              <span className="text-xs font-mono font-bold text-white bg-primary/15 px-2 py-0.5 rounded-full border border-primary/25">
                Q{questionIndex} of {totalQuestions}
              </span>
            </div>

            {/* Visual Step Progress Dots */}
            <div className="flex items-center gap-1.5 justify-end mt-1">
              {Array.from({ length: totalQuestions }).map((_, idx) => {
                const stepNum = idx + 1;
                const isCurrent = stepNum === questionIndex;
                const isDone = stepNum < questionIndex;
                return (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isDone
                        ? 'w-4 bg-emerald-400'
                        : isCurrent
                        ? 'w-6 bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)] animate-pulse'
                        : 'w-2 bg-white/20'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* MIDDLE: Camera Feed & Question Console */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden z-10 w-full max-w-6xl mx-auto gap-4 sm:gap-5">

        {/* Camera Feed Card */}
        <div className="relative w-full flex-1 max-w-4xl aspect-video bg-black/90 rounded-[28px] overflow-hidden border border-border dark:border-white/15 shadow-[0_16px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-center group">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-500 ${!cameraActive ? 'opacity-0' : 'opacity-100'}`}
          />

          {/* Candidate-Facing Glass Warning Banner Overlay */}
          <ProctoringWarningBanner warningMessage={proctoring.activeWarning} />

          {/* Camera Paused Fallback */}
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070812]/90 backdrop-blur-md text-zinc-400 space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500">
                <VideoOff className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold text-zinc-400">Camera Feed Paused</p>
            </div>
          )}

          {/* Live Recording Badge */}
          {phase === 'RECORDING' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-400 shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
              <span>RECORDING</span>
            </div>
          )}

          {/* AI Speaking Indicator Badge */}
          {phase === 'AI_SPEAKING' && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-purple-500/15 border border-purple-500/30 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-purple-300 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
              <span>AI SPEAKING</span>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            {phase === 'COUNTDOWN' && (
              <div className="pointer-events-auto">
                <PreparationCountdown isActive={true} onComplete={handleCountdownComplete} />
              </div>
            )}

            {(phase === 'LOADING_QUESTION' || phase === 'INITIALIZING') && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0e101e]/90 backdrop-blur-xl p-6 sm:p-8 rounded-[24px] border border-white/10 text-center space-y-3 shadow-2xl"
              >
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {phase === 'INITIALIZING' ? 'Connecting to assessment...' : 'Preparing next question...'}
                </h3>
              </motion.div>
            )}

            {phase === 'PROCESSING' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0e101e]/90 backdrop-blur-xl p-6 sm:p-8 rounded-[24px] border border-white/10 text-center space-y-3 shadow-2xl max-w-sm"
              >
                <Sparkles className="w-8 h-8 text-purple-400 animate-bounce mx-auto" />
                <h3 className="text-base font-bold text-white">Uploading & Analyzing Response</h3>
                <p className="text-xs text-zinc-400">Saving video transcript securely...</p>
              </motion.div>
            )}

            {phase === 'COMPLETED' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0e101e]/95 backdrop-blur-xl p-8 rounded-[28px] border border-emerald-500/30 text-center space-y-3 shadow-2xl max-w-sm"
              >
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-white">Interview Complete!</h3>
                <p className="text-xs text-zinc-400">Your responses are saved. Submitting assessment...</p>
              </motion.div>
            )}
          </div>
        </div>

        {/* AI Question Box Panel */}
        <div className="w-full max-w-4xl bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl border border-border dark:border-white/10 rounded-[24px] p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
                AI Interviewer Question
              </span>
              {currentQuestion && (
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                  {currentQuestion.category} · {currentQuestion.difficulty}
                </span>
              )}
            </div>
            <span className="text-xs font-mono font-bold text-zinc-400">Q{questionIndex} of {totalQuestions}</span>
          </div>

          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white leading-relaxed tracking-tight">
            {currentQuestion ? `"${currentQuestion.questionText}"` : 'Loading question text...'}
          </h3>
        </div>
      </main>

      {/* BOTTOM: Floating Controls Bar */}
      <footer className="h-20 px-6 border-t border-border dark:border-white/10 bg-card/85 dark:bg-[#0e101e]/85 backdrop-blur-2xl flex items-center justify-center shrink-0 z-20">
        <div className="flex items-center gap-3 sm:gap-4 bg-[#0a0c16]/90 border border-white/15 px-6 py-2.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl">

          {/* Mic Toggle */}
          <button
            onClick={() => setMicActive(!micActive)}
            className={`p-2.5 rounded-full transition-all border ${
              micActive 
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-white' 
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
            title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
          >
            {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={() => setCameraActive(!cameraActive)}
            className={`p-2.5 rounded-full transition-all border ${
              cameraActive 
                ? 'bg-white/10 hover:bg-white/20 border-white/15 text-white' 
                : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}
            title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {cameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          <div className="h-5 w-px bg-white/15 mx-1" />

          {/* Repeat Question Button */}
          <button
            onClick={handleRepeatQuestion}
            disabled={phase !== 'RECORDING' && phase !== 'COUNTDOWN'}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 disabled:opacity-40 disabled:hover:bg-white/10 border border-white/15 text-xs font-semibold text-zinc-200 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Repeat ({2 - replayCount} left)</span>
          </button>

          {/* Submit Answer Button */}
          <button
            onClick={handleSubmitAnswer}
            disabled={phase !== 'RECORDING'}
            className="flex items-center gap-2 px-6 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:from-zinc-800 disabled:to-zinc-800 text-xs font-bold text-white transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed border-0"
          >
            <span>Submit Answer</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
