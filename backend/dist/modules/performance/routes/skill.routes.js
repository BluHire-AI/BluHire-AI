"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const skill_controller_1 = require("../controllers/skill.controller");
const router = (0, express_1.Router)();
router.post('/', skill_controller_1.skillController.assess);
router.get('/', skill_controller_1.skillController.getList);
router.get('/insights/:employeeId', skill_controller_1.skillController.getInsights);
exports.default = router;
