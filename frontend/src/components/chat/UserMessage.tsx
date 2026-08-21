import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageActions } from '@/components/chat/MessageActions';
import { Message } from '@/types';

interface UserMessageProps {
  message: Message;
  onEditSubmit?: (newContent: string) => void;
}

export function UserMessage({ message, onEditSubmit }: UserMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);

  const handleSave = () => {
    if (editText.trim() && editText !== message.content) {
      onEditSubmit?.(editText.trim());
    }
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex justify-end group my-4 px-2 md:px-4"
    >
      <div className="max-w-[88%] md:max-w-[75%] flex flex-col items-end">
        {isEditing ? (
          <div className="w-full min-w-[320px] p-3.5 rounded-2xl bg-surface-100 border border-primary/40 shadow-glass">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-surface-200 p-3 rounded-xl border border-border text-text-primary text-sm focus:outline-none focus:border-primary resize-none leading-relaxed"
              rows={3}
            />
            <div className="flex justify-end gap-2 mt-2.5">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3.5 py-1.5 text-xs bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover shadow-glow transition-all"
              >
                Save & Send
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 py-3 rounded-2xl bg-gradient-to-br from-surface-50 to-surface-100 border border-border text-text-primary text-sm md:text-[15px] shadow-sm rounded-br-sm leading-relaxed whitespace-pre-wrap selection:bg-primary/30">
              {message.content}
            </div>
            <MessageActions
              content={message.content}
              onEdit={() => setIsEditing(true)}
              isAssistant={false}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}
