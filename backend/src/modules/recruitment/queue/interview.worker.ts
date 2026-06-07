import { Worker } from 'bullmq';
import { redisConnection, logRedisOfflineWarning } from './queue.config';
import interviewService from '../interview/interview.service';

export const interviewWorker = new Worker(
  'interviewQueue',
  async (job) => {
    console.log(`[Queue Worker] Processing job ${job.id} of type ${job.name}`);

    try {
      if (job.name === 'process-answer') {
        const { sessionId, responseId, audioFilePath, questionText } = job.data;
        await interviewService.processAnswer(sessionId, responseId, audioFilePath, questionText);
      }

      if (job.name === 'generate-report') {
        const { sessionId } = job.data;
        await interviewService.compileReport(sessionId);
      }
    } catch (workerErr: any) {
      console.error(`[Queue Worker Error] Failed processing job ${job.id}:`, workerErr.message);
      throw workerErr;
    }
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

console.log('[Queue Worker] Async Interview Queue Worker started.');

interviewWorker.on('error', (err: any) => {
  if (err.code === 'ECONNREFUSED') {
    logRedisOfflineWarning();
  } else {
    console.error('[Worker Error]', err);
  }
});

