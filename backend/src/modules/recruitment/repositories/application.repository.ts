import mongoose from 'mongoose';
import ApplicationModel, { IApplication, ApplicationStage, IStageHistory } from '../../../models/Application';
import { PaginationDTO } from '../../employee/dtos/common.dto';

export interface ApplicationQueryDTO {
  search?: string;
  skill?: string;
  jobId?: string;
  currentStage?: ApplicationStage;
  experience?: string;
  aiScoreMin?: number;
  aiScoreMax?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class ApplicationRepository {
  /**
   * Create new job application
   */
  async create(applicationData: Partial<IApplication>): Promise<IApplication> {
    const application = new ApplicationModel(applicationData);
    return await application.save();
  }

  /**
   * Find application by ID
   */
  async findById(applicationId: string): Promise<IApplication | null> {
    return await ApplicationModel.findOne({ _id: applicationId, isDeleted: false })
      .populate({
        path: 'candidateId',
        match: { isDeleted: false },
      })
      .populate({
        path: 'jobId',
        match: { isDeleted: false },
        populate: [
          { path: 'departmentId', select: 'name' },
          { path: 'designationId', select: 'title' },
        ],
      })
      .populate('employeeId');
  }

  /**
   * Find application by candidate ID and job ID to check duplicate
   */
  async findByCandidateAndJob(candidateId: string, jobId: string): Promise<IApplication | null> {
    return await ApplicationModel.findOne({
      candidateId,
      jobId,
      isDeleted: false,
    });
  }

  /**
   * Update application fields
   */
  async update(applicationId: string, updateData: Partial<IApplication>): Promise<IApplication | null> {
    return await ApplicationModel.findOneAndUpdate(
      { _id: applicationId, isDeleted: false },
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('candidateId')
      .populate('jobId');
  }

  /**
   * Update application stage and record in stageHistory
   */
  async updateStage(
    applicationId: string,
    stage: ApplicationStage,
    userId: string,
    notes?: string
  ): Promise<IApplication | null> {
    const historyItem: IStageHistory = {
      stage,
      changedAt: new Date(),
      changedBy: userId,
      notes,
    };

    const updateFields: any = {
      currentStage: stage,
      $push: { stageHistory: historyItem },
      updatedAt: new Date(),
    };

    // Set lifecycle date flags
    if (stage === ApplicationStage.SCREENING) updateFields.screenedAt = new Date();
    else if (stage === ApplicationStage.INTERVIEW) updateFields.interviewedAt = new Date();
    else if (stage === ApplicationStage.OFFER) updateFields.offeredAt = new Date();
    else if (stage === ApplicationStage.HIRED) {
      updateFields.hiredAt = new Date();
      updateFields.status = 'HIRED';
    } else if (stage === ApplicationStage.REJECTED) {
      updateFields.status = 'REJECTED';
    }

    return await ApplicationModel.findOneAndUpdate(
      { _id: applicationId, isDeleted: false },
      updateFields,
      { new: true }
    )
      .populate('candidateId')
      .populate('jobId');
  }

  /**
   * Soft delete application
   */
  async softDelete(applicationId: string): Promise<IApplication | null> {
    return await ApplicationModel.findByIdAndUpdate(
      applicationId,
      { isDeleted: true, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * List applications with filtering and search
   */
  async findWithPagination(
    query: ApplicationQueryDTO,
    pagination: PaginationDTO = { page: 1, limit: 10 }
  ): Promise<{ applications: any[]; total: number }> {
    const page = Math.max(1, pagination.page || 1);
    const limit = Math.min(100, pagination.limit || 10);
    const skip = (page - 1) * limit;

    const pipeline: any[] = [];

    // 1. Match on application fields (first match stage)
    const matchStage: any = { isDeleted: false };
    if (query.jobId && (query.jobId as any) !== 'ALL' && (query.jobId as any) !== '') {
      matchStage.jobId = new mongoose.Types.ObjectId(query.jobId);
    }
    if (query.currentStage && (query.currentStage as any) !== 'ALL' && (query.currentStage as any) !== '') {
      matchStage.currentStage = query.currentStage;
    }
    if (query.status && (query.status as any) !== 'ALL' && (query.status as any) !== '') {
      matchStage.status = query.status;
    }
    if (query.aiScoreMin !== undefined && query.aiScoreMin !== null && (query.aiScoreMin as any) !== '') {
      matchStage.aiScore = { ...matchStage.aiScore, $gte: Number(query.aiScoreMin) };
    }
    if (query.aiScoreMax !== undefined && query.aiScoreMax !== null && (query.aiScoreMax as any) !== '') {
      matchStage.aiScore = { ...matchStage.aiScore, $lte: Number(query.aiScoreMax) };
    }
    
    // Date Range Filters
    if (query.startDate || query.endDate) {
      matchStage.appliedAt = {};
      if (query.startDate) matchStage.appliedAt.$gte = new Date(query.startDate);
      if (query.endDate) matchStage.appliedAt.$lte = new Date(query.endDate);
    }

    pipeline.push({ $match: matchStage });

    // 2. Lookup Candidate
    pipeline.push({
      $lookup: {
        from: 'candidates',
        localField: 'candidateId',
        foreignField: '_id',
        as: 'candidateId',
      },
    });
    pipeline.push({ $unwind: '$candidateId' });

    // Match Candidate fields
    const candidateMatch: any = { 'candidateId.isDeleted': false };
    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      candidateMatch.$or = [
        { 'candidateId.firstName': searchRegex },
        { 'candidateId.lastName': searchRegex },
        { 'candidateId.email': searchRegex },
        { 'candidateId.phone': searchRegex },
        { 'candidateId.candidateCode': searchRegex },
      ];
    }
    if (query.skill) {
      const skillRegex = new RegExp(query.skill, 'i');
      candidateMatch['candidateId.skills'] = { $in: [skillRegex] };
    }
    if (query.experience && query.experience !== 'ALL') {
      const expRegex = new RegExp(query.experience, 'i');
      candidateMatch['candidateId.experience'] = expRegex;
    }

    pipeline.push({ $match: candidateMatch });

    // 3. Lookup Job
    pipeline.push({
      $lookup: {
        from: 'jobs',
        localField: 'jobId',
        foreignField: '_id',
        as: 'jobId',
      },
    });
    pipeline.push({ $unwind: '$jobId' });
    pipeline.push({ $match: { 'jobId.isDeleted': false } });

    // 4. Lookup Job Department & Designation
    pipeline.push({
      $lookup: {
        from: 'departments',
        localField: 'jobId.departmentId',
        foreignField: '_id',
        as: 'jobId.departmentId',
      },
    });
    pipeline.push({
      $unwind: { path: '$jobId.departmentId', preserveNullAndEmptyArrays: true },
    });

    pipeline.push({
      $lookup: {
        from: 'designations',
        localField: 'jobId.designationId',
        foreignField: '_id',
        as: 'jobId.designationId',
      },
    });
    pipeline.push({
      $unwind: { path: '$jobId.designationId', preserveNullAndEmptyArrays: true },
    });

    // 5. Lookup Employee (preserve null)
    pipeline.push({
      $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        as: 'employeeId',
      },
    });
    pipeline.push({
      $unwind: { path: '$employeeId', preserveNullAndEmptyArrays: true },
    });

    // 6. Sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    let sortStage: any = {};
    if (sortBy === 'candidate') {
      sortStage = { 'candidateId.firstName': sortOrder, 'candidateId.lastName': sortOrder };
    } else if (sortBy === 'job') {
      sortStage = { 'jobId.title': sortOrder };
    } else if (sortBy === 'experience') {
      sortStage = { 'candidateId.experience': sortOrder };
    } else if (sortBy === 'appliedDate') {
      sortStage = { appliedAt: sortOrder };
    } else {
      sortStage = { [sortBy]: sortOrder };
    }
    pipeline.push({ $sort: sortStage });

    // 7. Facet for count & skip/limit paginating
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    });

    const results = await ApplicationModel.aggregate(pipeline);
    const total = results[0]?.metadata[0]?.total || 0;
    const applications = results[0]?.data || [];

    return { applications, total };
  }

  /**
   * Get application pipeline statistics
   */
  async getPipelineStats(): Promise<Record<string, number>> {
    const results = await ApplicationModel.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$currentStage', count: { $sum: 1 } } },
    ]);

    // Initial structure with 0s
    const stats: Record<string, number> = {
      [ApplicationStage.APPLIED]: 0,
      [ApplicationStage.SCREENING]: 0,
      [ApplicationStage.SHORTLISTED]: 0,
      [ApplicationStage.INTERVIEW]: 0,
      [ApplicationStage.OFFER]: 0,
      [ApplicationStage.HIRED]: 0,
      [ApplicationStage.REJECTED]: 0,
    };

    results.forEach((res) => {
      if (stats[res._id] !== undefined) {
        stats[res._id] = res.count;
      }
    });

    return stats;
  }

  /**
   * Count applications
   */
  async countAll(): Promise<number> {
    return await ApplicationModel.countDocuments({ isDeleted: false });
  }

  /**
   * Count applications submitted today
   */
  async countNewToday(): Promise<number> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return await ApplicationModel.countDocuments({
      createdAt: { $gte: startOfToday },
      isDeleted: false,
    });
  }
}

export default new ApplicationRepository();
