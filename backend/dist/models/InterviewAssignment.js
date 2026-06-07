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
const mongoose_1 = __importStar(require("mongoose"));
const ResumeSnapshotSchema = new mongoose_1.Schema({
    aiScore: { type: Number, default: 0 },
    aiRecommendation: { type: String, default: '' },
    matchingSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    screeningSummary: { type: String, default: '' },
}, { _id: false });
const InterviewAssignmentSchema = new mongoose_1.Schema({
    candidateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Candidate',
        required: [true, 'Candidate ID is required'],
        index: true,
    },
    jobId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Job',
        required: [true, 'Job ID is required'],
        index: true,
    },
    recruiterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recruiter ID is required'],
        index: true,
    },
    interviewTemplateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'InterviewTemplate',
        required: [true, 'Interview Template ID is required'],
        index: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Started', 'In Progress', 'Completed', 'Reviewed'],
        default: 'Pending',
        index: true,
    },
    assignedAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: [true, 'Expiration date is required'],
    },
    magicToken: {
        type: String,
        unique: true,
        sparse: true,
        index: true,
    },
    magicTokenExpiresAt: {
        type: Date,
    },
    isTokenUsed: {
        type: Boolean,
        default: false,
    },
    maxAttempts: {
        type: Number,
        default: 1,
    },
    attemptCount: {
        type: Number,
        default: 0,
    },
    lastAttemptAt: {
        type: Date,
    },
    resumeSnapshot: {
        type: ResumeSnapshotSchema,
        default: null,
    },
    resumeScore: {
        type: Number,
        default: null,
    },
    resumeAnalysis: {
        type: String,
        default: null,
    },
    screeningTimestamp: {
        type: Date,
        default: null,
    },
    interviewScore: {
        type: Number,
        default: null,
    },
    finalCandidateScore: {
        type: Number,
        default: null,
        index: true,
    },
    rankingPosition: {
        type: Number,
        default: null,
    },
    rankingReasoning: {
        type: String,
        default: null,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
// Unique assignment per candidate per job
InterviewAssignmentSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
exports.default = mongoose_1.default.model('InterviewAssignment', InterviewAssignmentSchema);
