import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { useApi } from '@/hooks/useApi';
import type { AcademicWork } from '@/models/academic-work.model';
import { AcademicWorkService } from '@/services/academic-work.service';

const uuidV7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function AcademicWorkGenerationPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const api = useApi();
  const [work, setWork] = useState<AcademicWork | null>(null);
  const [error, setError] = useState(false);
  const validId = id && uuidV7.test(id) ? id : null;

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();
    void new AcademicWorkService(api).get(validId, controller.signal).then(
      ({ data }) => {
        if (!controller.signal.aborted) setWork(data);
      },
      () => {
        if (!controller.signal.aborted) setError(true);
      },
    );
    return () => controller.abort();
  }, [api, validId]);

  return (
    <div className="mx-auto max-w-[75ch] px-4 pt-5 pb-10 sm:px-6 sm:pt-8 md:pb-16">
      <Link
        to={validId ? `/academic-works/${validId}` : '/academic-works'}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand hover:underline"
      >
        <span aria-hidden="true">←</span>
        {t('academicWorkBackToDetail')}
      </Link>
      {!validId && <h1 className="mt-7 text-3xl">{t('academicWorkUnavailable')}</h1>}
      {validId && !work && !error && (
        <p role="status" className="mt-7 text-ink-secondary">
          {t('academicWorkLoading')}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-7 text-ink-secondary">
          {t('academicWorkError')}
        </p>
      )}
      {work && (
        <section className="mt-7 sm:mt-10">
          <p className="mb-3 text-xs font-bold tracking-[0.12em] text-brand uppercase">
            {t('academicWorksEyebrow')}
          </p>
          <h1 className="text-[clamp(2rem,6vw,3.75rem)]">{t('academicWorkSelectedTitle')}</h1>
          <p className="mt-4 text-ink-secondary">{t('academicWorkSelectedIntro')}</p>
          <div className="mt-7 rounded-xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="wrap-anywhere text-xl">{work.title}</h2>
            <p className="mt-2 text-sm text-ink-secondary">{work.source.name}</p>
            <p className="mt-4 text-sm leading-relaxed wrap-anywhere text-ink-secondary">
              {work.abstract || t('academicWorkNoAbstract')}
            </p>
          </div>
          <p className="mt-6 text-sm text-ink-secondary">
            {t('academicWorkGenerationUnavailable')}
          </p>
        </section>
      )}
    </div>
  );
}
