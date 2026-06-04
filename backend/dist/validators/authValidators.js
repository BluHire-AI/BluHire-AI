"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.userUpdateSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
const roles_1 = require("../models/roles");
exports.registerSchema = joi_1.default.object({
    firstName: joi_1.default.string().required().min(2).max(50),
    lastName: joi_1.default.string().required().min(2).max(50),
    email: joi_1.default.string().email().required(),
    employeeId: joi_1.default.string().required(),
    password: joi_1.default.string().min(8).required(),
    phone: joi_1.default.string().optional(),
    role: joi_1.default.string().valid(...Object.values(roles_1.SystemRoles)).optional(),
    department: joi_1.default.string().optional(),
    designation: joi_1.default.string().optional(),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required(),
});
exports.refreshTokenSchema = joi_1.default.object({
    refreshToken: joi_1.default.string().required(),
});
exports.userUpdateSchema = joi_1.default.object({
    firstName: joi_1.default.string().min(2).max(50),
    lastName: joi_1.default.string().min(2).max(50),
    phone: joi_1.default.string(),
    department: joi_1.default.string(),
    designation: joi_1.default.string(),
    isActive: joi_1.default.boolean(),
    role: joi_1.default.string().valid(...Object.values(roles_1.SystemRoles)),
});
exports.changePasswordSchema = joi_1.default.object({
    oldPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string().min(8).required(),
});
