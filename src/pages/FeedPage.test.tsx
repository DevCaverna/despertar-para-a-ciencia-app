import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { Link, MemoryRouter, useLocation, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { i18n } from '@/locales';
import type { PublishedPost, PublishedPostPage } from '@/models/post.model';
import { FeedPage } from '@/pages/FeedPage';
import { PostService } from '@/services/post.service';

const post: PublishedPost = {
  id: 'post-1',
  title: 'Ciência no cotidiano',
  publishedAt: new Date(2026, 10, 18, 12).toISOString(),
  author: { id: 'author-1', name: 'Maria Silva' },
};

function response(items: PublishedPost[], page = 1, hasNextPage = false) {
  return { data: { items, page, perPage: 20, hasNextPage } } as AxiosResponse<PublishedPostPage>;
}

function NavigationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <output aria-label="URL">{location.pathname + location.search}</output>
      <button onClick={() => void navigate(-1)}>Histórico</button>
      <Link to="/?page=2">Abrir página 2</Link>
    </>
  );
}

function renderFeed(url = '/') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <FeedPage />
      <NavigationProbe />
    </MemoryRouter>,
  );
}

describe('feed público', () => {
  let listPublished: MockInstance<PostService['listPublished']>;
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    listPublished = vi.spyOn(PostService.prototype, 'listPublished');
    scrollIntoView.mockClear();
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('pt-BR');
  });

  it('renderiza cartões textuais na ordem da API, sem criar links para detalhes', async () => {
    const items = [
      { ...post, id: 'older', title: 'Primeiro item da API', publishedAt: '2026-10-22T12:00:00Z' },
      { ...post, author: null },
      { ...post, id: 'same-month', title: 'Terceiro item', publishedAt: '2026-10-01T12:00:00Z' },
    ];
    listPublished.mockResolvedValue(response(items));
    renderFeed();

    const cards = await screen.findAllByRole('article');
    expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual(
      items.map(({ title }) => title),
    );
    expect(within(cards[0]).getByText('Por Maria Silva')).toBeVisible();
    expect(within(cards[1]).getByText('Autoria não informada')).toBeVisible();
    expect(within(cards[1]).getByText('18 de novembro de 2026')).toHaveAttribute(
      'datetime',
      post.publishedAt,
    );
    expect(within(cards[1]).queryByRole('link')).not.toBeInTheDocument();
  });

  it('formata datas de acordo com o idioma sem refazer a consulta', async () => {
    listPublished.mockResolvedValue(response([post]));
    renderFeed();
    expect(await screen.findByText('18 de novembro de 2026')).toBeVisible();

    await act(() => i18n.changeLanguage('en-US'));
    expect(screen.getByText('November 18, 2026')).toBeVisible();
    await act(() => i18n.changeLanguage('es'));
    expect(screen.getByText('18 de noviembre de 2026')).toBeVisible();
    expect(listPublished).toHaveBeenCalledTimes(1);
  });

  it('mostra o carregamento e distingue a primeira página vazia de um erro', async () => {
    listPublished.mockResolvedValue(response([]));
    renderFeed();
    expect(screen.getByText('Carregando publicações…')).toBeVisible();
    expect(await screen.findByText('Ainda não há publicações disponíveis.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('permite repetir a mesma página quando a consulta falha', async () => {
    listPublished
      .mockRejectedValueOnce(new Error('internal details'))
      .mockResolvedValue(response([post], 2));
    renderFeed('/?page=2');
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar');
    expect(screen.queryByText('internal details')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: post.title })).toBeVisible();
    expect(listPublished.mock.calls.map(([page, perPage]) => [page, perPage])).toEqual([
      [2, 20],
      [2, 20],
    ]);
  });

  it('navega entre páginas, preserva outros parâmetros e restaura pelo histórico', async () => {
    listPublished.mockImplementation(async (page) =>
      response([{ ...post, title: `Item ${page}` }], page, page === 1),
    );
    renderFeed('/?origem=teste');
    expect(await screen.findByRole('heading', { name: 'Item 1' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    fireEvent.click(screen.getByRole('link', { name: 'Próxima' }));
    expect(screen.queryByRole('heading', { name: 'Item 1' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Item 2' })).toBeVisible();
    expect(screen.getByLabelText('URL')).toHaveTextContent('/?origem=teste&page=2');
    expect(screen.getByText('Página 2', { exact: true })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();
    expect(screen.getByRole('heading', { name: 'Lista de publicações' })).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('link', { name: 'Anterior' }));
    expect(await screen.findByRole('heading', { name: 'Item 1' })).toBeVisible();
    expect(screen.getByLabelText('URL')).toHaveTextContent('/?origem=teste');
    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }));
    expect(await screen.findByRole('heading', { name: 'Item 2' })).toBeVisible();
  });

  it('oferece retorno ao início quando a página aberta diretamente está vazia', async () => {
    listPublished.mockResolvedValueOnce(response([], 8)).mockResolvedValue(response([post]));
    renderFeed('/?page=8');
    expect(await screen.findByText('Não há publicações nesta página.')).toBeVisible();
    expect(listPublished).toHaveBeenNthCalledWith(1, 8, 20, expect.any(AbortSignal));

    fireEvent.click(screen.getByRole('link', { name: 'Voltar à primeira página' }));
    expect(await screen.findByRole('heading', { name: post.title })).toBeVisible();
    expect(screen.getByLabelText('URL')).toHaveTextContent(/^\/$/);
  });

  it.each(['0', '-1', '1.5', '1e2', '1', '2&page=3', '450359962737051'])(
    'normaliza page=%s sem consultas extras',
    async (raw) => {
      listPublished.mockResolvedValue(response([post]));
      renderFeed(`/?page=${raw}&origem=teste`);
      expect(await screen.findByRole('heading', { name: post.title })).toBeVisible();
      expect(screen.getByLabelText('URL')).toHaveTextContent(/^\/\?origem=teste$/);
      expect(listPublished).toHaveBeenCalledExactlyOnceWith(1, 20, expect.any(AbortSignal));
    },
  );

  it('cancela consultas ao sair da página e ignora respostas entregues fora de ordem', async () => {
    let resolveFirstPage!: (value: AxiosResponse<PublishedPostPage>) => void;
    const lateFirstPage = new Promise<AxiosResponse<PublishedPostPage>>((resolve) => {
      resolveFirstPage = resolve;
    });
    listPublished.mockReturnValueOnce(lateFirstPage).mockResolvedValue(response([post], 2));
    const { unmount } = renderFeed();
    await waitFor(() => expect(listPublished).toHaveBeenCalledTimes(1));
    const firstSignal = listPublished.mock.calls[0][2];

    fireEvent.click(screen.getByRole('link', { name: 'Abrir página 2' }));
    expect(await screen.findByRole('heading', { name: post.title })).toBeVisible();
    expect(firstSignal?.aborted).toBe(true);
    await act(async () => resolveFirstPage(response([{ ...post, title: 'Resposta antiga' }])));
    expect(screen.queryByText('Resposta antiga')).not.toBeInTheDocument();

    const currentSignal = listPublished.mock.calls[1][2];
    unmount();
    expect(currentSignal?.aborted).toBe(true);
  });
});
