import type { ReactNode } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { ThemeToggle } from '@/components/ThemeToggle';
import { useSession } from '@/contexts/SessionContext';
import { i18n } from '@/locales';

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, profile, logout } = useSession();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError('');
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setLogoutError(t('logoutError'));
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="site-frame site-header__inner">
          <Link to="/" className="brand">
            <span className="brand__mark" aria-hidden="true">
              ✳
            </span>
            {t('appName')}
          </Link>
          <nav className="site-nav" aria-label={t('mainNavigation')}>
            {user && <Link to="/">{t('home')}</Link>}
          </nav>
          <div className="site-actions">
            <ThemeToggle />
            <select
              id="language-select"
              className="language-select"
              aria-label={t('language')}
              value={i18n.resolvedLanguage ?? 'pt-BR'}
              onChange={(event) => void i18n.changeLanguage(event.target.value)}
            >
              <option value="pt-BR">{t('languagePtBr')}</option>
              <option value="en-US">{t('languageEnUs')}</option>
              <option value="es">{t('languageEs')}</option>
            </select>
            {user ? (
              <>
                <span className="user-name" title={profile?.name ?? user.email ?? undefined}>
                  {profile?.name ?? user.displayName ?? user.email}
                </span>
                <button
                  className="button button--text"
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? t('loggingOut') : t('logout')}
                </button>
                {logoutError && (
                  <span role="alert" className="field-error">
                    {logoutError}
                  </span>
                )}
              </>
            ) : (
              <>
                <Link className="button button--text" to="/login">
                  {t('login')}
                </Link>
                <Link className="button button--primary" to="/register">
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="page-main">{children}</main>
      <footer className="site-footer">
        <div className="site-frame">{t('appName')}</div>
      </footer>
    </>
  );
}
