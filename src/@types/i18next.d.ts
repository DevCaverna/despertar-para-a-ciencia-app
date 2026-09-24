import { translations } from '@/locales';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: (typeof translations)['pt-BR'] };
  }
}
