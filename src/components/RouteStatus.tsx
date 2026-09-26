import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function RouteStatus({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section className="grid min-h-[60vh] content-center justify-items-center gap-4 px-4 py-12 text-center">
      <p className="mb-3 text-xs font-bold tracking-[0.12em] text-brand uppercase">
        {t('appName')}
      </p>
      <h1 className="font-editorial text-3xl">{title}</h1>
      <p className="max-w-[36rem] text-ink-secondary">{message}</p>
      {action ?? (
        <Link className="button button--primary" to="/">
          {t('home')}
        </Link>
      )}
    </section>
  );
}
