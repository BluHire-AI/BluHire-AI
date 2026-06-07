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
const InterviewQuestionSchema = new mongoose_1.Schema({
    sessionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'InterviewSession',
        required: [true, 'Interview Session ID is required'],
        index: true,
    },
    questionText: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true,
    },
    category: {
        type: String,
        enum: ['Technical', 'Behavioral', 'Situational', 'Problem Solving', 'Project-Based', 'Resume-Based'],
        required: [true, 'Question category is required'],
    },
    difficulty: {
        type: String,
        required: true,
    },
    isFollowUp: {
        type: Boolean,
        default: false,
    },
    parentQuestionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'InterviewQuestion',
        default: null,
    },
    order: {
        type: Number,
        required: true,
    },
    questionVersion: {
        type: Number,
        default: 1,
    },
    generatedBy: {
        type: String,
        default: 'AI_ENGINE',
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    sourceType: {
        type: String,
        enum: ['Resume', 'JobDescription', 'FollowUp', 'Behavioral', 'Technical'],
        required: true,
    },
}, {
    timestamps: true,
});
// Indexes
InterviewQuestionSchema.index({ sessionId: 1, order: 1 });
exports.default = mongoose_1.default.model('InterviewQuestion', InterviewQuestionSchema);
