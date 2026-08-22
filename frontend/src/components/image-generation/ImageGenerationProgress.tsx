import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Palette, Layers, CheckCircle2 } from 'lucide-react';

interface ImageGenerationProgressProps {
  prompt?: string;
  onCancel?: () => void;
}

const STAGES = [
  { label: 'Initializing generative engine', icon: Sparkles },
  { label: 'Synthesizing visual composition', icon: Palette },
  { label: 'Rendering high-definition details', icon: Layers },
  { label: 'Finalizing permanent storage', icon: CheckCircle2 },
];

export function ImageGenerationProgress({ prompt, onCancel }: ImageGenerationProgressProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = STAGES[stageIndex].icon;

  return (
    <div className="w-full max-w-xl mx-auto my-4 p-5 rounded-3xl bg-surface-100/80 border border-primary/30 shadow-glass backdrop-blur-xl relative overflow-hidden">
      {/* Dynamic Background Aurora */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-accent/15 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="flex items-center gap-4 relative z-10">
        {/* Animated Icon Ring */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 border border-primary/50 flex items-center justify-center text-primary shadow-glow">
            <CurrentIcon className="w-6 h-6 animate-pulse" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-2 border-primary border-t-transparent animate-spin pointer-events-none" />
        </div>

        {/* Progress Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              AI Image Generation
            </span>
            <span className="text-[11px] font-mono text-text-muted">
              Step {stageIndex + 1} of {STAGES.length}
            </span>
          </div>

          <h4 className="text-sm font-semibold text-text-primary truncate">
            {STAGES[stageIndex].label}...
          </h4>

          {prompt && (
            <p className="text-xs text-text-muted truncate mt-0.5 max-w-md">
              &quot;{prompt}&quot;
            </p>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-surface-200/60 h-1.5 rounded-full mt-4 overflow-hidden relative">
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary-hover rounded-full"
          initial={{ width: '15%' }}
          animate={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}
