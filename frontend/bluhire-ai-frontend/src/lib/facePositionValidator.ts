import { FacePositionAnalysis, FacePositionState } from '@/types/proctoring';

/**
 * Validates candidate face position, bounds, occlusion, and distance relative to normalized video frame.
 *
 * @param landmarks MediaPipe 468/478 face landmarks array (or null)
 * @param faceCount Total detected faces
 * @param videoWidth Pixel width of HTMLVideoElement
 * @param videoHeight Pixel height of HTMLVideoElement
 */
export function validateFacePosition(
  landmarks: any[] | null,
  faceCount: number,
  videoWidth: number = 640,
  videoHeight: number = 480
): FacePositionAnalysis {
  // Case 1: No faces detected
  if (faceCount === 0 || !landmarks || landmarks.length === 0) {
    return {
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
    };
  }

  // Case 2: Multiple faces detected
  if (faceCount > 1) {
    return {
      state: 'MULTIPLE_FACES',
      isPositionValid: false,
      message: '⚠ Multiple faces detected — Only one person should be visible',
      faceCount,
      centerX: 0.5,
      centerY: 0.5,
      widthRatio: 0.3,
      heightRatio: 0.4,
      areaRatio: 0.12,
      occlusionRatio: 0,
      confidence: 0.95,
    };
  }

  // Single face analysis
  const faceMesh = landmarks[0];
  if (!faceMesh || faceMesh.length === 0) {
    return {
      state: 'ANALYSIS_UNAVAILABLE',
      isPositionValid: false,
      message: 'Unable to analyze face position',
      faceCount: 1,
      centerX: 0,
      centerY: 0,
      widthRatio: 0,
      heightRatio: 0,
      areaRatio: 0,
      occlusionRatio: 0,
      confidence: 0,
    };
  }

  // Calculate raw normalized bounding box coordinates [0.0, 1.0]
  let minX = 1.0;
  let maxX = 0.0;
  let minY = 1.0;
  let maxY = 0.0;

  for (let i = 0; i < faceMesh.length; i++) {
    const pt = faceMesh[i];
    if (pt.x < minX) minX = pt.x;
    if (pt.x > maxX) maxX = pt.x;
    if (pt.y < minY) minY = pt.y;
    if (pt.y > maxY) maxY = pt.y;
  }

  const faceWidthRatio = maxX - minX;
  const faceHeightRatio = maxY - minY;
  const rawCenterX = (minX + maxX) / 2;
  const rawCenterY = (minY + maxY) / 2;
  const areaRatio = faceWidthRatio * faceHeightRatio;

  // Mirrored CenterX calculation:
  // Candidate self-view preview uses CSS `scale-x-[-1]` (horizontal flip).
  // In the mirrored view, screen-left corresponds to `1.0 - rawCenterX`.
  const mirroredCenterX = 1.0 - rawCenterX;

  // ─── Occlusion / Hand-on-Face Detection ───────────────────────────────────
  // Key facial landmark indices in MediaPipe 468 mesh:
  // Left eye outer: 33, Left eye inner: 133
  // Right eye outer: 263, Right eye inner: 362
  // Nose tip: 1
  // Mouth left corner: 61, Mouth right corner: 291
  // Chin tip: 152
  const leftEyeOuter = faceMesh[33];
  const rightEyeOuter = faceMesh[263];
  const noseTip = faceMesh[1];
  const mouthLeft = faceMesh[61];
  const mouthRight = faceMesh[291];
  const chin = faceMesh[152];

  let isObstructed = false;
  let occlusionRatio = 0;

  if (leftEyeOuter && rightEyeOuter && noseTip && mouthLeft && mouthRight && chin) {
    // 1. Eye-span vs Total Face Width proportion check:
    const eyeSpan = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
    const eyeWidthRatio = eyeSpan / (faceWidthRatio || 1);

    // 2. Mouth-span vs Total Face Width proportion check:
    const mouthSpan = Math.abs(mouthRight.x - mouthLeft.x);
    const mouthWidthRatio = mouthSpan / (faceWidthRatio || 1);

    // 3. Vertical alignment ratio:
    const noseToMouthDist = Math.abs((mouthLeft.y + mouthRight.y) / 2 - noseTip.y);
    const vertRatio = noseToMouthDist / (faceHeightRatio || 1);

    // If hand obscures lower face, eyes, or cheek: proportions distort abnormally
    if (
      eyeWidthRatio < 0.28 || eyeWidthRatio > 0.78 ||
      mouthWidthRatio < 0.12 || mouthWidthRatio > 0.72 ||
      vertRatio < 0.07 || vertRatio > 0.48
    ) {
      isObstructed = true;
      occlusionRatio = 0.45;
    }
  }

  // ─── Threshold Evaluations ────────────────────────────────────────────────
  // Acceptable Normalized Bounds for Interview Setup:
  // Center X (mirrored): [0.38, 0.62] (Centered horizontally)
  // Center Y: [0.30, 0.68] (Centered vertically)
  // Width Ratio: [0.17, 0.54] (Ideal camera distance)

  let state: FacePositionState = 'FACE_POSITIONED';
  let isPositionValid = true;
  let message = '✓ Face detected — Position looks good';

  if (isObstructed) {
    state = 'FACE_PARTIALLY_OBSTRUCTED';
    isPositionValid = false;
    message = '⚠ Keep your face clearly visible (Remove hand/obstruction)';
  } else if (faceWidthRatio < 0.17 || areaRatio < 0.025) {
    state = 'FACE_TOO_FAR';
    isPositionValid = false;
    message = '⚠ Move closer to the camera';
  } else if (faceWidthRatio > 0.55 || areaRatio > 0.32) {
    state = 'FACE_TOO_CLOSE';
    isPositionValid = false;
    message = '⚠ Move slightly back';
  } else if (mirroredCenterX < 0.38) {
    // Face is on candidate's left in mirrored preview -> Move physical right
    state = 'FACE_OFF_CENTER_LEFT';
    isPositionValid = false;
    message = '⚠ Move slightly right';
  } else if (mirroredCenterX > 0.62) {
    // Face is on candidate's right in mirrored preview -> Move physical left
    state = 'FACE_OFF_CENTER_RIGHT';
    isPositionValid = false;
    message = '⚠ Move slightly left';
  } else if (rawCenterY < 0.30) {
    state = 'FACE_OFF_CENTER_UP';
    isPositionValid = false;
    message = '⚠ Move slightly down';
  } else if (rawCenterY > 0.68) {
    state = 'FACE_OFF_CENTER_DOWN';
    isPositionValid = false;
    message = '⚠ Move slightly up';
  }

  return {
    state,
    isPositionValid,
    message,
    faceCount: 1,
    centerX: Number(rawCenterX.toFixed(2)),
    centerY: Number(rawCenterY.toFixed(2)),
    widthRatio: Number(faceWidthRatio.toFixed(2)),
    heightRatio: Number(faceHeightRatio.toFixed(2)),
    areaRatio: Number(areaRatio.toFixed(2)),
    occlusionRatio: Number(occlusionRatio.toFixed(2)),
    confidence: 0.94,
    debugInfo: {
      rawCenterX: Number(rawCenterX.toFixed(2)),
      rawCenterY: Number(rawCenterY.toFixed(2)),
      mirroredCenterX: Number(mirroredCenterX.toFixed(2)),
      faceWidthRatio: Number(faceWidthRatio.toFixed(2)),
      faceHeightRatio: Number(faceHeightRatio.toFixed(2)),
      videoWidth,
      videoHeight,
      keyLandmarksPresent: isObstructed ? 3 : 6,
      totalKeyLandmarks: 6,
    },
  };
}
