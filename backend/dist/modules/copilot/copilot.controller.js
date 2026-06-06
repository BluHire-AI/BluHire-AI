"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopilotController = void 0;
const copilot_service_1 = __importDefault(require("./copilot.service"));
const CopilotConversation_1 = require("../../models/CopilotConversation");
const CopilotMessage_1 = require("../../models/CopilotMessage");
const CopilotReport_1 = require("../../models/CopilotReport");
const common_dto_1 = require("../employee/dtos/common.dto");
class CopilotController {
    /**
     * SSE Stream Chat Endpoint
     * POST /api/v1/copilot/chat
     */
    async chatStream(req, res) {
        const userId = req.user._id;
        const userRole = req.user.role;
        // Set Server Sent Events headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx, etc.)
        const writeSSE = (type, content, conversationId, followUps) => {
            res.write(`data: ${JSON.stringify({ type, content, conversationId, suggestedFollowUps: followUps })}\n\n`);
        };
        try {
            const { message, conversationId, confirmedAction } = req.body;
            // Validate prompt
            if (!confirmedAction && (!message || message.trim() === '')) {
                writeSSE('error', 'Message cannot be empty.');
                res.end();
                return;
            }
            await copilot_service_1.default.handleChatStream(userId, userRole, message || 'Confirmed action execution.', conversationId, confirmedAction, (event) => {
                writeSSE(event.type, event.content, event.conversationId, event.suggestedFollowUps);
            });
            res.end();
        }
        catch (error) {
            console.error('[Copilot Controller Stream Error]:', error);
            writeSSE('error', error.message || 'Stream processing failed.');
            res.end();
        }
    }
    /**
     * GET /api/v1/copilot/conversations
     */
    async getConversations(req, res) {
        try {
            const userId = req.user._id;
            const conversations = await CopilotConversation_1.CopilotConversation.find({ userId, isActive: true })
                .sort({ updatedAt: -1 })
                .limit(50);
            res.json((0, common_dto_1.createSuccessResponse)(conversations, 'Chat sessions retrieved successfully'));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to list chat sessions'));
        }
    }
    /**
     * GET /api/v1/copilot/conversations/:conversationId/messages
     */
    async getMessages(req, res) {
        try {
            const { conversationId } = req.params;
            const userId = req.user._id;
            // Verify ownership
            const conversation = await CopilotConversation_1.CopilotConversation.findOne({ _id: conversationId, userId, isActive: true });
            if (!conversation) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Conversation not found'));
                return;
            }
            const messages = await CopilotMessage_1.CopilotMessage.find({ conversationId }).sort({ timestamp: 1 });
            res.json((0, common_dto_1.createSuccessResponse)(messages, 'Message logs retrieved successfully'));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve message logs'));
        }
    }
    /**
     * DELETE /api/v1/copilot/conversations/:conversationId
     */
    async deleteConversation(req, res) {
        try {
            const { conversationId } = req.params;
            const userId = req.user._id;
            const conversation = await CopilotConversation_1.CopilotConversation.findOneAndUpdate({ _id: conversationId, userId }, { isActive: false }, { returnDocument: 'after' });
            if (!conversation) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Conversation not found'));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)(null, 'Chat conversation deleted successfully'));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to delete chat session'));
        }
    }
    /**
     * GET /api/v1/copilot/reports
     */
    async getReports(req, res) {
        try {
            const userId = req.user._id;
            const reports = await CopilotReport_1.CopilotReport.find({ generatedBy: userId })
                .sort({ createdAt: -1 })
                .select('_id reportName reportType createdAt');
            res.json((0, common_dto_1.createSuccessResponse)(reports, 'Saved reports listed successfully'));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve saved reports list'));
        }
    }
    /**
     * GET /api/v1/copilot/reports/:reportId
     */
    async getReportDetails(req, res) {
        try {
            const { reportId } = req.params;
            const userId = req.user._id;
            const report = await CopilotReport_1.CopilotReport.findOne({ _id: reportId, generatedBy: userId });
            if (!report) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Report record not found'));
                return;
            }
            res.json((0, common_dto_1.createSuccessResponse)(report, 'Report details retrieved successfully'));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to retrieve report details'));
        }
    }
    /**
     * GET /api/v1/copilot/reports/:reportId/export
     */
    async exportReport(req, res) {
        try {
            const { reportId } = req.params;
            const format = req.query.format || 'csv';
            const userId = req.user._id;
            const report = await CopilotReport_1.CopilotReport.findOne({ _id: reportId, generatedBy: userId });
            if (!report) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Report not found'));
                return;
            }
            const content = report.content;
            const dateStr = report.createdAt.toISOString().slice(0, 10);
            const fileName = `hrminds_${report.reportType}_${dateStr}`;
            if (format === 'csv') {
                // Build a beautiful CSV payload from the structured content
                let csvContent = '\uFEFF';
                csvContent += '"Section","Metric","Value"\n';
                // Add Overview Metrics
                if (content.overview) {
                    const ov = content.overview;
                    csvContent += `"Overview","Total Jobs","${ov.totalJobs || 0}"\n`;
                    csvContent += `"Overview","Open Jobs","${ov.openJobs || 0}"\n`;
                    csvContent += `"Overview","Total Candidates","${ov.totalCandidates || 0}"\n`;
                    csvContent += `"Overview","Total Applications","${ov.totalApplications || 0}"\n`;
                    csvContent += `"Overview","Total Hires","${ov.totalHires || 0}"\n`;
                    csvContent += `"Overview","Conversion Rate","${ov.conversionRate || 0}%"\n`;
                    csvContent += `"Overview","Avg Time to Hire","${ov.averageTimeToHire || 0} days"\n`;
                }
                // Add Funnel Metrics
                if (content.funnel) {
                    const fn = content.funnel;
                    Object.entries(fn.counts || {}).forEach(([key, val]) => {
                        csvContent += `"Funnel Counts","${key}","${val}"\n`;
                    });
                    Object.entries(fn.conversionRates || {}).forEach(([key, val]) => {
                        csvContent += `"Funnel Ratios","${key}","${val}%"\n`;
                    });
                    csvContent += `"Funnel Efficiency","Hired Ratio","${fn.efficiency || 0}%"\n`;
                }
                // Add AI Screening Metrics
                if (content.screening) {
                    const sc = content.screening;
                    csvContent += `"AI Screening","Total Screened","${sc.totalScreened || 0}"\n`;
                    csvContent += `"AI Screening","Average Score","${sc.averageMatchScore || 0}%"\n`;
                    csvContent += `"AI Screening","Recommended Count","${sc.recommended || 0}"\n`;
                    csvContent += `"AI Screening","Recommendation Rate","${sc.recommendationRate || 0}%"\n`;
                }
                // Add Interview Metrics
                if (content.interview) {
                    const iv = content.interview;
                    csvContent += `"Interviews","Scheduled","${iv.interviewsScheduled || 0}"\n`;
                    csvContent += `"Interviews","Completed","${iv.interviewsCompleted || 0}"\n`;
                    csvContent += `"Interviews","Avg Interview Score","${iv.averageInterviewScore || 0}%"\n`;
                    csvContent += `"Interviews","Pass Rate","${iv.passRate || 0}%"\n`;
                }
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
                res.send(Buffer.from(csvContent, 'utf-8'));
                return;
            }
            else if (format === 'pdf') {
                // Return a beautiful print-friendly HTML page that renders as PDF in browser print dialog
                const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${report.reportName}</title>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background-color: #ffffff; }
              .header { border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 26px; font-weight: bold; color: #1e1b4b; margin: 0; }
              .meta { font-size: 13px; color: #64748b; margin-top: 8px; }
              .section-title { font-size: 18px; font-weight: bold; color: #4c1d95; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th { background-color: #f8fafc; color: #475569; font-weight: bold; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; }
              td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155; }
              tr:nth-child(even) td { background-color: #f8fafc; }
              .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
              .print-btn { background-color: #8b5cf6; color: white; border: none; padding: 10px 20px; font-size: 13px; font-weight: bold; border-radius: 6px; cursor: pointer; float: right; }
              .print-btn:hover { background-color: #7c3aed; }
              @media print {
                body { padding: 0; }
                .print-btn { display: none; }
              }
            </style>
          </head>
          <body>
            <button class="print-btn" onclick="window.print()">Print / Save PDF</button>
            <div class="header">
              <h1 class="title">${report.reportName}</h1>
              <div class="meta">Generated by HR Copilot on ${report.createdAt.toLocaleString()}</div>
            </div>

            <div class="section-title">Recruitment Overview</div>
            <table>
              <thead>
                <tr>
                  <th>KPI Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Total Jobs</td><td>${content.overview?.totalJobs || 0}</td></tr>
                <tr><td>Open Jobs</td><td>${content.overview?.openJobs || 0}</td></tr>
                <tr><td>Total Candidates</td><td>${content.overview?.totalCandidates || 0}</td></tr>
                <tr><td>Total Applications</td><td>${content.overview?.totalApplications || 0}</td></tr>
                <tr><td>Total Hires</td><td>${content.overview?.totalHires || 0}</td></tr>
                <tr><td>Conversion Rate (%)</td><td>${content.overview?.conversionRate || 0}%</td></tr>
                <tr><td>Average Time to Hire (days)</td><td>${content.overview?.averageTimeToHire || 0}</td></tr>
              </tbody>
            </table>

            <div class="section-title">Pipeline Funnel Metrics</div>
            <table>
              <thead>
                <tr>
                  <th>Funnel Stage</th>
                  <th>Candidates Count</th>
                  <th>Conversion Ratio</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Applied</td><td>${content.funnel?.counts?.Applied || 0}</td><td>100% (Baseline)</td></tr>
                <tr><td>Screening</td><td>${content.funnel?.counts?.Screening || 0}</td><td>${content.funnel?.conversionRates?.['Applied to Screening'] || 0}%</td></tr>
                <tr><td>Shortlisted</td><td>${content.funnel?.counts?.Shortlisted || 0}</td><td>${content.funnel?.conversionRates?.['Screening to Shortlisted'] || 0}%</td></tr>
                <tr><td>Interview</td><td>${content.funnel?.counts?.Interview || 0}</td><td>${content.funnel?.conversionRates?.['Shortlisted to Interview'] || 0}%</td></tr>
                <tr><td>Offer</td><td>${content.funnel?.counts?.Offer || 0}</td><td>${content.funnel?.conversionRates?.['Interview to Offer'] || 0}%</td></tr>
                <tr><td>Hired</td><td>${content.funnel?.counts?.Hired || 0}</td><td>${content.funnel?.conversionRates?.['Offer to Hired'] || 0}%</td></tr>
              </tbody>
            </table>

            <div class="section-title">AI Screening & Assessments</div>
            <table>
              <thead>
                <tr>
                  <th>AI screening Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Total Resumes Screened</td><td>${content.screening?.totalScreened || 0}</td></tr>
                <tr><td>Average Resume Match Score</td><td>${content.screening?.averageMatchScore || 0}%</td></tr>
                <tr><td>Highly Recommended Candidates</td><td>${content.screening?.recommended || 0}</td></tr>
                <tr><td>Recommendation Rate (%)</td><td>${content.screening?.recommendationRate || 0}%</td></tr>
                <tr><td>Scheduled Interviews</td><td>${content.interview?.interviewsScheduled || 0}</td></tr>
                <tr><td>Completed Interviews</td><td>${content.interview?.interviewsCompleted || 0}</td></tr>
                <tr><td>Average Panel Interview Score</td><td>${content.interview?.averageInterviewScore || 0}%</td></tr>
                <tr><td>Panel Pass Rate (%)</td><td>${content.interview?.passRate || 0}%</td></tr>
              </tbody>
            </table>

            <div class="footer">
              HRMinds AI – Executive Intelligence Report. Confidential. Page 1 of 1
            </div>
          </body>
          </html>
        `;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.setHeader('Content-Disposition', `attachment; filename="${fileName}.html"`);
                res.send(Buffer.from(html, 'utf-8'));
                return;
            }
            res.status(400).json((0, common_dto_1.createErrorResponse)('Unsupported export format'));
        }
        catch (error) {
            res.status(500).json((0, common_dto_1.createErrorResponse)(error.message || 'Failed to export report'));
        }
    }
}
exports.CopilotController = CopilotController;
exports.default = new CopilotController();
