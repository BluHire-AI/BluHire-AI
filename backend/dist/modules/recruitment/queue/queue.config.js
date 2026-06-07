"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.interviewQueue = exports.redisConnection = void 0;
exports.isRedisOnline = isRedisOnline;
exports.logRedisOfflineWarning = logRedisOfflineWarning;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
exports.redisConnection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};
async function isRedisOnline() {
    const client = new ioredis_1.default({
        host: exports.redisConnection.host,
        port: exports.redisConnection.port,
        connectTimeout: 500, // 500ms timeout
        maxRetriesPerRequest: 0,
        retryStrategy: () => null, // do not retry
    });
    try {
        await client.ping();
        await client.quit();
        return true;
    }
    catch (err) {
        client.disconnect();
        return false;
    }
}
exports.interviewQueue = new bullmq_1.Queue('interviewQueue', {
    connection: exports.redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
    },
});
let redisWarningLogged = false;
function logRedisOfflineWarning() {
    if (!redisWarningLogged) {
        console.warn('\n⚠️  [Redis Warning] Could not connect to Redis at 127.0.0.1:6379.');
        console.warn('   The AI Voice Interview background worker requires Redis to process async transcription and evaluation.');
        console.warn('   If you are running in local offline mode, the app will continue to run, but interview evaluations will remain pending.\n');
        redisWarningLogged = true;
    }
}
exports.interviewQueue.on('error', (err) => {
    if (err.code === 'ECONNREFUSED') {
        logRedisOfflineWarning();
    }
    else {
        console.error('[Queue Error]', err);
    }
});
