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
exports.EmployeeGoal = exports.GoalPriority = exports.GoalStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var GoalStatus;
(function (GoalStatus) {
    GoalStatus["NOT_STARTED"] = "NOT_STARTED";
    GoalStatus["IN_PROGRESS"] = "IN_PROGRESS";
    GoalStatus["COMPLETED"] = "COMPLETED";
    GoalStatus["OVERDUE"] = "OVERDUE";
})(GoalStatus || (exports.GoalStatus = GoalStatus = {}));
var GoalPriority;
(function (GoalPriority) {
    GoalPriority["LOW"] = "LOW";
    GoalPriority["MEDIUM"] = "MEDIUM";
    GoalPriority["HIGH"] = "HIGH";
})(GoalPriority || (exports.GoalPriority = GoalPriority = {}));
const employeeGoalSchema = new mongoose_1.Schema({
    goalCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        index: true
    },
    employeeId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        default: 'General',
        trim: true
    },
    priority: {
        type: String,
        enum: Object.values(GoalPriority),
        default: GoalPriority.MEDIUM,
        index: true
    },
    targetDate: {
        type: Date,
        required: true
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    weightage: {
        type: Number,
        default: 100,
        min: 1,
        max: 100
    },
    status: {
        type: String,
        enum: Object.values(GoalStatus),
        default: GoalStatus.NOT_STARTED,
        index: true
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});
exports.EmployeeGoal = mongoose_1.default.models.EmployeeGoal ||
    mongoose_1.default.model('EmployeeGoal', employeeGoalSchema);
