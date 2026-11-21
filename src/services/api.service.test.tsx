import { cleanup, render } from '@testing-library/react';
import { AxiosError, AxiosHeaders, CanceledError, type AxiosAdapter } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getIdToken = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({ currentUser: { getIdToken } }));
vi.mock('@/services/firebase.service', () => ({ auth }));

import { api, ApiProvider } from '@/hooks/useApi';
import type { PublishedPostDetail, PublishedPostPage } from '@/models/post.model';
import { PostService } from '@/services/post.service';

const detail: PublishedPostDetail = {
  id: '019abcde-f000-7000-8000-000000000002',
  title: 'Ciência no cotidiano',
  content: 'Introdução.\n\nConclusão.',
  publishedAt: '2026-11-18T12:00:00.000Z',
  author: null,
};

describe('cliente HTTP centralizado', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    vi.clearAllMocks();
    getIdToken.mockResolvedValue('fresh-token');
  });

  afterEach(() => {
    cleanup();
    api.defaults.adapter = originalAdapter;
  });

  it('envia token na listagem e no detalhe privado de rascunhos', async () => {
    render(<ApiProvider>{null}</ApiProvider>);
    const adapter = vi.fn<AxiosAdapter>(async (config) => ({
      data: [],
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config,
    }));
    api.defaults.adapter = adapter;
    const posts = new PostService(api);

    await posts.listDrafts(2, 20);
    await posts.getDraft(detail.id);

    expect(adapter.mock.calls[0][0]).toMatchObject({
      url: '/posts/drafts',
      params: { page: 2, perPage: 20 },
    });
    expect(adapter.mock.calls[1][0].url).toBe(`/posts/drafts/${detail.id}`);
    for (const [config] of adapter.mock.calls) {
      expect(config.headers.get('Authorization')).toBe('Bearer fresh-token');
    }
  });

  it('consulta posts com paginação e cancelamento, sem pedir ou enviar token', async () => {
    render(<ApiProvider>{null}</ApiProvider>);
    const data: PublishedPostPage = { items: [], page: 2, perPage: 20, hasNextPage: false };
    const { signal } = new AbortController();
    api.defaults.adapter = async (config) => {
      expect(config.url).toBe('/posts');
      expect(config.params).toEqual({ page: 2, perPage: 20 });
      expect(config.signal).toBe(signal);
      expect(config.headers.toJSON()).not.toHaveProperty('Authorization');
      return { data, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config };
    };

    await expect(new PostService(api).listPublished(2, 20, signal)).resolves.toMatchObject({
      data,
    });
    expect(getIdToken).not.toHaveBeenCalled();
  });

  it('propaga falha da consulta pública sem renovar token nem repetir a requisição', async () => {
    render(<ApiProvider>{null}</ApiProvider>);
    const error = new AxiosError('unauthorized');
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      error.config = config;
      error.response = {
        status: 401,
        statusText: 'Unauthorized',
        headers: new AxiosHeaders(),
        config,
        data: {},
      };
      throw error;
    });
    api.defaults.adapter = adapter;

    await expect(new PostService(api).listPublished(1, 20)).rejects.toBe(error);
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(getIdToken).not.toHaveBeenCalled();
  });

  it('consulta o detalhe público pelo cliente central sem pedir ou enviar token', async () => {
    render(<ApiProvider>{null}</ApiProvider>);
    const { signal } = new AbortController();
    api.defaults.adapter = async (config) => {
      expect(config.url).toBe(`/posts/${detail.id}`);
      expect(config.method).toBe('get');
      expect(config.signal).toBe(signal);
      expect(config.headers.toJSON()).not.toHaveProperty('Authorization');
      return { data: detail, status: 200, statusText: 'OK', headers: new AxiosHeaders(), config };
    };

    const { data } = await new PostService(api).getPublished(detail.id, signal);
    expect(data.content).toBe(detail.content);
    expect(data).toEqual(detail);
    expect(getIdToken).not.toHaveBeenCalled();
  });

  it.each([401, 404])('propaga %i no detalhe público sem renovar token', async (status) => {
    render(<ApiProvider>{null}</ApiProvider>);
    const adapter = vi.fn<AxiosAdapter>(async (config) => {
      throw new AxiosError('failure', undefined, config, undefined, {
        status,
        statusText: 'Failure',
        headers: new AxiosHeaders(),
        config,
        data: {},
      });
    });
    api.defaults.adapter = adapter;

    await expect(new PostService(api).getPublished(detail.id)).rejects.toMatchObject({
      response: { status },
    });
    expect(adapter).toHaveBeenCalledOnce();
    expect(getIdToken).not.toHaveBeenCalled();
  });

  it('não despacha a consulta de detalhe se o sinal já estiver cancelado', async () => {
    render(<ApiProvider>{null}</ApiProvider>);
    const adapter = vi.fn<AxiosAdapter>();
    api.defaults.adapter = adapter;
    const controller = new AbortController();
    controller.abort();

    await expect(
      new PostService(api).getPublished(detail.id, controller.signal),
    ).rejects.toBeInstanceOf(CanceledError);
    expect(adapter).not.toHaveBeenCalled();
    expect(getIdToken).not.toHaveBeenCalled();
  });

  it('renova o token uma vez e repete a requisição após 401', async () => {
    render(
      <ApiProvider>
        <div />
      </ApiProvider>,
    );
    let requests = 0;
    api.defaults.adapter = vi.fn(async (config) => {
      requests += 1;
      if (requests === 1) {
        throw new AxiosError(
          'unauthorized',
          undefined,
          config,
          {},
          {
            status: 401,
            statusText: 'Unauthorized',
            headers: new AxiosHeaders(),
            config,
            data: {},
          },
        );
      }
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders(),
        config,
      };
    });
    getIdToken.mockResolvedValueOnce('expired-token').mockResolvedValue('fresh-token');

    await expect(api.get('/users/profile')).resolves.toMatchObject({ data: { ok: true } });
    expect(requests).toBe(2);
    expect(getIdToken).toHaveBeenCalledWith(true);
  });

  it('não repete uma segunda resposta 401 indefinidamente', async () => {
    render(
      <ApiProvider>
        <div />
      </ApiProvider>,
    );
    let requests = 0;
    api.defaults.adapter = vi.fn(async (config) => {
      requests += 1;
      throw new AxiosError(
        'unauthorized',
        undefined,
        config,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          headers: new AxiosHeaders(),
          config,
          data: {},
        },
      );
    });

    await expect(api.get('/users/profile')).rejects.toMatchObject({ response: { status: 401 } });
    expect(requests).toBe(2);
  });
});
