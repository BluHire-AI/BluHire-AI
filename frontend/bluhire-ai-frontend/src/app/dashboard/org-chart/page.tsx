'use client';

import React, { useState, useEffect, useRef } from 'react';
import { employeeService } from '@/services/employee.service';
import { departmentService } from '@/services/department.service';
import { designationService } from '@/services/designation.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, Network, ChevronDown, ChevronRight, Search, 
  ZoomIn, ZoomOut, Maximize2, RotateCcw, UserCheck, Crown, Users, Sparkles, Layers
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface HierarchyNode {
  _id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  email: string;
  designationId?: string;
  departmentId?: string;
  designation?: {
    _id: string;
    title: string;
    level: number;
  };
  department?: {
    _id: string;
    name: string;
  };
  profileImage?: string;
  children?: HierarchyNode[];
}

export default function OrgChartPage() {
  const [allRootNodes, setAllRootNodes] = useState<HierarchyNode[]>([]);
  const [allManagers, setAllManagers] = useState<HierarchyNode[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  
  const [activeEmployeesCount, setActiveEmployeesCount] = useState(0);
  const [totalEmployeesCount, setTotalEmployeesCount] = useState(0);
  const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});
  const [designationsMap, setDesignationsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Interactivity States
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomScale, setZoomScale] = useState(1);

  // Canvas Container Ref for Fit-to-View calculation
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Helper: Find a node by ID anywhere in the hierarchy trees
  const findNodeInTrees = (nodes: HierarchyNode[], targetId: string): HierarchyNode | null => {
    for (const node of nodes) {
      if (node._id === targetId) return node;
      if (node.children && node.children.length > 0) {
        const found = findNodeInTrees(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper: Extract all managers (nodes with at least 1 child report) across all trees
  const extractManagers = (roots: HierarchyNode[]): HierarchyNode[] => {
    const managers: HierarchyNode[] = [];
    const visited = new Set<string>();

    const traverse = (node: HierarchyNode) => {
      if (!node || visited.has(node._id)) return;
      visited.add(node._id);

      if (node.children && node.children.length > 0) {
        managers.push(node);
        node.children.forEach(traverse);
      }
    };

    roots.forEach(traverse);

    // Sort managers sensibly: by direct reports count descending, then alphabetically by name
    return managers.sort((a, b) => {
      const reportsA = a.children ? a.children.length : 0;
      const reportsB = b.children ? b.children.length : 0;
      if (reportsB !== reportsA) return reportsB - reportsA;
      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hierarchyRes, deptsRes, desgsRes] = await Promise.all([
        employeeService.getHierarchy(),
        departmentService.getActive(),
        designationService.getAll(),
      ]);

      const roots: HierarchyNode[] = hierarchyRes.rootNodes && hierarchyRes.rootNodes.length > 0
        ? hierarchyRes.rootNodes
        : hierarchyRes.rootNode ? [hierarchyRes.rootNode] : [];

      setAllRootNodes(roots);
      setTotalEmployeesCount(hierarchyRes.totalEmployees || 0);
      setActiveEmployeesCount(hierarchyRes.activeEmployees || 0);

      const deptLookup: Record<string, string> = {};
      deptsRes.forEach((d) => {
        deptLookup[d._id] = d.name;
      });
      setDepartmentsMap(deptLookup);

      const desgLookup: Record<string, string> = {};
      desgsRes.forEach((d) => {
        desgLookup[d._id] = d.title;
      });
      setDesignationsMap(desgLookup);

      // Extract all valid seniors/managers with reports
      const managers = extractManagers(roots);
      setAllManagers(managers);

      // Default selection: select the first manager with reports if available
      if (managers.length > 0) {
        setSelectedManagerId((prevId) => {
          // Keep current selection if valid, otherwise select first manager
          return managers.some(m => m._id === prevId) ? prevId : managers[0]._id;
        });
      }
    } catch (error) {
      console.error('Failed to load organizational chart hierarchy', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When selected manager changes, expand top 3 levels and fit to view
  useEffect(() => {
    if (selectedManagerId && allRootNodes.length > 0) {
      const selectedNode = findNodeInTrees(allRootNodes, selectedManagerId);
      if (selectedNode) {
        const initialExpanded: Record<string, boolean> = { ...expandedNodes };
        const expandSubtree = (n: HierarchyNode, depth: number) => {
          if (depth <= 3) {
            initialExpanded[n._id] = true;
            if (n.children) {
              n.children.forEach((c) => expandSubtree(c, depth + 1));
            }
          }
        };
        expandSubtree(selectedNode, 1);
        setExpandedNodes(initialExpanded);
      }

      // Auto fit tree into view on manager change
      const timer = setTimeout(() => {
        handleFitToView();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedManagerId, allRootNodes]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
  };

  const handleFitToView = () => {
    if (!containerRef.current || !contentRef.current) {
      setZoomScale(0.9);
      return;
    }
    const containerWidth = containerRef.current.clientWidth;
    const contentWidth = contentRef.current.scrollWidth;
    
    if (contentWidth > 0 && containerWidth > 0) {
      const scale = Math.min(1.15, Math.max(0.5, (containerWidth - 80) / contentWidth));
      setZoomScale(Number(scale.toFixed(2)));
    } else {
      setZoomScale(0.85);
    }
  };

  // Node matching helper for search within selected tree
  const isNodeMatching = (node: HierarchyNode) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    const name = `${node.firstName} ${node.lastName}`.toLowerCase();
    const code = node.employeeCode.toLowerCase();
    const title = (node.designation?.title || designationsMap[node.designationId || ''] || '').toLowerCase();
    const dept = (node.department?.name || departmentsMap[node.departmentId || ''] || '').toLowerCase();
    return name.includes(q) || code.includes(q) || title.includes(q) || dept.includes(q);
  };

  // Branch matching helper
  const isBranchMatching = (node: HierarchyNode): boolean => {
    if (!searchQuery.trim()) return false;
    if (isNodeMatching(node)) return true;
    if (node.children && node.children.length > 0) {
      return node.children.some((child) => isBranchMatching(child));
    }
    return false;
  };

  // Currently selected manager node
  const currentSelectedManagerNode = selectedManagerId
    ? findNodeInTrees(allRootNodes, selectedManagerId)
    : null;

  // Calculate metrics for selected manager tree
  const countSubtreeEmployees = (node: HierarchyNode | null): number => {
    if (!node) return 0;
    let count = 1;
    if (node.children) {
      node.children.forEach((child) => {
        count += countSubtreeEmployees(child);
      });
    }
    return count;
  };

  const directReportsCount = currentSelectedManagerNode?.children?.length || 0;
  const totalSubtreeEmployeesCount = countSubtreeEmployees(currentSelectedManagerNode);

  // Department Badge Style Lookup
  const getDeptColor = (deptName: string) => {
    const lower = deptName.toLowerCase();
    if (lower.includes('eng') || lower.includes('tech')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (lower.includes('hr') || lower.includes('human') || lower.includes('people')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    if (lower.includes('sal') || lower.includes('market')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (lower.includes('fin') || lower.includes('account')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (lower.includes('ops') || lower.includes('operation')) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
    return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
  };

  // Clean Enterprise Tree Node Renderer
  const renderNodeTree = (node: HierarchyNode, isRoot: boolean = false) => {
    const isExpanded = expandedNodes[node._id] ?? true;
    const hasChildren = node.children && node.children.length > 0;
    const deptName = node.department?.name || departmentsMap[node.departmentId || ''] || 'General';
    const desgTitle = node.designation?.title || designationsMap[node.designationId || ''] || 'Team Member';
    
    const selfMatched = isNodeMatching(node);
    const branchMatched = isBranchMatching(node);
    const hasSearch = Boolean(searchQuery.trim());

    return (
      <div key={node._id} className="flex flex-col items-center">
        {/* Node Card Component */}
        <div className="relative flex flex-col items-center">
          <motion.div 
            whileHover={{ y: -2 }}
            className={`relative rounded-2xl transition-all duration-200 ${
              selfMatched 
                ? 'ring-2 ring-indigo-600 dark:ring-purple-400 shadow-md z-30' 
                : branchMatched
                ? 'ring-1 ring-indigo-400/60 dark:ring-purple-400/60 z-20'
                : hasSearch
                ? 'opacity-40 blur-[0.2px]'
                : isRoot
                ? 'ring-1 ring-indigo-500/40 dark:ring-purple-500/40 shadow-xs z-20'
                : ''
            }`}
          >
            <Card className={`w-60 border shadow-xs z-10 bg-card/95 dark:bg-[#0f1122]/95 backdrop-blur-xl rounded-2xl overflow-hidden ${
              isRoot 
                ? 'border-indigo-300/80 dark:border-purple-800/60' 
                : 'border-border/80 dark:border-white/10'
            }`}>
              {/* Subtle Top Accent Stripe */}
              <div className={`h-1.5 w-full ${
                isRoot 
                  ? 'bg-indigo-600 dark:bg-purple-500' 
                  : 'bg-slate-300/40 dark:bg-zinc-700/40'
              }`} />

              <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
                {/* Senior Manager Text Badge */}
                {isRoot && (
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-purple-950/60 text-indigo-700 dark:text-purple-300 border border-indigo-200/60 dark:border-purple-800/40">
                    SENIOR MANAGER
                  </span>
                )}

                {/* Profile Initials Avatar */}
                <div className="relative">
                  <div className={`rounded-xl flex items-center justify-center font-bold shadow-xs ${
                    isRoot 
                      ? 'w-11 h-11 bg-indigo-600 text-white text-sm' 
                      : 'w-10 h-10 bg-slate-100 dark:bg-white/10 text-foreground dark:text-white text-xs border border-border/50 dark:border-white/10'
                  }`}>
                    {node.firstName.charAt(0)}{node.lastName.charAt(0)}
                  </div>
                </div>
                
                <div className="space-y-0.5 w-full">
                  <h3 className="font-semibold text-xs text-foreground dark:text-white leading-tight truncate">
                    {node.firstName} {node.lastName}
                  </h3>
                  <p className="text-[10px] text-muted-foreground dark:text-zinc-400 truncate">
                    {desgTitle}
                  </p>
                </div>

                <div className="pt-0.5 flex items-center justify-center gap-1.5 flex-wrap">
                  <Badge variant="outline" className={`text-[9px] px-2 py-0 rounded-md border font-medium ${getDeptColor(deptName)}`}>
                    {deptName}
                  </Badge>
                  <span className="text-[9px] font-mono text-muted-foreground/60 dark:text-zinc-500">
                    {node.employeeCode}
                  </span>
                </div>
                
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleNode(node._id)}
                    className="flex items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground dark:text-zinc-300 dark:hover:text-white px-2.5 py-0.5 rounded-full border border-border dark:border-white/10 bg-background/60 dark:bg-white/[0.04] cursor-pointer transition-all mt-1"
                  >
                    <span>{node.children!.length} {node.children!.length === 1 ? 'direct report' : 'direct reports'}</span>
                    {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </button>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Vertical Stem from Parent Card Down to Sibling Bar Level */}
          {hasChildren && isExpanded && (
            <div className="w-[1.5px] h-6 bg-slate-300 dark:bg-indigo-900/60" />
          )}
        </div>

        {/* Children Row with Exact Orthogonal Connector Geometry */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div 
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex pt-0 justify-center"
            >
              {node.children!.map((child, index) => {
                const totalChildren = node.children!.length;
                const isFirst = index === 0;
                const isLast = index === totalChildren - 1;
                const isSingle = totalChildren === 1;

                return (
                  <div key={child._id} className="relative flex flex-col items-center px-3 sm:px-4">
                    {/* Horizontal Connector Header for this Cell */}
                    {!isSingle && (
                      <div 
                        className="absolute top-0 h-[1.5px] bg-slate-300 dark:bg-indigo-900/60" 
                        style={{
                          left: isFirst ? '50%' : '0%',
                          right: isLast ? '50%' : '0%',
                        }} 
                      />
                    )}

                    {/* Vertical Stem Down to Child Card */}
                    <div className="w-[1.5px] h-6 bg-slate-300 dark:bg-indigo-900/60" />

                    {renderNodeTree(child, false)}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none p-1 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/60 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground dark:text-white">
              Organization Hierarchy
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 text-primary dark:bg-purple-500/15 dark:text-purple-300 border border-primary/20">
              Interactive Explorer
            </span>
          </div>
          <p className="text-sm text-muted-foreground dark:text-zinc-400">
            Interactive overview of operational reporting lines and hierarchy structure.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto flex-wrap">
          {/* Zoom & Fit Canvas Controls */}
          <div className="flex items-center rounded-xl border border-border/80 dark:border-white/10 p-1 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl shadow-xs">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setZoomScale(s => Math.max(0.45, s - 0.1))} 
              className="h-7 w-7 rounded-lg cursor-pointer hover:bg-muted dark:hover:bg-white/[0.06] text-muted-foreground dark:text-zinc-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            
            <button 
              onClick={handleResetZoom}
              className="text-[10px] font-mono font-bold px-2 text-foreground dark:text-zinc-200 hover:text-primary transition-colors cursor-pointer"
              title="Reset Zoom to 100%"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setZoomScale(s => Math.min(1.4, s + 0.1))} 
              className="h-7 w-7 rounded-lg cursor-pointer hover:bg-muted dark:hover:bg-white/[0.06] text-muted-foreground dark:text-zinc-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>

            <div className="h-4 w-px bg-border dark:bg-white/10 mx-1" />

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleFitToView} 
              className="h-7 px-2 rounded-lg cursor-pointer hover:bg-muted dark:hover:bg-white/[0.06] text-xs font-semibold text-indigo-600 dark:text-purple-300 gap-1"
              title="Fit Selected Tree to Screen"
            >
              <Maximize2 className="w-3 h-3" /> Fit
            </Button>
          </div>

          <Badge className="bg-primary/10 border border-primary/20 text-primary dark:bg-purple-500/15 dark:text-purple-300 font-bold h-9 flex items-center px-3.5 text-xs uppercase tracking-wider rounded-xl shadow-xs">
            Active Workforce: {activeEmployeesCount}
          </Badge>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchData} 
            className="h-9 w-9 rounded-xl border-border dark:border-white/10 bg-card/80 dark:bg-[#0e101e]/80 backdrop-blur-xl cursor-pointer hover:bg-muted dark:hover:bg-white/[0.06] text-muted-foreground dark:text-zinc-300"
            title="Refresh Hierarchy Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* SENIOR / MANAGER Selector Card */}
      <div className="bg-card/90 dark:bg-[#0e101e]/80 backdrop-blur-2xl p-5 border border-border/80 dark:border-white/10 rounded-2xl shadow-[0_4px_20px_rgba(23,32,51,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-purple-400" />
            Senior / Manager
          </label>
          <div className="relative">
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="w-full h-12 pl-4 pr-10 bg-background/70 dark:bg-white/[0.04] text-foreground dark:text-white border border-border dark:border-white/15 rounded-xl text-sm font-semibold shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer transition-all"
            >
              <option value="" disabled>Select a senior or manager...</option>
              {allManagers.map((mgr) => {
                const dept = mgr.department?.name || departmentsMap[mgr.departmentId || ''] || 'General';
                const desg = mgr.designation?.title || designationsMap[mgr.designationId || ''] || 'Manager';
                const reportsCount = mgr.children ? mgr.children.length : 0;
                return (
                  <option key={mgr._id} value={mgr._id} className="bg-card dark:bg-[#121426] text-foreground dark:text-white py-2">
                    {mgr.firstName} {mgr.lastName} • {desg} • {dept} ({reportsCount} {reportsCount === 1 ? 'direct report' : 'direct reports'})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="absolute right-3.5 top-3.5 w-5 h-5 text-muted-foreground dark:text-zinc-400 pointer-events-none" />
          </div>
        </div>

        {/* Selected Manager Subtree Context Metrics */}
        {currentSelectedManagerNode && (
          <div className="flex items-center justify-between pt-2 border-t border-border/40 dark:border-white/5 text-xs text-muted-foreground dark:text-zinc-400 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground dark:text-white">
                {currentSelectedManagerNode.firstName} {currentSelectedManagerNode.lastName}
              </span>
              <span className="text-muted-foreground/60">•</span>
              <span>{currentSelectedManagerNode.designation?.title || designationsMap[currentSelectedManagerNode.designationId || ''] || 'Manager'}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-indigo-50/80 dark:bg-purple-950/40 text-indigo-700 dark:text-purple-300 font-medium text-[11px] border border-indigo-200/60 dark:border-purple-800/30">
                {directReportsCount} Direct {directReportsCount === 1 ? 'Report' : 'Reports'}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-muted/60 dark:bg-white/[0.05] text-foreground dark:text-zinc-300 font-medium text-[11px] border border-border/60 dark:border-white/10">
                {totalSubtreeEmployeesCount} Total in Tree
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Search Input Bar for Current Tree */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card/90 dark:bg-[#0e101e]/80 backdrop-blur-2xl p-4 border border-border/80 dark:border-white/10 rounded-2xl shadow-[0_4px_20px_rgba(23,32,51,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground dark:text-zinc-400" />
          <Input
            placeholder="Search within this management tree..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10.5 bg-background/50 dark:bg-white/[0.03] border-border dark:border-white/15 rounded-xl text-sm text-foreground dark:text-white focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {searchQuery && (
          <Button 
            variant="ghost" 
            onClick={() => setSearchQuery('')}
            className="h-10.5 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white cursor-pointer"
          >
            Clear Search
          </Button>
        )}
      </div>

      {/* Hierarchy Canvas Box */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-28 space-y-4 bg-card/60 dark:bg-[#0e101e]/60 border border-border/80 dark:border-white/10 rounded-2xl backdrop-blur-xl">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground dark:text-zinc-400 font-medium">Building senior reporting hierarchy...</p>
        </div>
      ) : !currentSelectedManagerNode ? (
        <div className="text-center py-28 bg-card/60 dark:bg-[#0e101e]/60 border border-border/80 dark:border-white/10 rounded-2xl shadow-xl backdrop-blur-xl">
          <Users className="w-12 h-12 text-muted-foreground/50 dark:text-zinc-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground dark:text-white">Select a Senior or Manager</p>
          <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1">
            Choose a senior manager from the dropdown above to visualize their complete reporting tree.
          </p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="bg-card/40 dark:bg-[#0e101e]/60 border border-border/80 dark:border-white/10 rounded-2xl p-6 sm:p-12 shadow-2xl overflow-x-auto min-h-[620px] flex items-start justify-center relative backdrop-blur-xl transition-all duration-200"
        >
          {/* Grid Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
          
          <div 
            ref={contentRef}
            className="flex flex-col items-center justify-start min-w-max p-6 transition-transform duration-200 origin-top z-10"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {renderNodeTree(currentSelectedManagerNode, true)}
          </div>
        </div>
      )}
    </div>
  );
}

