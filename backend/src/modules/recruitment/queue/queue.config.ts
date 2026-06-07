import { Queue, ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export async function isRedisOnline(): Promise<boolean> {
  const client = new Redis({
    host: (redisConnection as any).host,
    port: (redisConnection as any).port,
    connectTimeout: 500, // 500ms timeout
    maxRetriesPerRequest: 0,
    retryStrategy: () => null, // do not retry
  });

  try {
    await client.ping();
    await client.quit();
    return true;
  } catch (err) {
    client.disconnect();
    return false;
  }
}

export const interviewQueue = new Queue('interviewQueue', {
  connection: redisConnection,
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

export function logRedisOfflineWarning() {
  if (!redisWarningLogged) {
    console.warn('\n⚠️  [Redis Warning] Could not connect to Redis at 127.0.0.1:6379.');
    console.warn('   The AI Voice Interview background worker requires Redis to process async transcription and evaluation.');
    console.warn('   If you are running in local offline mode, the app will continue to run, but interview evaluations will remain pending.\n');
    redisWarningLogged = true;
  }
}

interviewQueue.on('error', (err: any) => {
  if (err.code === 'ECONNREFUSED') {
    logRedisOfflineWarning();
  } else {
    console.error('[Queue Error]', err);
  }
});
