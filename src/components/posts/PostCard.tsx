import { useTranslation } from 'react-i18next';

import type { PublishedPost } from '@/models/post.model';

export function PostCard({
  post,
  dateFormat,
}: {
  post: PublishedPost;
  dateFormat: Intl.DateTimeFormat;
}) {
  const { t } = useTranslation();

  return (
    <article className="rounded-xl border border-line border-l-4 border-l-brand bg-surface px-4 py-5 sm:px-6">
      <time dateTime={post.publishedAt} className="text-sm text-ink-secondary">
        {dateFormat.format(new Date(post.publishedAt))}
      </time>
      <h3 className="mt-2 text-xl font-semibold wrap-anywhere sm:text-2xl">{post.title}</h3>
      <p className="mt-3 text-sm wrap-anywhere text-ink-secondary">
        {post.author ? t('feedByAuthor', { name: post.author.name }) : t('feedUnknownAuthor')}
      </p>
    </article>
  );
}
