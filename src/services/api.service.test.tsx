import { render } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getIdToken = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({ currentUser: { getIdToken } }));
vi.mock('@/services/firebase.service', () => ({ auth }));

import { api, ApiProvider } from '@/hooks/useApi';

describe('cliente HTTP centralizado', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getIdToken.mockResolvedValue('fresh-token');
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
