import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code block:', err);
    }
  };

  return (
    <div className="relative my-4 rounded-2xl overflow-hidden border border-border bg-surface-300 font-mono text-xs shadow-glass">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-200 border-b border-border text-text-muted">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-medium tracking-wide uppercase text-text-secondary">
            {language || 'plaintext'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] text-primary font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content Viewport */}
      <div className="p-4 overflow-x-auto text-text-primary leading-relaxed scrollbar-thin">
        <pre>
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
