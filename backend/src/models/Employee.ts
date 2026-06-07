import mongoose, { Schema, Document } from 'mongoose';

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  PROBATION = 'PROBATION',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
}

export interface IDocument {
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
}

export interface IEducation {
  institution: string;
  degree: string;
  field: string;
  graduationYear: number;
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateUrl?: string;
}

export interface IEmployee extends Document {
  _id: any;
  employeeCode: string;
  userId?: string; // Reference to User _id
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender?: string;
  dateOfBirth?: Date;
  departmentId: string; // Reference to Department _id
  designationId: string; // Reference to Designation _id
  managerId?: string; // Reference to Employee _id
  employmentType: EmploymentType;
  joiningDate: Date;
  experience?: number; // Years of experience
  skills?: string[];
  certifications?: ICertification[];
  education?: IEducation[];
  salaryGrade?: string;
  workLocation: string;
  shiftId?: string; // Reference to Shift _id
  employmentStatus: EmploymentStatus;
  profileImage?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  documents?: IDocument[];
  notes?: string;
  allowSelfCheckIn?: boolean;
  createdBy: string; // User _id who created this record
  updatedBy?: string; // User _id who last updated this record
  isDeleted: boolean; // Soft delete flag
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
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
  },
  { _id: false }
);

const EducationSchema = new Schema<IEducation>(
  {
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
  },
  { _id: false }
);

const CertificationSchema = new Schema<ICertification>(
  {
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
  },
  { _id: false }
);

const EmployeeSchema = new Schema<any>(
  {
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required'],
      index: true,
    },
    designationId: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation ID is required'],
      index: true,
    },
    managerId: {
      type: Schema.Types.ObjectId,
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
    shiftId: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
      default: null,
      index: true,
    },
    employmentStatus: {
      type: String,
      enum: Object.values(EmploymentStatus),
      default: EmploymentStatus.PROBATION,
      index: true,
    },
    allowSelfCheckIn: {
      type: Boolean,
      default: true,
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
EmployeeSchema.index({ employeeCode: 1, isDeleted: 1 });
EmployeeSchema.index({ departmentId: 1, isDeleted: 1 });
EmployeeSchema.index({ designationId: 1, isDeleted: 1 });
EmployeeSchema.index({ managerId: 1, isDeleted: 1 });
EmployeeSchema.index({ employmentStatus: 1, isDeleted: 1 });
EmployeeSchema.index({ employmentType: 1, isDeleted: 1 });
EmployeeSchema.index({ createdAt: -1, isDeleted: 1 });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
