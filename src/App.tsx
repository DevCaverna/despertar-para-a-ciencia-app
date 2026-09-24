import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { SessionProvider, useSession } from '@/contexts/SessionContext';
import { AppLayout } from '@/layouts/AppLayout';
import { LoadingState } from '@/components/LoadingState';

const HomePage = lazy(() => import('@/pages/HomePage').then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const SessionProblemPage = lazy(() => import('@/pages/SessionProblemPage').then((module) => ({ default: module.SessionProblemPage })));

function SessionRoutes() {
  const { user, status, profileStatus } = useSession();
  const location = useLocation();

  if (status === 'initializing') {
    return <LoadingState label="Restaurando sua sessão…" />;
  }

  return (
    <AppLayout>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/" element={user ? <HomePage /> : <Navigate to="/login" replace state={{ from: location }} />} />
          <Route
            path="/login"
            element={user ? profileStatus === 'loading' ? <LoadingState label="Verificando seu perfil…" /> : profileStatus === 'ready' ? <Navigate to="/" replace /> : profileStatus === 'not-found' ? <Navigate to="/register" replace /> : <SessionProblemPage /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={user ? profileStatus === 'loading' ? <LoadingState label="Verificando seu perfil…" /> : profileStatus === 'ready' ? <Navigate to="/" replace /> : profileStatus === 'inactive' || profileStatus === 'error' ? <SessionProblemPage /> : <RegisterPage /> : <RegisterPage />}
          />
          <Route path="/session" element={<SessionProblemPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default function App() {
  return <SessionProvider><SessionRoutes /></SessionProvider>;
}
