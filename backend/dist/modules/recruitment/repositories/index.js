"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recruitmentActivityRepository = exports.applicationRepository = exports.candidateRepository = exports.jobRepository = void 0;
var job_repository_1 = require("./job.repository");
Object.defineProperty(exports, "jobRepository", { enumerable: true, get: function () { return __importDefault(job_repository_1).default; } });
var candidate_repository_1 = require("./candidate.repository");
Object.defineProperty(exports, "candidateRepository", { enumerable: true, get: function () { return __importDefault(candidate_repository_1).default; } });
var application_repository_1 = require("./application.repository");
Object.defineProperty(exports, "applicationRepository", { enumerable: true, get: function () { return __importDefault(application_repository_1).default; } });
var recruitment_activity_repository_1 = require("./recruitment-activity.repository");
Object.defineProperty(exports, "recruitmentActivityRepository", { enumerable: true, get: function () { return __importDefault(recruitment_activity_repository_1).default; } });
