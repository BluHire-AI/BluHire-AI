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
exports.ApplicationStage = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ApplicationStage;
(function (ApplicationStage) {
    ApplicationStage["APPLIED"] = "APPLIED";
    ApplicationStage["SCREENING"] = "SCREENING";
    ApplicationStage["SHORTLISTED"] = "SHORTLISTED";
    ApplicationStage["INTERVIEW"] = "INTERVIEW";
    ApplicationStage["OFFER"] = "OFFER";
    ApplicationStage["HIRED"] = "HIRED";
    ApplicationStage["REJECTED"] = "REJECTED";
})(ApplicationStage || (exports.ApplicationStage = ApplicationStage = {}));
const StageHistorySchema = new mongoose_1.Schema({
    stage: {
        type: String,
        enum: Object.values(ApplicationStage),
        required: true,
    },
    changedAt: {
        type: Date,
        default: Date.now,
    },
    changedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    notes: {
        type: String,
        default: null,
    },
}, { _id: false });
const ApplicationSchema = new mongoose_1.Schema({
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
    employeeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null,
        index: true,
    },
    currentStage: {
        type: String,
        enum: Object.values(ApplicationStage),
        default: ApplicationStage.APPLIED,
        index: true,
    },
    status: {
        type: String,
        default: 'ACTIVE', // ACTIVE, INACTIVE, REJECTED, HIRED
        index: true,
    },
    appliedAt: {
        type: Date,
        default: Date.now,
    },
    screenedAt: {
        type: Date,
        default: null,
    },
    interviewedAt: {
        type: Date,
        default: null,
    },
    offeredAt: {
        type: Date,
        default: null,
    },
    hiredAt: {
        type: Date,
        default: null,
    },
    aiScore: {
        type: Number,
        default: null,
    },
    aiRecommendation: {
        type: String,
        default: null,
    },
    matchingSkills: {
        type: [String],
        default: [],
    },
    missingSkills: {
        type: [String],
        default: [],
    },
    screeningSummary: {
        type: String,
        default: null,
    },
    screeningStatus: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
        default: 'PENDING',
        index: true,
    },
    interviewStatus: {
        type: String,
        default: null,
    },
    interviewScore: {
        type: Number,
        default: null,
    },
    interviewFeedback: {
        type: String,
        default: null,
    },
    interviewCompletedAt: {
        type: Date,
        default: null,
    },
    recruiterScore: {
        type: Number,
        default: null,
    },
    notes: {
        type: String,
        default: null,
    },
    stageHistory: {
        type: [StageHistorySchema],
        default: [],
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
});
// Enforce unique application per candidate per job to prevent duplicates
ApplicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
ApplicationSchema.index({ currentStage: 1, isDeleted: 1 });
ApplicationSchema.index({ status: 1, isDeleted: 1 });
exports.default = mongoose_1.default.model('Application', ApplicationSchema);
