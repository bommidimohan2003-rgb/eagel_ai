import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { EmptyState } from '@/components/chat/EmptyState';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChat } from '@/hooks/useChat';

interface ChatWindowProps {
  activeConversationId: string | null;
  onConversationCreated?: (id: string) => void;
  onTitleGenerated?: (id: string, title: string) => void;
}

export function ChatWindow({
  activeConversationId,
  onConversationCreated,
  onTitleGenerated,
}: ChatWindowProps) {
  const {
    messages,
    streamingContent,
    thinkingContent,
    isStreaming,
    isLoadingMessages,
    error,
    sendMessage,
    stopGeneration,
    regenerateResponse,
  } = useChat({
    activeConversationId,
    onConversationCreated,
    onTitleGenerated,
  });

  const handleEditSubmit = (newContent: string) => {
    sendMessage(newContent);
  };

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background bg-grid relative">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-72 bg-gradient-to-b from-primary/10 via-accent/5 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-purple/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Error Alert with AnimatePresence */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mx-4 md:mx-8 mt-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs md:text-sm flex items-center justify-between gap-3 z-30 shadow-glass backdrop-blur-md"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => regenerateResponse()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-all flex-shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages or Empty State */}
      {isLoadingMessages ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-glow" />
            <span className="text-xs text-text-muted font-medium">Loading workspace history...</span>
          </div>
        </div>
      ) : hasMessages ? (
        <MessageList
          messages={messages}
          streamingContent={streamingContent}
          thinkingContent={thinkingContent}
          isStreaming={isStreaming}
          onRegenerate={regenerateResponse}
          onEditSubmit={handleEditSubmit}
          onStop={stopGeneration}
        />
      ) : (
        <EmptyState onSelectPrompt={(prompt) => sendMessage(prompt)} />
      )}

      {/* Chat Composer */}
      <ChatInput
        onSendMessage={(msg, fileIds) => sendMessage(msg, fileIds)}
        isStreaming={isStreaming}
        onStop={stopGeneration}
      />
    </div>
  );
}
