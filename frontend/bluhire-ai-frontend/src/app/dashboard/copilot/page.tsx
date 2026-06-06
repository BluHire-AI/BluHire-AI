'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { copilotService, CopilotConversation, CopilotMessage, CopilotReport } from '@/services/copilot.service';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Bot, Sparkles, Send, Trash2, Download, Plus, Calendar, FileText, 
  HelpCircle, ChevronDown, ChevronUp, Terminal, User, Play, X, 
  Check, ShieldAlert, AlertTriangle, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// A simple utility to render markdown summaries (tables, headers, bullet points, bolding) beautifully
const renderMarkdown = (text: string) => {
  if (!text) return null;

  const lines = text.split('\n');
  const renderedElements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let tableRows: string[][] = [];
  let inTable = false;

  const flushList = (key: number) => {
    if (currentList.length > 0) {
      renderedElements.push(
        <ul key={`ul-${key}`} className="list-disc pl-5 my-2 space-y-1 text-xs text-zinc-700 dark:text-zinc-300">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const flushTable = (key: number) => {
    if (tableRows.length > 0) {
      const isHeaderSeparator = (row: string[]) => row.every(cell => cell.trim().startsWith('-') || cell.trim() === '');
      
      // Filter out separator row (e.g. |---|---|)
      const validRows = tableRows.filter(row => !isHeaderSeparator(row));
      if (validRows.length > 0) {
        const headerCells = validRows[0];
        const bodyRows = validRows.slice(1);

        renderedElements.push(
          <div key={`table-wrapper-${key}`} className="overflow-x-auto my-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-[11px]">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                <tr>
                  {headerCells.map((cell, idx) => (
                    <th key={`th-${idx}`} className="px-3 py-2 text-left font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      {cell.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#0e1422] divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {bodyRows.map((row, rIdx) => (
                  <tr key={`tr-${rIdx}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                    {row.map((cell, cIdx) => (
                      <td key={`td-${cIdx}`} className="px-3 py-2 text-zinc-700 dark:text-zinc-300 font-medium">
                        {cell.trim()}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // 1. Table Detection
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList(index);
      inTable = true;
      const cells = trimmed.split('|').slice(1, -1);
      tableRows.push(cells);
      return;
    } else if (inTable) {
      flushTable(index);
    }

    // 2. Headings
    if (trimmed.startsWith('### ')) {
      flushList(index);
      renderedElements.push(
        <h4 key={index} className="text-sm font-bold text-zinc-800 dark:text-zinc-100 mt-4 mb-2">
          {trimmed.substring(4)}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList(index);
      renderedElements.push(
        <h3 key={index} className="text-base font-bold text-violet-700 dark:text-violet-400 mt-5 mb-2 border-b border-zinc-100 dark:border-zinc-800/50 pb-1">
          {trimmed.substring(3)}
        </h3>
      );
      return;
    }

    // 3. Bullet Lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      currentList.push(
        <li key={`li-${index}`} className="leading-relaxed">
          {parseBoldText(content)}
        </li>
      );
      return;
    } else {
      flushList(index);
    }

    // 4. Empty lines
    if (trimmed === '') {
      renderedElements.push(<div key={`empty-${index}`} className="h-2" />);
      return;
    }

    // 5. Normal text paragraphs
    renderedElements.push(
      <p key={index} className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mb-1.5">
        {parseBoldText(line)}
      </p>
    );
  });

  // Flush any remaining lists or tables
  flushList(lines.length);
  flushTable(lines.length);

  return <div className="space-y-1">{renderedElements}</div>;
};

// Helper function to handle **bold** syntax inline
const parseBoldText = (text: string): React.ReactNode => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return <strong key={i} className="font-semibold text-zinc-900 dark:text-white">{part}</strong>;
    }
    return part;
  });
};

export default function CopilotPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<CopilotConversation[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [reports, setReports] = useState<CopilotReport[]>([]);
  
  // Chat input states
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedTokens, setStreamedTokens] = useState('');
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  
  // Tool inspection state (expanded tool details)
  const [expandedToolMsgId, setExpandedToolMsgId] = useState<Record<string, boolean>>({});

  // HITL (Human-in-the-loop) state
  const [pendingApproval, setPendingApproval] = useState<{
    tool: string;
    args: any;
    description: string;
  } | null>(null);

  // Suggested follow-ups
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);
  
  // Loading indicators
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchReports();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedTokens, isStreaming, currentStatus, pendingApproval]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const data = await copilotService.getConversations();
      setConversations(data || []);
    } catch (error) {
      console.error('Failed to load conversations history', error);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const data = await copilotService.getReports();
      setReports(data || []);
    } catch (error) {
      console.error('Failed to load reports', error);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSelectConversation = async (convId: string) => {
    if (isStreaming) return;
    setActiveSessionId(convId);
    setPendingApproval(null);
    setSuggestedFollowUps([]);
    setStreamedTokens('');
    setCurrentStatus(null);
    setLoadingHistory(true);

    try {
      const msgList = await copilotService.getMessages(convId);
      setMessages(msgList || []);
      
      // Look for a trailing pending write action that has not been executed yet
      if (msgList && msgList.length > 0) {
        const lastMsg = msgList[msgList.length - 1];
        if (lastMsg.role === 'assistant' && lastMsg.toolCalls && lastMsg.toolCalls.length > 0) {
          // Check if any write tool call is unresolved
          const writeCall = lastMsg.toolCalls.find((tc: any) => tc.function.name === 'createJob' || tc.function.name === 'generateWeeklyRecruitmentReport');
          if (writeCall) {
            // Verify if there is a following tool message for this call
            const toolMsg = msgList.find((m) => m.role === 'tool' && m.name === writeCall.function.name);
            if (!toolMsg) {
              let parsedArgs = {};
              try {
                parsedArgs = JSON.parse(writeCall.function.arguments || '{}');
              } catch (e) {}
              setPendingApproval({
                tool: writeCall.function.name,
                args: parsedArgs,
                description: writeCall.function.name === 'createJob' 
                  ? 'ACTION: Create a new job requisition post.' 
                  : 'ACTION: Generates and persists a weekly recruitment performance report.'
              });
            }
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load conversation message logs.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNewChat = () => {
    if (isStreaming) return;
    setActiveSessionId(null);
    setMessages([]);
    setPendingApproval(null);
    setSuggestedFollowUps([]);
    setStreamedTokens('');
    setCurrentStatus(null);
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isStreaming) return;
    if (!confirm('Are you sure you want to delete this chat session?')) return;

    try {
      await copilotService.deleteConversation(convId);
      toast.success('Conversation archived.');
      if (activeSessionId === convId) {
        handleNewChat();
      }
      fetchConversations();
    } catch (error) {
      toast.error('Failed to archive chat.');
    }
  };

  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved report?')) return;

    try {
      await copilotService.deleteReport(reportId);
      toast.success('Report deleted.');
      fetchReports();
    } catch (error) {
      toast.error('Failed to delete report.');
    }
  };

  const handleExportReport = async (reportId: string, format: 'csv' | 'pdf') => {
    try {
      toast.loading(`Downloading ${format.toUpperCase()} report...`, { id: 'report-dl' });
      await copilotService.downloadReport(reportId, format);
      toast.success('Download ready!', { id: 'report-dl' });
    } catch (error) {
      toast.error('Failed to download report file.', { id: 'report-dl' });
    }
  };

  // Submit main user prompt or suggest chip
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    
    // Clear input & set loading status
    setInputMessage('');
    setIsStreaming(true);
    setStreamedTokens('');
    setCurrentStatus('Routing query to AI service...');
    setPendingApproval(null);
    setSuggestedFollowUps([]);

    // Optimistically update messages local array if active conversation exists
    const mockUserMsg: CopilotMessage = {
      _id: `temp-user-${Date.now()}`,
      conversationId: activeSessionId || 'temp',
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, mockUserMsg]);

    try {
      await copilotService.chatStream(
        {
          message: text,
          conversationId: activeSessionId || undefined
        },
        (event) => {
          if (event.type === 'token') {
            setStreamedTokens(prev => prev + (event.content || ''));
            setCurrentStatus(null);
          } else if (event.type === 'status') {
            setCurrentStatus(event.content);
          } else if (event.type === 'approval_required') {
            setPendingApproval({
              tool: event.content.tool,
              args: event.content.args,
              description: event.content.description || ''
            });
            setIsStreaming(false);
          } else if (event.type === 'done') {
            // Set active session ID if this was a new conversation
            if (event.conversationId) {
              setActiveSessionId(event.conversationId);
              fetchConversations();
            }
            if (event.suggestedFollowUps) {
              setSuggestedFollowUps(event.suggestedFollowUps);
            }
            setIsStreaming(false);
            setCurrentStatus(null);
            fetchReports(); // Refresh reports catalog in case report tool was invoked
            
            // Reload message log to sync proper DB timestamps & object ids
            if (event.conversationId) {
              copilotService.getMessages(event.conversationId).then(list => setMessages(list || []));
            }
          } else if (event.type === 'error') {
            toast.error(event.content || 'Error occurred during streaming completion.');
            setIsStreaming(false);
            setCurrentStatus(null);
          }
        }
      );
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Streaming pipeline failed.');
      setIsStreaming(false);
      setCurrentStatus(null);
    }
  };

  // Human-in-the-loop Write Action execution trigger
  const handleConfirmAction = async () => {
    if (!pendingApproval || isStreaming) return;
    
    const action = pendingApproval;
    setPendingApproval(null); // Clear approval dialog state
    setIsStreaming(true);
    setStreamedTokens('');
    setCurrentStatus(`Executing approved action: ${action.tool}...`);

    try {
      await copilotService.chatStream(
        {
          conversationId: activeSessionId || undefined,
          confirmedAction: {
            tool: action.tool,
            args: action.args
          }
        },
        (event) => {
          if (event.type === 'token') {
            setStreamedTokens(prev => prev + (event.content || ''));
            setCurrentStatus(null);
          } else if (event.type === 'status') {
            setCurrentStatus(event.content);
          } else if (event.type === 'approval_required') {
            // Nested write triggers (unlikely, but fallback support)
            setPendingApproval({
              tool: event.content.tool,
              args: event.content.args,
              description: event.content.description || ''
            });
            setIsStreaming(false);
          } else if (event.type === 'done') {
            if (event.suggestedFollowUps) {
              setSuggestedFollowUps(event.suggestedFollowUps);
            }
            setIsStreaming(false);
            setCurrentStatus(null);
            fetchReports(); // Refresh saved reports list in case report was generated
            
            if (activeSessionId) {
              copilotService.getMessages(activeSessionId).then(list => setMessages(list || []));
            }
          } else if (event.type === 'error') {
            toast.error(event.content || 'Failed execution pipeline.');
            setIsStreaming(false);
            setCurrentStatus(null);
          }
        }
      );
    } catch (error: any) {
      toast.error(error.message || 'Action authorization failed.');
      setIsStreaming(false);
      setCurrentStatus(null);
    }
  };

  const handleCancelAction = () => {
    if (!pendingApproval) return;
    toast.info('Requisition execution cancelled.');
    setPendingApproval(null);
    
    // Append a mock cancellation message
    const cancelMsg: CopilotMessage = {
      _id: `temp-cancel-${Date.now()}`,
      conversationId: activeSessionId || 'temp',
      role: 'assistant',
      content: 'Write operation cancelled by the user. Let me know if you want to revise parameters or try something else.',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, cancelMsg]);
    setSuggestedFollowUps(['Create standard SWE job posting', 'Summarize active candidates', 'Generate week reports']);
  };

  const toggleToolDetails = (msgId: string) => {
    setExpandedToolMsgId(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Block employees from rendering copilot console (handled also on backend)
  if (user?.role === 'EMPLOYEE') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-white dark:bg-[#0e1422] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Access Denied</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-md">
          As an employee, you do not have permission to access the Executive AI Copilot. 
          Please contact your HR administrator if you require analytical reports or write access.
        </p>
      </div>
    );
  }

  // Pre-configured quick-query templates
  const quickQueries = [
    { label: "Joined Employees", text: "How many employees joined this month?", desc: "Get headcount metrics" },
    { label: "Screening Score > 80", text: "Show me candidates with AI score above 80", desc: "List top resume matches" },
    { label: "Hiring Rate Leaderboard", text: "Which department has the highest hiring rate?", desc: "Analyze department KPI" },
    { label: "Active Jobs Requisition", text: "Show all open jobs and listings", desc: "List vacancy requisitions" },
    { label: "Probation Scans", text: "List employees on probation", desc: "Track performance gates" },
    { label: "Weekly Analysis", text: "Generate weekly recruitment report", desc: "Save and download Q2 report" }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-10rem)] max-h-[850px] overflow-hidden select-none">
      
      {/* COLUMN 1: LEFT SIDEBAR (History & Reports) */}
      <div className="lg:col-span-3 bg-white dark:bg-[#0e1422] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 flex flex-col overflow-hidden shadow-sm">
        
        {/* Left Column Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
          <h3 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Sessions & Reports</h3>
          <Button onClick={handleNewChat} size="sm" variant="ghost" className="h-8 px-2 text-xs text-blue-600 dark:text-blue-400 gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg">
            <Plus className="w-3.5 h-3.5" /> New Chat
          </Button>
        </div>

        {/* Left Columns Tab sections */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Conversation history */}
          <div>
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2.5">
              <span>Chat Sessions History</span>
            </div>
            
            {conversations.length === 0 ? (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600 italic pl-1">No past chat history</p>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => {
                  const isActive = activeSessionId === conv._id;
                  return (
                    <div
                      key={conv._id}
                      onClick={() => handleSelectConversation(conv._id)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-250 ${
                        isActive
                          ? 'bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/20 text-zinc-600 dark:text-zinc-400 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2 w-[85%] overflow-hidden">
                        <Bot className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-500' : 'text-zinc-400'}`} />
                        <span className="text-xs truncate">{conv.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(conv._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Saved Reports catalog */}
          <div>
            <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2.5">
              <span>Saved Reports Catalog</span>
            </div>

            {loadingReports ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-600 italic pl-1">No reports generated yet</p>
            ) : (
              <div className="space-y-2.5">
                {reports.map((report) => (
                  <div key={report._id} className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-100 dark:border-zinc-850 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-1.5 overflow-hidden">
                        <FileText className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate" title={report.reportName}>
                          {report.reportName}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteReport(report._id, e)}
                        className="p-1 rounded text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center text-[9px] text-zinc-400">
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleExportReport(report._id, 'csv')}
                          className="px-1.5 py-0.5 rounded bg-zinc-200/70 hover:bg-zinc-300/80 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => handleExportReport(report._id, 'pdf')}
                          className="px-1.5 py-0.5 rounded bg-zinc-200/70 hover:bg-zinc-300/80 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-semibold cursor-pointer flex items-center gap-0.5"
                        >
                          HTML
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* COLUMN 2: CENTER AI CONSOLE CHAT WINDOW */}
      <div className="lg:col-span-6 bg-white dark:bg-[#0e1422] rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 flex flex-col overflow-hidden shadow-sm relative">
        
        {/* Console Header */}
        <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between bg-zinc-50/50 dark:bg-[#0e1422]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-600">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-850 dark:text-white flex items-center gap-1">
                HR Copilot Console <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              </div>
              <p className="text-[9px] text-zinc-400">Deep Mongoose-RAG querying with safeguards</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 capitalize">Role: {user?.role?.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {loadingHistory ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-2">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs text-zinc-500">Retrieving secure transcripts...</p>
            </div>
          ) : messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center text-center py-24 space-y-4 max-w-sm mx-auto">
              <Bot className="w-12 h-12 text-violet-500/20 bg-violet-500/5 p-2 rounded-2xl border border-violet-500/10" />
              <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">How can I assist your operations?</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Type queries to search records, map skill competencies, summarize interviews, or request write requisitions. 
                Write operations will require your authorization before committing.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                
                // A. Tool Logs
                if (msg.role === 'tool') {
                  const isExpanded = expandedToolMsgId[msg._id] || false;
                  let parsedContent: any = {};
                  try {
                    parsedContent = JSON.parse(msg.content);
                  } catch (e) {
                    parsedContent = { raw: msg.content };
                  }

                  const isError = parsedContent.error || parsedContent.success === false;

                  return (
                    <div key={msg._id} className="mx-2 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-850 p-2.5">
                      <div 
                        onClick={() => toggleToolDetails(msg._id)}
                        className="flex items-center justify-between text-[10px] font-mono cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                      >
                        <div className="flex items-center space-x-1.5">
                          <Layers className={`w-3.5 h-3.5 ${isError ? 'text-amber-500' : 'text-zinc-400'}`} />
                          <span className="font-semibold">Query Executed: {msg.name}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                            isError ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400'
                          }`}>
                            {isError ? 'WARNING' : 'SUCCESS'}
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 text-[10px] font-mono overflow-x-auto bg-zinc-100 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-800 max-h-40"
                          >
                            <pre className="text-zinc-600 dark:text-zinc-400">{JSON.stringify(parsedContent, null, 2)}</pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                // B. User/Assistant message bubbles
                const isUser = msg.role === 'user';
                return (
                  <div key={msg._id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start space-x-2.5 max-w-[85%]">
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-600 shrink-0 mt-0.5 border border-violet-500/10">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div className={`p-3.5 rounded-2xl shadow-sm text-xs leading-relaxed ${
                        isUser 
                          ? 'bg-blue-600 text-white rounded-tr-none' 
                          : 'bg-zinc-50 dark:bg-[#121929] text-zinc-800 dark:text-zinc-200 border border-zinc-150 dark:border-zinc-800/60 rounded-tl-none'
                      }`}>
                        {isUser ? msg.content : renderMarkdown(msg.content)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Streaming token rendering */}
          {isStreaming && streamedTokens && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2.5 max-w-[85%]">
                <div className="w-7 h-7 rounded-lg bg-violet-600/10 flex items-center justify-center text-violet-600 shrink-0 mt-0.5 border border-violet-500/10">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3.5 rounded-2xl shadow-sm text-xs bg-zinc-50 dark:bg-[#121929] text-zinc-800 dark:text-zinc-200 border border-zinc-150 dark:border-zinc-800/60 rounded-tl-none leading-relaxed">
                  {renderMarkdown(streamedTokens)}
                </div>
              </div>
            </div>
          )}

          {/* Current action status logs */}
          {isStreaming && currentStatus && (
            <div className="flex justify-start items-center space-x-2 text-[10px] font-mono text-zinc-400 pl-9">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
              <span>{currentStatus}</span>
            </div>
          )}

          {/* Human-in-the-loop Action confirmation card */}
          {pendingApproval && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="ml-9 p-4 bg-amber-500/5 border border-amber-500/25 rounded-2xl shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
              
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-3 flex-1">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      Write Action Confirmation Requested
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-1">{pendingApproval.description}</p>
                  </div>

                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-150 dark:border-zinc-850 text-[10px] font-mono">
                    <div className="font-semibold text-zinc-500 uppercase tracking-wider mb-1">Proposed Execution Parameters:</div>
                    <pre className="text-zinc-700 dark:text-zinc-300 max-h-36 overflow-y-auto">{JSON.stringify(pendingApproval.args, null, 2)}</pre>
                  </div>

                  <div className="flex items-center space-x-2.5 pt-1">
                    <Button
                      onClick={handleConfirmAction}
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg h-8 px-4 text-xs font-semibold"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" /> Confirm & Execute
                    </Button>
                    <Button
                      onClick={handleCancelAction}
                      size="sm"
                      variant="ghost"
                      className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-lg h-8 px-4 text-xs"
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* suggested follow-ups chips rendering */}
          {!isStreaming && !pendingApproval && suggestedFollowUps.length > 0 && (
            <div className="space-y-1.5 pl-9 pt-2">
              <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Suggested Queries:</div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedFollowUps.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-2.5 py-1.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 hover:bg-violet-100 dark:hover:bg-violet-950/45 border border-violet-100 dark:border-violet-900/40 rounded-xl transition-all cursor-pointer text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Console Input Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/20 flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
            disabled={isStreaming || !!pendingApproval}
            placeholder={
              pendingApproval 
                ? "Authorize write operations to unlock input..."
                : "Ask about recruitment, screening scores, department KPIs..."
            }
            className="flex-1 h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-xs rounded-xl"
          />
          <Button
            onClick={() => handleSendMessage(inputMessage)}
            disabled={isStreaming || !inputMessage.trim() || !!pendingApproval}
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

      </div>

      {/* COLUMN 3: RIGHT PANEL (Prompt Templates & Dynamic Insights) */}
      <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-1">
        
        {/* templates card */}
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/60 dark:border-zinc-800/80 shadow-sm rounded-2xl">
          <CardHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800/60">
            <CardTitle className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-500" /> Quick Inquiries
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-400">
              Click template prompts to query the Copilot engine
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            {quickQueries.map((q, idx) => (
              <div
                key={idx}
                onClick={() => handleSendMessage(q.text)}
                className="p-2.5 bg-zinc-50 dark:bg-zinc-900/30 hover:bg-violet-500/5 dark:hover:bg-violet-500/10 hover:border-violet-500/20 rounded-xl border border-zinc-100 dark:border-zinc-850 cursor-pointer transition-all flex justify-between items-center group"
              >
                <div>
                  <div className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {q.label}
                  </div>
                  <div className="text-[9px] text-zinc-400 mt-0.5">{q.desc}</div>
                </div>
                <Play className="w-3 h-3 text-zinc-400 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Dynamic Alerts / Platform Bottlenecks Center */}
        <Card className="bg-white dark:bg-[#0e1422] border-zinc-200/60 dark:border-zinc-800/80 shadow-sm rounded-2xl flex-1">
          <CardHeader className="p-4 border-b border-zinc-100 dark:border-zinc-800/60">
            <CardTitle className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Platform Insights
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-400">
              Real-time bottleneck scans & AI alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            
            <div className="flex gap-3">
              <div className="w-1.5 h-12 bg-amber-500 rounded-full shrink-0" />
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Bottleneck Detected</div>
                <p className="text-[9px] text-zinc-400 leading-normal">
                  Engineering department Time-to-Hire is 32 days (high). Average resume screening stage exceeds 8 business days.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-1.5 h-12 bg-blue-500 rounded-full shrink-0" />
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">AI Screening Surge</div>
                <p className="text-[9px] text-zinc-400 leading-normal">
                  12 candidates completed technical screening today. Average candidate score is 78.4%. 3 eligibility recommendations waiting.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-1.5 h-12 bg-emerald-500 rounded-full shrink-0" />
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide">Write Gate Safeties</div>
                <p className="text-[9px] text-zinc-400 leading-normal">
                  Safeguards enabled: Queries limited to 100 maximum records. Writing actions require Human-in-the-Loop confirms.
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

    </div>
  );
}
