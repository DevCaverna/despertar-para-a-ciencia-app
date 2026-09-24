import axios from 'axios';
import { t } from 'i18next';

import type { translations } from '@/locales';

type TranslationKey = keyof (typeof translations)['pt-BR'];

type ValidationError = {
  constraints?: Record<string, string>;
  children?: ValidationError[];
};

type ApiErrorResponse = {
  error?: string;
  message?: string | string[] | ValidationError[];
};

const firebaseMessages: Record<string, TranslationKey> = {
  'auth/invalid-credential': 'authInvalidCredentials',
  'auth/user-not-found': 'authInvalidCredentials',
  'auth/wrong-password': 'authInvalidCredentials',
  'auth/email-already-in-use': 'authEmailInUse',
  'auth/weak-password': 'authWeakPassword',
  'auth/invalid-email': 'authInvalidEmail',
  'auth/too-many-requests': 'authTooManyRequests',
  'auth/network-request-failed': 'authNetworkError',
  'auth/user-disabled': 'authUserDisabled',
};

function extractValidationMessages(errors: ValidationError[], messages: string[] = []): string[] {
  for (const error of errors) {
    if (error.constraints) messages.push(...Object.values(error.constraints));
    if (error.children?.length) extractValidationMessages(error.children, messages);
  }
  return messages;
}

export function extractAxiosErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return t(firebaseMessages[error.code] ?? 'authGenericError');
  }

  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const data = error.response?.data;
    if (typeof data?.message === 'string') return data.message;
    if (Array.isArray(data?.message)) {
      if (data.message.every((message) => typeof message === 'string')) {
        return data.message.join(', ');
      }
      const messages = extractValidationMessages(data.message);
      if (messages.length) return messages.join(', ');
    }
    if (data?.error) return data.error;

    switch (error.response?.status) {
      case 400:
        return t('errorInvalidCode');
      case 401:
        return t('errorUnauthorized');
      case 403:
        return t('errorForbidden');
      case 404:
        return t('errorProfileNotFound');
      case 409:
        return t('errorConflict');
      case 429:
        return t('errorRateLimited');
      default:
        return !error.response || (error.response.status ?? 0) >= 500
          ? t('errorUnavailable')
          : error.message || t('errorUnexpected');
    }
  }

  if (error instanceof Error) {
    const key = error.message as TranslationKey;
    if (
      key === 'firebaseNotConfigured' ||
      key === 'authLoginRequired' ||
      key === 'authEmailMismatch'
    ) {
      return t(key);
    }
    return error.message || t('errorUnexpected');
  }

  return t('errorUnexpected');
}
