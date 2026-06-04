import Joi from 'joi';
import { SystemRoles } from '../models/roles';

export const registerSchema = Joi.object({
  firstName: Joi.string().required().min(2).max(50),
  lastName: Joi.string().required().min(2).max(50),
  email: Joi.string().email().required(),
  employeeId: Joi.string().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid(...Object.values(SystemRoles)).optional(),
  department: Joi.string().optional(),
  designation: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  phone: Joi.string(),
  department: Joi.string(),
  designation: Joi.string(),
  isActive: Joi.boolean(),
  role: Joi.string().valid(...Object.values(SystemRoles)),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});
