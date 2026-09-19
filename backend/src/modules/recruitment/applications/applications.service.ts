import mongoose from 'mongoose';
import applicationRepository, { ApplicationQueryDTO } from '../repositories/application.repository';
import jobRepository from '../repositories/job.repository';
import candidateRepository from '../repositories/candidate.repository';
import recruitmentActivityRepository from '../repositories/recruitment-activity.repository';
import candidatesService from '../candidates/candidates.service';
import jobsService from '../jobs/jobs.service';
import Application, { IApplication, ApplicationStage } from '../../../models/Application';
import { RecruitmentActivityType } from '../../../models/RecruitmentActivity';
import { PaginationDTO } from '../../employee/dtos/common.dto';
import { employeeService } from '../../employee';
import EmployeeModel from '../../../models/Employee';
import EmployeeRepository from '../../employee/repositories/employee.repository';
import CandidateModel from '../../../models/Candidate';
import path from 'path';
import crypto from 'crypto';
import InterviewSession from '../../../models/InterviewSession';
import InterviewTemplate from '../../../models/InterviewTemplate';
import { emailService } from '../../../services/email.service';
import { SessionStatus, TemplateStatus } from '../../../types/interview.types';
import { User } from '../../../models/User';
import { hashPassword } from '../../../utils/password.util';
import { SystemRoles } from '../../../models/roles';
import { EmploymentStatus, EmploymentType } from '../../../models/Employee';
import TechnicalEvaluation from '../../../models/TechnicalEvaluation';
import CommunicationAnalysis from '../../../models/CommunicationAnalysis';
import ProblemSolvingEvaluation from '../../../models/ProblemSolvingEvaluation';
import InterviewRecommendation from '../../../models/InterviewRecommendation';
import InterviewTranscript from '../../../models/InterviewTranscript';
import InterviewResponse from '../../../models/InterviewResponse';
import { computeSkillMatch } from '../../../utils/skill-matcher';
import { isSubstantiveAnswer, calculateAnswerStats } from '../../../utils/transcript-validator';

export class ApplicationsService {
  /**
   * Helper to generate a unique employee code
   */
  private async generateEmployeeCode(): Promise<string> {
    const year = new Date().getFullYear();
    const [empCount, userCount] = await Promise.all([
      EmployeeModel.countDocuments(),
      User.countDocuments(),
    ]);
    let index = Math.max(empCount, userCount) + 1;
    let empCode = `EMP-${year}-${index.toString().padStart(4, '0')}`;

    // Ensure uniqueness across BOTH Employee and User collections
    while (
      (await EmployeeRepository.codeExists(empCode)) ||
      (await EmployeeModel.exists({ employeeCode: empCode })) ||
      (await User.exists({ employeeId: empCode }))
    ) {
      index++;
      empCode = `EMP-${year}-${index.toString().padStart(4, '0')}`;
    }
    return empCode;
  }

