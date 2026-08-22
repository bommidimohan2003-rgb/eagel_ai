import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Copy,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Trash2,
  X,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Cpu,
} from 'lucide-react';
import { GeneratedImageItem } from '@/types';
import { imageService } from '@/services/images';

interface ImageLightboxProps {
  image: GeneratedImageItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRegenerate?: (prompt: string, style?: string, aspectRatio?: string) => void;
  onDelete?: (id: string) => void;
}

export function ImageLightbox({
  image,
  isOpen,
  onClose,
  onRegenerate,
  onDelete,
}: ImageLightboxProps) {
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !image) return null;

  const imageUrl = image.url || image.image_url || '';

  const handleCopyLink = async () => {
    try {
      const fullUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `${window.location.origin}${imageUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy image link:', e);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await imageService.downloadImage(imageUrl, `eagle_image_${image.id.slice(0, 8)}.png`);
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = new Date(image.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 cursor-zoom-out"
        />

        {/* Content Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-6xl w-full max-h-[95vh] flex flex-col rounded-3xl bg-surface-900/90 border border-border/80 shadow-2xl overflow-hidden backdrop-blur-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-surface-900/60">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{image.aspect_ratio || '1:1'}</span>
              </span>
              {image.style && (
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-surface-100 border border-border text-[11px] font-medium text-text-secondary">
                  {image.style}
                </span>
              )}
              <span className="text-xs text-text-muted truncate max-w-xs md:max-w-md">
                {image.prompt}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`p-2 rounded-xl border transition-all ${
                  showDetails
                    ? 'bg-primary/20 border-primary/40 text-primary'
                    : 'bg-surface-100 hover:bg-surface-50 border-border text-text-secondary hover:text-text-primary'
                }`}
                title="Toggle metadata details"
              >
                <Info className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsZoomed(!isZoomed)}
                className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border text-text-secondary hover:text-text-primary transition-all"
                title={isZoomed ? 'Actual size' : 'Fit to screen'}
              >
                {isZoomed ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border text-text-secondary hover:text-text-primary transition-all ml-1"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Visual Workspace */}
          <div className="relative flex-1 flex items-center justify-center overflow-auto p-3 sm:p-6 min-h-[300px] max-h-[70vh] bg-black/40">
            <motion.img
              layout
              src={imageUrl}
              alt={image.prompt}
              className={`rounded-2xl shadow-2xl transition-all duration-300 object-contain max-h-full ${
                isZoomed ? 'scale-125 cursor-grab active:cursor-grabbing' : 'max-w-full'
              }`}
            />

            {/* Optional Metadata Side Panel */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute right-4 top-4 bottom-4 w-80 max-w-[90%] bg-surface-900/95 border border-border rounded-2xl p-4 overflow-y-auto shadow-2xl backdrop-blur-xl text-xs space-y-3.5 z-20 scrollbar-thin"
                >
                  <h4 className="font-semibold text-text-primary text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Generation Telemetry
                  </h4>

                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Prompt</label>
                    <p className="mt-1 text-text-primary leading-relaxed bg-surface-100 p-2.5 rounded-xl border border-border">
                      {image.prompt}
                    </p>
                  </div>

                  {image.enhanced_prompt && (
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-primary">Enhanced Prompt</label>
                      <p className="mt-1 text-text-secondary leading-relaxed bg-surface-100 p-2.5 rounded-xl border border-primary/20">
                        {image.enhanced_prompt}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-surface-100 border border-border">
                      <span className="text-[10px] text-text-muted block">Resolution</span>
                      <span className="font-medium text-text-primary">{image.width} × {image.height}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-surface-100 border border-border">
                      <span className="text-[10px] text-text-muted block">Aspect Ratio</span>
                      <span className="font-medium text-text-primary">{image.aspect_ratio || '1:1'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/80">
                    <div className="flex items-center justify-between text-text-secondary">
                      <span className="flex items-center gap-1.5 text-[11px]"><Layers className="w-3.5 h-3.5" /> Provider:</span>
                      <span className="font-mono text-text-primary font-medium">{image.provider}</span>
                    </div>
                    <div className="flex items-center justify-between text-text-secondary">
                      <span className="flex items-center gap-1.5 text-[11px]"><Cpu className="w-3.5 h-3.5" /> Model:</span>
                      <span className="font-mono text-text-primary font-medium">{image.model}</span>
                    </div>
                    <div className="flex items-center justify-between text-text-secondary">
                      <span className="flex items-center gap-1.5 text-[11px]"><Calendar className="w-3.5 h-3.5" /> Generated:</span>
                      <span className="text-text-primary">{formattedDate}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-border/70 bg-surface-900/60">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border text-text-secondary hover:text-text-primary text-xs font-semibold transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Link' : 'Copy URL'}</span>
              </button>

              {onRegenerate && (
                <button
                  onClick={() => {
                    onRegenerate(image.prompt, image.style || undefined, image.aspect_ratio);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-border text-text-secondary hover:text-text-primary text-xs font-semibold transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-primary" />
                  <span>Regenerate</span>
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm('Delete this image permanently?')) {
                      onDelete(image.id);
                      onClose();
                    }
                  }}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all"
                  title="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover font-semibold text-xs shadow-glow transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Downloading...' : 'Download Full Resolution'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
