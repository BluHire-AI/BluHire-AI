import Joi from 'joi';
import { SystemRoles } from '../models/roles';

export const registerSchema = Joi.object({
  firstName: Joi.string().required().min(2).max(50),
  lastName: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  employeeId: Joi.string().optional().allow('', null),
  password: Joi.string().min(8).required(),
  phone: Joi.string().optional().allow('', null),
  role: Joi.string().valid(SystemRoles.EMPLOYEE).optional(),
  department: Joi.string().optional().allow('', null),
  designation: Joi.string().optional().allow('', null),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const profileUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().allow('', null).optional(),
  department: Joi.string().allow('', null).optional(),
  designation: Joi.string().allow('', null).optional(),
  profileImage: Joi.string().allow('', null).optional(),
});

export const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  phone: Joi.string().allow('', null),
  department: Joi.string().allow('', null),
  designation: Joi.string().allow('', null),
  isActive: Joi.boolean(),
  role: Joi.string().valid(...Object.values(SystemRoles)),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});
