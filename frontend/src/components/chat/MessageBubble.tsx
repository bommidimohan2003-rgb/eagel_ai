import React from 'react';
import { AssistantMessage } from '@/components/chat/AssistantMessage';
import { UserMessage } from '@/components/chat/UserMessage';
import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: () => void;
  onEditSubmit?: (newContent: string) => void;
  onSelectPrompt?: (prompt: string) => void;
}

export function MessageBubble({ message, onRegenerate, onEditSubmit, onSelectPrompt }: MessageBubbleProps) {
  if (message.role === 'user') {
    return <UserMessage message={message} onEditSubmit={onEditSubmit} />;
  }
  return <AssistantMessage message={message} onRegenerate={onRegenerate} onSelectPrompt={onSelectPrompt} />;
}
