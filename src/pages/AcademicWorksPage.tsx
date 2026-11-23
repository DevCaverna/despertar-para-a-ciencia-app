import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { useApi } from '@/hooks/useApi';
import type { AcademicWorkPage } from '@/models/academic-work.model';
import { AcademicWorkService } from '@/services/academic-work.service';
import { formatPublicationDate } from '@/utils/academic-work';

const PER_PAGE = 20;
const MAX_PAGE = Math.floor(Number.MAX_SAFE_INTEGER / PER_PAGE) + 1;
const panelClass = 'rounded-xl border border-line bg-surface p-5 sm:p-6';
const controlClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-ink hover:border-brand hover:no-underline';

function searchForPage(page: number) {
  return page === 1 ? '/academic-works' : `/academic-works?page=${page}`;
}

export function AcademicWorksPage() {
  const { t, i18n } = useTranslation();
  const [params, setParams] = useSearchParams();
  const api = useApi();
  const values = params.getAll('page');
  const rawPage = values[0];
  const parsed = Number(rawPage);
  const page = values.length === 1 && /^[1-9]\d*$/.test(rawPage) && parsed <= MAX_PAGE ? parsed : 1;
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{
    page: number;
    attempt: number;
    data?: AcademicWorkPage;
    error?: true;
  }>();
  const heading = useRef<HTMLHeadingElement>(null);
  const previousPage = useRef(page);
  const current = settled?.page === page && settled.attempt === attempt ? settled : undefined;

  useEffect(() => {
    if (values.length > 0 && page === 1) setParams({}, { replace: true });
  }, [page, setParams, values.length]);

  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    heading.current?.focus({ preventScroll: true });
    heading.current?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [page]);

  useEffect(() => {
    const controller = new AbortController();
    void new AcademicWorkService(api).list(page, PER_PAGE, controller.signal).then(
      ({ data }) => {
        if (!controller.signal.aborted) setSettled({ page, attempt, data });
      },
      () => {
        if (!controller.signal.aborted) setSettled({ page, attempt, error: true });
      },
    );
    return () => controller.abort();
  }, [api, attempt, page]);

  const empty = current?.data?.items.length === 0;
  const pageLabel = t('academicWorksPage', {
    page: new Intl.NumberFormat(i18n.resolvedLanguage).format(page),
  });

  return (
    <div className="mx-auto w-[calc(100%_-_3rem)] max-w-[1400px] py-10 max-[720px]:w-[calc(100%_-_2rem)] md:py-16">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-line pb-7 sm:pb-9">
          <p className="mb-3 text-xs font-bold tracking-[0.12em] text-brand uppercase">
            {t('academicWorksEyebrow')}
          </p>
          <h1 className="text-[clamp(2.4rem,7vw,4.5rem)]">{t('academicWorksTitle')}</h1>
          <p className="mt-4 max-w-prose text-base text-ink-secondary sm:text-lg">
            {t('academicWorksIntro')}
          </p>
        </header>
        <section className="mt-6 sm:mt-8" aria-labelledby="academic-works-heading">
          <h2
            id="academic-works-heading"
            ref={heading}
            tabIndex={-1}
            className="mb-5 scroll-mt-40 text-2xl"
          >
            {t('academicWorksListTitle')}
          </h2>
          {!current && (
            <div
              role="status"
              aria-label={t('academicWorksLoading')}
              className="grid gap-3 motion-safe:animate-pulse"
            >
              {[0, 1, 2].map((item) => (
                <div key={item} aria-hidden="true" className={`${panelClass} grid gap-3`}>
                  <span className="h-3 w-1/4 rounded bg-canvas-alt" />
                  <span className="h-5 w-3/4 rounded bg-canvas-alt" />
                  <span className="h-3 w-2/5 rounded bg-canvas-alt" />
                </div>
              ))}
            </div>
          )}
          {current?.error && (
            <div className={panelClass}>
              <p role="alert">{t('academicWorksError')}</p>
              <button
                type="button"
                className={`${controlClass} mt-4 cursor-pointer`}
                onClick={() => setAttempt((value) => value + 1)}
              >
                {t('tryAgain')}
              </button>
            </div>
          )}
          {empty && (
            <div className={panelClass}>
              <p role="status" className="text-ink-secondary">
                {t(page === 1 ? 'academicWorksEmpty' : 'academicWorksEmptyPage')}
              </p>
              {page > 1 && (
                <Link className={`${controlClass} mt-4`} to={searchForPage(1)}>
                  {t('academicWorksFirstPage')}
                </Link>
              )}
            </div>
          )}
          {current?.data && !empty && (
            <ul className="grid gap-3" role="list">
              {current.data.items.map((work) => {
                const date = formatPublicationDate(work.publicationDate, i18n.resolvedLanguage);
                return (
                  <li key={work.id}>
                    <article>
                      <Link
                        to={`/academic-works/${encodeURIComponent(work.id)}`}
                        state={{ page }}
                        className="group block rounded-xl border border-line border-l-4 border-l-brand bg-surface px-4 py-5 text-ink no-underline hover:border-brand hover:text-ink hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:px-6"
                      >
                        <p className="text-sm text-ink-secondary">
                          {work.source.name}
                          {date ? ` · ${date}` : ''}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold wrap-anywhere group-hover:underline group-focus-visible:underline sm:text-2xl">
                          {work.title}
                        </h3>
                        <p className="mt-3 text-sm wrap-anywhere text-ink-secondary">
                          {work.authors.length
                            ? work.authors.join(', ')
                            : t('academicWorkNoAuthors')}
                        </p>
                        <p className="mt-1 text-xs wrap-anywhere text-ink-muted">
                          {t('academicWorkDoi', { doi: work.doi })}
                        </p>
                        {work.abstract && (
                          <p className="mt-3 line-clamp-3 text-sm wrap-anywhere text-ink-secondary">
                            {work.abstract}
                          </p>
                        )}
                      </Link>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
          {current?.data && (!empty || page > 1) && (
            <nav
              aria-label={t('academicWorksPagination')}
              className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4"
            >
              {page > 1 ? (
                <Link className={controlClass} to={searchForPage(page - 1)}>
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
              {current.data.hasNextPage && page < MAX_PAGE ? (
                <Link className={controlClass} to={searchForPage(page + 1)}>
                  {t('feedNext')}
                </Link>
              ) : (
                <button className={`${controlClass} opacity-60`} type="button" disabled>
                  {t('feedNext')}
                </button>
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
