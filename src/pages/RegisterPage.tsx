import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { FormMessage } from '@/components/FormMessage';
import { useSession } from '@/contexts/SessionContext';
import { useApi } from '@/hooks/useApi';
import {
  onboardingSchema,
  registerSchema,
  verificationCodeSchema,
  type RegisterValues,
} from '@/schemas/auth.schemas';
import { createFirebaseAccount, completeProfile, loginWithPassword } from '@/services/auth.service';
import { UserService } from '@/services/user.service';
import { getRetryAfterSeconds } from '@/utils/api-error';
import { extractAxiosErrorMessage } from '@/utils/extract-axios-error-message.util';
import { translateValidationMessage } from '@/utils/validation-message';

interface AccountDetails {
  name: string;
  email: string;
  password?: string;
}

export function RegisterPage() {
  const { user } = useSession();
  return user ? <ResumeRegistration key={user.uid} /> : <NewRegistration />;
}

function NewRegistration() {
  const { t } = useTranslation();
  const api = useApi();
  const userService = useMemo(() => new UserService(api), [api]);
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { loadProfile } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const {
    register: registerCode,
    handleSubmit: handleCodeSubmit,
    setError,
    formState: { errors: codeErrors },
  } = useForm<{ code: string }>({ resolver: zodResolver(verificationCodeSchema) });

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(account: AccountDetails) {
    setBusy(true);
    setFormError('');
    setSuccess('');
    try {
      await userService.sendVerificationCode({ email: account.email });
      setDetails(account);
      setCooldown(60);
      setSuccess(t('emailCodeSent', { email: account.email }));
    } catch (error) {
      const retry = getRetryAfterSeconds(error);
      if (retry) setCooldown(retry);
      setFormError(extractAxiosErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function onDetails(values: RegisterValues) {
    await requestCode({ name: values.name, email: values.email, password: values.password });
  }

  async function onVerify(values: { code: string }) {
    if (!details) return;
    setBusy(true);
    setFormError('');
    try {
      try {
        await createFirebaseAccount(details.name, details.email, details.password ?? '');
      } catch (error) {
        if ((error as { code?: string }).code !== 'auth/email-already-in-use' || !details.password)
          throw error;
        await loginWithPassword(details.email, details.password);
      }
      await completeProfile(
        { name: details.name, email: details.email, code: values.code },
        userService,
      );
      await loadProfile();
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(extractAxiosErrorMessage(error));
      if (error && typeof error === 'object' && 'code' in error) {
        const codeError = error as { code?: string };
        if (codeError.code === 'auth/email-already-in-use')
          setError('code', {
            message: t('authResumeExisting'),
          });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth" aria-labelledby="register-heading">
        <header className="auth__header">
          <span className="auth__symbol" aria-hidden="true">
            ✳
          </span>
          <h1 id="register-heading">{details ? t('verifyEmail') : t('register')}</h1>
          <p>{details ? t('registerDescription') : t('registerTitle')}</p>
        </header>
        {details ? (
          <form className="form-card" onSubmit={handleCodeSubmit(onVerify)} noValidate>
            {formError && <FormMessage>{formError}</FormMessage>}
            {success && <FormMessage kind="success">{success}</FormMessage>}
            <div className="form-field">
              <label htmlFor="verification-code">{t('verificationCode')}</label>
              <input
                id="verification-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                {...registerCode('code')}
                aria-invalid={Boolean(codeErrors.code)}
              />
              <span className="field-hint">{t('codeExpiresHint')}</span>
              {codeErrors.code && (
                <span className="field-error">
                  {translateValidationMessage(codeErrors.code.message ?? '')}
                </span>
              )}
            </div>
            <button className="button button--primary" type="submit" disabled={busy}>
              {busy ? t('confirm') : t('verifyAndCreate')}
            </button>
            <button
              className="button button--text"
              type="button"
              disabled={busy || cooldown > 0}
              onClick={() => void requestCode(details)}
            >
              {cooldown ? t('resendCodeIn', { seconds: cooldown }) : t('resendCode')}
            </button>
            <button
              className="button button--text"
              type="button"
              disabled={busy}
              onClick={() => {
                setDetails(null);
                setFormError('');
                setSuccess('');
              }}
            >
              {t('backEdit')}
            </button>
          </form>
        ) : (
          <form className="form-card" onSubmit={handleSubmit(onDetails)} noValidate>
            {formError && <FormMessage>{formError}</FormMessage>}
            <div className="form-field">
              <label htmlFor="register-name">{t('fullName')}</label>
              <input
                id="register-name"
                autoComplete="name"
                autoFocus
                {...register('name')}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <span className="field-error">
                  {translateValidationMessage(errors.name.message ?? '')}
                </span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="register-email">{t('email')}</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
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
              <label htmlFor="register-password">{t('password')}</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                aria-invalid={Boolean(errors.password)}
              />
              <span className="field-hint">{t('passwordHint')}</span>
              {errors.password && (
                <span className="field-error">
                  {translateValidationMessage(errors.password.message ?? '')}
                </span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="register-password-confirmation">{t('confirmPassword')}</label>
              <input
                id="register-password-confirmation"
                type="password"
                autoComplete="new-password"
                {...register('passwordConfirmation')}
                aria-invalid={Boolean(errors.passwordConfirmation)}
              />
              {errors.passwordConfirmation && (
                <span className="field-error">
                  {translateValidationMessage(errors.passwordConfirmation.message ?? '')}
                </span>
              )}
            </div>
            <button className="button button--primary" type="submit" disabled={busy}>
              {busy ? t('sendingCode') : t('continue')}
            </button>
          </form>
        )}
        <p className="auth-foot">
          {t('hasAccount')} <Link to="/login">{t('signIn')}</Link>
        </p>
      </section>
    </div>
  );
}

function ResumeRegistration() {
  const { t } = useTranslation();
  const api = useApi();
  const userService = useMemo(() => new UserService(api), [api]);
  const { user, loadProfile } = useSession();
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string; email: string }>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: user?.displayName ?? '', email: user?.email ?? '' },
  });
  const {
    register: registerCode,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors },
  } = useForm<{ code: string }>({ resolver: zodResolver(verificationCodeSchema) });

  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(values: { name: string; email: string }) {
    setBusy(true);
    setFormError('');
    setSuccess('');
    try {
      await userService.sendVerificationCode({ email: values.email });
      setDetails(values);
      setCooldown(60);
      setSuccess(t('emailCodeSentResume', { email: values.email }));
    } catch (error) {
      const retry = getRetryAfterSeconds(error);
      if (retry) setCooldown(retry);
      setFormError(extractAxiosErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function finish(values: { code: string }) {
    if (!details) return;
    setBusy(true);
    setFormError('');
    try {
      await completeProfile({ ...details, code: values.code }, userService);
      await loadProfile();
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(extractAxiosErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth" aria-labelledby="resume-heading">
        <header className="auth__header">
          <span className="auth__symbol" aria-hidden="true">
            ✳
          </span>
          <h1 id="resume-heading">{t('finishRegistration')}</h1>
          <p>{t('resumeDescription')}</p>
        </header>
        {details ? (
          <form className="form-card" onSubmit={handleCodeSubmit(finish)} noValidate>
            {formError && <FormMessage>{formError}</FormMessage>}
            {success && <FormMessage kind="success">{success}</FormMessage>}
            <div className="form-field">
              <label htmlFor="resume-code">{t('verificationCode')}</label>
              <input
                id="resume-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                {...registerCode('code')}
                aria-invalid={Boolean(codeErrors.code)}
              />
              <span className="field-hint">{t('codeSentHint')}</span>
              {codeErrors.code && (
                <span className="field-error">
                  {translateValidationMessage(codeErrors.code.message ?? '')}
                </span>
              )}
            </div>
            <button className="button button--primary" type="submit" disabled={busy}>
              {busy ? t('completing') : t('confirmCompleteRegistration')}
            </button>
            <button
              className="button button--text"
              type="button"
              disabled={busy || cooldown > 0}
              onClick={() => void requestCode(details)}
            >
              {cooldown ? t('resendCodeIn', { seconds: cooldown }) : t('resendCode')}
            </button>
            <button
              className="button button--text"
              type="button"
              disabled={busy}
              onClick={() => {
                setDetails(null);
                setSuccess('');
                setFormError('');
              }}
            >
              {t('editNameOrEmail')}
            </button>
          </form>
        ) : (
          <form className="form-card" onSubmit={handleSubmit(requestCode)} noValidate>
            {formError && <FormMessage>{formError}</FormMessage>}
            <div className="form-field">
              <label htmlFor="resume-name">{t('fullName')}</label>
              <input
                id="resume-name"
                autoComplete="name"
                {...register('name')}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <span className="field-error">
                  {translateValidationMessage(errors.name.message ?? '')}
                </span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="resume-email">{t('authenticatedEmail')}</label>
              <input
                id="resume-email"
                type="email"
                autoComplete="email"
                readOnly
                {...register('email')}
                aria-invalid={Boolean(errors.email)}
              />
              <span className="field-hint">{t('changeAccountHint')}</span>
              {errors.email && (
                <span className="field-error">
                  {translateValidationMessage(errors.email.message ?? '')}
                </span>
              )}
            </div>
            <button className="button button--primary" type="submit" disabled={busy}>
              {busy ? t('sendingCode') : t('sendVerificationCode')}
            </button>
          </form>
        )}
        <p className="auth-foot">
          {t('currentAccount', { email: user?.email ?? t('unknownEmail') })}
        </p>
      </section>
    </div>
  );
}
