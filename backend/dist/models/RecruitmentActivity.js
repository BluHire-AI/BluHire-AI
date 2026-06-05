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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecruitmentActivityType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var RecruitmentActivityType;
(function (RecruitmentActivityType) {
    RecruitmentActivityType["JOB_CREATED"] = "JOB_CREATED";
    RecruitmentActivityType["JOB_CLOSED"] = "JOB_CLOSED";
    RecruitmentActivityType["CANDIDATE_APPLIED"] = "CANDIDATE_APPLIED";
    RecruitmentActivityType["CANDIDATE_SHORTLISTED"] = "CANDIDATE_SHORTLISTED";
    RecruitmentActivityType["INTERVIEW_SCHEDULED"] = "INTERVIEW_SCHEDULED";
    RecruitmentActivityType["OFFER_RELEASED"] = "OFFER_RELEASED";
    RecruitmentActivityType["CANDIDATE_HIRED"] = "CANDIDATE_HIRED";
    RecruitmentActivityType["STAGE_CHANGED"] = "STAGE_CHANGED";
})(RecruitmentActivityType || (exports.RecruitmentActivityType = RecruitmentActivityType = {}));
const RecruitmentActivitySchema = new mongoose_1.Schema({
    applicationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Application',
        default: null,
        index: true,
    },
    candidateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Candidate',
        default: null,
        index: true,
    },
    jobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Job',
        default: null,
        index: true,
    },
    title: {
        type: String,
        enum: Object.values(RecruitmentActivityType),
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true,
    },
}, {
    timestamps: true,
});
RecruitmentActivitySchema.index({ createdAt: -1 });
exports.default = mongoose_1.default.model('RecruitmentActivity', RecruitmentActivitySchema);
