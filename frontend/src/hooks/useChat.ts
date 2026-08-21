import { useState, useRef, useEffect, useCallback } from 'react';
import { chatService } from '@/services/chat';
import { conversationService } from '@/services/conversations';
import { Message } from '@/types';

interface UseChatOptions {
  activeConversationId: string | null;
  onConversationCreated?: (id: string) => void;
  onTitleGenerated?: (id: string, title: string) => void;
}

export function useChat({
  activeConversationId,
  onConversationCreated,
  onTitleGenerated,
}: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const activeConvIdRef = useRef<string | null>(activeConversationId);

  useEffect(() => {
    activeConvIdRef.current = activeConversationId;
  }, [activeConversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      setStreamingContent('');
      setThinkingContent('');
      setIsStreaming(false);
      setError(null);
      return;
    }

    const loadMessages = async () => {
      try {
        setIsLoadingMessages(true);
        setError(null);
        const data = await conversationService.getMessages(activeConversationId);
        setMessages(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load messages');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeConversationId]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const sendMessage = async (content: string, fileIds?: string[]) => {
    if (!content.trim() || isStreaming) return;

    setError(null);
    setIsStreaming(true);
    setStreamingContent('');
    setThinkingContent('');

    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConvIdRef.current || '',
      role: 'user',
      content,
      created_at: new Date().toISOString(),
      extra_metadata: fileIds ? { files: fileIds } : undefined,
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);

    abortControllerRef.current = new AbortController();

    let accumulatedContent = '';
    let accumulatedThinking = '';
    let currentMessageId = '';

    await chatService.streamChat({
      message: content,
      conversationId: activeConvIdRef.current,
      fileIds,
      signal: abortControllerRef.current.signal,
      onStart: () => {
        setIsStreaming(true);
      },
      onTextDelta: (delta: string) => {
        accumulatedContent += delta;
        setStreamingContent(accumulatedContent);
      },
      onThinkingDelta: (delta: string) => {
        accumulatedThinking += delta;
        setThinkingContent(accumulatedThinking);
      },
      onConversationId: (id: string) => {
        if (!activeConvIdRef.current) {
          activeConvIdRef.current = id;
          onConversationCreated?.(id);
        }
      },
      onTitle: (title: string) => {
        if (activeConvIdRef.current) {
          onTitleGenerated?.(activeConvIdRef.current, title);
        }
      },
      onMessageId: (msgId: string) => {
        currentMessageId = msgId;
      },
      onError: (errText: string) => {
        setError(errText);
        setIsStreaming(false);
      },
      onDone: (data: any) => {
        const finalAssistantMessage: Message = {
          id: currentMessageId || `msg-${Date.now()}`,
          conversation_id: activeConvIdRef.current || '',
          role: 'assistant',
          content: accumulatedContent,
          model: data?.model || 'nvidia/nemotron-3-ultra-550b-a55b',
          token_usage: data?.token_usage,
          extra_metadata: accumulatedThinking ? { thinking: accumulatedThinking } : undefined,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, finalAssistantMessage]);
        setStreamingContent('');
        setThinkingContent('');
        setIsStreaming(false);
      },
    });
  };

  const regenerateResponse = async () => {
    if (messages.length === 0 || isStreaming) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;
    await sendMessage(lastUserMsg.content);
  };

  return {
    messages,
    streamingContent,
    thinkingContent,
    isStreaming,
    isLoadingMessages,
    error,
    sendMessage,
    stopGeneration,
    regenerateResponse,
  };
}
