import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const VIDEOS_DIR = path.join(UPLOADS_DIR, 'videos');
const TEMP_DIR = path.join(UPLOADS_DIR, 'temp');

// Ensure directories exist
[UPLOADS_DIR, VIDEOS_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure Multer storage for chunks
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store in temp directory for chunking
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    // We expect the client to send a unique identifier for the chunk/file
    // e.g., req.body.resumableIdentifier or req.body.fileId
    const fileId = req.body.fileId || Date.now().toString();
    const chunkIndex = req.body.chunkIndex || 0;
    cb(null, `${fileId}_${chunkIndex}`);
  }
});

// File filter for validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['video/webm', 'video/mp4'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.webm', '.mp4'];

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only webm and mp4 are allowed.'));
  }
};

export const uploadChunkMiddleware = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB chunk size limit
  },
  fileFilter
});
