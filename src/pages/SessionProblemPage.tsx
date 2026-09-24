import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { RouteStatus } from '@/components/RouteStatus';
import { useSession } from '@/contexts/SessionContext';
import { extractAxiosErrorMessage } from '@/utils/extract-axios-error-message.util';

export function SessionProblemPage() {
  const { t } = useTranslation();
  const { user, profileStatus, profileError, loadProfile, logout } = useSession();
  const [busy, setBusy] = useState(false);

  if (profileStatus === 'inactive') {
    return (
      <RouteStatus
        title={t('inactiveProfile')}
        message={t('inactiveSessionMessage')}
        action={
          <button className="button button--secondary" onClick={() => void logout()}>
            {t('signOutAccount')}
          </button>
        }
      />
    );
  }

  async function retry() {
    setBusy(true);
    try {
      await loadProfile();
    } finally {
      setBusy(false);
    }
  }

  return (
    <RouteStatus
      title={t('inactiveSessionTitle')}
      message={extractAxiosErrorMessage(profileError)}
      action={
        user ? (
          <div style={{ display: 'flex', gap: '.75rem' }}>
            <button className="button button--primary" disabled={busy} onClick={() => void retry()}>
              {busy ? t('checking') : t('tryAgain')}
            </button>
            <button className="button button--secondary" onClick={() => void logout()}>
              {t('signOutAndIn')}
            </button>
          </div>
        ) : (
          <Link className="button button--primary" to="/login">
            {t('login')}
          </Link>
        )
      }
    />
  );
}
