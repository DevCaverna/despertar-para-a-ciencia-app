import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Informe um e-mail válido.').transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'Informe sua senha.'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome.').max(160, 'O nome deve ter no máximo 160 caracteres.'),
  email: z.string().trim().email('Informe um e-mail válido.').transform((value) => value.toLowerCase()),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
  passwordConfirmation: z.string().min(1, 'Confirme sua senha.'),
}).refine((data) => data.password === data.passwordConfirmation, {
  message: 'As senhas não coincidem.',
  path: ['passwordConfirmation'],
});

export const onboardingSchema = z.object({
  name: z.string().trim().min(1, 'Informe seu nome.').max(160, 'O nome deve ter no máximo 160 caracteres.'),
  email: z.string().trim().email('Informe um e-mail válido.').transform((value) => value.toLowerCase()),
});

export const verificationCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Informe os seis dígitos do código.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
