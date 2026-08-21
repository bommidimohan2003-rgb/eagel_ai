import { api } from '@/services/api';
import { UserSettings } from '@/types';

export const settingsService = {
  async get(): Promise<UserSettings> {
    return api.get<UserSettings>('/api/v1/settings');
  },

  async update(data: Partial<UserSettings>): Promise<UserSettings> {
    return api.patch<UserSettings>('/api/v1/settings', data);
  },
};
