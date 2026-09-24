import { describe, expect, it } from 'vitest';
import { loginSchema, onboardingSchema, registerSchema, verificationCodeSchema } from '@/schemas/auth.schemas';

describe('schemas de autenticação', () => {
  it('normaliza o e-mail e valida credenciais de login', () => {
    expect(loginSchema.parse({ email: '  ANA@EXAMPLE.COM ', password: 'senha' })).toEqual({ email: 'ana@example.com', password: 'senha' });
    expect(loginSchema.safeParse({ email: 'email inválido', password: '' }).success).toBe(false);
  });

  it('exige senha com tamanho mínimo e confirmação coincidente', () => {
    const valid = { name: 'Ada Lovelace', email: 'ada@example.com', password: 'senha-segura', passwordConfirmation: 'senha-segura' };
    expect(registerSchema.safeParse(valid).success).toBe(true);
    expect(registerSchema.safeParse({ ...valid, passwordConfirmation: 'outra-senha' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, password: 'curta', passwordConfirmation: 'curta' }).success).toBe(false);
  });

  it('aceita somente código numérico de seis dígitos e dados válidos para retomar cadastro', () => {
    expect(verificationCodeSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(verificationCodeSchema.safeParse({ code: '12a456' }).success).toBe(false);
    expect(onboardingSchema.safeParse({ name: 'Ada', email: 'ada@example.com' }).success).toBe(true);
  });
});
