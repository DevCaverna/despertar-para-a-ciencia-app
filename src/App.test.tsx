import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AxiosResponse } from 'axios';
import type { UserCredential } from 'firebase/auth';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import App from '@/App';
import { useSession } from '@/contexts/SessionContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import type { PublishedPostDetail, PublishedPostPage } from '@/models/post.model';
import { completeProfile, createFirebaseAccount, loginWithPassword } from '@/services/auth.service';
import { PostService } from '@/services/post.service';
import { UserService } from '@/services/user.service';

vi.mock('@/contexts/SessionContext', () => ({ useSession: vi.fn() }));
vi.mock('@/services/auth.service', () => ({
  completeProfile: vi.fn(),
  createFirebaseAccount: vi.fn(),
  loginWithPassword: vi.fn(),
}));

const guest: ReturnType<typeof useSession> = {
  user: null,
  profile: null,
  status: 'unauthenticated',
  profileStatus: 'none',
  editorAccess: 'denied',
  profileError: null,
  loadProfile: vi.fn().mockResolvedValue(null),
  logout: vi.fn().mockResolvedValue(undefined),
};
const user = {
  uid: 'test-user',
  displayName: 'Maria Silva',
  email: 'maria@example.com',
} as NonNullable<typeof guest.user>;
const detail: PublishedPostDetail = {
  id: '019abcde-f000-7000-8000-000000000002',
  title: 'Título retornado pela API',
  author: null,
  publishedAt: '2026-11-18T12:00:00.000Z',
  content: 'Conteúdo completo.',
};

function CurrentURL() {
  const { pathname, search, hash } = useLocation();
  return <output aria-label="URL">{pathname + search + hash}</output>;
}

function renderApp(url = '/', state?: unknown) {
  const { pathname, search, hash } = new URL(url, 'http://localhost');
  return render(
    <MemoryRouter initialEntries={[{ pathname, search, hash, state }]}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
      <CurrentURL />
    </MemoryRouter>,
  );
}

