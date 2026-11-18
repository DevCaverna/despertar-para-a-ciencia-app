import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AxiosError, type AxiosResponse } from 'axios';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

import { i18n } from '@/locales';
import type { PublishedPostDetail } from '@/models/post.model';
import { PostDetailPage } from '@/pages/PostDetailPage';
import { PostService } from '@/services/post.service';

const post: PublishedPostDetail = {
  id: '019abcde-f000-7000-8000-000000000002',
  title: 'Ciência no cotidiano',
  content: 'Primeiro parágrafo.\n\n<b>Texto literal</b>.\n' + 'a'.repeat(400),
  publishedAt: new Date(2026, 10, 18, 12).toISOString(),
  author: { id: 'author', name: 'Maria Silva' },
};
const secondPost = { ...post, id: '019abcde-f000-7000-8000-000000000003', title: 'Outro post' };

function response(data = post) {
  return { data } as AxiosResponse<PublishedPostDetail>;
}

function deferredResponse() {
  let resolve!: (value: AxiosResponse<PublishedPostDetail>) => void;
  const promise = new Promise<AxiosResponse<PublishedPostDetail>>((callback) => {
    resolve = callback;
  });
  return { promise, resolve };
}

function httpError(status: number) {
  const error = new AxiosError('detalhe técnico');
  error.response = { status } as AxiosResponse;
  return error;
}

function NavigationProbe() {
  const { pathname } = useLocation();
  return (
    <>
      <output aria-label="URL">{pathname}</output>
      <Link to={`/posts/${post.id}`}>Primeiro post</Link>
      <Link to={`/posts/${secondPost.id}`}>Segundo post</Link>
    </>
  );
}

function renderDetail(id = post.id, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: `/posts/${id}`, state }]}>
      <Routes>
        <Route path="/posts/:id" element={<PostDetailPage />} />
      </Routes>
      <NavigationProbe />
    </MemoryRouter>,
  );
}

describe('publicação individual', () => {
  let getPublished: MockInstance<PostService['getPublished']>;

  beforeEach(() => {
    getPublished = vi.spyOn(PostService.prototype, 'getPublished');
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage('pt-BR');
  });

  it('anuncia o carregamento e exibe e foca o título com o conteúdo integral como texto', async () => {
    const pending = deferredResponse();
    getPublished.mockReturnValue(pending.promise);
    renderDetail();
    expect(screen.getByText('Carregando publicação…')).toHaveAttribute('role', 'status');
    expect(document.title).toBe('Publicação — Despertar para a Ciência');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();

    await act(async () => pending.resolve(response()));
    const article = screen.getByRole('article');
    expect(within(article).getByRole('heading', { level: 1, name: post.title })).toHaveFocus();
    const content = within(article).getByText(/Primeiro parágrafo/);
    expect(content.textContent).toBe(post.content);
    expect(content).toHaveClass('whitespace-pre-wrap', 'wrap-anywhere');
    expect(content.querySelector('b')).toBeNull();
    expect(within(article).getByText('Por Maria Silva')).toBeVisible();
    expect(
      within(article).getByText('18 de novembro de 2026', { selector: 'time' }),
    ).toHaveAttribute('datetime', post.publishedAt);
  });

  it('traduz a autoria indisponível e a data sem alterar o post nem repetir a consulta', async () => {
    getPublished.mockResolvedValue(response({ ...post, author: null }));
    renderDetail();
    expect(await screen.findByText('Autoria não informada')).toBeVisible();
    await act(() => i18n.changeLanguage('en-US'));
    expect(screen.getByText('Author not listed')).toBeVisible();
    expect(screen.getByText('November 18, 2026')).toBeVisible();
    expect(document.title).toBe(`${post.title} — Awakening to Science`);
    await act(() => i18n.changeLanguage('es'));
    expect(screen.getByText('Autoría no indicada')).toBeVisible();
    expect(screen.getByText('18 de noviembre de 2026')).toBeVisible();
    expect(screen.getByRole('heading', { name: post.title })).toBeVisible();
    expect(getPublished).toHaveBeenCalledOnce();
  });

  it.each([400, 404])('mostra a mesma indisponibilidade para HTTP %i', async (status) => {
    getPublished.mockRejectedValue(httpError(status));
    renderDetail(post.id, { feedSearch: '//example.com/?page=2' });

    expect(await screen.findByRole('heading', { name: 'Publicação não encontrada' })).toHaveFocus();
    expect(screen.getByRole('link', { name: 'Voltar às publicações' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(screen.getByLabelText('URL').textContent).toBe(`/posts/${post.id}`);
    expect(screen.queryByText('detalhe técnico')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument();
  });

  it('mantém a URL inválida e não consulta a API', () => {
    renderDetail('id-invalido');
    expect(screen.getByRole('heading', { name: 'Publicação não encontrada' })).toBeVisible();
    expect(screen.getByLabelText('URL').textContent).toBe('/posts/id-invalido');
    expect(getPublished).not.toHaveBeenCalled();
  });

  it.each([new AxiosError('detalhe técnico', 'ERR_NETWORK'), httpError(503)])(
    'permite tentar novamente no mesmo post após falha recuperável (%s)',
    async (error) => {
      getPublished.mockRejectedValueOnce(error).mockResolvedValue(response());
      renderDetail();
      expect(await screen.findByRole('alert')).toHaveTextContent('Verifique sua conexão');
      expect(screen.queryByText('detalhe técnico')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
      expect(await screen.findByRole('heading', { name: post.title })).toHaveFocus();
      expect(getPublished.mock.calls.map(([id]) => id)).toEqual([post.id, post.id]);
    },
  );

  it('limpa o post anterior imediatamente, cancela consultas e ignora uma resposta tardia', async () => {
    const pending = deferredResponse();
    getPublished
      .mockResolvedValueOnce(response())
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce(response());
    const { unmount } = renderDetail();
    expect(await screen.findByRole('heading', { name: post.title })).toBeVisible();
    fireEvent.click(screen.getByRole('link', { name: 'Segundo post' }));
    expect(screen.queryByRole('heading', { name: post.title })).not.toBeInTheDocument();
    expect(screen.getByText('Carregando publicação…')).toBeVisible();
    expect(getPublished.mock.calls[0][1]?.aborted).toBe(true);
    expect(getPublished.mock.calls[1][0]).toBe(secondPost.id);

    fireEvent.click(screen.getByRole('link', { name: 'Primeiro post' }));
    expect(await screen.findByRole('heading', { name: post.title })).toBeVisible();
    expect(getPublished.mock.calls[1][1]?.aborted).toBe(true);
    await act(async () => pending.resolve(response(secondPost)));
    expect(screen.queryByRole('heading', { name: secondPost.title })).not.toBeInTheDocument();
    unmount();
    expect(getPublished.mock.calls[2][1]?.aborted).toBe(true);
  });
});
