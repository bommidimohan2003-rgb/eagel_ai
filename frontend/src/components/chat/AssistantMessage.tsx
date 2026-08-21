import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, ChevronDown, ChevronRight, Cpu, Sparkles } from 'lucide-react';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { MessageActions } from '@/components/chat/MessageActions';
import { Message } from '@/types';

interface AssistantMessageProps {
  message: Message;
  onRegenerate?: () => void;
}

export function AssistantMessage({ message, onRegenerate }: AssistantMessageProps) {
  const [showThinking, setShowThinking] = useState(false);
  const thinking = message.extra_metadata?.thinking || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-3 md:gap-4 my-6 px-2 md:px-4 group"
    >
      {/* Premium Avatar */}
      <div className="relative mt-0.5 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/40 flex items-center justify-center text-primary shadow-glow transition-transform group-hover:scale-105">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header Tags */}
        <div className="flex items-center gap-2 mb-2 text-xs text-text-muted">
          <span className="font-semibold text-text-primary text-xs tracking-tight">Eagle</span>
          {message.model && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-100 border border-border text-[10px] text-text-secondary font-mono">
              <Cpu className="w-2.5 h-2.5 text-primary" />
              {message.model.replace(/^nvidia\//i, '')}
            </span>
          )}
          {message.token_usage?.total_tokens ? (
            <span className="text-[10px] text-text-muted">
              • {message.token_usage.total_tokens} tokens
            </span>
          ) : null}
        </div>

        {/* Neural Reasoning Accordion */}
        {thinking && (
          <div className="mb-3.5 rounded-2xl border border-accent/20 bg-accent/[0.03] overflow-hidden backdrop-blur-sm">
            <button
              onClick={() => setShowThinking(!showThinking)}
              className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              <span className="flex items-center gap-2 font-mono text-[11px] font-medium">
                <Bot className="w-3.5 h-3.5" />
                Internal Reasoning Chain
              </span>
              {showThinking ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {showThinking && (
              <div className="px-3.5 pb-3 text-xs text-text-secondary font-mono border-t border-accent/10 pt-2.5 whitespace-pre-wrap leading-relaxed">
                {thinking}
              </div>
            )}
          </div>
        )}

        {/* Message Body */}
        <div className="relative">
          <MarkdownRenderer content={message.content} />
        </div>

        {/* Footer Actions */}
        <MessageActions
          content={message.content}
          onRegenerate={onRegenerate}
          isAssistant={true}
        />
      </div>
    </motion.div>
  );
}
