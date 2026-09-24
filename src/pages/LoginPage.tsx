import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router';

import { FormMessage } from '@/components/FormMessage';
import { loginSchema, type LoginValues } from '@/schemas/auth.schemas';
import { loginWithPassword } from '@/services/auth.service';
import { extractAxiosErrorMessage } from '@/utils/extract-axios-error-message.util';
import { translateValidationMessage } from '@/utils/validation-message';

export function LoginPage() {
  const { t } = useTranslation();
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginValues) {
    setFormError('');
    setSubmitting(true);
    try {
      await loginWithPassword(values.email, values.password);
      const from = (
        location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null
      )?.from;
      const destination =
        from?.pathname?.startsWith('/') && !from.pathname.startsWith('//')
          ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
          : '/';
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(extractAxiosErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth" aria-labelledby="login-heading">
        <header className="auth__header">
          <span className="auth__symbol" aria-hidden="true">
            ✳
          </span>
          <h1 id="login-heading">{t('loginTitle')}</h1>
          <p>{t('loginSubtitle')}</p>
        </header>
        <form className="form-card" onSubmit={handleSubmit(onSubmit)} noValidate>
          {formError && <FormMessage>{formError}</FormMessage>}
          <div className="form-field">
            <label htmlFor="login-email">{t('email')}</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              autoFocus
              {...register('email')}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email && (
              <span className="field-error">
                {translateValidationMessage(errors.email.message ?? '')}
              </span>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="login-password">{t('password')}</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <span className="field-error">
                {translateValidationMessage(errors.password.message ?? '')}
              </span>
            )}
          </div>
          <button className="button button--primary" type="submit" disabled={submitting}>
            {submitting ? t('loggingIn') : t('login')}
          </button>
        </form>
        <p className="auth-foot">
          {t('noAccount')} <Link to="/register">{t('createAccount')}</Link>
        </p>
      </section>
    </div>
  );
}
