import { Request, Response } from 'express';
import InterviewSession from '../models/InterviewSession';
import InterviewQuestion from '../models/InterviewQuestion';
import InterviewResponse from '../models/InterviewResponse';
import InterviewRecording from '../models/InterviewRecording';
import InterviewTranscript from '../models/InterviewTranscript';
import TechnicalEvaluation from '../models/TechnicalEvaluation';
import CommunicationAnalysis from '../models/CommunicationAnalysis';
import ProblemSolvingEvaluation from '../models/ProblemSolvingEvaluation';
import { isSubstantiveAnswer } from '../utils/transcript-validator';

export interface QuestionReviewItem {
  questionId: string;
  questionNumber: number;
  questionText: string;
  category?: string;
  competency?: string;
  difficulty?: string;
  reason?: string;
  sourceSkill?: string;
  expectedTopics?: string[];
  status: 'ANSWERED' | 'SKIPPED' | 'RECORDING_FAILED' | 'TRANSCRIPTION_FAILED' | 'NO_RESPONSE';
  recording: {
    available: boolean;
    url?: string;
  };
  transcript: {
    status: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_APPLICABLE';
    text?: string | null;
  };
  evaluation: {
    status: 'EVALUATED' | 'NOT_EVALUATED' | 'FAILED';
    technicalScore?: number | null;
    communicationScore?: number | null;
    problemSolvingScore?: number | null;
    overallScore?: number | null;
    feedback?: string | null;
  };
}

