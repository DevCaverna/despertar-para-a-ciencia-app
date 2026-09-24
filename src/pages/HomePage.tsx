import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

import { LoadingState } from '@/components/LoadingState';
import { RouteStatus } from '@/components/RouteStatus';
import { useSession } from '@/contexts/SessionContext';

export function HomePage() {
  const { t } = useTranslation();
  const { user, profile, profileStatus, loadProfile } = useSession();

  if (!user) return <Navigate to="/login" replace />;
  if (profileStatus === 'loading' || profileStatus === 'none')
    return <LoadingState label={t('checkingProfile')} />;
  if (profileStatus === 'not-found') return <Navigate to="/register" replace />;
  if (profileStatus === 'inactive') {
    return <RouteStatus title={t('inactiveProfile')} message={t('inactiveProfileMessage')} />;
  }
  if (profileStatus === 'error') {
    return (
      <RouteStatus
        title={t('loadProfileError')}
        message={t('sessionPreserved')}
        action={
          <button className="button button--primary" onClick={() => void loadProfile()}>
            {t('tryAgain')}
          </button>
        }
      />
    );
  }

  return (
    <div className="site-frame">
      <section className="home-intro" aria-labelledby="home-heading">
        <p className="eyebrow">{t('homeEyebrow')}</p>
        <h1 id="home-heading">{t('homeTitle')}</h1>
        <p className="home-intro__lead">
          {t('homeGreeting', { name: profile?.name ?? user.displayName ?? t('scientist') })}
        </p>
      </section>
    </div>
  );
}
