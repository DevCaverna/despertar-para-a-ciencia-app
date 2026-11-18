import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';

import { LoadingState } from '@/components/LoadingState';
import { useSession } from '@/contexts/SessionContext';
import { AppLayout } from '@/layouts/AppLayout';
import { FeedPage } from '@/pages/FeedPage';
import { getAuthDestination } from '@/utils/auth-destination';

const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })),
);
const SessionProblemPage = lazy(() =>
  import('@/pages/SessionProblemPage').then((module) => ({ default: module.SessionProblemPage })),
);

function WaitForSession() {
  const { t } = useTranslation();
  const { status } = useSession();
  return status === 'initializing' ? <LoadingState label={t('loadingSession')} /> : <Outlet />;
}

function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useTranslation();
  const { user, profileStatus } = useSession();
  const { state } = useLocation();

  if (user) {
    if (profileStatus === 'loading' || profileStatus === 'none') {
      return <LoadingState label={t('checkingProfile')} />;
    }
    if (profileStatus === 'ready') return <Navigate to={getAuthDestination(state)} replace />;
    if (profileStatus === 'not-found' && mode === 'login') {
      return <Navigate to="/register" replace state={state} />;
    }
    if (profileStatus === 'inactive' || profileStatus === 'error') return <SessionProblemPage />;
  }

  return mode === 'login' ? <LoginPage /> : <RegisterPage />;
}

export default function App() {
  return (
    <AppLayout>
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/" element={<FeedPage />} />
          <Route element={<WaitForSession />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/session" element={<SessionProblemPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}
