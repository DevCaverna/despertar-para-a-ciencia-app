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
    <div className="mx-auto w-[calc(100%_-_3rem)] max-w-[1400px] max-[720px]:w-[calc(100%_-_2rem)]">
      <section className="max-w-[54rem] py-[clamp(4rem,12vw,8rem)]" aria-labelledby="home-heading">
        <p className="mb-3 text-xs font-bold tracking-[0.12em] text-brand uppercase">
          {t('homeEyebrow')}
        </p>
        <h1
          id="home-heading"
          className="mb-4 max-w-[13ch] font-editorial text-[clamp(2.7rem,8vw,5.4rem)]"
        >
          {t('homeTitle')}
        </h1>
        <p className="max-w-[39rem] text-lg text-ink-secondary">
          {t('homeGreeting', { name: profile?.name ?? user.displayName ?? t('scientist') })}
        </p>
      </section>
    </div>
  );
}
