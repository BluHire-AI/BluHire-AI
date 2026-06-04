'use client';

import React, { useState, useEffect } from 'react';
import { employeeService } from '@/services/employee.service';
import { departmentService, Department } from '@/services/department.service';
import { designationService, Designation } from '@/services/designation.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Network, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  // Expanded Nodes state
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

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

      // Create lookups
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

      // By default expand first few levels
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

  const renderNode = (node: HierarchyNode) => {
    const isExpanded = expandedNodes[node._id];
    const hasChildren = node.children && node.children.length > 0;
    const deptName = departmentsMap[node.departmentId] || 'Department';
    const desgTitle = designationsMap[node.designationId] || 'Designation';

    return (
      <div key={node._id} className="flex flex-col items-center">
        {/* Card Component */}
        <div className="relative flex flex-col items-center">
          <Card className="w-64 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow z-10 bg-white dark:bg-zinc-900">
            <CardContent className="p-4 flex flex-col items-center text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-sm border border-blue-100 dark:border-blue-800">
                {node.firstName.charAt(0)}{node.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                  {node.firstName} {node.lastName}
                </h3>
                <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">{desgTitle}</p>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 mt-1">
                  {deptName}
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-400 font-medium">{node.email}</p>
              
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => toggleNode(node._id)}
                  className="flex items-center justify-center w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              )}
            </CardContent>
          </Card>
          {hasChildren && isExpanded && (
            <div className="w-0.5 h-8 bg-zinc-200 dark:bg-zinc-800" />
          )}
        </div>

        {/* Render Children Recursively */}
        {hasChildren && isExpanded && (
          <div className="relative flex gap-8 pt-4">
            {/* Connector line over children */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-8rem)] h-0.5 bg-zinc-200 dark:bg-zinc-800" />
            
            {node.children!.map((child) => (
              <div key={child._id} className="relative flex flex-col items-center">
                {/* Connector line down to child */}
                <div className="absolute -top-4 w-0.5 h-4 bg-zinc-200 dark:bg-zinc-800" />
                {renderNode(child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Organization Chart</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Interactive overview of reporting lines and structure hierarchy.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 font-bold border-blue-100 dark:border-blue-800">
            Total Workforce: {totalEmployees}
          </Badge>
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading hierarchy tree...</p>
        </div>
      ) : !root ? (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border rounded-xl border-zinc-200 dark:border-zinc-800 shadow-sm">
          <Network className="w-12 h-12 text-zinc-300 mx-auto mb-2" />
          <p className="text-zinc-500 dark:text-zinc-400">Hierarchy tree is empty. Add a CEO first.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm overflow-x-auto min-h-[500px]">
          <div className="flex justify-center min-w-max p-4">
            {renderNode(root)}
          </div>
        </div>
      )}
    </div>
  );
}
