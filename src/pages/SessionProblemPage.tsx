import { useState } from 'react';
import { Link } from 'react-router';
import { RouteStatus } from '@/components/RouteStatus';
import { useSession } from '@/contexts/SessionContext';
import { getErrorMessage } from '@/utils/auth-error';

export function SessionProblemPage() {
  const { user, profileStatus, profileError, loadProfile, logout } = useSession();
  const [busy, setBusy] = useState(false);

  if (profileStatus === 'inactive') {
    return <RouteStatus title="Perfil inativo" message="A conta de autenticação existe, mas o perfil local está inativo. Entre em contato com a equipe responsável para recuperar o acesso." action={<button className="button button--secondary" onClick={() => void logout()}>Sair da conta</button>} />;
  }

  async function retry() {
    setBusy(true);
    try { await loadProfile(); } finally { setBusy(false); }
  }

  return (
    <RouteStatus
      title="Não foi possível validar sua sessão"
      message={getErrorMessage(profileError)}
      action={user ? <div style={{ display: 'flex', gap: '.75rem' }}><button className="button button--primary" disabled={busy} onClick={() => void retry()}>{busy ? 'Verificando…' : 'Tentar novamente'}</button><button className="button button--secondary" onClick={() => void logout()}>Sair e entrar novamente</button></div> : <Link className="button button--primary" to="/login">Entrar</Link>}
    />
  );
}
