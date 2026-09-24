import { Navigate } from 'react-router';
import { LoadingState } from '@/components/LoadingState';
import { RouteStatus } from '@/components/RouteStatus';
import { useSession } from '@/contexts/SessionContext';

export function HomePage() {
  const { user, profile, profileStatus, loadProfile } = useSession();

  if (!user) return <Navigate to="/login" replace />;
  if (profileStatus === 'loading' || profileStatus === 'none') return <LoadingState label="Verificando seu perfil…" />;
  if (profileStatus === 'not-found') return <Navigate to="/register" replace />;
  if (profileStatus === 'inactive') {
    return <RouteStatus title="Perfil inativo" message="Sua conta está autenticada, mas o perfil local está inativo. Entre em contato com a equipe responsável para recuperar o acesso." />;
  }
  if (profileStatus === 'error') {
    return <RouteStatus title="Não foi possível carregar seu perfil" message="Sua sessão foi preservada. Verifique sua conexão e tente novamente." action={<button className="button button--primary" onClick={() => void loadProfile()}>Tentar novamente</button>} />;
  }

  return (
    <div className="site-frame">
      <section className="home-intro" aria-labelledby="home-heading">
        <p className="eyebrow">Conhecimento em movimento</p>
        <h1 id="home-heading">Um espaço para despertar a curiosidade científica.</h1>
        <p className="home-intro__lead">Olá, {profile?.name ?? user.displayName ?? 'cientista'}. Sua conta está pronta. Novas experiências de leitura e descoberta serão construídas aqui.</p>
      </section>
    </div>
  );
}
