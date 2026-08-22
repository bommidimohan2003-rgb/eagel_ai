import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Sliders,
  Ratio,
  Palette,
  Wand2,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { AspectRatio, ImageStylePreset, ImageGenerationSettings } from '@/types';

interface ImageSettingsProps {
  settings: ImageGenerationSettings;
  onChange: (newSettings: Partial<ImageGenerationSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ASPECT_RATIOS: { value: AspectRatio; label: string; ratio: string }[] = [
  { value: '1:1', label: 'Square', ratio: '1:1' },
  { value: '16:9', label: 'Landscape', ratio: '16:9' },
  { value: '9:16', label: 'Portrait', ratio: '9:16' },
  { value: '4:3', label: 'Standard', ratio: '4:3' },
  { value: '3:4', label: 'Tall', ratio: '3:4' },
];

export const STYLE_PRESETS: ImageStylePreset[] = [
  'None',
  'Realistic',
  'Cinematic',
  'Anime',
  '3D',
  'Digital Art',
  'Illustration',
  'Cyberpunk',
  'Fantasy',
  'Photographic',
  'Minimalist',
];

export function ImageSettings({ settings, onChange, isOpen, onClose }: ImageSettingsProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface-900 border border-border/80 shadow-2xl p-5 md:p-6 backdrop-blur-2xl max-h-[85vh] overflow-y-auto scrollbar-thin"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/80">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/20 text-primary">
                <Sliders className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-text-primary text-base">Image Generation Settings</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-surface-100 hover:bg-surface-50 text-text-secondary hover:text-text-primary transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-5 pt-4">
            {/* Aspect Ratio Selector */}
            <div>
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mb-2.5">
                <Ratio className="w-3.5 h-3.5 text-primary" />
                Aspect Ratio
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((item) => {
                  const isSelected = settings.aspectRatio === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => onChange({ aspectRatio: item.value })}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-xs transition-all ${
                        isSelected
                          ? 'bg-primary/20 border-primary text-primary font-semibold shadow-glow'
                          : 'bg-surface-100 hover:bg-surface-50 border-border text-text-secondary'
                      }`}
                    >
                      <span className="font-mono text-xs">{item.ratio}</span>
                      <span className="text-[10px] text-text-muted mt-0.5">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Style Presets */}
            <div>
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mb-2.5">
                <Palette className="w-3.5 h-3.5 text-primary" />
                Style Preset
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin p-1 bg-surface-100/50 rounded-2xl border border-border">
                {STYLE_PRESETS.map((style) => {
                  const isSelected = (settings.style || 'None') === style;
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => onChange({ style })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'bg-surface-100 hover:bg-surface-50 text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {style}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Prompt Enhancement Switch */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-100 border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/20 text-accent">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-text-primary">Prompt Enhancement</h4>
                  <p className="text-[11px] text-text-muted">Enrich prompt with photographic & artistic details using AI</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enhancePrompt}
                  onChange={(e) => onChange({ enhancePrompt: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {/* Negative Prompt (Optional) */}
            <div>
              <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5 mb-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Negative Prompt (Optional)
              </label>
              <input
                type="text"
                value={settings.negativePrompt}
                onChange={(e) => onChange({ negativePrompt: e.target.value })}
                placeholder="blurry, distorted, low quality, watermarks..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-100 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 pt-4 border-t border-border flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-bold transition-all shadow-glow"
            >
              Apply Settings
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
