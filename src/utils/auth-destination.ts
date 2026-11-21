import type { To } from 'react-router';

export function getAuthDestination(state: unknown): To {
  const from = (state as { from?: { pathname?: unknown; search?: unknown; hash?: unknown } } | null)
    ?.from;
  if (typeof from?.pathname !== 'string') return '/';
  // Only return to implemented destinations outside the auth flow.
  const pathname = from.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const isDraftEditor = /^\/drafts\/[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}\/edit$/.test(pathname);
  if (!['/', '/dashboard', '/drafts', '/drafts/new'].includes(pathname) && !isDraftEditor)
    return '/';
  return {
    pathname,
    search: typeof from.search === 'string' && from.search.startsWith('?') ? from.search : '',
    hash: typeof from.hash === 'string' && from.hash.startsWith('#') ? from.hash : '',
  };
}
