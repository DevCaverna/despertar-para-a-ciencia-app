import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { getRetryAfterSeconds } from '@/services/api.service';
import { getErrorMessage } from '@/utils/auth-error';

describe('mensagens de autenticação e API', () => {
  it('separa perfil ausente, inativo e indisponibilidade recuperável', () => {
    const makeError = (status: number) => new AxiosError('request failed', undefined, undefined, undefined, {
      status, statusText: '', headers: {}, config: { headers: new AxiosHeaders() }, data: {},
    });
    expect(getErrorMessage(makeError(404))).toContain('Conclua seu cadastro');
    expect(getErrorMessage(makeError(403))).toContain('inativo');
    expect(getErrorMessage(makeError(503))).toContain('temporariamente indisponível');
  });

  it('interpreta Retry-After válido sem aceitar valores inválidos', () => {
    const error = new AxiosError('rate limited', undefined, undefined, undefined, {
      status: 429, statusText: '', headers: { 'retry-after': '37' }, config: { headers: new AxiosHeaders() }, data: {},
    });
    expect(getRetryAfterSeconds(error)).toBe(37);
    error.response!.headers['retry-after'] = 'invalid';
    expect(getRetryAfterSeconds(error)).toBeNull();
  });
});
