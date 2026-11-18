import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams, type To } from 'react-router';

import { useApi } from '@/hooks/useApi';
import type { PublishedPostDetail } from '@/models/post.model';
import { PostService } from '@/services/post.service';

const postIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const headingClass = 'scroll-mt-32 wrap-anywhere';

function getFeedDestination(state: unknown): To {
  const search = (state as { feedSearch?: unknown } | null)?.feedSearch;
  // The history state may supply a query, never a path or an external destination.
  return typeof search === 'string' && /^\?[^#\r\n]*$/.test(search)
    ? { pathname: '/', search }
    : '/';
}

function BackToFeed({ to }: { to: To }) {
  const { t } = useTranslation();
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-brand"
    >
      <span aria-hidden="true">←</span>
      {t('postBackToFeed')}
    </Link>
  );
}

export function PostDetailPage() {
  const { id } = useParams();
  const { state } = useLocation();

  return <PostReader key={id} id={id} backTo={getFeedDestination(state)} />;
}

type PostResult =
  | { status: 'loading' | 'unavailable' | 'error' }
  | { status: 'success'; post: PublishedPostDetail };

function PostReader({ id, backTo }: { id?: string; backTo: To }) {
  const { t, i18n } = useTranslation();
  const api = useApi();
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{ attempt: number; result: PostResult }>();
  const validId = id?.length === 36 && postIdPattern.test(id) ? id : undefined;
  const result: PostResult = !validId
    ? { status: 'unavailable' }
    : settled?.attempt === attempt
      ? settled.result
      : { status: 'loading' };
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();

    void new PostService(api).getPublished(validId, controller.signal).then(
      ({ data }) => {
        if (!controller.signal.aborted)
          setSettled({ attempt, result: { status: 'success', post: data } });
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        const status = isAxiosError(error) ? error.response?.status : undefined;
        setSettled({
          attempt,
          result: { status: status === 400 || status === 404 ? 'unavailable' : 'error' },
        });
      },
    );

    return () => controller.abort();
  }, [api, attempt, validId]);

  const title = result.status === 'success' ? result.post.title : t('postPageTitle');
  const documentTitle = `${title} — ${t('appName')}`;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = documentTitle;
    return () => {
      document.title = previousTitle;
    };
  }, [documentTitle]);

  const { status } = result;
  useEffect(() => {
    if (status !== 'loading') heading.current?.focus();
  }, [status]);

  return (
    <div className="mx-auto max-w-[75ch] px-4 pt-5 pb-10 sm:px-6 sm:pt-8 md:pb-16">
      <BackToFeed to={backTo} />
      {result.status === 'loading' && (
        <div className="mt-7 sm:mt-10">
          <p role="status" className="text-ink-secondary">
            {t('postLoading')}
          </p>
          <div aria-hidden="true" className="mt-5 grid gap-4 motion-safe:animate-pulse">
            <span className="h-9 w-4/5 rounded bg-canvas-alt" />
            <span className="h-4 w-2/5 rounded bg-canvas-alt" />
            <div className="mt-4 grid gap-3 border-t border-line pt-6">
              <span className="h-4 rounded bg-canvas-alt" />
              <span className="h-4 w-5/6 rounded bg-canvas-alt" />
            </div>
          </div>
        </div>
      )}
      {result.status === 'unavailable' && (
        <div className="mt-7 sm:mt-10">
          <h1 ref={heading} tabIndex={-1} className={`${headingClass} text-3xl sm:text-4xl`}>
            {t('postUnavailableTitle')}
          </h1>
          <p className="mt-4 text-ink-secondary">{t('postUnavailableMessage')}</p>
        </div>
      )}
      {result.status === 'error' && (
        <div className="mt-7 sm:mt-10">
          <h1 ref={heading} tabIndex={-1} className={`${headingClass} text-3xl sm:text-4xl`}>
            {t('postErrorTitle')}
          </h1>
          <p role="alert" className="mt-4 text-ink-secondary">
            {t('postErrorMessage')}
          </p>
          <button
            type="button"
            className="mt-5 min-h-11 cursor-pointer rounded-lg border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:border-brand"
            onClick={() => setAttempt((current) => current + 1)}
          >
            {t('tryAgain')}
          </button>
        </div>
      )}
      {result.status === 'success' && (
        <>
          <article className="mt-7 sm:mt-10">
            <header className="border-b border-line pb-6 sm:pb-8">
              <p className="mb-3 text-xs font-bold tracking-[0.12em] text-brand uppercase">
                {t('feedEyebrow')}
              </p>
              <h1
                ref={heading}
                tabIndex={-1}
                className={`${headingClass} text-[clamp(2rem,6vw,3.75rem)]`}
              >
                {result.post.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm wrap-anywhere text-ink-secondary">
                <p className="min-w-0">
                  {result.post.author
                    ? t('feedByAuthor', { name: result.post.author.name })
                    : t('feedUnknownAuthor')}
                </p>
                <time dateTime={result.post.publishedAt}>
                  {new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'long' }).format(
                    new Date(result.post.publishedAt),
                  )}
                </time>
              </div>
            </header>
            <p className="mt-6 text-base leading-relaxed wrap-anywhere whitespace-pre-wrap sm:mt-8 sm:text-lg">
              {result.post.content}
            </p>
          </article>
          <div className="mt-8 border-t border-line pt-3">
            <BackToFeed to={backTo} />
          </div>
        </>
      )}
    </div>
  );
}
