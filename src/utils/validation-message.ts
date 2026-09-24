import { t } from 'i18next';

import type { translations } from '@/locales';

type TranslationKey = keyof (typeof translations)['pt-BR'];

export function translateValidationMessage(message: string): string {
  return t(message as TranslationKey);
}
