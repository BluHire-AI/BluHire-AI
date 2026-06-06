import { Request, Response } from 'express';
import Candidate from '../models/Candidate';
import InterviewSession from '../models/InterviewSession';
import InterviewScore from '../models/InterviewScore';
import InterviewRecommendation from '../models/InterviewRecommendation';
import { SessionStatus } from '../types/interview.types';

export const getExecutiveAnalytics = async (req: Request, res: Response) => {
  try {
    // KPI Overview
    const candidatesCount = await Candidate.countDocuments({ isDeleted: false });
    
    // Aggregate candidate statuses
    const candidateStatusAggregation = await Candidate.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const candidateStatuses = candidateStatusAggregation.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    const applied = candidateStatuses['APPLIED'] || 0;
    const underReview = candidateStatuses['UNDER_REVIEW'] || 0;
    const shortlisted = candidateStatuses['SHORTLISTED'] || 0;
    const selected = candidateStatuses['SELECTED'] || 0;
    const rejected = candidateStatuses['REJECTED'] || 0;

    // Interview Sessions
    const sessionsCount = await InterviewSession.countDocuments();
    const completedInterviews = await InterviewSession.countDocuments({ status: SessionStatus.COMPLETED });
    const interviewCompletionRate = sessionsCount > 0 ? (completedInterviews / sessionsCount) * 100 : 0;
    const dropOffRate = sessionsCount > 0 ? ((sessionsCount - completedInterviews) / sessionsCount) * 100 : 0;
    const selectionRate = candidatesCount > 0 ? (selected / candidatesCount) * 100 : 0;

    // Averages from InterviewScore
    const scoreAverages = await InterviewScore.aggregate([
      {
        $group: {
          _id: null,
          avgTechnical: { $avg: "$technicalScore" },
          avgCommunication: { $avg: "$communicationScore" },
          avgProblemSolving: { $avg: "$problemSolvingScore" },
          avgOverall: { $avg: "$overallScore" }
        }
      }
    ]);

    const avgScores = scoreAverages[0] || { avgTechnical: 0, avgCommunication: 0, avgProblemSolving: 0, avgOverall: 0 };

    // Recommendation Analytics
    const recAggregation = await InterviewRecommendation.aggregate([
      { $group: { _id: "$recommendation", count: { $sum: 1 } } }
    ]);
    
    const recommendations = recAggregation.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    // Hiring Funnel Data
    const hiringFunnel = [
      { name: 'Applied', value: applied + underReview + shortlisted + selected + rejected },
      { name: 'Interview Scheduled', value: sessionsCount },
      { name: 'Interview Completed', value: completedInterviews },
      { name: 'Under Review', value: underReview + shortlisted + selected },
      { name: 'Shortlisted', value: shortlisted + selected },
      { name: 'Selected', value: selected },
      { name: 'Rejected', value: rejected }
    ];

    // Candidate Performance Analytics (Radar)
    const performanceAnalytics = [
      { subject: 'Technical', A: Math.round(avgScores.avgTechnical || 0), fullMark: 100 },
      { subject: 'Communication', A: Math.round(avgScores.avgCommunication || 0), fullMark: 100 },
      { subject: 'Problem Solving', A: Math.round(avgScores.avgProblemSolving || 0), fullMark: 100 },
    ];

    // Mock Skill Gap Analysis (since we don't have deep semantic skill gap models populated yet)
    const skillGapAnalysis = {
      topStrengths: ['React', 'Node.js', 'System Design'],
      topWeaknesses: ['Kubernetes', 'Advanced CSS', 'GraphQL'],
      mostMissedTopics: ['Microservices Architecture', 'Docker Orchestration'],
      mostCommonSkills: ['JavaScript', 'TypeScript', 'Git']
    };

    // Top Candidates
    const topCandidates = await InterviewScore.aggregate([
      { $sort: { overallScore: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'interviewsessions',
          localField: 'sessionId',
          foreignField: '_id',
          as: 'session'
        }
      },
      { $unwind: "$session" },
      {
        $lookup: {
          from: 'candidates',
          localField: 'session.candidateId',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: "$candidate" },
      {
        $lookup: {
          from: 'interviewrecommendations',
          localField: 'sessionId',
          foreignField: 'sessionId',
          as: 'recommendationData'
        }
      },
      {
        $project: {
          _id: "$candidate._id",
          firstName: "$candidate.firstName",
          lastName: "$candidate.lastName",
          email: "$candidate.email",
          overallScore: { $round: ["$overallScore", 0] },
          recommendation: { $arrayElemAt: ["$recommendationData.recommendation", 0] },
          status: "$candidate.status"
        }
      }
    ]);

    // AI Insights (Mocked generation logic based on aggregates)
    const insights = [
      "Most common weakness identified across candidates is System Architecture.",
      "Communication skills have an upward trend this quarter.",
      `Selection rate is currently at ${selectionRate.toFixed(1)}%, indicating a tight funnel.`,
      "Candidates excel in frontend technologies but show gaps in devops."
    ];

    // Recruitment Efficiency
    const efficiency = {
      averageInterviewDuration: 45, // mock in minutes, could be calculated from session.startedAt to completedAt
      averageEvaluationTime: 12, // mock in minutes
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
          averageTechnicalScore: Math.round(avgScores.avgTechnical || 0),
          averageCommunicationScore: Math.round(avgScores.avgCommunication || 0),
          averageProblemSolvingScore: Math.round(avgScores.avgProblemSolving || 0),
          averageOverallScore: Math.round(avgScores.avgOverall || 0)
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
