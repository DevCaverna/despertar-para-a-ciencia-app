import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { FormMessage } from '@/components/FormMessage';
import { useSession } from '@/contexts/SessionContext';
import { createFirebaseAccount, completeProfile, loginWithPassword } from '@/services/auth.service';
import { getRetryAfterSeconds } from '@/services/api.service';
import { userService } from '@/services/user.service';
import { onboardingSchema, registerSchema, verificationCodeSchema, type RegisterValues } from '@/schemas/auth.schemas';
import { getErrorMessage } from '@/utils/auth-error';

interface AccountDetails { name: string; email: string; password?: string; }

export function RegisterPage() {
  const { user } = useSession();
  return user ? <ResumeRegistration key={user.uid} /> : <NewRegistration />;
}

function NewRegistration() {
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { loadProfile } = useSession();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const { register: registerCode, handleSubmit: handleCodeSubmit, setError, formState: { errors: codeErrors } } = useForm<{ code: string }>({ resolver: zodResolver(verificationCodeSchema) });

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
      setSuccess(`Enviamos um código de seis dígitos para ${account.email}. Ele expira em 10 minutos.`);
    } catch (error) {
      const retry = getRetryAfterSeconds(error);
      if (retry) setCooldown(retry);
      setFormError(getErrorMessage(error));
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
        if ((error as { code?: string }).code !== 'auth/email-already-in-use' || !details.password) throw error;
        await loginWithPassword(details.email, details.password);
      }
      await completeProfile({ name: details.name, email: details.email, code: values.code });
      await loadProfile();
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
      if (error && typeof error === 'object' && 'code' in error) {
        const codeError = error as { code?: string };
        if (codeError.code === 'auth/email-already-in-use') setError('code', { message: 'Esta conta já existe. Faça login com a senha desta conta para retomar o cadastro.' });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth" aria-labelledby="register-heading">
        <header className="auth__header">
          <span className="auth__symbol" aria-hidden="true">✳</span>
          <h1 id="register-heading">{details ? 'Confirme seu e-mail' : 'Criar conta'}</h1>
          <p>{details ? 'Use o código enviado para concluir seu cadastro.' : 'Junte-se à comunidade Despertar para a Ciência.'}</p>
        </header>
        {details ? (
          <form className="form-card" onSubmit={handleCodeSubmit(onVerify)} noValidate>
            {formError && <FormMessage>{formError}</FormMessage>}
            {success && <FormMessage kind="success">{success}</FormMessage>}
            <div className="form-field">
              <label htmlFor="verification-code">Código de verificação</label>
              <input id="verification-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" {...registerCode('code')} aria-invalid={Boolean(codeErrors.code)} />
              <span className="field-hint">O código tem seis dígitos e expira em 10 minutos.</span>
              {codeErrors.code && <span className="field-error">{codeErrors.code.message}</span>}
            </div>
            <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Confirmando…' : 'Verificar e criar conta'}</button>
            <button className="button button--text" type="button" disabled={busy || cooldown > 0} onClick={() => void requestCode(details)}>
              {cooldown ? `Solicitar novo código em ${cooldown}s` : 'Enviar novo código'}
            </button>
            <button className="button button--text" type="button" disabled={busy} onClick={() => { setDetails(null); setFormError(''); setSuccess(''); }}>Voltar e editar dados</button>
          </form>
        ) : (
          <form className="form-card" onSubmit={handleSubmit(onDetails)} noValidate>
            {formError && <FormMessage>{formError}</FormMessage>}
            <div className="form-field">
              <label htmlFor="register-name">Nome completo</label>
              <input id="register-name" autoComplete="name" autoFocus {...register('name')} aria-invalid={Boolean(errors.name)} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="register-email">E-mail</label>
              <input id="register-email" type="email" autoComplete="email" {...register('email')} aria-invalid={Boolean(errors.email)} />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="register-password">Senha</label>
              <input id="register-password" type="password" autoComplete="new-password" {...register('password')} aria-invalid={Boolean(errors.password)} />
              <span className="field-hint">Use pelo menos 8 caracteres.</span>
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="register-password-confirmation">Confirme sua senha</label>
              <input id="register-password-confirmation" type="password" autoComplete="new-password" {...register('passwordConfirmation')} aria-invalid={Boolean(errors.passwordConfirmation)} />
              {errors.passwordConfirmation && <span className="field-error">{errors.passwordConfirmation.message}</span>}
            </div>
            <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Enviando código…' : 'Continuar'}</button>
          </form>
        )}
        <p className="auth-foot">Já tem uma conta? <Link to="/login">Entre aqui</Link></p>
      </section>
    </div>
  );
}

