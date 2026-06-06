"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promotion_controller_1 = require("../controllers/promotion.controller");
const router = (0, express_1.Router)();
router.post('/evaluate/:employeeId', promotion_controller_1.promotionController.evaluate);
router.get('/', promotion_controller_1.promotionController.getList);
router.get('/employee/:employeeId', promotion_controller_1.promotionController.getByEmployeeId);
exports.default = router;
