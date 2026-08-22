import { StreamEventPayload } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface ChatStreamOptions {
  message: string;
  conversationId?: string | null;
  mode?: 'chat' | 'image' | 'auto';
  aspectRatio?: string;
  style?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  enableMemory?: boolean;
  fileIds?: string[];
  onStart?: (data: any) => void;
  onTextDelta?: (text: string) => void;
  onThinkingDelta?: (thinking: string) => void;
  onConversationId?: (id: string) => void;
  onTitle?: (title: string) => void;
  onMessageId?: (id: string) => void;
  onImage?: (imageData: any) => void;
  onDone?: (data: any) => void;
  onError?: (error: string) => void;
  signal?: AbortSignal;
}

export const chatService = {
  async streamChat(options: ChatStreamOptions): Promise<void> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      conversation_id: options.conversationId || undefined,
      message: options.message,
      mode: options.mode || 'chat',
      aspect_ratio: options.aspectRatio || '1:1',
      style: options.style || undefined,
      model: options.model,
      temperature: options.temperature,
      system_prompt: options.systemPrompt,
      enable_memory: options.enableMemory,
      file_ids: options.fileIds,
    };

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options.signal,
      });

      if (!response.ok) {
        let errText = '';
        try {
          const errJson = await response.json();
          errText = errJson?.error?.message || errJson?.detail || 'Streaming failed';
        } catch {
          errText = `HTTP Error ${response.status}: ${response.statusText}`;
        }
        options.onError?.(errText);
        return;
      }

      if (!response.body) {
        options.onError?.('No response body received from stream');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmed = block.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const eventPayload: StreamEventPayload = JSON.parse(jsonStr);

            switch (eventPayload.event) {
              case 'start':
                options.onStart?.(eventPayload.data);
                break;
              case 'text_delta':
                options.onTextDelta?.(eventPayload.data);
                break;
              case 'thinking_delta':
                options.onThinkingDelta?.(eventPayload.data);
                break;
              case 'conversation_id':
                options.onConversationId?.(eventPayload.data);
                break;
              case 'title':
                options.onTitle?.(eventPayload.data);
                break;
              case 'message_id':
                options.onMessageId?.(eventPayload.data);
                break;
              case 'image':
                options.onImage?.(eventPayload.data);
                break;
              case 'error':
                options.onError?.(eventPayload.data);
                break;
              case 'done':
                options.onDone?.(eventPayload.data);
                break;
            }
          } catch (parseErr) {
            console.debug('Failed to parse SSE payload:', parseErr, jsonStr);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream generation cancelled by user.');
      } else {
        options.onError?.(err.message || 'Stream connection error');
      }
    }
  },
};
