'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, UploadCloud, Search, Trash2, RefreshCw, BarChart2, FileText, 
  CheckCircle, AlertTriangle, Play, HelpCircle, ArrowRight, ShieldCheck, 
  ExternalLink, Sparkles, Clock, Layers, Users2
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/lib/store/auth';
import { knowledgeService, KnowledgeDocument, SearchResult, KnowledgeAnalytics } from '@/services/knowledge.service';

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
      const results = await knowledgeService.search(searchQuery);
      setSearchResults(results);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 border border-blue-500/20 rounded-3xl p-8 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">Knowledge Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 select-none">Enterprise Knowledge Base</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl mt-1 select-none">
            Upload organizational handbooks, leaves policy drafts, or standard SOPs. Powered by MongoDB Atlas Vector Search for semantically cited HR Copilot answers.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm flex flex-col justify-center min-w-[120px]">
            <span className="text-xs font-medium text-zinc-400">Documents</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{documents.length}</span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm flex flex-col justify-center min-w-[120px]">
            <span className="text-xs font-medium text-zinc-400">Total Chunks</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {documents.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0)}
            </span>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 shadow-sm flex flex-col justify-center min-w-[120px] col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-1">
            <span className="text-xs font-medium text-zinc-400">Search Speed</span>
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {analytics?.averageRetrievalTime ? `${analytics.averageRetrievalTime}ms` : '120ms'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200/60 dark:border-zinc-800/60 gap-4">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 pb-3.5 px-1.5 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
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
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
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
                ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
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
              <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Ask the knowledge base (e.g. 'What is the maternity leave policy duration?')"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searching || !searchQuery.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-zinc-500">Querying vector embeddings & similarity indexes...</span>
                </div>
              ) : searchError ? (
                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Search Failed</h3>
                  <p className="text-sm text-red-500 mt-1 max-w-md">
                    {searchError}
                  </p>
                </div>
              ) : searchTriggered && searchResults.length === 0 ? (
                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                  <HelpCircle className="w-12 h-12 text-zinc-400 mb-3" />
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">No matching insights found</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
                    We couldn't find any policy document matching your search. Ensure relevant documents are uploaded and employee access is approved.
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-zinc-400 tracking-wider uppercase">Semantic Search Matches</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {searchResults.map((result, index) => (
                      <motion.div
                        key={result._id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm space-y-4 hover:border-blue-500/30 transition-all group"
                      >
                        {/* Source info */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 tracking-wide uppercase">
                              {result.document.documentType}
                            </span>
                            <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                              {result.document.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                              Page {result.pageNumber || 1}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                              Section: {result.sectionTitle || 'General'}
                            </span>
                            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10 shadow-sm flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Match: {Math.round(result.score * 100)}%
                            </span>
                          </div>
                        </div>

                        {/* Content text */}
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-normal">
                          {result.content}
                        </p>

                        {/* Source reference footer */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {result.document.fileName}
                          </span>
                          <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer">
                            View context snippet
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-100/50 dark:bg-zinc-900/10 border border-zinc-200/50 dark:border-zinc-800/30 rounded-3xl p-12 text-center">
                  <Sparkles className="w-10 h-10 text-blue-500/40 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">Semantic RAG Search</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
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
                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm h-fit space-y-6">
                  <div className="border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Upload Policy Document</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">PDF or Word files. Size Cap: 15MB.</p>
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
                          ? 'border-blue-500 bg-blue-50/20' 
                          : 'border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.docx,.doc,.txt"
                        className="hidden"
                      />
                      <UploadCloud className="w-10 h-10 text-zinc-400 mb-2 animate-bounce" />
                      {uploadFile ? (
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100 block truncate max-w-[200px]">
                            {uploadFile.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 block">{formatBytes(uploadFile.size)}</span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block">Drag & Drop file here</span>
                          <span className="text-[10px] text-zinc-400 block mt-0.5">or click to browse local folders</span>
                        </div>
                      )}
                    </div>

                    {/* Title input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Document Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Employee Maternity Policy 2026"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        required
                      />
                    </div>

                    {/* Type select */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Category Type</label>
                      <select
                        value={uploadType}
                        onChange={(e) => setUploadType(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="POLICY">POLICY</option>
                        <option value="HANDBOOK">HANDBOOK</option>
                        <option value="SOP">SOP</option>
                        <option value="TRAINING">TRAINING</option>
                        <option value="BENEFITS">BENEFITS</option>
                        <option value="LEAVE">LEAVE</option>
                        <option value="PAYROLL">PAYROLL</option>
                        <option value="COMPLIANCE">COMPLIANCE</option>
                        <option value="OTHER">OTHER</option>
                      </select>
                    </div>

                    {/* Employee Approved switch */}
                    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40">
                      <div>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">Approve for Employees</span>
                        <span className="text-[10px] text-zinc-400 block">Allow read access for Employee role</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isApproved}
                        onChange={(e) => setIsApproved(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {uploadError && (
                      <span className="text-xs text-red-500 font-semibold flex items-center gap-1 bg-red-50 dark:bg-red-950/20 p-2.5 rounded-lg border border-red-500/10">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        {uploadError}
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={uploading || !uploadFile || !uploadTitle}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm h-fit text-center">
                  <ShieldCheck className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Recruiter Role View</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    You have view access to documents. Adding, deleting or editing requires administrator permissions.
                  </p>
                </div>
              )}

              {/* Right side: List of Documents */}
              <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Indexed Files</h3>
                  <button 
                    onClick={loadData}
                    className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <RefreshCw className="w-4.5 h-4.5 text-zinc-400" />
                  </button>
                </div>

                {loadingDocs ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-xs text-zinc-400">Loading document indices...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-16 text-zinc-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-zinc-300 dark:text-zinc-800" />
                    <span className="text-sm">No files uploaded yet.</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] uppercase text-zinc-400 font-extrabold tracking-wider">
                          <th className="pb-3">Title / Name</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Chunks</th>
                          <th className="pb-3">Employee Access</th>
                          <th className="pb-3">Status</th>
                          {isAdminOrManager && <th className="pb-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-xs">
                        {documents.map((doc) => (
                          <tr key={doc._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-colors">
                            {/* File title */}
                            <td className="py-3.5 pr-2">
                              <div className="flex flex-col">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-100">{doc.title}</span>
                                <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">{doc.fileName}</span>
                              </div>
                            </td>
                            {/* Category badge */}
                            <td className="py-3.5 pr-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 tracking-wide uppercase">
                                {doc.documentType}
                              </span>
                            </td>
                            {/* Chunks count */}
                            <td className="py-3.5 pr-2 text-zinc-500 font-medium">
                              {doc.status === 'READY' || doc.status === 'INDEXED' ? doc.chunkCount : '--'}
                            </td>
                            {/* Employee checkbox toggle */}
                            <td className="py-3.5 pr-2">
                              <button
                                onClick={() => isAdminOrManager && handleToggleApproved(doc)}
                                disabled={!isAdminOrManager}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border ${
                                  doc.isApprovedForEmployees
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-500/10'
                                    : 'bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800'
                                } ${isAdminOrManager ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}`}
                              >
                                {doc.isApprovedForEmployees ? 'Approved' : 'Restricted'}
                              </button>
                            </td>
                            {/* Ingestion status badge */}
                            <td className="py-3.5 pr-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase flex items-center w-fit gap-1 ${
                                doc.status === 'READY' || doc.status === 'INDEXED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                                  : doc.status === 'PROCESSING' || doc.status === 'INDEXING' || doc.status === 'UPLOADING'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 animate-pulse'
                                  : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                              }`}>
                                {(doc.status === 'READY' || doc.status === 'INDEXED') && <CheckCircle className="w-3 h-3" />}
                                {(doc.status === 'PROCESSING' || doc.status === 'INDEXING' || doc.status === 'UPLOADING') && <Clock className="w-3 h-3 animate-spin" />}
                                {doc.status === 'FAILED' && <AlertTriangle className="w-3 h-3" />}
                                {doc.status}
                              </span>
                            </td>
                            {/* Actions buttons */}
                            {isAdminOrManager && (
                              <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => handleReindex(doc._id)}
                                  title="Re-run text parsing and embeddings"
                                  className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-zinc-500 cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(doc._id)}
                                  title="Delete document and chunks"
                                  className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-red-500 transition-colors text-zinc-500 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
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
                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 rounded-2xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 block">Total Documents</span>
                    <span className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                      {analytics?.totalDocuments || documents.length}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-purple-600/10 text-purple-600 dark:bg-purple-500/20 rounded-2xl">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 block">Knowledge Chunks</span>
                    <span className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                      {analytics?.totalChunks || documents.reduce((acc, d) => acc + d.chunkCount, 0)}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-red-600/10 text-red-600 dark:bg-red-500/20 rounded-2xl">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 block">Failed Jobs</span>
                    <span className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                      {analytics?.failedProcessingJobs || 0}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                  <div className="p-3 bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 rounded-2xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 block">Avg Query Latency</span>
                    <span className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                      {analytics?.averageRetrievalTime ? `${analytics.averageRetrievalTime}ms` : '120ms'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Charts Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Document Type Distribution Chart */}
                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 uppercase tracking-wider">Document Categories</h3>
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
                              background: '#fff', 
                              border: '1px solid #e2e8f0', 
                              borderRadius: '12px' 
                            }} 
                          />
                          <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <span className="text-xs text-zinc-400">No chart data available</span>
                    )}
                  </div>
                </div>

                {/* Popular Queries / Terms */}
                <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Top Search Terms</h3>
                  {analytics?.topSearchTerms && analytics.topSearchTerms.length > 0 ? (
                    <div className="h-[240px] flex flex-col justify-center space-y-3">
                      {analytics.topSearchTerms.map((term, index) => (
                        <div key={term.term} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center justify-center border border-blue-500/10">
                              {index + 1}
                            </span>
                            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium capitalize">
                              "{term.term}"
                            </span>
                          </div>
                          <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-lg">
                            {term.count} queries
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[240px] flex items-center justify-center text-zinc-400 text-xs">
                      No query term metrics logged yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Popular Documents Table */}
              <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/50 dark:border-zinc-800/60 rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Most Queried Documents</h3>
                {analytics?.mostQueriedDocuments && analytics.mostQueriedDocuments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800/60 font-extrabold uppercase text-zinc-400 text-[10px] tracking-wider">
                          <th className="pb-2">Document Title</th>
                          <th className="pb-2">Filename</th>
                          <th className="pb-2 text-right">RAG Context Hits</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
                        {analytics.mostQueriedDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-zinc-50/30">
                            <td className="py-2.5 font-semibold text-zinc-800 dark:text-zinc-100">{doc.title}</td>
                            <td className="py-2.5 text-zinc-400">{doc.fileName}</td>
                            <td className="py-2.5 text-right font-extrabold text-blue-600 dark:text-blue-400">{doc.queries} times</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-zinc-400 text-xs">
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
