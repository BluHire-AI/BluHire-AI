import { EyeGazeAnalysis, GazeDirection } from '@/types/proctoring';

/**
 * Calculates candidate eye gaze direction and eye tracking metrics from MediaPipe FaceLandmarker
 * blendshapes and iris 3D landmarks.
 *
 * @param faceLandmarks 468/478 face landmarks array
 * @param faceBlendshapes Blendshapes categories array returned when outputFaceBlendshapes is enabled
 */
export function estimateEyeGaze(
  faceLandmarks: any[] | null,
  faceBlendshapes: any[] | null
): EyeGazeAnalysis {
  if (!faceLandmarks || faceLandmarks.length === 0) {
    return {
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
    };
  }

  const landmarks = faceLandmarks[0];

  // 1. Extract Blendshape Categories if available
  const blendMap: Record<string, number> = {};
  if (faceBlendshapes && faceBlendshapes.length > 0 && faceBlendshapes[0].categories) {
    for (const c of faceBlendshapes[0].categories) {
      blendMap[c.categoryName] = c.score;
    }
  }

  // Blendshape Scores
  const blinkLeft = blendMap['eyeBlinkLeft'] ?? 0;
  const blinkRight = blendMap['eyeBlinkRight'] ?? 0;
  const blinkScore = (blinkLeft + blinkRight) / 2;

  const gazeLeftScore = ((blendMap['eyeLookOutLeft'] ?? 0) + (blendMap['eyeLookInRight'] ?? 0)) / 2;
  const gazeRightScore = ((blendMap['eyeLookInLeft'] ?? 0) + (blendMap['eyeLookOutRight'] ?? 0)) / 2;
  const gazeUpScore = ((blendMap['eyeLookUpLeft'] ?? 0) + (blendMap['eyeLookUpRight'] ?? 0)) / 2;
  const gazeDownScore = ((blendMap['eyeLookDownLeft'] ?? 0) + (blendMap['eyeLookDownRight'] ?? 0)) / 2;

  // 2. Iris Landmark Ratios (Landmarks 468 left iris, 473 right iris)
  // Left eye outer: 33, inner: 133 | Right eye outer: 263, inner: 362
  let leftIrisXRatio = 0.5;
  let rightIrisXRatio = 0.5;
  let leftEyeVisible = false;
  let rightEyeVisible = false;

  if (landmarks[33] && landmarks[133] && landmarks[468]) {
    leftEyeVisible = true;
    const outerX = landmarks[33].x;
    const innerX = landmarks[133].x;
    const irisX = landmarks[468].x;
    const eyeWidth = Math.abs(innerX - outerX);
    if (eyeWidth > 0.005) {
      leftIrisXRatio = Math.max(0, Math.min(1, (irisX - outerX) / eyeWidth));
    }
  }

  if (landmarks[263] && landmarks[362] && landmarks[473]) {
    rightEyeVisible = true;
    const outerX = landmarks[263].x;
    const innerX = landmarks[362].x;
    const irisX = landmarks[473].x;
    const eyeWidth = Math.abs(outerX - innerX);
    if (eyeWidth > 0.005) {
      rightIrisXRatio = Math.max(0, Math.min(1, (irisX - innerX) / eyeWidth));
    }
  }

  // 3. Determine Derived Gaze Direction
  let direction: GazeDirection = 'LOOKING_CENTER';

  if (!leftEyeVisible && !rightEyeVisible) {
    direction = 'GAZE_UNKNOWN';
  } else if (blinkScore > 0.60) {
    direction = 'BLINKING';
  } else if (gazeLeftScore > 0.35 || (leftIrisXRatio < 0.28 && rightIrisXRatio < 0.28)) {
    // Note: Mirrored candidate view adjustment
    direction = 'LOOKING_LEFT';
  } else if (gazeRightScore > 0.35 || (leftIrisXRatio > 0.72 && rightIrisXRatio > 0.72)) {
    direction = 'LOOKING_RIGHT';
  } else if (gazeUpScore > 0.35) {
    direction = 'LOOKING_UP';
  } else if (gazeDownScore > 0.40) {
    direction = 'LOOKING_DOWN';
  } else {
    direction = 'LOOKING_CENTER';
  }

  const isGazeCentered = direction === 'LOOKING_CENTER' || direction === 'BLINKING';

  return {
    direction,
    isGazeCentered,
    leftEyeVisible,
    rightEyeVisible,
    leftIrisXRatio: Number(leftIrisXRatio.toFixed(2)),
    rightIrisXRatio: Number(rightIrisXRatio.toFixed(2)),
    gazeLeftScore: Number(gazeLeftScore.toFixed(2)),
    gazeRightScore: Number(gazeRightScore.toFixed(2)),
    gazeUpScore: Number(gazeUpScore.toFixed(2)),
    gazeDownScore: Number(gazeDownScore.toFixed(2)),
    blinkScore: Number(blinkScore.toFixed(2)),
    confidence: leftEyeVisible && rightEyeVisible ? 0.92 : 0.60,
  };
}
