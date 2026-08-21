import { api } from '@/services/api';
import { Conversation, Message } from '@/types';

export const conversationService = {
  async list(): Promise<Conversation[]> {
    return api.get<Conversation[]>('/api/v1/conversations');
  },

  async get(id: string): Promise<Conversation> {
    return api.get<Conversation>(`/api/v1/conversations/${id}`);
  },

  async create(title?: string): Promise<Conversation> {
    return api.post<Conversation>('/api/v1/conversations', { title });
  },

  async update(id: string, data: { title?: string; is_archived?: boolean; is_pinned?: boolean }): Promise<Conversation> {
    return api.patch<Conversation>(`/api/v1/conversations/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return api.delete(`/api/v1/conversations/${id}`);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    return api.get<Message[]>(`/api/v1/conversations/${conversationId}/messages`);
  },
};
