export type ProctoringEventType =
  | 'GAZE_AWAY'
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES_DETECTED'
  | 'FACE_OFF_CENTER'
  | 'FACE_TOO_FAR'
  | 'FACE_TOO_CLOSE'
  | 'FACE_PARTIALLY_OBSTRUCTED'
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'WINDOW_FOCUS_RETURNED'
  | 'FULLSCREEN_EXIT'
  | 'CAMERA_DISABLED'
  | 'CAMERA_DISCONNECTED'
  | 'MICROPHONE_DISABLED'
  | 'SCREEN_SHARE_STOPPED'
  | 'COPY_ATTEMPT'
  | 'PASTE_ATTEMPT'
  | 'CONTEXT_MENU_ATTEMPT'
  | 'PROCTORING_UNAVAILABLE';

export type EventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ProctoringEvent {
  id?: string;
  type: ProctoringEventType;
  timestamp: string;
  durationMs?: number;
  severity: EventSeverity;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface ProctoringConfig {
  gazeAwayWarningMs: number;       // Time in ms before warning candidate (e.g. 1500)
  gazeAwayEventMs: number;         // Time in ms before firing GAZE_AWAY event (e.g. 3000)
  faceMissingWarningMs: number;    // Time in ms before warning (e.g. 1200)
  faceMissingEventMs: number;      // Time in ms before event (e.g. 2500)
  multipleFaceWarningMs: number;   // Time in ms before warning (e.g. 1200)
  multipleFaceEventMs: number;     // Time in ms before event (e.g. 2500)
  enableFullscreenRequirement: boolean;
  enableCopyPasteDetection: boolean;
  enableScreenSharingMode?: boolean;
}

export const DEFAULT_PROCTORING_CONFIG: ProctoringConfig = {
  gazeAwayWarningMs: 1800,
  gazeAwayEventMs: 3500,
  faceMissingWarningMs: 1500,
  faceMissingEventMs: 3000,
  multipleFaceWarningMs: 1500,
  multipleFaceEventMs: 3000,
  enableFullscreenRequirement: true,
  enableCopyPasteDetection: true,
  enableScreenSharingMode: false,
};

export type ProctoringStateStatus =
  | 'ACTIVE'
  | 'WARNING'
  | 'INTERRUPTED'
  | 'UNAVAILABLE';

export interface ProctoringMetrics {
  gazeAwayCount: number;
  faceMissingCount: number;
  multipleFaceCount: number;
  tabSwitchCount: number;
  windowBlurCount: number;
  fullscreenExitCount: number;
  copyPasteCount: number;
  cameraDisconnectCount: number;
  totalInactiveTimeMs: number;
}

export type FacePositionState =
  | 'FACE_NOT_DETECTED'
  | 'MULTIPLE_FACES'
  | 'FACE_PARTIALLY_OBSTRUCTED'
  | 'FACE_TOO_FAR'
  | 'FACE_TOO_CLOSE'
  | 'FACE_OFF_CENTER_LEFT'
  | 'FACE_OFF_CENTER_RIGHT'
  | 'FACE_OFF_CENTER_UP'
  | 'FACE_OFF_CENTER_DOWN'
  | 'FACE_POSITIONED'
  | 'ANALYSIS_UNAVAILABLE';

export interface FacePositionAnalysis {
  state: FacePositionState;
  isPositionValid: boolean;
  message: string;
  faceCount: number;
  centerX: number;        // Normalized (0.0 - 1.0)
  centerY: number;        // Normalized (0.0 - 1.0)
  widthRatio: number;     // Normalized face width relative to frame
  heightRatio: number;    // Normalized face height relative to frame
  areaRatio: number;      // Normalized area
  occlusionRatio: number; // Ratio of missing / low-confidence key landmarks
  confidence: number;     // Detection confidence
  debugInfo?: {
    rawCenterX: number;
    rawCenterY: number;
    mirroredCenterX: number;
    faceWidthRatio: number;
    faceHeightRatio: number;
    videoWidth: number;
    videoHeight: number;
    keyLandmarksPresent: number;
    totalKeyLandmarks: number;
  };
}

export type GazeDirection =
  | 'LOOKING_CENTER'
  | 'LOOKING_LEFT'
  | 'LOOKING_RIGHT'
  | 'LOOKING_UP'
  | 'LOOKING_DOWN'
  | 'BLINKING'
  | 'GAZE_UNKNOWN';

export interface EyeGazeAnalysis {
  direction: GazeDirection;
  isGazeCentered: boolean;
  leftEyeVisible: boolean;
  rightEyeVisible: boolean;
  leftIrisXRatio: number;
  rightIrisXRatio: number;
  gazeLeftScore: number;
  gazeRightScore: number;
  gazeUpScore: number;
  gazeDownScore: number;
  blinkScore: number;
  confidence: number;
}
