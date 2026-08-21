import React, { useState } from 'react';
import { Check, Copy, Edit2, RotateCcw } from 'lucide-react';

interface MessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  onEdit?: () => void;
  isAssistant?: boolean;
}

export function MessageActions({
  content,
  onRegenerate,
  onEdit,
  isAssistant,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
        title="Copy message"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {isAssistant && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
          title="Regenerate response"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {!isAssistant && onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
          title="Edit message"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
