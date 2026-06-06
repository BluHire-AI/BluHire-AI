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
      if (lower.includes('tech') || lower.includes('eng')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      if (lower.includes('design') || lower.includes('product')) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      if (lower.includes('hr') || lower.includes('people')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      return 'bg-zinc-500/10 text-muted-foreground border-border/40';
    };

    return (
      <div key={node._id} className="flex flex-col items-center">
        {/* Card Component */}
        <div className="relative flex flex-col items-center">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className={`relative flex flex-col items-center rounded-2xl p-[1px] transition-all duration-300 ${
              highlighted 
                ? 'bg-gradient-to-r from-primary to-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-[1.03]' 
                : 'bg-border/60 hover:bg-border/90'
            }`}
          >
            <Card className="w-60 border-0 shadow-2xl z-10 bg-card/90 backdrop-blur-xl rounded-2xl overflow-hidden">
              <CardContent className="p-5 flex flex-col items-center text-center space-y-3">
                {/* Profile Image/Placeholder */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-indigo-600/10 border border-primary/30 text-primary-foreground flex items-center justify-center font-extrabold text-sm shadow-[0_0_12px_rgba(99,102,241,0.1)]">
                  {node.firstName.charAt(0)}{node.lastName.charAt(0)}
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-extrabold text-xs text-foreground leading-snug">
                    {node.firstName} {node.lastName}
                  </h3>
                  <p className="text-[10px] font-semibold text-muted-foreground">{desgTitle}</p>
                  <div className="pt-1">
                    <Badge variant="outline" className={`text-[9px] font-mono px-2 py-0 border ${getDeptColor(deptName)}`}>
                      {deptName}
                    </Badge>
                  </div>
                </div>
                
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleNode(node._id)}
                    className="flex items-center justify-center w-6 h-6 rounded-full border border-border bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors mt-1"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
              </CardContent>
            </Card>
          </motion.div>
          {hasChildren && isExpanded && (
            <div className="w-[1px] h-8 bg-gradient-to-b from-primary/30 to-indigo-500/20" />
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
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-15rem)] h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              
              {node.children!.map((child) => (
                <div key={child._id} className="relative flex flex-col items-center">
                  {/* Connector line down to child */}
                  <div className="absolute -top-4 w-[1px] h-4 bg-gradient-to-b from-primary/30 to-indigo-500/20" />
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
    <div className="space-y-6 select-none p-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Organization Hierarchy
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Interactive overview of operational reporting lines and hierarchy structure.
          </p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Zoom controls */}
          <div className="flex items-center rounded-xl border border-border p-0.5 bg-card/60 backdrop-blur-md">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setZoomScale(s => Math.max(0.6, s - 0.1))} 
              className="h-8 w-8 rounded-lg cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
            <span className="text-[10px] font-bold px-2 text-muted-foreground font-mono">{Math.round(zoomScale * 100)}%</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setZoomScale(s => Math.min(1.4, s + 0.1))} 
              className="h-8 w-8 rounded-lg cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Badge className="bg-primary/10 border border-primary/20 text-primary font-bold h-8 flex items-center px-3 text-[10px] uppercase tracking-wider rounded-xl">
            Total Workforce: {totalEmployees}
          </Badge>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={fetchData} 
            className="h-8 w-8 rounded-xl border-border bg-card/40 backdrop-blur-md cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Advanced search filter bar */}
      <div className="flex gap-4 bg-card/30 backdrop-blur-xl p-4 border border-border rounded-2xl shadow-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Highlight colleagues or manager branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-background/50 border-border rounded-xl text-sm text-foreground focus:ring-1 focus:ring-primary focus-visible:ring-primary focus-visible:ring-offset-0"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 bg-card/20 border border-border/80 rounded-2xl backdrop-blur-md">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Reconstructing rendering tree branches...</p>
        </div>
      ) : !root ? (
        <div className="text-center py-24 bg-card/20 border border-border/85 rounded-2xl shadow-xl backdrop-blur-md">
          <Network className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No reporting hierarchy configured yet.</p>
        </div>
      ) : (
        <div className="bg-card/20 border border-border rounded-2xl p-10 shadow-2xl overflow-x-auto min-h-[550px] flex items-center justify-center relative backdrop-blur-md">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />
          
          <div 
            className="flex justify-center min-w-max p-4 transition-transform duration-200 z-10"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {renderNode(root)}
          </div>
        </div>
      )}
    </div>
  );
}
