import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/App';
import { useSession } from '@/contexts/SessionContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import type { DraftPost } from '@/models/post.model';
import { PostService } from '@/services/post.service';

vi.mock('@/contexts/SessionContext', () => ({ useSession: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('acesso às páginas de rascunho', () => {
  it('bloqueia usuário autenticado sem papel editorial', async () => {
    vi.mocked(useSession).mockReturnValue({
      user: { uid: 'reader', email: 'reader@example.com' },
      profile: { name: 'Leitor' },
      status: 'authenticated',
      profileStatus: 'ready',
      editorAccess: 'denied',
      logout: vi.fn(),
    } as never);
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/drafts/new']}>
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(await screen.findByText('Acesso aos rascunhos indisponível')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Meus rascunhos' })).not.toBeInTheDocument();
  });

  it('retoma a criação de rascunho após autenticação', async () => {
    vi.mocked(useSession).mockReturnValue({
      user: { uid: 'editor', email: 'editor@example.com' },
      profile: { name: 'Colaborador' },
      status: 'authenticated',
      profileStatus: 'ready',
      editorAccess: 'allowed',
      logout: vi.fn(),
    } as never);
    render(
      <ThemeProvider>
        <MemoryRouter
          initialEntries={[{ pathname: '/login', state: { from: { pathname: '/drafts/new' } } }]}
        >
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Criar rascunho' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Meus rascunhos' })).toBeInTheDocument();
  });

  it('carrega uma nova página em vez de limitar a lista aos primeiros 20 rascunhos', async () => {
    vi.mocked(useSession).mockReturnValue({
      user: { uid: 'editor' },
      status: 'authenticated',
      profileStatus: 'ready',
      editorAccess: 'allowed',
    } as never);
    const draft = {
      id: 'draft-0',
      authorId: 'editor',
      status: 'DRAFT',
      title: 'Primeiro',
      content: 'Conteúdo',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
      rejectionReason: null,
      publishedAt: null,
    } satisfies DraftPost;
    const list = vi
      .spyOn(PostService.prototype, 'listDrafts')
      .mockResolvedValueOnce({
        data: Array.from({ length: 20 }, (_, index) => ({
          ...draft,
          id: String(index),
          title: `Rascunho ${index + 1}`,
        })),
      } as never)
      .mockResolvedValueOnce({ data: [{ ...draft, title: 'Rascunho 21' }] } as never);
    render(
      <ThemeProvider>
        <MemoryRouter initialEntries={['/drafts']}>
          <App />
        </MemoryRouter>
      </ThemeProvider>,
    );
    fireEvent.click(await screen.findByRole('link', { name: 'Próxima' }));
    expect(await screen.findByRole('link', { name: /Rascunho 21/ })).toBeInTheDocument();
    expect(list.mock.calls).toEqual([
      [1, 20],
      [2, 20],
    ]);
    expect(screen.queryByRole('link', { name: 'Próxima' })).not.toBeInTheDocument();
  });
});
