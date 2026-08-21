import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

interface StreamingMessageProps {
  content: string;
  thinkingContent?: string;
  onStop?: () => void;
}

export function StreamingMessage({ content, thinkingContent, onStop }: StreamingMessageProps) {
  const [showThinking, setShowThinking] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 md:gap-4 my-6 px-2 md:px-4"
    >
      {/* Bot Avatar with Glowing Aura */}
      <div className="relative mt-0.5 flex-shrink-0">
        <div className="absolute inset-0 rounded-xl bg-primary/30 blur-md animate-pulse" />
        <div className="relative w-8 h-8 rounded-xl bg-surface-100 border border-primary/50 flex items-center justify-center text-primary shadow-glow">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 text-xs text-text-muted">
          <span className="font-semibold text-text-primary text-xs tracking-tight">Eagle</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/30 text-[10px] font-semibold animate-pulse shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
            Synthesizing...
          </span>
        </div>

        {/* Live Thinking Stream */}
        {thinkingContent && (
          <div className="mb-3.5 rounded-2xl border border-accent/30 bg-accent/[0.04] overflow-hidden backdrop-blur-sm shadow-sm">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              <span className="flex items-center gap-2 font-mono text-[11px] font-medium">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
                Thinking in Progress...
              </span>
              {showThinking ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {showThinking && (
              <div className="px-3.5 pb-3 text-xs text-text-secondary font-mono border-t border-accent/15 pt-2.5 whitespace-pre-wrap leading-relaxed">
                {thinkingContent}
              </div>
            )}
          </div>
        )}

        {/* Streaming tokens or Typing indicator */}
        {content ? (
          <div className="relative">
            <MarkdownRenderer content={content} />
            <span className="inline-block w-2 h-4 ml-1 bg-primary rounded-sm shadow-glow animate-pulse align-middle" />
          </div>
        ) : (
          <TypingIndicator />
        )}
      </div>
    </motion.div>
  );
}
