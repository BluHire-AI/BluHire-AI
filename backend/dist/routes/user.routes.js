"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const role_middleware_1 = require("../middlewares/role.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const authValidators_1 = require("../validators/authValidators");
const roles_1 = require("../models/roles");
const router = (0, express_1.Router)();
// Apply auth middleware to all user routes
router.use(auth_middleware_1.authenticate);
// Profile routes
router.get('/me', user_controller_1.userController.getMe);
router.put('/me', (0, validate_middleware_1.validateRequest)(authValidators_1.userUpdateSchema), user_controller_1.userController.updateMe);
// Admin / HR Management routes
router.get('/', (0, role_middleware_1.authorize)([roles_1.SystemRoles.MANAGEMENT_ADMIN, roles_1.SystemRoles.SENIOR_MANAGER, roles_1.SystemRoles.HR_RECRUITER]), user_controller_1.userController.listUsers);
router.get('/:id', (0, role_middleware_1.authorize)([roles_1.SystemRoles.MANAGEMENT_ADMIN, roles_1.SystemRoles.SENIOR_MANAGER, roles_1.SystemRoles.HR_RECRUITER]), user_controller_1.userController.getUser);
// CRUD for Admin
router.put('/:id', (0, role_middleware_1.authorize)([roles_1.SystemRoles.MANAGEMENT_ADMIN]), (0, validate_middleware_1.validateRequest)(authValidators_1.userUpdateSchema), user_controller_1.userController.updateUser);
router.delete('/:id', (0, role_middleware_1.authorize)([roles_1.SystemRoles.MANAGEMENT_ADMIN]), user_controller_1.userController.deleteUser);
exports.default = router;
