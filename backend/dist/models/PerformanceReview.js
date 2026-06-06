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
exports.PerformanceReview = exports.ReviewSource = exports.ReviewStatus = exports.ReviewType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ReviewType;
(function (ReviewType) {
    ReviewType["MONTHLY"] = "MONTHLY";
    ReviewType["QUARTERLY"] = "QUARTERLY";
    ReviewType["ANNUAL"] = "ANNUAL";
})(ReviewType || (exports.ReviewType = ReviewType = {}));
var ReviewStatus;
(function (ReviewStatus) {
    ReviewStatus["DRAFT"] = "DRAFT";
    ReviewStatus["SUBMITTED"] = "SUBMITTED";
})(ReviewStatus || (exports.ReviewStatus = ReviewStatus = {}));
var ReviewSource;
(function (ReviewSource) {
    ReviewSource["SELF"] = "SELF";
    ReviewSource["MANAGER"] = "MANAGER";
    ReviewSource["PEER"] = "PEER";
})(ReviewSource || (exports.ReviewSource = ReviewSource = {}));
const performanceReviewSchema = new mongoose_1.Schema({
    reviewCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    employeeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },
    reviewerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reviewPeriod: {
        type: String,
        required: true,
        trim: true
    },
    reviewType: {
        type: String,
        enum: Object.values(ReviewType),
        required: true,
        index: true
    },
    reviewSource: {
        type: String,
        enum: Object.values(ReviewSource),
        default: ReviewSource.MANAGER,
        index: true
    },
    overallScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    communicationScore: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    technicalScore: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    leadershipScore: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    productivityScore: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    teamworkScore: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    comments: {
        type: String,
        required: true,
        trim: true
    },
    strengths: {
        type: [String],
        default: []
    },
    weaknesses: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: Object.values(ReviewStatus),
        default: ReviewStatus.DRAFT,
        index: true
    }
}, {
    timestamps: true
});
exports.PerformanceReview = mongoose_1.default.models.PerformanceReview ||
    mongoose_1.default.model('PerformanceReview', performanceReviewSchema);
