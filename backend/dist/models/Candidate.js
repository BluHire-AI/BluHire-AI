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
const CandidateResumeSchema = new mongoose_1.Schema({
    fileName: {
        type: String,
        required: true,
        trim: true,
    },
    fileType: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });
const CandidateSchema = new mongoose_1.Schema({
    candidateCode: {
        type: String,
        required: [true, 'Candidate code is required'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true,
        index: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
    },
    skills: {
        type: [String],
        default: [],
    },
    experience: {
        type: String,
        default: null,
    },
    education: {
        type: String,
        default: null,
    },
    resume: {
        type: CandidateResumeSchema,
        default: null,
    },
    source: {
        type: String,
        default: 'DIRECT',
    },
    linkedinUrl: {
        type: String,
        default: null,
    },
    portfolioUrl: {
        type: String,
        default: null,
    },
    currentCompany: {
        type: String,
        default: null,
    },
    currentDesignation: {
        type: String,
        default: null,
    },
    expectedSalary: {
        type: Number,
        default: null,
    },
    noticePeriod: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        default: 'APPLIED',
        index: true,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    isTestData: {
        type: Boolean,
        default: false,
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});
// Indexes
CandidateSchema.index({ candidateCode: 1, isDeleted: 1 });
CandidateSchema.index({ email: 1, isDeleted: 1 });
CandidateSchema.index({ createdAt: -1, isDeleted: 1 });
exports.default = mongoose_1.default.model('Candidate', CandidateSchema);
