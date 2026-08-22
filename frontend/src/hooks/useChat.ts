import { useState, useRef, useEffect, useCallback } from 'react';
import { chatService } from '@/services/chat';
import { conversationService } from '@/services/conversations';
import { AspectRatio, ChatMode, Message } from '@/types';

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

  const sendMessage = async (
    content: string,
    fileIds?: string[],
    options?: { mode?: ChatMode; aspectRatio?: AspectRatio; style?: string }
  ) => {
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
      extra_metadata: {
        files: fileIds,
        type: options?.mode === 'image' ? 'image_request' : 'text',
        aspect_ratio: options?.aspectRatio,
        style: options?.style,
      },
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);

    abortControllerRef.current = new AbortController();

    let accumulatedContent = '';
    let accumulatedThinking = '';
    let currentMessageId = '';
    let receivedImage: any = null;

    await chatService.streamChat({
      message: content,
      conversationId: activeConvIdRef.current,
      mode: options?.mode,
      aspectRatio: options?.aspectRatio,
      style: options?.style,
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
      onImage: (imgData: any) => {
        receivedImage = imgData;
      },
      onError: (errText: string) => {
        setError(errText);
        setIsStreaming(false);
      },
      onDone: (data: any) => {
        const finalImage = receivedImage || data?.image;
        const finalContent =
          accumulatedContent.trim() ||
          (finalImage ? `Here is the generated image for: **${finalImage.prompt || content}**` : '');

        const finalAssistantMessage: Message = {
          id: currentMessageId || `msg-${Date.now()}`,
          conversation_id: activeConvIdRef.current || '',
          role: 'assistant',
          content: finalContent,
          model: data?.model || (finalImage ? finalImage.model : 'nvidia/nemotron-3-ultra-550b-a55b'),
          token_usage: data?.token_usage,
          extra_metadata: {
            thinking: accumulatedThinking || undefined,
            type: finalImage ? 'image' : 'text',
            image: finalImage
              ? {
                  id: finalImage.id,
                  url: finalImage.url || finalImage.image_url,
                  prompt: finalImage.prompt || content,
                  width: finalImage.width,
                  height: finalImage.height,
                  aspect_ratio: finalImage.aspect_ratio,
                  style: finalImage.style,
                }
              : undefined,
          },
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, finalAssistantMessage]);
        setStreamingContent('');
        setThinkingContent('');
        setIsStreaming(false);
      },
    });
  };

  const regenerateResponse = async (customPrompt?: string, style?: string, aspectRatio?: string) => {
    if (isStreaming) return;
    if (customPrompt) {
      await sendMessage(customPrompt, undefined, {
        mode: 'image',
        style,
        aspectRatio: aspectRatio as AspectRatio,
      });
      return;
    }
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;
    const isImageReq = lastUserMsg.extra_metadata?.type === 'image_request' || lastUserMsg.content.startsWith('/image');
    const promptClean = lastUserMsg.content.replace(/^\/image\s*/, '');
    await sendMessage(promptClean, undefined, {
      mode: isImageReq ? 'image' : 'chat',
      aspectRatio: lastUserMsg.extra_metadata?.aspect_ratio,
      style: lastUserMsg.extra_metadata?.style,
    });
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
