import { useTranslation } from 'react-i18next';

export function LoadingState({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div
      className="grid min-h-[55vh] place-content-center gap-4 text-center text-ink-secondary"
      role="status"
      aria-live="polite"
    >
      <span
        className="size-7 justify-self-center animate-spin rounded-full border-[3px] border-line border-t-brand"
        aria-hidden="true"
      />
      <span>{label ?? t('loading')}</span>
    </div>
  );
}
