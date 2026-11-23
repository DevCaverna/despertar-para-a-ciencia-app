import type { To } from 'react-router';

export function getAuthDestination(state: unknown): To {
  const from = (state as { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null)
    ?.from;
  if (typeof from?.pathname !== 'string') return '/';
  // Only return to implemented destinations outside the auth flow.
  const pathname = from.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const academicWorkRoute =
    /^\/academic-works\/[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:\/generate)?$/;
  if (
    pathname !== '/' &&
    pathname !== '/dashboard' &&
    pathname !== '/academic-works' &&
    !academicWorkRoute.test(pathname)
  )
    return '/';
  return {
    pathname,
    search: typeof from.search === 'string' && from.search.startsWith('?') ? from.search : '',
    hash: typeof from.hash === 'string' && from.hash.startsWith('#') ? from.hash : '',
  };
}
