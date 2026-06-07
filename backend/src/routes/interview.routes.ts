import express from 'express';
import path from 'path';
import multer from 'multer';
import { 
  scheduleInterview, 
  getPublicSession, 
  startPublicSession, 
  submitPublicSession,
  uploadRecording,
  getNextQuestion,
  getAllSessions,
  resetInterviewSession,
  deleteInterviewSession
} from '../controllers/interview.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';
import { SystemRoles } from '../models/roles';

const router = express.Router();

// Multer diskStorage — preserves .webm extension, stores in absolute path
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads', 'interviews'));
  },
  filename: (req, file, cb) => {
    const token = (req.params as any).token || 'unknown';
    const qi = req.body?.questionIndex ?? 0;
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${token}_q${qi}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// ----------------------------------------------------
// PUBLIC ROUTES (No Authentication Required)
// ----------------------------------------------------

// Get public interview details using token
router.get('/public/:token', getPublicSession);

// Start the public interview session
router.post('/public/:token/start', startPublicSession);

// Get next adaptive question
router.get('/public/:token/next-question', getNextQuestion);

// Upload recording chunk/file (upload must come BEFORE submit so multer parses the body)
router.post('/public/:token/upload', upload.single('video'), uploadRecording);

// Submit the public interview session
router.post('/public/:token/submit', submitPublicSession);

// ----------------------------------------------------
// PROTECTED ROUTES (Recruiters & Admins Only)
// ----------------------------------------------------

// Ensure all subsequent routes require authentication
router.use(authenticate);

// Schedule a new interview and send email token
router.post(
  '/schedule',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER, SystemRoles.HR_RECRUITER]),
  scheduleInterview
);

// Get all interview sessions
router.get(
  '/sessions',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER, SystemRoles.HR_RECRUITER]),
  getAllSessions
);

// Reset a session for retry
router.post(
  '/:id/retry',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER, SystemRoles.HR_RECRUITER]),
  resetInterviewSession
);

// Delete an interview session
router.delete(
  '/:id',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER, SystemRoles.HR_RECRUITER]),
  deleteInterviewSession
);

export default router;
