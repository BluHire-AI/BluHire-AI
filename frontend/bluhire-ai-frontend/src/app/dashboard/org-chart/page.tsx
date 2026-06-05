'use client';

import React, { useState, useEffect } from 'react';
import { employeeService } from '@/services/employee.service';
import { departmentService, Department } from '@/services/department.service';
import { designationService, Designation } from '@/services/designation.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Network, ChevronDown, ChevronRight, Search, ZoomIn, ZoomOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

interface HierarchyNode {
  _id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  email: string;
  designationId: string;
  departmentId: string;
  profileImage?: string;
  children?: HierarchyNode[];
}

export default function OrgChartPage() {
  const [root, setRoot] = useState<HierarchyNode | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [departmentsMap, setDepartmentsMap] = useState<Record<string, string>>({});
  const [designationsMap, setDesignationsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Interactivity States
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomScale, setZoomScale] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hierarchyRes, deptsRes, desgsRes] = await Promise.all([
        employeeService.getHierarchy(),
        departmentService.getActive(),
        designationService.getAll(),
      ]);

      setRoot(hierarchyRes.rootNode);
      setTotalEmployees(hierarchyRes.totalEmployees);

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

      if (hierarchyRes.rootNode) {
        const initialExpanded: Record<string, boolean> = {
          [hierarchyRes.rootNode._id]: true,
        };
        hierarchyRes.rootNode.children?.forEach((child: HierarchyNode) => {
          initialExpanded[child._id] = true;
        });
        setExpandedNodes(initialExpanded);
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

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const isHighlighted = (node: HierarchyNode) => {
    if (!searchQuery.trim()) return false;
    const name = `${node.firstName} ${node.lastName}`.toLowerCase();
    const code = node.employeeCode.toLowerCase();
    const title = (designationsMap[node.designationId] || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || code.includes(searchQuery.toLowerCase()) || title.includes(searchQuery.toLowerCase());
  };

  const renderNode = (node: HierarchyNode) => {
    const isExpanded = expandedNodes[node._id];
    const hasChildren = node.children && node.children.length > 0;
    const deptName = departmentsMap[node.departmentId] || 'Operations';
    const desgTitle = designationsMap[node.designationId] || 'Team Lead';
    const highlighted = isHighlighted(node);

    // Color code department badges dynamically
    const getDeptColor = (dept: string) => {
      const lower = dept.toLowerCase();
      if (lower.includes('tech') || lower.includes('eng')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      if (lower.includes('design') || lower.includes('product')) return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      if (lower.includes('hr') || lower.includes('people')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    };

    return (
      <div key={node._id} className="flex flex-col items-center">
        {/* Card Component */}
        <div className="relative flex flex-col items-center">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`relative flex flex-col items-center rounded-2xl p-[1px] transition-all duration-300 ${
              highlighted 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/30' 
                : 'bg-zinc-200/50 dark:bg-zinc-800/80 hover:bg-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            <Card className="w-60 border-0 shadow-sm z-10 bg-white dark:bg-[#0e1422] rounded-2xl overflow-hidden">
              <CardContent className="p-4.5 flex flex-col items-center text-center space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {node.firstName.charAt(0)}{node.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-zinc-900 dark:text-white leading-snug">
                    {node.firstName} {node.lastName}
                  </h3>
                  <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">{desgTitle}</p>
                  <Badge variant="outline" className={`text-[9px] px-2 py-0 mt-1.5 font-bold ${getDeptColor(deptName)}`}>
                    {deptName}
                  </Badge>
                </div>
                
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleNode(node._id)}
                    className="flex items-center justify-center w-6 h-6 rounded-full border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
              </CardContent>
            </Card>
          </motion.div>
          {hasChildren && isExpanded && (
            <div className="w-0.5 h-8 bg-zinc-200/60 dark:bg-zinc-800/60" />
          )}
        </div>

        {/* Render Children Recursively */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative flex gap-8 pt-4"
            >
              {/* Connector line over children */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-15rem)] h-0.5 bg-zinc-200/60 dark:bg-zinc-800/60" />
              
              {node.children!.map((child) => (
                <div key={child._id} className="relative flex flex-col items-center">
                  {/* Connector line down to child */}
                  <div className="absolute -top-4 w-0.5 h-4 bg-zinc-200/60 dark:bg-zinc-800/60" />
                  {renderNode(child)}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Organization Hierarchy</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm font-medium">Interactive overview of operational reporting lines and hierarchy structure.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Zoom controls */}
          <div className="flex items-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 p-0.5 bg-white dark:bg-[#0e1422]">
            <Button variant="ghost" size="icon" onClick={() => setZoomScale(s => Math.max(0.6, s - 0.1))} className="h-8 w-8 rounded-lg">
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] font-bold px-2 text-zinc-500">{Math.round(zoomScale * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoomScale(s => Math.min(1.4, s + 0.1))} className="h-8 w-8 rounded-lg">
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-bold border-blue-100 dark:border-blue-800 h-8 flex items-center px-3 text-[10px] uppercase tracking-wide">
            Total Workforce: {totalEmployees}
          </Badge>
          <Button variant="outline" size="icon" onClick={fetchData} className="h-8 w-8 rounded-xl border-zinc-200/80 dark:border-zinc-800/80 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Advanced search filter bar */}
      <div className="flex gap-4 bg-white dark:bg-[#0e1422] p-4 border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Highlight colleagues or manager branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-zinc-50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80 rounded-xl text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Reconstructing rendering tree branches...</p>
        </div>
      ) : !root ? (
        <div className="text-center py-20 bg-white dark:bg-[#0e1422] border rounded-2xl border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
          <Network className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">No reporting hierarchy configured yet.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0e1422] border border-zinc-200/60 dark:border-zinc-800/80 rounded-2xl p-10 shadow-sm overflow-x-auto min-h-[550px] flex items-center justify-center">
          <div 
            className="flex justify-center min-w-max p-4 transition-transform duration-200"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {renderNode(root)}
          </div>
        </div>
      )}
    </div>
  );
}
