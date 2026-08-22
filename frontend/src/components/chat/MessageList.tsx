import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { StreamingMessage } from '@/components/chat/StreamingMessage';
import { Message } from '@/types';

interface MessageListProps {
  messages: Message[];
  streamingContent: string;
  thinkingContent?: string;
  isStreaming: boolean;
  onRegenerate?: () => void;
  onEditSubmit?: (newContent: string) => void;
  onSelectPrompt?: (prompt: string) => void;
  onStop?: () => void;
}

export function MessageList({
  messages,
  streamingContent,
  thinkingContent,
  isStreaming,
  onRegenerate,
  onEditSubmit,
  onSelectPrompt,
  onStop,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [userScrolledUp, setUserScrolledUp] = useState(false);

  // Monitor scroll position
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    setShowScrollTop(scrollTop > 250);
    setShowScrollBottom(distanceFromBottom > 150);
    setUserScrolledUp(distanceFromBottom > 150);
  }, []);

  // Smart auto-scroll: only auto-scroll if user hasn't explicitly scrolled up
  useEffect(() => {
    if (!userScrolledUp) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, thinkingContent, userScrolledUp]);

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    setUserScrolledUp(false);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col">
      {/* Scrollable Message Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 md:px-6 py-4 space-y-2 scrollbar-thin"
      >
        <div className="max-w-4xl mx-auto relative min-h-full">
          <div ref={topRef} className="h-1" />

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onRegenerate={onRegenerate}
              onEditSubmit={onEditSubmit}
              onSelectPrompt={onSelectPrompt}
            />
          ))}

          {isStreaming && (
            <StreamingMessage
              content={streamingContent}
              thinkingContent={thinkingContent}
              onStop={onStop}
            />
          )}

          <div ref={bottomRef} className="h-6" />
        </div>
      </div>

      {/* Floating Scroll Controls */}
      <div className="absolute right-4 md:right-8 bottom-3 z-30 flex flex-col items-center gap-2 pointer-events-none">
        {/* Scroll To Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="pointer-events-auto p-2.5 rounded-full bg-surface-100 hover:bg-surface-50 text-text-secondary hover:text-text-primary border border-border shadow-glass-lg backdrop-blur-md transition-colors flex items-center justify-center group"
              title="Scroll to top"
            >
              <ChevronUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scroll To Bottom Button */}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={scrollToBottom}
              className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-100 hover:bg-surface-50 text-text-primary border border-primary/40 shadow-glass-lg backdrop-blur-md transition-all group"
              title="Scroll to bottom"
            >
              {isStreaming ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  Generating...
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-text-secondary group-hover:text-text-primary">
                  Latest
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-primary group-hover:translate-y-0.5 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
