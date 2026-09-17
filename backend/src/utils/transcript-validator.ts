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
  completenessScore: number;
  hasSubstantiveAnswers: boolean;
}

/**
 * Calculates answer statistics for an interview session based on stored substantive transcripts.
 */
export function calculateAnswerStats(
  totalQuestionsCount: number,
  transcripts: Array<{ transcript?: string | null }>
): InterviewAnswerStats {
  const totalQuestions = Math.max(0, totalQuestionsCount || 0);
  
  const substantiveTranscripts = (transcripts || []).filter((t) =>
    isSubstantiveAnswer(t.transcript)
  );

  const answeredCount = substantiveTranscripts.length;
  const skippedCount = Math.max(0, totalQuestions - answeredCount);
  const completenessScore =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return {
    totalQuestions,
    answeredCount,
    skippedCount,
    completenessScore,
    hasSubstantiveAnswers: answeredCount > 0,
  };
}
