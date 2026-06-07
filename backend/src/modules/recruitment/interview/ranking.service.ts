import InterviewAssignment from '../../../models/InterviewAssignment';

export class RankingService {
  /**
   * Recalculates candidate positions dynamically for all completed interview assignments under a specific job
   */
  static async updateRankingsForJob(jobId: string): Promise<void> {
    try {
      // 1. Fetch all completed or reviewed assignments for the job, sorted by finalCandidateScore desc
      const assignments = await InterviewAssignment.find({
        jobId,
        status: { $in: ['Completed', 'Reviewed'] },
        finalCandidateScore: { $ne: null }
      }).sort({ finalCandidateScore: -1 });

      console.log(`[Ranking Service] Updating rankings for ${assignments.length} assignments under jobId: ${jobId}`);

      // 2. Update each assignment's rankingPosition and explanation reasoning
      for (let i = 0; i < assignments.length; i++) {
        const assignment = assignments[i];
        assignment.rankingPosition = i + 1;
        assignment.rankingReasoning = `Ranked #${i + 1} of ${assignments.length} candidates based on cumulative score (Resume 40%, Interview 60%).`;
        await assignment.save();
      }
    } catch (err: any) {
      console.error(`[Ranking Service Error] Failed to update rankings for job ${jobId}:`, err.message);
    }
  }
}
