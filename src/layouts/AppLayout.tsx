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
      <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-16 w-[calc(100%_-_3rem)] max-w-[1400px] items-center gap-4 max-[720px]:min-h-[3.75rem] max-[720px]:w-[calc(100%_-_2rem)] max-[720px]:flex-wrap max-[720px]:gap-x-3 max-[720px]:gap-y-1 max-[720px]:py-1">
          <Link
            to="/"
            className="mr-auto whitespace-nowrap font-editorial text-lg font-bold text-ink no-underline hover:text-ink hover:no-underline max-[720px]:text-base"
          >
            <span className="mr-2 text-brand" aria-hidden="true">
              ✳
            </span>
            {t('appName')}
          </Link>
          <nav
            className="flex items-center gap-5 max-[720px]:order-3 max-[720px]:w-full max-[720px]:gap-4 max-[720px]:pb-1"
            aria-label={t('mainNavigation')}
          >
            {user && (
              <Link
                className="text-sm text-ink-secondary hover:text-ink hover:no-underline max-[720px]:text-xs"
                to="/"
              >
                {t('home')}
              </Link>
            )}
          </nav>
          <div className="flex items-center gap-5 max-[720px]:gap-1">
            <ThemeToggle />
            <select
              id="language-select"
              className="min-h-9 rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink-secondary"
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
                <span
                  className="max-w-56 truncate text-sm text-ink-secondary max-[720px]:max-w-32 max-[720px]:text-xs"
                  title={profile?.name ?? user.email ?? undefined}
                >
                  {profile?.name ?? user.displayName ?? user.email}
                </span>
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-semibold text-ink-secondary transition-colors hover:bg-canvas-alt hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 max-[720px]:min-h-9 max-[720px]:px-2 max-[720px]:text-xs"
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
      <main className="min-h-[calc(100vh-8rem)]">{children}</main>
      <footer className="border-t border-line py-5 text-[0.8125rem] text-ink-muted">
        <div className="mx-auto w-[calc(100%_-_3rem)] max-w-[1400px] max-[720px]:w-[calc(100%_-_2rem)]">
          {t('appName')}
        </div>
      </footer>
    </>
  );
}