describe('rotas públicas e sessão', () => {
  let listPublished: MockInstance<PostService['listPublished']>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSession).mockReturnValue(guest);
    vi.spyOn(PostService.prototype, 'getPublished').mockResolvedValue({
      data: detail,
    } as AxiosResponse<PublishedPostDetail>);
    listPublished = vi.spyOn(PostService.prototype, 'listPublished').mockResolvedValue({
      data: {
        items: [
          {
            id: detail.id,
            title: detail.title,
            author: null,
            publishedAt: '2026-11-18T12:00:00.000Z',
          },
        ],
        page: 1,
        perPage: 20,
        hasNextPage: false,
      },
    } as AxiosResponse<PublishedPostPage>);
  });

  afterEach(cleanup);

  it('mostra o feed e os controles de visitante sem exigir login', async () => {
    renderApp();
    expect(await screen.findByRole('article')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Publicações' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Entrar' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Criar conta' })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('combobox', { name: 'Idioma' })).toBeVisible();
  });

  it.each(['loading', 'ready', 'not-found', 'inactive', 'error'] as const)(
    'mostra o feed autenticado com o perfil em estado %s',
    async (profileStatus) => {
      vi.mocked(useSession).mockReturnValue({
        ...guest,
        user,
        status: 'authenticated',
        profileStatus,
      });
      renderApp();
      expect(await screen.findByRole('article')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible();
      expect(screen.getByRole('link', { name: 'Painel' })).toHaveAttribute('href', '/dashboard');
      expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
    },
  );

  it('não bloqueia o feed nem exibe botões de visitante durante a restauração', async () => {
    vi.mocked(useSession).mockReturnValue({ ...guest, status: 'initializing' });
    renderApp();
    expect(await screen.findByRole('article')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Publicações' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Entrar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Criar conta' })).not.toBeInTheDocument();
  });

  it.each(['unauthenticated', 'initializing', 'authenticated'] as const)(
    'abre o detalhe diretamente com sessão em estado %s',
    async (status) => {
      vi.mocked(useSession).mockReturnValue({
        ...guest,
        status,
        user: status === 'authenticated' ? user : null,
        profileStatus: status === 'authenticated' ? 'error' : 'none',
      });
      renderApp(`/posts/${detail.id}`);
      expect(await screen.findByRole('heading', { level: 1, name: detail.title })).toHaveFocus();
      expect(screen.getByText(detail.content)).toBeVisible();
      expect(screen.getByLabelText('URL')).toHaveTextContent(`/posts/${detail.id}`);
      expect(screen.getAllByRole('link', { name: 'Voltar às publicações' })[0]).toHaveAttribute(
        'href',
        '/',
      );
      expect(listPublished).not.toHaveBeenCalled();
    },
  );

  it('abre o card por teclado e retorna à página de origem do feed', async () => {
    const titleBefore = document.title;
    renderApp('/?origem=teste&page=3');
    const link = await screen.findByRole('link', { name: detail.title });
    link.focus();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByText(detail.content)).toBeVisible();
    expect(screen.getByLabelText('URL').textContent).toBe(`/posts/${detail.id}`);
    expect(document.title).toBe(`${detail.title} — Despertar para a Ciência`);
    const [back] = screen.getAllByRole('link', { name: 'Voltar às publicações' });
    expect(back).toHaveAttribute('href', '/?origem=teste&page=3');
    await userEvent.click(back);

    expect(await screen.findByRole('link', { name: detail.title })).toBeVisible();
    expect(screen.getByLabelText('URL').textContent).toBe('/?origem=teste&page=3');
    expect(listPublished).toHaveBeenLastCalledWith(3, 20, expect.any(AbortSignal));
    expect(document.title).toBe(titleBefore);
  });

  it('protege o painel enquanto aguarda a sessão', () => {
    vi.mocked(useSession).mockReturnValue({ ...guest, status: 'initializing' });
    renderApp('/dashboard');
    expect(screen.getByText('Restaurando sua sessão…')).toBeVisible();
    expect(screen.getByLabelText('URL')).toHaveTextContent(/^\/dashboard$/);
    expect(listPublished).not.toHaveBeenCalled();
  });

  it('redireciona visitantes do painel ao login e conserva o destino após autenticar', async () => {
    vi.mocked(loginWithPassword).mockImplementation(async () => {
      vi.mocked(useSession).mockReturnValue({
        ...guest,
        user,
        status: 'authenticated',
        profileStatus: 'ready',
      });
      return { user } as UserCredential;
    });
    renderApp('/dashboard?origem=teste#inicio');
    fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText(/Olá, Maria Silva/)).toBeVisible();
    expect(screen.getByLabelText('URL')).toHaveTextContent(/^\/dashboard\?origem=teste#inicio$/);
    expect(listPublished).not.toHaveBeenCalled();
  });

  it('retorna ao feed se o redirecionamento informado for externo', async () => {
    vi.mocked(useSession).mockReturnValue({
      ...guest,
      user,
      status: 'authenticated',
      profileStatus: 'ready',
    });
    renderApp('/login', { from: { pathname: '//example.com' } });
    expect(await screen.findByRole('article')).toBeVisible();
    expect(screen.getByLabelText('URL')).toHaveTextContent(/^\/$/);
  });

  it('mantém acessível a recuperação da sessão quando o perfil falha', async () => {
    vi.mocked(useSession).mockReturnValue({
      ...guest,
      user,
      status: 'authenticated',
      profileStatus: 'error',
    });
    renderApp('/session');
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));
    expect(guest.loadProfile).toHaveBeenCalledOnce();
    expect(listPublished).not.toHaveBeenCalled();
  });

  it('mantém o fluxo de cadastro com verificação e retorno padrão ao feed', async () => {
    vi.spyOn(UserService.prototype, 'sendVerificationCode').mockResolvedValue(
      {} as AxiosResponse<void>,
    );
    vi.mocked(createFirebaseAccount).mockResolvedValue({ user } as UserCredential);
    vi.mocked(completeProfile).mockResolvedValue({} as Awaited<ReturnType<typeof completeProfile>>);
    renderApp('/register');
    fireEvent.change(await screen.findByLabelText('Nome completo'), {
      target: { value: 'Maria Silva' },
    });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'maria@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha', { exact: true }), {
      target: { value: 'password' },
    });
    fireEvent.change(screen.getByLabelText('Confirme sua senha'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.change(await screen.findByLabelText('Código de verificação'), {
      target: { value: '123456' },
    });
    fireEvent.click(screen.getByRole('button', { name: /verificar e criar/i }));
    expect(await screen.findByRole('article')).toBeVisible();
    expect(completeProfile).toHaveBeenCalledWith(
      { name: 'Maria Silva', email: 'maria@example.com', code: '123456' },
      expect.any(UserService),
    );
    expect(screen.getByLabelText('URL')).toHaveTextContent(/^\/$/);
  });
});
