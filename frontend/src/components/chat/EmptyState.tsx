import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  ChevronUp,
  Code2,
  Cpu,
  FileCode,
  FileText,
  Keyboard,
  Layers,
  Search,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

interface PromptCategory {
  id: string;
  name: string;
  icon: React.ElementType;
}

const CATEGORIES: PromptCategory[] = [
  { id: 'all', name: 'All Prompts', icon: Sparkles },
  { id: 'code', name: 'Software & Code', icon: Code2 },
  { id: 'arch', name: 'System Design', icon: Layers },
  { id: 'analysis', name: 'Writing & Analysis', icon: FileText },
  { id: 'data', name: 'Data & Reasoning', icon: Terminal },
];

const PROMPT_SUGGESTIONS = [
  {
    category: 'code',
    title: 'Explain Event Loop Internals',
    description: 'How do Python async/await, tasks, and the OS event loop operate under the hood?',
    prompt: 'Explain how Python async/await and the event loop work under the hood with clear architecture diagrams and concise code examples.',
    tag: 'Python / Async',
  },
  {
    category: 'code',
    title: 'Code Audit & Concurrency Review',
    description: 'Analyze potential race conditions, memory leaks, and performance bottlenecks.',
    prompt: 'Can you review this code for concurrency race conditions, memory leaks, and performance optimizations?',
    tag: 'Refactoring',
  },
  {
    category: 'arch',
    title: 'Distributed System Architecture',
    description: 'Design a resilient event-driven architecture with caching, queues, and failover.',
    prompt: 'Help me design a production-grade distributed microservices architecture with Redis caching, PostgreSQL, and event streaming.',
    tag: 'System Design',
  },
  {
    category: 'arch',
    title: 'AI Agent & Tool Orchestration',
    description: 'Plan a structured multi-step execution pipeline with state tracking and vector memory.',
    prompt: 'Design a scalable AI assistant pipeline incorporating Server-Sent Events, pgvector long-term memory, and background task execution.',
    tag: 'AI Infrastructure',
  },
  {
    category: 'analysis',
    title: 'Technical Document Synthesis',
    description: 'Extract core architectural trade-offs and decision points from reference materials.',
    prompt: 'Help me analyze and synthesize key architectural trade-offs between monolithic and decoupled micro-frontends.',
    tag: 'Synthesis',
  },
  {
    category: 'data',
    title: 'SQL Schema & Query Optimization',
    description: 'Optimize indexing strategies, composite keys, and execution plans for high throughput.',
    prompt: 'How should I structure database indexes and query plans in MySQL/PostgreSQL for a table handling millions of time-series records?',
    tag: 'Database & SQL',
  },
];

const CAPABILITIES = [
  {
    icon: Cpu,
    title: 'Eagle 3 Ultra Engine',
    description: 'High-parameter neural reasoning optimized for complex multi-step technical problem solving.',
  },
  {
    icon: Zap,
    title: 'Real-Time SSE Streaming',
    description: 'Ultra-low latency Server-Sent Events delivering token streaming and intermediate reasoning traces.',
  },
  {
    icon: Brain,
    title: 'Persistent Memory Vault',
    description: 'Autonomous extraction and retention of developer preferences and project context across sessions.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Server-Side Execution',
    description: 'API keys and credentials remain safely encapsulated on the backend service layer.',
  },
];

export function EmptyState({ onSelectPrompt }: EmptyStateProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const filteredPrompts = selectedCategory === 'all'
    ? PROMPT_SUGGESTIONS
    : PROMPT_SUGGESTIONS.filter((p) => p.category === selectedCategory);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setShowScrollTop(scrollContainerRef.current.scrollTop > 200);
    }
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-8 py-6 relative"
    >
      <div className="max-w-4xl mx-auto flex flex-col items-center min-h-full pb-8">
        {/* Top Hero Section */}
        <div className="text-center max-w-2xl mx-auto pt-4 md:pt-8 mb-8">
          {/* Clean Brand Mark */}
          <div className="inline-flex items-center justify-center mb-5">
            <div className="w-12 h-12 rounded-2xl bg-surface-100 border border-primary/30 flex items-center justify-center text-primary shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text-primary tracking-tight mb-2.5">
            Personal AI Workspace
          </h1>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-lg mx-auto">
            A private, high-performance workspace for software architecture, reasoning, analysis, and execution.
          </p>
        </div>

        {/* Category Selection Filter Pills */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-start md:justify-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                      : 'bg-surface-100 text-text-secondary hover:text-text-primary hover:bg-surface-50 border border-border'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggested Prompts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full mb-12">
          {filteredPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group text-left p-4 rounded-2xl bg-surface-100 hover:bg-surface-50 border border-border hover:border-primary/40 transition-all duration-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-surface-200 text-text-muted border border-border">
                    {item.tag}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Capabilities Section */}
        <div className="w-full pt-8 border-t border-border mb-10">
          <div className="text-center mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Workspace Capabilities
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {CAPABILITIES.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-surface-100 border border-border flex flex-col"
                >
                  <div className="p-2 rounded-xl bg-surface-200 text-primary w-fit mb-3 border border-border">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-text-primary mb-1">
                    {cap.title}
                  </h4>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {cap.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard Shortcuts Helper Bar */}
        <div className="w-full p-4 rounded-2xl bg-surface-100 border border-border flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="font-medium text-text-primary text-xs">Quick Shortcuts</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-200 border border-border font-mono text-[10px] text-text-secondary">Ctrl+Shift+O</kbd> New Chat
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-200 border border-border font-mono text-[10px] text-text-secondary">Enter</kbd> Send
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-200 border border-border font-mono text-[10px] text-text-secondary">Shift+Enter</kbd> Newline
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-200 border border-border font-mono text-[10px] text-text-secondary">Esc</kbd> Stop Generation
            </span>
          </div>
        </div>
      </div>

      {/* Floating Scroll To Top Button on Home Page */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed right-6 bottom-24 z-30 p-2.5 rounded-full bg-surface-100 hover:bg-surface-50 text-text-secondary hover:text-text-primary border border-border shadow-glass transition-colors"
            title="Scroll to top"
          >
            <ChevronUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
