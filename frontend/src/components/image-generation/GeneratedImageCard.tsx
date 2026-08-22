import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Copy,
  Download,
  Eye,
  Maximize2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Trash2,
} from 'lucide-react';
import { GeneratedImageItem } from '@/types';
import { imageService } from '@/services/images';
import { ImageLightbox } from '@/components/image-generation/ImageLightbox';

interface GeneratedImageCardProps {
  image: GeneratedImageItem;
  onRegenerate?: (prompt: string, style?: string, aspectRatio?: string) => void;
  onReusePrompt?: (prompt: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function GeneratedImageCard({
  image,
  onRegenerate,
  onReusePrompt,
  onDelete,
  compact = false,
}: GeneratedImageCardProps) {
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const imageUrl = image.url || image.image_url || '';

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const fullUrl = imageUrl.startsWith('http')
        ? imageUrl
        : `${window.location.origin}${imageUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image URL:', err);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDownloading(true);
    try {
      await imageService.downloadImage(imageUrl, `eagle_image_${image.id.slice(0, 8)}.png`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Aspect ratio classes for responsive frame
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '16:9':
        return 'aspect-video';
      case '9:16':
        return 'aspect-[9/16]';
      case '4:3':
        return 'aspect-[4/3]';
      case '3:4':
        return 'aspect-[3/4]';
      default:
        return 'aspect-square';
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="group relative rounded-3xl overflow-hidden bg-surface-100/90 border border-border hover:border-primary/50 shadow-glass transition-all duration-300 flex flex-col"
      >
        {/* Visual Frame */}
        <div
          className={`relative w-full ${getAspectRatioClass(image.aspect_ratio || '1:1')} bg-surface-200/50 overflow-hidden cursor-pointer`}
          onClick={() => setIsLightboxOpen(true)}
        >
          {/* Skeleton placeholder while image loads */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-surface-200 animate-pulse flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-text-muted animate-spin" />
            </div>
          )}

          <img
            src={imageUrl}
            alt={image.prompt}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-semibold text-white">
                {image.aspect_ratio || '1:1'}
              </span>
              {image.style && (
                <span className="px-2.5 py-1 rounded-full bg-primary/80 backdrop-blur-md text-[10px] font-semibold text-white shadow-sm">
                  {image.style}
                </span>
              )}
            </div>

            <span className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[9px] font-mono text-white/80">
              {image.model || 'FLUX'}
            </span>
          </div>

          {/* Hover Action Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 z-10">
            <div className="flex items-center justify-between gap-1.5 pointer-events-auto">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all shadow-sm"
                  title="Download image"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all shadow-sm"
                  title="Copy image link"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>

                {onRegenerate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRegenerate(image.prompt, image.style || undefined, image.aspect_ratio);
                    }}
                    className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all shadow-sm"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLightboxOpen(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-glow hover:bg-primary-hover transition-all"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="text-[11px]">View</span>
              </button>
            </div>
          </div>
        </div>

        {/* Card Footer Details */}
        {!compact && (
          <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
            <p className="text-xs text-text-primary line-clamp-2 leading-relaxed font-medium">
              {image.prompt}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-border/80 text-[11px] text-text-muted">
              <span>{new Date(image.created_at).toLocaleDateString()}</span>

              {onReusePrompt && (
                <button
                  type="button"
                  onClick={() => onReusePrompt(image.prompt)}
                  className="flex items-center gap-1 text-primary hover:text-primary-hover font-semibold transition-colors"
                >
                  <span>Reuse prompt</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Lightbox Modal */}
      <ImageLightbox
        image={image}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onRegenerate={onRegenerate}
        onDelete={onDelete}
      />
    </>
  );
}
