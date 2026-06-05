"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRecruitmentRouter = exports.publicRecruitmentRouter = void 0;
const express_1 = require("express");
const jobs_controller_1 = __importDefault(require("../jobs/jobs.controller"));
const candidates_controller_1 = __importDefault(require("../candidates/candidates.controller"));
const applications_controller_1 = __importDefault(require("../applications/applications.controller"));
const upload_middleware_1 = require("../middlewares/upload.middleware");
const rbac_middleware_1 = require("../../employee/middlewares/rbac.middleware");
// 1. Unauthenticated Public Router (Careers Portal)
exports.publicRecruitmentRouter = (0, express_1.Router)();
exports.publicRecruitmentRouter.get('/jobs', jobs_controller_1.default.listPublicJobs.bind(jobs_controller_1.default));
exports.publicRecruitmentRouter.get('/jobs/:id', jobs_controller_1.default.getJob.bind(jobs_controller_1.default));
exports.publicRecruitmentRouter.post('/apply', upload_middleware_1.uploadResume.single('resume'), applications_controller_1.default.applyToJob.bind(applications_controller_1.default));
// 2. Authenticated Recruiter Router (Dashboard)
exports.adminRecruitmentRouter = (0, express_1.Router)();
// Apply Role restriction middleware for Recruiters and Admins
exports.adminRecruitmentRouter.use((0, rbac_middleware_1.requireRole)(rbac_middleware_1.EmployeeModuleRoles.MANAGEMENT_ADMIN, rbac_middleware_1.EmployeeModuleRoles.HR_RECRUITER));
// Jobs CRUD
exports.adminRecruitmentRouter.post('/jobs', jobs_controller_1.default.createJob.bind(jobs_controller_1.default));
exports.adminRecruitmentRouter.get('/jobs', jobs_controller_1.default.listJobs.bind(jobs_controller_1.default));
exports.adminRecruitmentRouter.get('/jobs/:id', jobs_controller_1.default.getJob.bind(jobs_controller_1.default));
exports.adminRecruitmentRouter.patch('/jobs/:id', jobs_controller_1.default.updateJob.bind(jobs_controller_1.default));
exports.adminRecruitmentRouter.delete('/jobs/:id', jobs_controller_1.default.deleteJob.bind(jobs_controller_1.default));
// Candidates Management
exports.adminRecruitmentRouter.get('/candidates', candidates_controller_1.default.listCandidates.bind(candidates_controller_1.default));
exports.adminRecruitmentRouter.get('/candidates/:id', candidates_controller_1.default.getCandidate.bind(candidates_controller_1.default));
exports.adminRecruitmentRouter.patch('/candidates/:id', candidates_controller_1.default.updateCandidate.bind(candidates_controller_1.default));
exports.adminRecruitmentRouter.delete('/candidates/:id', candidates_controller_1.default.deleteCandidate.bind(candidates_controller_1.default));
// Applications Management
exports.adminRecruitmentRouter.get('/applications', applications_controller_1.default.listApplications.bind(applications_controller_1.default));
exports.adminRecruitmentRouter.patch('/applications/:id/stage', applications_controller_1.default.moveStage.bind(applications_controller_1.default));
// Pipeline, Analytics & Activities
exports.adminRecruitmentRouter.get('/pipeline', applications_controller_1.default.getPipeline.bind(applications_controller_1.default));
exports.adminRecruitmentRouter.get('/analytics', applications_controller_1.default.getAnalytics.bind(applications_controller_1.default));
exports.adminRecruitmentRouter.get('/activities', applications_controller_1.default.getActivities.bind(applications_controller_1.default));
// Secure Resume Downloads
exports.adminRecruitmentRouter.get('/resumes/download/:filename', applications_controller_1.default.downloadResume.bind(applications_controller_1.default));
