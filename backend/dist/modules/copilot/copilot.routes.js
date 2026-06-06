"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const copilot_controller_1 = __importDefault(require("./copilot.controller"));
const router = (0, express_1.Router)();
// Streaming Chat
router.post('/chat', (req, res) => copilot_controller_1.default.chatStream(req, res));
// Conversations Management
router.get('/conversations', (req, res) => copilot_controller_1.default.getConversations(req, res));
router.get('/conversations/:conversationId/messages', (req, res) => copilot_controller_1.default.getMessages(req, res));
router.delete('/conversations/:conversationId', (req, res) => copilot_controller_1.default.deleteConversation(req, res));
// Saved Reports Management
router.get('/reports', (req, res) => copilot_controller_1.default.getReports(req, res));
router.get('/reports/:reportId', (req, res) => copilot_controller_1.default.getReportDetails(req, res));
router.get('/reports/:reportId/export', (req, res) => copilot_controller_1.default.exportReport(req, res));
// Simple delete route for reports directly in route wrapper
router.delete('/reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const userId = req.user._id;
        const CopilotReport = (await Promise.resolve().then(() => __importStar(require('../../models/CopilotReport')))).CopilotReport;
        const report = await CopilotReport.findOneAndDelete({ _id: reportId, generatedBy: userId });
        if (!report) {
            res.status(404).json({ success: false, message: 'Report not found' });
            return;
        }
        res.json({ success: true, message: 'Report deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to delete report' });
    }
});
exports.default = router;
