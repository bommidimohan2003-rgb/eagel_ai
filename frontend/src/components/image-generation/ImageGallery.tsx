import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { GeneratedImageItem, ImageStylePreset } from '@/types';
import { imageService } from '@/services/images';
import { GeneratedImageCard } from '@/components/image-generation/GeneratedImageCard';

interface ImageGalleryProps {
  onSelectPrompt?: (prompt: string) => void;
  onNewGeneration?: () => void;
}

const GALLERY_STYLES = [
  'All',
  'Realistic',
  'Cinematic',
  'Anime',
  '3D',
  'Digital Art',
  'Illustration',
  'Cyberpunk',
  'Fantasy',
];

export function ImageGallery({ onSelectPrompt, onNewGeneration }: ImageGalleryProps) {
  const [images, setImages] = useState<GeneratedImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await imageService.getImages({
        page,
        pageSize: 18,
        style: selectedStyle !== 'All' ? selectedStyle : undefined,
        search: searchQuery.trim() || undefined,
      });
      setImages(res.images);
      setTotalCount(res.total);
      setTotalPages(Math.ceil(res.total / res.page_size) || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to load images');
    } finally {
      setLoading(false);
    }
  }, [page, selectedStyle, searchQuery]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDelete = async (id: string) => {
    try {
      await imageService.deleteImage(id);
      setImages((prev) => prev.filter((img) => img.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(`Could not delete image: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-4 md:px-8 py-6 max-w-7xl mx-auto w-full scrollbar-thin">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-2xl bg-primary/20 text-primary shadow-glow">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-text-primary">
              AI Image Gallery
            </h1>
          </div>
          <p className="text-xs text-text-muted">
            Explore, inspect, download, and manage your synthesized visuals ({totalCount} images)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNewGeneration && (
            <button
              onClick={onNewGeneration}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-glow hover:bg-primary-hover transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Image</span>
            </button>
          )}

          <button
            onClick={() => fetchImages()}
            className="p-2 rounded-2xl bg-surface-100 hover:bg-surface-50 border border-border text-text-secondary hover:text-text-primary transition-all"
            title="Refresh gallery"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search generations by keyword or prompt..."
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-surface-100 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        {/* Style Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {GALLERY_STYLES.map((style) => {
            const isSelected = selectedStyle === style;
            return (
              <button
                key={style}
                onClick={() => {
                  setSelectedStyle(style);
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-2xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'bg-surface-100 hover:bg-surface-50 text-text-secondary border border-border'
                }`}
              >
                {style}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Image Grid / State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-glow" />
            <span className="text-xs text-text-muted font-medium">Loading generation gallery...</span>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-400 text-center text-xs">
          {error}
        </div>
      ) : images.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed border-border/80 min-h-[350px]">
          <div className="w-16 h-16 rounded-3xl bg-surface-100 border border-border flex items-center justify-center text-text-muted mb-4 shadow-inner">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">No Images Found</h3>
          <p className="text-xs text-text-muted max-w-sm mb-4">
            {searchQuery || selectedStyle !== 'All'
              ? 'No generated images match your selected filter criteria.'
              : 'You have not generated any AI images yet. Select Image mode in chat or click Generate Image to start!'}
          </p>
          {onNewGeneration && (
            <button
              onClick={onNewGeneration}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-glow hover:bg-primary-hover transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create First Image</span>
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {images.map((img) => (
              <GeneratedImageCard
                key={img.id}
                image={img}
                onReusePrompt={onSelectPrompt}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8 pt-4 border-t border-border/80">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 disabled:opacity-30 border border-border text-text-secondary transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-medium text-text-secondary">
                Page <span className="text-text-primary font-bold">{page}</span> of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 disabled:opacity-30 border border-border text-text-secondary transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
