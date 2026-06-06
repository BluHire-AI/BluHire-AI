"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const review_routes_1 = __importDefault(require("./review.routes"));
const goal_routes_1 = __importDefault(require("./goal.routes"));
const skill_routes_1 = __importDefault(require("./skill.routes"));
const promotion_routes_1 = __importDefault(require("./promotion.routes"));
const analytics_routes_1 = __importDefault(require("./analytics.routes"));
const intelligence_controller_1 = require("../controllers/intelligence.controller");
const router = (0, express_1.Router)();
router.use('/reviews', review_routes_1.default);
router.use('/goals', goal_routes_1.default);
router.use('/skills', skill_routes_1.default);
router.use('/promotions', promotion_routes_1.default);
router.use('/analytics', analytics_routes_1.default);
// Intelligence Pack Routes
router.get('/trends/:employeeId', intelligence_controller_1.intelligenceController.getTrends);
router.get('/risk', intelligence_controller_1.intelligenceController.getRisk);
router.get('/learning-plan/:employeeId', intelligence_controller_1.intelligenceController.getLearningPlan);
router.get('/calibration', intelligence_controller_1.intelligenceController.getCalibration);
router.get('/succession', intelligence_controller_1.intelligenceController.getSuccession);
exports.default = router;
