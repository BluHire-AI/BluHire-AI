"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const analytics_repository_1 = __importDefault(require("./analytics.repository"));
const Job_1 = __importDefault(require("../../models/Job"));
const Application_1 = __importStar(require("../../models/Application"));
const roles_1 = require("../../models/roles");
class AnalyticsService {
    /**
     * Helper to build filters based on User role and request query parameters
     */
    async buildFilters(user, query) {
        const appFilter = { isDeleted: false };
        const jobFilter = { isDeleted: false };
        const candidateFilter = { isDeleted: false };
        // 1. Role-based Restrictions (RBAC)
        if (user.role === roles_1.SystemRoles.HR_RECRUITER) {
            // Find all jobs created by this recruiter
            const recruiterJobs = await Job_1.default.find({ createdBy: user._id, isDeleted: false }, '_id');
            const jobIds = recruiterJobs.map((j) => j._id);
            // Restrict applications to recruiter's jobs
            appFilter.jobId = { $in: jobIds };
            // Restrict jobs to recruiter's jobs
            jobFilter.createdBy = new mongoose_1.default.Types.ObjectId(user._id);
            // Restrict candidates to candidates who applied to recruiter's jobs, or created by recruiter
            const applicantCandidateIdsResult = await Application_1.default.find({ jobId: { $in: jobIds }, isDeleted: false }, 'candidateId');
            const applicantCandidateIds = applicantCandidateIdsResult.map((a) => a.candidateId);
            candidateFilter.$or = [
                { _id: { $in: applicantCandidateIds } },
                { createdBy: new mongoose_1.default.Types.ObjectId(user._id) },
            ];
        }
        // 2. Date Range Filter
        if (query.startDate || query.endDate) {
            appFilter.appliedAt = {};
            if (query.startDate) {
                appFilter.appliedAt.$gte = new Date(query.startDate);
            }
            if (query.endDate) {
                appFilter.appliedAt.$lte = new Date(query.endDate);
            }
        }
        // 3. Specific Job Filter
        if (query.jobId && query.jobId !== 'ALL' && query.jobId !== '') {
            appFilter.jobId = new mongoose_1.default.Types.ObjectId(query.jobId);
        }
        // 4. Department Filter
        if (query.departmentId && query.departmentId !== 'ALL' && query.departmentId !== '') {
            // Find all job IDs in that department
            const deptJobs = await Job_1.default.find({ departmentId: query.departmentId, isDeleted: false }, '_id');
            const deptJobIds = deptJobs.map((j) => j._id);
            if (appFilter.jobId) {
                // Intersect
                if (appFilter.jobId.$in) {
                    appFilter.jobId.$in = appFilter.jobId.$in.filter((id) => deptJobIds.some((dId) => dId.toString() === id.toString()));
                }
                else {
                    const singleJobId = appFilter.jobId;
                    const match = deptJobIds.some((dId) => dId.toString() === singleJobId.toString());
                    appFilter.jobId = match ? singleJobId : { $in: [] };
                }
            }
            else {
                appFilter.jobId = { $in: deptJobIds };
            }
            jobFilter.departmentId = query.departmentId;
        }
        return { appFilter, jobFilter, candidateFilter };
    }
    /**
     * Recruitment Overview
     */
    async getRecruitmentOverview(user, query) {
        const { appFilter, jobFilter, candidateFilter } = await this.buildFilters(user, query);
        return await analytics_repository_1.default.getRecruitmentOverview(appFilter, jobFilter, candidateFilter);
    }
    /**
     * Recruitment Pipeline Funnel
     */
    async getRecruitmentFunnel(user, query) {
        const { appFilter } = await this.buildFilters(user, query);
        return await analytics_repository_1.default.getRecruitmentFunnel(appFilter);
    }
    /**
     * AI Screening Metrics
     */
    async getAIScreeningStats(user, query) {
        const { appFilter } = await this.buildFilters(user, query);
        return await analytics_repository_1.default.getAIScreeningStats(appFilter);
    }
    /**
     * AI Interview Metrics
     */
    async getAIInterviewStats(user, query) {
        const { appFilter } = await this.buildFilters(user, query);
        return await analytics_repository_1.default.getAIInterviewStats(appFilter);
    }
    /**
     * Recruiter Leaderboard
     */
    async getRecruiterPerformance(user, query) {
        const { appFilter } = await this.buildFilters(user, query);
        // If user is a recruiter, only return their own metrics
        const recruiterIdFilter = user.role === roles_1.SystemRoles.HR_RECRUITER ? user._id.toString() : undefined;
        return await analytics_repository_1.default.getRecruiterPerformance(appFilter, recruiterIdFilter);
    }
    /**
     * Department Ranking
     */
    async getDepartmentHiringStats(user, query) {
        const { appFilter } = await this.buildFilters(user, query);
        return await analytics_repository_1.default.getDepartmentHiringStats(appFilter);
    }
    /**
     * Job Performance
     */
    async getJobPerformance(user, query) {
        const { appFilter } = await this.buildFilters(user, query);
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        return await analytics_repository_1.default.getJobPerformance(appFilter, { page, limit });
    }
    /**
     * Skills Intelligence
     */
    async getSkillsIntelligence(user, query) {
        const { jobFilter, candidateFilter } = await this.buildFilters(user, query);
        return await analytics_repository_1.default.getSkillsIntelligence(jobFilter, candidateFilter);
    }
    /**
     * Activity Trends
     */
    async getRecruitmentActivityStats(user, query) {
        const { appFilter } = await this.buildFilters(user, query);
        return await analytics_repository_1.default.getRecruitmentActivityStats(appFilter);
    }
    /**
     * Export Reports as CSV / Excel / HTML (PDF Printable)
     */
    async exportReport(user, query) {
        const reportType = query.report || 'recruitment';
        const format = query.format || 'csv';
        const { appFilter, jobFilter, candidateFilter } = await this.buildFilters(user, query);
        let headers = [];
        let rows = [];
        let fileName = `hrminds_${reportType}_report`;
        if (reportType === 'recruitment') {
            const overview = await analytics_repository_1.default.getRecruitmentOverview(appFilter, jobFilter, candidateFilter);
            const funnel = await analytics_repository_1.default.getRecruitmentFunnel(appFilter);
            headers = ['Metric Name', 'Count / Value'];
            rows = [
                ['Total Jobs', overview.totalJobs],
                ['Open Jobs', overview.openJobs],
                ['Total Candidates', overview.totalCandidates],
                ['Total Applications', overview.totalApplications],
                ['Total Hires', overview.totalHires],
                ['Total Rejections', overview.totalRejections],
                ['Conversion Rate (%)', `${overview.conversionRate}%`],
                ['Average Time to Hire (days)', overview.averageTimeToHire],
                ['Funnel - Applied Stage Count', funnel.counts.Applied],
                ['Funnel - Screening Stage Count', funnel.counts.Screening],
                ['Funnel - Shortlisted Stage Count', funnel.counts.Shortlisted],
                ['Funnel - Interview Stage Count', funnel.counts.Interview],
                ['Funnel - Offer Stage Count', funnel.counts.Offer],
                ['Funnel - Hired Stage Count', funnel.counts.Hired],
                ['Funnel - Rejected Stage Count', funnel.counts.Rejected],
                ['Funnel Efficiency (%)', `${funnel.efficiency}%`],
            ];
        }
        else if (reportType === 'recruiter') {
            const recruiterIdFilter = user.role === roles_1.SystemRoles.HR_RECRUITER ? user._id.toString() : undefined;
            const recruiters = await analytics_repository_1.default.getRecruiterPerformance(appFilter, recruiterIdFilter);
            headers = [
                'Recruiter Name',
                'Recruiter Email',
                'Candidates Processed',
                'Interviews Conducted',
                'Offers Released',
                'Hires Completed',
                'Conversion Rate (%)',
                'Average Time to Hire (days)',
            ];
            rows = recruiters.map((rec) => [
                rec.recruiterName,
                rec.recruiterEmail,
                rec.candidatesProcessed,
                rec.interviewsConducted,
                rec.offersReleased,
                rec.hiresCompleted,
                `${rec.conversionRate}%`,
                rec.averageTimeToHire,
            ]);
        }
        else if (reportType === 'ai-screening') {
            const applications = await Application_1.default.find({
                isDeleted: false,
                screeningStatus: 'COMPLETED',
                ...appFilter,
            })
                .populate('candidateId', 'firstName lastName email candidateCode')
                .populate('jobId', 'title jobCode');
            headers = [
                'Candidate Name',
                'Candidate Code',
                'Candidate Email',
                'Job Title',
                'Job Code',
                'AI Match Score (%)',
                'AI Recommendation',
                'Matching Skills',
                'Missing Skills',
                'Applied Date',
            ];
            rows = applications.map((app) => [
                app.candidateId ? `${app.candidateId.firstName} ${app.candidateId.lastName}` : 'N/A',
                app.candidateId?.candidateCode || 'N/A',
                app.candidateId?.email || 'N/A',
                app.jobId?.title || 'N/A',
                app.jobId?.jobCode || 'N/A',
                app.aiScore !== null ? `${app.aiScore}%` : 'N/A',
                app.aiRecommendation || 'N/A',
                app.matchingSkills ? app.matchingSkills.join(', ') : '',
                app.missingSkills ? app.missingSkills.join(', ') : '',
                app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A',
            ]);
        }
        else if (reportType === 'interview') {
            const applications = await Application_1.default.find({
                isDeleted: false,
                $or: [
                    { interviewStatus: { $ne: null } },
                    { interviewCompletedAt: { $ne: null } },
                    { currentStage: Application_1.ApplicationStage.INTERVIEW },
                ],
                ...appFilter,
            })
                .populate('candidateId', 'firstName lastName email candidateCode')
                .populate('jobId', 'title jobCode');
            headers = [
                'Candidate Name',
                'Candidate Code',
                'Candidate Email',
                'Job Title',
                'Job Code',
                'Interview Status',
                'Interview Score (%)',
                'Interview Feedback',
                'Completed Date',
            ];
            rows = applications.map((app) => [
                app.candidateId ? `${app.candidateId.firstName} ${app.candidateId.lastName}` : 'N/A',
                app.candidateId?.candidateCode || 'N/A',
                app.candidateId?.email || 'N/A',
                app.jobId?.title || 'N/A',
                app.jobId?.jobCode || 'N/A',
                app.interviewStatus || 'SCHEDULED',
                app.interviewScore !== null ? `${app.interviewScore}%` : 'N/A',
                app.interviewFeedback || 'N/A',
                app.interviewCompletedAt ? new Date(app.interviewCompletedAt).toLocaleDateString() : 'N/A',
            ]);
        }
        else if (reportType === 'hiring') {
            const applications = await Application_1.default.find({
                isDeleted: false,
                currentStage: Application_1.ApplicationStage.HIRED,
                ...appFilter,
            })
                .populate('candidateId', 'firstName lastName email candidateCode')
                .populate('jobId', 'title jobCode');
            headers = [
                'Candidate Name',
                'Candidate Code',
                'Candidate Email',
                'Job Title',
                'Job Code',
                'Applied Date',
                'Hire Date',
                'Time to Hire (days)',
            ];
            rows = applications.map((app) => {
                const timeToHire = app.hiredAt && app.appliedAt
                    ? Math.round(((app.hiredAt.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24)) * 10) / 10
                    : 'N/A';
                return [
                    app.candidateId ? `${app.candidateId.firstName} ${app.candidateId.lastName}` : 'N/A',
                    app.candidateId?.candidateCode || 'N/A',
                    app.candidateId?.email || 'N/A',
                    app.jobId?.title || 'N/A',
                    app.jobId?.jobCode || 'N/A',
                    app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A',
                    app.hiredAt ? new Date(app.hiredAt).toLocaleDateString() : 'N/A',
                    timeToHire,
                ];
            });
        }
        if (format === 'csv' || format === 'excel') {
            // Add UTF-8 Byte Order Mark (BOM) so Excel respects special characters
            let csvContent = '\uFEFF';
            csvContent += headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
            rows.forEach((row) => {
                csvContent += row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
            });
            return {
                data: Buffer.from(csvContent, 'utf-8'),
                contentType: 'text/csv; charset=utf-8',
                fileName: `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`,
            };
        }
        else if (format === 'pdf') {
            // Returns a beautiful, styled, print-friendly HTML page that renders as PDF when printing in browser
            const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportType.toUpperCase()} Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background-color: #ffffff; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; color: #1e1b4b; margin: 0; text-transform: uppercase; }
            .meta { font-size: 13px; color: #64748b; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f1f5f9; color: #475569; font-weight: bold; text-align: left; padding: 12px; border-bottom: 2px solid #cbd5e1; font-size: 13px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print {
              body { padding: 0; }
              button { display: none; }
            }
            .print-btn { background-color: #3b82f6; color: white; border: none; padding: 10px 20px; font-size: 14px; font-weight: bold; border-radius: 6px; cursor: pointer; float: right; }
            .print-btn:hover { background-color: #2563eb; }
          </style>
        </head>
        <body>
          <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
          <div class="header">
            <h1 class="title">${reportType.replace('-', ' ')} Report</h1>
            <div class="meta">Generated by HRMinds AI Dashboard on ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map((h) => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${rows
                .map((row) => `
                <tr>
                  ${row.map((val) => `<td>${val}</td>`).join('')}
                </tr>`)
                .join('')}
            </tbody>
          </table>
          <div class="footer">
            HRMinds AI – Executive Intelligence Reports. Confident & Private. Page 1 of 1
          </div>
        </body>
        </html>
      `;
            return {
                data: Buffer.from(htmlContent, 'utf-8'),
                contentType: 'text/html; charset=utf-8',
                fileName: `${fileName}_${new Date().toISOString().slice(0, 10)}.html`,
            };
        }
        throw new Error('Unsupported report format');
    }
}
exports.AnalyticsService = AnalyticsService;
exports.default = new AnalyticsService();
