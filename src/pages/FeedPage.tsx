import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useSearchParams } from 'react-router';

import { PostCard } from '@/components/posts/PostCard';
import { useApi } from '@/hooks/useApi';
import type { PublishedPost, PublishedPostPage } from '@/models/post.model';
import { PostService } from '@/services/post.service';

const PER_PAGE = 20;
const MAX_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / PER_PAGE) + 1;
const controlClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-3 py-2 text-center text-sm font-semibold text-ink hover:border-brand hover:text-ink hover:no-underline';

function searchForPage(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  if (page === 1) next.delete('page');
  else next.set('page', String(page));
  return next;
}

export function FeedPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const pages = params.getAll('page');
  const rawPage = pages[0];
  const parsed = Number(rawPage);
  const page = pages.length === 1 && /^[1-9]\d*$/.test(rawPage) && parsed <= MAX_PAGE ? parsed : 1;
  const normalize = pages.length > 0 && page === 1;
  const heading = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(page);

  useEffect(() => {
    if (normalize) setParams(searchForPage(params, 1), { replace: true });
  }, [normalize, params, setParams]);

  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [page]);

  return (
    <div className="mx-auto w-[calc(100%_-_3rem)] max-w-[1400px] py-10 max-[720px]:w-[calc(100%_-_2rem)] md:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-line pb-7 sm:pb-9">
          <p className="mb-3 text-xs font-bold tracking-[0.12em] text-brand uppercase">
            {t('feedEyebrow')}
          </p>
          <h1 className="text-[clamp(2.4rem,7vw,4.5rem)]">{t('feedTitle')}</h1>
          <p className="mt-4 max-w-prose text-base text-ink-secondary sm:text-lg">
            {t('feedIntro')}
          </p>
        </header>
        <section className="mt-6 sm:mt-8" aria-labelledby="feed-heading">
          <h2 id="feed-heading" ref={heading} tabIndex={-1} className="mb-5 scroll-mt-40 text-2xl">
            {t('feedListTitle')}
          </h2>
          <FeedResults key={page} page={page} params={params} />
        </section>
      </div>
    </div>
  );
}

type FeedResult = { status: 'error' } | { status: 'success'; data: PublishedPostPage };

function FeedResults({ page, params }: { page: number; params: URLSearchParams }) {
  const { t, i18n } = useTranslation();
  const api = useApi();
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{ attempt: number; result: FeedResult }>();
  const state = settled?.attempt === attempt ? settled.result : { status: 'loading' as const };
  const locale = i18n.resolvedLanguage;

  useEffect(() => {
    const controller = new AbortController();

    void new PostService(api).listPublished(page, PER_PAGE, controller.signal).then(
      ({ data }) => {
        if (!controller.signal.aborted)
          setSettled({ attempt, result: { status: 'success', data } });
      },
      () => {
        if (!controller.signal.aborted) setSettled({ attempt, result: { status: 'error' } });
      },
    );

    return () => controller.abort();
  }, [api, attempt, page]);

  const pageLabel = t('feedPage', { page: new Intl.NumberFormat(locale).format(page) });
  const empty = state.status === 'success' && state.data.items.length === 0;
  const statusMessage =
    state.status === 'loading'
      ? t('feedLoading')
      : empty
        ? t(page === 1 ? 'feedEmpty' : 'feedEmptyPage')
        : state.status === 'success'
          ? t('feedPageLoaded', { page: pageLabel })
          : '';
  const statusVisible = state.status === 'loading' || empty;
  const goTo = (destination: number) => ({ search: searchForPage(params, destination).toString() });
  const panelClass = 'rounded-xl border border-line bg-surface p-5 sm:p-6';

  return (
    <>
      <div className={empty ? panelClass : undefined}>
        <p role="status" className={statusVisible ? 'text-ink-secondary' : 'sr-only'}>
          {statusMessage}
        </p>
        {empty && page > 1 && (
          <Link className={`${controlClass} mt-4`} to={goTo(1)}>
            {t('feedFirstPage')}
          </Link>
        )}
      </div>

      {state.status === 'loading' && (
        <div className="mt-4 grid gap-3 motion-safe:animate-pulse" aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <div key={item} className={`${panelClass} grid gap-3`}>
              <span className="h-3 w-1/4 rounded bg-canvas-alt" />
              <span className="h-5 w-3/4 rounded bg-canvas-alt" />
              <span className="h-3 w-2/5 rounded bg-canvas-alt" />
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className={panelClass}>
          <p role="alert" className="font-medium text-ink">
            {t('feedError')}
          </p>
          <button
            className={`${controlClass} mt-4 cursor-pointer`}
            type="button"
            onClick={() => setAttempt((current) => current + 1)}
          >
            {t('tryAgain')}
          </button>
        </div>
      )}

      {state.status === 'success' && !empty && (
        <PostList items={state.data.items} locale={locale} />
      )}

      {state.status === 'success' && (!empty || page > 1) && (
        <nav
          aria-label={t('feedPagination')}
          className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4"
        >
          {page > 1 ? (
            <Link className={controlClass} to={goTo(page - 1)}>
              {t('feedPrevious')}
            </Link>
          ) : (
            <button className={`${controlClass} opacity-60`} type="button" disabled>
              {t('feedPrevious')}
            </button>
          )}
          <span aria-current="page" className="text-sm font-medium text-ink-secondary">
            {pageLabel}
          </span>
          {state.data.hasNextPage && page < MAX_PAGE ? (
            <Link className={controlClass} to={goTo(page + 1)}>
              {t('feedNext')}
            </Link>
          ) : (
            <button className={`${controlClass} opacity-60`} type="button" disabled>
              {t('feedNext')}
            </button>
          )}
        </nav>
      )}
    </>
  );
}

function PostList({ items, locale }: { items: PublishedPost[]; locale?: string }) {
  const { search } = useLocation();
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'long' });
  const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const groups: { month: string; posts: PublishedPost[] }[] = [];

  for (const post of items) {
    const month = monthFormat.format(new Date(post.publishedAt));
    const last = groups.at(-1);
    if (last?.month === month) last.posts.push(post);
    else groups.push({ month, posts: [post] });
  }

  return (
    <div className="grid gap-6">
      {groups.map(({ month, posts }) => (
        <div key={posts[0].id}>
          <p className="mb-3 border-b border-line pb-2 text-sm font-semibold text-ink-secondary">
            {month}
          </p>
          <ul className="grid gap-3" role="list">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} dateFormat={dateFormat} feedSearch={search} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
