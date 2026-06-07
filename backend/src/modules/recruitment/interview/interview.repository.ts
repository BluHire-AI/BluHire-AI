import mongoose from 'mongoose';
import InterviewTemplate, { IInterviewTemplate } from '../../../models/InterviewTemplate';
import InterviewAssignment, { IInterviewAssignment } from '../../../models/InterviewAssignment';
import InterviewSession, { IInterviewSession } from '../../../models/InterviewSession';
import InterviewQuestion, { IInterviewQuestion } from '../../../models/InterviewQuestion';
import InterviewResponse, { IInterviewResponse } from '../../../models/InterviewResponse';
import InterviewEvaluation, { IInterviewEvaluation } from '../../../models/InterviewEvaluation';
import InterviewReport, { IInterviewReport } from '../../../models/InterviewReport';

export class InterviewRepository {
  // --- TEMPLATES ---
  async createTemplate(data: Partial<IInterviewTemplate>): Promise<IInterviewTemplate> {
    return await new InterviewTemplate(data).save();
  }

  async findTemplateById(id: string): Promise<IInterviewTemplate | null> {
    return await InterviewTemplate.findOne({ _id: id, isArchived: false });
  }

  async findTemplates(filter: any = {}): Promise<IInterviewTemplate[]> {
    return await InterviewTemplate.find({ ...filter, isArchived: false }).sort({ createdAt: -1 });
  }

  async updateTemplate(id: string, data: Partial<IInterviewTemplate>): Promise<IInterviewTemplate | null> {
    return await InterviewTemplate.findOneAndUpdate(
      { _id: id, isArchived: false },
      { ...data, updatedAt: new Date() },
      { returnDocument: 'after', runValidators: true }
    );
  }

  async deleteTemplate(id: string): Promise<IInterviewTemplate | null> {
    return await InterviewTemplate.findByIdAndUpdate(id, { isArchived: true, updatedAt: new Date() }, { returnDocument: 'after' });
  }

  // --- ASSIGNMENTS ---
  async createAssignment(data: Partial<IInterviewAssignment>): Promise<IInterviewAssignment> {
    return await new InterviewAssignment(data).save();
  }

  async findAssignmentById(id: string): Promise<IInterviewAssignment | null> {
    return await InterviewAssignment.findById(id)
      .populate({ path: 'candidateId', match: { isDeleted: false } })
      .populate({ path: 'jobId', match: { isDeleted: false } })
      .populate('interviewTemplateId');
  }

  async findAssignments(filter: any = {}): Promise<IInterviewAssignment[]> {
    return await InterviewAssignment.find(filter)
      .populate({ path: 'candidateId', match: { isDeleted: false } })
      .populate({ path: 'jobId', match: { isDeleted: false } })
      .populate('interviewTemplateId')
      .sort({ createdAt: -1 });
  }

  // --- SESSIONS ---
  async createSession(data: Partial<IInterviewSession>): Promise<IInterviewSession> {
    return await new InterviewSession(data).save();
  }

  async findSessionById(id: string): Promise<IInterviewSession | null> {
    return await InterviewSession.findById(id)
      .populate('candidateId')
      .populate('jobId')
      .populate({
        path: 'assignmentId',
        populate: { path: 'interviewTemplateId' }
      });
  }

  async findSessionByAssignmentId(assignmentId: string): Promise<IInterviewSession | null> {
    return await InterviewSession.findOne({ assignmentId }).sort({ createdAt: -1 });
  }

  // --- DYNAMIC ANALYTICS ENGINE ---
  async getAggregatedAnalytics(filter: any = {}): Promise<any> {
    // Aggregates statistics dynamically across InterviewSession and InterviewReport collections
    const totalAssignments = await InterviewAssignment.countDocuments(filter);
    const completedAssignments = await InterviewAssignment.countDocuments({ ...filter, status: 'Completed' });
    const pendingAssignments = await InterviewAssignment.countDocuments({ ...filter, status: { $in: ['Pending', 'Started', 'In Progress'] } });

    // Average score aggregation
    const scoreAgg = await InterviewAssignment.aggregate([
      { $match: { ...filter, status: 'Completed', interviewScore: { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$interviewScore' } } }
    ]);
    const averageScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0;

    // Top performers (rank top 5 candidates)
    const topPerformers = await InterviewAssignment.find({ ...filter, status: 'Completed' })
      .populate('candidateId', 'firstName lastName candidateCode email')
      .populate('jobId', 'title jobCode')
      .sort({ finalCandidateScore: -1 })
      .limit(5)
      .lean();

    // Recommendation Distribution
    const recAgg = await InterviewReport.aggregate([
      {
        $match: filter.jobId
          ? { jobId: new mongoose.Types.ObjectId(filter.jobId) }
          : {}
      },
      { $group: { _id: '$hiringRecommendation', count: { $sum: 1 } } }
    ]);

    const recommendationDistribution: Record<string, number> = {
      'Strong Hire': 0,
      'Hire': 0,
      'Consider': 0,
      'Weak Consider': 0,
      'Reject': 0
    };
    recAgg.forEach((item) => {
      if (item._id && recommendationDistribution[item._id] !== undefined) {
        recommendationDistribution[item._id] = item.count;
      }
    });

    // Interview success rate (completed vs total)
    const successRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    return {
      totalAssignments,
      completedAssignments,
      pendingAssignments,
      averageScore,
      successRate,
      topPerformers: topPerformers.map(p => ({
        candidateName: p.candidateId ? `${(p.candidateId as any).firstName} ${(p.candidateId as any).lastName}` : 'N/A',
        candidateCode: (p.candidateId as any)?.candidateCode || 'N/A',
        jobTitle: (p.jobId as any)?.title || 'N/A',
        interviewScore: p.interviewScore,
        finalScore: p.finalCandidateScore
      })),
      recommendationDistribution
    };
  }
}

export default new InterviewRepository();
