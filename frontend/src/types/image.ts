export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export type ImageStylePreset =
  | 'None'
  | 'Realistic'
  | 'Cinematic'
  | 'Anime'
  | '3D'
  | 'Digital Art'
  | 'Illustration'
  | 'Minimalist'
  | 'Photographic'
  | 'Fantasy'
  | 'Cyberpunk';

export type ChatMode = 'chat' | 'image' | 'auto';

export interface ImageGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  model?: string;
  width?: number;
  height?: number;
  aspect_ratio?: AspectRatio;
  quality?: 'standard' | 'hd';
  style?: string;
  number_of_images?: number;
  enhance_prompt?: boolean;
  conversation_id?: string;
}

export interface GeneratedImageItem {
  id: string;
  url: string;
  image_url?: string;
  width: number;
  height: number;
  aspect_ratio: AspectRatio;
  style?: string | null;
  prompt: string;
  negative_prompt?: string | null;
  enhanced_prompt?: string | null;
  provider: string;
  model: string;
  generation_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  conversation_id?: string | null;
  message_id?: string | null;
  created_at: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  images: GeneratedImageItem[];
  provider: string;
  model: string;
  prompt: string;
  conversation_id?: string | null;
  message_id?: string | null;
  created_at: string;
}

export interface ImageListResponse {
  images: GeneratedImageItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface ImageGenerationSettings {
  aspectRatio: AspectRatio;
  style: ImageStylePreset;
  quality: 'standard' | 'hd';
  enhancePrompt: boolean;
  negativePrompt: string;
  model: string;
}
