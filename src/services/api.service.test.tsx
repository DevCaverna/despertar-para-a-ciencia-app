import { render } from '@testing-library/react';
import { AxiosError, AxiosHeaders, type AxiosAdapter } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getIdToken = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({ currentUser: { getIdToken } }));
vi.mock('@/services/firebase.service', () => ({ auth }));

import { api, ApiProvider } from '@/hooks/useApi';
import type { PublishedPostPage } from '@/models/post.model';
import { PostService } from '@/services/post.service';

describe('cliente HTTP centralizado', () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    vi.clearAllMocks();
    getIdToken.mockResolvedValue('fresh-token');
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
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
