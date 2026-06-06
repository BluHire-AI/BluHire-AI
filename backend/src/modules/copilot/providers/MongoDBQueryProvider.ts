import { Model } from 'mongoose';
import { KnowledgeProvider } from './KnowledgeProvider';

export class MongoDBQueryProvider implements KnowledgeProvider {
  name = 'mongodb-query-provider';

  /**
   * Safe MongoDB query helper enforcing page size limits (max 100)
   */
  async query(model: Model<any>, filter: any = {}, limit: number = 100): Promise<any[]> {
    const hardLimit = Math.min(100, Math.max(1, limit || 100));
    return await model.find(filter).limit(hardLimit).lean();
  }
}

export default new MongoDBQueryProvider();
