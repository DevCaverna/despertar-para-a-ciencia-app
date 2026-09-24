import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { createContext, useContext, useLayoutEffect, type ReactNode } from 'react';

import { i18n } from '@/locales';
import { auth } from '@/services/firebase.service';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

const ApiContext = createContext<AxiosInstance>(api);

export function ApiProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const requestId = api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      config.headers['x-custom-lang'] = i18n.resolvedLanguage ?? i18n.language ?? 'pt-BR';
      const currentUser = auth?.currentUser;
      if (currentUser) config.headers.Authorization = `Bearer ${await currentUser.getIdToken()}`;
      else delete config.headers.Authorization;
      return config;
    });
    const responseId = api.interceptors.response.use(undefined, async (error: unknown) => {
      if (!axios.isAxiosError(error)) throw error;
      const config = error.config;
      const currentUser = auth?.currentUser;
      if (error.response?.status !== 401 || !config || !currentUser) throw error;

      const retryConfig = config as InternalAxiosRequestConfig & { retry?: boolean };
      if (retryConfig.retry) throw error;
      retryConfig.retry = true;
      retryConfig.headers.Authorization = `Bearer ${await currentUser.getIdToken(true)}`;
      return api.request(retryConfig);
    });
    return () => {
      api.interceptors.request.eject(requestId);
      api.interceptors.response.eject(responseId);
    };
  }, []);

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi(): AxiosInstance {
  return useContext(ApiContext);
}
