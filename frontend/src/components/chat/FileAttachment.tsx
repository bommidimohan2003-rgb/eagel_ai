import React from 'react';
import { FileCode, FileSpreadsheet, FileText, X } from 'lucide-react';
import { FileAttachmentItem } from '@/types';

interface FileAttachmentProps {
  file: FileAttachmentItem;
  onRemove?: () => void;
}

export function FileAttachment({ file, onRemove }: FileAttachmentProps) {
  const getFileIcon = () => {
    const ext = file.filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'py':
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx':
      case 'json':
        return <FileCode className="w-3.5 h-3.5 text-primary" />;
      case 'csv':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-accent" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-accent-purple" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-100 border border-border text-xs text-text-primary shadow-sm hover:border-primary/40 transition-colors">
      {getFileIcon()}
      <span className="font-medium max-w-[140px] truncate">{file.filename}</span>
      <span className="text-[10px] text-text-muted">({formatSize(file.file_size)})</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-0.5 rounded-md text-text-muted hover:text-red-400 hover:bg-surface-200 transition-colors ml-0.5"
          title="Remove attachment"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
