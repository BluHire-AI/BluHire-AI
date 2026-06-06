import mongoose from 'mongoose';
import analyticsRepository from './analytics.repository';
import JobModel from '../../models/Job';
import CandidateModel from '../../models/Candidate';
import ApplicationModel, { ApplicationStage } from '../../models/Application';
import { SystemRoles } from '../../models/roles';

export class AnalyticsService {
  /**
   * Helper to build filters based on User role and request query parameters
   */
  private async buildFilters(user: any, query: any) {
    const appFilter: any = { isDeleted: false };
    const jobFilter: any = { isDeleted: false };
    const candidateFilter: any = { isDeleted: false };

    // 1. Role-based Restrictions (RBAC)
    if (user.role === SystemRoles.HR_RECRUITER) {
      // Find all jobs created by this recruiter
      const recruiterJobs = await JobModel.find({ createdBy: user._id, isDeleted: false }, '_id');
      const jobIds = recruiterJobs.map((j) => j._id);

      // Restrict applications to recruiter's jobs
      appFilter.jobId = { $in: jobIds };

      // Restrict jobs to recruiter's jobs
      jobFilter.createdBy = new mongoose.Types.ObjectId(user._id);

      // Restrict candidates to candidates who applied to recruiter's jobs, or created by recruiter
      const applicantCandidateIdsResult = await ApplicationModel.find(
        { jobId: { $in: jobIds }, isDeleted: false },
        'candidateId'
      );
      const applicantCandidateIds = applicantCandidateIdsResult.map((a) => a.candidateId);
      
      candidateFilter.$or = [
        { _id: { $in: applicantCandidateIds } },
        { createdBy: new mongoose.Types.ObjectId(user._id) },
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
      appFilter.jobId = new mongoose.Types.ObjectId(query.jobId);
    }

    // 4. Department Filter
    if (query.departmentId && query.departmentId !== 'ALL' && query.departmentId !== '') {
      // Find all job IDs in that department
      const deptJobs = await JobModel.find(
        { departmentId: query.departmentId as any, isDeleted: false },
        '_id'
      );
      const deptJobIds = deptJobs.map((j) => j._id);

      if (appFilter.jobId) {
        // Intersect
        if (appFilter.jobId.$in) {
          appFilter.jobId.$in = appFilter.jobId.$in.filter((id: any) =>
            deptJobIds.some((dId) => dId.toString() === id.toString())
          );
        } else {
          const singleJobId = appFilter.jobId;
          const match = deptJobIds.some((dId) => dId.toString() === singleJobId.toString());
          appFilter.jobId = match ? singleJobId : { $in: [] };
        }
      } else {
        appFilter.jobId = { $in: deptJobIds };
      }

      jobFilter.departmentId = query.departmentId as any;
    }

    return { appFilter, jobFilter, candidateFilter };
  }

  /**
   * Recruitment Overview
   */
  async getRecruitmentOverview(user: any, query: any) {
    const { appFilter, jobFilter, candidateFilter } = await this.buildFilters(user, query);
    return await analyticsRepository.getRecruitmentOverview(appFilter, jobFilter, candidateFilter);
  }

  /**
   * Recruitment Pipeline Funnel
   */
  async getRecruitmentFunnel(user: any, query: any) {
    const { appFilter } = await this.buildFilters(user, query);
    return await analyticsRepository.getRecruitmentFunnel(appFilter);
  }

  /**
   * AI Screening Metrics
   */
  async getAIScreeningStats(user: any, query: any) {
    const { appFilter } = await this.buildFilters(user, query);
    return await analyticsRepository.getAIScreeningStats(appFilter);
  }

  /**
   * AI Interview Metrics
   */
  async getAIInterviewStats(user: any, query: any) {
    const { appFilter } = await this.buildFilters(user, query);
    return await analyticsRepository.getAIInterviewStats(appFilter);
  }

  /**
   * Recruiter Leaderboard
   */
  async getRecruiterPerformance(user: any, query: any) {
    const { appFilter } = await this.buildFilters(user, query);
    // If user is a recruiter, only return their own metrics
    const recruiterIdFilter = user.role === SystemRoles.HR_RECRUITER ? user._id.toString() : undefined;
    return await analyticsRepository.getRecruiterPerformance(appFilter, recruiterIdFilter);
  }

  /**
   * Department Ranking
   */
  async getDepartmentHiringStats(user: any, query: any) {
    const { appFilter } = await this.buildFilters(user, query);
    return await analyticsRepository.getDepartmentHiringStats(appFilter);
  }

  /**
   * Job Performance
   */
  async getJobPerformance(user: any, query: any) {
    const { appFilter } = await this.buildFilters(user, query);
    const page = parseInt(query.page as string) || 1;
    const limit = parseInt(query.limit as string) || 10;
    return await analyticsRepository.getJobPerformance(appFilter, { page, limit });
  }

  /**
   * Skills Intelligence
   */
  async getSkillsIntelligence(user: any, query: any) {
    const { jobFilter, candidateFilter } = await this.buildFilters(user, query);
    return await analyticsRepository.getSkillsIntelligence(jobFilter, candidateFilter);
  }

  /**
   * Activity Trends
   */
  async getRecruitmentActivityStats(user: any, query: any) {
    const { appFilter } = await this.buildFilters(user, query);
    return await analyticsRepository.getRecruitmentActivityStats(appFilter);
  }

  /**
   * Export Reports as CSV / Excel / HTML (PDF Printable)
   */
  async exportReport(user: any, query: any) {
    const reportType = (query.report as string) || 'recruitment';
    const format = (query.format as string) || 'csv';

    const { appFilter, jobFilter, candidateFilter } = await this.buildFilters(user, query);

    let headers: string[] = [];
    let rows: any[][] = [];
    let fileName = `hrminds_${reportType}_report`;

    if (reportType === 'recruitment') {
      const overview = await analyticsRepository.getRecruitmentOverview(appFilter, jobFilter, candidateFilter);
      const funnel = await analyticsRepository.getRecruitmentFunnel(appFilter);

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
    } else if (reportType === 'recruiter') {
      const recruiterIdFilter = user.role === SystemRoles.HR_RECRUITER ? user._id.toString() : undefined;
      const recruiters = await analyticsRepository.getRecruiterPerformance(appFilter, recruiterIdFilter);

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
      rows = recruiters.map((rec: any) => [
        rec.recruiterName,
        rec.recruiterEmail,
        rec.candidatesProcessed,
        rec.interviewsConducted,
        rec.offersReleased,
        rec.hiresCompleted,
        `${rec.conversionRate}%`,
        rec.averageTimeToHire,
      ]);
    } else if (reportType === 'ai-screening') {
      const applications = await ApplicationModel.find({
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
      rows = applications.map((app: any) => [
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
    } else if (reportType === 'interview') {
      const applications = await ApplicationModel.find({
        isDeleted: false,
        $or: [
          { interviewStatus: { $ne: null } },
          { interviewCompletedAt: { $ne: null } },
          { currentStage: ApplicationStage.INTERVIEW },
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
      rows = applications.map((app: any) => [
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
    } else if (reportType === 'hiring') {
      const applications = await ApplicationModel.find({
        isDeleted: false,
        currentStage: ApplicationStage.HIRED,
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
      rows = applications.map((app: any) => {
        const timeToHire =
          app.hiredAt && app.appliedAt
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
    } else if (format === 'pdf') {
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
                .map(
                  (row) => `
                <tr>
                  ${row.map((val) => `<td>${val}</td>`).join('')}
                </tr>`
                )
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

export default new AnalyticsService();
