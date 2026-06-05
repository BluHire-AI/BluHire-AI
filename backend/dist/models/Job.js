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
exports.JobStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var JobStatus;
(function (JobStatus) {
    JobStatus["DRAFT"] = "DRAFT";
    JobStatus["OPEN"] = "OPEN";
    JobStatus["CLOSED"] = "CLOSED";
    JobStatus["ON_HOLD"] = "ON_HOLD";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
const JobSchema = new mongoose_1.Schema({
    jobCode: {
        type: String,
        required: [true, 'Job code is required'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true,
        minlength: [2, 'Title must be at least 2 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    departmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required'],
        index: true,
    },
    designationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Designation',
        required: [true, 'Designation is required'],
        index: true,
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
    },
    responsibilities: {
        type: String,
        required: [true, 'Responsibilities description is required'],
        trim: true,
    },
    requiredSkills: {
        type: [String],
        required: [true, 'Required skills are required'],
        default: [],
    },
    preferredSkills: {
        type: [String],
        default: [],
    },
    experienceRequired: {
        type: String,
        required: [true, 'Experience required is required'],
        trim: true,
    },
    educationRequired: {
        type: String,
        required: [true, 'Education required is required'],
        trim: true,
    },
    employmentType: {
        type: String,
        required: [true, 'Employment type is required'],
        trim: true,
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true,
    },
    salaryMin: {
        type: Number,
        default: null,
    },
    salaryMax: {
        type: Number,
        default: null,
    },
    openings: {
        type: Number,
        required: [true, 'Number of openings is required'],
        default: 1,
    },
    status: {
        type: String,
        enum: Object.values(JobStatus),
        default: JobStatus.DRAFT,
        index: true,
    },
    publishedAt: {
        type: Date,
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
JobSchema.index({ jobCode: 1, isDeleted: 1 });
JobSchema.index({ status: 1, isDeleted: 1 });
JobSchema.index({ departmentId: 1, isDeleted: 1 });
JobSchema.index({ designationId: 1, isDeleted: 1 });
JobSchema.index({ createdAt: -1, isDeleted: 1 });
exports.default = mongoose_1.default.model('Job', JobSchema);
