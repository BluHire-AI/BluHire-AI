"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBQueryProvider = void 0;
class MongoDBQueryProvider {
    name = 'mongodb-query-provider';
    /**
     * Safe MongoDB query helper enforcing page size limits (max 100)
     */
    async query(model, filter = {}, limit = 100) {
        const hardLimit = Math.min(100, Math.max(1, limit || 100));
        return await model.find(filter).limit(hardLimit).lean();
    }
}
exports.MongoDBQueryProvider = MongoDBQueryProvider;
exports.default = new MongoDBQueryProvider();
