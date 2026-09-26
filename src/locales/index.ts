import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { enUS } from '@/locales/en-US';
import { es } from '@/locales/es';
import { ptBR } from '@/locales/pt-BR';

export const translations = {
  'pt-BR': ptBR,
  'en-US': enUS,
  es,
};

function syncDocumentLanguage(language: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  document.title = i18n.t('appName');
  document.querySelector('meta[name="description"]')?.setAttribute('content', i18n.t('appName'));
}

void i18n
  .use(initReactI18next)
  .init({
    lng: 'pt-BR',
    fallbackLng: 'pt-BR',
    supportedLngs: ['pt-BR', 'en-US', 'es'],
    resources: {
      'pt-BR': { translation: translations['pt-BR'] },
      'en-US': { translation: translations['en-US'] },
      es: { translation: translations.es },
    },
    interpolation: { escapeValue: false },
  })
  .then(() => syncDocumentLanguage(i18n.resolvedLanguage ?? i18n.language));

i18n.on('languageChanged', syncDocumentLanguage);

export { i18n };
