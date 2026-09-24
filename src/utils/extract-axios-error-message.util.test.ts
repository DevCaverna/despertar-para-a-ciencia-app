import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { getRetryAfterSeconds } from '@/utils/api-error';
import { extractAxiosErrorMessage } from '@/utils/extract-axios-error-message.util';

describe('mensagens de autenticação e API', () => {
  it('usa mensagens localizadas para status sem mensagem de API', () => {
    const makeError = (status: number) =>
      new AxiosError('request failed', undefined, undefined, undefined, {
        status,
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: {},
      });
    expect(extractAxiosErrorMessage(makeError(404))).toContain('Conclua seu cadastro');
    expect(extractAxiosErrorMessage(makeError(403))).toContain('inativo');
    expect(extractAxiosErrorMessage(makeError(503))).toContain('temporariamente indisponível');
  });

  it('extrai mensagens e mensagens de validação da resposta da API', () => {
    const makeError = (message: unknown) =>
      new AxiosError('request failed', undefined, undefined, undefined, {
        status: 400,
        statusText: '',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: { message },
      });

    expect(extractAxiosErrorMessage(makeError('Invalid code'))).toBe('Invalid code');
    expect(extractAxiosErrorMessage(makeError(['First error', 'Second error']))).toBe(
      'First error, Second error',
    );
    expect(
      extractAxiosErrorMessage(
        makeError([{ constraints: { isEmail: 'Must be an email address' } }]),
      ),
    ).toBe('Must be an email address');
  });

  it('interpreta Retry-After válido sem aceitar valores inválidos', () => {
    const error = new AxiosError('rate limited', undefined, undefined, undefined, {
      status: 429,
      statusText: '',
      headers: { 'retry-after': '37' },
      config: { headers: new AxiosHeaders() },
      data: {},
    });
    expect(getRetryAfterSeconds(error)).toBe(37);
    error.response!.headers['retry-after'] = 'invalid';
    expect(getRetryAfterSeconds(error)).toBeNull();
  });
});
