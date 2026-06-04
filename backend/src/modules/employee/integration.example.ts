/**
 * Employee Module Integration Guide
 * 
 * This file shows how to integrate the Employee Management module into your Express application.
 */

// Example: app.ts or main.ts

import express, { Express } from 'express';
import { employeeRoutes, attachPermissions } from './index';

// Assuming you have auth middleware somewhere
// import { authMiddleware } from './middlewares/auth.middleware';

/**
 * Setup Employee Module Routes
 */
export function setupEmployeeModule(app: Express): void {
  /**
   * Apply authentication middleware to all employee routes
   * Ensure user context (user._id, user.role) is attached to request
   */
  
  // Example middleware stack for employee routes:
  app.use('/api/v1', 
    // Your auth middleware - must attach user to req.user
    // authMiddleware,
    
    // Employee module routes with RBAC
    employeeRoutes
  );
}

/**
 * Middleware Stack Order (important):
 * 
 * 1. Authentication Middleware
 *    - Verifies JWT/token
 *    - Attaches user object: req.user = { _id, email, role }
 *    - Must happen before RBAC checks
 * 
 * 2. Employee Module Routes (with built-in RBAC)
 *    - All routes have permission checks
 *    - Validates request data using Zod schemas
 *    - Handles all business logic
 */

/**
 * Example: Complete middleware setup
 */
export function setupCompleteMiddleware(app: Express): void {
  // Parse JSON
  app.use(express.json());
  
  // Your authentication middleware here
  // app.use(authMiddleware);
  
  // Setup employee module
  setupEmployeeModule(app);
}

/**
 * User Object Structure Required
 * 
 * The auth middleware must attach a user object to the request:
 * 
 * req.user = {
 *   _id: "user-mongodb-id",
 *   email: "user@example.com",
 *   role: "MANAGEMENT_ADMIN" | "SENIOR_MANAGER" | "HR_RECRUITER" | "EMPLOYEE"
 * }
 */

/**
 * Available Roles
 * 
 * - MANAGEMENT_ADMIN: Full access to all operations
 * - SENIOR_MANAGER: Can view employees and manage their team
 * - HR_RECRUITER: Can create and update employee records
 * - EMPLOYEE: Can view own profile and company directory
 */

/**
 * Testing the Integration
 * 
 * 1. Start your server
 * 2. Make authenticated requests to /api/v1/employees, /api/v1/departments, etc.
 * 3. Include Authorization header: Bearer <token>
 * 4. Include user role in token payload
 */

/**
 * API Response Format
 * 
 * All responses follow a consistent format:
 * 
 * Success (200):
 * {
 *   "success": true,
 *   "message": "Operation successful",
 *   "data": { ... },
 *   "statusCode": 200
 * }
 * 
 * Error (400/401/403/404/500):
 * {
 *   "success": false,
 *   "message": "Error description",
 *   "error": "Detailed error or validation errors",
 *   "statusCode": 400
 * }
 */

/**
 * Key Features
 * 
 * ✅ Role-Based Access Control (RBAC)
 * ✅ Data Validation (Zod schemas)
 * ✅ Pagination Support
 * ✅ Advanced Filtering & Search
 * ✅ Activity Timeline Tracking
 * ✅ Organization Hierarchy Management
 * ✅ Bulk Operations
 * ✅ Soft Delete Support
 * ✅ Audit Trail (createdBy, updatedBy)
 * ✅ Error Handling & Validation Messages
 */

export default setupCompleteMiddleware;
