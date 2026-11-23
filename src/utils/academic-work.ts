export function formatPublicationDate(value: string | null, locale?: string): string | null {
  if (!value) return null;
  if (/^\d{4}$/.test(value)) return value;
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    const date = new Date(`${value}-01T12:00:00Z`);
    return new Intl.DateTimeFormat(locale, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  }
  if (/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value)) {
    const date = new Date(`${value}T12:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value)
      return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(date);
  }
  return value;
}

export function safeAcademicUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}