  /**
   * Apply to Job (from careers portal)
   */
  async applyToJob(candidateData: any, jobId: string, resumeFile?: any): Promise<IApplication> {
    const job = await jobRepository.findById(jobId);
    if (!job) {
      throw new Error('The requested job position does not exist.');
    }

    // Process Candidate
    let candidate = await candidatesService.getOrCreateCandidate(candidateData);

    // If resume file is uploaded, update candidate record
    if (resumeFile) {
      const ext = path.extname(resumeFile.originalname).substring(1);
      const resume = {
        fileName: resumeFile.filename,
        fileType: ext,
        fileUrl: `/api/v1/recruitment/resumes/download/${resumeFile.filename}`,
        uploadedAt: new Date(),
      };
      const updatedCandidate = await candidateRepository.update(candidate._id, { resume });
      if (updatedCandidate) {
        candidate = updatedCandidate;
      }
    }

    // Check duplicate application (Same candidate email + same job)
    const existingApp = await applicationRepository.findByCandidateAndJob(candidate._id, jobId);
    if (existingApp) {
      throw new Error('You have already applied for this job position.');
    }

    // Calculate AI matching details based on candidate skills vs job requiredSkills
    const candSkills = candidate.skills || [];
    const reqSkills = job.requiredSkills || [];

    const { matched: matchingSkills, missing: missingSkills, matchPercentage } = computeSkillMatch(
      candSkills,
      reqSkills
    );

    const aiScore = reqSkills.length ? Math.round(matchPercentage) : 75;
    const aiRecommendation =
      aiScore >= 75
        ? 'Strongly Recommended'
        : aiScore >= 50
        ? 'Recommended'
        : aiScore >= 30
        ? 'Requires Screen'
        : 'Not Recommended';

    // Create Application
    const application = await applicationRepository.create({
      candidateId: candidate._id,
      jobId,
      currentStage: ApplicationStage.APPLIED,
      status: 'ACTIVE',
      appliedAt: new Date(),
      aiScore,
      screeningScore: aiScore,
      aiRecommendation,
      matchingSkills,
      missingSkills,
      screeningSummary: 'System auto-screened based on skills profile.',
      stageHistory: [
        {
          stage: ApplicationStage.APPLIED,
          changedAt: new Date(),
          changedBy: candidate._id, // Public application is initiated by candidate
          notes: 'Application submitted via careers portal.',
        },
      ],
    });

    // Log Activity
    await recruitmentActivityRepository.create({
      applicationId: application._id,
      candidateId: candidate._id,
      jobId,
      title: RecruitmentActivityType.CANDIDATE_APPLIED,
      description: `Candidate ${candidate.firstName} ${candidate.lastName} applied for job "${job.title}".`,
      createdBy: candidate._id,
    });

    return application;
  }

