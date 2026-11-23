import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router';

import { useApi } from '@/hooks/useApi';
import type { AcademicWork } from '@/models/academic-work.model';
import { AcademicWorkService } from '@/services/academic-work.service';
import { formatPublicationDate, safeAcademicUrl } from '@/utils/academic-work';

const uuidV7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function AcademicWorkDetailPage() {
  const { id } = useParams();
  return <AcademicWorkReader key={id} id={id} />;
}

function AcademicWorkReader({ id }: { id?: string }) {
  const { t, i18n } = useTranslation();
  const { state } = useLocation();
  const page = (state as { page?: unknown } | null)?.page;
  const back =
    typeof page === 'number' && Number.isSafeInteger(page) && page > 1
      ? `/academic-works?page=${page}`
      : '/academic-works';
  const api = useApi();
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<{
    attempt: number;
    work?: AcademicWork;
    error?: 'unavailable' | 'error';
  }>();
  const validId = id && uuidV7.test(id) ? id : null;
  const current = settled?.attempt === attempt ? settled : undefined;
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();
    void new AcademicWorkService(api).get(validId, controller.signal).then(
      ({ data }) => {
        if (!controller.signal.aborted) setSettled({ attempt, work: data });
      },
      (error: unknown) => {
        if (!controller.signal.aborted)
          setSettled({
            attempt,
            error: isAxiosError(error) && error.response?.status === 404 ? 'unavailable' : 'error',
          });
      },
    );
    return () => controller.abort();
  }, [api, attempt, validId]);

  const work = current?.work;
  const status = !validId ? 'unavailable' : (current?.error ?? (work ? 'success' : 'loading'));
  const date = work ? formatPublicationDate(work.publicationDate, i18n.resolvedLanguage) : null;
  const externalUrl = work ? safeAcademicUrl(work.url) : null;
  const title = work?.title ?? t('academicWorkPageTitle');

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} — ${t('appName')}`;
    return () => {
      document.title = previous;
    };
  }, [t, title]);
  useEffect(() => {
    if (status !== 'loading') heading.current?.focus();
  }, [status]);

  return (
    <div className="mx-auto max-w-[75ch] px-4 pt-5 pb-10 sm:px-6 sm:pt-8 md:pb-16">
      <Link
        to={back}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <span aria-hidden="true">←</span>
        {t('academicWorkBack')}
      </Link>
      {status === 'loading' && (
        <div className="mt-7 sm:mt-10" role="status">
          <p className="text-ink-secondary">{t('academicWorkLoading')}</p>
          <div aria-hidden="true" className="mt-5 grid gap-4 motion-safe:animate-pulse">
            <span className="h-9 w-4/5 rounded bg-canvas-alt" />
            <span className="h-4 w-2/5 rounded bg-canvas-alt" />
            <span className="mt-4 h-4 rounded bg-canvas-alt" />
          </div>
        </div>
      )}
      {status === 'unavailable' && (
        <div className="mt-7 sm:mt-10">
          <h1 ref={heading} tabIndex={-1} className="text-3xl sm:text-4xl">
            {t('academicWorkUnavailable')}
          </h1>
          <p className="mt-4 text-ink-secondary">{t('academicWorkUnavailableMessage')}</p>
        </div>
      )}
      {status === 'error' && (
        <div className="mt-7 sm:mt-10">
          <h1 ref={heading} tabIndex={-1} className="text-3xl sm:text-4xl">
            {t('academicWorkError')}
          </h1>
          <button
            type="button"
            className="button button--secondary mt-5"
            onClick={() => setAttempt((value) => value + 1)}
          >
            {t('tryAgain')}
          </button>
        </div>
      )}
      {work && (
        <article className="mt-7 sm:mt-10">
          <header className="border-b border-line pb-6 sm:pb-8">
            <p className="mb-3 text-xs font-bold tracking-[0.12em] text-brand uppercase">
              {t('academicWorksEyebrow')}
            </p>
            <h1
              ref={heading}
              tabIndex={-1}
              className="wrap-anywhere text-[clamp(2rem,6vw,3.75rem)]"
            >
              {work.title}
            </h1>
            <p className="mt-5 wrap-anywhere text-sm text-ink-secondary">
              {work.authors.length ? work.authors.join(', ') : t('academicWorkNoAuthors')}
            </p>
            <p className="mt-2 text-sm text-ink-secondary">
              {work.source.name}
              {date ? ` · ${date}` : ''}
            </p>
            {work.journal && work.journal !== work.source.name && (
              <p className="mt-1 text-sm text-ink-secondary">{work.journal}</p>
            )}
          </header>
          <section className="mt-6 sm:mt-8" aria-labelledby="abstract-heading">
            <h2 id="abstract-heading" className="text-2xl">
              {t('academicWorkAbstract')}
            </h2>
            <p className="mt-3 leading-relaxed wrap-anywhere whitespace-pre-wrap text-ink-secondary">
              {work.abstract || t('academicWorkNoAbstract')}
            </p>
          </section>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-line pt-5 text-sm">
            <a
              href={`https://doi.org/${work.doi.split('/').map(encodeURIComponent).join('/')}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('academicWorkOpenDoi')}
            </a>
            {externalUrl && (
              <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                {t('academicWorkOpenSource')}
              </a>
            )}
          </div>
          <div className="mt-8 rounded-xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="text-xl">{t('academicWorkSelectTitle')}</h2>
            <p className="mt-2 text-sm text-ink-secondary">
              {work.abstract
                ? t('academicWorkSelectIntro')
                : t('academicWorkSelectionRequiresAbstract')}
            </p>
            {work.abstract && (
              <Link
                className="button button--primary mt-5"
                to={`/academic-works/${encodeURIComponent(work.id)}/generate`}
              >
                {t('academicWorkSelect')}
              </Link>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
