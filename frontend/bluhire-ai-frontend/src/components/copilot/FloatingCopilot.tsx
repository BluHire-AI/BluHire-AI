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

export function FloatingCopilot() {
  const { user, isAuthenticated } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
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
    if (isAuthenticated && user) {
      fetchConversations();
      fetchReports();
    }
  }, [isAuthenticated, user]);

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

  // Block employees from rendering copilot console
  if (user?.role === 'EMPLOYEE') {
    return null;
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
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center z-40 transition-transform hover:scale-105"
      >
        <Sparkles className="w-6 h-6" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-50"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-[95vw] lg:w-[1000px] bg-white/95 dark:bg-[#070b13]/95 backdrop-blur-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-[#0e1422]/50">
                <h2 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                  <Sparkles className="w-5 h-5 text-violet-500" /> Executive HR Copilot
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-zinc-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-full">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                
                {/* LEFT SIDEBAR (History & Reports) */}
                <div className="w-72 border-r border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col overflow-hidden shrink-0">
                  <div className="p-3 border-b border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                    <h3 className="font-bold text-[10px] text-zinc-500 uppercase tracking-wider">Sessions</h3>
                    <Button onClick={handleNewChat} size="sm" variant="ghost" className="h-7 px-2 text-[10px] text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg">
                      <Plus className="w-3 h-3 mr-1" /> New Chat
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-4">
                    {/* Chat Sessions History */}
                    <div>
                      {conversations.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 italic">No past chat history</p>
                      ) : (
                        <div className="space-y-1">
                          {conversations.map((conv) => {
                            const isActive = activeSessionId === conv._id;
                            return (
                              <div
                                key={conv._id}
                                onClick={() => handleSelectConversation(conv._id)}
                                className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-200 ${
                                  isActive
                                    ? 'bg-violet-500/10 text-violet-700 dark:text-violet-300 font-semibold'
                                    : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/40 text-zinc-600 dark:text-zinc-400'
                                }`}
                              >
                                <div className="flex items-center space-x-2 w-[85%] overflow-hidden">
                                  <Bot className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-violet-500' : 'text-zinc-400'}`} />
                                  <span className="text-[11px] truncate">{conv.title}</span>
                                </div>
                                <button
                                  onClick={(e) => handleDeleteConversation(conv._id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-red-500 transition-opacity"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="h-px bg-zinc-200/50 dark:bg-zinc-800/50" />

                    {/* Saved Reports */}
                    <div>
                      <div className="flex items-center text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                        <span>Saved Reports</span>
                      </div>
                      {loadingReports ? (
                        <div className="flex justify-center py-2"><RefreshCw className="w-3.5 h-3.5 text-violet-500 animate-spin" /></div>
                      ) : reports.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 italic">No reports generated</p>
                      ) : (
                        <div className="space-y-2">
                          {reports.map((report) => (
                            <div key={report._id} className="p-2.5 bg-white/50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-1.5 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-1.5 overflow-hidden">
                                  <FileText className="w-3 h-3 text-indigo-500 mt-0.5 shrink-0" />
                                  <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 truncate" title={report.reportName}>{report.reportName}</span>
                                </div>
                                <button onClick={(e) => handleDeleteReport(report._id, e)} className="text-zinc-400 hover:text-red-500">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="flex justify-between items-center text-[9px] text-zinc-400">
                                <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                <div className="flex space-x-1">
                                  <button onClick={() => handleExportReport(report._id, 'csv')} className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 font-semibold">CSV</button>
                                  <button onClick={() => handleExportReport(report._id, 'pdf')} className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-600 font-semibold">HTML</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* MAIN CHAT AREA */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white/30 dark:bg-[#070b13]/30">
                  
                  {/* Chat Messages Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {loadingHistory ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-3 text-violet-500">
                        <RefreshCw className="w-6 h-6 animate-spin" />
                        <p className="text-xs text-zinc-500">Loading transcript...</p>
                      </div>
                    ) : messages.length === 0 && !isStreaming ? (
                      // EMPTY STATE: Show quick prompts and insights inside the chat view
                      <div className="flex flex-col items-center justify-center min-h-full py-10 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center space-y-3">
                          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center mx-auto shadow-sm">
                            <Sparkles className="w-8 h-8 text-violet-600" />
                          </div>
                          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">How can I help you today?</h3>
                          <p className="text-sm text-zinc-500 max-w-md mx-auto">
                            I can analyze recruitment metrics, screen candidates, map skills, or generate weekly reports.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 w-full">
                          {quickQueries.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendMessage(q.text)}
                              className="p-3 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 text-left transition-all group shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500/50"
                            >
                              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-violet-600 transition-colors">{q.label}</div>
                              <div className="text-[10px] text-zinc-500 mt-1">{q.desc}</div>
                            </button>
                          ))}
                        </div>

                        <div className="w-full mt-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 text-left flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Platform Insight Alert</div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">Engineering department Time-to-Hire is currently 32 days (High). Try asking: "Generate a recruitment analysis report for Engineering".</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // ACTIVE CHAT STATE
                      <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.map((msg) => {
                          if (msg.role === 'tool') {
                            const isExpanded = expandedToolMsgId[msg._id] || false;
                            let parsedContent: any = {};
                            try { parsedContent = JSON.parse(msg.content); } catch (e) { parsedContent = { raw: msg.content }; }
                            const isError = parsedContent.error || parsedContent.success === false;

                            return (
                              <div key={msg._id} className="mx-2 bg-zinc-50/80 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 shadow-sm max-w-[85%]">
                                <div onClick={() => toggleToolDetails(msg._id)} className="flex items-center justify-between text-[11px] font-mono cursor-pointer text-zinc-500 dark:text-zinc-400">
                                  <div className="flex items-center space-x-2">
                                    <Layers className={`w-4 h-4 ${isError ? 'text-amber-500' : 'text-zinc-400'}`} />
                                    <span className="font-semibold">Query Executed: {msg.name}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isError ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                      {isError ? 'WARNING' : 'SUCCESS'}
                                    </span>
                                  </div>
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 text-[10px] font-mono overflow-x-auto bg-white dark:bg-black/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 max-h-60">
                                      <pre className="text-zinc-600 dark:text-zinc-400">{JSON.stringify(parsedContent, null, 2)}</pre>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          }

                          const isUser = msg.role === 'user';
                          return (
                            <div key={msg._id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                              <div className="flex items-start space-x-3 max-w-[85%]">
                                {!isUser && (
                                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 shrink-0 mt-1 shadow-sm">
                                    <Sparkles className="w-4 h-4" />
                                  </div>
                                )}
                                <div className={`p-4 rounded-2xl shadow-sm text-[13px] leading-relaxed ${
                                  isUser 
                                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-sm' 
                                    : 'bg-white dark:bg-[#121929] text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800/60 rounded-tl-sm'
                                }`}>
                                  {isUser ? msg.content : renderMarkdown(msg.content)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                        {isStreaming && streamedTokens && (
                          <div className="flex justify-start">
                            <div className="flex items-start space-x-3 max-w-[85%]">
                              <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center text-violet-600 shrink-0 mt-1 shadow-sm">
                                <Sparkles className="w-4 h-4" />
                              </div>
                              <div className="p-4 rounded-2xl shadow-sm text-[13px] leading-relaxed bg-white dark:bg-[#121929] text-zinc-800 dark:text-zinc-200 border border-zinc-200/60 dark:border-zinc-800/60 rounded-tl-sm">
                                {renderMarkdown(streamedTokens)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isStreaming && currentStatus && (
                          <div className="flex items-center space-x-2 text-[11px] font-mono text-zinc-400 pl-11">
                            <RefreshCw className="w-3.5 h-3.5 text-violet-500 animate-spin" />
                            <span>{currentStatus}</span>
                          </div>
                        )}

                        {pendingApproval && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="ml-11 p-5 bg-amber-50/80 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                            <div className="flex items-start space-x-3">
                              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                              <div className="space-y-4 flex-1">
                                <div>
                                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Authorization Required</h4>
                                  <p className="text-xs text-zinc-500 mt-1">{pendingApproval.description}</p>
                                </div>
                                <div className="p-3 bg-white dark:bg-black/40 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono">
                                  <div className="font-semibold text-zinc-400 uppercase mb-1.5">Execution Parameters:</div>
                                  <pre className="text-zinc-700 dark:text-zinc-300 max-h-40 overflow-y-auto">{JSON.stringify(pendingApproval.args, null, 2)}</pre>
                                </div>
                                <div className="flex space-x-3 pt-1">
                                  <Button onClick={handleConfirmAction} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 h-9">
                                    <Check className="w-4 h-4 mr-1.5" /> Confirm
                                  </Button>
                                  <Button onClick={handleCancelAction} size="sm" variant="ghost" className="text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 h-9">
                                    <X className="w-4 h-4 mr-1.5" /> Reject
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        {!isStreaming && !pendingApproval && suggestedFollowUps.length > 0 && (
                          <div className="space-y-2 pl-11 pt-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Suggested Follow-ups:</div>
                            <div className="flex flex-wrap gap-2">
                              {suggestedFollowUps.map((prompt, pIdx) => (
                                <button
                                  key={pIdx}
                                  onClick={() => handleSendMessage(prompt)}
                                  className="px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-800/40 border border-violet-200 dark:border-violet-700/50 rounded-full transition-colors text-left"
                                >
                                  {prompt}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Footer */}
                  <div className="p-4 bg-white/50 dark:bg-[#0e1422]/80 border-t border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md">
                    <div className="max-w-3xl mx-auto relative flex items-center">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputMessage)}
                        disabled={isStreaming || !!pendingApproval}
                        placeholder={pendingApproval ? "Authorize action to continue..." : "Ask Copilot anything..."}
                        className="w-full h-12 pl-4 pr-14 bg-white dark:bg-[#121929] border-zinc-200 dark:border-zinc-800 text-[13px] rounded-2xl shadow-sm focus-visible:ring-violet-500"
                      />
                      <Button
                        onClick={() => handleSendMessage(inputMessage)}
                        disabled={isStreaming || !inputMessage.trim() || !!pendingApproval}
                        size="icon"
                        className="absolute right-1.5 h-9 w-9 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-center mt-2 text-[10px] text-zinc-400">
                      AI can make mistakes. Verify important platform actions.
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