  /**
   * Move Application Stage
   */
  async moveStage(applicationId: string, stage: ApplicationStage, userId: string, notes?: string, onboardingData?: any): Promise<IApplication> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new Error('Invalid application ID format');
    }

    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new Error('Application record not found');
    }

    if (app.currentStage === stage) {
      return app;
    }

    // Relaxed Sequence Enforcement
    const stageOrder = Object.values(ApplicationStage);
    if (!stageOrder.includes(stage)) {
      throw new Error(`Invalid stage transition requested: ${stage}`);
    }

    const prevStage = app.currentStage;
    console.log(`[STAGE CHANGE] Application ID: ${applicationId}`);
    console.log(`- Previous Stage: ${prevStage}`);
    console.log(`- Requested Stage: ${stage}`);
    console.log(`- Validation Result: SUCCESS (Transitions are unrestricted)`);

    // Delegate INTERVIEW directly to inviteToInterview so session, token, and invitation email are set up
    if (stage === ApplicationStage.INTERVIEW && prevStage !== ApplicationStage.INTERVIEW) {
      console.log(`[STAGE CHANGE] Transitioning to INTERVIEW. Calling inviteToInterview...`);
      await this.inviteToInterview(applicationId, userId);
      return await applicationRepository.findById(applicationId) as IApplication;
    }

    // Delegate HIRED directly to hireCandidate to handle user account setup, employee profiles, and onboarding emails
    if (stage === ApplicationStage.HIRED && prevStage !== ApplicationStage.HIRED) {
      console.log(`[STAGE CHANGE] Transitioning to HIRED. Calling hireCandidate...`);
      await this.hireCandidate(applicationId, userId, onboardingData);
      return await applicationRepository.findById(applicationId) as IApplication;
    }

    // Send Rejection Email if stage is REJECTED
    if (stage === ApplicationStage.REJECTED && prevStage !== ApplicationStage.REJECTED) {
      const candidateForRejection = await candidateRepository.findById(app.candidateId as any);
      const job = await jobRepository.findById(app.jobId as any);
      if (candidateForRejection) {
        await CandidateModel.findByIdAndUpdate(candidateForRejection._id, { status: 'REJECTED' });
        
        if (job) {
          console.log(`[EMAIL] Attempting to send Rejection email to ${candidateForRejection.email} for ${job.title}...`);
          try {
            const success = await emailService.sendRejectionEmail(
              candidateForRejection.email,
              `${candidateForRejection.firstName} ${candidateForRejection.lastName}`,
              job.title
            );
            if (success) {
              console.log(`[EMAIL] Rejection Email Sent\nCandidate: ${candidateForRejection.firstName} ${candidateForRejection.lastName}\nEmail: ${candidateForRejection.email}\nTemplate: Rejected\nStage: REJECTED\nProvider: Resend\nMessageId: N/A\nStatus: Success`);
            } else {
              console.error(`[EMAIL ERROR]\nCandidate: ${candidateForRejection.firstName} ${candidateForRejection.lastName}\nEmail: ${candidateForRejection.email}\nTemplate: Rejected\nStage: REJECTED\nProvider: Resend\nStatus: Failed\nReason: SMTP/API Rejected`);
            }
          } catch (err: any) {
            console.error(`[EMAIL ERROR]\nCandidate: ${candidateForRejection.firstName} ${candidateForRejection.lastName}\nEmail: ${candidateForRejection.email}\nTemplate: Rejected\nStage: REJECTED\nProvider: Resend\nStatus: Failed\nReason: ${err.message}`);
          }
        }
      }
    }

    // Send Shortlisted Email
    if (stage === ApplicationStage.SHORTLISTED && prevStage !== ApplicationStage.SHORTLISTED) {
      const candidate = await candidateRepository.findById(app.candidateId as any);
      const job = await jobRepository.findById(app.jobId as any);
      if (candidate && job) {
        console.log(`[EMAIL] Attempting to send Shortlisted email to ${candidate.email} for ${job.title}...`);
        try {
          const success = await emailService.sendShortlistedEmail(
            candidate.email,
            `${candidate.firstName} ${candidate.lastName}`,
            job.title
          );
          if (success) {
            console.log(`[EMAIL] Shortlisted Email Sent\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Shortlisted\nStage: SHORTLISTED\nProvider: Resend\nMessageId: N/A\nStatus: Success`);
          } else {
            console.error(`[EMAIL ERROR]\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Shortlisted\nStage: SHORTLISTED\nProvider: Resend\nStatus: Failed\nReason: SMTP/API Rejected`);
          }
        } catch (err: any) {
          console.error(`[EMAIL ERROR]\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Shortlisted\nStage: SHORTLISTED\nProvider: Resend\nStatus: Failed\nReason: ${err.message}`);
        }
      }
    }

    // Send Offer Letter Email
    if (stage === ApplicationStage.OFFER && prevStage !== ApplicationStage.OFFER) {
      const candidate = await candidateRepository.findById(app.candidateId as any);
      const job = await jobRepository.findById(app.jobId as any);
      if (candidate && job) {
        console.log(`[EMAIL] Attempting to send Offer Letter email to ${candidate.email} for ${job.title}...`);
        try {
          const success = await emailService.sendOfferLetterEmail(
            candidate.email,
            `${candidate.firstName} ${candidate.lastName}`,
            job.title
          );
          if (success) {
            console.log(`[EMAIL] Offer Letter Sent\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Offer Letter\nStage: OFFER\nProvider: Resend\nMessageId: N/A\nStatus: Success`);
          } else {
            console.error(`[EMAIL ERROR]\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Offer Letter\nStage: OFFER\nProvider: Resend\nStatus: Failed\nReason: SMTP/API Rejected`);
          }
        } catch (err: any) {
          console.error(`[EMAIL ERROR]\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Offer Letter\nStage: OFFER\nProvider: Resend\nStatus: Failed\nReason: ${err.message}`);
        }
      }
    }

    // Update application stage
    const updatedApp = await applicationRepository.updateStage(applicationId, stage, userId, notes);
    if (!updatedApp) {
      throw new Error('Failed to update stage history');
    }

    // Log Activity log for stage change
    let actType = RecruitmentActivityType.STAGE_CHANGED;
    if (stage === ApplicationStage.SHORTLISTED) actType = RecruitmentActivityType.CANDIDATE_SHORTLISTED;
    else if (stage === ApplicationStage.INTERVIEW) actType = RecruitmentActivityType.INTERVIEW_SCHEDULED;
    else if (stage === ApplicationStage.REJECTED) actType = RecruitmentActivityType.STAGE_CHANGED;

    await recruitmentActivityRepository.create({
      applicationId: updatedApp._id,
      candidateId: updatedApp.candidateId as any,
      jobId: updatedApp.jobId as any,
      title: actType,
      description: `Application moved to ${stage} for ${
        (updatedApp.candidateId as any)?.firstName || 'Candidate'
      }.`,
      createdBy: userId,
    });

    return updatedApp;
  }

  /**
   * List applications (Admin/Recruiter)
   */
  async listApplications(query: ApplicationQueryDTO, pagination: PaginationDTO) {
    return await applicationRepository.findWithPagination(query, pagination);
  }

  /**
   * Get application pipeline board cards grouped by stage
   */
  async getPipeline(jobId?: string) {
    const { applications } = await applicationRepository.findWithPagination({ jobId, limit: 1000 } as any);
    
    // Group them
    const pipeline: Record<string, IApplication[]> = {
      [ApplicationStage.APPLIED]: [],
      [ApplicationStage.SCREENING]: [],
      [ApplicationStage.SHORTLISTED]: [],
      [ApplicationStage.INTERVIEW]: [],
      [ApplicationStage.OFFER]: [],
      [ApplicationStage.HIRED]: [],
      [ApplicationStage.REJECTED]: [],
    };

    applications.forEach((app) => {
      if (pipeline[app.currentStage]) {
        pipeline[app.currentStage].push(app);
      }
    });

    return pipeline;
  }

  /**
   * Get dashboard and recruitment analytics stats
   */
  async getAnalytics() {
    const totalJobs = await jobRepository.countOpenJobs();
    const totalCandidates = await candidateRepository.countAll();
    const totalApplications = await applicationRepository.countAll();
    const openJobsCount = await jobRepository.countOpenJobs();
    const newTodayCount = await applicationRepository.countNewToday();
    
    const pipelineStats = await applicationRepository.getPipelineStats();
    const recentActivities = await recruitmentActivityRepository.findRecent(10);

    return {
      openJobs: openJobsCount,
      totalJobs: totalJobs || openJobsCount,
      totalCandidates,
      totalApplications,
      newToday: newTodayCount,
      pipelineStats,
      recentActivities,
    };
  }

  /**
   * Get recent activity feed
   */
  async getActivities() {
    return await recruitmentActivityRepository.findRecent(20);
  }

  /**
   * Invite candidate to Interview
   */
  async inviteToInterview(applicationId: string, userId: string) {
    const app = await applicationRepository.findById(applicationId);
    if (!app) throw new Error('Application record not found.');

    if (app.currentStage === ApplicationStage.REJECTED) {
      throw new Error('Cannot invite a rejected candidate.');
    }

    const candidate = await candidateRepository.findById(app.candidateId as any);
    const job = await jobRepository.findById(app.jobId as any);

    if (!candidate || !job) {
      throw new Error('Candidate or Job record missing.');
    }

    // Check duplicate session
    const existingSession = await InterviewSession.findOne({
      candidateId: candidate._id,
      status: { $in: [SessionStatus.CREATED, SessionStatus.READY, SessionStatus.STARTED, SessionStatus.QUESTION_ACTIVE, SessionStatus.ANSWER_PROCESSING, SessionStatus.NEXT_QUESTION] }
    });

    if (existingSession) {
      existingSession.status = SessionStatus.CANCELLED;
      await existingSession.save();
    }

    // Generate Token
    const publicToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create Job-Aware Interview Session (Job is the source of truth)
    const session = new InterviewSession({
      candidateId: candidate._id,
      jobId: job._id,
      applicationId: app._id,
      recruiterId: userId,
      status: SessionStatus.CREATED,
      totalQuestions: 5,
      interviewConfig: { targetQuestions: 5, minimumQuestions: 4, maximumQuestions: 8 },
      publicToken,
      tokenExpiresAt: expiresAt,
    });
    await session.save();

    // Asynchronously initialize competency plan for this Job
    import('../../../services/question-generator.service').then(({ questionGeneratorService }) => {
      questionGeneratorService.initializeSessionCompetencies(session, job as any).catch((err: any) => {
        console.warn(`[JobPlan Warning] Pre-planning competencies async note: ${err.message}`);
      });
    });

    // Update Application Stage
    await applicationRepository.updateStage(app._id, ApplicationStage.INTERVIEW, userId, 'Candidate invited to AI Interview.');
    await applicationRepository.update(app._id, { interviewStatus: 'INTERVIEW_INVITED' });

    // Log Activity
    await recruitmentActivityRepository.create({
      applicationId: app._id,
      candidateId: candidate._id,
      jobId: job._id,
      title: RecruitmentActivityType.INTERVIEW_SCHEDULED,
      description: `Interview invitation sent to ${candidate.firstName} ${candidate.lastName}.`,
      createdBy: userId,
    });

    // Send Email
    const interviewUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/interview/${publicToken}`;
    console.log(`[EMAIL] Attempting to send Interview Invitation email to ${candidate.email} for ${job.title}...`);
    try {
      const success = await emailService.sendInterviewInvitation(
        candidate.email,
        candidate.firstName,
        job.title,
        interviewUrl,
        expiresAt.toLocaleDateString()
      );
      if (success) {
        console.log(`[EMAIL] Interview Invitation Sent\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Interview Invitation\nStage: INTERVIEW\nProvider: Resend\nMessageId: ${publicToken}\nStatus: Success`);
      } else {
        console.error(`[EMAIL ERROR]\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Interview Invitation\nStage: INTERVIEW\nProvider: Resend\nStatus: Failed\nReason: SMTP/API Rejected`);
      }
    } catch (err: any) {
      console.error(`[EMAIL ERROR]\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Interview Invitation\nStage: INTERVIEW\nProvider: Resend\nStatus: Failed\nReason: ${err.message}`);
    }

    return session;
  }

  /**
   * Hire Candidate — Creates User account + Employee record + Sends Onboarding Email
   */
  async hireCandidate(applicationId: string, recruiterId: string, onboardingData?: any): Promise<any> {
    // 1. Fetch the application with candidate + job info
    const app = await applicationRepository.findById(applicationId);
    if (!app) throw new Error('Application not found.');

    const candidate = await CandidateModel.findById(app.candidateId);
    if (!candidate) throw new Error('Candidate record not found.');

    const job = await jobRepository.findById(app.jobId);
    if (!job) throw new Error('Job record not found.');

    // 2. Check if an ACTIVE employee record already exists for this email
    const activeEmployee = await EmployeeModel.findOne({
      email: candidate.email,
      isDeleted: false,
      employmentStatus: EmploymentStatus.ACTIVE,
    });
    if (activeEmployee) {
      throw new Error('An active employee record already exists for this email address. Please delete the existing record first.');
    }

    // Look up any existing User account
    const existingUser = await User.findOne({ email: candidate.email });

    // 3. Generate a secure temporary password
    const temporaryPassword = `Blu@${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const passwordHash = await hashPassword(temporaryPassword);

    // 4. Generate or resolve unique Employee ID
    let employeeId = existingUser?.employeeId;
    if (!employeeId) {
      employeeId = await this.generateEmployeeCode();
    }

    // 5. Create or re-activate User account with EMPLOYEE role
    let userAccount = existingUser;
    if (!existingUser) {
      userAccount = await User.create({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone || '0000000000',
        employeeId,
        role: onboardingData?.employeeRole || SystemRoles.EMPLOYEE,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
      });
    } else {
      const updateData: any = {
        role: onboardingData?.employeeRole || existingUser.role || SystemRoles.EMPLOYEE,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
        refreshToken: null,
      };
      if (!existingUser.employeeId) {
        updateData.employeeId = employeeId;
      }
      userAccount = await User.findByIdAndUpdate(existingUser._id, updateData, { new: true });
    }

    // 5b. Create or reactivate the Employee record
    const newUserId = (userAccount?._id || existingUser?._id)?.toString();
    let employeeRecord = await EmployeeModel.findOne({ email: candidate.email });

    const deptId = onboardingData?.departmentId || (job.departmentId && typeof job.departmentId === 'object' && '_id' in job.departmentId
      ? (job.departmentId as any)._id.toString()
      : job.departmentId?.toString());

    const desigId = onboardingData?.designationId || (job.designationId && typeof job.designationId === 'object' && '_id' in job.designationId
      ? (job.designationId as any)._id.toString()
      : job.designationId?.toString());

    if (!employeeRecord) {
      // Keep employeeCode in sync with employeeId
      let finalEmpCode = employeeId;
      if (await EmployeeRepository.codeExists(finalEmpCode)) {
        finalEmpCode = await this.generateEmployeeCode();
      }

      employeeRecord = await EmployeeModel.create({
        employeeCode: finalEmpCode,
        userId: newUserId,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone || '0000000000',
        departmentId: deptId,
        designationId: desigId,
        employmentType: (job.employmentType as EmploymentType) || EmploymentType.FULL_TIME,
        joiningDate: onboardingData?.joiningDate ? new Date(onboardingData.joiningDate) : new Date(),
        workLocation: job.location || 'Head Office',
        employmentStatus: EmploymentStatus.ACTIVE,
        managerId: onboardingData?.managerId === 'NONE' || !onboardingData?.managerId ? undefined : onboardingData.managerId,
        skills: candidate.skills || [],
        isDeleted: false,
        createdBy: recruiterId.toString(),
      });
    } else {
      await EmployeeModel.findByIdAndUpdate(employeeRecord._id, {
        userId: newUserId,
        departmentId: deptId,
        designationId: desigId,
        joiningDate: onboardingData?.joiningDate ? new Date(onboardingData.joiningDate) : new Date(),
        workLocation: job.location || 'Head Office',
        employmentStatus: EmploymentStatus.ACTIVE,
        managerId: onboardingData?.managerId === 'NONE' || !onboardingData?.managerId ? undefined : onboardingData.managerId,
        isDeleted: false,
        updatedBy: recruiterId,
      });
    }

    // 6. Move Application to HIRED stage
    await applicationRepository.updateStage(app._id, ApplicationStage.HIRED, recruiterId, 'Candidate hired and onboarded.');
    await applicationRepository.update(app._id, {
      hiredAt: new Date(),
      status: 'HIRED',
      employeeId: employeeRecord._id.toString()
    });

    // 7. Update candidate status
    await CandidateModel.findByIdAndUpdate(candidate._id, { status: 'HIRED' });

    // 8. Log Activity
    await recruitmentActivityRepository.create({
      applicationId: app._id,
      candidateId: candidate._id,
      jobId: job._id,
      title: RecruitmentActivityType.CANDIDATE_HIRED,
      description: `${candidate.firstName} ${candidate.lastName} was hired for ${job.title}.`,
      createdBy: recruiterId,
    });

    // 9. Send congratulations onboarding email
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login`;
    console.log(`[EMAIL] Attempting to send Onboarding email to ${candidate.email} for ${job.title}...`);
    try {
      const success = await emailService.sendOnboardingEmail(
        candidate.email,
        `${candidate.firstName} ${candidate.lastName}`,
        job.title,
        candidate.email,
        temporaryPassword,
        loginUrl
      );
      if (success) {
        console.log(`[EMAIL] Onboarding Email Sent\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Hired\nStage: HIRED\nProvider: Resend\nMessageId: N/A\nStatus: Success`);
      } else {
        console.error(`[EMAIL ERROR]\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Hired\nStage: HIRED\nProvider: Resend\nStatus: Failed\nReason: SMTP/API Rejected`);
      }
    } catch (err: any) {
      console.error(`[EMAIL ERROR]\nCandidate: ${candidate.firstName} ${candidate.lastName}\nEmail: ${candidate.email}\nTemplate: Hired\nStage: HIRED\nProvider: Resend\nStatus: Failed\nReason: ${err.message}`);
    }

    console.log(`[Hire] Candidate ${candidate.email} hired. Temp password: ${temporaryPassword}`);

    return {
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      email: candidate.email,
      employeeId,
      jobTitle: job.title,
      userId: userAccount?._id,
    };
  }

  /**
   * Calculate and synchronize scores from AI Interview to Recruitment Application
   */
  async syncApplicationScores(sessionId: string): Promise<void> {
    console.log(`[INTERVIEW COMPLETED] Session ID: ${sessionId}`);
    
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      console.error(`[EMAIL ERROR] Interview session not found for ID: ${sessionId}`);
      return;
    }

    let app: any = null;
    if (session.applicationId) {
      app = await Application.findOne({ _id: session.applicationId, isDeleted: false });
    }
    if (!app) {
      app = await Application.findOne({
        candidateId: session.candidateId,
        ...(session.jobId ? { jobId: session.jobId } : {}),
        isDeleted: false,
      }).sort({ createdAt: -1 });
    }
    if (!app) {
      console.error(`[AI_EVALUATION] Active application not found for candidate ${session.candidateId} (session: ${sessionId})`);
      return;
    }

    // Check whether InterviewResponses are still pending, transcribing, or evaluating
    const responses = await InterviewResponse.find({ sessionId });
    const hasInFlightResponses = responses.some(
      (r) =>
        r.responseStatus === 'PENDING' ||
        r.evaluationStatus === 'PROCESSING' ||
        r.evaluationStatus === 'NOT_STARTED' ||
        (r.recordingId && !r.transcriptId)
    );

    if (hasInFlightResponses) {
      console.log(`[AI_EVALUATION] Score synchronization deferred for session ${sessionId}: responses/evaluations are still in progress.`);
      return;
    }

    // Completeness & Answer Statistics based on substantive candidate transcripts
    const transcripts = await InterviewTranscript.find({ sessionId });
    const answerStats = calculateAnswerStats(session.totalQuestions, transcripts);
    const { totalQuestions, answeredCount, skippedCount, completenessScore, hasSubstantiveAnswers } = answerStats;

    // Check deterministic zero-answer terminal state for completed session ONLY when all responses are settled and no substantive answers exist
    if (session.status === SessionStatus.COMPLETED && totalQuestions > 0 && !hasSubstantiveAnswers) {
      console.log(`[ZERO-ANSWER INTERVIEW DETECTED] Session ${sessionId}: 0/${totalQuestions} questions answered. Setting INSUFFICIENT_EVIDENCE state.`);
      
      const zeroAnswerReason = "Candidate completed the interview session but provided no substantive responses. All interview questions were skipped, so technical, communication, and problem-solving ability could not be evaluated.";
      
      // Store recommendation as MAYBE_HIRE (Requires Review) with 0 confidence & explicit reasoning
      await InterviewRecommendation.findOneAndUpdate(
        { sessionId: session._id },
        {
          recommendation: 'MAYBE_HIRE',
          confidence: 0,
          reasoning: zeroAnswerReason,
        },
        { upsert: true, new: true }
      );

      const screeningScore = app.screeningScore || app.aiScore || 0;

      app.screeningScore = screeningScore;
      app.interviewScore = null as any; // Not evaluated
      app.interviewFeedback = zeroAnswerReason;
      app.interviewStatus = 'COMPLETED_NO_RESPONSES';
      app.aiRecommendation = 'Requires Review';
      // DO NOT auto-reject application stage or candidate status — keep in active pipeline for recruiter decision

      // Only update candidate status if not already advanced
      const cand = await CandidateModel.findById(session.candidateId);
      if (cand && ['APPLIED', 'SCREENING'].includes(cand.status)) {
        await CandidateModel.findByIdAndUpdate(session.candidateId, { status: 'UNDER_REVIEW' });
      }
      await app.save();

      console.log(`[APPLICATION UPDATED] Session ${sessionId} marked as COMPLETED_NO_RESPONSES; preserved in review pipeline.`);
      return;
    }

    // Filter to substantive transcripts only
    const substantiveTranscripts = transcripts.filter(t => isSubstantiveAnswer(t.transcript));
    const substantiveIds = substantiveTranscripts.map(t => t._id);

    let techScore = 0;
    let commScore = 0;
    let probScore = 0;
    let overallInterviewScore = 0;

    if (substantiveIds.length > 0) {
      const techEvals = await TechnicalEvaluation.find({ transcriptId: { $in: substantiveIds } });
      const commEvals = await CommunicationAnalysis.find({ transcriptId: { $in: substantiveIds } });
      const probEvals = await ProblemSolvingEvaluation.find({ transcriptId: { $in: substantiveIds } });

      const avg = (arr: any[], field: string) =>
        arr.length > 0 ? arr.reduce((s, e) => s + (e[field] || 0), 0) / arr.length : 0;

      const avgTech = avg(techEvals, 'overallTechnicalScore');
      const avgComm = avg(commEvals, 'communicationScore');
      const avgProb = avg(probEvals, 'overallProblemSolvingScore');

      techScore = Math.round(avgTech * 10);
      commScore = Math.round(avgComm * 10);
      probScore = Math.round(avgProb * 10);

      overallInterviewScore = Math.round(
        (techScore * 0.40) +
        (commScore * 0.30) +
        (probScore * 0.30)
      );
    }

    console.log(`[INTERVIEW SCORE GENERATED] Score: ${overallInterviewScore} (Tech: ${techScore}, Comm: ${commScore}, Prob: ${probScore}), Completeness: ${completenessScore}% (${answeredCount}/${totalQuestions} answered)`);

    const screeningScore = app.screeningScore || app.aiScore || 40;
    const finalScore = Math.round((screeningScore * 0.4) + (overallInterviewScore * 0.6));

    // Update Application
    app.interviewStatus = 'COMPLETED';
    app.interviewCompletedAt = session.completedAt || app.interviewCompletedAt || new Date();
    app.screeningScore = screeningScore;
    app.interviewScore = overallInterviewScore;
    app.finalScore = finalScore;
    app.aiScore = finalScore;

    // Fetch recommendation & proctoring check
    const rec = await InterviewRecommendation.findOne({ sessionId });
    if (rec) {
      console.log(`[FINAL SCORE RECALCULATED] Recommendation: ${rec.recommendation}`);
      app.aiRecommendation = rec.recommendation;
      app.interviewFeedback = rec.reasoning || app.interviewFeedback;

      // Never downgrade OFFER or HIRED stages
      const isOfferOrHired = app.currentStage === ApplicationStage.OFFER || app.currentStage === ApplicationStage.HIRED;

      if (rec.recommendation === 'REJECT') {
        if (!isOfferOrHired) {
          app.currentStage = ApplicationStage.REJECTED;
          app.status = 'REJECTED';
          await CandidateModel.findByIdAndUpdate(session.candidateId, { status: 'REJECTED' });
          console.log(`[APPLICATION UPDATED] Auto-rejected candidate based on REJECT recommendation.`);
        }
      } else if (rec.recommendation === 'HIRE') {
        if (!isOfferOrHired) {
          app.currentStage = ApplicationStage.SHORTLISTED;
          await CandidateModel.findByIdAndUpdate(session.candidateId, { status: 'SHORTLISTED' });
          console.log(`[APPLICATION UPDATED] Auto-shortlisted candidate based on HIRE recommendation.`);
        }
      }
    }

    await app.save();
  }

  /**
   * Recalculate scores for all completed interview sessions
   */
  async recalculateAllScores(): Promise<number> {
    const sessions = await InterviewSession.find({ status: SessionStatus.COMPLETED });
    console.log(`Recalculating scores for ${sessions.length} completed sessions...`);
    let count = 0;
    for (const session of sessions) {
      try {
        await this.syncApplicationScores(session._id.toString());
        count++;
      } catch (err: any) {
        console.error(`Failed to sync session ${session._id}: ${err.message}`);
      }
    }
    return count;
  }
}

export default new ApplicationsService();
