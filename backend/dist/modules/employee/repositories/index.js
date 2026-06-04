"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeActivityRepository = exports.EmployeeActivityRepository = exports.designationRepository = exports.DesignationRepository = exports.departmentRepository = exports.DepartmentRepository = exports.employeeRepository = exports.EmployeeRepository = void 0;
var employee_repository_1 = require("./employee.repository");
Object.defineProperty(exports, "EmployeeRepository", { enumerable: true, get: function () { return employee_repository_1.EmployeeRepository; } });
Object.defineProperty(exports, "employeeRepository", { enumerable: true, get: function () { return __importDefault(employee_repository_1).default; } });
var department_repository_1 = require("./department.repository");
Object.defineProperty(exports, "DepartmentRepository", { enumerable: true, get: function () { return department_repository_1.DepartmentRepository; } });
Object.defineProperty(exports, "departmentRepository", { enumerable: true, get: function () { return __importDefault(department_repository_1).default; } });
var designation_repository_1 = require("./designation.repository");
Object.defineProperty(exports, "DesignationRepository", { enumerable: true, get: function () { return designation_repository_1.DesignationRepository; } });
Object.defineProperty(exports, "designationRepository", { enumerable: true, get: function () { return __importDefault(designation_repository_1).default; } });
var employee_activity_repository_1 = require("./employee-activity.repository");
Object.defineProperty(exports, "EmployeeActivityRepository", { enumerable: true, get: function () { return employee_activity_repository_1.EmployeeActivityRepository; } });
Object.defineProperty(exports, "employeeActivityRepository", { enumerable: true, get: function () { return __importDefault(employee_activity_repository_1).default; } });
