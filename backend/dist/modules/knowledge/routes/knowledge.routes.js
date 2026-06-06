"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const knowledge_controller_1 = __importDefault(require("../controllers/knowledge.controller"));
const role_middleware_1 = require("../../../middlewares/role.middleware");
const roles_1 = require("../../../models/roles");
const router = (0, express_1.Router)();
// Ensure the uploads directory exists
const uploadDir = path_1.default.join(process.cwd(), 'uploads', 'documents');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Storage Configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});
// File Filter
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only PDF, TXT, and Word documents (.doc, .docx) are allowed.'));
    }
};
const upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
    },
});
// 1. Upload documents
router.post('/upload', (0, role_middleware_1.authorize)([roles_1.SystemRoles.MANAGEMENT_ADMIN, roles_1.SystemRoles.SENIOR_MANAGER]), upload.single('file'), knowledge_controller_1.default.uploadDocument);
// 2. List documents (all authenticated roles, filters in controller)
router.get('/documents', knowledge_controller_1.default.getDocuments);
// 3. Get single document metadata
router.get('/documents/:id', knowledge_controller_1.default.getDocumentById);
// 4. Update document metadata
router.patch('/documents/:id', (0, role_middleware_1.authorize)([roles_1.SystemRoles.MANAGEMENT_ADMIN, roles_1.SystemRoles.SENIOR_MANAGER]), knowledge_controller_1.default.updateDocument);
// 5. Delete document
router.delete('/documents/:id', (0, role_middleware_1.authorize)([roles_1.SystemRoles.MANAGEMENT_ADMIN, roles_1.SystemRoles.SENIOR_MANAGER]), knowledge_controller_1.default.deleteDocument);
// 6. Semantic search
router.post('/search', knowledge_controller_1.default.search);
// 7. Reindex document
router.post('/reindex', (0, role_middleware_1.authorize)([roles_1.SystemRoles.MANAGEMENT_ADMIN, roles_1.SystemRoles.SENIOR_MANAGER]), knowledge_controller_1.default.reindexDocument);
// 8. Analytics
router.get('/analytics', (0, role_middleware_1.authorize)([roles_1.SystemRoles.MANAGEMENT_ADMIN, roles_1.SystemRoles.SENIOR_MANAGER, roles_1.SystemRoles.HR_RECRUITER]), knowledge_controller_1.default.getAnalytics);
exports.default = router;
