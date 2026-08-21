import { api } from '@/services/api';
import { User } from '@/types';

export const authService = {
  async register(data: { email: string; password: string; full_name?: string }): Promise<User> {
    return api.post<User>('/api/v1/auth/register', data);
  },

  async login(data: { email: string; password: string }): Promise<{ access_token: string; refresh_token: string }> {
    const res = await api.post<{ access_token: string; refresh_token: string }>('/api/v1/auth/login', data);
    api.setTokens(res.access_token, res.refresh_token);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/v1/auth/logout');
    } finally {
      api.clearTokens();
    }
  },

  async getMe(): Promise<User> {
    return api.get<User>('/api/v1/users/me');
  },
};
