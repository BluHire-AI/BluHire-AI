import { Request, Response } from 'express';
import InterviewSession from '../models/InterviewSession';
import InterviewQuestion from '../models/InterviewQuestion';
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
  difficulty?: string;
  status: 'ANSWERED' | 'SKIPPED' | 'NO_RESPONSE';
  recording: {
    available: boolean;
    url?: string;
  };
  transcript: {
    status: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_APPLICABLE';
    text?: string | null;
  };
  evaluation: {
    status: 'EVALUATED' | 'NOT_EVALUATED';
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

  // 1. Fetch template questions
  const questions = await InterviewQuestion.find({ templateId: session.templateId }).sort({ createdAt: 1 });

  // 2. Fetch all recordings, transcripts for session
  const recordings = await InterviewRecording.find({ sessionId });
  const transcripts = await InterviewTranscript.find({ sessionId });
  const transcriptIds = transcripts.map((t) => t._id);

  // 3. Fetch evaluations linked to transcripts
  const techEvals = await TechnicalEvaluation.find({ transcriptId: { $in: transcriptIds } });
  const commEvals = await CommunicationAnalysis.find({ transcriptId: { $in: transcriptIds } });
  const probEvals = await ProblemSolvingEvaluation.find({ transcriptId: { $in: transcriptIds } });

  const techMap = new Map(techEvals.map((e) => [e.transcriptId.toString(), e]));
  const commMap = new Map(commEvals.map((e) => [e.transcriptId.toString(), e]));
  const probMap = new Map(probEvals.map((e) => [e.transcriptId.toString(), e]));

  const questionReviews: QuestionReviewItem[] = questions.map((q, idx) => {
    // Find recording matching questionId strictly (or fallback to questionIndex only if questionId is null)
    const rec = recordings.find(
      (r) => (r.questionId && r.questionId.toString() === q._id.toString()) || (!r.questionId && r.questionIndex === idx)
    );

    // Find transcript matching questionId strictly (or fallback to questionIndex only if questionId is null)
    const tr = transcripts.find(
      (t) => (t.questionId && t.questionId.toString() === q._id.toString()) || (!t.questionId && (t as any).questionIndex === idx)
    );

    const hasSubstantiveText = tr ? isSubstantiveAnswer(tr.transcript) : false;
    const isRecordingAvailable = !!rec && !!rec.videoUrl;

    let transcriptStatus: 'AVAILABLE' | 'UNAVAILABLE' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
    let cleanTranscriptText: string | null = null;

    if (hasSubstantiveText && tr) {
      transcriptStatus = 'AVAILABLE';
      cleanTranscriptText = tr.transcript;
    } else if (isRecordingAvailable || (tr && !isSubstantiveAnswer(tr.transcript))) {
      // Audio/recording exists or transcript doc exists, but no substantive text parsed
      transcriptStatus = 'UNAVAILABLE';
      cleanTranscriptText = tr && !isSubstantiveAnswer(tr.transcript) 
        ? 'Transcript unavailable — no substantive speech detected or processing failed.'
        : 'Transcript unavailable — audio processing failed.';
    } else {
      transcriptStatus = 'NOT_APPLICABLE';
      cleanTranscriptText = null;
    }

    const questionStatus: 'ANSWERED' | 'SKIPPED' | 'NO_RESPONSE' = hasSubstantiveText
      ? 'ANSWERED'
      : isRecordingAvailable
      ? 'NO_RESPONSE'
      : 'SKIPPED';

    let evalStatus: 'EVALUATED' | 'NOT_EVALUATED' = 'NOT_EVALUATED';
    let techScore: number | null = null;
    let commScore: number | null = null;
    let probScore: number | null = null;
    let overallQScore: number | null = null;
    let feedbackStr: string | null = null;

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
      questionId: q._id.toString(),
      questionNumber: idx + 1,
      questionText: q.questionText,
      category: q.category,
      difficulty: q.difficulty,
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

  const totalQuestions = questions.length;
  const answeredCount = questionReviews.filter((q) => q.status === 'ANSWERED' && q.transcript.status === 'AVAILABLE').length;
  const skippedCount = totalQuestions - answeredCount;
  const completenessScore = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return {
    sessionId: session._id,
    totalQuestions,
    answeredCount,
    skippedCount,
    completenessScore,
    questions: questionReviews,
  };
};
