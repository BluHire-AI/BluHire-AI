"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeActivityService = exports.EmployeeActivityService = exports.designationService = exports.DesignationService = exports.departmentService = exports.DepartmentService = exports.employeeService = exports.EmployeeService = void 0;
var employee_service_1 = require("./employee.service");
Object.defineProperty(exports, "EmployeeService", { enumerable: true, get: function () { return employee_service_1.EmployeeService; } });
Object.defineProperty(exports, "employeeService", { enumerable: true, get: function () { return __importDefault(employee_service_1).default; } });
var department_service_1 = require("./department.service");
Object.defineProperty(exports, "DepartmentService", { enumerable: true, get: function () { return department_service_1.DepartmentService; } });
Object.defineProperty(exports, "departmentService", { enumerable: true, get: function () { return __importDefault(department_service_1).default; } });
var designation_service_1 = require("./designation.service");
Object.defineProperty(exports, "DesignationService", { enumerable: true, get: function () { return designation_service_1.DesignationService; } });
Object.defineProperty(exports, "designationService", { enumerable: true, get: function () { return __importDefault(designation_service_1).default; } });
var employee_activity_service_1 = require("./employee-activity.service");
Object.defineProperty(exports, "EmployeeActivityService", { enumerable: true, get: function () { return employee_activity_service_1.EmployeeActivityService; } });
Object.defineProperty(exports, "employeeActivityService", { enumerable: true, get: function () { return __importDefault(employee_activity_service_1).default; } });
