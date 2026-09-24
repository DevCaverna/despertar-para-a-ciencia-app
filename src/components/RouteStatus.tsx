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
    <section className="status-page">
      <p className="eyebrow">{t('appName')}</p>
      <h1>{title}</h1>
      <p>{message}</p>
      {action ?? (
        <Link className="button button--primary" to="/">
          {t('home')}
        </Link>
      )}
    </section>
  );
}
