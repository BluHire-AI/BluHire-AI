import { CopilotAuditLog } from '../../../models/CopilotAuditLog';
import mongoose from 'mongoose';

export class AnalyticsService {
  /**
   * Records semantic search queries in the database for analytics and audit logging
   */
  async recordSearch(data: {
    query: string;
    resultsFound: number;
    latency: number;
    documentsHit: string[];
    userId: string;
  }): Promise<void> {
    try {
      console.log("Search Query:", data.query);
      console.log("Logging Analytics...");
      console.log("Results Found:", data.resultsFound);

      await CopilotAuditLog.create({
        userId: new mongoose.Types.ObjectId(data.userId),
        prompt: data.query,
        toolsUsed: [{
          name: 'searchKnowledgeBase',
          arguments: { 
            query: data.query, 
            limit: data.resultsFound,
            documentsHit: data.documentsHit 
          },
          durationMs: data.latency,
          status: 'SUCCESS'
        }],
        response: `Direct Search returned ${data.resultsFound} results. Documents hit: ${data.documentsHit.join(', ')}`,
        timestamp: new Date()
      });

      console.log("Analytics Saved");
    } catch (error: any) {
      console.error("[AnalyticsService] Error saving search log:", error.message);
    }
  }
}

export const analyticsService = new AnalyticsService();
