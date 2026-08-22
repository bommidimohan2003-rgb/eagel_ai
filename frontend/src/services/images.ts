import { api } from '@/services/api';
import {
  GeneratedImageItem,
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageListResponse,
} from '@/types';

export const imageService = {
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    return await api.post<ImageGenerationResponse>('/images/generate', request);
  },

  async getImages(params?: {
    page?: number;
    pageSize?: number;
    style?: string;
    provider?: string;
    search?: string;
  }): Promise<ImageListResponse> {
    return await api.get<ImageListResponse>('/images', {
      page: params?.page || 1,
      page_size: params?.pageSize || 24,
      style: params?.style || undefined,
      provider: params?.provider || undefined,
      search: params?.search || undefined,
    });
  },

  async getImage(id: string): Promise<GeneratedImageItem> {
    return await api.get<GeneratedImageItem>(`/images/${id}`);
  },

  async deleteImage(id: string): Promise<void> {
    await api.delete(`/images/${id}`);
  },

  async enhancePrompt(prompt: string, style?: string): Promise<string> {
    const data = await api.post<{ original_prompt: string; enhanced_prompt: string }>('/images/enhance-prompt', {
      prompt,
      style,
    });
    return data.enhanced_prompt;
  },

  async downloadImage(imageUrl: string, filename?: string): Promise<void> {
    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) throw new Error('Network error downloading image');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || `eagle_image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('Direct blob download failed, opening in new tab fallback:', err);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.download = filename || `eagle_image_${Date.now()}.png`;
      link.click();
    }
  },
};
