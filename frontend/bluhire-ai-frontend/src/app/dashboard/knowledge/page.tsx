'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, UploadCloud, Search, Trash2, RefreshCw, BarChart2, FileText, 
  CheckCircle, AlertTriangle, Play, HelpCircle, ArrowRight, ShieldCheck, 
  ExternalLink, Sparkles, Clock, Layers
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuthStore } from '@/lib/store/auth';
import { knowledgeService, KnowledgeDocument, SearchResult, KnowledgeAnalytics, RAGCitation, RAGResponse } from '@/services/knowledge.service';

export default function KnowledgeBasePage() {
  const { user } = useAuthStore();
  const isAdminOrManager = user && ['MANAGEMENT_ADMIN', 'SENIOR_MANAGER'].includes(user.role);
  const isRecruiter = user && user.role === 'HR_RECRUITER';
  const isEmployee = user && user.role === 'EMPLOYEE';

  // Tabs states: 'documents' | 'search' | 'analytics'
  const [activeTab, setActiveTab] = useState<'documents' | 'search' | 'analytics'>('search');

  // Document management states
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [analytics, setAnalytics] = useState<KnowledgeAnalytics | null>(null);

  // Upload States
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('POLICY');
  const [isApproved, setIsApproved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchAnswer, setSearchAnswer] = useState('');
  const [searchCitations, setSearchCitations] = useState<RAGCitation[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Load documents and analytics
  const loadData = async () => {
    try {
      setLoadingDocs(true);
      const docsList = await knowledgeService.list();
      setDocuments(docsList);

      if (isAdminOrManager || isRecruiter) {
        const stats = await knowledgeService.getAnalytics();
        setAnalytics(stats);
      }
    } catch (err) {
      console.error('Failed to load knowledge documents/analytics:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    loadData();
    // Default to search tab for employees and recruiters
    if (isEmployee) {
      setActiveTab('search');
    }
  }, [user]);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle Drop Events
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      // Auto fill title from name without extension
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setUploadTitle(baseName.replace(/[_-]/g, ' '));
    }
  };

  // Handle File Input Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setUploadTitle(baseName.replace(/[_-]/g, ' '));
    }
  };

  // Handle Upload
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;

    try {
      setUploading(true);
      setUploadError('');
      await knowledgeService.upload(uploadFile, uploadTitle, uploadType, isApproved);
      // Reset form
      setUploadFile(null);
      setUploadTitle('');
      setIsApproved(false);
      // Reload table
      loadData();
      setActiveTab('documents');
    } catch (err: any) {
      setUploadError(err.response?.data?.message || err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Handle Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setSearchTriggered(true);
      setSearchError('');
      const response = await knowledgeService.search(searchQuery);
      setSearchAnswer(response.answer || '');
      setSearchResults(response.chunks || []);
      setSearchCitations(response.citations || []);
    } catch (err: any) {
      console.error('Semantic search failed:', err);
      const hasFailedDocs = documents.some(d => d.status === 'FAILED');
      const hasProcessingDocs = documents.some(d => ['PROCESSING', 'INDEXING', 'UPLOADING'].includes(d.status));
      if (hasFailedDocs && !documents.some(d => d.status === 'INDEXED' || d.status === 'READY')) {
        setSearchError('Search unavailable because document indexing failed.');
      } else if (hasProcessingDocs) {
        setSearchError('Document processing has not completed.');
      } else {
        setSearchError(err.response?.data?.message || err.message || 'Search failed');
      }
    } finally {
      setSearching(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document and its vector embeddings?')) return;
    try {
      await knowledgeService.delete(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  // Handle Reindex
  const handleReindex = async (id: string) => {
    try {
      await knowledgeService.reindex(id);
      loadData();
      alert('Reindexing triggered. Chunks are being re-processed.');
    } catch (err) {
      console.error('Failed to reindex document:', err);
    }
  };

  // Handle Toggle Employee Access Approved
  const handleToggleApproved = async (doc: KnowledgeDocument) => {
    try {
      await knowledgeService.update(doc._id, {
        isApprovedForEmployees: !doc.isApprovedForEmployees
      });
      loadData();
    } catch (err) {
      console.error('Failed to update employee approval status:', err);
    }
  };

  // Helper formats
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Colors for Recharts pie chart
  const COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1'];

  // Calculate local doc type distributions for charts
  const getDocTypeDist = () => {
    const counts: Record<string, number> = {};
    documents.forEach(d => {
      counts[d.documentType] = (counts[d.documentType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  return (
    <div className="space-y-8 min-h-screen pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#A855F7]/10 border border-[#8B5CF6]/20 rounded-[24px] p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-[#8B5CF6]/10 text-[#8B5CF6]">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-small-label text-[#8B5CF6]">Knowledge Hub</span>
          </div>
          <h1 className="text-h1 text-foreground dark:text-white select-none">Enterprise Knowledge Base</h1>
          <p className="text-body-copy text-muted-foreground dark:text-white/60 mt-3 max-w-xl select-none leading-relaxed">
            Upload organizational handbooks, leaves policy drafts, or standard SOPs. Powered by MongoDB Atlas Vector Search for semantically cited HR Copilot answers.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="px-4 py-3 rounded-xl bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 shadow-sm flex flex-col justify-center min-w-[120px]">
            <span className="text-small-label text-muted-foreground dark:text-white/40">Documents</span>
            <span className="text-h2 text-foreground dark:text-white">{documents.length}</span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 shadow-sm flex flex-col justify-center min-w-[120px]">
            <span className="text-small-label text-muted-foreground dark:text-white/40">Total Chunks</span>
            <span className="text-h2 text-foreground dark:text-white">
              {documents.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0)}
            </span>
          </div>
          <div className="px-4 py-3 rounded-xl bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 shadow-sm flex flex-col justify-center min-w-[120px] col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-1">
            <span className="text-small-label text-muted-foreground dark:text-white/40">Search Speed</span>
            <span className="text-h2 text-foreground dark:text-white">
              {analytics?.averageRetrievalTime ? `${analytics.averageRetrievalTime}ms` : '120ms'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border dark:border-white/10 gap-4">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 pb-3.5 px-1.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'border-[#8B5CF6] text-[#8B5CF6]'
              : 'border-transparent text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white'
          }`}
        >
          <Search className="w-4.5 h-4.5" />
          Semantic Search
        </button>

        {(!isEmployee) && (
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 pb-3.5 px-1.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'documents'
                ? 'border-[#8B5CF6] text-[#8B5CF6]'
                : 'border-transparent text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white'
            }`}
          >
            <FileText className="w-4.5 h-4.5" />
            Documents Management
          </button>
        )}

        {(!isEmployee) && (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 pb-3.5 px-1.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'border-[#8B5CF6] text-[#8B5CF6]'
                : 'border-transparent text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-4.5 h-4.5" />
            Search Analytics
          </button>
        )}
      </div>

      {/* Tabs Content */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {/* SEARCH TAB */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Search Form */}
              <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm dark:shadow-2xl">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground dark:text-white/30" />
                    <input
                      type="text"
                      placeholder="Ask the knowledge base (e.g. 'What is the maternity leave policy duration?')"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/30"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="bg-[#8B5CF6] hover:bg-[#A855F7] text-white font-medium text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed border-0 shadow-md shadow-[#8B5CF6]/10"
                  >
                    {searching ? (
                      <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-4.5 h-4.5" />
                    )}
                    Find Answers
                  </button>
                </form>
              </div>

              {/* Search results */}
              {searching ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
                  <span className="text-sm font-medium text-muted-foreground dark:text-white/40">Querying vector embeddings & similarity indexes...</span>
                </div>
              ) : searchError ? (
                <div className="bg-card dark:bg-white/[0.03] border border-border dark:border-white/10 rounded-[24px] p-12 text-center flex flex-col items-center justify-center shadow-sm">
                  <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
                  <h3 className="text-h2 text-foreground dark:text-white">Search Failed</h3>
                  <p className="text-body-copy text-rose-600 dark:text-red-400 mt-1 max-w-md">
                    {searchError}
                  </p>
                </div>
              ) : searchTriggered && searchResults.length === 0 ? (
                <div className="bg-card dark:bg-white/[0.03] border border-border dark:border-white/10 rounded-[24px] p-12 text-center flex flex-col items-center justify-center shadow-sm">
                  <HelpCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <h3 className="text-h2 text-foreground dark:text-white">No matching insights found</h3>
                  <p className="text-body-copy text-muted-foreground dark:text-white/40 mt-1 max-w-md">
                    We couldn't find any policy document matching your search. Ensure relevant documents are uploaded and employee access is approved.
                  </p>
                </div>
              ) : searchTriggered && (searchResults.length > 0 || searchAnswer) ? (
                <div className="space-y-6">
                  {/* AI Generated Answer Card */}
                  {searchAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-[#8B5CF6]/10 via-[#8B5CF6]/5 to-transparent backdrop-blur-xl border border-[#8B5CF6]/30 rounded-[24px] p-6 sm:p-8 shadow-lg shadow-[#8B5CF6]/5 space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-[#8B5CF6]/20 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-[#8B5CF6]/20 text-[#8B5CF6] dark:text-[#c084fc]">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-foreground dark:text-white flex items-center gap-2">
                              AI Answer
                            </h3>
                            <p className="text-xs text-muted-foreground dark:text-white/40">
                              Synthesized from verified organizational knowledge & document context
                            </p>
                          </div>
                        </div>

                        {searchCitations.length > 0 && (
                          <span className="text-small-label px-2.5 py-1 rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6] dark:text-[#c084fc] border border-[#8B5CF6]/25 font-semibold">
                            {searchCitations.length} {searchCitations.length === 1 ? 'Source' : 'Sources'} Cited
                          </span>
                        )}
                      </div>

                      {/* Formatted Answer */}
                      <div className="text-body-copy text-foreground dark:text-white/90 leading-relaxed text-sm sm:text-base font-normal space-y-3">
                        <ReactMarkdown
                          components={{
                            h1: ({ node, ...props }) => (
                              <h3 className="text-base sm:text-lg font-bold text-foreground dark:text-white mt-3 mb-1.5 flex items-center gap-2" {...props} />
                            ),
                            h2: ({ node, ...props }) => (
                              <h4 className="text-sm sm:text-base font-bold text-foreground dark:text-white mt-2.5 mb-1 flex items-center gap-1.5" {...props} />
                            ),
                            h3: ({ node, ...props }) => (
                              <h5 className="text-xs sm:text-sm font-bold text-[#8B5CF6] dark:text-[#c084fc] mt-2 mb-1 tracking-wide uppercase" {...props} />
                            ),
                            p: ({ node, ...props }) => (
                              <p className="mb-2 leading-relaxed text-foreground/90 dark:text-white/85" {...props} />
                            ),
                            ul: ({ node, ...props }) => (
                              <ul className="list-disc list-inside space-y-1 my-2 ml-1 text-foreground/90 dark:text-white/85" {...props} />
                            ),
                            ol: ({ node, ...props }) => (
                              <ol className="list-decimal list-inside space-y-1 my-2 ml-1 text-foreground/90 dark:text-white/85" {...props} />
                            ),
                            li: ({ node, children, ...props }) => {
                              // Guard: if list item is empty or only whitespace, do not render a bullet
                              if (!children) return null;
                              if (typeof children === 'string' && children.trim() === '') return null;
                              if (Array.isArray(children) && children.length === 1 && typeof children[0] === 'string' && children[0].trim() === '') return null;
                              return <li className="leading-relaxed marker:text-[#8B5CF6]" {...props}>{children}</li>;
                            },
                            strong: ({ node, ...props }) => (
                              <strong className="font-semibold text-foreground dark:text-white" {...props} />
                            ),
                            em: ({ node, ...props }) => (
                              <em className="italic text-foreground/80 dark:text-white/80" {...props} />
                            ),
                            code: ({ node, className, children, ...props }) => {
                              const match = /language-(\w+)/.exec(className || '');
                              return (
                                <code className="bg-muted/70 dark:bg-white/[0.08] px-1.5 py-0.5 rounded text-xs font-mono text-[#8B5CF6] dark:text-[#c084fc] border border-border/50 dark:border-white/10" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            pre: ({ node, ...props }) => (
                              <pre className="bg-muted/80 dark:bg-black/40 p-3 rounded-xl overflow-x-auto text-xs font-mono my-2 border border-border dark:border-white/10" {...props} />
                            ),
                            a: ({ node, ...props }) => (
                              <a className="text-[#8B5CF6] hover:text-[#A855F7] underline font-medium" target="_blank" rel="noopener noreferrer" {...props} />
                            ),
                            blockquote: ({ node, ...props }) => (
                              <blockquote className="border-l-2 border-[#8B5CF6]/40 pl-3 my-2 italic text-muted-foreground dark:text-white/60" {...props} />
                            )
                          }}
                        >
                          {searchAnswer}
                        </ReactMarkdown>
                      </div>

                      {/* Citations Badges */}
                      {searchCitations.length > 0 && (
                        <div className="pt-3 border-t border-border/50 dark:border-white/10 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-muted-foreground dark:text-white/50">
                            Cited Evidence:
                          </span>
                          {searchCitations.map((citation, cIdx) => (
                            <span
                              key={cIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/60 dark:bg-white/[0.05] border border-border dark:border-white/10 text-xs text-foreground dark:text-white/80 font-medium"
                            >
                              <FileText className="w-3.5 h-3.5 text-[#8B5CF6]" />
                              <span>{citation.title || citation.fileName}</span>
                              <span className="text-muted-foreground dark:text-white/40 text-[11px]">
                                (p. {citation.pageNumber})
                              </span>
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Retrieved Sources Section */}
                  {searchResults.length > 0 && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-h2 text-foreground dark:text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#8B5CF6]" />
                          Retrieved Sources
                        </h3>
                        <span className="text-xs text-muted-foreground dark:text-white/40">
                          {searchResults.length} {searchResults.length === 1 ? 'source match' : 'source matches'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {searchResults.map((result, index) => (
                          <motion.div
                            key={result._id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm dark:shadow-2xl space-y-4 hover:border-[#8B5CF6]/30 transition-all group"
                          >
                            {/* Source info */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border dark:border-white/10 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-small-label bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#c084fc] border border-[#8B5CF6]/20">
                                  {result.document.documentType}
                                </span>
                                <h4 className="text-grid font-bold text-foreground dark:text-white">
                                  {result.document.title}
                                </h4>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-small-label px-2 py-0.5 rounded-lg bg-muted/60 dark:bg-white/[0.04] text-muted-foreground dark:text-white/60 border border-border dark:border-white/10 normal-case">
                                  Page {result.pageNumber || 1}
                                </span>
                                <span className="text-small-label px-2 py-0.5 rounded-lg bg-muted/60 dark:bg-white/[0.04] text-muted-foreground dark:text-white/60 border border-border dark:border-white/10 normal-case">
                                  Section: {result.sectionTitle || 'General'}
                                </span>
                                <span className="text-small-label px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20 shadow-sm flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  Match: {Math.round(result.score * 100)}%
                                </span>
                              </div>
                            </div>

                            {/* Content text */}
                            <div className="space-y-1">
                              <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground dark:text-white/40">
                                Context Snippet:
                              </span>
                              <p className="text-body-copy text-foreground/80 dark:text-white/70 leading-relaxed font-normal text-xs sm:text-sm">
                                {result.content}
                              </p>
                            </div>

                            {/* Source reference footer */}
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-small-label text-muted-foreground dark:text-white/40 flex items-center gap-1 normal-case">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground/40 dark:text-white/20" />
                                {result.document.fileName}
                              </span>
                              <span className="text-small-label text-[#8B5CF6] flex items-center gap-1 font-semibold normal-case">
                                Supporting source evidence
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-[24px] p-12 text-center shadow-sm">
                  <Sparkles className="w-10 h-10 text-[#8B5CF6] mx-auto mb-3 animate-pulse" />
                  <h3 className="text-h2 text-foreground dark:text-white/90">Semantic RAG Search</h3>
                  <p className="text-body-copy text-muted-foreground dark:text-white/40 mt-1 max-w-sm mx-auto">
                    Type a query above to retrieve relevant policy chunks. The search engine resolves semantic context automatically.
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (!isEmployee) && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left side: Upload Form */}
              {(isAdminOrManager) ? (
                <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm dark:shadow-2xl h-fit space-y-6">
                  <div className="border-b border-border dark:border-white/10 pb-3">
                    <h3 className="text-h2 text-foreground dark:text-white">Upload Policy Document</h3>
                    <p className="text-body-copy text-muted-foreground dark:text-white/40 mt-0.5">PDF or Word files. Size Cap: 15MB.</p>
                  </div>

                  <form onSubmit={handleUpload} className="space-y-4">
                    {/* Drag and drop Area */}
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                        dragActive 
                          ? 'border-[#8B5CF6] bg-[#8B5CF6]/10' 
                          : 'border-border dark:border-white/10 hover:border-[#8B5CF6]/30 bg-muted/20 dark:bg-white/[0.01] hover:bg-muted/40 dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.doc,.txt"
                        className="hidden"
                      />
                      <UploadCloud className="w-10 h-10 text-muted-foreground dark:text-white/30 mb-2 animate-bounce" />
                      {uploadFile ? (
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-foreground dark:text-white block truncate max-w-[200px]">
                            {uploadFile.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground dark:text-white/40 block">{formatBytes(uploadFile.size)}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs font-semibold text-foreground dark:text-white/80 block">Drag & Drop file here</span>
                          <span className="text-[10px] text-muted-foreground dark:text-white/40 block mt-0.5">or click to browse local folders</span>
                        </div>
                      )}
                    </div>

                    {/* Title input */}
                    <div className="space-y-1">
                      <label className="text-small-label text-muted-foreground dark:text-white/40">Document Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Employee Maternity Policy 2026"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-xl py-2 px-3.5 text-xs text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30"
                        required
                      />
                    </div>

                    {/* Type select */}
                    <div className="space-y-1">
                      <label className="text-small-label text-muted-foreground dark:text-white/40">Category Type</label>
                      <select
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value)}
                        className="w-full bg-card dark:bg-white/[0.02] border border-border dark:border-white/10 rounded-xl py-2 px-3 text-xs text-foreground dark:text-white/80 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/30 cursor-pointer"
                      >
                        <option value="POLICY" className="bg-card text-foreground dark:bg-[#0a0a0a] dark:text-white">POLICY</option>
                        <option value="HANDBOOK" className="bg-card text-foreground dark:bg-[#0a0a0a] dark:text-white">HANDBOOK</option>
                        <option value="SOP" className="bg-card text-foreground dark:bg-[#0a0a0a] dark:text-white">SOP</option>
                        <option value="TRAINING" className="bg-card text-foreground dark:bg-[#0a0a0a] dark:text-white">TRAINING</option>
                        <option value="BENEFITS" className="bg-card text-foreground dark:bg-[#0a0a0a] dark:text-white">BENEFITS</option>
                        <option value="LEAVE" className="bg-card text-foreground dark:bg-[#0a0a0a] dark:text-white">LEAVE</option>
                        <option value="PAYROLL" className="bg-card text-foreground dark:bg-[#0a0a0a] dark:text-white">PAYROLL</option>
                        <option value="COMPLIANCE" className="bg-card text-foreground dark:bg-[#0a0a0a] dark:text-white">COMPLIANCE</option>
                        <option value="OTHER" className="bg-card text-foreground dark:bg-[#0a0a0a] dark:text-white">OTHER</option>
                      </select>
                    </div>

                    {/* Employee Approved switch */}
                    <div className="flex items-center justify-between bg-muted/30 dark:bg-white/[0.02] p-3 rounded-xl border border-border dark:border-white/10">
                      <div>
                        <span className="text-grid font-bold text-foreground dark:text-white/80 block">Approve for Employees</span>
                        <span className="text-small-label text-muted-foreground dark:text-white/40 block normal-case">Allow read access for Employee role</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isApproved}
                        onChange={(e) => setIsApproved(e.target.checked)}
                        className="w-4 h-4 rounded text-[#8B5CF6] focus:ring-[#8B5CF6] cursor-pointer"
                      />
                    </div>

                    {uploadError && (
                      <span className="text-xs text-rose-600 dark:text-red-400 font-semibold flex items-center gap-1 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {uploadError}
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={uploading || !uploadFile || !uploadTitle}
                      className="w-full bg-[#8B5CF6] hover:bg-[#A855F7] text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed border-0"
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Processing Embeddings...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          Save & Index
                        </>
                      )}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm dark:shadow-2xl h-fit text-center">
                  <ShieldCheck className="w-10 h-10 text-muted-foreground dark:text-white/30 mx-auto mb-2" />
                  <h3 className="text-h2 text-foreground dark:text-white">Recruiter Role View</h3>
                  <p className="text-body-copy text-muted-foreground dark:text-white/40 mt-1 leading-relaxed">
                    You have view access to documents. Adding, deleting or editing requires administrator permissions.
                  </p>
                </div>
              )}

              {/* Right side: List of Documents */}
              <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm dark:shadow-2xl lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-border dark:border-white/10 pb-3">
                  <h3 className="text-h2 text-foreground dark:text-white">Indexed Files</h3>
                  <button 
                    onClick={loadData}
                    className="p-1.5 rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.02] hover:bg-muted dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4.5 h-4.5 text-muted-foreground dark:text-white/40" />
                  </button>
                </div>

                {loadingDocs ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#8B5CF6] animate-spin" />
                    <span className="text-xs text-muted-foreground dark:text-white/40">Loading document indices...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground dark:text-white/40">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground/30" />
                    <span className="text-sm">No files uploaded yet.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-border dark:border-white/10 text-small-label text-muted-foreground dark:text-white/40">
                          <th className="pb-3">Title / Name</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Chunks</th>
                          <th className="pb-3">Employee Access</th>
                          <th className="pb-3">Status</th>
                          {isAdminOrManager && <th className="pb-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 dark:divide-white/10 text-grid">
                        {documents.map((doc) => {
                          let statusStyle = 'bg-muted dark:bg-white/[0.04] border-border dark:border-white/10 text-muted-foreground dark:text-white/60';
                          if (doc.status === 'READY' || doc.status === 'INDEXED') {
                            statusStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-450';
                          } else if (doc.status === 'PROCESSING' || doc.status === 'INDEXING' || doc.status === 'UPLOADING') {
                            statusStyle = 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 animate-pulse';
                          } else if (doc.status === 'FAILED') {
                            statusStyle = 'bg-red-500/10 border-red-500/20 text-rose-600 dark:text-red-400';
                          }

                          return (
                            <tr key={doc._id} className="hover:bg-muted/30 dark:hover:bg-white/[0.015] transition-colors">
                              {/* File title */}
                              <td className="py-3.5 pr-2">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground dark:text-white text-grid">{doc.title}</span>
                                  <span className="text-small-label text-muted-foreground dark:text-white/40 truncate max-w-[200px] normal-case font-mono">{doc.fileName}</span>
                                </div>
                              </td>
                              {/* Category badge */}
                              <td className="py-3.5 pr-2">
                                <span className="px-2 py-0.5 rounded text-small-label bg-[#8B5CF6]/10 text-[#8B5CF6] dark:text-[#c084fc] border border-[#8B5CF6]/20 font-bold">
                                  {doc.documentType}
                                </span>
                              </td>
                              {/* Chunks count */}
                              <td className="py-3.5 pr-2 text-muted-foreground dark:text-white/60 font-medium">
                                {doc.status === 'READY' || doc.status === 'INDEXED' ? doc.chunkCount : '--'}
                              </td>
                              {/* Employee checkbox toggle */}
                              <td className="py-3.5 pr-2">
                                <button
                                  onClick={() => isAdminOrManager && handleToggleApproved(doc)}
                                  disabled={!isAdminOrManager}
                                  className={`px-2 py-0.5 rounded text-small-label border ${
                                    doc.isApprovedForEmployees
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                      : 'bg-muted dark:bg-white/[0.04] text-muted-foreground dark:text-white/60 border-border dark:border-white/10'
                                  } ${isAdminOrManager ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
                                >
                                  {doc.isApprovedForEmployees ? 'Approved' : 'Restricted'}
                                </button>
                              </td>
                              {/* Ingestion status badge */}
                              <td className="py-3.5 pr-2">
                                <span className={`px-2 py-0.5 rounded text-small-label border flex items-center w-fit gap-1 ${statusStyle}`}>
                                  {(doc.status === 'READY' || doc.status === 'INDEXED') && <CheckCircle className="w-3.5 h-3.5" />}
                                  {(doc.status === 'PROCESSING' || doc.status === 'INDEXING' || doc.status === 'UPLOADING') && <Clock className="w-3.5 h-3.5 animate-spin" />}
                                  {doc.status === 'FAILED' && <AlertTriangle className="w-3.5 h-3.5" />}
                                  {doc.status}
                                </span>
                              </td>
                              {/* Actions buttons */}
                              {isAdminOrManager && (
                                <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                                  <button
                                    onClick={() => handleReindex(doc._id)}
                                    title="Re-run text parsing and embeddings"
                                    className="p-1 rounded-lg border border-border dark:border-white/10 bg-muted/40 dark:bg-white/[0.02] hover:bg-muted dark:hover:bg-white/[0.06] transition-colors text-muted-foreground dark:text-white/60 cursor-pointer"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(doc._id)}
                                    title="Delete document and chunks"
                                    className="p-1 rounded-lg border border-border dark:border-white/10 bg-muted/40 dark:bg-white/[0.02] hover:bg-muted dark:hover:bg-white/[0.06] hover:text-red-500 transition-colors text-muted-foreground dark:text-white/60 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (!isEmployee) && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Analytics Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground dark:text-white/40 block">Total Documents</span>
                    <span className="text-2xl font-bold text-foreground dark:text-white">
                      {analytics?.totalDocuments || documents.length}
                    </span>
                  </div>
                </div>

                <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-[#A855F7]/10 text-[#A855F7] rounded-2xl">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground dark:text-white/40 block">Knowledge Chunks</span>
                    <span className="text-2xl font-bold text-foreground dark:text-white">
                      {analytics?.totalChunks || documents.reduce((acc, d) => acc + d.chunkCount, 0)}
                    </span>
                  </div>
                </div>

                <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-red-500/10 text-rose-600 dark:text-red-400 rounded-2xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground dark:text-white/40 block">Failed Jobs</span>
                    <span className="text-2xl font-bold text-foreground dark:text-white">
                      {analytics?.failedProcessingJobs || 0}
                    </span>
                  </div>
                </div>

                <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground dark:text-white/40 block">Avg Query Latency</span>
                    <span className="text-2xl font-bold text-foreground dark:text-white">
                      {analytics?.averageRetrievalTime ? `${analytics.averageRetrievalTime}ms` : '120ms'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Document Type Distribution Chart */}
                <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm">
                  <h3 className="text-h2 text-foreground dark:text-white mb-4">Document Categories</h3>
                  <div className="h-[240px] flex items-center justify-center">
                    {documents.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getDocTypeDist()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {getDocTypeDist().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              background: 'var(--card)', 
                              border: '1px solid var(--border)', 
                              borderRadius: '12px',
                              color: 'var(--foreground)'
                            }} 
                          />
                          <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-xs text-muted-foreground dark:text-white/40">No chart data available</span>
                    )}
                  </div>
                </div>

                {/* Popular Queries / Terms */}
                <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm space-y-4">
                  <h3 className="text-h2 text-foreground dark:text-white">Top Search Terms</h3>
                  {analytics?.topSearchTerms && analytics.topSearchTerms.length > 0 ? (
                    <div className="h-[240px] flex flex-col justify-center space-y-3">
                      {analytics.topSearchTerms.map((term, index) => (
                        <div key={term.term} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-bold flex items-center justify-center border border-[#8B5CF6]/20">
                              {index + 1}
                            </span>
                            <span className="text-xs text-foreground dark:text-white/80 font-medium capitalize">
                              "{term.term}"
                            </span>
                          </div>
                          <span className="text-xs font-bold text-muted-foreground dark:text-white/60 bg-muted/50 dark:bg-white/[0.04] border border-border dark:border-white/10 px-2 py-0.5 rounded-lg">
                            {term.count} queries
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-muted-foreground dark:text-white/40 text-xs">
                      No query term metrics logged yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Popular Documents Table */}
              <div className="bg-card dark:bg-white/[0.03] backdrop-blur-xl border border-border dark:border-white/10 rounded-[24px] p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-foreground dark:text-white uppercase tracking-wider">Most Queried Documents</h3>
                {analytics?.mostQueriedDocuments && analytics.mostQueriedDocuments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border dark:border-white/10 font-extrabold uppercase text-muted-foreground dark:text-white/40 text-[10px] tracking-wider">
                          <th className="pb-2">Document Title</th>
                          <th className="pb-2">Filename</th>
                          <th className="pb-2 text-right">RAG Context Hits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60 dark:divide-white/10">
                        {analytics.mostQueriedDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-muted/30 dark:hover:bg-white/[0.015] transition-colors">
                            <td className="py-2.5 font-semibold text-foreground dark:text-white">{doc.title}</td>
                            <td className="py-2.5 text-muted-foreground dark:text-white/40">{doc.fileName}</td>
                            <td className="py-2.5 text-right font-extrabold text-[#8B5CF6]">{doc.queries} times</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-muted-foreground dark:text-white/40 text-xs">
                    No document query records resolved yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

