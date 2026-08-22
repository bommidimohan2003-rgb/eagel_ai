import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor to attach Bearer token
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
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = this.getRefreshToken();
          if (!refreshToken) {
            this.clearTokens();
            this.processQueue(new Error('No refresh token available'), null);
            this.isRefreshing = false;
            return Promise.reject(error);
          }

          try {
            const { data } = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {
              refresh_token: refreshToken,
            });

            this.setTokens(data.access_token, data.refresh_token);
            if (originalRequest.headers) {
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
              'Backend API not connected: Vercel only hosts the frontend UI. Please set VITE_API_URL to your deployed FastAPI backend URL, or open http://localhost:5173 for local development.'
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
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  public getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  }

  public setTokens(accessToken: string, refreshToken?: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }

  public clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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
