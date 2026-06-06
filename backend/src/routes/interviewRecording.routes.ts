import { Router } from 'express';
import { interviewRecordingController } from '../controllers/interviewRecording.controller';
import { uploadChunkMiddleware } from '../middlewares/upload.middleware';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint for chunked video upload
router.post(
  '/upload',
  authenticate,
  uploadChunkMiddleware.single('chunk'),
  interviewRecordingController.uploadChunk
);

// Endpoint to get a recording by ID
router.get(
  '/:id',
  authenticate,
  interviewRecordingController.getRecording
);

export default router;
