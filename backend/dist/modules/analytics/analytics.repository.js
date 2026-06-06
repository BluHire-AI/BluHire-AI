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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsRepository = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Job_1 = __importStar(require("../../models/Job"));
const Candidate_1 = __importDefault(require("../../models/Candidate"));
const Application_1 = __importStar(require("../../models/Application"));
const User_1 = require("../../models/User");
class AnalyticsRepository {
    calculateRate(numerator, denominator) {
        if (denominator <= 0)
            return 0;
        const rate = (numerator / denominator) * 100;
        return Math.min(100, Math.max(0, Math.round(rate * 10) / 10));
    }
    /**
     * Get Overview Statistics
     */
    async getRecruitmentOverview(appFilter, jobFilter, candidateFilter) {
        const totalJobs = await Job_1.default.countDocuments({ isDeleted: false, ...jobFilter });
        const openJobs = await Job_1.default.countDocuments({ isDeleted: false, status: Job_1.JobStatus.OPEN, ...jobFilter });
        const totalCandidates = await Candidate_1.default.countDocuments({ isDeleted: false, ...candidateFilter });
        const totalApplications = await Application_1.default.countDocuments({ isDeleted: false, ...appFilter });
        const totalHires = await Application_1.default.countDocuments({
            isDeleted: false,
            currentStage: Application_1.ApplicationStage.HIRED,
            ...appFilter,
        });
        const totalRejections = await Application_1.default.countDocuments({
            isDeleted: false,
            currentStage: Application_1.ApplicationStage.REJECTED,
            ...appFilter,
        });
        const conversionRate = this.calculateRate(totalHires, totalApplications);
        // Calculate Average Time to Hire (in days)
        const timeToHirePipeline = [
            {
                $match: {
                    isDeleted: false,
                    currentStage: Application_1.ApplicationStage.HIRED,
                    hiredAt: { $ne: null },
                    appliedAt: { $ne: null },
                    ...appFilter,
                },
            },
            {
                $project: {
                    durationDays: {
                        $divide: [
                            { $subtract: ['$hiredAt', '$appliedAt'] },
                            1000 * 60 * 60 * 24, // Convert ms to days
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    avgDuration: { $avg: '$durationDays' },
                },
            },
        ];
        const durationResult = await Application_1.default.aggregate(timeToHirePipeline);
        const averageTimeToHire = durationResult[0]?.avgDuration || 0;
        return {
            totalJobs,
            openJobs,
            totalCandidates,
            totalApplications,
            totalHires,
            totalRejections,
            conversionRate,
            averageTimeToHire: Math.round(averageTimeToHire * 10) / 10,
        };
    }
    /**
     * Get Recruitment Pipeline Funnel Metrics
     */
    async getRecruitmentFunnel(appFilter) {
        const pipeline = [
            { $match: { isDeleted: false, ...appFilter } },
            {
                $project: {
                    hasScreening: {
                        $cond: [
                            {
                                $or: [
                                    { $ne: ['$screenedAt', null] },
                                    { $in: [Application_1.ApplicationStage.SCREENING, '$stageHistory.stage'] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                    hasShortlisted: {
                        $cond: [{ $in: [Application_1.ApplicationStage.SHORTLISTED, '$stageHistory.stage'] }, 1, 0],
                    },
                    hasInterview: {
                        $cond: [
                            {
                                $or: [
                                    { $ne: ['$interviewedAt', null] },
                                    { $ne: ['$interviewCompletedAt', null] },
                                    { $in: [Application_1.ApplicationStage.INTERVIEW, '$stageHistory.stage'] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                    hasOffer: {
                        $cond: [
                            {
                                $or: [
                                    { $ne: ['$offeredAt', null] },
                                    { $in: [Application_1.ApplicationStage.OFFER, '$stageHistory.stage'] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                    hasHired: {
                        $cond: [
                            {
                                $or: [
                                    { $ne: ['$hiredAt', null] },
                                    { $eq: ['$currentStage', Application_1.ApplicationStage.HIRED] },
                                    { $in: [Application_1.ApplicationStage.HIRED, '$stageHistory.stage'] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                    hasRejected: {
                        $cond: [
                            {
                                $or: [
                                    { $eq: ['$status', 'REJECTED'] },
                                    { $eq: ['$currentStage', Application_1.ApplicationStage.REJECTED] },
                                    { $in: [Application_1.ApplicationStage.REJECTED, '$stageHistory.stage'] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    Applied: { $sum: 1 },
                    Screening: { $sum: '$hasScreening' },
                    Shortlisted: { $sum: '$hasShortlisted' },
                    Interview: { $sum: '$hasInterview' },
                    Offer: { $sum: '$hasOffer' },
                    Hired: { $sum: '$hasHired' },
                    Rejected: { $sum: '$hasRejected' },
                },
            },
        ];
        const result = await Application_1.default.aggregate(pipeline);
        const counts = {
            Applied: result[0]?.Applied || 0,
            Screening: result[0]?.Screening || 0,
            Shortlisted: result[0]?.Shortlisted || 0,
            Interview: result[0]?.Interview || 0,
            Offer: result[0]?.Offer || 0,
            Hired: result[0]?.Hired || 0,
            Rejected: result[0]?.Rejected || 0,
        };
        // Calculate stage-to-stage conversion rates
        const conversionRates = {
            'Applied to Screening': this.calculateRate(counts.Screening, counts.Applied),
            'Screening to Shortlisted': this.calculateRate(counts.Shortlisted, counts.Screening),
            'Shortlisted to Interview': this.calculateRate(counts.Interview, counts.Shortlisted),
            'Interview to Offer': this.calculateRate(counts.Offer, counts.Interview),
            'Offer to Hired': this.calculateRate(counts.Hired, counts.Offer),
        };
        // Dropoffs
        const dropOffs = {
            'Applied to Screening': Math.max(0, counts.Applied - counts.Screening),
            'Screening to Shortlisted': Math.max(0, counts.Screening - counts.Shortlisted),
            'Shortlisted to Interview': Math.max(0, counts.Shortlisted - counts.Interview),
            'Interview to Offer': Math.max(0, counts.Interview - counts.Offer),
            'Offer to Hired': Math.max(0, counts.Offer - counts.Hired),
        };
        const efficiency = this.calculateRate(counts.Hired, counts.Applied);
        return {
            counts,
            conversionRates,
            dropOffs,
            efficiency,
        };
    }
    /**
     * Get AI Screening Stats & match score histogram distribution
     */
    async getAIScreeningStats(appFilter) {
        const pipeline = [
            {
                $match: {
                    isDeleted: false,
                    screeningStatus: 'COMPLETED',
                    aiScore: { $ne: null },
                    ...appFilter,
                },
            },
            {
                $group: {
                    _id: null,
                    totalScreened: { $sum: 1 },
                    averageMatchScore: { $avg: '$aiScore' },
                    recommended: {
                        $sum: {
                            $cond: [
                                { $in: ['$aiRecommendation', ['Strongly Recommended', 'Recommended']] },
                                1,
                                0,
                            ],
                        },
                    },
                    needsReview: {
                        $sum: {
                            $cond: [{ $eq: ['$aiRecommendation', 'Requires Screen'] }, 1, 0],
                        },
                    },
                    notRecommended: {
                        $sum: {
                            $cond: [{ $eq: ['$aiRecommendation', 'Not Recommended'] }, 1, 0],
                        },
                    },
                    bin0To20: { $sum: { $cond: [{ $and: [{ $gte: ['$aiScore', 0] }, { $lte: ['$aiScore', 20] }] }, 1, 0] } },
                    bin20To40: { $sum: { $cond: [{ $and: [{ $gt: ['$aiScore', 20] }, { $lte: ['$aiScore', 40] }] }, 1, 0] } },
                    bin40To60: { $sum: { $cond: [{ $and: [{ $gt: ['$aiScore', 40] }, { $lte: ['$aiScore', 60] }] }, 1, 0] } },
                    bin60To80: { $sum: { $cond: [{ $and: [{ $gt: ['$aiScore', 60] }, { $lte: ['$aiScore', 80] }] }, 1, 0] } },
                    bin80To100: { $sum: { $cond: [{ $and: [{ $gt: ['$aiScore', 80] }, { $lte: ['$aiScore', 100] }] }, 1, 0] } },
                },
            },
        ];
        const result = await Application_1.default.aggregate(pipeline);
        const data = result[0] || {
            totalScreened: 0,
            averageMatchScore: 0,
            recommended: 0,
            needsReview: 0,
            notRecommended: 0,
            bin0To20: 0,
            bin20To40: 0,
            bin40To60: 0,
            bin60To80: 0,
            bin80To100: 0,
        };
        const scoreDistribution = [
            { bin: '0–20', count: data.bin0To20 },
            { bin: '20–40', count: data.bin20To40 },
            { bin: '40–60', count: data.bin40To60 },
            { bin: '60–80', count: data.bin60To80 },
            { bin: '80–100', count: data.bin80To100 },
        ];
        const recommendationRate = this.calculateRate(data.recommended, data.totalScreened);
        return {
            totalScreened: data.totalScreened,
            averageMatchScore: Math.round(data.averageMatchScore * 10) / 10,
            recommended: data.recommended,
            needsReview: data.needsReview,
            notRecommended: data.notRecommended,
            scoreDistribution,
            recommendationRate,
        };
    }
    /**
     * Get AI Interview Stats
     */
    async getAIInterviewStats(appFilter) {
        const pipeline = [
            {
                $match: {
                    isDeleted: false,
                    $or: [
                        { interviewStatus: { $ne: null } },
                        { interviewCompletedAt: { $ne: null } },
                        { currentStage: Application_1.ApplicationStage.INTERVIEW },
                    ],
                    ...appFilter,
                },
            },
            {
                $group: {
                    _id: null,
                    interviewsScheduled: { $sum: 1 },
                    interviewsCompleted: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$interviewStatus', 'COMPLETED'] },
                                        { $ne: ['$interviewCompletedAt', null] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    averageInterviewScore: {
                        $avg: {
                            $cond: [{ $ne: ['$interviewScore', null] }, '$interviewScore', '$$REMOVE'],
                        },
                    },
                    passCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {
                                            $or: [
                                                { $eq: ['$interviewStatus', 'COMPLETED'] },
                                                { $ne: ['$interviewCompletedAt', null] },
                                            ],
                                        },
                                        { $ne: ['$interviewScore', null] },
                                        { $gte: ['$interviewScore', 60] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    failCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        {
                                            $or: [
                                                { $eq: ['$interviewStatus', 'COMPLETED'] },
                                                { $ne: ['$interviewCompletedAt', null] },
                                            ],
                                        },
                                        { $ne: ['$interviewScore', null] },
                                        { $lt: ['$interviewScore', 60] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ];
        const result = await Application_1.default.aggregate(pipeline);
        const data = result[0] || {
            interviewsScheduled: 0,
            interviewsCompleted: 0,
            averageInterviewScore: 0,
            passCount: 0,
            failCount: 0,
        };
        const passRate = this.calculateRate(data.passCount, data.interviewsCompleted);
        const failureRate = this.calculateRate(data.failCount, data.interviewsCompleted);
        const completionRate = this.calculateRate(data.interviewsCompleted, data.interviewsScheduled);
        // Fetch Top Candidates based on Interview/AI Score
        const topCandidates = await Application_1.default.find({
            isDeleted: false,
            interviewScore: { $ne: null },
            ...appFilter,
        })
            .sort({ interviewScore: -1, aiScore: -1 })
            .limit(5)
            .populate('candidateId', 'firstName lastName email candidateCode')
            .populate('jobId', 'title jobCode');
        const formattedTopCandidates = topCandidates.map((app) => ({
            applicationId: app._id,
            candidateName: app.candidateId
                ? `${app.candidateId.firstName} ${app.candidateId.lastName}`
                : 'Unknown Candidate',
            candidateCode: app.candidateId?.candidateCode || 'N/A',
            candidateEmail: app.candidateId?.email || 'N/A',
            jobTitle: app.jobId?.title || 'Unknown Job',
            jobCode: app.jobId?.jobCode || 'N/A',
            interviewScore: app.interviewScore,
            aiScore: app.aiScore,
        }));
        return {
            interviewsScheduled: data.interviewsScheduled,
            interviewsCompleted: data.interviewsCompleted,
            averageInterviewScore: Math.round(data.averageInterviewScore * 10) / 10,
            passRate,
            failureRate,
            topPerformingCandidates: formattedTopCandidates,
            completionRate,
        };
    }
    /**
     * Get Recruiter Leaderboard/Performance Metrics
     */
    async getRecruiterPerformance(appFilter, recruiterIdFilter) {
        const pipeline = [
            { $match: { isDeleted: false, ...appFilter } },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'jobId',
                    foreignField: '_id',
                    as: 'job',
                },
            },
            { $unwind: '$job' },
            { $match: { 'job.isDeleted': false } },
        ];
        if (recruiterIdFilter) {
            pipeline.push({
                $match: { 'job.createdBy': new mongoose_1.default.Types.ObjectId(recruiterIdFilter) },
            });
        }
        pipeline.push({
            $group: {
                _id: '$job.createdBy',
                candidatesProcessed: { $sum: 1 },
                interviewsConducted: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    { $eq: ['$currentStage', Application_1.ApplicationStage.INTERVIEW] },
                                    { $ne: ['$interviewedAt', null] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                offersReleased: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    { $eq: ['$currentStage', Application_1.ApplicationStage.OFFER] },
                                    { $ne: ['$offeredAt', null] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                hiresCompleted: {
                    $sum: {
                        $cond: [
                            {
                                $or: [
                                    { $eq: ['$currentStage', Application_1.ApplicationStage.HIRED] },
                                    { $ne: ['$hiredAt', null] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
                hiredTimes: {
                    $push: {
                        $cond: [
                            {
                                $and: [{ $ne: ['$hiredAt', null] }, { $ne: ['$appliedAt', null] }],
                            },
                            { $divide: [{ $subtract: ['$hiredAt', '$appliedAt'] }, 1000 * 60 * 60 * 24] },
                            '$$REMOVE',
                        ],
                    },
                },
            },
        }, {
            $lookup: {
                from: 'users',
                localField: '_id',
                foreignField: '_id',
                as: 'recruiter',
            },
        }, { $unwind: '$recruiter' }, {
            $project: {
                recruiterId: '$_id',
                recruiterName: { $concat: ['$recruiter.firstName', ' ', '$recruiter.lastName'] },
                recruiterEmail: '$recruiter.email',
                candidatesProcessed: 1,
                interviewsConducted: 1,
                offersReleased: 1,
                hiresCompleted: 1,
                conversionRate: {
                    $cond: [
                        { $gt: ['$candidatesProcessed', 0] },
                        { $multiply: [{ $divide: ['$hiresCompleted', '$candidatesProcessed'] }, 100] },
                        0,
                    ],
                },
                averageTimeToHire: { $avg: '$hiredTimes' },
            },
        });
        const result = await Application_1.default.aggregate(pipeline);
        // If a recruiter is logged in, but has no data, they should see 0 metrics.
        if (recruiterIdFilter && result.length === 0) {
            const user = await User_1.User.findById(recruiterIdFilter, 'firstName lastName email');
            if (user) {
                return [
                    {
                        recruiterId: user._id,
                        recruiterName: `${user.firstName} ${user.lastName}`,
                        recruiterEmail: user.email,
                        candidatesProcessed: 0,
                        interviewsConducted: 0,
                        offersReleased: 0,
                        hiresCompleted: 0,
                        conversionRate: 0,
                        averageTimeToHire: 0,
                    },
                ];
            }
        }
        return result
            .map((item) => ({
            ...item,
            conversionRate: this.calculateRate(item.hiresCompleted, item.candidatesProcessed),
            averageTimeToHire: item.averageTimeToHire ? Math.round(item.averageTimeToHire * 10) / 10 : 0,
        }))
            .sort((a, b) => b.hiresCompleted - a.hiresCompleted);
    }
    /**
     * Get Department Hiring Analytics
     */
    async getDepartmentHiringStats(appFilter) {
        const pipeline = [
            { $match: { isDeleted: false, ...appFilter } },
            {
                $lookup: {
                    from: 'jobs',
                    localField: 'jobId',
                    foreignField: '_id',
                    as: 'job',
                },
            },
            { $unwind: '$job' },
            { $match: { 'job.isDeleted': false } },
            {
                $group: {
                    _id: '$job.departmentId',
                    applicationsReceived: { $sum: 1 },
                    interviewsConducted: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$currentStage', Application_1.ApplicationStage.INTERVIEW] },
                                        { $ne: ['$interviewedAt', null] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    hires: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ['$currentStage', Application_1.ApplicationStage.HIRED] },
                                        { $ne: ['$hiredAt', null] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    hiredTimes: {
                        $push: {
                            $cond: [
                                {
                                    $and: [{ $ne: ['$hiredAt', null] }, { $ne: ['$appliedAt', null] }],
                                },
                                { $divide: [{ $subtract: ['$hiredAt', '$appliedAt'] }, 1000 * 60 * 60 * 24] },
                                '$$REMOVE',
                            ],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'departments',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'department',
                },
            },
            { $unwind: '$department' },
            {
                $project: {
                    departmentId: '$_id',
                    departmentName: '$department.name',
                    applicationsReceived: 1,
                    interviewsConducted: 1,
                    hires: 1,
                    averageHiringTime: { $avg: '$hiredTimes' },
                },
            },
        ];
        const deptStats = await Application_1.default.aggregate(pipeline);
        // Fetch open jobs count per department
        const openJobsStats = await Job_1.default.aggregate([
            { $match: { isDeleted: false, status: Job_1.JobStatus.OPEN } },
            { $group: { _id: '$departmentId', openJobs: { $sum: 1 } } },
        ]);
        const openJobsMap = new Map(openJobsStats.map((item) => [item._id.toString(), item.openJobs]));
        return deptStats
            .map((item) => ({
            ...item,
            conversionRate: this.calculateRate(item.hires, item.applicationsReceived),
            openJobs: openJobsMap.get(item.departmentId.toString()) || 0,
            averageHiringTime: item.averageHiringTime ? Math.round(item.averageHiringTime * 10) / 10 : 0,
        }))
            .sort((a, b) => b.hires - a.hires);
    }
    /**
     * Get Job Performance Analytics (with pagination)
     */
    async getJobPerformance(appFilter, pagination) {
        const skip = (pagination.page - 1) * pagination.limit;
        const pipeline = [
            { $match: { isDeleted: false, ...appFilter } },
            {
                $group: {
                    _id: '$jobId',
                    applications: { $sum: 1 },
                    shortlisted: {
                        $sum: {
                            $cond: [{ $in: [Application_1.ApplicationStage.SHORTLISTED, '$stageHistory.stage'] }, 1, 0],
                        },
                    },
                    interviews: {
                        $sum: {
                            $cond: [{ $in: [Application_1.ApplicationStage.INTERVIEW, '$stageHistory.stage'] }, 1, 0],
                        },
                    },
                    offers: {
                        $sum: {
                            $cond: [{ $in: [Application_1.ApplicationStage.OFFER, '$stageHistory.stage'] }, 1, 0],
                        },
                    },
                    hires: {
                        $sum: {
                            $cond: [{ $in: [Application_1.ApplicationStage.HIRED, '$stageHistory.stage'] }, 1, 0],
                        },
                    },
                    rejections: {
                        $sum: {
                            $cond: [{ $in: [Application_1.ApplicationStage.REJECTED, '$stageHistory.stage'] }, 1, 0],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'jobs',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'job',
                },
            },
            { $unwind: '$job' },
            { $match: { 'job.isDeleted': false } },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'job.departmentId',
                    foreignField: '_id',
                    as: 'department',
                },
            },
            { $unwind: { path: '$department', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    jobId: '$_id',
                    jobCode: '$job.jobCode',
                    jobTitle: '$job.title',
                    departmentName: '$department.name',
                    applications: 1,
                    shortlisted: 1,
                    interviews: 1,
                    offers: 1,
                    hires: 1,
                    rejections: 1,
                },
            },
            {
                $facet: {
                    metadata: [{ $count: 'total' }],
                    data: [{ $sort: { applications: -1 } }, { $skip: skip }, { $limit: pagination.limit }],
                },
            },
        ];
        const results = await Application_1.default.aggregate(pipeline);
        const total = results[0]?.metadata[0]?.total || 0;
        const data = results[0]?.data || [];
        return { data, total };
    }
    /**
     * Skills Intelligence Analytics
     */
    async getSkillsIntelligence(jobFilter, candidateFilter) {
        const totalJobs = (await Job_1.default.countDocuments({ isDeleted: false, ...jobFilter })) || 1;
        const totalCandidates = (await Candidate_1.default.countDocuments({ isDeleted: false, ...candidateFilter })) || 1;
        // 1. Most Requested Skills
        const requestedPipeline = [
            { $match: { isDeleted: false, ...jobFilter } },
            { $unwind: '$requiredSkills' },
            {
                $group: {
                    _id: { $trim: { input: '$requiredSkills' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 15 },
        ];
        const requestedSkills = await Job_1.default.aggregate(requestedPipeline);
        // 2. Most Available Skills
        const availablePipeline = [
            { $match: { isDeleted: false, ...candidateFilter } },
            { $unwind: '$skills' },
            {
                $group: {
                    _id: { $trim: { input: '$skills' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { count: -1 } },
            { $limit: 15 },
        ];
        const availableSkills = await Candidate_1.default.aggregate(availablePipeline);
        // Compute supply counts for demand skills to build gap analysis
        const demandSkillNames = requestedSkills.map((s) => s._id);
        const supplyStats = await Candidate_1.default.aggregate([
            { $match: { isDeleted: false, skills: { $in: demandSkillNames } } },
            { $unwind: '$skills' },
            {
                $group: {
                    _id: { $trim: { input: '$skills' } },
                    count: { $sum: 1 },
                },
            },
        ]);
        const supplyMap = new Map(supplyStats.map((s) => [s._id.toLowerCase(), s.count]));
        // Gap analysis: comparing demand % vs supply %
        const skillGap = requestedSkills.map((req) => {
            const demandCount = req.count;
            const supplyCount = supplyMap.get(req._id.toLowerCase()) || 0;
            const demandPct = (demandCount / totalJobs) * 100;
            const supplyPct = (supplyCount / totalCandidates) * 100;
            return {
                skill: req._id,
                demandCount,
                supplyCount,
                demandPct: Math.round(demandPct * 10) / 10,
                supplyPct: Math.round(supplyPct * 10) / 10,
                gap: Math.round((demandPct - supplyPct) * 10) / 10, // positive gap = shortage
            };
        });
        const shortages = [...skillGap].filter((s) => s.gap > 5).sort((a, b) => b.gap - a.gap);
        // emerging: skills with low supply but appearing in recent jobs
        const emerging = skillGap
            .filter((s) => s.supplyPct < 15 && s.demandCount > 1)
            .map((s) => ({ skill: s.skill, demandCount: s.demandCount, supplyPct: s.supplyPct }));
        return {
            requestedSkills: requestedSkills.map((s) => ({ skill: s._id, count: s.count })),
            availableSkills: availableSkills.map((s) => ({ skill: s._id, count: s.count })),
            skillGap,
            shortages,
            emerging,
        };
    }
    /**
     * Activity Trends over time (Daily, Weekly, Monthly)
     */
    async getRecruitmentActivityStats(appFilter) {
        const dailyPeriod = new Date();
        dailyPeriod.setDate(dailyPeriod.getDate() - 15); // Last 15 days
        const daily = await Application_1.default.aggregate([
            { $match: { isDeleted: false, appliedAt: { $gte: dailyPeriod }, ...appFilter } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const weeklyPeriod = new Date();
        weeklyPeriod.setDate(weeklyPeriod.getDate() - 84); // Last 12 weeks
        const weekly = await Application_1.default.aggregate([
            { $match: { isDeleted: false, appliedAt: { $gte: weeklyPeriod }, ...appFilter } },
            {
                $group: {
                    _id: { $concat: ['W', { $toString: { $week: '$appliedAt' } }, '-', { $toString: { $year: '$appliedAt' } }] },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const monthlyPeriod = new Date();
        monthlyPeriod.setDate(monthlyPeriod.getDate() - 365); // Last 12 months
        const monthly = await Application_1.default.aggregate([
            { $match: { isDeleted: false, appliedAt: { $gte: monthlyPeriod }, ...appFilter } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$appliedAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        const hiringTrends = await Application_1.default.aggregate([
            {
                $match: {
                    isDeleted: false,
                    currentStage: Application_1.ApplicationStage.HIRED,
                    hiredAt: { $gte: monthlyPeriod },
                    ...appFilter,
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$hiredAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        // Recruitment Velocity (Average time between stages in days)
        const velocityResult = await Application_1.default.aggregate([
            { $match: { isDeleted: false, ...appFilter } },
            {
                $project: {
                    appliedToScreening: {
                        $cond: [
                            { $and: [{ $ne: ['$screenedAt', null] }, { $ne: ['$appliedAt', null] }] },
                            { $divide: [{ $subtract: ['$screenedAt', '$appliedAt'] }, 1000 * 60 * 60 * 24] },
                            '$$REMOVE',
                        ],
                    },
                    screeningToInterview: {
                        $cond: [
                            { $and: [{ $ne: ['$interviewedAt', null] }, { $ne: ['$screenedAt', null] }] },
                            { $divide: [{ $subtract: ['$interviewedAt', '$screenedAt'] }, 1000 * 60 * 60 * 24] },
                            '$$REMOVE',
                        ],
                    },
                    interviewToOffer: {
                        $cond: [
                            { $and: [{ $ne: ['$offeredAt', null] }, { $ne: ['$interviewedAt', null] }] },
                            { $divide: [{ $subtract: ['$offeredAt', '$interviewedAt'] }, 1000 * 60 * 60 * 24] },
                            '$$REMOVE',
                        ],
                    },
                    offerToHire: {
                        $cond: [
                            { $and: [{ $ne: ['$hiredAt', null] }, { $ne: ['$offeredAt', null] }] },
                            { $divide: [{ $subtract: ['$hiredAt', '$offeredAt'] }, 1000 * 60 * 60 * 24] },
                            '$$REMOVE',
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    AppliedToScreening: { $avg: '$appliedToScreening' },
                    ScreeningToInterview: { $avg: '$screeningToInterview' },
                    InterviewToOffer: { $avg: '$interviewToOffer' },
                    OfferToHire: { $avg: '$offerToHire' },
                },
            },
        ]);
        const velocityData = velocityResult[0] || {};
        const recruitmentVelocity = {
            'Applied to Screening': Math.round((velocityData.AppliedToScreening || 0) * 10) / 10,
            'Screening to Interview': Math.round((velocityData.ScreeningToInterview || 0) * 10) / 10,
            'Interview to Offer': Math.round((velocityData.InterviewToOffer || 0) * 10) / 10,
            'Offer to Hired': Math.round((velocityData.OfferToHire || 0) * 10) / 10,
        };
        return {
            daily: daily.map((d) => ({ date: d._id, count: d.count })),
            weekly: weekly.map((w) => ({ week: w._id, count: w.count })),
            monthly: monthly.map((m) => ({ month: m._id, count: m.count })),
            hiringTrends: hiringTrends.map((h) => ({ month: h._id, count: h.count })),
            recruitmentVelocity,
        };
    }
}
exports.AnalyticsRepository = AnalyticsRepository;
exports.default = new AnalyticsRepository();
