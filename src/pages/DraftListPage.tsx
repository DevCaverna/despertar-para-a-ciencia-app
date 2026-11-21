import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { FormMessage } from '@/components/FormMessage';
import { LoadingState } from '@/components/LoadingState';
import { useApi } from '@/hooks/useApi';
import type { DraftPost } from '@/models/post.model';
import { PostService } from '@/services/post.service';
import { extractAxiosErrorMessage } from '@/utils/extract-axios-error-message.util';

const PER_PAGE = 20;

export function DraftListPage() {
  const [params] = useSearchParams();
  const requestedPage = Number(params.get('page'));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  return <DraftPage key={page} page={page} />;
}

function DraftPage({ page }: { page: number }) {
  const { t } = useTranslation();
  const api = useApi();
  const posts = useMemo(() => new PostService(api), [api]);
  const [drafts, setDrafts] = useState<DraftPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    posts
      .listDrafts(page, PER_PAGE)
      .then(({ data }) => {
        if (active) setDrafts(data);
      })
      .catch((reason: unknown) => {
        if (active) setError(extractAxiosErrorMessage(reason, 'draft'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, posts]);

  if (loading) return <LoadingState label={t('loadingDrafts')} />;

  return (
    <section
      className="mx-auto w-[calc(100%_-_3rem)] max-w-4xl py-12 max-[720px]:w-[calc(100%_-_2rem)]"
      aria-labelledby="drafts-heading"
    >
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 id="drafts-heading" className="font-editorial text-3xl">
            {t('myDrafts')}
          </h1>
          <p className="mt-2 text-ink-secondary">{t('myDraftsDescription')}</p>
        </div>
        <Link className="button button--primary" to="/drafts/new">
          {t('createDraft')}
        </Link>
      </div>
      {error && <FormMessage>{error}</FormMessage>}
      {!error && drafts.length === 0 && (
        <p className="text-ink-secondary">{t(page === 1 ? 'noDrafts' : 'draftsEmptyPage')}</p>
      )}
      <div className="grid gap-3">
        {drafts.map((draft) => (
          <Link
            key={draft.id}
            to={`/drafts/${draft.id}/edit`}
            className="rounded-xl border border-line bg-surface p-5 hover:border-brand hover:no-underline"
          >
            <h2 className="font-editorial text-xl text-ink">{draft.title}</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              {t('draftUpdatedAt', {
                date: new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
                  new Date(draft.updatedAt),
                ),
              })}
            </p>
          </Link>
        ))}
      </div>
      {(page > 1 || drafts.length === PER_PAGE) && (
        <nav aria-label={t('draftsPagination')} className="mt-6 flex items-center gap-4">
          {page > 1 && (
            <Link to={page === 2 ? '/drafts' : `?page=${page - 1}`}>{t('feedPrevious')}</Link>
          )}
          <span>{t('feedPage', { page })}</span>
          {drafts.length === PER_PAGE && <Link to={`?page=${page + 1}`}>{t('feedNext')}</Link>}
        </nav>
      )}
    </section>
  );
}
