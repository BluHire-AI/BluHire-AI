"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.employeeActivityController = exports.EmployeeActivityController = exports.designationController = exports.DesignationController = exports.departmentController = exports.DepartmentController = exports.employeeController = exports.EmployeeController = void 0;
var employee_controller_1 = require("./employee.controller");
Object.defineProperty(exports, "EmployeeController", { enumerable: true, get: function () { return employee_controller_1.EmployeeController; } });
Object.defineProperty(exports, "employeeController", { enumerable: true, get: function () { return __importDefault(employee_controller_1).default; } });
var department_controller_1 = require("./department.controller");
Object.defineProperty(exports, "DepartmentController", { enumerable: true, get: function () { return department_controller_1.DepartmentController; } });
Object.defineProperty(exports, "departmentController", { enumerable: true, get: function () { return __importDefault(department_controller_1).default; } });
var designation_controller_1 = require("./designation.controller");
Object.defineProperty(exports, "DesignationController", { enumerable: true, get: function () { return designation_controller_1.DesignationController; } });
Object.defineProperty(exports, "designationController", { enumerable: true, get: function () { return __importDefault(designation_controller_1).default; } });
var employee_activity_controller_1 = require("./employee-activity.controller");
Object.defineProperty(exports, "EmployeeActivityController", { enumerable: true, get: function () { return employee_activity_controller_1.EmployeeActivityController; } });
Object.defineProperty(exports, "employeeActivityController", { enumerable: true, get: function () { return __importDefault(employee_activity_controller_1).default; } });
