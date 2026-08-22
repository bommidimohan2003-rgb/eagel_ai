import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp,
  Code2,
  FileCode,
  Lightbulb,
  Paperclip,
  Sparkles,
  Square,
  Image as ImageIcon,
  MessageSquare,
  Zap,
  Sliders,
  ChevronDown,
  Wand2,
} from 'lucide-react';
import { FileAttachment } from '@/components/chat/FileAttachment';
import { ImageSettings, ASPECT_RATIOS, STYLE_PRESETS } from '@/components/image-generation/ImageSettings';
import { fileService } from '@/services/files';
import {
  AspectRatio,
  ChatMode,
  FileAttachmentItem,
  ImageGenerationSettings,
} from '@/types';

interface ChatInputProps {
  onSendMessage: (
    message: string,
    fileIds?: string[],
    options?: { mode?: ChatMode; aspectRatio?: AspectRatio; style?: string }
  ) => void;
  isStreaming: boolean;
  onStop: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, isStreaming, onStop, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('chat');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showImageSettings, setShowImageSettings] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<FileAttachmentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Image Settings state
  const [imageSettings, setImageSettings] = useState<ImageGenerationSettings>({
    aspectRatio: '1:1',
    style: 'None',
    quality: 'standard',
    enhancePrompt: false,
    negativePrompt: '',
    model: 'flux',
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Click outside to close mode dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) {
      onStop();
      return;
    }
    if (!input.trim() || disabled || isUploading) return;

    const fileIds = attachedFiles.map((f) => f.id);
    onSendMessage(input, fileIds.length > 0 ? fileIds : undefined, {
      mode,
      aspectRatio: imageSettings.aspectRatio,
      style: imageSettings.style !== 'None' ? imageSettings.style : undefined,
    });

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

  const getPlaceholderText = () => {
    if (mode === 'image') {
      return 'Describe the image you want to create (e.g. A futuristic cyberpunk city in neon rain)...';
    }
    if (mode === 'auto') {
      return 'Ask anything or describe an image (Nemotron auto-detects capability)...';
    }
    return 'Ask anything, formulate ideas, or debug code...';
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

      {/* Mode Capsule & Quick Controls */}
      <div className="flex items-center justify-between gap-2 mb-2 px-2">
        {/* Capability Mode Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowModeDropdown(!showModeDropdown)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
              mode === 'image'
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-400 shadow-glow'
                : mode === 'auto'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-surface-100/90 border-border text-text-primary hover:bg-surface-50'
            }`}
          >
            {mode === 'chat' && <MessageSquare className="w-3.5 h-3.5 text-primary" />}
            {mode === 'image' && <ImageIcon className="w-3.5 h-3.5 text-purple-400" />}
            {mode === 'auto' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
            <span className="capitalize">{mode} Mode</span>
            <ChevronDown className="w-3 h-3 text-text-muted" />
          </button>

          <AnimatePresence>
            {showModeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 bottom-full mb-2 w-48 rounded-2xl bg-surface-900/95 border border-border p-1.5 shadow-2xl backdrop-blur-xl z-50 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setMode('chat');
                    setShowModeDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-colors ${
                    mode === 'chat' ? 'bg-primary/20 text-primary font-semibold' : 'text-text-secondary hover:bg-surface-100 hover:text-text-primary'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-bold">Chat Mode</div>
                    <div className="text-[10px] text-text-muted">Nemotron 3 Ultra text</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('image');
                    setShowModeDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-colors ${
                    mode === 'image' ? 'bg-purple-500/20 text-purple-400 font-semibold' : 'text-text-secondary hover:bg-surface-100 hover:text-text-primary'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  <div>
                    <div className="font-bold">Image Mode</div>
                    <div className="text-[10px] text-text-muted">Generate AI visuals</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('auto');
                    setShowModeDropdown(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left font-medium transition-colors ${
                    mode === 'auto' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-text-secondary hover:bg-surface-100 hover:text-text-primary'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold">Auto Router</div>
                    <div className="text-[10px] text-text-muted">Auto intent detection</div>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* In Image Mode: Quick Aspect Ratio and Style controls */}
        {mode === 'image' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {/* Aspect Ratio Pills */}
            <div className="flex items-center gap-1 bg-surface-100/70 p-0.5 rounded-xl border border-border">
              {['1:1', '16:9', '9:16'].map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setImageSettings((s) => ({ ...s, aspectRatio: ratio as AspectRatio }))}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all ${
                    imageSettings.aspectRatio === ratio
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>

            {/* Quick Style Picker */}
            <select
              value={imageSettings.style}
              onChange={(e) => setImageSettings((s) => ({ ...s, style: e.target.value as any }))}
              className="px-2 py-1 rounded-xl bg-surface-100/70 border border-border text-[11px] text-text-secondary font-medium focus:outline-none focus:border-primary/50"
            >
              {STYLE_PRESETS.map((st) => (
                <option key={st} value={st}>
                  {st === 'None' ? 'Default Style' : st}
                </option>
              ))}
            </select>

            {/* Advanced Settings Trigger */}
            <button
              type="button"
              onClick={() => setShowImageSettings(true)}
              className="p-1.5 rounded-xl bg-surface-100/70 hover:bg-surface-50 border border-border text-text-secondary hover:text-text-primary transition-all"
              title="Image generation settings"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Glass Input Capsule */}
      <div className={`relative rounded-3xl glass-input p-1.5 shadow-sm transition-all duration-200 ${
        mode === 'image' ? 'focus-within:border-purple-500/50' : 'focus-within:border-primary/50'
      }`}>
        <form onSubmit={handleSubmit} className="flex flex-col">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderText()}
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
                accept=".pdf,.txt,.docx,.csv,.json,.py,.ts,.js,.md,.png,.jpg,.jpeg,.webp"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isStreaming}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-100 transition-all disabled:opacity-40"
                title="Attach file or image"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {isUploading ? (
                <span className="text-xs text-primary font-medium animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  Uploading...
                </span>
              ) : mode === 'image' ? (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[11px] text-purple-400 font-medium">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>FLUX.1 Diffusion</span>
                </div>
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
                  className={`p-2.5 rounded-2xl text-white transition-all flex items-center justify-center font-bold shadow-sm disabled:opacity-30 ${
                    mode === 'image'
                      ? 'bg-purple-600 hover:bg-purple-500'
                      : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                  }`}
                  title={mode === 'image' ? 'Generate Image' : 'Send message'}
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </motion.button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Advanced Image Settings Modal */}
      <ImageSettings
        settings={imageSettings}
        onChange={(updates) => setImageSettings((prev) => ({ ...prev, ...updates }))}
        isOpen={showImageSettings}
        onClose={() => setShowImageSettings(false)}
      />
    </div>
  );
}
