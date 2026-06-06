import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface CopilotConversation {
  _id: string;
  title: string;
  sessionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CopilotMessage {
  _id: string;
  conversationId: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCalls?: any[];
  timestamp: string;
}

export interface CopilotReport {
  _id: string;
  reportName: string;
  reportType: string;
  createdAt: string;
  content?: any;
}

export const copilotService = {
  /**
   * SSE Chat Stream reader using standard fetch with Zustand authorization
   */
  chatStream: async (
    params: { message?: string; conversationId?: string; confirmedAction?: { tool: string; args: any } },
    onEvent: (event: { type: string; content?: any; conversationId?: string; suggestedFollowUps?: string[] }) => void
  ): Promise<void> => {
    const token = useAuthStore.getState().accessToken;
    
    const response = await fetch(`${API_URL}/copilot/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Chat stream failed with status ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    if (!reader) throw new Error('Could not initialize stream reader.');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          
          const rawJson = trimmed.substring(6);
          try {
            const data = JSON.parse(rawJson);
            onEvent(data);
          } catch (e) {
            // Ignore partial lines
          }
        }
      }
    } catch (err) {
      throw err;
    } finally {
      reader.releaseLock();
    }
  },

  getConversations: async (): Promise<CopilotConversation[]> => {
    const response = await api.get('/copilot/conversations');
    return response.data.data;
  },

  getMessages: async (conversationId: string): Promise<CopilotMessage[]> => {
    const response = await api.get(`/copilot/conversations/${conversationId}/messages`);
    return response.data.data;
  },

  deleteConversation: async (conversationId: string): Promise<void> => {
    await api.delete(`/copilot/conversations/${conversationId}`);
  },

  getReports: async (): Promise<CopilotReport[]> => {
    const response = await api.get('/copilot/reports');
    return response.data.data;
  },

  getReportDetails: async (reportId: string): Promise<CopilotReport> => {
    const response = await api.get(`/copilot/reports/${reportId}`);
    return response.data.data;
  },

  deleteReport: async (reportId: string): Promise<void> => {
    await api.delete(`/copilot/reports/${reportId}`);
  },

  /**
   * Export report helper triggering direct window download
   */
  downloadReport: async (reportId: string, format: 'csv' | 'pdf'): Promise<void> => {
    const response = await api.get(`/copilot/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob',
    });

    const ext = format === 'pdf' ? 'html' : 'csv';
    const filename = `hrminds_report_${reportId}_${new Date().toISOString().slice(0, 10)}.${ext}`;

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
};

export default copilotService;
