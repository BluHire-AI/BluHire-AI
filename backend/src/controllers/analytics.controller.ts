import { Request, Response } from 'express';
import Candidate from '../models/Candidate';
import InterviewSession from '../models/InterviewSession';
import InterviewRecommendation from '../models/InterviewRecommendation';
import TechnicalEvaluation from '../models/TechnicalEvaluation';
import CommunicationAnalysis from '../models/CommunicationAnalysis';
import ProblemSolvingEvaluation from '../models/ProblemSolvingEvaluation';
import InterviewTranscript from '../models/InterviewTranscript';
import Application from '../models/Application';
import { SessionStatus } from '../types/interview.types';

export const getExecutiveAnalytics = async (req: Request, res: Response) => {
  try {
    // ── KPI Overview ──────────────────────────────────────────────────────────
    const candidatesCount = await Candidate.countDocuments({ isDeleted: false });

    const candidateStatusAggregation = await Candidate.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const candidateStatuses = candidateStatusAggregation.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const applied     = candidateStatuses['APPLIED'] || 0;
    const underReview = candidateStatuses['UNDER_REVIEW'] || 0;
    const shortlisted = candidateStatuses['SHORTLISTED'] || 0;
    const selected    = candidateStatuses['SELECTED'] || 0;
    const rejected    = candidateStatuses['REJECTED'] || 0;

    // ── Interview Sessions ────────────────────────────────────────────────────
    const sessionsCount       = await InterviewSession.countDocuments();
    const completedInterviews = await InterviewSession.countDocuments({ status: SessionStatus.COMPLETED });
    const interviewCompletionRate = sessionsCount > 0 ? (completedInterviews / sessionsCount) * 100 : 0;
    const dropOffRate         = sessionsCount > 0 ? ((sessionsCount - completedInterviews) / sessionsCount) * 100 : 0;
    const selectionRate       = candidatesCount > 0 ? (selected / candidatesCount) * 100 : 0;

    // ── Average Scores from real evaluation collections ───────────────────────
    const [techAvg, commAvg, probAvg] = await Promise.all([
      TechnicalEvaluation.aggregate([
        { $group: { _id: null, avg: { $avg: '$overallTechnicalScore' } } }
      ]),
      CommunicationAnalysis.aggregate([
        { $group: { _id: null, avg: { $avg: '$communicationScore' } } }
      ]),
      ProblemSolvingEvaluation.aggregate([
        { $group: { _id: null, avg: { $avg: '$overallProblemSolvingScore' } } }
      ]),
    ]);

    // Scores are stored 0–10 (divided by 10 on write); scale back to 0–100 for display
    const avgTechnical     = Math.round((techAvg[0]?.avg || 0) * 10);
    const avgCommunication = Math.round((commAvg[0]?.avg || 0) * 10);
    const avgProblemSolving = Math.round((probAvg[0]?.avg || 0) * 10);
    const avgOverall = Math.round(avgTechnical * 0.4 + avgCommunication * 0.3 + avgProblemSolving * 0.3);

    // ── Recommendation Analytics ──────────────────────────────────────────────
    const recAggregation = await InterviewRecommendation.aggregate([
      { $group: { _id: '$recommendation', count: { $sum: 1 } } }
    ]);
    const recommendations = recAggregation.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    // ── Hiring Funnel ─────────────────────────────────────────────────────────
    const hiringFunnel = [
      { name: 'Applied',             value: applied + underReview + shortlisted + selected + rejected },
      { name: 'Interview Scheduled', value: sessionsCount },
      { name: 'Interview Completed', value: completedInterviews },
      { name: 'Under Review',        value: underReview + shortlisted + selected },
      { name: 'Shortlisted',         value: shortlisted + selected },
      { name: 'Selected',            value: selected },
      { name: 'Rejected',            value: rejected }
    ];

    // ── Candidate Performance Analytics ───────────────────────────────────────
    const performanceAnalytics = [
      { subject: 'Technical',       A: avgTechnical,     fullMark: 100 },
      { subject: 'Communication',   A: avgCommunication, fullMark: 100 },
      { subject: 'Problem Solving', A: avgProblemSolving, fullMark: 100 },
    ];

    // ── Real Skill Gap from Application AI screening results ──────────────────
    const [matchingSkillsAgg, missingSkillsAgg] = await Promise.all([
      Application.aggregate([
        { $match: { isDeleted: false, screeningStatus: 'COMPLETED', matchingSkills: { $exists: true, $ne: [] } } },
        { $unwind: '$matchingSkills' },
        { $group: { _id: '$matchingSkills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Application.aggregate([
        { $match: { isDeleted: false, screeningStatus: 'COMPLETED', missingSkills: { $exists: true, $ne: [] } } },
        { $unwind: '$missingSkills' },
        { $group: { _id: '$missingSkills', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
    ]);

    const skillGapAnalysis = {
      topStrengths:      matchingSkillsAgg.map((s: any) => s._id),
      topWeaknesses:     missingSkillsAgg.map((s: any) => s._id),
      mostMissedTopics:  missingSkillsAgg.slice(0, 2).map((s: any) => s._id),
      mostCommonSkills:  matchingSkillsAgg.map((s: any) => s._id),
    };

    // ── Top Candidates from real evaluation data ──────────────────────────────
    const topCandidates = await InterviewRecommendation.aggregate([
      { $sort: { confidence: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'interviewsessions',
          localField: 'sessionId',
          foreignField: '_id',
          as: 'session'
        }
      },
      { $unwind: { path: '$session', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'candidates',
          localField: 'session.candidateId',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: '$candidate._id',
          firstName: '$candidate.firstName',
          lastName: '$candidate.lastName',
          email: '$candidate.email',
          recommendation: '$recommendation',
          confidence: { $round: [{ $multiply: ['$confidence', 100] }, 0] },
          status: '$candidate.status'
        }
      }
    ]);

    // ── Real insights derived from aggregates ─────────────────────────────────
    const insights: string[] = [];
    if (selectionRate > 0) {
      insights.push(`Selection rate is ${selectionRate.toFixed(1)}% — ${selected} out of ${candidatesCount} candidates advanced to hire.`);
    }
    if (avgTechnical > 0) {
      const weakest = avgTechnical < avgCommunication && avgTechnical < avgProblemSolving
        ? 'Technical'
        : avgCommunication < avgProblemSolving
          ? 'Communication'
          : 'Problem Solving';
      insights.push(`Lowest average score is in ${weakest} (avg: ${Math.min(avgTechnical, avgCommunication, avgProblemSolving)}%).`);
    }
    if (interviewCompletionRate > 0) {
      insights.push(`Interview completion rate is ${interviewCompletionRate.toFixed(1)}% — ${completedInterviews} of ${sessionsCount} sessions completed.`);
    }
    if (skillGapAnalysis.topWeaknesses.length > 0) {
      insights.push(`Most common skill gaps across candidates: ${skillGapAnalysis.topWeaknesses.slice(0, 2).join(', ')}.`);
    }

    // ── Real Recruitment Efficiency ───────────────────────────────────────────
    // Calculate average interview duration from real session timestamps
    const durationAgg = await InterviewSession.aggregate([
      {
        $match: {
          status: SessionStatus.COMPLETED,
          startedAt: { $exists: true },
          completedAt: { $exists: true }
        }
      },
      {
        $project: {
          durationMinutes: {
            $divide: [
              { $subtract: ['$completedAt', '$startedAt'] },
              60000
            ]
          }
        }
      },
      { $group: { _id: null, avgDuration: { $avg: '$durationMinutes' } } }
    ]);

    const averageInterviewDuration = durationAgg.length > 0
      ? Math.round(durationAgg[0].avgDuration)
      : null;

    const efficiency = {
      averageInterviewDuration, // null if no data, real value otherwise
      completionRate: Math.round(interviewCompletionRate),
      dropOffRate: Math.round(dropOffRate)
    };

    return res.status(200).json({
      success: true,
      message: 'Executive Analytics Retrieved Successfully',
      data: {
        kpi: {
          totalCandidates: candidatesCount,
          completedInterviews,
          underReview,
          shortlisted,
          selected,
          rejected,
          interviewCompletionRate: Math.round(interviewCompletionRate),
          selectionRate: Math.round(selectionRate),
          averageTechnicalScore: avgTechnical,
          averageCommunicationScore: avgCommunication,
          averageProblemSolvingScore: avgProblemSolving,
          averageOverallScore: avgOverall
        },
        funnel: hiringFunnel,
        recommendations: {
          hire: recommendations['HIRE'] || 0,
          maybeHire: recommendations['MAYBE_HIRE'] || 0,
          reject: recommendations['REJECT'] || 0
        },
        performance: performanceAnalytics,
        skillsGap: skillGapAnalysis,
        topCandidates,
        insights,
        efficiency
      }
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch executive analytics',
      error: error.message || error
    });
  }
};
