import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { FormMessage } from '@/components/FormMessage';
import { loginWithPassword } from '@/services/auth.service';
import { getErrorMessage } from '@/utils/auth-error';
import { loginSchema, type LoginValues } from '@/schemas/auth.schemas';

export function LoginPage() {
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError('');
    setSubmitting(true);
    try {
      await loginWithPassword(values.email, values.password);
      const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
      const destination = from?.pathname?.startsWith('/') && !from.pathname.startsWith('//')
        ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
        : '/';
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth" aria-labelledby="login-heading">
        <header className="auth__header">
          <span className="auth__symbol" aria-hidden="true">✳</span>
          <h1 id="login-heading">Que bom ter você de volta</h1>
          <p>Entre para continuar sua jornada científica.</p>
        </header>
        <form className="form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && <FormMessage>{formError}</FormMessage>}
          <div className="form-field">
            <label htmlFor="login-email">E-mail</label>
            <input id="login-email" type="email" autoComplete="email" autoFocus {...register('email')} aria-invalid={Boolean(errors.email)} />
            {errors.email && <span className="field-error">{errors.email.message}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="login-password">Senha</label>
            <input id="login-password" type="password" autoComplete="current-password" {...register('password')} aria-invalid={Boolean(errors.password)} />
            {errors.password && <span className="field-error">{errors.password.message}</span>}
          </div>
          <button className="button button--primary" type="submit" disabled={submitting}>{submitting ? 'Entrando…' : 'Entrar'}</button>
        </form>
        <p className="auth-foot">Ainda não tem uma conta? <Link to="/register">Crie seu cadastro</Link></p>
      </section>
    </div>
  );
}
