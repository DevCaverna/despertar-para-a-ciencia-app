import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { auth } from '@/services/firebase.service';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuth?: boolean;
    retriedAfter401?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    retriedAfter401?: boolean;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json', 'x-custom-lang': 'pt-BR' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (config.skipAuth) return config;
  const user = auth?.currentUser;
  if (user) config.headers.Authorization = `Bearer ${await user.getIdToken()}`;
  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config;
  if (error.response?.status !== 401 || !config || config.skipAuth || config.retriedAfter401 || !auth?.currentUser) {
    throw error;
  }

  config.retriedAfter401 = true;
  config.headers.Authorization = `Bearer ${await auth.currentUser.getIdToken(true)}`;
  return api.request(config);
});

export function getRetryAfterSeconds(error: unknown): number | null {
  if (!axios.isAxiosError(error)) return null;
  const value = error.response?.headers['retry-after'];
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
}
