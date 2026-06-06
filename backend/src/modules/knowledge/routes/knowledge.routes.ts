import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import knowledgeController from '../controllers/knowledge.controller';
import { authorize } from '../../../middlewares/role.middleware';
import { SystemRoles } from '../../../models/roles';

const router = Router();

// Ensure the uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File Filter
const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, TXT, and Word documents (.doc, .docx) are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
});

// 1. Upload documents
router.post(
  '/upload',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER]),
  upload.single('file'),
  knowledgeController.uploadDocument
);

// 2. List documents (all authenticated roles, filters in controller)
router.get(
  '/documents',
  knowledgeController.getDocuments
);

// 3. Get single document metadata
router.get(
  '/documents/:id',
  knowledgeController.getDocumentById
);

// 4. Update document metadata
router.patch(
  '/documents/:id',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER]),
  knowledgeController.updateDocument
);

// 5. Delete document
router.delete(
  '/documents/:id',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER]),
  knowledgeController.deleteDocument
);

// 6. Semantic search
router.post(
  '/search',
  knowledgeController.search
);

// 7. Reindex document
router.post(
  '/reindex',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER]),
  knowledgeController.reindexDocument
);

// 8. Analytics
router.get(
  '/analytics',
  authorize([SystemRoles.MANAGEMENT_ADMIN, SystemRoles.SENIOR_MANAGER, SystemRoles.HR_RECRUITER]),
  knowledgeController.getAnalytics
);

export default router;
