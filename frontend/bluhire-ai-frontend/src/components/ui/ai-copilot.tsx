'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
  actions?: { label: string; onClick: () => void }[];
}

export function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "Hi, I am your BluHire AI Assistant. How can I help you optimize your workforce, analyze retention, or resolve administrative actions today?",
      timestamp: new Date(),
      actions: [
        {
          label: "Analyze Attrition Risk",
          onClick: () => handleSuggestedPrompt("Analyze attrition risk for the Engineering team.")
        },
        {
          label: "Designation Level Upgrades",
          onClick: () => handleSuggestedPrompt("Map promotion path requirements for L2 to L3.")
        },
        {
          label: "Skill Gap Identification",
          onClick: () => handleSuggestedPrompt("Identify gaps in the Product Design team.")
        }
      ]
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSuggestedPrompt = (prompt: string) => {
    setInput('');
    sendMessage(prompt);
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let aiText = "I have scanned the system database. Based on recent performance appraisals and attendance tracking, overall productivity is up 12% this quarter. Let me know if you'd like a specific breakdown.";
      let actions: { label: string; onClick: () => void }[] = [];

      const query = textToSend.toLowerCase();
      if (query.includes('attrition') || query.includes('risk')) {
        aiText = "AI Workforce Insights Alert: We detected a moderate attrition risk (45%) in the Engineering department, primarily driven by long tenure at current designation (average 2.4 years without level changes). Suggesting proactive review.";
        actions = [
          {
            label: "Open Retention Recommendations",
            onClick: () => alert("Initiating proactive review: engineering retention recommendation report generated.")
          }
        ];
      } else if (query.includes('promotion') || query.includes('level') || query.includes('l2')) {
        aiText = "Career Path Mapping: L2 (Senior Associate) to L3 (Lead Specialist) requires a minimum performance rating of 4.2/5.0 and leadership certification. Currently, 3 employees are eligible.";
      } else if (query.includes('gap') || query.includes('skill')) {
        aiText = "Skill Gap Analyzer: Engineering shows strong frontend expertise (92%) but has a identified 18% competency gap in Distributed Systems Architecture and cloud optimization.";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiText,
          timestamp: new Date(),
          actions: actions.length > 0 ? actions : undefined
        }
      ]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 focus:outline-none flex items-center justify-center cursor-pointer border border-white/20"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bot className="w-6 h-6 animate-pulse" />
        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-300" />
      </motion.button>

      {/* Copilot Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="fixed bottom-24 right-6 w-96 h-[500px] z-50 rounded-2xl glass glow-accent shadow-2xl flex flex-col overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-transparent p-4 border-b border-zinc-200/50 dark:border-zinc-800/50 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-white flex items-center">
                    AI HR Copilot <Sparkles className="w-3.5 h-3.5 text-amber-400 ml-1" />
                  </h3>
                  <span className="text-[10px] text-emerald-500 font-medium">Online & ready</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 select-none">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                        : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 border border-zinc-200/30 dark:border-zinc-700/30'
                    }`}
                  >
                    {msg.text}
                    {msg.actions && (
                      <div className="mt-2.5 space-y-1.5 pt-1.5 border-t border-zinc-200/50 dark:border-zinc-700/50">
                        {msg.actions.map((act, ai) => (
                          <button
                            key={ai}
                            onClick={act.onClick}
                            className="w-full text-left px-2 py-1.5 rounded bg-white dark:bg-zinc-900 text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-zinc-200/80 dark:border-zinc-800/80 transition-colors flex items-center justify-between"
                          >
                            {act.label} <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-zinc-100 dark:bg-zinc-800/60 text-zinc-400 rounded-xl p-3 text-xs flex space-x-1 items-center">
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 flex space-x-2">
              <Input
                placeholder="Ask about attrition, reviews, skills..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                className="flex-1 text-xs h-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800/80"
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                className="w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
