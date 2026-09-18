/**
 * Helper utility to validate whether a transcript string represents a substantive candidate response.
 * 
 * Returns false for:
 * - null or undefined
 * - empty strings
 * - whitespace-only strings
 * - known system-generated no-response or silence placeholders
 * - transcripts with insufficient meaningful text
 */
export function isSubstantiveAnswer(text?: string | null): boolean {
  if (!text) return false;
  
  const trimmed = text.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();

  // Common transcription engine / fallback non-substantive placeholders
  if (lower.includes('fallback transcript') || lower.includes('audio processor failed')) {
    return false;
  }

  const nonSubstantivePlaceholders = [
    '[no speech detected]',
    '[inaudible]',
    '[no answer]',
    '[no response]',
    '[silence]',
    '[no audio]',
    '[music]',
    '[noise]',
    'no response',
    'no answer',
    'skipped',
    'none',
  ];

  if (nonSubstantivePlaceholders.includes(lower)) {
    return false;
  }

  // Remove punctuation and non-alphanumeric characters to check actual spoken content length
  const cleanStr = lower.replace(/[^a-z0-9]/g, '');
  if (cleanStr.length < 3) {
    return false;
  }

  return true;
}

export interface InterviewAnswerStats {
  totalQuestions: number;
  answeredCount: number;
  skippedCount: number;
  transcriptionFailedCount?: number;
  recordingFailedCount?: number;
  completenessScore: number;
  hasSubstantiveAnswers: boolean;
}

/**
 * Calculates answer statistics for an interview session based on stored substantive transcripts and response statuses.
 * NEVER calculates skippedCount by subtraction (Rule 15).
 */
export function calculateAnswerStats(
  totalQuestionsCount: number,
  items: Array<{ transcript?: string | null; responseStatus?: string }>
): InterviewAnswerStats {
  const totalQuestions = Math.max(0, totalQuestionsCount || 0);

  let answeredCount = 0;
  let skippedCount = 0;
  let transcriptionFailedCount = 0;
  let recordingFailedCount = 0;

  for (const item of items || []) {
    if (item.responseStatus === 'SKIPPED') {
      skippedCount++;
    } else if (item.responseStatus === 'TRANSCRIPTION_FAILED') {
      transcriptionFailedCount++;
    } else if (item.responseStatus === 'RECORDING_FAILED') {
      recordingFailedCount++;
    } else if (item.responseStatus === 'ANSWERED' || isSubstantiveAnswer(item.transcript)) {
      answeredCount++;
    }
  }

  const completenessScore =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    answeredCount,
    skippedCount,
    transcriptionFailedCount,
    recordingFailedCount,
    completenessScore,
    hasSubstantiveAnswers: answeredCount > 0,
  };
}
