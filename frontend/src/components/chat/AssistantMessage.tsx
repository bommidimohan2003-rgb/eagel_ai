import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, ChevronDown, ChevronRight, Cpu, Sparkles, Image as ImageIcon } from 'lucide-react';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { MessageActions } from '@/components/chat/MessageActions';
import { GeneratedImageCard } from '@/components/image-generation/GeneratedImageCard';
import { EagleLogo } from '@/components/ui/EagleLogo';
import { GeneratedImageItem, Message } from '@/types';

interface AssistantMessageProps {
  message: Message;
  onRegenerate?: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function AssistantMessage({ message, onRegenerate, onSelectPrompt }: AssistantMessageProps) {
  const [showThinking, setShowThinking] = useState(false);
  const thinking = message.extra_metadata?.thinking || null;
  const imageMeta = message.extra_metadata?.image || null;

  // Adapt image metadata to GeneratedImageItem interface if present
  const imageItem: GeneratedImageItem | null = imageMeta
    ? {
        id: imageMeta.id || message.id,
        url: imageMeta.url || '',
        image_url: imageMeta.url || '',
        width: imageMeta.width || 1024,
        height: imageMeta.height || 1024,
        aspect_ratio: (imageMeta.aspect_ratio as any) || '1:1',
        style: imageMeta.style || null,
        prompt: imageMeta.prompt || message.content,
        provider: 'pollinations',
        model: message.model || 'flux',
        generation_status: 'COMPLETED',
        created_at: message.created_at,
      }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-3 md:gap-4 my-6 px-2 md:px-4 group"
    >
      {/* Premium Avatar */}
      <div className="relative mt-0.5 flex-shrink-0">
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 p-1 ${
          imageItem
            ? 'bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/40 text-purple-400'
            : 'bg-surface-100 border-border text-primary'
        }`}>
          {imageItem ? <ImageIcon className="w-4 h-4" /> : <EagleLogo className="w-6 h-6" />}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        {/* Header Tags */}
        <div className="flex items-center gap-2 mb-2 text-xs text-text-muted">
          <span className="font-semibold text-text-primary text-xs tracking-tight">
            {imageItem ? 'Eagle Visual Studio' : 'Eagle'}
          </span>
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

        {/* Generated Image Embedded Preview */}
        {imageItem && (
          <div className="mb-4 max-w-lg">
            <GeneratedImageCard
              image={imageItem}
              onRegenerate={onRegenerate}
              onReusePrompt={onSelectPrompt}
            />
          </div>
        )}

        {/* Message Body */}
        {(!imageItem || (message.content && !message.content.startsWith('Here is the generated image'))) && (
          <div className="relative">
            <MarkdownRenderer content={message.content} />
          </div>
        )}

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
