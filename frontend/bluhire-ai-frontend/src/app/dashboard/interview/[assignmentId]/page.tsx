'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, MicOff, Volume2, ShieldCheck, Play, Power, AlertTriangle, 
  CheckCircle2, RefreshCw, Clock, ArrowRight, UserCheck, ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { useRouter } from 'next/navigation';

export default function InterviewWorkspace({ params }: { params: Promise<{ assignmentId: string }> }) {
  const resolvedParams = use(params);
  const assignmentId = resolvedParams.assignmentId;
  const { user } = useAuthStore();
  const router = useRouter();

  // Interview state machine: 'instructions' | 'mic-check' | 'active' | 'loading-next' | 'finished'
  const [step, setStep] = useState<'instructions' | 'mic-check' | 'active' | 'loading-next' | 'finished'>('instructions');
  
  const [assignment, setAssignment] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [interviewCompleted, setInterviewCompleted] = useState(false);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioBlob]);
  const [microphoneStatus, setMicrophoneStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  
  // Sound verification state
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  // Timers and integrity
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(900); // 15 mins default
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const testIntervalRef = useRef<number | null>(null);

  // 1. Fetch assignment details on mount
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/recruitment/interviews/assignments/${assignmentId}`);
        const data = res.data?.data;
        setAssignment(data);
        if (data.status === 'Completed' || data.status === 'Reviewed') {
          setInterviewCompleted(true);
          setStep('finished');
        }
        setTimeLeftSeconds((data.interviewTemplateId?.timeLimit || 15) * 60);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch assignment details');
      }
    };
    fetchDetails();
  }, [assignmentId]);

  // 2. Request mic permission
  const checkMicPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicrophoneStatus('granted');
      stream.getTracks().forEach(track => track.stop());
      setStep('mic-check');
    } catch (err) {
      setMicrophoneStatus('denied');
      setError('Microphone access was denied. Please update settings in your browser.');
    }
  };

  // 3. Start live microphone audio level visualizer
  const startMicTest = async () => {
    try {
      setIsMicTesting(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      source.connect(analyser);
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setMicVolume(Math.min(100, Math.round(average * 2)));
        testIntervalRef.current = requestAnimationFrame(updateVolume);
      };

      testIntervalRef.current = requestAnimationFrame(updateVolume);

      // Stop stream after 5 seconds automatically
      setTimeout(() => {
        stopMicTest(stream);
      }, 5000);
    } catch (err) {
      setError('Failed to setup microphone test visualizer');
      setIsMicTesting(false);
    }
  };

  const stopMicTest = (stream?: MediaStream) => {
    setIsMicTesting(false);
    setMicVolume(0);
    if (testIntervalRef.current) {
      cancelAnimationFrame(testIntervalRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  // 4. Start the interview session
  const handleStartInterview = async () => {
    try {
      setError(null);
      const res = await api.post('/recruitment/interviews/session/start', { assignmentId });
      const { session: sessionData, currentQuestion, isResumed } = res.data?.data;
      
      setSession(sessionData);
      setCurrentQuestion(currentQuestion);
      setStep('active');

      // Request fullscreen
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          console.warn('Fullscreen request bypassed by browser');
        });
      }

      // Hook up integrity listeners
      setupIntegrityListeners(sessionData._id);

      // Start countdown timer
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to start interview sitting');
    }
  };

  // 5. Setup integrity tracking listeners
  const setupIntegrityListeners = (sessionId: string) => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        console.warn('Fraud alert: Exited fullscreen');
        api.post('/recruitment/interviews/session/integrity', { sessionId, eventType: 'fullscreen-exit' }).catch(console.error);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.warn('Fraud alert: Tab switched');
        api.post('/recruitment/interviews/session/integrity', { sessionId, eventType: 'tab-switch' }).catch(console.error);
      }
    };

    const handleOffline = () => {
      console.warn('Fraud alert: Connection lost');
      api.post('/recruitment/interviews/session/integrity', { sessionId, eventType: 'disconnect' }).catch(console.error);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('offline', handleOffline);

    // Cleanups on unmount
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('offline', handleOffline);
    };
  };

  // 6. Countdown Timer
  const startCountdown = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setStep('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 7. Recording audio operations
  const startRecording = async () => {
    audioChunksRef.current = [];
    setAudioBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(250); // Slice data every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      setError('Could not access microphone to record response.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  // 8. Submit audio and poll background queue status
  const handleSubmitResponse = async () => {
    if (interviewCompleted) return;
    if (!audioBlob || !session || !currentQuestion) return;

    setStep('loading-next');
    setError(null);

    try {
      const formData = new FormData();
      formData.append('sessionId', session._id);
      formData.append('questionId', currentQuestion._id);
      formData.append('audio', audioBlob, 'response.webm');

      // Upload file to backend
      const uploadRes = await api.post('/recruitment/interviews/session/submit-answer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const responseData = uploadRes.data?.data;
      const { session: nextSession, currentQuestion: nextQuestion, isProcessedInline } = responseData || {};

      if (isProcessedInline) {
        console.log('[Interview Client] Sync processing complete. Next session state loaded immediately.', responseData);
        if (nextSession?.status === 'Completed') {
          console.log("Interview Completed");
          setInterviewCompleted(true);
          setStep('finished');
        } else if (nextQuestion) {
          setSession(nextSession);
          setCurrentQuestion(nextQuestion);
          setAudioBlob(null);
          setRecordingSeconds(0);
          setStep('active');
        } else {
          console.log("Interview Completed");
          setInterviewCompleted(true);
          setStep('finished');
        }
        return;
      }

      // Poll database for state updates: every 3 seconds, check if the session index has updated
      let pollCount = 0;
      const maxPolls = 20; // 60 seconds timeout

      const interval = setInterval(async () => {
        pollCount++;
        try {
          const checkRes = await api.get(`/recruitment/interviews/assignments/${assignmentId}`);
          const currentAssignment = checkRes.data?.data;
          
          if (currentAssignment.status === 'Completed' || currentAssignment.status === 'Reviewed') {
            clearInterval(interval);
            console.log("Interview Completed");
            setInterviewCompleted(true);
            setStep('finished');
            return;
          }

          // Wait, start endpoint returns current active question! Let's hit that
          const startRes = await api.post('/recruitment/interviews/session/start', { assignmentId });
          const newSessionData = startRes.data?.data;

          if (newSessionData.session?.status === 'Completed') {
            clearInterval(interval);
            console.log("Interview Completed");
            setInterviewCompleted(true);
            setStep('finished');
            return;
          }

          if (newSessionData.currentQuestion && newSessionData.currentQuestion._id !== currentQuestion._id) {
            clearInterval(interval);
            setSession(newSessionData.session);
            setCurrentQuestion(newSessionData.currentQuestion);
            setAudioBlob(null);
            setRecordingSeconds(0);
            setStep('active');
          }
        } catch (e) {
          console.error('Failed checking status', e);
        }

        if (pollCount >= maxPolls) {
          clearInterval(interval);
          setError('AI processing took longer than expected. Please refresh this page to resume.');
          setStep('active');
        }
      }, 3000);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit response answer.');
      setStep('active');
    }
  };

  // Cleanups
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (testIntervalRef.current) cancelAnimationFrame(testIntervalRef.current);
    };
  }, []);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // STEP RENDERING
  if (step === 'instructions') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6 select-none">
        <Card className="bg-white/[0.02] border-white/10 rounded-[24px] shadow-2xl p-6">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-[#8B5CF6] mb-3">
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            </div>
            <CardTitle className="text-2xl text-white font-bold">Secure Interview Environment</CardTitle>
            <CardDescription className="text-white/40 text-xs mt-1">
              You are about to start the AI Interview for: <strong className="text-white">{(assignment?.jobId as any)?.title}</strong>
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4 bg-white/[0.01] border border-white/10 p-4 rounded-2xl text-xs leading-relaxed text-white/70">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" /> Mandatory Rules:
              </h4>
              <ul className="list-disc pl-4 space-y-2">
                <li><strong>Fullscreen is Required:</strong> The window will maximize. Exiting full screen records an integrity infraction.</li>
                <li><strong>No Tab Switching:</strong> Navigating away from this tab will immediately notify the recruiter.</li>
                <li><strong>Quiet Space:</strong> Ensure you are in a quiet room. Avoid background voices.</li>
              </ul>
            </div>

            <Button
              onClick={checkMicPermissions}
              className="w-full rounded-xl bg-[#8B5CF6] hover:bg-[#A855F7] text-white font-semibold text-xs h-10 shadow-lg shadow-[#8B5CF6]/15 cursor-pointer border-0"
            >
              Verify Microphone Setup <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'mic-check') {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 space-y-6 select-none">
        <Card className="bg-white/[0.02] border-white/10 rounded-[24px] shadow-2xl p-6">
          <CardHeader className="text-center pb-4">
            <div className="w-12 h-12 bg-white/[0.04] border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 mb-3">
              <Volume2 className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl text-white font-bold">Microphone Audio Test</CardTitle>
            <CardDescription className="text-white/40 text-xs">
              Let's speak into your microphone to verify audio output levels.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isMicTesting ? (
              <div className="space-y-4">
                <div className="h-10 bg-white/[0.02] border border-white/10 rounded-xl flex items-center overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#8B5CF6] transition-all duration-75"
                    style={{ width: `${micVolume}%` }}
                  />
                  <span className="absolute right-4 text-[10px] font-mono text-white/50">{micVolume}% Vol</span>
                </div>
                <p className="text-center text-[10px] text-white/40">Say a few words now to calibrate audio capture...</p>
              </div>
            ) : (
              <div className="text-center">
                <Button 
                  onClick={startMicTest}
                  variant="outline"
                  className="rounded-xl border-[#8B5CF6]/30 bg-[#8B5CF6]/5 text-white hover:bg-[#8B5CF6]/10 text-xs py-5 px-6"
                >
                  <Mic className="w-4 h-4 mr-2" /> Test Audio Capture
                </Button>
              </div>
            )}

            <Button
              onClick={handleStartInterview}
              disabled={isMicTesting}
              className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-10 shadow-lg shadow-emerald-500/15 cursor-pointer border-0 mt-8"
            >
              Start AI Interview Session <Play className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'loading-next') {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center select-none space-y-6">
        <Card className="bg-white/[0.02] border-white/10 rounded-[24px] p-10 flex flex-col items-center">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#8B5CF6] animate-spin flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#8B5CF6]" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Analyzing Answer</h2>
          <p className="text-xs text-white/40 max-w-xs leading-relaxed">
            The AI Recruiter is transcribing your voice recording and generating the follow-up question. This takes a few seconds...
          </p>
        </Card>
      </div>
    );
  }

  if (step === 'finished' || interviewCompleted) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center select-none space-y-6">
        <Card className="bg-[#10B981]/5 border-[#10B981]/20 rounded-[24px] p-8 flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-bold text-white mb-2">Interview Completed!</h2>
          <p className="text-xs text-white/50 max-w-sm leading-relaxed mb-6">
            Your responses have been successfully compiled and submitted to the evaluation engine. Recruiters will contact you once the review is completed.
          </p>
          <div className="flex gap-4">
            <Button
              onClick={() => router.push(`/dashboard/recruitment/interviews/report/${session?._id || assignmentId}`)}
              className="rounded-xl bg-[#8B5CF6] text-white hover:bg-[#A855F7] text-xs px-6 border-0 cursor-pointer"
            >
              View Report
            </Button>
            <Button
              onClick={() => router.push('/dashboard')}
              className="rounded-xl bg-white/[0.04] text-white hover:bg-white/[0.08] text-xs px-6 border border-white/10 cursor-pointer"
            >
              Return to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 select-none">
      {/* Active Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[9px] px-2 py-0.5 animate-pulse">
            LIVE SESSION IN PROGRESS
          </Badge>
          <h2 className="text-sm font-semibold text-white/70">
            {(assignment?.jobId as any)?.title}
          </h2>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <Clock className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-white/80">Remaining Time:</span>
          <span className={`font-bold ${timeLeftSeconds < 180 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {formatTime(timeLeftSeconds)}
          </span>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-3">
          <ShieldAlert className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Main Workspace split */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Info Panel */}
        <Card className="bg-white/[0.02] border-white/10 rounded-[24px] p-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-[#8B5CF6]">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">AI Recruiter</h4>
              <p className="text-[10px] text-white/40">Conducting automated screening</p>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-4 text-[11px] text-white/60">
            <div className="flex justify-between">
              <span>Current Question:</span>
              <span className="font-semibold text-white">{session?.currentQuestionIndex + 1} / {session?.totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span>Max Time Limit:</span>
              <span className="font-semibold text-white">{assignment?.interviewTemplateId?.timeLimit} Minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining Attempts:</span>
              <span className="font-semibold text-white">{(assignment?.maxAttempts - assignment?.attemptCount)} Sittings</span>
            </div>
          </div>
        </Card>

        {/* Center/Right Question Panel */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-white/[0.03] border-white/10 rounded-[24px] p-6 space-y-6">
            <CardHeader className="p-0">
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-[9px] w-fit">
                Question Category: {currentQuestion?.category}
              </Badge>
              <CardTitle className="text-xl font-medium text-white leading-relaxed mt-3">
                "{currentQuestion?.questionText}"
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0 pt-6 border-t border-white/10 space-y-6">
              {/* Recorder UI */}
              {isRecording ? (
                <div className="flex flex-col items-center py-6 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute animate-ping h-8 w-8 rounded-full bg-red-500/30 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500" />
                  </div>
                  <p className="text-sm font-bold font-mono text-white">
                    Recording Answer... {formatTime(recordingSeconds)}
                  </p>
                  <p className="text-[10px] text-white/40">Speak clearly. Stop recording once you are done answering.</p>
                </div>
              ) : audioBlob ? (
                <div className="flex flex-col items-center py-6 space-y-4">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs py-1 px-3">
                    Answer Saved • {formatTime(recordingSeconds)}
                  </Badge>
                  {audioUrl && (
                    <audio controls src={audioUrl} className="h-10 w-full max-w-sm" />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-white/30">
                    <MicOff className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-white/40">Microphone idle. Ready to record your answer.</p>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center gap-3">
                {!isRecording && !audioBlob ? (
                  <Button
                    onClick={startRecording}
                    disabled={interviewCompleted}
                    className="rounded-xl bg-[#8B5CF6] hover:bg-[#A855F7] text-white font-semibold text-xs px-6 h-10 border-0 cursor-pointer"
                  >
                    <Mic className="w-4 h-4 mr-2" /> Start Recording
                  </Button>
                ) : isRecording ? (
                  <Button
                    onClick={stopRecording}
                    disabled={interviewCompleted}
                    className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-xs px-6 h-10 border-0 cursor-pointer animate-pulse"
                  >
                    <Power className="w-4 h-4 mr-2" /> Stop Recording
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={startRecording}
                      disabled={interviewCompleted}
                      variant="outline"
                      className="rounded-xl border-white/10 text-white/80 hover:text-white text-xs px-6 h-10 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Redo Recording
                    </Button>
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={interviewCompleted}
                      className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-6 h-10 border-0 cursor-pointer"
                    >
                      Submit & Next Question <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
