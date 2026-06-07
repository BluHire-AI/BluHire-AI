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
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import InterviewTemplate from '../../../models/InterviewTemplate';
import InterviewAssignment from '../../../models/InterviewAssignment';
import { userRepository } from '../../../repositories/user.repository';
import DepartmentModel from '../../../models/Department';
import DesignationModel from '../../../models/Designation';

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
  async moveStage(
    applicationId: string, 
    stage: ApplicationStage, 
    userId: string, 
    notes?: string,
    onboardingData?: {
      employeeRole?: string;
      departmentId?: string;
      designationId?: string;
      managerId?: string;
      joiningDate?: Date;
    }
  ): Promise<IApplication> {
    const app = await applicationRepository.findById(applicationId);
    if (!app) {
      throw new Error('Application record not found');
    }

    if (app.currentStage === stage) {
      return app;
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

      // Resolve department & designation (either from onboardingData or Job fallback)
      const deptId = onboardingData?.departmentId || (job.departmentId && typeof job.departmentId === 'object' && '_id' in job.departmentId
        ? (job.departmentId as any)._id.toString()
        : job.departmentId?.toString());

      const desigId = onboardingData?.designationId || (job.designationId && typeof job.designationId === 'object' && '_id' in job.designationId
        ? (job.designationId as any)._id.toString()
        : job.designationId?.toString());

      const managerId = onboardingData?.managerId || undefined;
      const joiningDate = onboardingData?.joiningDate ? new Date(onboardingData.joiningDate) : new Date();

      // Find user to associate
      const user = await userRepository.findByEmail(candidate.email);
      let userObjId: string | undefined;
      if (user) {
        userObjId = user._id.toString();
      }

      // Create Employee profile
      const employee = await employeeService.createEmployee(
        {
          employeeCode: empCode,
          userId: userObjId, // Link User to Employee record!
          firstName: candidate.firstName,
          lastName: candidate.lastName,
          email: candidate.email,
          phone: candidate.phone,
          departmentId: deptId,
          designationId: desigId,
          managerId,
          employmentType: job.employmentType as any,
          joiningDate,
          workLocation: job.location || 'Headquarters',
          skills: candidate.skills,
          experience: parseFloat(candidate.experience || '0') || 0,
          notes: `Hired via candidate application ${candidate.candidateCode} for role: ${job.title}.`,
        } as any,
        userId
      );

      employeeId = employee._id.toString();

      // If user exists, promote their role and update details
      if (user) {
        const dept = await DepartmentModel.findById(deptId);
        const desig = await DesignationModel.findById(desigId);
        
        await userRepository.updateById(user._id.toString(), {
          employeeId: empCode,
          role: (onboardingData?.employeeRole || 'EMPLOYEE') as any,
          department: dept?.name || '',
          designation: desig?.title || '',
        } as any);
      }

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

    if (stage === ApplicationStage.SHORTLISTED && app.currentStage !== ApplicationStage.SHORTLISTED) {
      const candidateObj: any = app.candidateId;
      const jobObj: any = app.jobId;

      if (!candidateObj || !jobObj) {
        throw new Error('Unable to shortlist: Candidate or Job record is missing.');
      }

      // 1. Resolve or Create InterviewTemplate
      let template = await InterviewTemplate.findOne({ jobRole: jobObj.title, isArchived: false });
      if (!template) {
        template = await InterviewTemplate.create({
          name: `Default Template - ${jobObj.title}`,
          jobRole: jobObj.title,
          department: jobObj.departmentId?.name || 'Engineering',
          experienceLevel: jobObj.experienceRequired || 'Mid',
          difficultyLevel: 'Medium',
          skillsRequired: jobObj.requiredSkills || [],
          numQuestions: 5,
          timeLimit: 15,
          interviewType: 'Mixed',
          maxAttempts: 1,
          showResultsToCandidate: false,
          createdBy: new mongoose.Types.ObjectId(userId) as any,
          updatedBy: new mongoose.Types.ObjectId(userId) as any,
        });
      }

      // 2. Generate magic link token
      const magicToken = crypto.randomBytes(32).toString('hex');
      const magicTokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

      // 3. Create Resume Screening snapshot
      const resumeSnapshot = {
        aiScore: app.aiScore || 0,
        aiRecommendation: app.aiRecommendation || 'Needs Review',
        matchingSkills: app.matchingSkills || [],
        missingSkills: app.missingSkills || [],
        screeningSummary: app.screeningSummary || 'Screening snapshot created.',
      };

      // 4. Create/Update InterviewAssignment
      await InterviewAssignment.findOneAndUpdate(
        { candidateId: candidateObj._id, jobId: jobObj._id },
        {
          recruiterId: new mongoose.Types.ObjectId(userId),
          interviewTemplateId: template._id,
          status: 'Pending',
          assignedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
          magicToken,
          magicTokenExpiresAt,
          isTokenUsed: false,
          maxAttempts: template.maxAttempts || 1,
          attemptCount: 0,
          showResultsToCandidate: (template as any).showResultsToCandidate || false,
          resumeSnapshot,
          resumeScore: app.aiScore || 0,
          resumeAnalysis: app.screeningSummary || 'Screening snapshot created.',
          screeningTimestamp: app.screenedAt || new Date(),
          createdBy: new mongoose.Types.ObjectId(userId),
          updatedBy: new mongoose.Types.ObjectId(userId),
        },
        { upsert: true, new: true }
      );

      // 5. Log magic invitation
      console.log('--------------------------------------------------');
      console.log(`[EMAIL DISPATCH] Magic Link sent to: ${candidateObj.email}`);
      console.log(`URL: http://localhost:3000/careers/activate?token=${magicToken}`);
      console.log('--------------------------------------------------');
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
    else if (stage === ApplicationStage.OFFER) actType = RecruitmentActivityType.OFFER_RELEASED;

    await recruitmentActivityRepository.create({
      applicationId: updatedApp._id,
      candidateId: updatedApp.candidateId as any,
      jobId: updatedApp.jobId as any,
      title: actType,
      description: `Application stage changed to ${stage} for ${
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
}

export default new ApplicationsService();
