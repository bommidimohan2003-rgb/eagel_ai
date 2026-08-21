import { api } from '@/services/api';
import { FileAttachmentItem } from '@/types';

export const fileService = {
  async upload(file: File): Promise<FileAttachmentItem> {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload<FileAttachmentItem>('/api/v1/files/upload', formData);
  },

  async get(id: string): Promise<FileAttachmentItem> {
    return api.get<FileAttachmentItem>(`/api/v1/files/${id}`);
  },
};
