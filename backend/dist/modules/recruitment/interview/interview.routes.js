"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const os_1 = __importDefault(require("os"));
const interview_controller_1 = __importDefault(require("./interview.controller"));
const rbac_middleware_1 = require("../../employee/middlewares/rbac.middleware");
const roles_1 = require("../../../models/roles");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ dest: os_1.default.tmpdir() });
// ==========================================
// RECRUITER ROUTES (MANAGEMENT & REVIEW)
// ==========================================
const recruiterRoles = [
    rbac_middleware_1.EmployeeModuleRoles.MANAGEMENT_ADMIN,
    rbac_middleware_1.EmployeeModuleRoles.SENIOR_MANAGER,
    rbac_middleware_1.EmployeeModuleRoles.HR_RECRUITER
];
// Templates CRUD
router.post('/templates', (0, rbac_middleware_1.requireRole)(...recruiterRoles), interview_controller_1.default.createTemplate.bind(interview_controller_1.default));
router.get('/templates', (0, rbac_middleware_1.requireRole)(...recruiterRoles), interview_controller_1.default.listTemplates.bind(interview_controller_1.default));
router.get('/templates/:id', (0, rbac_middleware_1.requireRole)(...recruiterRoles), interview_controller_1.default.getTemplate.bind(interview_controller_1.default));
router.patch('/templates/:id', (0, rbac_middleware_1.requireRole)(...recruiterRoles), interview_controller_1.default.updateTemplate.bind(interview_controller_1.default));
router.delete('/templates/:id', (0, rbac_middleware_1.requireRole)(...recruiterRoles), interview_controller_1.default.deleteTemplate.bind(interview_controller_1.default));
// Assignments List
router.get('/assignments', (0, rbac_middleware_1.requireRole)(...recruiterRoles, roles_1.SystemRoles.CANDIDATE), interview_controller_1.default.listAssignments.bind(interview_controller_1.default));
router.get('/assignments/:id', (0, rbac_middleware_1.requireRole)(...recruiterRoles, roles_1.SystemRoles.CANDIDATE), interview_controller_1.default.getAssignment.bind(interview_controller_1.default));
// Reports & Analytics
router.get('/analytics', (0, rbac_middleware_1.requireRole)(...recruiterRoles), interview_controller_1.default.getAnalytics.bind(interview_controller_1.default));
router.get('/report/:sessionId', (0, rbac_middleware_1.requireRole)(...recruiterRoles), interview_controller_1.default.getReport.bind(interview_controller_1.default));
router.get('/audio/:filename', (0, rbac_middleware_1.requireRole)(...recruiterRoles), interview_controller_1.default.streamAudioFile.bind(interview_controller_1.default));
// ==========================================
// CANDIDATE INTERVIEW WORKFLOW ROUTES
// ==========================================
// Start session
router.post('/session/start', interview_controller_1.default.startSession.bind(interview_controller_1.default));
// Submit response answer audio
router.post('/session/submit-answer', upload.single('audio'), interview_controller_1.default.submitAnswer.bind(interview_controller_1.default));
// Integrity tracking update
router.post('/session/integrity', interview_controller_1.default.updateIntegrity.bind(interview_controller_1.default));
exports.default = router;