export const getQuestionReviewsBySession = async (sessionId: string) => {
  const session = await InterviewSession.findById(sessionId);
  if (!session) return null;

  // 1. Fetch session questions (with fallback to templateId for legacy sessions)
  let questions = await InterviewQuestion.find({ sessionId: session._id }).sort({ createdAt: 1 });
  if (questions.length === 0 && session.templateId) {
    questions = await InterviewQuestion.find({ templateId: session.templateId }).sort({ createdAt: 1 });
  }

  // 2. Fetch all recordings, transcripts, and responses for session
  const recordings = await InterviewRecording.find({ sessionId });
  const transcripts = await InterviewTranscript.find({ sessionId });
  const responses = await InterviewResponse.find({ sessionId });
  const transcriptIds = transcripts.map((t) => t._id);

  // 3. Fetch evaluations linked to transcripts
  const techEvals = await TechnicalEvaluation.find({ transcriptId: { $in: transcriptIds } });
  const commEvals = await CommunicationAnalysis.find({ transcriptId: { $in: transcriptIds } });
  const probEvals = await ProblemSolvingEvaluation.find({ transcriptId: { $in: transcriptIds } });

  const techMap = new Map(techEvals.map((e) => [e.transcriptId.toString(), e]));
  const commMap = new Map(commEvals.map((e) => [e.transcriptId.toString(), e]));
  const probMap = new Map(probEvals.map((e) => [e.transcriptId.toString(), e]));

  const questionReviews: QuestionReviewItem[] = questions.map((q, idx) => {
    const qIdStr = q._id.toString();

    // Find recording matching questionId strictly (or fallback to questionIndex)
    const rec = recordings.find(
      (r) => (r.questionId && r.questionId.toString() === qIdStr) || (!r.questionId && r.questionIndex === idx)
    );

    // Find transcript matching questionId strictly (or fallback to questionIndex)
    const tr = transcripts.find(
      (t) => (t.questionId && t.questionId.toString() === qIdStr) || (!t.questionId && (t as any).questionIndex === idx)
    );

    // Find response document
    const resp = responses.find((r) => r.questionId?.toString() === qIdStr);

    const hasSubstantiveText = tr ? isSubstantiveAnswer(tr.transcript) : false;
    const isRecordingAvailable = !!rec && !!rec.videoUrl;

    let transcriptStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
    let cleanTranscriptText: string | null = null;

    if (hasSubstantiveText && tr) {
      transcriptStatus = 'AVAILABLE';
      cleanTranscriptText = tr.transcript;
    } else if (isRecordingAvailable || (tr && !isSubstantiveAnswer(tr.transcript))) {
      transcriptStatus = 'UNAVAILABLE';
      cleanTranscriptText = tr && !isSubstantiveAnswer(tr.transcript) 
        ? 'Transcript unavailable — no substantive speech detected or processing failed.'
        : 'Transcript unavailable — audio processing failed.';
    } else {
      transcriptStatus = 'NOT_APPLICABLE';
      cleanTranscriptText = null;
    }

    // Determine accurate responseStatus based on persisted response and actual pipeline state
    let questionStatus: 'ANSWERED' | 'SKIPPED' | 'RECORDING_FAILED' | 'TRANSCRIPTION_FAILED' | 'NO_RESPONSE';

    if (resp?.responseStatus === 'SKIPPED') {
      questionStatus = 'SKIPPED';
    } else if (resp?.responseStatus === 'TRANSCRIPTION_FAILED') {
      questionStatus = 'TRANSCRIPTION_FAILED';
    } else if (resp?.responseStatus === 'RECORDING_FAILED') {
      questionStatus = 'RECORDING_FAILED';
    } else if (resp?.responseStatus === 'ANSWERED' || hasSubstantiveText) {
      questionStatus = 'ANSWERED';
    } else if (isRecordingAvailable) {
      questionStatus = 'TRANSCRIPTION_FAILED';
    } else {
      questionStatus = 'SKIPPED';
    }

    let evalStatus: 'EVALUATED' | 'NOT_EVALUATED' | 'FAILED' = 'NOT_EVALUATED';
    let techScore: number | null = null;
    let commScore: number | null = null;
    let probScore: number | null = null;
    let overallQScore: number | null = null;
    let feedbackStr: string | null = null;

    if (resp?.evaluationStatus === 'FAILED') {
      evalStatus = 'FAILED';
      feedbackStr = resp.evaluationError || 'Automated evaluation service temporarily unavailable.';
    }

    if (tr && hasSubstantiveText) {
      const tEval = techMap.get(tr._id.toString());
      const cEval = commMap.get(tr._id.toString());
      const pEval = probMap.get(tr._id.toString());

      if (tEval || cEval || pEval) {
        evalStatus = 'EVALUATED';
        techScore = tEval ? Math.round(tEval.overallTechnicalScore * 10) : null;
        commScore = cEval ? Math.round(cEval.communicationScore * 10) : null;
        probScore = pEval ? Math.round(pEval.overallProblemSolvingScore * 10) : null;

        const scores = [techScore, commScore, probScore].filter((s): s is number => s !== null);
        if (scores.length > 0) {
          overallQScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        }
        feedbackStr = tEval?.feedback || cEval?.feedback || pEval?.feedback || 'Candidate response evaluated.';
      }
    }

    return {
      questionId: qIdStr,
      questionNumber: idx + 1,
      questionText: q.questionText,
      category: q.category,
      competency: q.competency,
      difficulty: q.difficulty,
      reason: q.reason,
      sourceSkill: q.sourceSkill,
      expectedTopics: q.expectedTopics,
      status: questionStatus,
      recording: {
        available: isRecordingAvailable,
        url: rec?.videoUrl || undefined,
      },
      transcript: {
        status: transcriptStatus,
        text: cleanTranscriptText,
      },
      evaluation: {
        status: evalStatus,
        technicalScore: techScore,
        communicationScore: commScore,
        problemSolvingScore: probScore,
        overallScore: overallQScore,
        feedback: feedbackStr,
      },
    };
  });

  // Calculate statistics directly from actual statuses (Never subtract total - answered)
  const totalQuestions = questions.length;
  const answeredCount = questionReviews.filter((q) => q.status === 'ANSWERED').length;
  const skippedCount = questionReviews.filter((q) => q.status === 'SKIPPED').length;
  const transcriptionFailedCount = questionReviews.filter((q) => q.status === 'TRANSCRIPTION_FAILED').length;
  const recordingFailedCount = questionReviews.filter((q) => q.status === 'RECORDING_FAILED').length;
  const completenessScore = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return {
    sessionId: session._id,
    totalQuestions,
    answeredCount,
    skippedCount,
    transcriptionFailedCount,
    recordingFailedCount,
    completenessScore,
    competencyPlan: session.competencyPlan || [],
    questions: questionReviews,
  };
};
