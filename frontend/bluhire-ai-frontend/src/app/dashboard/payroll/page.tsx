'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { payrollService } from '@/services/payroll.service';
import { copilotService } from '@/services/copilot.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Coins, TrendingUp, RefreshCw, AlertCircle, Bot, Send, 
  Sparkles, DollarSign, Wallet, ShieldAlert, FileText, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const PAID_STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PAID: { label: 'Paid', cls: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  PENDING: { label: 'Pending', cls: 'bg-amber-500/10 text-amber-300 border-amber-500/20' }
};

function fmtAmt(val: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
}

export default function PayrollDashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadError, setLoadError] = useState(false);
  
  // Employee personal dashboard states
  const [employeeHistory, setEmployeeHistory] = useState<any[]>([]);

  // AI Assistant states
  const [aiMessage, setAiMessage] = useState('');
  const [aiHistory, setAiHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    { role: 'assistant', text: 'Hi! I am your HRMinds AI Payroll Assistant. Ask me to "Explain my salary breakdown", "Predict payroll cost", or check "detect payroll anomalies"!' }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  const isHR = user?.role === 'HR_RECRUITER' || user?.role === 'MANAGEMENT_ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      if (isHR) {
        const stats = await payrollService.getAnalytics();
        setAnalytics(stats);
      } else {
        const hist = await payrollService.getHistory();
        setEmployeeHistory(hist || []);
      }
    } catch (err) {
      console.error('Failed to load payroll details', err);
      toast.error('Failed to load payroll dashboard.');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [isHR]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiHistory]);

  const handleSendAiMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim()) return;

    const userText = aiMessage;
    setAiMessage('');
    setAiHistory(prev => [...prev, { role: 'user', text: userText }]);
    setAiLoading(true);

    try {
      let assistantText = '';
      setAiHistory(prev => [...prev, { role: 'assistant', text: 'Analyzing payroll tables...' }]);

      await copilotService.chatStream(
        { message: userText },
        (event) => {
          if (event.type === 'token' && event.content) {
            assistantText += event.content;
            setAiHistory(prev => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', text: assistantText };
              return updated;
            });
          }
        }
      );
    } catch (err) {
      console.error('AI chat failed', err);
      setAiHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', text: 'Failed to complete analysis. Please try again.' };
        return updated;
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    setAiMessage(prompt);
  };

  // Render Employee Self Service
  const renderEmployeeView = () => {
    const latestRun = employeeHistory[0];

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salary card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-zinc-950/60 backdrop-blur-2xl border-white/10 shadow-2xl relative overflow-hidden rounded-[24px]">
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl" />
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-xs font-bold flex items-center gap-2 text-indigo-300 uppercase tracking-wider">
                <Wallet className="w-4 h-4 text-purple-400 animate-pulse" />
                Latest Net Compensation
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-400">Calculated payout for recent cycle</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {latestRun ? (
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-4xl font-black text-white">{fmtAmt(latestRun.netSalary)}</h3>
                    <p className="text-xs text-indigo-300 mt-1.5 font-semibold">
                      Period: {latestRun.month}/{latestRun.year} • Status: {latestRun.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="bg-white/5 hover:bg-white/10 text-white border-white/10 rounded-xl cursor-pointer" onClick={() => window.location.href='/dashboard/payroll/payslips'}>
                      View payslip
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-550 font-semibold text-xs">
                  No payroll logs calculated yet for your account.
                </div>
              )}

              {latestRun && (
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5 text-xs font-bold text-indigo-350 uppercase tracking-wider">
                  <div>
                    <p className="text-[10px] text-zinc-500">Gross Salary</p>
                    <p className="text-lg font-bold text-white mt-1">{fmtAmt(latestRun.grossSalary)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500">Deductions</p>
                    <p className="text-lg font-bold text-white mt-1">{fmtAmt(latestRun.deductions)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500">Tax (TDS)</p>
                    <p className="text-lg font-bold text-white mt-1">{fmtAmt(latestRun.tax)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Earnings History Table */}
          <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 px-6 py-4">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Salary History</CardTitle>
              <CardDescription className="text-[10px] text-zinc-400 font-medium">Review payments and downloads trends</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {employeeHistory.length === 0 ? (
                <div className="p-8 text-center text-zinc-550 font-semibold text-xs">
                  No earnings logs recorded.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5 text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
                        <th className="p-4 pl-6">Pay Period</th>
                        <th className="p-4">Gross Salary</th>
                        <th className="p-4">Taxes</th>
                        <th className="p-4">Deductions</th>
                        <th className="p-4 font-black">Net Payout</th>
                        <th className="p-4 pr-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {employeeHistory.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/5 border-b border-white/5 transition-colors">
                          <td className="p-4 pl-6 font-bold text-white">{item.month}/{item.year}</td>
                          <td className="p-4 text-zinc-300">{fmtAmt(item.grossSalary)}</td>
                          <td className="p-4 text-rose-400 font-semibold">{fmtAmt(item.tax)}</td>
                          <td className="p-4 text-rose-400 font-semibold">{fmtAmt(item.deductions)}</td>
                          <td className="p-4 font-extrabold text-emerald-400">{fmtAmt(item.netSalary)}</td>
                          <td className="p-4 pr-6">
                            <Badge variant="outline" className={`text-[9px] font-bold border ${(PAID_STATUS_BADGE[item.status] || PAID_STATUS_BADGE.PENDING).cls}`}>
                              {(PAID_STATUS_BADGE[item.status] || PAID_STATUS_BADGE.PENDING).label}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI card */}
        <div className="lg:col-span-1">
          {renderAiCard()}
        </div>
      </div>
    );
  };

  const renderAiCard = () => {
    return (
      <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden h-[480px] flex flex-col">
        <CardHeader className="bg-white/5 border-b border-white/5 px-6 py-4 flex flex-row items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <div>
            <CardTitle className="text-xs uppercase tracking-wider font-bold text-white">
              AI Payroll Assistant
            </CardTitle>
            <CardDescription className="text-[10px] text-zinc-400 mt-0.5">Anomaly checks and metrics explanation.</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4 overflow-hidden bg-white/[0.01]">
          {/* Chats */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs custom-scrollbar">
            {aiHistory.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-xl max-w-[85%] font-medium text-xs ${
                msg.role === 'user'
                  ? 'bg-gradient-to-tr from-violet-600/90 to-indigo-600/90 text-white border border-white/10 ml-auto shadow-md'
                  : 'bg-white/[0.03] border border-white/5 text-white/90 mr-auto'
              }`}>
                {msg.text}
              </div>
            ))}
            {aiLoading && (
              <div className="text-[10px] text-zinc-400 italic flex items-center gap-1.5 p-2 bg-white/[0.02] border border-white/5 rounded-xl max-w-[85%]">
                <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
                Copilot is calculating metrics...
              </div>
            )}
            <div ref={aiChatEndRef} />
          </div>

          {/* Quick prompts */}
          <div className="pt-2 pb-1 flex flex-wrap gap-1.5 border-t border-white/5">
            {[
              isHR ? 'predict payroll cost' : 'Explain my salary breakdown',
              isHR ? 'detect payroll anomalies' : 'What are my deductions?'
            ].map(prompt => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSuggestionClick(prompt)}
                className="text-[9px] font-bold text-indigo-300 border border-white/10 rounded-full px-2.5 py-1 bg-white/[0.02] hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Form input */}
          <form onSubmit={handleSendAiMessage} className="pt-2 flex gap-2">
            <Input
              value={aiMessage}
              onChange={e => setAiMessage(e.target.value)}
              placeholder="Ask copilot about salary breakdown..."
              className="rounded-xl text-xs h-9 flex-1 bg-white/5 border-white/5 text-white"
              disabled={aiLoading}
            />
            <Button type="submit" disabled={aiLoading} className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl h-9 w-9 p-0 flex items-center justify-center shadow-lg cursor-pointer shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  };

  // Render HR Dashboard view
  const renderHRView = () => {
    if (!analytics) return <div className="p-8 text-center text-zinc-400">Failed to load analytics details.</div>;

    const cards = [
      { label: 'Total Monthly Payroll', val: fmtAmt(analytics.costHistory?.[analytics.costHistory.length - 1]?.cost || 0), sub: 'latest paid cycle cost', icon: DollarSign, color: 'text-purple-400', border: 'border-purple-500/20' },
      { label: 'Average Net Salary', val: fmtAmt(analytics.avgSalary || 0), sub: 'average payout per employee', icon: Wallet, color: 'text-blue-400', border: 'border-blue-500/20' },
      { label: 'Total Overtime Costs', val: fmtAmt(analytics.totalOvertimeCost || 0), sub: 'hours worked payouts', icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-500/20' },
      { label: 'Total Monthly Bonuses', val: fmtAmt(analytics.totalBonusCost || 0), sub: 'referrals and festival bonus', icon: Sparkles, color: 'text-amber-400', border: 'border-amber-500/20' },
      { label: 'Total Monthly Deductions', val: fmtAmt(analytics.totalDeductionCost || 0), sub: 'tax / penalties deducted', icon: ShieldAlert, color: 'text-rose-455', border: 'border-rose-500/20' }
    ];

    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {cards.map(card => (
            <Card key={card.label} className="bg-white/[0.03] border-white/10 shadow-2xl relative overflow-hidden group rounded-[24px]">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-extrabold text-white/45 uppercase tracking-wider">{card.label}</p>
                  <p className="text-xl font-bold text-white mt-1.5">{card.val}</p>
                  <p className="text-[10px] text-white/40 mt-1">{card.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl bg-white/[0.04] border ${card.border} ${card.color} group-hover:bg-white/[0.08] transition-colors shrink-0`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and AI panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 px-6 py-4">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-indigo-400" />
                Monthly Payroll Cost Trend
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-400">Paid cost records across cycles</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {analytics.costHistory?.length === 0 ? (
                <div className="py-24 text-center text-zinc-550 font-semibold text-xs">
                  No completed runs recorded yet. Check Payroll Processing to create runs.
                </div>
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.costHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.1)' }} formatter={v => [fmtAmt(Number(v)), 'Cost']} />
                      <Line type="monotone" dataKey="cost" stroke="#a855f7" strokeWidth={3} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Panel */}
          <div className="lg:col-span-1">
            {renderAiCard()}
          </div>
        </div>

        {/* Lower Row: Dept salaries distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 px-6 py-4">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Department Payroll Distribution</CardTitle>
              <CardDescription className="text-[10px] text-zinc-400">Salary expense allocation by department</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {analytics.departmentDistribution?.length === 0 ? (
                <div className="py-16 text-center text-zinc-550 font-semibold text-xs">
                  No distribution details found.
                </div>
              ) : (
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.departmentDistribution}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                      <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: 'rgba(255,255,255,0.1)' }} formatter={v => [fmtAmt(Number(v)), 'Total Salary']} />
                      <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 px-6 py-4">
              <CardTitle className="text-xs font-bold text-white uppercase tracking-wider">Recent Activities</CardTitle>
              <CardDescription className="text-[10px] text-zinc-400">Action logs for payroll transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {[
                { activity: 'Monthly payroll run generated for June 2026', time: '1 hour ago', badge: 'Run Generated', clr: 'bg-purple-500/10 text-purple-300 border border-purple-500/20' },
                { activity: 'Referral Bonus applied to employee Sampath Korada', time: '2 hours ago', badge: 'Bonus Added', clr: 'bg-amber-500/10 text-amber-300 border border-amber-500/20' },
                { activity: 'Tax slab active configurations updated for FY 2026-27', time: '1 day ago', badge: 'Tax Update', clr: 'bg-blue-500/10 text-blue-300 border border-blue-500/20' },
                { activity: 'Payslip snapshot generated for Employee Ravi Kumar', time: '2 days ago', badge: 'Payslip', clr: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' }
              ].map((act, i) => (
                <div key={i} className="flex justify-between items-start border-b border-white/5 pb-3 last:border-b-0 last:pb-0 font-semibold text-xs">
                  <div className="space-y-1">
                    <p className="text-white">{act.activity}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{act.time}</p>
                  </div>
                  <Badge variant="outline" className={`text-[9px] font-bold px-2 py-0.5 rounded border ${act.clr}`}>{act.badge}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none p-1">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white">
            {isHR ? 'Enterprise Payroll Dashboard' : 'My Payroll Hub'}
          </h2>
          <p className="text-xs text-white/60 mt-1">
            {isHR ? 'Track organizational salary trends and analytics.' : 'View salary breakdowns and payslips history.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="rounded-xl h-10 border-white/10 hover:bg-white/5 text-zinc-300 cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-2xl bg-white/5" />
          <Skeleton className="h-64 w-full rounded-2xl bg-white/5" />
        </div>
      ) : loadError ? (
        <Card className="bg-card/45 backdrop-blur-2xl border-white/5 shadow-2xl rounded-[24px]">
          <CardContent className="p-12 text-center space-y-4 flex flex-col items-center justify-center">
            <div className="p-4 bg-white/5 text-rose-455 rounded-2xl border border-white/10">
              <ShieldAlert className="w-8 h-8 text-rose-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Unable to connect to HRMinds API</h3>
              <p className="text-xs text-white/50 max-w-sm">
                Payroll dashboard metrics and analytics cannot be compiled because the backend service is offline.
              </p>
            </div>
            <Button onClick={loadData} className="bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/10 shadow-lg shadow-indigo-650/10 cursor-pointer h-9 px-4">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" style={{ animationDuration: '3.5s' }} />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      ) : (
        isHR ? renderHRView() : renderEmployeeView()
      )}
    </div>
  );
}
