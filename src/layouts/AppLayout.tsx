import { Link, useNavigate } from 'react-router';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';

export function AppLayout({ children }: { children: ReactNode }) {
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
      setLogoutError('Não foi possível encerrar a sessão. Tente novamente.');
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="site-frame site-header__inner">
          <Link to="/" className="brand"><span className="brand__mark" aria-hidden="true">✳</span>Despertar para a Ciência</Link>
          <nav className="site-nav" aria-label="Navegação principal">
            {user && <Link to="/">Início</Link>}
          </nav>
          <div className="site-actions">
            {user ? (
              <>
                <span className="user-name" title={profile?.name ?? user.email ?? undefined}>{profile?.name ?? user.displayName ?? user.email}</span>
                <button className="button button--text" type="button" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? 'Saindo…' : 'Sair'}
                </button>
                {logoutError && <span role="alert" className="field-error">{logoutError}</span>}
              </>
            ) : (
              <>
                <Link className="button button--text" to="/login">Entrar</Link>
                <Link className="button button--primary" to="/register">Criar conta</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="page-main">{children}</main>
      <footer className="site-footer">
        <div className="site-frame">Despertar para a Ciência</div>
      </footer>
    </>
  );
}
