import { api } from '@/services/api';
import { Memory } from '@/types';

export const memoryService = {
  async list(): Promise<Memory[]> {
    return api.get<Memory[]>('/api/v1/memory');
  },

  async create(data: { category: string; content: string; confidence?: number }): Promise<Memory> {
    return api.post<Memory>('/api/v1/memory', data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/api/v1/memory/${id}`);
  },

  async clearAll(): Promise<void> {
    return api.delete('/api/v1/memory/clear/all');
  },
};
