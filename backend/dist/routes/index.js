"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const user_routes_1 = __importDefault(require("./user.routes"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const employee_1 = require("../modules/employee");
const recruitment_1 = require("../modules/recruitment");
const apiRouter = (0, express_1.Router)();
apiRouter.use('/auth', auth_routes_1.default);
apiRouter.use('/users', user_routes_1.default);
apiRouter.use('/public/recruitment', recruitment_1.publicRecruitmentRouter);
apiRouter.use('/recruitment', auth_middleware_1.authenticate, recruitment_1.adminRecruitmentRouter);
apiRouter.use('/', auth_middleware_1.authenticate, employee_1.employeeRoutes);
exports.default = apiRouter;
