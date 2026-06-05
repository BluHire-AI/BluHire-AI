import RecruitmentActivityModel, { IRecruitmentActivity } from '../../../models/RecruitmentActivity';

export class RecruitmentActivityRepository {
  /**
   * Log a recruitment activity
   */
  async create(activityData: Partial<IRecruitmentActivity>): Promise<IRecruitmentActivity> {
    const activity = new RecruitmentActivityModel(activityData);
    return await activity.save();
  }

  /**
   * Get recent activity feed
   */
  async findRecent(limit: number = 20): Promise<IRecruitmentActivity[]> {
    return await RecruitmentActivityModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('candidateId', 'firstName lastName email candidateCode')
      .populate('jobId', 'title jobCode')
      .populate('applicationId', 'currentStage')
      .populate('createdBy', 'firstName lastName email');
  }
}

export default new RecruitmentActivityRepository();
