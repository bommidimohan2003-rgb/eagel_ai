import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Code2, FileCode, Lightbulb, Paperclip, Sparkles, Square } from 'lucide-react';
import { FileAttachment } from '@/components/chat/FileAttachment';
import { fileService } from '@/services/files';
import { FileAttachmentItem } from '@/types';

interface ChatInputProps {
  onSendMessage: (message: string, fileIds?: string[]) => void;
  isStreaming: boolean;
  onStop: () => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  { icon: Code2, label: 'Code Review', prompt: 'Please review and audit this code for performance, bugs, and edge cases:\n\n' },
  { icon: Lightbulb, label: 'Explain Concept', prompt: 'Explain the core concepts, internal architecture, and trade-offs of ' },
  { icon: FileCode, label: 'Refactor', prompt: 'Refactor this code to follow clean architecture and async best practices:\n\n' },
];

export function ChatInput({ onSendMessage, isStreaming, onStop, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachmentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onStop();
      return;
    }
    if (!input.trim() || disabled || isUploading) return;

    const fileIds = attachedFiles.map((f) => f.id);
    onSendMessage(input, fileIds.length > 0 ? fileIds : undefined);
    setInput('');
    setAttachedFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await fileService.upload(file);
        setAttachedFiles((prev) => [...prev, uploaded]);
      }
    } catch (err: any) {
      alert(`File upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleQuickAction = (promptPrefix: string) => {
    setInput(promptPrefix);
    textareaRef.current?.focus();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-6 pb-5 relative z-20">
      {/* Attached Files Preview */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-wrap gap-2 mb-2 px-1"
          >
            {attachedFiles.map((file) => (
              <FileAttachment key={file.id} file={file} onRemove={() => removeFile(file.id)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Glass Input Capsule */}
      <div className="relative rounded-3xl glass-input p-1.5 shadow-sm transition-all duration-200 focus-within:border-primary/50">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything, formulate ideas, or debug code..."
            rows={1}
            disabled={disabled}
            className="w-full px-4 pt-3 pb-2 bg-transparent text-text-primary placeholder:text-text-muted text-sm md:text-[14.5px] focus:outline-none resize-none max-h-48 leading-relaxed scrollbar-thin"
          />

          {/* Action Footer */}
          <div className="flex items-center justify-between px-3 pb-2 pt-1 border-t border-border/80">
            <div className="flex items-center gap-1.5">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept=".pdf,.txt,.docx,.csv,.json,.py,.ts,.js,.md"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isStreaming}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-100 transition-all disabled:opacity-40"
                title="Attach file (PDF, TXT, DOCX, Code)"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {isUploading ? (
                <span className="text-xs text-primary font-medium animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  Uploading...
                </span>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-100 border border-border text-[11px] text-text-muted font-medium">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Eagle 3 Ultra</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <span className="hidden md:inline text-[11px] text-text-muted select-none">
                <kbd className="px-1.5 py-0.5 rounded-md bg-surface-100 border border-border font-mono text-[10px] text-text-secondary">Enter</kbd> send
              </span>

              {isStreaming ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onStop}
                  className="px-3.5 py-1.5 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 transition-all flex items-center gap-1.5 text-xs font-semibold"
                  title="Stop generation (Esc)"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  whileHover={{ scale: input.trim() ? 1.05 : 1 }}
                  whileTap={{ scale: input.trim() ? 0.95 : 1 }}
                  disabled={!input.trim() || disabled || isUploading}
                  className="p-2.5 rounded-2xl bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-30 disabled:hover:bg-primary transition-all flex items-center justify-center font-bold shadow-sm"
                  title="Send message"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </motion.button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
