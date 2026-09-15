'use client';

import React, { useState, useEffect } from 'react';
import { 
  Camera, Mic, Eye, UserCheck, ShieldCheck, Maximize2, 
  CheckCircle2, AlertTriangle, Sparkles, Building, ArrowRight, VideoOff, Bug 
} from 'lucide-react';
import { motion } from 'framer-motion';
import StarField from '@/components/StarField';
import { EyeGazeAnalysis, FacePositionAnalysis } from '@/types/proctoring';

interface SystemCheckProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoStream: MediaStream | null;
  isFaceDetected: boolean;
  faceCount: number;
  faceAnalysis: FacePositionAnalysis;
  eyeGazeAnalysis?: EyeGazeAnalysis;
  modelLoaded: boolean;
  inferenceAvailable?: boolean;
  onStartInterview: () => void;
  onEnterFullscreen: () => Promise<void>;
}

export const ProctoringSystemCheck: React.FC<SystemCheckProps> = ({
  videoRef,
  videoStream,
  isFaceDetected,
  faceCount,
  faceAnalysis,
  eyeGazeAnalysis,
  modelLoaded,
  inferenceAvailable = true,
  onStartInterview,
  onEnterFullscreen,
}) => {
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [isFullscreenReady, setIsFullscreenReady] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Attach live MediaStream to videoRef element
  useEffect(() => {
    if (videoRef.current && videoStream) {
      if (videoRef.current.srcObject !== videoStream) {
        videoRef.current.srcObject = videoStream;
      }
    }
  }, [videoRef, videoStream]);

  useEffect(() => {
    if (videoStream) {
      const vTracks = videoStream.getVideoTracks();
      const aTracks = videoStream.getAudioTracks();
      setHasCamera(vTracks.length > 0 && vTracks[0].readyState === 'live');
      setHasMic(aTracks.length > 0 && aTracks[0].readyState === 'live');
    }
  }, [videoStream]);

  useEffect(() => {
    const handleFS = () => {
      setIsFullscreenReady(Boolean(document.fullscreenElement));
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') {
        setShowDebug((prev) => !prev);
      }
    };
    document.addEventListener('fullscreenchange', handleFS);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFS);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      if (!document.fullscreenElement) {
        await onEnterFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen optional fallback triggered');
    }
    onStartInterview();
  };

  // FAIL CLOSED SECURITY RULE: Require camera, mic, model loaded, inference available, and valid face positioning
  const isPositionValid = faceAnalysis?.isPositionValid ?? false;
  const isReadyToStart = hasCamera && hasMic && modelLoaded && inferenceAvailable && isPositionValid;

  const isPositionedGood = faceAnalysis?.state === 'FACE_POSITIONED';
  const isObstructed = faceAnalysis?.state === 'FACE_PARTIALLY_OBSTRUCTED';

  return (
    <div className="relative min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden font-sans select-none">
      {/* Background Ambience */}
      <div className="bg-scene">
        <div className="bg-ambient" />
        <StarField dark={true} />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-4xl bg-card/85 dark:bg-[#0e101e]/90 backdrop-blur-2xl p-5 sm:p-7 rounded-[32px] border border-border dark:border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.7)] space-y-5"
      >
        {/* Header Branding */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                SYSTEM CHECK & CANDIDATE POSITIONING
              </h2>
              <p className="text-xs text-zinc-400">Position yourself clearly and verify camera & eye tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Dev Debug Toggle */}
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
                showDebug ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
              }`}
              title="Toggle Dev Telemetry Debug Mode (Alt + D)"
            >
              <Bug className="w-3.5 h-3.5" />
            </button>

            {inferenceAvailable ? (
              <span className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PROCTORING READY
              </span>
            ) : (
              <span className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase text-zinc-400 bg-zinc-500/10 border border-zinc-500/20 px-3 py-1 rounded-full hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                PROCTORING UNAVAILABLE
              </span>
            )}
          </div>
        </div>

        {/* Main Content Grid: Left Live Preview | Right Checklist */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* LEFT: Live Camera Preview Container */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="relative w-full aspect-video bg-black/90 rounded-[24px] overflow-hidden border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center justify-center group">
              {/* Live Video Preview (Mirrored horizontally for natural candidate self-view) */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />

              {/* Camera Unavailable Fallback */}
              {!hasCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#070812]/95 backdrop-blur-md text-zinc-400 space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <VideoOff className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-semibold text-rose-300">Camera Access Needed</p>
                </div>
              )}

              {/* Oval Face Positioning Guide (Responds dynamically to real detection state) */}
              {hasCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-3">
                  <div className={`w-32 h-44 sm:w-40 sm:h-52 rounded-[50%] border-2 border-dashed transition-all duration-300 flex items-center justify-center ${
                    isPositionedGood
                      ? 'border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.35)] bg-emerald-500/5' 
                      : isObstructed
                      ? 'border-rose-400/80 shadow-[0_0_25px_rgba(244,63,94,0.35)] bg-rose-500/5'
                      : faceCount > 1
                      ? 'border-rose-400/80 shadow-[0_0_25px_rgba(244,63,94,0.35)]'
                      : 'border-amber-400/70 shadow-[0_0_18px_rgba(245,158,11,0.3)] bg-amber-500/5 animate-pulse'
                  }`}>
                    <span className="text-[10px] font-mono font-semibold tracking-wider text-zinc-200 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
                      {isPositionedGood ? 'Position OK' : 'Center face here'}
                    </span>
                  </div>
                </div>
              )}

              {/* AI Real-time Dynamic Detection Status Badge Overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                <div className={`px-4 py-2 rounded-full text-xs font-bold tracking-wide backdrop-blur-md border shadow-lg flex items-center gap-2 transition-all ${
                  !inferenceAvailable || !modelLoaded
                    ? 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                    : isPositionedGood
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.35)]'
                    : faceCount > 1
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.35)]'
                    : isObstructed
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                }`}>
                  {!inferenceAvailable || !modelLoaded ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span>AI face verification temporarily unavailable</span>
                    </>
                  ) : isPositionedGood ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{faceAnalysis.message}</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                      <span>{faceAnalysis.message}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Development Mode Telemetry Overlay (Face Position & Eye Gaze metrics) */}
              {showDebug && faceAnalysis.debugInfo && (
                <div className="absolute top-3 left-3 bg-black/90 backdrop-blur-md p-3 rounded-xl border border-purple-500/40 font-mono text-[10px] text-purple-200 space-y-1.5 pointer-events-none z-20 max-w-[280px]">
                  <div className="font-bold text-white border-b border-white/10 pb-1 flex items-center justify-between">
                    <span>DEV TELEMETRY</span>
                    <span className="text-emerald-400">10 FPS</span>
                  </div>

                  <div>FACES: <span className="text-white font-bold">{faceAnalysis.faceCount}</span> (Conf: {faceAnalysis.confidence})</div>
                  <div>POSITION: <span className="text-amber-300">{faceAnalysis.state}</span></div>
                  <div>CENTER (X, Y): ({faceAnalysis.debugInfo.mirroredCenterX}, {faceAnalysis.debugInfo.rawCenterY})</div>
                  <div>SIZE: {faceAnalysis.debugInfo.faceWidthRatio} × {faceAnalysis.debugInfo.faceHeightRatio} (Area: {faceAnalysis.areaRatio})</div>

                  {eyeGazeAnalysis && (
                    <div className="border-t border-white/10 pt-1 space-y-0.5">
                      <div>GAZE DIRECTION: <span className="text-emerald-300 font-bold">{eyeGazeAnalysis.direction}</span></div>
                      <div>LEFT EYE: {eyeGazeAnalysis.leftEyeVisible ? '[Visible]' : '[Hidden]'} (Iris X: {eyeGazeAnalysis.leftIrisXRatio})</div>
                      <div>RIGHT EYE: {eyeGazeAnalysis.rightEyeVisible ? '[Visible]' : '[Hidden]'} (Iris X: {eyeGazeAnalysis.rightIrisXRatio})</div>
                      <div>BLENDSHAPES: L-Out: {eyeGazeAnalysis.gazeLeftScore} | R-Out: {eyeGazeAnalysis.gazeRightScore} | Blink: {eyeGazeAnalysis.blinkScore}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 mt-2 text-center">
              Candidate preview is mirrored for natural positioning. Recorded video remains properly oriented.
            </p>
          </div>

          {/* RIGHT: Checklist & Start Action */}
          <div className="md:col-span-5 space-y-3">
            {/* Security Notice */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-[11px] text-zinc-300 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <p>
                Automated proctoring monitors camera presence, gaze direction, candidate positioning, tab switching, and fullscreen status.
              </p>
            </div>

            {/* Diagnostic Checks List */}
            <div className="space-y-2">
              {/* 1. Camera */}
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-card/40 dark:bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2.5">
                  <Camera className={`w-3.5 h-3.5 ${hasCamera ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span className="text-xs font-semibold text-zinc-200">Camera Feed</span>
                </div>
                <div className="text-xs font-mono font-bold">
                  {hasCamera ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
                  ) : (
                    <span className="text-rose-400">Required</span>
                  )}
                </div>
              </div>

              {/* 2. Microphone */}
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-card/40 dark:bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2.5">
                  <Mic className={`w-3.5 h-3.5 ${hasMic ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span className="text-xs font-semibold text-zinc-200">Microphone Audio</span>
                </div>
                <div className="text-xs font-mono font-bold">
                  {hasMic ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
                  ) : (
                    <span className="text-rose-400">Required</span>
                  )}
                </div>
              </div>

              {/* 3. AI Face Vision & Positioning */}
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-card/40 dark:bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2.5">
                  <Eye className={`w-3.5 h-3.5 ${isPositionValid ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-xs font-semibold text-zinc-200">Face Positioning</span>
                </div>
                <div className="text-xs font-mono font-bold">
                  {!inferenceAvailable || !modelLoaded ? (
                    <span className="text-zinc-400">Unavailable</span>
                  ) : isPositionValid ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Positioned</span>
                  ) : (
                    <span className="text-amber-400">Adjust Position</span>
                  )}
                </div>
              </div>

              {/* 4. Single Candidate Check */}
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-card/40 dark:bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2.5">
                  <UserCheck className={`w-3.5 h-3.5 ${faceCount === 1 ? 'text-emerald-400' : 'text-rose-400'}`} />
                  <span className="text-xs font-semibold text-zinc-200">Single Candidate</span>
                </div>
                <div className="text-xs font-mono font-bold">
                  {faceCount === 1 ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>
                  ) : faceCount > 1 ? (
                    <span className="text-rose-400">Multiple People</span>
                  ) : (
                    <span className="text-zinc-400">Waiting...</span>
                  )}
                </div>
              </div>

              {/* 5. Fullscreen Readiness */}
              <div className="flex items-center justify-between p-2.5 px-3.5 rounded-xl bg-card/40 dark:bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-2.5">
                  <Maximize2 className={`w-3.5 h-3.5 ${isFullscreenReady ? 'text-emerald-400' : 'text-purple-400'}`} />
                  <span className="text-xs font-semibold text-zinc-200">Fullscreen Mode</span>
                </div>
                <div className="text-xs font-mono font-bold">
                  {isFullscreenReady ? (
                    <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Active</span>
                  ) : (
                    <span className="text-purple-300">Required</span>
                  )}
                </div>
              </div>
            </div>

            {/* Start Action */}
            <div className="pt-1">
              <button
                onClick={handleStart}
                disabled={!isReadyToStart || isStarting}
                className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(139,92,246,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed border-0"
              >
                <span>{isStarting ? 'Entering Fullscreen...' : 'Enter Fullscreen & Start Interview'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