function ResumeRegistration() {
  const { user, loadProfile } = useSession();
  const [details, setDetails] = useState<AccountDetails | null>(null);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<{ name: string; email: string }>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { name: user?.displayName ?? '', email: user?.email ?? '' },
  });
  const { register: registerCode, handleSubmit: handleCodeSubmit, formState: { errors: codeErrors } } = useForm<{ code: string }>({ resolver: zodResolver(verificationCodeSchema) });

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
      setSuccess(`Enviamos um código para ${values.email}. Ele expira em 10 minutos.`);
    } catch (error) {
      const retry = getRetryAfterSeconds(error);
      if (retry) setCooldown(retry);
      setFormError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function finish(values: { code: string }) {
    if (!details) return;
    setBusy(true);
    setFormError('');
    try {
      await completeProfile({ ...details, code: values.code });
      await loadProfile();
      navigate('/', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <section className="auth" aria-labelledby="resume-heading">
        <header className="auth__header">
          <span className="auth__symbol" aria-hidden="true">✳</span>
          <h1 id="resume-heading">Conclua seu cadastro</h1>
          <p>Sua conta de acesso existe, mas falta confirmar seu e-mail e criar o perfil. Não é necessário criar outra conta.</p>
        </header>
        {details ? (
          <form className="form-card" onSubmit={handleCodeSubmit(finish)} noValidate>
            {formError && <FormMessage>{formError}</FormMessage>}
            {success && <FormMessage kind="success">{success}</FormMessage>}
            <div className="form-field">
              <label htmlFor="resume-code">Código de verificação</label>
              <input id="resume-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} {...registerCode('code')} aria-invalid={Boolean(codeErrors.code)} />
              <span className="field-hint">Informe os seis dígitos enviados por e-mail.</span>
              {codeErrors.code && <span className="field-error">{codeErrors.code.message}</span>}
            </div>
            <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Concluindo…' : 'Confirmar e concluir cadastro'}</button>
            <button className="button button--text" type="button" disabled={busy || cooldown > 0} onClick={() => void requestCode(details)}>{cooldown ? `Solicitar novo código em ${cooldown}s` : 'Enviar novo código'}</button>
            <button className="button button--text" type="button" disabled={busy} onClick={() => { setDetails(null); setSuccess(''); setFormError(''); }}>Editar nome ou e-mail</button>
          </form>
        ) : (
          <form className="form-card" onSubmit={handleSubmit(requestCode)} noValidate>
            {formError && <FormMessage>{formError}</FormMessage>}
            <div className="form-field">
              <label htmlFor="resume-name">Nome completo</label>
              <input id="resume-name" autoComplete="name" {...register('name')} aria-invalid={Boolean(errors.name)} />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            <div className="form-field">
              <label htmlFor="resume-email">E-mail da conta autenticada</label>
              <input id="resume-email" type="email" autoComplete="email" readOnly {...register('email')} aria-invalid={Boolean(errors.email)} />
              <span className="field-hint">Para alterar a conta, saia e entre com o e-mail correto.</span>
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
            <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Enviando código…' : 'Enviar código de verificação'}</button>
          </form>
        )}
        <p className="auth-foot">A conta atual é {user?.email ?? 'desconhecida'}.</p>
      </section>
    </div>
  );
}
