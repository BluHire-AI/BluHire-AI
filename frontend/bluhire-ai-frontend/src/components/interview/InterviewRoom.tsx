'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import { PreparationCountdown } from './PreparationCountdown';
import { Mic, MicOff, Video, VideoOff, RefreshCw, Send, User } from 'lucide-react';
import { motion } from 'framer-motion';

type InterviewPhase = 
  | 'INITIALIZING' 
  | 'AI_SPEAKING' 
  | 'COUNTDOWN' 
  | 'RECORDING' 
  | 'PROCESSING' 
  | 'COMPLETED';

export const InterviewRoom: React.FC<{ sessionId: string }> = ({ sessionId }) => {
  const [phase, setPhase] = useState<InterviewPhase>('INITIALIZING');
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [replayCount, setReplayCount] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const { speak, status: voiceStatus } = useVoiceEngine({
    rate: 1.0,
    pitch: 1.0,
  });

  // Example dummy question state
  const currentQuestionText = "Could you please explain the concept of Random Forests in Machine Learning?";

  // Initialize Camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // After camera is ready, greet the user
        setPhase('AI_SPEAKING');
      } catch (error) {
        console.error("Failed to access camera/mic", error);
        // Handle permissions error gracefully in a real app
      }
    };

    initCamera();

    return () => {
      // Cleanup media tracks on unmount
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Trigger AI speech when entering AI_SPEAKING phase
  useEffect(() => {
    if (phase === 'AI_SPEAKING') {
      speak(currentQuestionText, () => {
        // When AI finishes speaking, move to countdown
        setPhase('COUNTDOWN');
      });
    }
  }, [phase, speak, currentQuestionText]);

  const handleCountdownComplete = useCallback(() => {
    setPhase('RECORDING');
    // Here we would actually start the MediaRecorder API
  }, []);

  const handleRepeatQuestion = () => {
    if (replayCount >= 2) {
      speak("I'm sorry, but I can only repeat a question twice.");
      return;
    }
    setReplayCount(prev => prev + 1);
    setPhase('AI_SPEAKING'); // This will re-trigger the effect above
  };

  const handleSubmitAnswer = () => {
    // Stop recording, move to processing
    setPhase('PROCESSING');
    
    // Simulate upload/transcribe/evaluate delay
    setTimeout(() => {
      // Here we would either fetch the next question or complete
      // For now, loop back to a new question simulation
      setReplayCount(0);
      setPhase('AI_SPEAKING'); 
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      
      {/* TOP: Header & AI Status */}
      <header className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-full ${voiceStatus === 'SPEAKING' ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}>
            <User size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Ava <span className="text-sm font-normal text-slate-400 ml-2">AI Interviewer</span></h1>
            <p className="text-sm text-blue-400 font-medium">
              {phase === 'INITIALIZING' && 'Connecting...'}
              {phase === 'AI_SPEAKING' && 'Ava is speaking...'}
              {phase === 'COUNTDOWN' && 'Prepare your answer'}
              {phase === 'RECORDING' && 'Listening to your response...'}
              {phase === 'PROCESSING' && 'Evaluating response...'}
            </p>
          </div>
        </div>
        <div className="flex space-x-4">
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Session Progress</p>
            <p className="text-sm font-medium">Question 1 of 5</p>
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
            
            {phase === 'PROCESSING' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/80 backdrop-blur-lg p-8 rounded-2xl border border-slate-700 text-center"
              >
                <RefreshCw size={40} className="mx-auto mb-4 text-blue-500 animate-spin" />
                <h3 className="text-xl font-medium">Analyzing your answer...</h3>
                <p className="text-slate-400 mt-2">Transcribing and scoring response.</p>
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
