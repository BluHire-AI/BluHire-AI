import { Router } from 'express';
import copilotController from './copilot.controller';

const router = Router();

// Streaming Chat
router.post('/chat', (req, res) => copilotController.chatStream(req, res));

// Conversations Management
router.get('/conversations', (req, res) => copilotController.getConversations(req, res));
router.get('/conversations/:conversationId/messages', (req, res) => copilotController.getMessages(req, res));
router.delete('/conversations/:conversationId', (req, res) => copilotController.deleteConversation(req, res));

// Saved Reports Management
router.get('/reports', (req, res) => copilotController.getReports(req, res));
router.get('/reports/:reportId', (req, res) => copilotController.getReportDetails(req, res));
router.get('/reports/:reportId/export', (req, res) => copilotController.exportReport(req, res));

// Simple delete route for reports directly in route wrapper
router.delete('/reports/:reportId', async (req: any, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user._id;
    const CopilotReport = (await import('../../models/CopilotReport')).CopilotReport;

    const report = await CopilotReport.findOneAndDelete({ _id: reportId, generatedBy: userId });
    if (!report) {
      res.status(404).json({ success: false, message: 'Report not found' });
      return;
    }
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete report' });
  }
});

export default router;
