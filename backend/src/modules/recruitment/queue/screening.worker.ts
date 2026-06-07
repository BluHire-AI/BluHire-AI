import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import ApplicationModel from '../../../models/Application';
import CandidateModel from '../../../models/Candidate';
import JobModel from '../../../models/Job';
import recruitmentActivityRepository from '../repositories/recruitment-activity.repository';
import { RecruitmentActivityType } from '../../../models/RecruitmentActivity';

const screeningResultSchema = z.object({
  aiScore: z.number().int().min(0).max(100),
  matchingSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  experienceMatch: z.string().optional().default(''),
  educationMatch: z.string().optional().default(''),
  screeningSummary: z.string().optional().default(''),
  aiRecommendation: z.enum(['Strong Hire', 'Hire', 'Needs Review', 'Reject']).default('Needs Review'),
  resumeLength: z.number().optional().default(0),
  modelUsed: z.string().optional().default('Unknown')
});

class ScreeningWorker {
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('AI Resume Screening Worker started.');
    this.poll();
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
  }

  private async poll() {
    if (!this.isRunning) return;

    try {
      // Lock a PENDING job atomically
      const app = await ApplicationModel.findOneAndUpdate(
        { screeningStatus: 'PENDING', isDeleted: false },
        { screeningStatus: 'PROCESSING', updatedAt: new Date() },
        { returnDocument: 'after' }
      );

      if (app) {
        console.log(`Processing screening for application: ${app._id}`);
        await this.processScreening(app);
        // Continue processing queue immediately
        setImmediate(() => this.poll());
      } else {
        // Queue is empty, sleep for 5 seconds
        this.intervalId = setTimeout(() => this.poll(), 5000);
      }
    } catch (error) {
      console.error('Error in screening worker poll loop:', error);
      this.intervalId = setTimeout(() => this.poll(), 5000);
    }
  }

  private async processScreening(app: any) {
    try {
      console.log("AI Screening Started");
      console.log("Application ID:", app._id);

      const candidate = await CandidateModel.findOne({ _id: app.candidateId, isDeleted: false });
      const job = await JobModel.findOne({ _id: app.jobId, isDeleted: false });

      if (!candidate || !job) {
        throw new Error('Candidate or Job record is missing or deleted.');
      }

      if (!candidate.resume || !candidate.resume.fileName) {
        throw new Error('No resume file linked to candidate profile.');
      }

      const filename = candidate.resume.fileName;
      const filePath = path.join(process.cwd(), 'uploads', 'resumes', filename);

      const resumeUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/v1/recruitment/resumes/download/${filename}`;
      console.log("Resume URL:", resumeUrl);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Resume file not found on disk: ${filePath}`);
      }

      // Read file and make multipart request to Python FastAPI microservice
      const fileBuffer = fs.readFileSync(filePath);
      if (fileBuffer.length === 0) {
        throw new Error("Resume file is empty (0 bytes).");
      }

      const mimeType = filename.toLowerCase().endsWith('.docx')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';

      const fileBlob = new Blob([fileBuffer], { type: mimeType });
      const formData = new FormData();
      formData.append('file', fileBlob, filename);
      formData.append('job_title', job.title);
      formData.append('job_description', job.description || '');
      formData.append('job_required_skills', JSON.stringify(job.requiredSkills || []));
      formData.append('job_experience_required', job.experienceRequired || 'Not Specified');
      formData.append('job_education_required', job.educationRequired || 'Not Specified');

      const response = await fetch(`${this.aiServiceUrl}/screen`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Service returned status ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      // Preprocess raw keys to tolerate different formats
      const preprocessed = {
        aiScore: result.aiScore ?? result.matchScore ?? result.score ?? result.match_score,
        matchingSkills: result.matchingSkills ?? [],
        missingSkills: result.missingSkills ?? [],
        experienceMatch: result.experienceMatch ?? 'Evaluation not completed',
        educationMatch: result.educationMatch ?? 'Evaluation not completed',
        screeningSummary: result.screeningSummary ?? result.summary ?? 'Evaluation summary not generated',
        aiRecommendation: result.aiRecommendation ?? result.recommendation ?? result.ai_recommendation,
        resumeLength: result.resumeLength ?? 0,
        modelUsed: result.modelUsed ?? 'Unknown'
      };

      // Zod validation
      const parsed = screeningResultSchema.parse(preprocessed);

      console.log("OpenRouter Model:", parsed.modelUsed);
      console.log("Extracted Resume Length:", parsed.resumeLength);
      console.log("OpenRouter Response:", JSON.stringify(result, null, 2));
      console.log("Parsed Match Score:", parsed.aiScore);

      // Update application with matched AI results
      await ApplicationModel.findByIdAndUpdate(app._id, {
        aiScore: parsed.aiScore,
        aiRecommendation: parsed.aiRecommendation,
        matchingSkills: parsed.matchingSkills,
        missingSkills: parsed.missingSkills,
        screeningSummary: parsed.screeningSummary,
        screeningStatus: 'COMPLETED',
        notes: null,
        updatedAt: new Date()
      });

      // Log activity event
      await recruitmentActivityRepository.create({
        applicationId: app._id,
        candidateId: candidate._id,
        jobId: job._id,
        title: RecruitmentActivityType.STAGE_CHANGED,
        description: `AI Resume Screening finished for ${candidate.firstName} ${candidate.lastName}. Score: ${parsed.aiScore}%, Recommendation: ${parsed.aiRecommendation}.`,
        createdBy: app.candidateId
      });

      console.log(`Successfully screened application: ${app._id}`);
    } catch (error: any) {
      console.error(`AI screening failed for application ${app._id}:`);
      console.error(error);
      if (error.stack) {
        console.error(error.stack);
      }
      
      await ApplicationModel.findByIdAndUpdate(app._id, {
        screeningStatus: 'FAILED',
        notes: `AI screening failed: ${error.message || error}`,
        updatedAt: new Date()
      });
    }
  }
}

export default new ScreeningWorker();
