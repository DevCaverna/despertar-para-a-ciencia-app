import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';

import { FormMessage } from '@/components/FormMessage';
import { LoadingState } from '@/components/LoadingState';
import { useApi } from '@/hooks/useApi';
import { draftSchema, type DraftValues } from '@/schemas/post.schemas';
import { PostService } from '@/services/post.service';
import { extractAxiosErrorMessage } from '@/utils/extract-axios-error-message.util';
import { translateValidationMessage } from '@/utils/validation-message';

export function DraftEditorPage() {
  const { id } = useParams();
  return <DraftEditorForm key={id ?? 'new'} id={id} />;
}

function DraftEditorForm({ id }: { id: string | undefined }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const api = useApi();
  const posts = useMemo(() => new PostService(api), [api]);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DraftValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: { title: '', content: '' },
  });

  useEffect(() => {
    if (!id) return;
    let active = true;
    posts
      .getDraft(id)
      .then(({ data }) => {
        if (active) reset({ title: data.title, content: data.content });
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(extractAxiosErrorMessage(reason, 'draft'));
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, posts, reset]);

  async function save(values: DraftValues) {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      if (id) {
        const { data } = await posts.updateDraft(id, values);
        reset({ title: data.title, content: data.content });
        setSuccess(t('draftSaved'));
      } else {
        const { data } = await posts.createDraft(values);
        navigate(`/drafts/${data.id}/edit`, { replace: true });
      }
    } catch (reason) {
      setError(extractAxiosErrorMessage(reason, 'draft'));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingState label={t('loadingDraft')} />;

  return (
    <section
      className="mx-auto w-[calc(100%_-_3rem)] max-w-3xl py-12 max-[720px]:w-[calc(100%_-_2rem)]"
      aria-labelledby="draft-editor-heading"
    >
      <Link className="mb-6 inline-block text-sm" to="/drafts">
        {t('backToDrafts')}
      </Link>
      <h1 id="draft-editor-heading" className="mb-2 font-editorial text-3xl">
        {t(id ? 'editDraft' : 'createDraft')}
      </h1>
      <p className="mb-8 text-ink-secondary">{t('draftEditorDescription')}</p>
      {error && <FormMessage>{error}</FormMessage>}
      {success && <FormMessage kind="success">{success}</FormMessage>}
      {!loadFailed && (
        <form
          className="mt-4 grid gap-5 rounded-xl border border-line bg-surface p-6"
          onSubmit={handleSubmit(save)}
          noValidate
        >
          <div className="form-field">
            <label htmlFor="draft-title">{t('draftTitle')}</label>
            <input
              id="draft-title"
              {...register('title')}
              readOnly={busy}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && (
              <span className="field-error" role="alert">
                {translateValidationMessage(errors.title.message ?? '')}
              </span>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="draft-content">{t('draftContent')}</label>
            <textarea
              id="draft-content"
              rows={14}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-brand"
              {...register('content')}
              readOnly={busy}
              aria-invalid={Boolean(errors.content)}
            />
            {errors.content && (
              <span className="field-error" role="alert">
                {translateValidationMessage(errors.content.message ?? '')}
              </span>
            )}
          </div>
          <div>
            <button className="button button--primary" type="submit" disabled={busy}>
              {busy ? t('savingDraft') : t('saveDraft')}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
