'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  ProctoringConfig,
  DEFAULT_PROCTORING_CONFIG,
  ProctoringEvent,
  ProctoringEventType,
  ProctoringStateStatus,
  ProctoringMetrics,
  EventSeverity,
  FacePositionAnalysis,
  EyeGazeAnalysis,
} from '@/types/proctoring';
import { validateFacePosition } from '@/lib/facePositionValidator';
import { estimateEyeGaze } from '@/lib/gazeEstimator';

interface UseInterviewProctoringOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  token: string;
  enabled?: boolean;
  config?: Partial<ProctoringConfig>;
}

export function useInterviewProctoring({
  videoRef,
  token,
  enabled = true,
  config: customConfig,
}: UseInterviewProctoringOptions) {
  // Stable config reference to prevent un-memoized useEffect restarts
  const config = useMemo(() => ({ ...DEFAULT_PROCTORING_CONFIG, ...customConfig }), [customConfig]);
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const [status, setStatus] = useState<ProctoringStateStatus>('ACTIVE');
  const [riskScore, setRiskScore] = useState<number>(0);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [events, setEvents] = useState<ProctoringEvent[]>([]);
  const [metrics, setMetrics] = useState<ProctoringMetrics>({
    gazeAwayCount: 0,
    faceMissingCount: 0,
    multipleFaceCount: 0,
    tabSwitchCount: 0,
    windowBlurCount: 0,
    fullscreenExitCount: 0,
    copyPasteCount: 0,
    cameraDisconnectCount: 0,
    totalInactiveTimeMs: 0,
  });

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isFaceDetected, setIsFaceDetected] = useState<boolean>(false);
  const [faceCount, setFaceCount] = useState<number>(0);
  const [modelLoaded, setModelLoaded] = useState<boolean>(false);
  const [inferenceAvailable, setInferenceAvailable] = useState<boolean>(true);

  // Position & Gaze Analysis States
  const [faceAnalysis, setFaceAnalysis] = useState<FacePositionAnalysis>({
    state: 'FACE_NOT_DETECTED',
    isPositionValid: false,
    message: '⚠ Move into camera view',
    faceCount: 0,
    centerX: 0,
    centerY: 0,
    widthRatio: 0,
    heightRatio: 0,
    areaRatio: 0,
    occlusionRatio: 0,
    confidence: 0,
  });

  const [eyeGazeAnalysis, setEyeGazeAnalysis] = useState<EyeGazeAnalysis>({
    direction: 'GAZE_UNKNOWN',
    isGazeCentered: false,
    leftEyeVisible: false,
    rightEyeVisible: false,
    leftIrisXRatio: 0.5,
    rightIrisXRatio: 0.5,
    gazeLeftScore: 0,
    gazeRightScore: 0,
    gazeUpScore: 0,
    gazeDownScore: 0,
    blinkScore: 0,
    confidence: 0,
  });

  // Timers and State Refs for temporal smoothing and inference locking
  const landmarkerRef = useRef<any>(null);
  const landmarkerReadyRef = useRef<boolean>(false);
  const inferenceInProgressRef = useRef<boolean>(false);

  const animFrameIdRef = useRef<number | null>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const lastVideoTimestampRef = useRef<number>(-1);
  const analysisHistoryRef = useRef<FacePositionAnalysis[]>([]);
  const gazeHistoryRef = useRef<EyeGazeAnalysis[]>([]);

  // Tracking violation state start times
  const gazeAwayStartRef = useRef<number | null>(null);
  const gazeAwayEventFiredRef = useRef<boolean>(false);

  const faceMissingStartRef = useRef<number | null>(null);
  const faceMissingEventFiredRef = useRef<boolean>(false);

  const multipleFaceStartRef = useRef<number | null>(null);
  const multipleFaceEventFiredRef = useRef<boolean>(false);

  const tabSwitchStartRef = useRef<number | null>(null);
  const blurStartRef = useRef<number | null>(null);
  const fullscreenExitStartRef = useRef<number | null>(null);

  // Helper to emit proctoring events (deduplicated)
  const emitProctoringEvent = useCallback(
    async (
      type: ProctoringEventType,
      severity: EventSeverity,
      confidence: number,
      durationMs: number = 0,
      metadata: Record<string, any> = {}
    ) => {
      const newEvent: ProctoringEvent = {
        type,
        timestamp: new Date().toISOString(),
        severity,
        confidence,
        durationMs,
        metadata,
      };

      setEvents((prev) => [...prev, newEvent]);

      setMetrics((prev) => {
        const next = { ...prev };
        if (type === 'GAZE_AWAY') next.gazeAwayCount += 1;
        else if (type === 'FACE_NOT_DETECTED') next.faceMissingCount += 1;
        else if (type === 'MULTIPLE_FACES_DETECTED') next.multipleFaceCount += 1;
        else if (type === 'TAB_SWITCH') next.tabSwitchCount += 1;
        else if (type === 'WINDOW_BLUR') next.windowBlurCount += 1;
        else if (type === 'FULLSCREEN_EXIT') next.fullscreenExitCount += 1;
        else if (type === 'COPY_ATTEMPT' || type === 'PASTE_ATTEMPT' || type === 'CONTEXT_MENU_ATTEMPT') next.copyPasteCount += 1;
        else if (type === 'CAMERA_DISABLED' || type === 'CAMERA_DISCONNECTED') next.cameraDisconnectCount += 1;
        return next;
      });

      setRiskScore((prevScore) => {
        let delta = 0;
        if (type === 'GAZE_AWAY') delta = 8;
        else if (type === 'FACE_NOT_DETECTED') delta = 10;
        else if (type === 'MULTIPLE_FACES_DETECTED') delta = 20;
        else if (type === 'TAB_SWITCH') delta = 15;
        else if (type === 'WINDOW_BLUR') delta = 10;
        else if (type === 'FULLSCREEN_EXIT') delta = 15;
        else if (type === 'COPY_ATTEMPT' || type === 'PASTE_ATTEMPT') delta = 8;
        else if (type === 'CAMERA_DISABLED') delta = 15;
        return Math.min(100, prevScore + delta);
      });

      if (token) {
        try {
          await api.post(`/interviews/public/${token}/proctoring-event`, newEvent);
        } catch (err) {
          console.warn('[proctoring] Failed to log proctoring event to backend:', err);
        }
      }
    },
    [token]
  );

  const emitEventRef = useRef(emitProctoringEvent);
  useEffect(() => {
    emitEventRef.current = emitProctoringEvent;
  }, [emitProctoringEvent]);

  // ─── 1. Initialize MediaPipe Face Landmarker ────────────────────────────────
  useEffect(() => {
    if (!enabled) return;

    let isMounted = true;

    const initMediaPipe = async () => {
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (!isMounted) return;

        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numFaces: 5,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
        });

        if (isMounted) {
          landmarkerRef.current = landmarker;
          landmarkerReadyRef.current = true;
          setModelLoaded(true);
          setInferenceAvailable(true);
          console.log('[PROCTORING] Landmarker initialized cleanly with outputFaceBlendshapes.');
        }
      } catch (err) {
        console.error('[PROCTORING] Failed to load MediaPipe FaceLandmarker:', err);
        if (isMounted) {
          landmarkerReadyRef.current = false;
          setInferenceAvailable(false);
          setStatus('UNAVAILABLE');
          setActiveWarning('⚠ AI proctoring vision model unavailable.');
          emitEventRef.current('PROCTORING_UNAVAILABLE', 'low', 1.0, 0, { error: String(err) });
        }
      }
    };

    initMediaPipe();

    return () => {
      isMounted = false;
      landmarkerReadyRef.current = false;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
          console.log('[PROCTORING] Landmarker disposed');
        } catch (e) {
          console.warn('[PROCTORING] Landmarker close warning:', e);
        }
        landmarkerRef.current = null;
      }
    };
  }, [enabled]);

  // ─── 2. Real-time Inference Loop (10 FPS) ──────────────────────────────────
  useEffect(() => {
    if (!enabled || !modelLoaded) return;

    let isRunning = true;
    console.log('[PROCTORING] Inference loop started');

    const processFrame = () => {
      if (!isRunning) return;

      // Concurrency lock check & model readiness validation
      if (
        inferenceInProgressRef.current ||
        !landmarkerReadyRef.current ||
        !landmarkerRef.current
      ) {
        if (isRunning) {
          animFrameIdRef.current = requestAnimationFrame(processFrame);
        }
        return;
      }

      const video = videoRef.current;
      const now = Date.now();
      const perfNow = performance.now();
      const timestampMs = Math.round(perfNow);

      const isStreamActive = video?.srcObject instanceof MediaStream ? video.srcObject.active : false;

      // Strict video element readiness validation before calling WASM detectForVideo
      if (
        video &&
        video.srcObject &&
        isStreamActive &&
        video.readyState >= 3 && // HTMLMediaElement.HAVE_FUTURE_DATA (3) or HAVE_ENOUGH_DATA (4)
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        !video.paused &&
        !video.ended &&
        timestampMs > lastVideoTimestampRef.current &&
        timestampMs - lastProcessTimeRef.current >= 100 // ~10 FPS limit
      ) {
        // Acquire lock
        inferenceInProgressRef.current = true;
        lastProcessTimeRef.current = timestampMs;
        lastVideoTimestampRef.current = timestampMs;

        try {
          const results = landmarkerRef.current.detectForVideo(video, timestampMs);
          const numFaces = results?.faceLandmarks?.length ?? 0;

          setFaceCount(numFaces);
          setIsFaceDetected(numFaces > 0);

          // 1. Compute Face Bounding Box & Occlusion Positioning Analysis
          const rawAnalysis = validateFacePosition(
            results?.faceLandmarks || null,
            numFaces,
            video.videoWidth,
            video.videoHeight
          );

          // Rolling buffer of 4 frames for temporal hysteresis
          analysisHistoryRef.current.push(rawAnalysis);
          if (analysisHistoryRef.current.length > 4) {
            analysisHistoryRef.current.shift();
          }

          const stateCounts: Record<string, number> = {};
          let maxCount = 0;
          let stableAnalysis = rawAnalysis;

          for (const item of analysisHistoryRef.current) {
            stateCounts[item.state] = (stateCounts[item.state] || 0) + 1;
            if (stateCounts[item.state] > maxCount) {
              maxCount = stateCounts[item.state];
              stableAnalysis = item;
            }
          }

          setFaceAnalysis(stableAnalysis);

          // 2. Compute Eye Gaze & Blendshape Estimation
          const rawGaze = estimateEyeGaze(
            results?.faceLandmarks || null,
            results?.faceBlendshapes || null
          );

          gazeHistoryRef.current.push(rawGaze);
          if (gazeHistoryRef.current.length > 4) {
            gazeHistoryRef.current.shift();
          }

          const gazeCounts: Record<string, number> = {};
          let maxGazeCount = 0;
          let stableGaze = rawGaze;

          for (const item of gazeHistoryRef.current) {
            gazeCounts[item.direction] = (gazeCounts[item.direction] || 0) + 1;
            if (gazeCounts[item.direction] > maxGazeCount) {
              maxGazeCount = gazeCounts[item.direction];
              stableGaze = item;
            }
          }

          setEyeGazeAnalysis(stableGaze);

          // A. FACE PRESENCE LOGIC
          if (numFaces === 0) {
            if (!faceMissingStartRef.current) {
              faceMissingStartRef.current = now;
              faceMissingEventFiredRef.current = false;
            }

            const missingDuration = now - faceMissingStartRef.current;

            if (missingDuration >= configRef.current.faceMissingWarningMs) {
              setStatus('WARNING');
              setActiveWarning('⚠ CAMERA VIEW REQUIRED: Please remain visible to the camera.');
            }

            if (missingDuration >= configRef.current.faceMissingEventMs && !faceMissingEventFiredRef.current) {
              faceMissingEventFiredRef.current = true;
              emitEventRef.current('FACE_NOT_DETECTED', 'high', 0.95, missingDuration);
            }
          } else {
            if (faceMissingStartRef.current) {
              faceMissingStartRef.current = null;
              faceMissingEventFiredRef.current = false;
              setActiveWarning((prev) => (prev?.includes('CAMERA VIEW REQUIRED') ? null : prev));
            }
          }

          // B. MULTIPLE FACE DETECTION LOGIC
          if (numFaces > 1) {
            if (!multipleFaceStartRef.current) {
              multipleFaceStartRef.current = now;
              multipleFaceEventFiredRef.current = false;
            }

            const multiDuration = now - multipleFaceStartRef.current;

            if (multiDuration >= configRef.current.multipleFaceWarningMs) {
              setStatus('WARNING');
              setActiveWarning('⚠ MULTIPLE FACES DETECTED: Please ensure you are alone during the interview.');
            }

            if (multiDuration >= configRef.current.multipleFaceEventMs && !multipleFaceEventFiredRef.current) {
              multipleFaceEventFiredRef.current = true;
              emitEventRef.current('MULTIPLE_FACES_DETECTED', 'critical', 0.98, multiDuration, { numberOfFaces: numFaces });
            }
          } else {
            if (multipleFaceStartRef.current) {
              multipleFaceStartRef.current = null;
              multipleFaceEventFiredRef.current = false;
              setActiveWarning((prev) => (prev?.includes('MULTIPLE FACES DETECTED') ? null : prev));
            }
          }

          // C. EYE GAZE TRACKING LOGIC (Single Face)
          if (numFaces === 1) {
            const isGazeAway = !stableGaze.isGazeCentered && stableGaze.direction !== 'BLINKING';

            if (isGazeAway) {
              if (!gazeAwayStartRef.current) {
                gazeAwayStartRef.current = now;
                gazeAwayEventFiredRef.current = false;
              }

              const gazeDuration = now - gazeAwayStartRef.current;

              if (gazeDuration >= configRef.current.gazeAwayWarningMs) {
                setStatus('WARNING');
                setActiveWarning(`⚠ PLEASE LOOK TOWARD THE SCREEN: Keep your gaze directed at the assessment (${stableGaze.direction.replace('LOOKING_', '')}).`);
              }

              if (gazeDuration >= configRef.current.gazeAwayEventMs && !gazeAwayEventFiredRef.current) {
                gazeAwayEventFiredRef.current = true;
                emitEventRef.current('GAZE_AWAY', 'medium', 0.88, gazeDuration, { direction: stableGaze.direction });
              }
            } else {
              if (gazeAwayStartRef.current) {
                gazeAwayStartRef.current = null;
                gazeAwayEventFiredRef.current = false;
                setActiveWarning((prev) => (prev?.includes('LOOK TOWARD THE SCREEN') ? null : prev));
              }
            }
          }

          // Restore ACTIVE state if no active warnings
          if (numFaces === 1 && !gazeAwayStartRef.current && !faceMissingStartRef.current && !multipleFaceStartRef.current) {
            setStatus('ACTIVE');
          }
        } catch (err: any) {
          // EXPLICIT DIAGNOSTIC ERROR TELEMETRY
          console.error('[PROCTORING][FACELANDMARKER][DETECT_ERROR]', err);
          console.error('[PROCTORING][FACELANDMARKER][STATE]', {
            timestampMs,
            lastVideoTimestamp: lastVideoTimestampRef.current,
            videoReadyState: video?.readyState,
            videoWidth: video?.videoWidth,
            videoHeight: video?.videoHeight,
            currentTime: video?.currentTime,
            paused: video?.paused,
            ended: video?.ended,
            srcObject: !!video?.srcObject,
            streamActive: isStreamActive,
            landmarkerExists: !!landmarkerRef.current,
            runningMode: 'VIDEO',
          });

          // FAIL CLOSED SECURITY ENFORCEMENT: NEVER set positionGood = true when inference fails!
          setInferenceAvailable(false);
          setStatus('UNAVAILABLE');
          setActiveWarning('⚠ AI face verification temporarily unavailable.');

          setFaceAnalysis({
            state: 'ANALYSIS_UNAVAILABLE',
            isPositionValid: false,
            message: '⚠ AI face verification temporarily unavailable',
            faceCount: 0,
            centerX: 0,
            centerY: 0,
            widthRatio: 0,
            heightRatio: 0,
            areaRatio: 0,
            occlusionRatio: 0,
            confidence: 0,
          });

          setEyeGazeAnalysis({
            direction: 'GAZE_UNKNOWN',
            isGazeCentered: false,
            leftEyeVisible: false,
            rightEyeVisible: false,
            leftIrisXRatio: 0,
            rightIrisXRatio: 0,
            gazeLeftScore: 0,
            gazeRightScore: 0,
            gazeUpScore: 0,
            gazeDownScore: 0,
            blinkScore: 0,
            confidence: 0,
          });
        } finally {
          inferenceInProgressRef.current = false;
        }
      }

      if (isRunning) {
        animFrameIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      console.log('[PROCTORING] Inference loop stopped');
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [enabled, modelLoaded]);

  // ─── 3. Browser Visibility & Window Focus Listeners ──────────────────────────
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.hidden) {
        tabSwitchStartRef.current = now;
        setStatus('INTERRUPTED');
        setActiveWarning('⚠ INTERVIEW TAB INACTIVE: Please remain on the interview screen.');
        emitEventRef.current('TAB_SWITCH', 'high', 1.0, 0);
      } else {
        if (tabSwitchStartRef.current) {
          const inactiveDuration = now - tabSwitchStartRef.current;
          tabSwitchStartRef.current = null;
          setMetrics((prev) => ({
            ...prev,
            totalInactiveTimeMs: prev.totalInactiveTimeMs + inactiveDuration,
          }));
        }
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      blurStartRef.current = now;
      emitEventRef.current('WINDOW_BLUR', 'high', 1.0, 0);
    };

    const handleWindowFocus = () => {
      if (blurStartRef.current) {
        const blurDuration = Date.now() - blurStartRef.current;
        blurStartRef.current = null;
        emitEventRef.current('WINDOW_FOCUS_RETURNED', 'low', 1.0, blurDuration);
      }
    };

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);

      if (!isFull && configRef.current.enableFullscreenRequirement) {
        fullscreenExitStartRef.current = Date.now();
        setStatus('WARNING');
        setActiveWarning('⚠ PLEASE RETURN TO FULLSCREEN: Fullscreen mode is required.');
        emitEventRef.current('FULLSCREEN_EXIT', 'high', 1.0, 0);
      } else if (isFull) {
        fullscreenExitStartRef.current = null;
        setActiveWarning((prev) => (prev?.includes('RETURN TO FULLSCREEN') ? null : prev));
      }
    };

    const handleCopy = () => {
      if (configRef.current.enableCopyPasteDetection) {
        emitEventRef.current('COPY_ATTEMPT', 'medium', 1.0, 0);
      }
    };
    const handlePaste = () => {
      if (configRef.current.enableCopyPasteDetection) {
        emitEventRef.current('PASTE_ATTEMPT', 'medium', 1.0, 0);
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      if (configRef.current.enableCopyPasteDetection) {
        emitEventRef.current('CONTEXT_MENU_ATTEMPT', 'low', 1.0, 0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [enabled]);

  // ─── 4. Stream Disconnect Monitor ──────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !videoRef.current) return;

    const stream = videoRef.current.srcObject as MediaStream | null;
    if (!stream) return;

    const videoTrack = stream.getVideoTracks()[0];
    const audioTrack = stream.getAudioTracks()[0];

    const handleVideoEnded = () => {
      setStatus('INTERRUPTED');
      setActiveWarning('⚠ CAMERA DISCONNECTED: Camera connection lost. Please restore camera access.');
      emitEventRef.current('CAMERA_DISCONNECTED', 'critical', 1.0, 0);
    };

    const handleAudioEnded = () => {
      setActiveWarning('⚠ MICROPHONE DISCONNECTED: Microphone connection lost.');
      emitEventRef.current('MICROPHONE_DISABLED', 'high', 1.0, 0);
    };

    videoTrack?.addEventListener('ended', handleVideoEnded);
    audioTrack?.addEventListener('ended', handleAudioEnded);

    return () => {
      videoTrack?.removeEventListener('ended', handleVideoEnded);
      audioTrack?.removeEventListener('ended', handleAudioEnded);
    };
  }, [enabled, videoRef]);

  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (err) {
      console.warn('[useInterviewProctoring] Fullscreen request denied:', err);
    }
  }, []);

  return {
    status,
    riskScore,
    activeWarning,
    events,
    metrics,
    isFullscreen,
    isFaceDetected,
    faceCount,
    faceAnalysis,
    eyeGazeAnalysis,
    modelLoaded,
    inferenceAvailable,
    enterFullscreen,
    emitProctoringEvent,
  };
}
