"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewController = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = __importDefault(require("mongoose"));
const interview_service_1 = __importDefault(require("./interview.service"));
const common_dto_1 = require("../../employee/dtos/common.dto");
class InterviewController {
    // --- TEMPLATES ---
    async createTemplate(req, res) {
        try {
            const template = await interview_service_1.default.createTemplate(req.body, req.user._id);
            res.status(201).json((0, common_dto_1.createSuccessResponse)(template, 'Interview template created successfully', 201));
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to create template'));
        }
    }
    async listTemplates(req, res) {
        try {
            const { department, jobRole } = req.query;
            const filter = {};
            if (department)
                filter.department = department;
            if (jobRole)
                filter.jobRole = jobRole;
            const templates = await interview_service_1.default.getTemplates(filter);
            res.json((0, common_dto_1.createSuccessResponse)(templates, 'Templates retrieved successfully'));
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to list templates'));
        }
    }
    async getTemplate(req, res) {
        try {
            const template = await interview_service_1.default.getTemplateById(req.params.id);
            res.json((0, common_dto_1.createSuccessResponse)(template, 'Template retrieved successfully'));
        }
        catch (err) {
            res.status(404).json((0, common_dto_1.createErrorResponse)(err.message || 'Template not found'));
        }
    }
    async updateTemplate(req, res) {
        try {
            const template = await interview_service_1.default.updateTemplate(req.params.id, req.body, req.user._id);
            res.json((0, common_dto_1.createSuccessResponse)(template, 'Template updated successfully'));
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to update template'));
        }
    }
    async deleteTemplate(req, res) {
        try {
            await interview_service_1.default.deleteTemplate(req.params.id);
            res.json((0, common_dto_1.createSuccessResponse)(null, 'Template archived successfully'));
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to delete template'));
        }
    }
    // --- ASSIGNMENTS ---
    async listAssignments(req, res) {
        try {
            const { jobId, status, candidateId } = req.query;
            const filter = {};
            if (jobId && jobId !== 'ALL')
                filter.jobId = jobId;
            if (status && status !== 'ALL')
                filter.status = status;
            if (candidateId)
                filter.candidateId = candidateId;
            // Restrict candidate's scope to their own assignments
            if (req.user.role === 'CANDIDATE') {
                const Candidate = mongoose_1.default.model('Candidate');
                const candidate = await Candidate.findOne({ email: req.user.email, isDeleted: false });
                if (!candidate) {
                    res.json((0, common_dto_1.createSuccessResponse)([], 'Assignments retrieved successfully'));
                    return;
                }
                filter.candidateId = candidate._id;
            }
            else if (req.user.role === 'HR_RECRUITER') {
                // Restrict recruiter's scope if they are HR_RECRUITER
                filter.recruiterId = req.user._id;
            }
            const assignments = await interview_service_1.default.getAssignments(filter);
            res.json((0, common_dto_1.createSuccessResponse)(assignments, 'Assignments retrieved successfully'));
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to list assignments'));
        }
    }
    async getAssignment(req, res) {
        try {
            const assignment = await interview_service_1.default.getAssignmentById(req.params.id);
            if (!assignment) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Assignment not found', undefined, 404));
                return;
            }
            // Restrict candidate's access to their own assignment
            if (req.user.role === 'CANDIDATE') {
                const Candidate = mongoose_1.default.model('Candidate');
                const candidate = await Candidate.findOne({ email: req.user.email, isDeleted: false });
                const assignmentCandidateId = assignment.candidateId?._id?.toString() || assignment.candidateId?.toString();
                if (!candidate || assignmentCandidateId !== candidate._id.toString()) {
                    res.status(403).json((0, common_dto_1.createErrorResponse)('Forbidden: Insufficient permissions', undefined, 403));
                    return;
                }
            }
            res.json((0, common_dto_1.createSuccessResponse)(assignment, 'Assignment retrieved successfully'));
        }
        catch (err) {
            res.status(404).json((0, common_dto_1.createErrorResponse)(err.message || 'Assignment not found'));
        }
    }
    // --- CANDIDATE INTERVIEWS ---
    async startSession(req, res) {
        try {
            const { assignmentId } = req.body;
            let candidateId = req.user._id;
            if (!assignmentId) {
                res.status(400).json((0, common_dto_1.createErrorResponse)('assignmentId is required'));
                return;
            }
            if (req.user.role === 'CANDIDATE') {
                const Candidate = mongoose_1.default.model('Candidate');
                const candidate = await Candidate.findOne({ email: req.user.email, isDeleted: false });
                if (!candidate) {
                    res.status(403).json((0, common_dto_1.createErrorResponse)('Forbidden: No candidate profile found', undefined, 403));
                    return;
                }
                candidateId = candidate._id.toString();
            }
            const result = await interview_service_1.default.startSession(assignmentId, candidateId);
            res.json((0, common_dto_1.createSuccessResponse)(result, 'Session started successfully'));
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to start interview session'));
        }
    }
    async submitAnswer(req, res) {
        try {
            const { sessionId, questionId } = req.body;
            const file = req.file;
            if (!sessionId || !questionId || !file) {
                res.status(400).json((0, common_dto_1.createErrorResponse)('sessionId, questionId, and audio file are required'));
                return;
            }
            const response = await interview_service_1.default.submitAnswer(sessionId, questionId, file);
            res.json((0, common_dto_1.createSuccessResponse)(response, 'Answer uploaded successfully. Processing started.'));
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to submit answer'));
        }
    }
    async updateIntegrity(req, res) {
        try {
            const { sessionId, eventType } = req.body; // eventType: tab-switch, fullscreen-exit, disconnect
            if (!sessionId || !eventType) {
                res.status(400).json((0, common_dto_1.createErrorResponse)('sessionId and eventType are required'));
                return;
            }
            const session = await interview_service_1.default.updateIntegrity(sessionId, eventType);
            res.json((0, common_dto_1.createSuccessResponse)(session, 'Integrity metric updated successfully'));
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to update integrity log'));
        }
    }
    // --- REPORT & ANALYTICS VIEWER ---
    async getReport(req, res) {
        try {
            const report = await interview_service_1.default.getReport(req.params.sessionId);
            res.json((0, common_dto_1.createSuccessResponse)(report, 'Evaluation report retrieved successfully'));
        }
        catch (err) {
            res.status(404).json((0, common_dto_1.createErrorResponse)(err.message || 'Report not compiled or not found'));
        }
    }
    async getAnalytics(req, res) {
        try {
            const { jobId } = req.query;
            const filter = {};
            if (jobId && jobId !== 'ALL')
                filter.jobId = jobId;
            if (req.user.role === 'HR_RECRUITER') {
                filter.recruiterId = req.user._id;
            }
            const analytics = await interview_service_1.default.getAnalytics(filter);
            res.json((0, common_dto_1.createSuccessResponse)(analytics, 'Recruitment analytics compiled successfully'));
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to compile analytics'));
        }
    }
    // --- AUDIO SERVING ---
    async streamAudioFile(req, res) {
        try {
            const { filename } = req.params;
            const filePath = path_1.default.join(process.cwd(), 'uploads', 'interviews', filename);
            if (!fs_1.default.existsSync(filePath)) {
                res.status(404).json((0, common_dto_1.createErrorResponse)('Audio file not found', undefined, 404));
                return;
            }
            res.setHeader('Content-Type', 'audio/webm');
            const stream = fs_1.default.createReadStream(filePath);
            stream.pipe(res);
        }
        catch (err) {
            res.status(400).json((0, common_dto_1.createErrorResponse)(err.message || 'Failed to stream audio file'));
        }
    }
}
exports.InterviewController = InterviewController;
exports.default = new InterviewController();
