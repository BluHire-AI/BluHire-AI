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
exports.EmploymentType = exports.EmploymentStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var EmploymentStatus;
(function (EmploymentStatus) {
    EmploymentStatus["ACTIVE"] = "ACTIVE";
    EmploymentStatus["ON_LEAVE"] = "ON_LEAVE";
    EmploymentStatus["PROBATION"] = "PROBATION";
    EmploymentStatus["RESIGNED"] = "RESIGNED";
    EmploymentStatus["TERMINATED"] = "TERMINATED";
})(EmploymentStatus || (exports.EmploymentStatus = EmploymentStatus = {}));
var EmploymentType;
(function (EmploymentType) {
    EmploymentType["FULL_TIME"] = "FULL_TIME";
    EmploymentType["PART_TIME"] = "PART_TIME";
    EmploymentType["CONTRACT"] = "CONTRACT";
    EmploymentType["INTERN"] = "INTERN";
})(EmploymentType || (exports.EmploymentType = EmploymentType = {}));
const DocumentSchema = new mongoose_1.Schema({
    fileName: {
        type: String,
        required: true,
        trim: true,
    },
    fileType: {
        type: String,
        required: true,
        enum: ['pdf', 'doc', 'docx', 'jpg', 'png', 'jpeg'],
    },
    fileUrl: {
        type: String,
        required: true,
    },
    uploadedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });
const EducationSchema = new mongoose_1.Schema({
    institution: {
        type: String,
        required: true,
        trim: true,
    },
    degree: {
        type: String,
        required: true,
        trim: true,
    },
    field: {
        type: String,
        required: true,
        trim: true,
    },
    graduationYear: {
        type: Number,
        required: true,
    },
}, { _id: false });
const CertificationSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    issuer: {
        type: String,
        required: true,
        trim: true,
    },
    issueDate: {
        type: Date,
        required: true,
    },
    expiryDate: {
        type: Date,
        default: null,
    },
    certificateUrl: {
        type: String,
        default: null,
    },
}, { _id: false });
const EmployeeSchema = new mongoose_1.Schema({
    employeeCode: {
        type: String,
        required: [true, 'Employee code is required'],
        unique: true,
        trim: true,
        uppercase: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        index: true,
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'Please provide a valid email',
        ],
        index: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [
            /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
            'Please provide a valid phone number',
        ],
    },
    gender: {
        type: String,
        enum: ['MALE', 'FEMALE', 'OTHER'],
        default: null,
    },
    dateOfBirth: {
        type: Date,
        default: null,
    },
    departmentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department ID is required'],
        index: true,
    },
    designationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Designation',
        required: [true, 'Designation ID is required'],
        index: true,
    },
    managerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null,
        index: true,
    },
    employmentType: {
        type: String,
        enum: Object.values(EmploymentType),
        required: [true, 'Employment type is required'],
        default: EmploymentType.FULL_TIME,
    },
    joiningDate: {
        type: Date,
        required: [true, 'Joining date is required'],
        index: true,
    },
    experience: {
        type: Number,
        default: 0,
    },
    skills: {
        type: [String],
        default: [],
    },
    certifications: {
        type: [CertificationSchema],
        default: [],
    },
    education: {
        type: [EducationSchema],
        default: [],
    },
    salaryGrade: {
        type: String,
        default: null,
    },
    workLocation: {
        type: String,
        required: [true, 'Work location is required'],
        trim: true,
    },
    employmentStatus: {
        type: String,
        enum: Object.values(EmploymentStatus),
        default: EmploymentStatus.PROBATION,
        index: true,
    },
    profileImage: {
        type: String,
        default: null,
    },
    emergencyContact: {
        name: String,
        phone: String,
        relationship: String,
    },
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
    },
    documents: {
        type: [DocumentSchema],
        default: [],
    },
    notes: {
        type: String,
        default: null,
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true,
    },
}, {
    timestamps: true,
});
// Indexes for common queries
EmployeeSchema.index({ employeeCode: 1, isDeleted: 1 });
EmployeeSchema.index({ departmentId: 1, isDeleted: 1 });
EmployeeSchema.index({ designationId: 1, isDeleted: 1 });
EmployeeSchema.index({ managerId: 1, isDeleted: 1 });
EmployeeSchema.index({ employmentStatus: 1, isDeleted: 1 });
EmployeeSchema.index({ employmentType: 1, isDeleted: 1 });
EmployeeSchema.index({ createdAt: -1, isDeleted: 1 });
exports.default = mongoose_1.default.model('Employee', EmployeeSchema);
