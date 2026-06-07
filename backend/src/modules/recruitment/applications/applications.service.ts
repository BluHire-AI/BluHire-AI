import applicationRepository, { ApplicationQueryDTO } from '../repositories/application.repository';
import jobRepository from '../repositories/job.repository';
import candidateRepository from '../repositories/candidate.repository';
import recruitmentActivityRepository from '../repositories/recruitment-activity.repository';
import candidatesService from '../candidates/candidates.service';
import jobsService from '../jobs/jobs.service';
import { IApplication, ApplicationStage } from '../../../models/Application';
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

export class ApplicationsService {
  /**
   * Helper to generate a unique employee code
   */
  private async generateEmployeeCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await EmployeeModel.countDocuments();
    let index = count + 1;
    let empCode = `EMP-${year}-${index.toString().padStart(4, '0')}`;

    // Ensure uniqueness
    while (await EmployeeRepository.codeExists(empCode)) {
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

    const matchingSkills = candSkills.filter((s: string) =>
      reqSkills.some((reqS: string) => reqS.toLowerCase().trim() === s.toLowerCase().trim())
    );
    const missingSkills = reqSkills.filter(
      (reqS: string) => !candSkills.some((s: string) => s.toLowerCase().trim() === reqS.toLowerCase().trim())
    );

    const aiScore = reqSkills.length ? Math.round((matchingSkills.length / reqSkills.length) * 100) : 75;
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
  async moveStage(applicationId: string, stage: ApplicationStage, userId: string, notes?: string): Promise<IApplication> {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new Error('Application record not found');
    }

    if (app.currentStage === stage) {
      return app;
    }

    // STRICT SEQUENCE ENFORCEMENT
    const stageOrder = [
      ApplicationStage.APPLIED,
      ApplicationStage.SCREENING,
      ApplicationStage.SHORTLISTED,
      ApplicationStage.INTERVIEW,
      ApplicationStage.HIRED
    ];

    if (stage !== ApplicationStage.REJECTED) {
      const currentIndex = stageOrder.indexOf(app.currentStage);
      const targetIndex = stageOrder.indexOf(stage);

      if (targetIndex !== currentIndex + 1) {
        throw new Error(`Invalid stage transition. Candidates must move sequentially. Cannot move from ${app.currentStage} to ${stage}.`);
      }
    }

    // Handle Hired Event (Promote Candidate -> Employee)
    let employeeId: string | undefined;
    if (stage === ApplicationStage.HIRED && app.currentStage !== ApplicationStage.HIRED) {
      const candidate = await candidateRepository.findById(app.candidateId as any);
      const job = await jobRepository.findById(app.jobId as any);

      if (!candidate || !job) {
        throw new Error('Unable to complete hire: candidate or job record is missing.');
      }

      // Generate unique code for new employee
      const empCode = await this.generateEmployeeCode();

      const deptId = job.departmentId && typeof job.departmentId === 'object' && '_id' in job.departmentId
        ? (job.departmentId as any)._id.toString()
        : job.departmentId.toString();

      const desigId = job.designationId && typeof job.designationId === 'object' && '_id' in job.designationId
        ? (job.designationId as any)._id.toString()
        : job.designationId.toString();

      // Create Employee profile
      const employee = await employeeService.createEmployee(
        {
          employeeCode: empCode,
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          departmentId: deptId,
          designationId: desigId,
          employmentType: job.employmentType as any,
          joiningDate: new Date(),
          workLocation: job.location || 'Headquarters',
          skills: candidate.skills,
          experience: parseFloat(candidate.experience || '0') || 0,
          notes: `Hired via candidate application ${candidate.candidateCode} for role: ${job.title}.`,
        } as any,
        userId
      );

      employeeId = employee._id.toString();

      // ✅ FIX 5: Update Candidate status to SELECTED and record hiredAt
      await CandidateModel.findByIdAndUpdate(candidate._id, {
        status: 'SELECTED',
      });
      await applicationRepository.update(applicationId, { hiredAt: new Date() });

      // Log Recruitment activity for hire
      await recruitmentActivityRepository.create({
        applicationId: app._id,
        candidateId: candidate._id,
        jobId: job._id,
        title: RecruitmentActivityType.CANDIDATE_HIRED,
        description: `Candidate ${candidate.firstName} ${candidate.lastName} was hired as employee ${empCode}.`,
        createdBy: userId,
      });
    }

    // ✅ FIX 5: Sync Candidate.status for REJECTED stage
    if (stage === ApplicationStage.REJECTED && app.currentStage !== ApplicationStage.REJECTED) {
      const candidateForRejection = await candidateRepository.findById(app.candidateId as any);
      if (candidateForRejection) {
        await CandidateModel.findByIdAndUpdate(candidateForRejection._id, { status: 'REJECTED' });
      }
    }

    // Update application stage
    const updatedApp = await applicationRepository.updateStage(applicationId, stage, userId, notes);
    if (!updatedApp) {
      throw new Error('Failed to update stage history');
    }

    // Set employeeId link if created
    if (employeeId) {
      await applicationRepository.update(applicationId, { employeeId });
      updatedApp.employeeId = employeeId;
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

    // Get an active template
    const template = await InterviewTemplate.findOne({ status: TemplateStatus.ACTIVE });
    if (!template) {
      throw new Error('No active Interview Template found. Please create one first.');
    }

    // Generate Token
    const publicToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create Interview Session
    const session = new InterviewSession({
      candidateId: candidate._id,
      templateId: template._id,
      recruiterId: userId,
      status: SessionStatus.CREATED,
      totalQuestions: template.questionCount || 5,
      publicToken,
      tokenExpiresAt: expiresAt,
    });
    await session.save();

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
    await emailService.sendInterviewInvitation(
      candidate.email,
      candidate.firstName,
      job.title,
      interviewUrl,
      expiresAt.toLocaleDateString()
    );

    return session;
  }

  /**
   * Hire Candidate — Creates User account + Employee record + Sends Onboarding Email
   */
  async hireCandidate(applicationId: string, recruiterId: string): Promise<any> {
    // 1. Fetch the application with candidate + job info
    const app = await applicationRepository.findById(applicationId);
    if (!app) throw new Error('Application not found.');

    const candidate = await CandidateModel.findById(app.candidateId);
    if (!candidate) throw new Error('Candidate record not found.');

    const job = await jobRepository.findById(app.jobId);
    if (!job) throw new Error('Job record not found.');

    // 2. Check if an ACTIVE employee record already exists for this email
    //    Allow re-hire: if the record is soft-deleted or set to RESIGNED/TERMINATED, we reactivate it
    const activeEmployee = await EmployeeModel.findOne({
      email: candidate.email,
      isDeleted: false,
      employmentStatus: EmploymentStatus.ACTIVE,
    });
    if (activeEmployee) {
      throw new Error('An active employee record already exists for this email address. Please delete the existing record first.');
    }

    // Look up any existing User account (may have been deactivated from a previous hire+delete)
    const existingUser = await User.findOne({ email: candidate.email });

    // 3. Generate a secure temporary password
    const temporaryPassword = `Blu@${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const passwordHash = await hashPassword(temporaryPassword);

    // 4. Generate unique Employee ID
    const year = new Date().getFullYear();
    const count = await User.countDocuments({ role: SystemRoles.EMPLOYEE });
    const employeeId = `EMP-${year}-${(count + 1).toString().padStart(4, '0')}`;

    // 5. Create or re-activate User account with EMPLOYEE role
    let userAccount = existingUser;
    if (!existingUser) {
      userAccount = await User.create({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone || '0000000000',
        employeeId,
        role: SystemRoles.EMPLOYEE,
        passwordHash,
        mustChangePassword: true,
        isActive: true,
      });
    } else {
      // Re-activate and upgrade (covers re-hire after cascade deletion)
      await User.findByIdAndUpdate(existingUser._id, {
        role: SystemRoles.EMPLOYEE,
        employeeId,
        passwordHash,
        mustChangePassword: true,
        isActive: true,              // Re-activate if previously deactivated
        refreshToken: null,          // Clear old sessions
      });
    }

    // 5b. Create or reactivate the Employee record (required for attendance/leaves/reviews)
    const newUserId = (userAccount?._id || existingUser?._id)?.toString();
    let employeeRecord = await EmployeeModel.findOne({ email: candidate.email });

    if (!employeeRecord) {
      // Generate a unique employee code
      const empCount = await EmployeeModel.countDocuments();
      const empCode = `EMP${new Date().getFullYear()}${(empCount + 1).toString().padStart(4, '0')}`;

      employeeRecord = await EmployeeModel.create({
        employeeCode: empCode,
        userId: newUserId,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone || '0000000000',
        departmentId: job.departmentId,
        designationId: job.designationId,
        employmentType: (job.employmentType as EmploymentType) || EmploymentType.FULL_TIME,
        joiningDate: new Date(),
        workLocation: job.location || 'Head Office',
        employmentStatus: EmploymentStatus.ACTIVE,
        skills: candidate.skills || [],
        isDeleted: false,
        createdBy: recruiterId.toString(),
      });
    } else {
      // Re-activate a previously soft-deleted employee record
      await EmployeeModel.findByIdAndUpdate(employeeRecord._id, {
        userId: newUserId,
        departmentId: job.departmentId,
        designationId: job.designationId,
        joiningDate: new Date(),
        workLocation: job.location || 'Head Office',
        employmentStatus: 'ACTIVE',
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
    await emailService.sendOnboardingEmail(
      candidate.email,
      `${candidate.firstName} ${candidate.lastName}`,
      job.title,
      candidate.email,
      temporaryPassword,
      loginUrl
    );

    console.log(`[Hire] Candidate ${candidate.email} hired. Temp password: ${temporaryPassword}`);

    return {
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      email: candidate.email,
      employeeId,
      jobTitle: job.title,
      userId: userAccount?._id,
    };
  }
}

export default new ApplicationsService();
