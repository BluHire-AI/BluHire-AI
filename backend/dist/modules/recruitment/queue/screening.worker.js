"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Application_1 = __importDefault(require("../../../models/Application"));
const Candidate_1 = __importDefault(require("../../../models/Candidate"));
const Job_1 = __importDefault(require("../../../models/Job"));
const recruitment_activity_repository_1 = __importDefault(require("../repositories/recruitment-activity.repository"));
const RecruitmentActivity_1 = require("../../../models/RecruitmentActivity");
class ScreeningWorker {
    isRunning = false;
    intervalId = null;
    aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        console.log('AI Resume Screening Worker started.');
        this.poll();
    }
    stop() {
        this.isRunning = false;
        if (this.intervalId) {
            clearTimeout(this.intervalId);
        }
    }
    async poll() {
        if (!this.isRunning)
            return;
        try {
            // Lock a PENDING job atomically
            const app = await Application_1.default.findOneAndUpdate({ screeningStatus: 'PENDING', isDeleted: false }, { screeningStatus: 'PROCESSING', updatedAt: new Date() }, { returnDocument: 'after' });
            if (app) {
                console.log(`Processing screening for application: ${app._id}`);
                await this.processScreening(app);
                // Continue processing queue immediately
                setImmediate(() => this.poll());
            }
            else {
                // Queue is empty, sleep for 5 seconds
                this.intervalId = setTimeout(() => this.poll(), 5000);
            }
        }
        catch (error) {
            console.error('Error in screening worker poll loop:', error);
            this.intervalId = setTimeout(() => this.poll(), 5000);
        }
    }
    async processScreening(app) {
        try {
            const candidate = await Candidate_1.default.findOne({ _id: app.candidateId, isDeleted: false });
            const job = await Job_1.default.findOne({ _id: app.jobId, isDeleted: false });
            if (!candidate || !job) {
                throw new Error('Candidate or Job record is missing or deleted.');
            }
            if (!candidate.resume || !candidate.resume.fileName) {
                throw new Error('No resume file linked to candidate profile.');
            }
            const filename = candidate.resume.fileName;
            const filePath = path_1.default.join(process.cwd(), 'uploads', 'resumes', filename);
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error(`Resume file not found on disk: ${filePath}`);
            }
            // Read file and make multipart request to Python FastAPI microservice
            const fileBuffer = fs_1.default.readFileSync(filePath);
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
            // Update application with matched AI results
            await Application_1.default.findByIdAndUpdate(app._id, {
                aiScore: result.aiScore,
                aiRecommendation: result.aiRecommendation,
                matchingSkills: result.matchingSkills,
                missingSkills: result.missingSkills,
                screeningSummary: result.screeningSummary,
                screeningStatus: 'COMPLETED',
                updatedAt: new Date()
            });
            // Log activity event
            await recruitment_activity_repository_1.default.create({
                applicationId: app._id,
                candidateId: candidate._id,
                jobId: job._id,
                title: RecruitmentActivity_1.RecruitmentActivityType.STAGE_CHANGED,
                description: `AI Resume Screening finished for ${candidate.firstName} ${candidate.lastName}. Score: ${result.aiScore}%, Recommendation: ${result.aiRecommendation}.`,
                createdBy: app.candidateId
            });
            console.log(`Successfully screened application: ${app._id}`);
        }
        catch (error) {
            console.error(`AI screening failed for application ${app._id}:`, error.message);
            await Application_1.default.findByIdAndUpdate(app._id, {
                screeningStatus: 'FAILED',
                notes: `AI screening failed: ${error.message}`,
                updatedAt: new Date()
            });
        }
    }
}
exports.default = new ScreeningWorker();
