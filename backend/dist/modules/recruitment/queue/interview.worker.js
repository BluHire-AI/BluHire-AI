"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interviewWorker = void 0;
const bullmq_1 = require("bullmq");
const queue_config_1 = require("./queue.config");
const interview_service_1 = __importDefault(require("../interview/interview.service"));
exports.interviewWorker = new bullmq_1.Worker('interviewQueue', async (job) => {
    console.log(`[Queue Worker] Processing job ${job.id} of type ${job.name}`);
    try {
        if (job.name === 'process-answer') {
            const { sessionId, responseId, audioFilePath, questionText } = job.data;
            await interview_service_1.default.processAnswer(sessionId, responseId, audioFilePath, questionText);
        }
        if (job.name === 'generate-report') {
            const { sessionId } = job.data;
            await interview_service_1.default.compileReport(sessionId);
        }
    }
    catch (workerErr) {
        console.error(`[Queue Worker Error] Failed processing job ${job.id}:`, workerErr.message);
        throw workerErr;
    }
}, {
    connection: queue_config_1.redisConnection,
    concurrency: 2,
});
console.log('[Queue Worker] Async Interview Queue Worker started.');
exports.interviewWorker.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        (0, queue_config_1.logRedisOfflineWarning)();
    }
    else {
        console.error('[Worker Error]', err);
    }
});
