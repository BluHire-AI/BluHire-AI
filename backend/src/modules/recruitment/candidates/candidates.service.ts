import candidateRepository, { CandidateQueryDTO } from '../repositories/candidate.repository';
import { ICandidate } from '../../../models/Candidate';
import { PaginationDTO } from '../../employee/dtos/common.dto';
import CandidateModel from '../../../models/Candidate';
import ApplicationModel from '../../../models/Application';
import InterviewSessionModel from '../../../models/InterviewSession';
import InterviewTranscriptModel from '../../../models/InterviewTranscript';
import InterviewResponseModel from '../../../models/InterviewResponse';
import InterviewRecordingModel from '../../../models/InterviewRecording';
import InterviewScoreModel from '../../../models/InterviewScore';
import InterviewReportModel from '../../../models/InterviewReport';
import TechnicalEvaluationModel from '../../../models/TechnicalEvaluation';
import ProblemSolvingEvaluationModel from '../../../models/ProblemSolvingEvaluation';
import CommunicationAnalysisModel from '../../../models/CommunicationAnalysis';
import InterviewRecommendationModel from '../../../models/InterviewRecommendation';
import InterviewTimelineModel from '../../../models/InterviewTimeline';
import TranscriptAnalysisModel from '../../../models/TranscriptAnalysis';
import RecruitmentActivityModel from '../../../models/RecruitmentActivity';

export class CandidatesService {
  /**
   * Generate a unique Candidate Code
   */
  private async generateCandidateCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await CandidateModel.countDocuments();
    const nextNumber = (count + 1).toString().padStart(5, '0');
    let candidateCode = `CAN-${year}-${nextNumber}`;

    // Verify uniqueness
    let exists = await candidateRepository.codeExists(candidateCode);
    let retry = 0;
    while (exists && retry < 10) {
      retry++;
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      candidateCode = `CAN-${year}-${nextNumber}-${randomSuffix}`;
      exists = await candidateRepository.codeExists(candidateCode);
    }
    return candidateCode;
  }

  /**
   * Create a new candidate
   */
  async createCandidate(candidateData: Partial<ICandidate>, userId?: string): Promise<ICandidate> {
    // Check if candidate with email already exists
    if (candidateData.email) {
      const existingCandidate = await candidateRepository.findByEmail(candidateData.email);
      if (existingCandidate) {
        throw new Error(`A candidate with email "${candidateData.email}" already exists.`);
      }
    }

    const candidateCode = await this.generateCandidateCode();
    const candidate = await candidateRepository.create({
      ...candidateData,
      candidateCode,
      createdBy: userId,
    });

    return candidate;
  }

  /**
   * Get or Create Candidate by email (specifically for Application Submission)
   */
  async getOrCreateCandidate(candidateData: Partial<ICandidate>, userId?: string): Promise<ICandidate> {
    if (!candidateData.email) {
      throw new Error('Email is required to locate or create candidate.');
    }

    const existingCandidate = await candidateRepository.findByEmail(candidateData.email);
    if (existingCandidate) {
      // Update candidate details if they applied again (updated resume, company, etc.)
      const updatedCandidate = await candidateRepository.update(existingCandidate._id, {
        firstName: candidateData.firstName || existingCandidate.firstName,
        lastName: candidateData.lastName || existingCandidate.lastName,
        phone: candidateData.phone || existingCandidate.phone,
        skills: candidateData.skills?.length ? candidateData.skills : existingCandidate.skills,
        experience: candidateData.experience || existingCandidate.experience,
        education: candidateData.education || existingCandidate.education,
        resume: candidateData.resume || existingCandidate.resume,
        linkedinUrl: candidateData.linkedinUrl || existingCandidate.linkedinUrl,
        portfolioUrl: candidateData.portfolioUrl || existingCandidate.portfolioUrl,
        currentCompany: candidateData.currentCompany || existingCandidate.currentCompany,
        currentDesignation: candidateData.currentDesignation || existingCandidate.currentDesignation,
        expectedSalary: candidateData.expectedSalary || existingCandidate.expectedSalary,
        noticePeriod: candidateData.noticePeriod || existingCandidate.noticePeriod,
        updatedBy: userId,
      });
      return updatedCandidate!;
    }

    // Creating fresh candidate
    return await this.createCandidate(candidateData, userId);
  }

  /**
   * Update Candidate Details
   */
  async updateCandidate(candidateId: string, updateData: Partial<ICandidate>, userId: string): Promise<ICandidate | null> {
    const existing = await candidateRepository.findById(candidateId);
    if (!existing) {
      throw new Error('Candidate not found');
    }

    // Email update safety check
    if (updateData.email && updateData.email.toLowerCase().trim() !== existing.email.toLowerCase().trim()) {
      const emailDuplicate = await candidateRepository.findByEmail(updateData.email);
      if (emailDuplicate) {
        throw new Error(`Email "${updateData.email}" is already taken by another candidate.`);
      }
    }

    return await candidateRepository.update(candidateId, {
      ...updateData,
      updatedBy: userId,
    });
  }

  /**
   * Delete candidate (soft delete)
   */
  async deleteCandidate(candidateId: string): Promise<ICandidate | null> {
    const candidate = await candidateRepository.findById(candidateId);
    if (!candidate) return null;

    // 1. Soft delete all applications
    await ApplicationModel.updateMany(
      { candidateId },
      { isDeleted: true, updatedAt: new Date() }
    );

    // 2. Hard delete Recruitment activities
    await RecruitmentActivityModel.deleteMany({ candidateId });

    // 3. Find related Interview Sessions
    const sessions = await InterviewSessionModel.find({ candidateId });
    const sessionIds = sessions.map((s) => s._id);

    if (sessionIds.length > 0) {
      // Find related Transcripts
      const transcripts = await InterviewTranscriptModel.find({ sessionId: { $in: sessionIds } });
      const transcriptIds = transcripts.map((t) => t._id);

      if (transcriptIds.length > 0) {
        // Hard delete transcript-dependent models
        await TechnicalEvaluationModel.deleteMany({ transcriptId: { $in: transcriptIds } });
        await ProblemSolvingEvaluationModel.deleteMany({ transcriptId: { $in: transcriptIds } });
        await CommunicationAnalysisModel.deleteMany({ transcriptId: { $in: transcriptIds } });
        await TranscriptAnalysisModel.deleteMany({ transcriptId: { $in: transcriptIds } });
      }

      // Hard delete session-dependent models
      await InterviewTranscriptModel.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewResponseModel.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewRecordingModel.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewScoreModel.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewReportModel.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewRecommendationModel.deleteMany({ sessionId: { $in: sessionIds } });
      await InterviewTimelineModel.deleteMany({ sessionId: { $in: sessionIds } });
      
      // Hard delete the sessions
      await InterviewSessionModel.deleteMany({ candidateId });
    }

    // 4. Soft delete the candidate
    return await candidateRepository.softDelete(candidateId);
  }

  /**
   * Get Candidate details
   */
  async getCandidateDetails(candidateId: string): Promise<ICandidate | null> {
    return await candidateRepository.findById(candidateId);
  }

  /**
   * List candidates with pagination and search (Admin/Recruiter)
   */
  async listCandidates(query: CandidateQueryDTO, pagination: PaginationDTO) {
    return await candidateRepository.findWithPagination(query, pagination);
  }
}

export default new CandidatesService();
