export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  is_archived: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string | null;
  parent_id?: string | null;
  token_usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
  extra_metadata?: {
    thinking?: string;
    files?: string[];
    type?: 'text' | 'image' | 'image_request';
    image?: {
      id: string;
      url: string;
      prompt: string;
      width?: number;
      height?: number;
      aspect_ratio?: string;
      style?: string | null;
    };
    [key: string]: any;
  } | null;
  created_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  category: string;
  content: string;
  confidence: number;
  source_conversation_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileAttachmentItem {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  parsed_content?: string | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  model_name: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  memory_enabled: boolean;
  web_search_enabled: boolean;
  system_prompt_override?: string | null;
  theme?: string;
  created_at: string;
  updated_at: string;
}

export interface StreamEventPayload {
  event:
    | 'start'
    | 'text_delta'
    | 'thinking_delta'
    | 'conversation_id'
    | 'title'
    | 'message_id'
    | 'image'
    | 'done'
    | 'error';
  data: any;
}

export * from './image';
