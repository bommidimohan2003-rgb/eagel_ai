import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private inMemoryAccessToken: string | null = null;
  private inMemoryRefreshToken: string | null = null;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      withCredentials: true, // Enable automatic secure HTTP-only cookie transport
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor to attach Bearer token if present
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor for 401 & Automatic Refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Only attempt refresh token for authenticated API requests, NOT auth endpoints themselves
        const isAuthEndpoint =
          originalRequest?.url?.includes('/auth/login') ||
          originalRequest?.url?.includes('/auth/register') ||
          originalRequest?.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers && token) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            const { data } = await axios.post(
              `${API_BASE}/api/v1/auth/refresh`,
              { refresh_token: refreshToken || '' },
              { withCredentials: true }
            );

            this.setTokens(data.access_token, data.refresh_token);
            if (originalRequest.headers && data.access_token) {
              originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            }
            this.processQueue(null, data.access_token);
            return this.client(originalRequest);
          } catch (refreshErr) {
            this.clearTokens();
            this.processQueue(refreshErr, null);
            return Promise.reject(refreshErr);
          } finally {
            this.isRefreshing = false;
          }
        }

        if (error.response?.status === 405 || (error.response?.status === 404 && !API_BASE && window.location.hostname !== 'localhost')) {
          return Promise.reject(
            new Error(
              'Backend API not connected: Please ensure the backend is running and reachable.'
            )
          );
        }

        const message =
          (error.response?.data as any)?.error?.message ||
          (error.response?.data as any)?.detail ||
          error.message ||
          'Request failed';
        return Promise.reject(new Error(message));
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  public getAccessToken(): string | null {
    return this.inMemoryAccessToken;
  }

  public getRefreshToken(): string | null {
    return this.inMemoryRefreshToken;
  }

  public setTokens(accessToken: string, refreshToken?: string) {
    this.inMemoryAccessToken = accessToken;
    if (refreshToken) {
      this.inMemoryRefreshToken = refreshToken;
    }
  }

  public clearTokens() {
    this.inMemoryAccessToken = null;
    this.inMemoryRefreshToken = null;
  }

  public async get<T = any>(url: string, params?: any): Promise<T> {
    const response = await this.client.get<T>(url, { params });
    return response.data;
  }

  public async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.client.patch<T>(url, data);
    return response.data;
  }

  public async delete<T = any>(url: string): Promise<T> {
    const response = await this.client.delete<T>(url);
    return response.data;
  }

  public async upload<T = any>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const api = new ApiClient();
