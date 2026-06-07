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
const InterviewEvaluationSchema = new mongoose_1.Schema({
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        required: [true, 'Interview Session ID is required'],
        index: true,
    },
    responseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'InterviewResponse',
        required: [true, 'Interview Response ID is required'],
        index: true,
    },
    technicalScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    communicationScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    confidenceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    clarityScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    problemSolvingScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    domainExpertiseScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    relevanceScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    depthOfUnderstandingScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    overallScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    aiConfidenceScore: {
        type: Number,
        default: 1.0,
        min: 0,
        max: 1.0,
    },
    reasoning: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});
exports.default = mongoose_1.default.model('InterviewEvaluation', InterviewEvaluationSchema);
