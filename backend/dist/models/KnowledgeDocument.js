"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionStatus = exports.DocumentType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var DocumentType;
(function (DocumentType) {
    DocumentType["POLICY"] = "POLICY";
    DocumentType["HANDBOOK"] = "HANDBOOK";
    DocumentType["SOP"] = "SOP";
    DocumentType["TRAINING"] = "TRAINING";
    DocumentType["BENEFITS"] = "BENEFITS";
    DocumentType["LEAVE"] = "LEAVE";
    DocumentType["PAYROLL"] = "PAYROLL";
    DocumentType["COMPLIANCE"] = "COMPLIANCE";
    DocumentType["OTHER"] = "OTHER";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var IngestionStatus;
(function (IngestionStatus) {
    IngestionStatus["UPLOADING"] = "UPLOADING";
    IngestionStatus["PROCESSING"] = "PROCESSING";
    IngestionStatus["INDEXING"] = "INDEXING";
    IngestionStatus["INDEXED"] = "INDEXED";
    IngestionStatus["READY"] = "READY";
    IngestionStatus["FAILED"] = "FAILED";
})(IngestionStatus || (exports.IngestionStatus = IngestionStatus = {}));
const KnowledgeDocumentSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Document title is required'],
        trim: true
    },
    fileName: {
        type: String,
        required: [true, 'File name is required']
    },
    documentType: {
        type: String,
        enum: Object.values(DocumentType),
        required: [true, 'Document type is required']
    },
    uploadedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filePath: {
        type: String,
        required: [true, 'File path is required']
    },
    fileSize: {
        type: Number,
        required: [true, 'File size is required']
    },
    status: {
        type: String,
        enum: Object.values(IngestionStatus),
        default: IngestionStatus.PROCESSING
    },
    chunkCount: {
        type: Number,
        default: 0
    },
    isApprovedForEmployees: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
KnowledgeDocumentSchema.index({ status: 1, documentType: 1 });
KnowledgeDocumentSchema.index({ isApprovedForEmployees: 1 });
exports.default = mongoose_1.default.model('KnowledgeDocument', KnowledgeDocumentSchema);
