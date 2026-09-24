import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('validationEmail')
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, 'validationPassword'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'validationName').max(160, 'validationNameLength'),
    email: z
      .string()
      .trim()
      .email('validationEmail')
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8, 'validationPasswordLength'),
    passwordConfirmation: z.string().min(1, 'validationConfirmPassword'),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: 'validationPasswordMismatch',
    path: ['passwordConfirmation'],
  });

export const onboardingSchema = z.object({
  name: z.string().trim().min(1, 'validationName').max(160, 'validationNameLength'),
  email: z
    .string()
    .trim()
    .email('validationEmail')
    .transform((value) => value.toLowerCase()),
});

export const verificationCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'validationCode'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
