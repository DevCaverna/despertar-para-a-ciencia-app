import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { PublishedPost } from '@/models/post.model';

export function PostCard({
  post,
  dateFormat,
  feedSearch,
}: {
  post: PublishedPost;
  dateFormat: Intl.DateTimeFormat;
  feedSearch: string;
}) {
  const { t } = useTranslation();
  const titleId = useId();

  return (
    <article>
      <Link
        to={`/posts/${encodeURIComponent(post.id)}`}
        state={{ feedSearch }}
        aria-labelledby={titleId}
        className="group block rounded-xl border border-line border-l-4 border-l-brand bg-surface px-4 py-5 text-ink no-underline hover:border-brand hover:text-ink hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:px-6"
      >
        <time dateTime={post.publishedAt} className="text-sm text-ink-secondary">
          {dateFormat.format(new Date(post.publishedAt))}
        </time>
        <h3
          id={titleId}
          className="mt-2 text-xl font-semibold wrap-anywhere group-hover:underline group-focus-visible:underline sm:text-2xl"
        >
          {post.title}
        </h3>
        <p className="mt-3 text-sm wrap-anywhere text-ink-secondary">
          {post.author ? t('feedByAuthor', { name: post.author.name }) : t('feedUnknownAuthor')}
        </p>
      </Link>
    </article>
  );
}
