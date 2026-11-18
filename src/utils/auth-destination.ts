import type { To } from 'react-router';

export function getAuthDestination(state: unknown): To {
  const from = (state as { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null)
    ?.from;
  if (typeof from?.pathname !== 'string') return '/';
  // Only return to implemented destinations outside the auth flow.
  const pathname = from.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  if (pathname !== '/' && pathname !== '/dashboard') return '/';
  return {
    pathname,
    search: typeof from.search === 'string' && from.search.startsWith('?') ? from.search : '',
    hash: typeof from.hash === 'string' && from.hash.startsWith('#') ? from.hash : '',
  };
}
